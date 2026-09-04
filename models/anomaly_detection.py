import os
import sys
import logging
import duckdb
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
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
ANOMALY_DIR = os.path.join(PROCESSED_DIR, "anomalies")
REPORTS_DIR = os.path.join(PROCESSED_DIR, "reports")
DB_PATH = os.path.join(PROCESSED_DIR, "parliament_data.duckdb")

os.makedirs(ANOMALY_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Visual styling
sns.set_theme(style="whitegrid")
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'

def detect_expenditure_anomalies(con: duckdb.DuckDBPyConnection):
    logger.info("Extracting and engineering features for 'expenditure_works'...")
    query = """
    SELECT 
        house,
        state,
        mp_name,
        constituency,
        vendor_name,
        payment_status,
        work_title,
        work_id,
        expenditure_date,
        disbursed_amount
    FROM expenditure_works
    WHERE disbursed_amount IS NOT NULL AND disbursed_amount > 0
    """
    df = con.execute(query).df()
    logger.info(f"Loaded {len(df):,} valid expenditure records.")

    # Feature Engineering
    # 1. Log Amount
    df['log_amount'] = np.log10(df['disbursed_amount'] + 1)
    
    # 2. State-level relative deviation (z-score on log scale per state)
    state_stats = df.groupby('state')['log_amount'].agg(['mean', 'std']).reset_index()
    state_stats['std'] = state_stats['std'].replace(0, 1).fillna(1)
    df = df.merge(state_stats, on='state', how='left')
    df['state_log_deviation'] = (df['log_amount'] - df['mean']) / df['std']
    df['state_log_deviation'] = df['state_log_deviation'].fillna(0)

    # 3. Vendor transaction frequency and mean transaction value
    vendor_stats = df.groupby('vendor_name')['disbursed_amount'].agg(
        vendor_count='count',
        vendor_mean='mean'
    ).reset_index()
    df = df.merge(vendor_stats, on='vendor_name', how='left')
    df['vendor_count_log'] = np.log1p(df['vendor_count'].fillna(1))
    df['vendor_mean_ratio'] = df['disbursed_amount'] / (df['vendor_mean'].replace(0, 1).fillna(1))

    feature_cols = ['log_amount', 'state_log_deviation', 'vendor_count_log', 'vendor_mean_ratio']
    X = df[feature_cols].copy()
    
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    # Isolation Forest Model
    logger.info("Fitting IsolationForest on expenditure features...")
    iso = IsolationForest(
        n_estimators=150,
        contamination=0.015, # flag top ~1.5% anomalies
        random_state=42,
        n_jobs=-1
    )
    df['anomaly_prediction'] = iso.fit_predict(X_scaled) # -1: anomaly, 1: normal
    df['anomaly_score'] = iso.decision_function(X_scaled) # Lower score = more abnormal
    df['is_anomaly'] = (df['anomaly_prediction'] == -1)

    anomaly_count = df['is_anomaly'].sum()
    logger.info(f"Detected {anomaly_count:,} anomalies in expenditure_works ({anomaly_count/len(df)*100:.2f}%)")

    # Save output files
    anomalies_df = df[df['is_anomaly']].sort_values(by='anomaly_score')
    anomalies_df.to_parquet(os.path.join(ANOMALY_DIR, "expenditure_anomalies.parquet"), index=False)
    anomalies_df.to_csv(os.path.join(ANOMALY_DIR, "expenditure_anomalies.csv"), index=False)
    df.to_parquet(os.path.join(ANOMALY_DIR, "expenditure_scored.parquet"), index=False)

    # Visualization
    logger.info("Generating expenditure anomaly visualization...")
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    # Plot 1: Anomaly Score distribution
    sns.histplot(data=df, x='anomaly_score', hue='is_anomaly', bins=50, ax=axes[0], palette={False: 'steelblue', True: 'crimson'}, kde=True)
    axes[0].set_title("Isolation Forest Decision Function Score Distribution")
    axes[0].set_xlabel("Anomaly Score (Lower = More Anomalous)")
    axes[0].set_ylabel("Transaction Count")

    # Plot 2: Scatter plot of Disbursed Amount vs State Log Deviation
    sample_normal = df[~df['is_anomaly']].sample(n=min(5000, len(df[~df['is_anomaly']])), random_state=42)
    sample_anomaly = df[df['is_anomaly']]
    
    axes[1].scatter(sample_normal['state_log_deviation'], sample_normal['disbursed_amount'], 
                    alpha=0.3, color='steelblue', label='Normal (Sampled)', s=20)
    axes[1].scatter(sample_anomaly['state_log_deviation'], sample_anomaly['disbursed_amount'], 
                    alpha=0.7, color='crimson', label='Anomaly', s=35, edgecolors='black', linewidth=0.5)
    axes[1].set_yscale('log')
    axes[1].set_title("Expenditure Amounts vs State Deviation (Outliers in Red)")
    axes[1].set_xlabel("State Deviation (Std Deviations from State Mean)")
    axes[1].set_ylabel("Disbursed Amount ₹ (Log Scale)")
    axes[1].legend()

    plt.tight_layout()
    plot_path = os.path.join(REPORTS_DIR, "expenditure_anomalies.png")
    plt.savefig(plot_path, dpi=200)
    plt.close()
    logger.info(f"Saved plot to {plot_path}")

    return anomalies_df

def detect_sanction_anomalies(con: duckdb.DuckDBPyConnection):
    logger.info("Extracting and engineering features for 'works_sanctioned'...")
    query = """
    SELECT 
        house,
        state,
        work_category,
        work_title,
        mp_name,
        constituency,
        recommended_date,
        sanction_date,
        sanction_amount,
        work_status
    FROM works_sanctioned
    WHERE sanction_amount IS NOT NULL AND sanction_amount > 0
    """
    df = con.execute(query).df()
    logger.info(f"Loaded {len(df):,} valid sanctioned records.")

    # Calculate Approval Delay in days
    df['delay_days'] = (pd.to_datetime(df['sanction_date']) - pd.to_datetime(df['recommended_date'])).dt.days
    # Clean invalid negative or extreme placeholder dates
    df['delay_days_cleaned'] = df['delay_days'].apply(lambda x: x if (pd.notnull(x) and 0 <= x <= 3650) else np.nan)
    median_delay = df['delay_days_cleaned'].median()
    df['delay_days_filled'] = df['delay_days_cleaned'].fillna(median_delay)

    df['log_amount'] = np.log10(df['sanction_amount'] + 1)
    
    # Category level mean amount comparison
    cat_means = df.groupby('work_category')['log_amount'].mean().to_dict()
    df['cat_amount_diff'] = df['log_amount'] - df['work_category'].map(cat_means).fillna(df['log_amount'].mean())

    feature_cols = ['log_amount', 'delay_days_filled', 'cat_amount_diff']
    X = df[feature_cols].copy()

    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    logger.info("Fitting IsolationForest on sanctioned works...")
    iso = IsolationForest(
        n_estimators=150,
        contamination=0.015,
        random_state=42,
        n_jobs=-1
    )
    df['anomaly_prediction'] = iso.fit_predict(X_scaled)
    df['anomaly_score'] = iso.decision_function(X_scaled)
    df['is_anomaly'] = (df['anomaly_prediction'] == -1)

    anomaly_count = df['is_anomaly'].sum()
    logger.info(f"Detected {anomaly_count:,} anomalies in works_sanctioned ({anomaly_count/len(df)*100:.2f}%)")

    anomalies_df = df[df['is_anomaly']].sort_values(by='anomaly_score')
    anomalies_df.to_parquet(os.path.join(ANOMALY_DIR, "sanction_anomalies.parquet"), index=False)
    anomalies_df.to_csv(os.path.join(ANOMALY_DIR, "sanction_anomalies.csv"), index=False)
    df.to_parquet(os.path.join(ANOMALY_DIR, "sanction_scored.parquet"), index=False)

    # Visualization
    logger.info("Generating sanctioned works anomaly visualization...")
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))

    sample_normal = df[~df['is_anomaly']].sample(n=min(5000, len(df[~df['is_anomaly']])), random_state=42)
    sample_anomaly = df[df['is_anomaly']]

    # Plot 1: Delay vs Sanction Amount
    axes[0].scatter(sample_normal['delay_days_filled'], sample_normal['sanction_amount'], 
                    alpha=0.3, color='forestgreen', label='Normal (Sampled)', s=20)
    axes[0].scatter(sample_anomaly['delay_days_filled'], sample_anomaly['sanction_amount'], 
                    alpha=0.7, color='purple', label='Anomaly', s=35, edgecolors='black', linewidth=0.5)
    axes[0].set_yscale('log')
    axes[0].set_title("Approval Delay Days vs Sanction Amount ₹")
    axes[0].set_xlabel("Approval Delay (Days from Recommendation to Sanction)")
    axes[0].set_ylabel("Sanction Amount ₹ (Log Scale)")
    axes[0].legend()

    # Plot 2: Top categories with anomalies
    cat_anomaly_counts = df[df['is_anomaly']]['work_category'].value_counts().head(8)
    cat_anomaly_counts.plot(kind='barh', ax=axes[1], color='darkorange')
    axes[1].set_title("Top Work Categories with Highest Detected Anomalies")
    axes[1].set_xlabel("Anomaly Count")
    axes[1].invert_yaxis()

    plt.tight_layout()
    plot_path = os.path.join(REPORTS_DIR, "sanction_anomalies.png")
    plt.savefig(plot_path, dpi=200)
    plt.close()
    logger.info(f"Saved plot to {plot_path}")

    return anomalies_df

def run_anomaly_detection():
    logger.info("Connecting to DuckDB database...")
    con = duckdb.connect(DB_PATH)

    exp_anomalies = detect_expenditure_anomalies(con)
    sanc_anomalies = detect_sanction_anomalies(con)

    con.close()

    logger.info("\n" + "="*60)
    logger.info("ISOLATION FOREST ANOMALY DETECTION COMPLETED")
    logger.info(f"Expenditure Anomalies: {len(exp_anomalies):,} records")
    logger.info(f"Sanctioned Works Anomalies: {len(sanc_anomalies):,} records")
    logger.info(f"Reports & Plots saved to: {REPORTS_DIR}")
    logger.info(f"Flagged Datasets saved to: {ANOMALY_DIR}")
    logger.info("="*60)

if __name__ == "__main__":
    run_anomaly_detection()

