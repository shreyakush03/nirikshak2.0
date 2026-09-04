import os
import sys
import logging
import duckdb
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(os.path.dirname(WORKSPACE), "data_processed")
INVESTIGATION_DIR = os.path.join(PROCESSED_DIR, "investigation")
DB_PATH = os.path.join(PROCESSED_DIR, "parliament_data.duckdb")

os.makedirs(INVESTIGATION_DIR, exist_ok=True)

def build_investigation_master():
    logger.info("Connecting to DuckDB and building unified project master records...")
    con = duckdb.connect(DB_PATH, read_only=True)
    
    query = """
    SELECT 
        s.clean_work_id as project_id,
        s.work_title,
        s.work_category,
        s.state,
        s.ida as district,
        s.constituency,
        s.mp_name,
        s.house,
        TRY_CAST(NULL AS DATE) as recommended_date,
        s.sanction_date,
        s.sanction_amount,
        s.work_status,
        COALESCE(e.total_expenditure, 0.0) as total_expenditure,
        COALESCE(e.transaction_count, 0) as transaction_count,
        e.primary_vendor,
        COALESCE(c.completed_flag, 0) as is_completed,
        c.completion_date
    FROM (
        SELECT *,
               regexp_extract(regexp_replace(work_title, '\\s+', '', 'g'), '([A-Z0-9]+/[A-Z0-9]+/[0-9]{4}-[0-9]{4}/[0-9]+)') as clean_work_id
        FROM works_sanctioned
        WHERE sanction_amount IS NOT NULL AND sanction_amount > 0
    ) s
    LEFT JOIN (
        SELECT 
            work_title,
            SUM(disbursed_amount) as total_expenditure,
            COUNT(*) as transaction_count,
            MAX(vendor_name) as primary_vendor
        FROM expenditure_works
        WHERE work_title IS NOT NULL
        GROUP BY work_title
    ) e ON s.work_title = e.work_title
    LEFT JOIN (
        SELECT DISTINCT
            regexp_extract(regexp_replace(work_title, '\\s+', '', 'g'), '([A-Z0-9]+/[A-Z0-9]+/[0-9]{4}-[0-9]{4}/[0-9]+)') as clean_work_id,
            1 as completed_flag,
            MAX(completion_date) as completion_date
        FROM works_completed
        GROUP BY clean_work_id
    ) c ON s.clean_work_id = c.clean_work_id
    WHERE s.clean_work_id != ''
    """
    df = con.execute(query).df()
    con.close()
    logger.info(f"Loaded {len(df):,} unique project records.")

    # 1. Metric Calculations
    # Clean project title (strip leading ID prefix)
    df['project_name'] = df['work_title'].apply(
        lambda x: x.split('-', 1)[1].strip() if '-' in str(x) else str(x)
    )

    # Delay duration in days (recommended to sanction)
    df['delay_days'] = (pd.to_datetime(df['sanction_date']) - pd.to_datetime(df['recommended_date'])).dt.days
    df['delay_days'] = df['delay_days'].apply(lambda d: d if (pd.notnull(d) and 0 <= d <= 3650) else np.nan)
    median_delay = float(df['delay_days'].median())
    df['delay_days_filled'] = df['delay_days'].fillna(median_delay)

    # Completion duration if completed
    df['completion_duration_days'] = (pd.to_datetime(df['completion_date']) - pd.to_datetime(df['sanction_date'])).dt.days
    df['completion_duration_days'] = df['completion_duration_days'].apply(lambda d: d if (pd.notnull(d) and 0 <= d <= 3650) else np.nan)

    # Fund utilisation percentage
    df['utilisation_percentage'] = np.where(
        df['sanction_amount'] > 0,
        np.round((df['total_expenditure'] / df['sanction_amount']) * 100.0, 2),
        0.0
    )
    df['expenditure_to_sanction_ratio'] = np.where(
        df['sanction_amount'] > 0,
        np.round(df['total_expenditure'] / df['sanction_amount'], 4),
        0.0
    )

    # Log amounts
    df['log_sanction_amount'] = np.log10(df['sanction_amount'] + 1)
    df['log_expenditure'] = np.log10(df['total_expenditure'] + 1)

    # 2. Peer Group Metrics (State & Work Category peers)
    logger.info("Calculating Peer-Group statistics (State + Category)...")
    peer_stats = df.groupby(['state', 'work_category']).agg(
        peer_median_sanction=('sanction_amount', 'median'),
        peer_mean_sanction=('sanction_amount', 'mean'),
        peer_p90_sanction=('sanction_amount', lambda s: np.percentile(s, 90)),
        peer_median_delay=('delay_days_filled', 'median'),
        peer_p90_delay=('delay_days_filled', lambda s: np.percentile(s, 90)),
        peer_median_util=('utilisation_percentage', 'median'),
        peer_project_count=('project_id', 'count')
    ).reset_index()

    df = df.merge(peer_stats, on=['state', 'work_category'], how='left')

    # Calculate percentile rank of sanction amount within each peer group
    df['peer_sanction_percentile'] = df.groupby(['state', 'work_category'])['sanction_amount'].rank(pct=True) * 100.0
    df['peer_sanction_percentile'] = df['peer_sanction_percentile'].round(1)

    # 3. Isolation Forest ML Modeling
    logger.info("Fitting Isolation Forest model for Anomaly Investigation...")
    # Features:
    # - log_sanction_amount: scale of project
    # - delay_days_filled: administrative processing time
    # - utilisation_percentage: financial implementation rate
    # - peer_dev_ratio: ratio of sanction amount to peer median
    df['peer_median_sanction'] = df['peer_median_sanction'].replace(0, 1).fillna(df['sanction_amount'].median())
    df['peer_dev_ratio'] = np.log10((df['sanction_amount'] / df['peer_median_sanction']).clip(lower=0.01) + 1)
    
    feature_cols = ['log_sanction_amount', 'delay_days_filled', 'utilisation_percentage', 'peer_dev_ratio']
    X = df[feature_cols].copy()
    
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    iso = IsolationForest(
        n_estimators=150,
        contamination=0.045, # flag top ~4.5% as statistically anomalous for review
        random_state=42,
        n_jobs=-1
    )
    df['anomaly_pred'] = iso.fit_predict(X_scaled) # -1: anomaly, 1: normal
    df['anomaly_score'] = iso.decision_function(X_scaled).round(4) # lower = more anomalous
    df['anomaly_flag'] = (df['anomaly_pred'] == -1)

    # 4. Transparent Risk Ranking Methodology
    logger.info("Calculating Risk Level and Priority Score...")
    # Configurable percentiles of anomaly_score for flagged projects
    flagged_scores = df[df['anomaly_flag']]['anomaly_score']
    p15 = float(np.percentile(flagged_scores, 15))
    p45 = float(np.percentile(flagged_scores, 45))
    p75 = float(np.percentile(flagged_scores, 75))

    def assign_risk(row):
        if not row['anomaly_flag']:
            return "NORMAL"
        score = row['anomaly_score']
        # Critical if in bottom 15% of anomaly score OR zero utilisation with massive sanction > 2.5M
        if score <= p15 or (row['sanction_amount'] > 2500000 and row['utilisation_percentage'] == 0 and row['delay_days_filled'] > 180):
            return "CRITICAL"
        elif score <= p45 or (row['peer_sanction_percentile'] >= 95 and row['delay_days_filled'] > 120):
            return "HIGH"
        elif score <= p75:
            return "MEDIUM"
        else:
            return "LOW"

    df['risk_level'] = df.apply(assign_risk, axis=1)

    # 5. Composite Investigation Priority Score (0 - 100)
    # Priority is higher for lower anomaly scores, high financial scale, zero utilisation, and extreme delay
    min_score = df['anomaly_score'].min()
    max_score = df['anomaly_score'].max()
    score_norm = (max_score - df['anomaly_score']) / (max_score - min_score) # 0 to 1, higher = more anomalous

    risk_weight = df['risk_level'].map({'CRITICAL': 40, 'HIGH': 28, 'MEDIUM': 18, 'LOW': 8, 'NORMAL': 0})
    util_gap = np.where(df['utilisation_percentage'] < 20, 20, np.where(df['utilisation_percentage'] > 120, 15, 0))
    scale_factor = (np.clip(df['log_sanction_amount'] - 5, 0, 3) / 3) * 20 # up to 20 pts for multi-million scale
    peer_factor = (df['peer_sanction_percentile'] / 100.0) * 10 # up to 10 pts

    raw_priority = (score_norm * 10) + risk_weight + util_gap + scale_factor + peer_factor
    df['priority_score'] = np.clip(np.round(raw_priority), 0, 100).astype(int)
    # Force priority_score to 0-15 for normal
    df.loc[df['risk_level'] == 'NORMAL', 'priority_score'] = np.clip(df.loc[df['risk_level'] == 'NORMAL', 'priority_score'], 0, 15)

    # Rank priorities
    df['priority_rank'] = df['priority_score'].rank(ascending=False, method='min').astype(int)

    # 6. Generate Rule-Based Human Readable Anomaly Explanations
    logger.info("Generating multi-dimensional peer-group explanations...")
    
    def generate_explanations(row):
        if row['risk_level'] == 'NORMAL':
            return []
        
        reasons = []

        # Explanation 1: Fund Utilisation
        if row['utilisation_percentage'] == 0.0 and row['delay_days_filled'] > 60:
            reasons.append({
                "type": "ZERO_UTILISATION",
                "feature": "utilisation_percentage",
                "severity": "CRITICAL" if row['sanction_amount'] > 1500000 else "HIGH",
                "message": f"Fund utilisation is 0.0% despite project being sanctioned {int(row['delay_days_filled'])} days ago.",
                "evidence": f"Sanctioned: ₹{row['sanction_amount']:,.0f}, Disbursed: ₹0"
            })
        elif row['utilisation_percentage'] < 30.0 and row['peer_median_util'] > 70.0:
            reasons.append({
                "type": "LOW_UTILISATION",
                "feature": "utilisation_percentage",
                "severity": "HIGH",
                "message": f"Utilisation rate of {row['utilisation_percentage']}% is substantially lower than peer median ({row['peer_median_util']:.1f}%).",
                "evidence": f"Disbursed: ₹{row['total_expenditure']:,.0f} vs Sanctioned: ₹{row['sanction_amount']:,.0f}"
            })
        elif row['utilisation_percentage'] > 115.0:
            reasons.append({
                "type": "EXCESS_EXPENDITURE",
                "feature": "utilisation_percentage",
                "severity": "HIGH",
                "message": f"Cumulative expenditure exceeds original sanctioned allocation by {row['utilisation_percentage'] - 100:.1f}%.",
                "evidence": f"Disbursed ₹{row['total_expenditure']:,.0f} against Sanction ₹{row['sanction_amount']:,.0f}"
            })

        # Explanation 2: Approval Delay
        if row['delay_days_filled'] > 180 and row['delay_days_filled'] > (row['peer_median_delay'] * 2.5):
            reasons.append({
                "type": "EXTENDED_APPROVAL_DELAY",
                "feature": "delay_days",
                "severity": "HIGH" if row['delay_days_filled'] > 365 else "MEDIUM",
                "message": f"Administrative approval delay ({int(row['delay_days_filled'])} days) significantly exceeds comparable state projects (median: {int(row['peer_median_delay'])} days).",
                "evidence": f"Recommended: {str(row['recommended_date'])[:10]} | Sanctioned: {str(row['sanction_date'])[:10]}"
            })

        # Explanation 3: Financial Scale vs Peers
        if row['peer_sanction_percentile'] >= 95.0:
            reasons.append({
                "type": "HIGH_SANCTION_OUTLIER",
                "feature": "sanction_amount",
                "severity": "CRITICAL" if row['peer_sanction_percentile'] >= 99.0 else "HIGH",
                "message": f"Sanction amount is higher than {row['peer_sanction_percentile']}% of comparable {row['work_category']} projects in {row['state']}.",
                "evidence": f"Project: ₹{row['sanction_amount']:,.0f} | Peer Group Median: ₹{row['peer_median_sanction']:,.0f}"
            })
        elif row['peer_sanction_percentile'] <= 3.0 and row['sanction_amount'] < 50000:
            reasons.append({
                "type": "LOW_SANCTION_OUTLIER",
                "feature": "sanction_amount",
                "severity": "MEDIUM",
                "message": f"Sanction amount is in the bottom {row['peer_sanction_percentile']}% of comparable projects.",
                "evidence": f"Project: ₹{row['sanction_amount']:,.0f} | Peer Median: ₹{row['peer_median_sanction']:,.0f}"
            })

        # Explanation 4: Implementation Status vs Spending
        if row['work_status'] in ['Completed', 'Physical Inspection'] and row['utilisation_percentage'] < 40.0:
            reasons.append({
                "type": "STATUS_FINANCIAL_DISCREPANCY",
                "feature": "work_status",
                "severity": "MEDIUM",
                "message": f"Project is marked as '{row['work_status']}' but recorded disbursement is only {row['utilisation_percentage']}%.",
                "evidence": "Recorded disbursements may be unvouched or pending final settlement."
            })

        # Default fallback explanation if none triggered
        if not reasons:
            reasons.append({
                "type": "MULTIVARIATE_ISOLATION",
                "feature": "isolation_forest",
                "severity": "LOW",
                "message": "Statistically unusual combination of expenditure pace, project size, and sanction latency across multiple feature dimensions.",
                "evidence": f"Isolation Forest Score: {row['anomaly_score']:.4f}"
            })

        return reasons

    df['anomaly_reasons'] = df.apply(generate_explanations, axis=1)
    df['primary_reason'] = df['anomaly_reasons'].apply(lambda arr: arr[0]['message'] if len(arr) > 0 else "Normal transaction pattern")
    df['primary_type'] = df['anomaly_reasons'].apply(lambda arr: arr[0]['type'] if len(arr) > 0 else "NORMAL")

    # 7. Persist Clean Analytical Parquet & DuckDB Table
    logger.info("Persisting project investigation table to Parquet & DuckDB...")
    # Convert lists to JSON string for Parquet/DuckDB storage compatibility
    df_save = df.copy()
    import json
    df_save['anomaly_reasons_json'] = df_save['anomaly_reasons'].apply(lambda r: json.dumps(r))
    df_save.drop(columns=['anomaly_reasons'], inplace=True)

    parquet_file = os.path.join(INVESTIGATION_DIR, "project_investigations.parquet")
    df_save.to_parquet(parquet_file, index=False)

    csv_file = os.path.join(INVESTIGATION_DIR, "flagged_investigations.csv")
    df_save[df_save['anomaly_flag']].head(5000).to_csv(csv_file, index=False)

    # Register into DuckDB
    con = duckdb.connect(DB_PATH)
    con.execute("CREATE OR REPLACE TABLE project_investigations AS SELECT * FROM df_save")
    con.close()

    # Summary
    anom_total = df['anomaly_flag'].sum()
    crit_count = (df['risk_level'] == 'CRITICAL').sum()
    high_count = (df['risk_level'] == 'HIGH').sum()
    med_count = (df['risk_level'] == 'MEDIUM').sum()
    low_count = (df['risk_level'] == 'LOW').sum()

    logger.info("=" * 60)
    logger.info("INVESTIGATION LAYER MASTER BUILD COMPLETED")
    logger.info(f"Total Projects Analyzed   : {len(df):,}")
    logger.info(f"Total Flagged Anomalies   : {anom_total:,} ({anom_total/len(df)*100:.2f}%)")
    logger.info(f"  * CRITICAL Priority     : {crit_count:,}")
    logger.info(f"  * HIGH Priority         : {high_count:,}")
    logger.info(f"  * MEDIUM Priority       : {med_count:,}")
    logger.info(f"  * LOW Priority          : {low_count:,}")
    logger.info(f"Master Parquet File Saved : {parquet_file}")
    logger.info("=" * 60)

if __name__ == "__main__":
    build_investigation_master()
