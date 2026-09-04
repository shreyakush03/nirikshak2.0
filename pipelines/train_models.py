import os
import sys
import logging
import joblib
import duckdb
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(os.path.dirname(WORKSPACE), "data_processed")
MODELS_DIR = os.path.join(PROCESSED_DIR, "models")
DB_PATH = os.path.join(PROCESSED_DIR, "parliament_data.duckdb")

os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_persist_expenditure_model(con):
    logger.info("Training Expenditure Isolation Forest model...")
    df = con.execute("""
        SELECT state, mp_name, vendor_name, disbursed_amount 
        FROM expenditure_works 
        WHERE disbursed_amount IS NOT NULL AND disbursed_amount > 0
    """).df()

    df['log_amount'] = np.log10(df['disbursed_amount'] + 1)
    state_stats = df.groupby('state')['log_amount'].agg(['mean', 'std']).reset_index()
    state_stats['std'] = state_stats['std'].replace(0, 1).fillna(1)
    df = df.merge(state_stats, on='state', how='left')
    df['state_log_deviation'] = (df['log_amount'] - df['mean']) / df['std']
    df['state_log_deviation'] = df['state_log_deviation'].fillna(0)

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

    iso = IsolationForest(n_estimators=150, contamination=0.015, random_state=42, n_jobs=-1)
    iso.fit(X_scaled)

    # Save bundle: model + scaler + lookup statistics
    bundle = {
        'model': iso,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'state_stats': state_stats.set_index('state').to_dict('index'),
        'vendor_stats': vendor_stats.set_index('vendor_name').to_dict('index'),
        'overall_mean': df['log_amount'].mean(),
        'overall_std': df['log_amount'].std()
    }
    model_path = os.path.join(MODELS_DIR, "expenditure_model.joblib")
    joblib.dump(bundle, model_path)
    logger.info(f"Saved expenditure model bundle to {model_path}")

def train_and_persist_sanction_model(con):
    logger.info("Training Sanctioned Works Isolation Forest model...")
    df = con.execute("""
        SELECT work_category, recommended_date, sanction_date, sanction_amount 
        FROM works_sanctioned 
        WHERE sanction_amount IS NOT NULL AND sanction_amount > 0
    """).df()

    df['delay_days'] = (pd.to_datetime(df['sanction_date']) - pd.to_datetime(df['recommended_date'])).dt.days
    df['delay_days_cleaned'] = df['delay_days'].apply(lambda x: x if (pd.notnull(x) and 0 <= x <= 3650) else np.nan)
    median_delay = float(df['delay_days_cleaned'].median())
    df['delay_days_filled'] = df['delay_days_cleaned'].fillna(median_delay)

    df['log_amount'] = np.log10(df['sanction_amount'] + 1)
    cat_means = df.groupby('work_category')['log_amount'].mean().to_dict()
    df['cat_amount_diff'] = df['log_amount'] - df['work_category'].map(cat_means).fillna(df['log_amount'].mean())

    feature_cols = ['log_amount', 'delay_days_filled', 'cat_amount_diff']
    X = df[feature_cols].copy()

    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    iso = IsolationForest(n_estimators=150, contamination=0.015, random_state=42, n_jobs=-1)
    iso.fit(X_scaled)

    bundle = {
        'model': iso,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'median_delay': median_delay,
        'cat_means': cat_means,
        'overall_cat_mean': float(df['log_amount'].mean())
    }
    model_path = os.path.join(MODELS_DIR, "sanction_model.joblib")
    joblib.dump(bundle, model_path)
    logger.info(f"Saved sanction model bundle to {model_path}")

def main():
    con = duckdb.connect(DB_PATH)
    train_and_persist_expenditure_model(con)
    train_and_persist_sanction_model(con)
    con.close()

if __name__ == "__main__":
    main()

