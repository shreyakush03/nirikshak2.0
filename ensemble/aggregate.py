"""
ensemble/aggregate.py
---------------------
Step 3 — The Aggregation / Ensemble Layer (Section 5 of MPLADS ML Integration Guide).

Merges all individual model score outputs:
- cost_df: Isolation Forest cost anomaly scores
- dedup_df: Sentence-BERT duplicate scores
- trend_df: Prophet expenditure trend deviation scores
- delay_df: Cox Proportional Hazards overdue risk scores
- vendor_df: Bipartite network vendor concentration scores

Produces the canonical composite risk table:
[sanction_id, composite_risk_score, risk_band, flag_reasons]
"""

import pandas as pd
from typing import Dict, Any, List

WEIGHTS = {
    "cost_anomaly_score": 0.25,
    "dup_score": 0.20,
    "trend_deviation_score": 0.15,
    "overdue_risk_score": 0.20,
    "vendor_concentration_score": 0.20,
}


def compute_risk_band(score: float) -> str:
    """Classifies composite risk score into bands."""
    if score >= 0.70:
        return "HIGH"
    if score >= 0.40:
        return "MEDIUM"
    return "LOW"


def build_reasons(row: pd.Series) -> List[str]:
    """Builds statutory, plain-English reasons for auditors and administrators."""
    reasons = []
    cost_score = row.get("cost_anomaly_score", 0.0)
    dup_score = row.get("dup_score", 0.0)
    trend_score = row.get("trend_deviation_score", 0.0)
    overdue_score = row.get("overdue_risk_score", 0.0)
    vendor_score = row.get("vendor_concentration_score", 0.0)

    if cost_score > 0.60:
        reasons.append(f"Sanction cost {cost_score:.0%} above district norm")
    if dup_score > 0.85:
        reasons.append("Highly similar to another sanctioned work nearby")
    if overdue_score > 0.60:
        reasons.append("High probability of missing completion deadline")
    if vendor_score > 0.30:
        reasons.append("Vendor holds disproportionate share of district works")
    if trend_score > 0.60:
        reasons.append("Disbursement trend deviates significantly from seasonal baseline")

    if not reasons:
        reasons.append("Parameters lie within normative financial and operational tolerance bounds.")

    return reasons


def aggregate(
    cost_df: pd.DataFrame,
    dedup_df: pd.DataFrame,
    trend_df: pd.DataFrame,
    delay_df: pd.DataFrame,
    vendor_df: pd.DataFrame,
    base_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Combines model outputs across all 5 dimensions.
    Returns: DataFrame with columns:
    ['sanction_id', 'composite_risk_score', 'risk_band', 'flag_reasons']
    """
    merged = base_df.copy()
    for df in [cost_df, dedup_df, trend_df, delay_df, vendor_df]:
        if df is not None and not df.empty and "sanction_id" in df.columns:
            merged = merged.merge(df, on="sanction_id", how="left")

    for col in WEIGHTS.keys():
        if col not in merged.columns:
            merged[col] = 0.0
        else:
            merged[col] = merged[col].fillna(0.0)

    merged["composite_risk_score"] = sum(
        merged[col] * weight for col, weight in WEIGHTS.items()
    )

    merged["risk_band"] = merged["composite_risk_score"].apply(compute_risk_band)
    merged["flag_reasons"] = merged.apply(build_reasons, axis=1)

    output_cols = ["sanction_id", "composite_risk_score", "risk_band", "flag_reasons"]
    # Preserve optional metadata columns if present in base_df
    for extra_col in ["work_title", "state", "district", "mp_name"]:
        if extra_col in merged.columns:
            output_cols.append(extra_col)

    return merged[output_cols]


def aggregate_single_record(
    sanction_id: str,
    cost_anomaly_score: float = 0.0,
    dup_score: float = 0.0,
    trend_deviation_score: float = 0.0,
    overdue_risk_score: float = 0.0,
    vendor_concentration_score: float = 0.0,
    xgb_risk_probability: float = 0.0,
    extra_reasons: List[str] = None
) -> Dict[str, Any]:
    """
    Per-record aggregation helper matching Section 5 and blending with XGBoost.
    """
    scores = {
        "cost_anomaly_score": float(cost_anomaly_score),
        "dup_score": float(dup_score),
        "trend_deviation_score": float(trend_deviation_score),
        "overdue_risk_score": float(overdue_risk_score),
        "vendor_concentration_score": float(vendor_concentration_score),
    }

    weighted_composite = sum(scores[col] * weight for col, weight in WEIGHTS.items())

    # Blend XGBoost supervised probability (40% heuristic ensemble + 60% trained XGBoost) if available
    if xgb_risk_probability > 0:
        final_score = round(float(0.40 * weighted_composite + 0.60 * xgb_risk_probability), 4)
    else:
        final_score = round(float(weighted_composite), 4)

    # Risk band mapping
    if final_score >= 0.65:
        risk_band = "CRITICAL"
    elif final_score >= 0.40:
        risk_band = "HIGH"
    elif final_score >= 0.22:
        risk_band = "MEDIUM"
    else:
        risk_band = "LOW"

    # Generate reasons
    row = pd.Series(scores)
    reasons = build_reasons(row)
    if extra_reasons:
        reasons.extend([r for r in extra_reasons if r not in reasons])

    return {
        "sanction_id": sanction_id,
        "composite_risk_score": round(final_score * 100, 1),
        "composite_risk_probability": final_score,
        "weighted_ensemble_score": round(weighted_composite, 4),
        "risk_band": risk_band,
        "flag_reasons": reasons,
        "component_scores": scores
    }
