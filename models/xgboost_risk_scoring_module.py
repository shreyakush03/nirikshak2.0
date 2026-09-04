"""
xgboost_risk_scoring_module.py
------------------------------
Supervised & Multi-Signal Risk Scoring for MPLADS using XGBoost (`xgboost.XGBClassifier`).

Role in Architecture:
- Acts as the Final-Stage Ensemble / Audit Prioritization Layer (Roadmap Phase 3).
- Takes signals from:
  1. Isolation Forest Anomaly Detection (cost/sanction outliers, anomaly_score)
  2. Cox Proportional Hazards Delay Prediction (overdue_risk_probability, relative_hazard_ratio)
  3. Administrative delay & execution metrics (approval latency, fund utilisation gap)
  4. Fiscal scale indicators (log sanction, peer deviation percentile)
- Produces:
  * Unified Risk Probability (0.0 to 1.0) & Risk Band (CRITICAL, HIGH, MEDIUM, LOW)
  * Priority Audit Score (0 - 100)
  * Feature Importances & Top Risk Factor Explanations (Tree gain / feature attribution)
"""

import os
import joblib
import numpy as np
import pandas as pd
import duckdb
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score, classification_report

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "parliament_data.duckdb")
DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "models")
XGB_MODEL_PATH = os.path.join(DEFAULT_MODEL_DIR, "xgboost_risk_model.joblib")

FEATURE_NAMES = [
    "log_sanction_amount",
    "delay_days_filled",
    "utilisation_percentage",
    "peer_dev_ratio",
    "peer_sanction_percentile",
    "anomaly_score_scaled",
    "is_zero_utilisation",
    "is_delay_outlier"
]


class MPLADSXGBoostRiskScorer:
    def __init__(self, n_estimators: int = 250, max_depth: int = 5, learning_rate: float = 0.05):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=3.0, # Balance minority high-risk cases
            eval_metric="logloss",
            random_state=42
        )
        self.feature_names = FEATURE_NAMES
        self.is_fitted = False
        self.feature_importances_ = {}

    def fetch_training_data(self, db_path: str = DEFAULT_DB_PATH, limit: int = 60000) -> pd.DataFrame:
        """Loads curated project records from DuckDB."""
        con = duckdb.connect(db_path, read_only=True)
        query = f"""
        SELECT 
            project_id,
            sanction_amount,
            total_expenditure,
            COALESCE(delay_days_filled, 0) AS delay_days_filled,
            COALESCE(utilisation_percentage, 0.0) AS utilisation_percentage,
            COALESCE(peer_sanction_percentile, 50.0) AS peer_sanction_percentile,
            COALESCE(anomaly_score, 0.0) AS anomaly_score,
            risk_level,
            priority_score,
            is_completed
        FROM project_investigations
        WHERE sanction_amount > 0
        ORDER BY RANDOM()
        LIMIT {limit}
        """
        df = con.execute(query).fetchdf()
        con.close()
        return df

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineers standardized features for XGBoost."""
        X = pd.DataFrame(index=df.index)

        # 1. Fiscal scale
        sanction = np.maximum(df["sanction_amount"].values, 100.0)
        X["log_sanction_amount"] = np.log10(sanction)

        # 2. Administrative delay
        X["delay_days_filled"] = np.clip(df["delay_days_filled"].values, 0, 1500)

        # 3. Fund utilisation
        X["utilisation_percentage"] = np.clip(df["utilisation_percentage"].values, 0, 200)

        # 4. Peer deviation proxy
        if "peer_dev_ratio" in df.columns:
            X["peer_dev_ratio"] = df["peer_dev_ratio"].fillna(0.0)
        else:
            # Estimate from peer percentile
            X["peer_dev_ratio"] = np.clip((df["peer_sanction_percentile"].values - 50.0) / 25.0, -2.0, 4.0)

        # 5. Peer percentile
        X["peer_sanction_percentile"] = df["peer_sanction_percentile"].fillna(50.0)

        # 6. Normalized anomaly score (0 = normal, 1 = extreme outlier)
        if "anomaly_score" in df.columns:
            raw_score = df["anomaly_score"].values
            min_s, max_s = np.nanmin(raw_score), np.nanmax(raw_score)
            if max_s > min_s:
                X["anomaly_score_scaled"] = (max_s - raw_score) / (max_s - min_s)
            else:
                X["anomaly_score_scaled"] = 0.5
        else:
            X["anomaly_score_scaled"] = 0.5

        # 7. Interaction and domain flags
        X["is_zero_utilisation"] = (df["utilisation_percentage"] == 0.0).astype(int)
        X["is_delay_outlier"] = (df["delay_days_filled"] > 180).astype(int)

        return X[self.feature_names]

    def create_audit_target(self, df: pd.DataFrame) -> pd.Series:
        """
        Creates ground-truth audit priority target:
        Flags high-risk/critical audits based on consensus signals:
        - Critical/High risk level from multi-criteria ranking, OR
        - Priority score >= 60, OR
        - Sanction > 2M with 0% utilisation and delay > 120 days.
        """
        y = (
            (df["risk_level"].isin(["CRITICAL", "HIGH"])) |
            (df["priority_score"] >= 60) |
            ((df["sanction_amount"] > 2000000) & (df["utilisation_percentage"] == 0) & (df["delay_days_filled"] > 120))
        ).astype(int)
        return y

    def fit(self, df: pd.DataFrame):
        """Fits XGBoost classifier and calculates feature gain importances."""
        X = self.prepare_features(df)
        y = self.create_audit_target(df)

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )

        # Evaluate performance
        val_preds_proba = self.model.predict_proba(X_val)[:, 1]
        auc = roc_auc_score(y_val, val_preds_proba)
        pr_auc = average_precision_score(y_val, val_preds_proba)

        # Feature importances
        booster = self.model.get_booster()
        score_dict = booster.get_score(importance_type="gain")
        total_gain = sum(score_dict.values()) if score_dict else 1.0
        self.feature_importances_ = {
            k: round(v / total_gain, 4) for k, v in score_dict.items()
        }

        self.is_fitted = True
        return {
            "roc_auc": round(auc, 4),
            "pr_auc": round(pr_auc, 4),
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "positive_rate": round(float(y.mean()), 4),
            "feature_importances": self.feature_importances_
        }

    def predict_project_risk(
        self,
        sanction_amount: float,
        delay_days: float = 60.0,
        utilisation_percentage: float = 0.0,
        peer_sanction_percentile: float = 50.0,
        anomaly_score_raw: float = 0.0
    ) -> dict:
        """Scores an individual project using XGBoost and derives top contributing factors."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Fit or load a trained model first.")

        single_df = pd.DataFrame([{
            "sanction_amount": float(sanction_amount),
            "delay_days_filled": float(delay_days),
            "utilisation_percentage": float(utilisation_percentage),
            "peer_sanction_percentile": float(peer_sanction_percentile),
            "anomaly_score": float(anomaly_score_raw),
            "peer_dev_ratio": (peer_sanction_percentile - 50.0) / 25.0
        }])

        X = self.prepare_features(single_df)
        prob = float(self.model.predict_proba(X)[0, 1])
        priority_score = int(np.clip(round(prob * 100), 0, 100))

        # Classify risk band
        if prob >= 0.70:
            risk_band = "CRITICAL"
        elif prob >= 0.45:
            risk_band = "HIGH"
        elif prob >= 0.25:
            risk_band = "MEDIUM"
        else:
            risk_band = "LOW"

        # Formulate human-readable risk drivers based on feature deviations
        reasons = []
        if utilisation_percentage == 0 and delay_days > 90:
            reasons.append({
                "factor": "Zero Fund Utilisation",
                "importance": "CRITICAL",
                "description": f"0.0% funds disbursed after {int(delay_days)} days of sanction."
            })
        if peer_sanction_percentile >= 90:
            reasons.append({
                "factor": "Fiscal Scale Outlier",
                "importance": "HIGH",
                "description": f"Sanction value Rs. {sanction_amount:,.0f} sits in the {peer_sanction_percentile}th percentile of state peers."
            })
        if delay_days > 180:
            reasons.append({
                "factor": "Administrative Latency",
                "importance": "HIGH",
                "description": f"Approval delay of {int(delay_days)} days exceeds expected procedural thresholds."
            })
        if utilisation_percentage > 115:
            reasons.append({
                "factor": "Budget Overrun",
                "importance": "HIGH",
                "description": f"Disbursed spend is {utilisation_percentage - 100:.1f}% higher than original sanction."
            })

        if not reasons:
            reasons.append({
                "factor": "Standard Execution",
                "importance": "NORMAL",
                "description": "All financial and operational indicators lie within normal peer bounds."
            })

        return {
            "risk_probability": round(prob, 4),
            "risk_percentage": round(prob * 100, 1),
            "risk_band": risk_band,
            "priority_score": priority_score,
            "top_factors": reasons,
            "model_architecture": "XGBoost Gradient Boosted Trees (XGBClassifier)"
        }

    def save(self, file_path: str = XGB_MODEL_PATH):
        """Saves trained model state to disk."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        payload = {
            "model": self.model,
            "feature_names": self.feature_names,
            "feature_importances": self.feature_importances_,
            "is_fitted": self.is_fitted
        }
        joblib.dump(payload, file_path)
        print(f"[XGBoost] Model saved successfully to {file_path}")

    @classmethod
    def load(cls, file_path: str = XGB_MODEL_PATH):
        """Loads serialized model state from disk."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file not found at {file_path}")
        payload = joblib.load(file_path)
        scorer = cls()
        scorer.model = payload["model"]
        scorer.feature_names = payload["feature_names"]
        scorer.feature_importances_ = payload.get("feature_importances", {})
        scorer.is_fitted = payload["is_fitted"]
        print(f"[XGBoost] Loaded model with {len(scorer.feature_names)} features.")
        return scorer


def train_and_cache_xgboost_scorer():
    print("[XGBoost] Initializing model training pipeline...")
    scorer = MPLADSXGBoostRiskScorer(n_estimators=250, max_depth=5, learning_rate=0.05)
    
    print("[XGBoost] Loading DuckDB records...")
    df = scorer.fetch_training_data(limit=50000)
    print(f"[XGBoost] Loaded {len(df)} records.")
    
    print("[XGBoost] Fitting XGBClassifier...")
    metrics = scorer.fit(df)
    print("[XGBoost] Training Metrics:", metrics)
    
    scorer.save()
    
    # Test evaluation
    test_res = scorer.predict_project_risk(
        sanction_amount=4500000.0,
        delay_days=210.0,
        utilisation_percentage=0.0,
        peer_sanction_percentile=96.5,
        anomaly_score_raw=-0.08
    )
    print("[XGBoost] Sample Prediction:")
    import pprint
    pprint.pprint(test_res)


if __name__ == "__main__":
    train_and_cache_xgboost_scorer()
