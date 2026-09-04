"""
delay_prediction_module.py
--------------------------
Production Cox Proportional Hazards (CoxPH) Survival Analysis model for MPLADS
project completion and overdue risk prediction.

Formulation:
- Event: Project completion (is_completed = 1)
- Right Censoring: Ongoing / in-progress projects (is_completed = 0)
- Time: Duration in days from sanction date to completion (or current analysis cutoff)
- Covariates:
  * log_sanction: log10(sanction_amount + 1)
  * approval_delay_days: delay in initial approval/recommendation
  * work_category: one-hot encoded work sector (Roads, Drinking Water, Education, etc.)

Outputs:
- Overdue Probability: S(t=deadline) - probability project is NOT completed by deadline
- Estimated Median Completion Time: t where S(t) = 0.50
- Hazard Ratio / Relative Acceleration factor
- Survival Curve trajectory (timeline of completion likelihoods)
"""

import os
import joblib
import numpy as np
import pandas as pd
import duckdb
from lifelines import CoxPHFitter

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "parliament_data.duckdb")
DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "models")
MODEL_FILE_PATH = os.path.join(DEFAULT_MODEL_DIR, "delay_survival_model.joblib")


class MPLADSSurvivalDelayModel:
    def __init__(self, penalizer: float = 0.1):
        self.penalizer = penalizer
        self.cph = CoxPHFitter(penalizer=penalizer)
        self.feature_columns = []
        self.categories_ = []
        self.baseline_survival_ = None
        self.is_fitted = False

    def fetch_training_data(self, db_path: str = DEFAULT_DB_PATH, sample_limit: int = 35000) -> pd.DataFrame:
        """Fetches clean project records with duration and completion status from DuckDB."""
        con = duckdb.connect(db_path, read_only=True)
        query = f"""
        SELECT 
            project_id,
            is_completed AS event_observed,
            CASE 
                WHEN is_completed = 1 AND completion_duration_days > 0 THEN completion_duration_days
                ELSE GREATEST(datediff('day', CAST(sanction_date AS DATE), CAST('2026-09-01' AS DATE)), 1)
            END AS duration_days,
            sanction_amount,
            COALESCE(delay_days_filled, 0) AS approval_delay_days,
            COALESCE(work_category, 'Other') AS work_category
        FROM project_investigations
        WHERE sanction_date IS NOT NULL 
          AND sanction_amount > 0
          AND (completion_duration_days IS NULL OR completion_duration_days >= 0)
        ORDER BY RANDOM()
        LIMIT {sample_limit}
        """
        df = con.execute(query).fetchdf()
        con.close()
        return df

    def prepare_features(self, df: pd.DataFrame, fit_encoder: bool = False) -> pd.DataFrame:
        """Transforms raw project variables into model-ready features."""
        feat_df = pd.DataFrame(index=df.index)
        
        # Duration & event if present
        if 'duration_days' in df.columns:
            feat_df['duration_days'] = df['duration_days'].clip(lower=1, upper=2500)
        if 'event_observed' in df.columns:
            feat_df['event_observed'] = df['event_observed'].astype(int)

        # Covariates
        feat_df['log_sanction'] = np.log10(np.maximum(df['sanction_amount'].values, 100.0))
        feat_df['approval_delay_days'] = np.maximum(df['approval_delay_days'].values, 0.0)

        # Work category one-hot encoding
        if fit_encoder:
            cat_series = df['work_category'].fillna('Other').astype(str)
            top_cats = cat_series.value_counts().head(8).index.tolist()
            self.categories_ = top_cats
        
        for cat in self.categories_:
            col_name = f"cat_{cat.replace(' ', '_').replace('/', '_')}"
            feat_df[col_name] = (df['work_category'] == cat).astype(int)

        return feat_df

    def fit(self, df: pd.DataFrame):
        """Fits the CoxPHFitter model."""
        feat_df = self.prepare_features(df, fit_encoder=True)
        self.feature_columns = [c for c in feat_df.columns if c not in ('duration_days', 'event_observed')]
        
        # Fit Cox model
        self.cph.fit(
            feat_df,
            duration_col='duration_days',
            event_col='event_observed',
            show_progress=False
        )
        self.baseline_survival_ = self.cph.baseline_survival_
        self.is_fitted = True
        return self

    def predict_project_risk(
        self,
        sanction_amount: float,
        approval_delay_days: float = 0.0,
        work_category: str = 'Roads',
        deadline_days: int = 365,
        elapsed_days: int = 0
    ) -> dict:
        """
        Calculates overdue risk probability, estimated median completion horizon,
        and timeline survival curve for a specific project profile.
        """
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Please fit or load a pre-trained model.")

        # Build single row dataframe
        input_data = pd.DataFrame([{
            'sanction_amount': float(sanction_amount),
            'approval_delay_days': float(approval_delay_days),
            'work_category': str(work_category)
        }])

        features = self.prepare_features(input_data, fit_encoder=False)
        covariates = features[self.feature_columns]

        # Partial hazard ratio (relative risk of completing per unit time)
        # partial_hazard > 1 means faster completion, < 1 means slower completion
        partial_hazard = float(self.cph.predict_partial_hazard(covariates).iloc[0])

        # Predict survival function S(t) = P(Duration > t)
        surv_func = self.cph.predict_survival_function(covariates)
        times = surv_func.index.values
        probs = surv_func.iloc[:, 0].values

        # Conditional survival given project already took elapsed_days
        # S(t | T > elapsed) = S(t) / S(elapsed)
        s_elapsed = 1.0
        if elapsed_days > 0:
            idx_elapsed = np.searchsorted(times, elapsed_days)
            if idx_elapsed < len(probs):
                s_elapsed = max(float(probs[idx_elapsed]), 1e-4)

        # Overdue probability at deadline
        idx_deadline = np.searchsorted(times, deadline_days)
        if idx_deadline < len(probs):
            s_raw = float(probs[idx_deadline])
        else:
            s_raw = float(probs[-1])

        # Conditional probability that project exceeds deadline
        overdue_probability = float(np.clip(s_raw / s_elapsed, 0.01, 0.99))

        # Estimated median completion time (where conditional survival reaches 0.50)
        target_s = 0.50 * s_elapsed
        median_days = None
        under_median = np.where(probs <= target_s)[0]
        if len(under_median) > 0:
            median_days = int(times[under_median[0]])
        else:
            median_days = int(times[-1]) + 180

        # Discretize survival curve for charts (milestone days: 90, 180, 270, 365, 540, 730)
        milestones = [90, 180, 270, 365, 540, 730, 1000]
        curve_points = []
        for m in milestones:
            idx = np.searchsorted(times, m)
            surv_val = float(probs[min(idx, len(probs)-1)])
            cond_surv = float(np.clip(surv_val / s_elapsed, 0.0, 1.0))
            completion_prob = round((1.0 - cond_surv) * 100, 1)
            curve_points.append({
                "day": m,
                "completion_likelihood_pct": completion_prob,
                "overdue_risk_pct": round(cond_surv * 100, 1)
            })

        # Risk severity classification
        if overdue_probability >= 0.70:
            risk_tier = "HIGH"
            recommendation = "Active intervention required: high bottleneck probability based on expenditure size and historical delay patterns."
        elif overdue_probability >= 0.40:
            risk_tier = "MODERATE"
            recommendation = "Standard monitoring: completion likely on track but track procurement milestone at 180 days."
        else:
            risk_tier = "LOW"
            recommendation = "Favorable execution trajectory: low probability of timeline slippage."

        return {
            "sanction_amount": sanction_amount,
            "work_category": work_category,
            "approval_delay_days": approval_delay_days,
            "deadline_days": deadline_days,
            "elapsed_days": elapsed_days,
            "overdue_probability": round(overdue_probability, 4),
            "overdue_percentage": round(overdue_probability * 100, 1),
            "estimated_median_days": median_days,
            "relative_hazard_ratio": round(partial_hazard, 3),
            "risk_tier": risk_tier,
            "recommendation": recommendation,
            "survival_trajectory": curve_points
        }

    def save(self, file_path: str = MODEL_FILE_PATH):
        """Serializes trained model state to disk."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        payload = {
            "cph": self.cph,
            "feature_columns": self.feature_columns,
            "categories_": self.categories_,
            "penalizer": self.penalizer,
            "is_fitted": self.is_fitted
        }
        joblib.dump(payload, file_path)
        print(f"[CoxPH] Model saved successfully to {file_path}")

    @classmethod
    def load(cls, file_path: str = MODEL_FILE_PATH):
        """Loads serialized model state from disk."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file not found at {file_path}")
        payload = joblib.load(file_path)
        model = cls(penalizer=payload.get("penalizer", 0.1))
        model.cph = payload["cph"]
        model.feature_columns = payload["feature_columns"]
        model.categories_ = payload["categories_"]
        model.is_fitted = payload["is_fitted"]
        print(f"[CoxPH] Model loaded successfully with {len(model.feature_columns)} features.")
        return model


def train_and_cache_model():
    print("[CoxPH] Initializing training pipeline...")
    model = MPLADSSurvivalDelayModel(penalizer=0.1)
    print("[CoxPH] Querying project records from DuckDB...")
    df = model.fetch_training_data(sample_limit=35000)
    print(f"[CoxPH] Fetched {len(df)} records ({df['event_observed'].sum()} completed events).")
    
    print("[CoxPH] Fitting Cox Proportional Hazards model...")
    model.fit(df)
    
    print("[CoxPH] Summary of fitted model:")
    model.cph.print_summary()
    
    model.save()
    
    # Test evaluation sample
    test_res = model.predict_project_risk(
        sanction_amount=2500000.0,
        approval_delay_days=45.0,
        work_category="Roads and Bridges",
        deadline_days=365,
        elapsed_days=60
    )
    print("[CoxPH] Test prediction:")
    import pprint
    pprint.pprint(test_res)


if __name__ == "__main__":
    train_and_cache_model()
