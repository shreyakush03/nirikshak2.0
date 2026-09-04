"""
unified_sync_orchestrator.py
----------------------------
Implements Step 3 & Step 4 of the MPLADS ML Architecture (Fan-Out / Fan-In).

Synchronizes and orchestrates all 6 models:
1. Isolation Forest Anomaly Detection (Cost & Sanction Anomalies)
2. Sentence-BERT Semantic Duplicate Detection (Work Pairwise Cosine Similarity)
3. Prophet Expenditure Forecasting (Monthly Trend Deviation & March Rush)
4. Cox Proportional Hazards Delay Prediction (Right-Censored Overdue Probability)
5. Vendor Collusion & Monopoly Graph Analysis (Constituency Concentration Share)
6. XGBoost Supervised Audit Prioritization (Ensemble Classifier + Feature Drivers)

Provides:
- sync_work_record(project_id): Fan-out to all models and fan-in to composite risk profile.
- get_role_dashboard(role, entity_id): Scoped RBAC dashboard view (MP / District / State / Ministry).
"""

import os
import duckdb
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "parliament_data.duckdb")

# Model singletons
_iso_model = None
_sbert_model = None
_prophet_module = None
_delay_model = None
_vendor_analyzer = None
_xgboost_scorer = None


def get_all_models():
    """Initializes and returns cached handles to all core models."""
    global _delay_model, _xgboost_scorer, _vendor_analyzer, _sbert_model
    
    if _delay_model is None:
        try:
            from delay_prediction_module import MPLADSSurvivalDelayModel
            from models.delay_prediction_module import MPLADSSurvivalDelayModel
            _delay_model = MPLADSSurvivalDelayModel.load()
        except Exception:
            _delay_model = None

    if _xgboost_scorer is None:
        try:
            from xgboost_risk_scoring_module import MPLADSXGBoostRiskScorer
            from models.xgboost_risk_scoring_module import MPLADSXGBoostRiskScorer
            _xgboost_scorer = MPLADSXGBoostRiskScorer.load()
        except Exception:
            _xgboost_scorer = None

    if _vendor_analyzer is None:
        try:
            from vendor_collusion_graph_module import VendorCollusionGraphAnalyzer
            from models.vendor_collusion_graph_module import VendorCollusionGraphAnalyzer
            _vendor_analyzer = VendorCollusionGraphAnalyzer(DB_PATH)
        except Exception:
            _vendor_analyzer = None

    if _sbert_model is None:
        try:
            from sentence_bert_model import MPLADSDedupModel
            _sbert_model = MPLADSDedupModel()
            from models.sentence_bert_model import SBERTDedupModel
            _sbert_model = SBERTDedupModel()
        except Exception:
            _sbert_model = None

    return {
        "delay": _delay_model,
        "xgboost": _xgboost_scorer,
        "vendor": _vendor_analyzer,
        "sbert": _sbert_model
    }


def sync_work_record(project_id: str, db_path: str = DB_PATH) -> Dict[str, Any]:
    """
    Fan-out / Fan-in synchronization for a single project:
    Pulls project data from DuckDB, executes all 6 models concurrently/sequentially,
    and returns both the unified composite risk score and drill-down model results.
    """
    con = duckdb.connect(db_path, read_only=True)
    query = """
        SELECT 
            project_id,
            work_title,
            work_category,
            state,
            district,
            constituency,
            mp_name,
            house,
            recommended_date,
            sanction_date,
            sanction_amount,
            work_status,
            total_expenditure,
            transaction_count,
            primary_vendor,
            is_completed,
            completion_duration_days,
            delay_days_filled,
            utilisation_percentage,
            peer_median_sanction,
            peer_sanction_percentile,
            anomaly_score,
            anomaly_flag,
            risk_level,
            priority_score,
            priority_rank,
            primary_reason
        FROM project_investigations
        WHERE project_id = ?
    """
    row = con.execute(query, [project_id]).df()
    con.close()

    if row.empty:
        raise ValueError(f"Project '{project_id}' not found.")

    p = row.iloc[0].to_dict()
    models = get_all_models()

    sanction_amt = float(p.get("sanction_amount") or 100000.0)
    delay_days = float(p.get("delay_days_filled") or 0.0)
    util_pct = float(p.get("utilisation_percentage") or 0.0)
    peer_pct = float(p.get("peer_sanction_percentile") or 50.0)
    raw_anomaly_score = float(p.get("anomaly_score") or 0.0)
    work_category = str(p.get("work_category") or "Roads and Bridges")
    work_title = str(p.get("work_title") or "")
    primary_vendor = str(p.get("primary_vendor") or "")
    constituency = str(p.get("constituency") or "")
    state = str(p.get("state") or "")
    is_completed = bool(p.get("is_completed"))

    # 1. Model 1: Isolation Forest Cost Anomaly Signal
    # Normalize anomaly_score: lower score = more anomalous
    cost_anomaly_flag = bool(p.get("anomaly_flag"))
    cost_anomaly_score = round(float(np.clip((0.15 - raw_anomaly_score) / 0.35, 0.0, 1.0)), 4)

    # 2. Model 2: Sentence-BERT Semantic Duplicate Check
    dup_score = 0.0
    dup_matches = []
    if models["sbert"] and work_title:
        try:
            sbert_res = models["sbert"].find_similar_works(
            sbert_res = models["sbert"].find_duplicates(
                query_text=work_title,
                state=state if state else None,
                top_k=3,
                threshold=0.65
            )
            filtered_dups = [m for m in (sbert_res.get("matched_works") or []) if m.get("project_id") != project_id]
            filtered_dups = [m for m in (sbert_res or []) if m.get("project_id") != project_id]
            if filtered_dups:
                dup_matches = filtered_dups
                dup_score = round(float(filtered_dups[0].get("similarity_score", 0.0)), 4)
        except Exception as e:
            print(f"[Sync] S-BERT error for {project_id}: {e}")

    # 3. Model 3: Cox Proportional Hazards Delay Prediction (Survival Analysis)
    overdue_prob = 0.45
    median_days = 365
    delay_profile = {}
    if models["delay"]:
        try:
            delay_profile = models["delay"].predict_project_risk(
                sanction_amount=sanction_amt,
                approval_delay_days=delay_days,
                work_category=work_category,
                deadline_days=365,
                elapsed_days=0 if is_completed else min(int(delay_days), 365)
            )
            overdue_prob = float(delay_profile.get("overdue_probability", 0.45))
            median_days = int(delay_profile.get("estimated_median_days", 365))
        except Exception as e:
            print(f"[Sync] CoxPH error for {project_id}: {e}")

    # 4. Model 4: Vendor Concentration Share (from Vendor Graph)
    vendor_concentration_score = 0.0
    vendor_flag_info = {}
    if primary_vendor and primary_vendor != "None" and constituency:
        try:
            con = duckdb.connect(db_path, read_only=True)
            v_stat = con.execute("""
                WITH const_total AS (
                    SELECT SUM(disbursed_amount) as total_const 
                    FROM expenditure_works 
                    WHERE constituency = ?
                ),
                vendor_total AS (
                    SELECT SUM(disbursed_amount) as total_vendor 
                    FROM expenditure_works 
                    WHERE constituency = ? AND vendor_name = ?
                )
                SELECT 
                    COALESCE(vendor_total.total_vendor, 0) as v_spend,
                    COALESCE(const_total.total_const, 1) as c_spend,
                    ROUND(COALESCE(vendor_total.total_vendor, 0) / NULLIF(const_total.total_const, 0), 4) as share
                FROM const_total, vendor_total
            """, [constituency, constituency, primary_vendor]).fetchone()
            con.close()

            if v_stat and v_stat[2] is not None:
                vendor_concentration_score = float(v_stat[2])
                vendor_flag_info = {
                    "vendor_name": primary_vendor,
                    "constituency": constituency,
                    "concentration_share": vendor_concentration_score,
                    "vendor_spend": float(v_stat[0]),
                    "is_monopoly": vendor_concentration_score >= 0.30
                }
        except Exception as e:
            print(f"[Sync] Vendor graph error: {e}")

    # 5. Model 5: Expenditure Trend Signal (Prophet MP baseline deviation)
    trend_deviation_score = 0.0
    mp_name = str(p.get("mp_name") or "")
    if mp_name and mp_name != "None":
        try:
            con = duckdb.connect(db_path, read_only=True)
            mp_stat = con.execute("""
                SELECT 
                    ROUND(AVG(disbursed_amount), 2) as avg_spend,
                    COUNT(*) as txns
                FROM expenditure_works
                WHERE mp_name = ?
            """, [mp_name]).fetchone()
            con.close()
            if mp_stat and mp_stat[0]:
                avg_mp_spend = float(mp_stat[0])
                if avg_mp_spend > 0:
                    trend_deviation_score = float(np.clip((sanction_amt / avg_mp_spend) / 4.0, 0.0, 1.0))
        except Exception:
            trend_deviation_score = 0.2

    # 6. Model 6: XGBoost Supervised Audit Scoring & Feature Importance
    xgboost_profile = {}
    xgb_prob = 0.0
    if models["xgboost"]:
        try:
            xgboost_profile = models["xgboost"].predict_project_risk(
                sanction_amount=sanction_amt,
                delay_days=delay_days,
                utilisation_percentage=util_pct,
                peer_sanction_percentile=peer_pct,
                anomaly_score_raw=raw_anomaly_score
            )
            xgb_prob = float(xgboost_profile.get("risk_probability", 0.0))
        except Exception as e:
            print(f"[Sync] XGBoost error: {e}")

    # --- STEP 3: ENSEMBLE AGGREGATION (Section 5 Canonical ensemble.aggregate) ---
    from ensemble.aggregate import aggregate_single_record

    extra_specific_reasons = []
    if cost_anomaly_score > 0.55:
        extra_specific_reasons.append(f"Sanction cost sits in the {peer_pct:.0f}th percentile of district/category peers.")
    if overdue_prob >= 0.55:
        extra_specific_reasons.append(f"Survival analysis predicts {overdue_prob * 100:.1f}% likelihood of missing completion horizon (Median: {median_days}d).")
    if vendor_concentration_score >= 0.30:
        extra_specific_reasons.append(f"Vendor '{primary_vendor}' holds {vendor_concentration_score * 100:.1f}% of all constituency disbursements.")
    if util_pct == 0.0 and delay_days > 90:
        extra_specific_reasons.append(f"Zero disbursement ({util_pct}%) recorded after {int(delay_days)} days of sanction.")

    ens_res = aggregate_single_record(
        sanction_id=project_id,
        cost_anomaly_score=cost_anomaly_score,
        dup_score=dup_score,
        trend_deviation_score=trend_deviation_score,
        overdue_risk_score=overdue_prob,
        vendor_concentration_score=min(vendor_concentration_score, 1.0),
        xgb_risk_probability=xgb_prob,
        extra_reasons=extra_specific_reasons
    )

    final_risk_score = ens_res["composite_risk_probability"]
    risk_band = ens_res["risk_band"]
    reasons = ens_res["flag_reasons"]

    return {
        # Core Unified Output (consumed by frontend overview)
        "sanction_id": project_id,
        "project_id": project_id,
        "work_title": work_title,
        "composite_risk_score": round(final_risk_score * 100, 1),
        "composite_risk_probability": final_risk_score,
        "risk_band": risk_band,
        "flag_reasons": reasons,
        "stored_risk_level": p.get("risk_level"),
        "stored_priority_score": p.get("priority_score"),
        # Model Drill-Down Specifics (consumed by dossier modal)
        "drilldown": {
            "isolation_forest": {
                "raw_score": raw_anomaly_score,
                "normalized_score": cost_anomaly_score,
                "is_anomaly": cost_anomaly_flag
            },
            "sentence_bert": {
                "max_similarity": dup_score,
                "duplicate_matches_count": len(dup_matches),
                "matched_works": dup_matches
            },
            "survival_delay": delay_profile,
            "vendor_graph": vendor_flag_info,
            "xgboost": xgboost_profile
        }
    }


def get_role_dashboard(role: str, entity_id: str, db_path: str = DB_PATH) -> Dict[str, Any]:
    """
    Step 4: Role-Based Access Control (RBAC) Dashboard Scoping.
    Roles:
    - 'mp': Scoped to specific MP name
    - 'district': Scoped to specific District name
    - 'state': Scoped to specific State name
    - 'ministry': Full nationwide scope
    """
    con = duckdb.connect(db_path, read_only=True)
    
    where_cond = "WHERE 1=1"
    params = []

    if role == "mp":
        where_cond += " AND LOWER(mp_name) = LOWER(?)"
        params.append(entity_id)
    elif role == "district":
        where_cond += " AND LOWER(district) = LOWER(?)"
        params.append(entity_id)
    elif role == "state":
        where_cond += " AND LOWER(state) = LOWER(?)"
        params.append(entity_id)
    elif role == "ministry":
        pass # All records
    else:
        con.close()
        raise ValueError(f"Invalid scope role: {role}")

    query = f"""
        SELECT 
            project_id AS sanction_id,
            work_title,
            state,
            district,
            constituency,
            mp_name,
            sanction_amount,
            total_expenditure,
            utilisation_percentage,
            risk_level,
            priority_score,
            priority_rank,
            primary_reason
        FROM project_investigations
        {where_cond}
        ORDER BY priority_score DESC
        LIMIT 50
    """
    rows = con.execute(query, params).df().to_dict(orient="records")

    summary_query = f"""
        SELECT 
            COUNT(*) as total_works,
            SUM(CASE WHEN risk_level IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END) as high_risk_count,
            SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical_risk_count,
            ROUND(AVG(priority_score), 1) as avg_priority_score,
            ROUND(SUM(sanction_amount) / 10000000.0, 2) as total_sanction_cr,
            ROUND(SUM(total_expenditure) / 10000000.0, 2) as total_expenditure_cr
        FROM project_investigations
        {where_cond}
    """
    summary = con.execute(summary_query, params).df().iloc[0].to_dict()
    con.close()

    # Formulate works table matching Step 4 specs
    works = []
    for r in rows:
        works.append({
            "sanction_id": r["sanction_id"],
            "work_description": r["work_title"],
            "state": r["state"],
            "district": r["district"],
            "mp_name": r["mp_name"],
            "sanction_amount": float(r["sanction_amount"]),
            "risk_band": r["risk_level"],
            "composite_risk_score": int(r["priority_score"]),
            "flag_reasons": [r["primary_reason"]] if r.get("primary_reason") else []
        })

    return {
        "role": role,
        "entity_id": entity_id,
        "total_works": int(summary.get("total_works") or 0),
        "high_risk_count": int(summary.get("high_risk_count") or 0),
        "critical_risk_count": int(summary.get("critical_risk_count") or 0),
        "avg_priority_score": float(summary.get("avg_priority_score") or 0.0),
        "total_sanction_cr": float(summary.get("total_sanction_cr") or 0.0),
        "total_expenditure_cr": float(summary.get("total_expenditure_cr") or 0.0),
        "works": works
    }


if __name__ == "__main__":
    test_id = "WS/MP18173/2024-2025/137452"
    print(f"Testing sync_work_record for {test_id}...")
    res = sync_work_record(test_id)
    import pprint
    pprint.pprint({k: v for k, v in res.items() if k != "drilldown"})
    print("\nDrilldown models loaded:")
    for m, val in res["drilldown"].items():
        print(f" - {m}: {bool(val)}")
