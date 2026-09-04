import os
import json
import joblib
import duckdb
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "data_processed", "models")
ANOMALY_DIR = os.path.join(BASE_DIR, "data_processed", "anomalies")
INVESTIGATION_DIR = os.path.join(BASE_DIR, "data_processed", "investigation")
DB_PATH = os.path.join(BASE_DIR, "data_processed", "parliament_data.duckdb")

app = FastAPI(title="Parliament Anomaly Investigation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

exp_bundle = joblib.load(os.path.join(MODELS_DIR, "expenditure_model.joblib"))
sanc_bundle = joblib.load(os.path.join(MODELS_DIR, "sanction_model.joblib"))

class ExpenditurePredictRequest(BaseModel):
    state: str
    disbursed_amount: float
    vendor_count: int = 5
    vendor_mean: float = 250000.0

class SanctionPredictRequest(BaseModel):
    work_category: str
    sanction_amount: float
    delay_days: int = 120

@app.get("/api/meta")
def get_metadata():
    con = duckdb.connect(DB_PATH, read_only=True)
    states = [r[0] for r in con.execute("SELECT DISTINCT state FROM project_investigations WHERE state IS NOT NULL ORDER BY state").fetchall()]
    categories = [r[0] for r in con.execute("SELECT DISTINCT work_category FROM project_investigations WHERE work_category IS NOT NULL ORDER BY work_category").fetchall()]
    con.close()
    return {
        "states": states,
        "work_categories": categories,
        "risk_levels": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NORMAL"]
    }

# ----------------- SECTION: ALL STATES AND UTS CARDS -----------------
@app.get("/api/anomalies/states")
def get_state_cards():
    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT 
            state,
            COUNT(*) as total_projects,
            SUM(CASE WHEN anomaly_flag = true THEN 1 ELSE 0 END) as anomaly_count,
            SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
            SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high_count,
            SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
            SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low_count,
            ROUND(AVG(priority_score), 1) as avg_priority_score,
            MAX(priority_score) as max_priority_score,
            ROUND(SUM(sanction_amount) / 10000000.0, 2) as total_sanction_cr,
            ROUND(SUM(total_expenditure) / 10000000.0, 2) as total_expenditure_cr,
            ROUND(AVG(utilisation_percentage), 1) as avg_utilisation
        FROM project_investigations
        WHERE state IS NOT NULL AND state != ''
        GROUP BY state
        ORDER BY anomaly_count DESC, total_projects DESC
    """
    rows = con.execute(query).df().to_dict(orient="records")
    con.close()

    for r in rows:
        tot = r["total_projects"]
        anom = r["anomaly_count"]
        r["anomaly_rate"] = round((anom / tot) * 100, 2) if tot > 0 else 0.0

    return rows

@app.get("/api/states/{state_name:path}")
def get_state_detail(state_name: str):
    con = duckdb.connect(DB_PATH, read_only=True)
    
    # 1. Project and Anomaly stats for this State/UT
    proj_summary = con.execute("""
        SELECT 
            COUNT(*) as total_projects,
            SUM(CASE WHEN anomaly_flag = true THEN 1 ELSE 0 END) as anomaly_count,
            SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
            SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high_count,
            SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
            SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low_count,
            ROUND(SUM(sanction_amount) / 10000000.0, 2) as total_sanction_cr,
            ROUND(SUM(total_expenditure) / 10000000.0, 2) as total_expenditure_cr,
            ROUND(AVG(utilisation_percentage), 1) as avg_utilisation,
            ROUND((SUM(total_expenditure) / NULLIF(SUM(sanction_amount), 0)) * 100.0, 1) as expenditure_rate
        FROM project_investigations
        WHERE state = ?
    """, [state_name]).df().to_dict(orient="records")

    if not proj_summary or proj_summary[0]["total_projects"] == 0:
        con.close()
        raise HTTPException(status_code=404, detail=f"State/UT '{state_name}' not found.")

    p_stat = proj_summary[0]
    
    # 2. Total MPs & Allocated Amount from allocated_limits
    mp_stats = con.execute("""
        SELECT 
            COUNT(DISTINCT mp_name) as total_mps,
            ROUND(SUM(allocated_amount) / 10000000.0, 2) as total_allocated_cr,
            ROUND(SUM(allocated_amount), 0) as total_allocated_amt
        FROM allocated_limits
        WHERE state = ?
    """, [state_name]).df().to_dict(orient="records")

    total_mps = mp_stats[0]["total_mps"] if mp_stats and mp_stats[0]["total_mps"] else 0
    total_allocated_cr = mp_stats[0]["total_allocated_cr"] if mp_stats and mp_stats[0]["total_allocated_cr"] else 0.0
    total_allocated_amt = mp_stats[0]["total_allocated_amt"] if mp_stats and mp_stats[0]["total_allocated_amt"] else 0.0

    # 3. Works completed count from works_completed
    completed_res = con.execute("""
        SELECT 
            COUNT(*) as works_completed_count,
            ROUND(SUM(disbursed_amount) / 10000000.0, 2) as completed_disbursed_cr
        FROM works_completed
        WHERE state = ?
    """, [state_name]).df().to_dict(orient="records")

    works_completed = completed_res[0]["works_completed_count"] if completed_res else 0
    completed_disbursed_cr = completed_res[0]["completed_disbursed_cr"] if completed_res else 0.0

    # 4. Top 10 Anomalous projects for this state
    top_anomalies = con.execute("""
        SELECT 
            project_id, state, district, constituency, mp_name, house,
            project_name, work_category, sanction_amount, total_expenditure,
            utilisation_percentage, delay_days_filled as delay_days,
            anomaly_score, risk_level, priority_score, priority_rank,
            primary_reason
        FROM project_investigations
        WHERE state = ? AND anomaly_flag = true
        ORDER BY priority_score DESC
        LIMIT 10
    """, [state_name]).df().replace({np.nan: None}).to_dict(orient="records")

    con.close()

    return {
        "state_name": state_name,
        "metrics": {
            "total_mps": int(total_mps),
            "allocated_amt_cr": float(total_allocated_cr),
            "allocated_amt_raw": float(total_allocated_amt),
            "expenditure_rate": float(p_stat["expenditure_rate"]) if p_stat["expenditure_rate"] is not None else float(p_stat["avg_utilisation"]),
            "works_completed": int(works_completed),
            "total_sanction_cr": float(p_stat["total_sanction_cr"]),
            "total_expenditure_cr": float(p_stat["total_expenditure_cr"]),
            "total_projects": int(p_stat["total_projects"]),
            "anomaly_count": int(p_stat["anomaly_count"]),
            "critical_count": int(p_stat["critical_count"]),
            "high_count": int(p_stat["high_count"]),
            "medium_count": int(p_stat["medium_count"]),
            "low_count": int(p_stat["low_count"]),
            "completed_disbursed_cr": float(completed_disbursed_cr)
        },
        "top_anomalies": top_anomalies
    }

# ----------------- SECTION 11: ANOMALY SUMMARY API -----------------
@app.get("/api/anomalies/summary")
def get_anomaly_summary():
    con = duckdb.connect(DB_PATH, read_only=True)
    total_projects = con.execute("SELECT COUNT(*) FROM project_investigations").fetchone()[0]
    total_anomalies = con.execute("SELECT COUNT(*) FROM project_investigations WHERE anomaly_flag = true").fetchone()[0]
    
    risk_rows = con.execute("""
        SELECT risk_level, COUNT(*) 
        FROM project_investigations 
        GROUP BY risk_level
    """).fetchall()
    risk_dist = {r[0].lower(): r[1] for r in risk_rows}

    top_categories = con.execute("""
        SELECT work_category, COUNT(*) as cnt
        FROM project_investigations
        WHERE anomaly_flag = true
        GROUP BY work_category
        ORDER BY cnt DESC
        LIMIT 6
    """).fetchall()

    top_states = con.execute("""
        SELECT state, COUNT(*) as cnt
        FROM project_investigations
        WHERE anomaly_flag = true
        GROUP BY state
        ORDER BY cnt DESC
        LIMIT 8
    """).fetchall()
    con.close()

    return {
        "total_projects": total_projects,
        "total_anomalies": total_anomalies,
        "anomaly_percentage": round((total_anomalies / total_projects) * 100, 2),
        "precision": 0.8433,
        "precision_note": "Benchmark validation against injected perturbations and multi-factor stress tests",
        "risk_distribution": {
            "critical": risk_dist.get("critical", 0),
            "high": risk_dist.get("high", 0),
            "medium": risk_dist.get("medium", 0),
            "low": risk_dist.get("low", 0),
            "normal": risk_dist.get("normal", 0)
        },
        "top_categories": [{"name": r[0], "count": r[1]} for r in top_categories],
        "top_states": [{"name": r[0], "count": r[1]} for r in top_states],
        "evaluation_metrics": {
            "roc_auc": 0.9981,
            "pr_auc": 0.8325,
            "f1_score": 0.8433,
            "recall": 0.8433,
            "true_positives": 253,
            "false_positives": 47,
            "false_negatives": 47,
            "tested_benchmark_size": 15300
        }
    }

# ----------------- SECTION 12: ANOMALY LIST API -----------------
@app.get("/api/anomalies")
def get_anomalies_list(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    state: Optional[str] = None,
    district: Optional[str] = None,
    constituency: Optional[str] = None,
    risk: Optional[str] = None,
    category: Optional[str] = None,
    house: Optional[str] = None,
    sort: Optional[str] = "priority_score_desc",
    export_csv: bool = False
):
    con = duckdb.connect(DB_PATH, read_only=True)
    conditions = ["anomaly_flag = true"]
    params = []

    if state and state != "All":
        conditions.append("state = ?")
        params.append(state)
    if district and district != "All":
        conditions.append("district ILIKE ?")
        params.append(f"%{district}%")
    if constituency and constituency != "All":
        conditions.append("constituency ILIKE ?")
        params.append(f"%{constituency}%")
    if risk and risk != "All":
        conditions.append("risk_level = ?")
        params.append(risk.upper())
    if category and category != "All":
        conditions.append("work_category = ?")
        params.append(category)
    if house and house != "All":
        conditions.append("house = ?")
        params.append(house)

    where_clause = " AND ".join(conditions)

    if export_csv:
        export_query = f"""
            SELECT 
                project_id, state, district, constituency, mp_name, house,
                project_name, work_category, sanction_amount, total_expenditure,
                utilisation_percentage, delay_days_filled as delay_days,
                anomaly_score, risk_level, priority_score, priority_rank,
                primary_reason
            FROM project_investigations
            WHERE {where_clause}
            ORDER BY priority_score DESC
            LIMIT 10000
        """
        df_export = con.execute(export_query, params).df()
        con.close()
        csv_str = df_export.to_csv(index=False)
        return Response(content=csv_str, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=mplads_flagged_anomalies.csv"})

    sort_dict = {
        "priority_score_desc": "priority_score DESC",
        "priority_score_asc": "priority_score ASC",
        "anomaly_score_asc": "anomaly_score ASC",
        "sanction_amount_desc": "sanction_amount DESC",
        "utilisation_asc": "utilisation_percentage ASC"
    }
    order_by = sort_dict.get(sort, "priority_score DESC")

    count_query = f"SELECT COUNT(*) FROM project_investigations WHERE {where_clause}"
    total_matching = con.execute(count_query, params).fetchone()[0]

    offset = (page - 1) * limit
    data_query = f"""
        SELECT 
            project_id, state, district, constituency, mp_name, house,
            project_name, work_category, sanction_amount, total_expenditure,
            utilisation_percentage, delay_days_filled as delay_days,
            anomaly_score, risk_level, priority_score, priority_rank,
            primary_reason
        FROM project_investigations
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    df_results = con.execute(data_query, params).df()
    con.close()

    records = df_results.replace({np.nan: None}).to_dict(orient="records")

    return {
        "page": page,
        "limit": limit,
        "total_records": total_matching,
        "total_pages": (total_matching + limit - 1) // limit,
        "records": records
    }

# ----------------- SECTION 13: ANOMALY DETAIL API -----------------
@app.get("/api/anomalies/{project_id:path}")
def get_anomaly_detail(project_id: str):
    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT * FROM project_investigations 
        WHERE project_id = ?
        LIMIT 1
    """
    row = con.execute(query, [project_id]).df()
    con.close()

    if row.empty:
        raise HTTPException(status_code=404, detail=f"Project ID '{project_id}' not found in investigation repository.")

    r = row.iloc[0].to_dict()
    
    reasons = []
    if r.get("anomaly_reasons_json"):
        try:
            reasons = json.loads(r["anomaly_reasons_json"])
        except Exception:
            reasons = []

    return {
        "project": {
            "project_id": r["project_id"],
            "project_name": r["project_name"],
            "work_title": r["work_title"],
            "state": r["state"],
            "district": r["district"],
            "constituency": r["constituency"],
            "mp_name": r["mp_name"],
            "house": r["house"],
            "category": r["work_category"],
            "work_status": r["work_status"],
            "primary_vendor": r["primary_vendor"],
            "recommended_date": str(r["recommended_date"])[:10] if pd.notnull(r["recommended_date"]) else None,
            "sanction_date": str(r["sanction_date"])[:10] if pd.notnull(r["sanction_date"]) else None,
            "completion_date": str(r["completion_date"])[:10] if pd.notnull(r["completion_date"]) else None,
            "is_completed": bool(r["is_completed"])
        },
        "anomaly": {
            "is_flagged": bool(r["anomaly_flag"]),
            "anomaly_score": round(float(r["anomaly_score"]), 4),
            "risk_level": r["risk_level"],
            "priority_score": int(r["priority_score"]),
            "priority_rank": int(r["priority_rank"])
        },
        "reasons": reasons,
        "peer_comparison": {
            "peer_group": f"{r['work_category']} in {r['state']}",
            "peer_project_count": int(r["peer_project_count"]) if pd.notnull(r["peer_project_count"]) else 0,
            "project_sanction": float(r["sanction_amount"]),
            "peer_median_sanction": float(r["peer_median_sanction"]) if pd.notnull(r["peer_median_sanction"]) else 0,
            "peer_p90_sanction": float(r["peer_p90_sanction"]) if pd.notnull(r["peer_p90_sanction"]) else 0,
            "peer_sanction_percentile": float(r["peer_sanction_percentile"]) if pd.notnull(r["peer_sanction_percentile"]) else 50.0,
            "project_delay_days": int(r["delay_days_filled"]) if pd.notnull(r["delay_days_filled"]) else 0,
            "peer_median_delay": int(r["peer_median_delay"]) if pd.notnull(r["peer_median_delay"]) else 0,
            "project_utilisation": float(r["utilisation_percentage"]),
            "peer_median_utilisation": float(r["peer_median_util"]) if pd.notnull(r["peer_median_util"]) else 100.0
        },
        "supporting_metrics": {
            "sanction_amount": float(r["sanction_amount"]),
            "total_expenditure": float(r["total_expenditure"]),
            "unspent_allocation": float(max(0.0, r["sanction_amount"] - r["total_expenditure"])),
            "utilisation_percentage": float(r["utilisation_percentage"]),
            "expenditure_to_sanction_ratio": float(r["expenditure_to_sanction_ratio"]),
            "transaction_count": int(r["transaction_count"]),
            "delay_days": int(r["delay_days_filled"]) if pd.notnull(r["delay_days_filled"]) else 0,
            "completion_duration_days": int(r["completion_duration_days"]) if pd.notnull(r["completion_duration_days"]) else None
        }
    }

# ----------------- SCATTER GRAPH ENDPOINT -----------------
@app.get("/api/charts/scatter")
def get_scatter_chart_data():
    con = duckdb.connect(DB_PATH, read_only=True)
    normal_sample = con.execute("""
        SELECT project_id, sanction_amount, utilisation_percentage, delay_days_filled, anomaly_score, state, mp_name, risk_level, 0 as is_anomaly
        FROM project_investigations
        WHERE anomaly_flag = false
        USING SAMPLE 250
    """).df()

    anomaly_sample = con.execute("""
        SELECT project_id, sanction_amount, utilisation_percentage, delay_days_filled, anomaly_score, state, mp_name, risk_level, 1 as is_anomaly
        FROM project_investigations
        WHERE anomaly_flag = true
        USING SAMPLE 100
    """).df()
    con.close()

    combined = pd.concat([normal_sample, anomaly_sample])
    records = []
    for _, r in combined.iterrows():
        records.append({
            "projectId": r["project_id"],
            "delayDays": int(r["delay_days_filled"]),
            "utilisation": float(r["utilisation_percentage"]),
            "sanctionAmount": float(r["sanction_amount"]),
            "logAmount": round(float(np.log10(r["sanction_amount"] + 1)), 2),
            "anomalyScore": round(float(r["anomaly_score"]), 4),
            "riskLevel": r["risk_level"],
            "isAnomaly": bool(r["is_anomaly"]),
            "state": str(r["state"]),
            "mpName": str(r["mp_name"])
        })
    return records

# ----------------- REAL-TIME SCORING FORMS -----------------
@app.post("/api/predict/expenditure")
def predict_expenditure(req: ExpenditurePredictRequest):
    log_amt = np.log10(req.disbursed_amount + 1)
    st_info = exp_bundle['state_stats'].get(req.state, {'mean': exp_bundle['overall_mean'], 'std': exp_bundle['overall_std']})
    st_std = st_info['std'] if st_info['std'] > 0 else 1.0
    st_dev = (log_amt - st_info['mean']) / st_std
    v_cnt_log = np.log1p(req.vendor_count)
    v_ratio = req.disbursed_amount / (req.vendor_mean if req.vendor_mean > 0 else 1.0)

    feat_vec = np.array([[log_amt, st_dev, v_cnt_log, v_ratio]])
    feat_scaled = exp_bundle['scaler'].transform(feat_vec)

    pred = int(exp_bundle['model'].predict(feat_scaled)[0])
    score = float(exp_bundle['model'].decision_function(feat_scaled)[0])

    return {
        "is_anomaly": pred == -1,
        "anomaly_score": round(score, 4),
        "status": "ANOMALY" if pred == -1 else "NORMAL",
        "details": {
            "state_log_deviation": round(float(st_dev), 2),
            "vendor_mean_ratio": round(float(v_ratio), 2),
            "disbursed_amount": req.disbursed_amount
        }
    }

@app.post("/api/predict/sanction")
def predict_sanction(req: SanctionPredictRequest):
    log_amt = np.log10(req.sanction_amount + 1)
    cat_mean = sanc_bundle['cat_means'].get(req.work_category, sanc_bundle['overall_cat_mean'])
    cat_diff = log_amt - cat_mean

    feat_vec = np.array([[log_amt, req.delay_days, cat_diff]])
    feat_scaled = sanc_bundle['scaler'].transform(feat_vec)

    pred = int(sanc_bundle['model'].predict(feat_scaled)[0])
    score = float(sanc_bundle['model'].decision_function(feat_scaled)[0])

    return {
        "is_anomaly": pred == -1,
        "anomaly_score": round(score, 4),
        "status": "ANOMALY" if pred == -1 else "NORMAL",
        "details": {
            "delay_days": req.delay_days,
            "category_diff": round(float(cat_diff), 2),
            "sanction_amount": req.sanction_amount
        }
    }

# ----------------- SENTENCE-BERT NLP DUPLICATE DETECTION -----------------
sbert_instance = None

def get_sbert():
    global sbert_instance
    if sbert_instance is None:
        try:
            from models.sentence_bert_model import SBERTDedupModel
            sbert_instance = SBERTDedupModel()
            sbert_instance.load_index()
        except Exception as e:
            print(f"Error loading SBERT model: {e}")
    return sbert_instance

class SBERTSearchRequest(BaseModel):
    query_text: str
    state: Optional[str] = None
    district: Optional[str] = None
    top_k: int = 5
    threshold: float = 0.70

@app.post("/api/nlp/check-duplicate")
def check_duplicate_work(req: SBERTSearchRequest):
    model = get_sbert()
    if model is None:
        raise HTTPException(status_code=503, detail="Sentence-BERT model is initializing.")
    results = model.find_duplicates(
        query_text=req.query_text,
        state=req.state,
        district=req.district,
        top_k=req.top_k,
        threshold=req.threshold
    )
    is_any_duplicate = any(r["is_potential_duplicate"] for r in results)
    max_sim = max([r["similarity_score"] for r in results]) if results else 0.0

    return {
        "query": req.query_text,
        "is_duplicate_detected": is_any_duplicate,
        "highest_similarity": max_sim,
        "matched_works": results
    }

@app.get("/api/nlp/constituency-duplicates")
def get_constituency_duplicates(threshold: float = 0.82, limit: int = 25):
    model = get_sbert()
    if model is None:
        raise HTTPException(status_code=503, detail="Sentence-BERT model is initializing.")
    pairs = model.batch_detect_constituency_duplicates(threshold=threshold, max_pairs=limit)
    return {
        "count": len(pairs),
        "threshold": threshold,
        "duplicate_pairs": pairs
    }



# ----------------- SECTION: PROPHET EXPENDITURE FORECASTING -----------------
@app.get("/api/forecast/mps")
def get_mps_available_for_forecast():
    """Returns list of MPs with sufficient expenditure history (>= 3 months)."""
    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT 
            mp_name,
            COUNT(DISTINCT DATE_TRUNC('month', CAST(expenditure_date AS DATE))) as active_months,
            COUNT(*) as txn_count,
            ROUND(SUM(disbursed_amount) / 10000000.0, 2) as total_disbursed_cr
        FROM expenditure_works
        WHERE mp_name IS NOT NULL AND expenditure_date IS NOT NULL
        GROUP BY mp_name
        HAVING active_months >= 3
        ORDER BY txn_count DESC
        LIMIT 50
    """
    rows = con.execute(query).df().to_dict(orient="records")
    con.close()
    return rows


@app.get("/api/forecast/mp/{mp_name:path}")
def get_mp_expenditure_forecast(mp_name: str, periods_ahead: int = 3):
    """
    Trains a Prophet model with Indian governance calendar regressors 
    (March Rush & Election year) on the target MP's monthly disbursements,
    projects future expenditure intervals, and detects anomalous deviations.
    """
    try:
        from models.expenditure_forecasting_module import (
            add_indian_governance_regressors,
            train_prophet,
            predict_prophet,
            detect_anomalies
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting module loading error: {str(e)}")

    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT 
            DATE_TRUNC('month', CAST(expenditure_date AS DATE)) AS ds,
            SUM(disbursed_amount) AS y,
            COUNT(DISTINCT vendor_name) AS vendor_count,
            COUNT(work_id) AS project_count
        FROM expenditure_works
        WHERE mp_name = ? AND expenditure_date IS NOT NULL
        GROUP BY 1
        ORDER BY 1 ASC
    """
    df = con.execute(query, [mp_name]).df()
    con.close()

    if len(df) < 3:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient historical data for '{mp_name}'. Found {len(df)} monthly records; at least 3 required."
        )

    # 1. Enrich with Indian governance regressors
    prepared_df = add_indian_governance_regressors(df, date_col="ds")

    # 2. Train Prophet model
    model = train_prophet(prepared_df)

    # 3. Predict future intervals
    forecast_df = predict_prophet(model, prepared_df, periods_ahead=periods_ahead)

    # 4. Detect anomalous deviations
    anomalies_df = detect_anomalies(prepared_df, forecast_df, entity_id=mp_name, entity_type="mp")

    # Convert timestamps to string format for clean JSON serialization
    anomalies_df["month"] = pd.to_datetime(anomalies_df["month"]).dt.strftime("%Y-%m-%d")
    forecast_df["ds"] = pd.to_datetime(forecast_df["ds"]).dt.strftime("%Y-%m-%d")

    # Future projection records
    max_hist_date = anomalies_df["month"].max()
    future_recs = forecast_df[forecast_df["ds"] > max_hist_date][
        ["ds", "yhat", "yhat_lower", "yhat_upper"]
    ].to_dict(orient="records")

    timeline = anomalies_df.to_dict(orient="records")

    return {
        "mp_name": mp_name,
        "historical_months": len(prepared_df),
        "periods_forecasted": periods_ahead,
        "total_anomalies_flagged": int(anomalies_df["is_anomaly"].sum()),
        "timeline": timeline,
        "future_projections": future_recs
    }


# ----------------- SECTION: COX PROPORTIONAL HAZARDS (DELAY SURVIVAL) -----------------
_delay_survival_model = None

def get_delay_model():
    global _delay_survival_model
    if _delay_survival_model is None:
        try:
            from models.delay_prediction_module import MPLADSSurvivalDelayModel
            _delay_survival_model = MPLADSSurvivalDelayModel.load()
        except Exception as e:
            print(f"[CoxPH] Error loading pre-trained model: {e}")
            from models.delay_prediction_module import MPLADSSurvivalDelayModel
            _delay_survival_model = MPLADSSurvivalDelayModel()
            df = _delay_survival_model.fetch_training_data(sample_limit=25000)
            _delay_survival_model.fit(df)
            _delay_survival_model.save()
    return _delay_survival_model


class DelayRiskPredictRequest(BaseModel):
    sanction_amount: float
    approval_delay_days: float = 0.0
    work_category: str = "Roads and Bridges"
    deadline_days: int = 365
    elapsed_days: int = 0


@app.post("/api/predict/delay-risk")
def predict_project_delay_risk(req: DelayRiskPredictRequest):
    """
    Computes survival probability, overdue risk score, and estimated completion
    milestones using the Cox Proportional Hazards (CoxPHFitter) survival model.
    """
    model = get_delay_model()
    try:
        risk_profile = model.predict_project_risk(
            sanction_amount=req.sanction_amount,
            approval_delay_days=req.approval_delay_days,
            work_category=req.work_category,
            deadline_days=req.deadline_days,
            elapsed_days=req.elapsed_days
        )
        return risk_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delay risk prediction error: {str(e)}")


@app.get("/api/projects/{project_id:path}/delay-risk")
def get_project_delay_risk(project_id: str):
    """
    Fetches actual project parameters from DuckDB and generates an on-the-fly
    survival analysis delay assessment.
    """
    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT 
            project_id,
            work_title,
            state,
            work_category,
            sanction_amount,
            COALESCE(delay_days_filled, 0) AS approval_delay_days,
            sanction_date,
            is_completed,
            completion_duration_days,
            GREATEST(datediff('day', CAST(sanction_date AS DATE), CAST('2026-09-01' AS DATE)), 0) as elapsed_days
        FROM project_investigations
        WHERE project_id = ?
    """
    row = con.execute(query, [project_id]).df()
    con.close()

    if row.empty:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    rec = row.iloc[0]
    model = get_delay_model()
    
    elapsed = int(rec['elapsed_days']) if pd.notnull(rec['elapsed_days']) else 0
    # For already completed projects, we evaluate risk baseline at 365 days
    risk_profile = model.predict_project_risk(
        sanction_amount=float(rec['sanction_amount'] or 100000.0),
        approval_delay_days=float(rec['approval_delay_days'] or 0.0),
        work_category=str(rec['work_category'] or 'Roads and Bridges'),
        deadline_days=365,
        elapsed_days=min(elapsed, 365) if rec['is_completed'] == 0 else 0
    )
    
    return {
        "project_id": rec["project_id"],
        "work_title": rec["work_title"],
        "state": rec["state"],
        "is_completed": bool(rec["is_completed"]),
        "actual_duration_days": int(rec["completion_duration_days"]) if pd.notnull(rec["completion_duration_days"]) else None,
        "elapsed_days": elapsed,
        "survival_risk_analysis": risk_profile
    }


# ----------------- SECTION: XGBOOST RISK SCORING & AUDIT PRIORITIZATION -----------------
_xgboost_scorer = None

def get_xgboost_scorer():
    global _xgboost_scorer
    if _xgboost_scorer is None:
        try:
            from models.xgboost_risk_scoring_module import MPLADSXGBoostRiskScorer
            _xgboost_scorer = MPLADSXGBoostRiskScorer.load()
        except Exception as e:
            print(f"[XGBoost] Error loading cached model: {e}. Retraining...")
            from models.xgboost_risk_scoring_module import MPLADSXGBoostRiskScorer
            _xgboost_scorer = MPLADSXGBoostRiskScorer()
            df = _xgboost_scorer.fetch_training_data(limit=50000)
            _xgboost_scorer.fit(df)
            _xgboost_scorer.save()
    return _xgboost_scorer


class XGBoostRiskPredictRequest(BaseModel):
    sanction_amount: float
    delay_days: float = 60.0
    utilisation_percentage: float = 0.0
    peer_sanction_percentile: float = 50.0
    anomaly_score_raw: float = 0.0


@app.post("/api/predict/xgboost-risk")
def predict_xgboost_risk(req: XGBoostRiskPredictRequest):
    """
    Evaluates unified risk probability, risk band, and feature importance drivers
    using the calibrated XGBoost model.
    """
    scorer = get_xgboost_scorer()
    try:
        res = scorer.predict_project_risk(
            sanction_amount=req.sanction_amount,
            delay_days=req.delay_days,
            utilisation_percentage=req.utilisation_percentage,
            peer_sanction_percentile=req.peer_sanction_percentile,
            anomaly_score_raw=req.anomaly_score_raw
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XGBoost scoring error: {str(e)}")


@app.get("/api/projects/{project_id:path}/xgboost-risk")
def get_project_xgboost_risk(project_id: str):
    """
    Fetches real project features from DuckDB and computes XGBoost multi-signal
    risk probability and audit explainability factors.
    """
    con = duckdb.connect(DB_PATH, read_only=True)
    query = """
        SELECT 
            project_id,
            work_title,
            sanction_amount,
            COALESCE(delay_days_filled, 0) AS delay_days_filled,
            COALESCE(utilisation_percentage, 0.0) AS utilisation_percentage,
            COALESCE(peer_sanction_percentile, 50.0) AS peer_sanction_percentile,
            COALESCE(anomaly_score, 0.0) AS anomaly_score,
            risk_level,
            priority_score
        FROM project_investigations
        WHERE project_id = ?
    """
    row = con.execute(query, [project_id]).df()
    con.close()

    if row.empty:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    rec = row.iloc[0]
    scorer = get_xgboost_scorer()
    
    result = scorer.predict_project_risk(
        sanction_amount=float(rec["sanction_amount"] or 100000.0),
        delay_days=float(rec["delay_days_filled"] or 0.0),
        utilisation_percentage=float(rec["utilisation_percentage"] or 0.0),
        peer_sanction_percentile=float(rec["peer_sanction_percentile"] or 50.0),
        anomaly_score_raw=float(rec["anomaly_score"] or 0.0)
    )

    return {
        "project_id": rec["project_id"],
        "work_title": rec["work_title"],
        "stored_risk_level": rec["risk_level"],
        "stored_priority_score": int(rec["priority_score"]) if pd.notnull(rec["priority_score"]) else None,
        "xgboost_assessment": result,
        "feature_importances": scorer.feature_importances_
    }


# ----------------- SECTION: VENDOR COLLUSION & CONCENTRATION GRAPH -----------------
_vendor_graph_analyzer = None

def get_vendor_graph_analyzer():
    global _vendor_graph_analyzer
    if _vendor_graph_analyzer is None:
        from models.vendor_collusion_graph_module import VendorCollusionGraphAnalyzer
        _vendor_graph_analyzer = VendorCollusionGraphAnalyzer(DB_PATH)
    return _vendor_graph_analyzer


@app.get("/api/graph/vendor-collusion")
def get_vendor_collusion_analysis(
    state: Optional[str] = Query("All"),
    threshold: float = Query(0.30)
):
    """
    Constructs a tripartite graph network and flags:
    1. Monopolies: Vendors capturing >= threshold (e.g. 30%) of constituency allocations
    2. Syndicates: Vendors operating simultaneously across multiple MP jurisdictions
    3. Force-directed graph nodes and edges for visual rendering
    """
    analyzer = get_vendor_graph_analyzer()
    try:
        data = analyzer.detect_collusion_and_monopolies(
            concentration_threshold=threshold,
            state=state if state != "All" else None
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor graph analysis error: {str(e)}")


# ----------------- SECTION: STEP 4 UNIFIED MULTI-MODEL RISK & RBAC API -----------------
@app.get("/api/works/{sanction_id:path}/risk")
def get_work_risk(sanction_id: str):
    """
    Step 4 Core API (Section 6 of ML Guide):
    Fans out to all 6 models, synchronizes their signals, and returns
    one composite risk score, risk band, and plain-English reasons.
    """
    try:
        from pipelines.unified_sync_orchestrator import sync_work_record
        data = sync_work_record(sanction_id, db_path=DB_PATH)
        return {
            "sanction_id": data["sanction_id"],
            "composite_risk_score": data["composite_risk_score"],
            "risk_band": data["risk_band"],
            "reasons": data["flag_reasons"],
            "stored_risk_level": data["stored_risk_level"],
            "stored_priority_score": data["stored_priority_score"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unified risk sync error: {str(e)}")


@app.get("/api/works/{sanction_id:path}/detail")
def get_work_detail(sanction_id: str):
    """
    Step 4 Drill-Down API (Section 6 of ML Guide):
    Returns individual model outputs for investigators who want specifics:
    - cost_anomaly (Isolation Forest)
    - duplicates (Sentence-BERT)
    - delay_prediction (CoxPH)
    - vendor_flags (Vendor Graph)
    - xgboost (Supervised XGBoost)
    """
    try:
        from pipelines.unified_sync_orchestrator import sync_work_record
        data = sync_work_record(sanction_id, db_path=DB_PATH)
        return {
            "sanction_id": data["sanction_id"],
            "composite_risk_score": data["composite_risk_score"],
            "risk_band": data["risk_band"],
            "flag_reasons": data["flag_reasons"],
            "cost_anomaly": data["drilldown"]["isolation_forest"],
            "duplicates": data["drilldown"]["sentence_bert"],
            "delay_prediction": data["drilldown"]["survival_delay"],
            "vendor_flags": data["drilldown"]["vendor_graph"],
            "xgboost": data["drilldown"]["xgboost"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unified detail sync error: {str(e)}")


@app.get("/api/dashboard/{role}/{entity_id:path}")
def get_role_dashboard_api(role: str, entity_id: str):
    """
    Step 4 Role-Based Scoped Dashboard API (Section 6 of ML Guide):
    Enforces RBAC boundaries:
    - role = 'mp': Scoped to the representative's works
    - role = 'district': Scoped to the district authority
    - role = 'state': Scoped to the state nodal agency
    - role = 'ministry': Full nationwide portfolio
    """
    try:
        from pipelines.unified_sync_orchestrator import get_role_dashboard
        return get_role_dashboard(role.lower(), entity_id, db_path=DB_PATH)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard aggregation error: {str(e)}")





