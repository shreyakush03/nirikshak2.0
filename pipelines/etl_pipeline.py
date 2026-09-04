import os
import re
import sys
import glob
import logging
import sqlite3
import warnings
import pandas as pd
import duckdb

# Silence minor pandas warnings for cleaner CLI output
warnings.filterwarnings("ignore")

# Configure logging with explicit flush
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(os.path.dirname(WORKSPACE), "data_processed")
PARQUET_DIR = os.path.join(PROCESSED_DIR, "parquet")
CSV_CLEAN_DIR = os.path.join(PROCESSED_DIR, "cleaned_csv")
DB_PATH = os.path.join(PROCESSED_DIR, "parliament_data.duckdb")
SQLITE_DB_PATH = os.path.join(PROCESSED_DIR, "parliament_data.sqlite")

os.makedirs(PARQUET_DIR, exist_ok=True)
os.makedirs(CSV_CLEAN_DIR, exist_ok=True)

TABLE_FILE_MAP = {
    "allocated_limits": {
        "LS": "Allocated Limit for Honble MPs*.csv",
        "RS": "Allocated Limit for Honble MPs*.csv"
    },
    "calamity_consents": {
        "LS": "Amount consented for Calamity*.csv",
        "RS": "Amount consented for Calamity*.csv"
    },
    "expenditure_works": {
        "LS": "Expenditure on Completed and On-going Works*.csv",
        "RS": "Expenditure on Completed and On-going Works*.csv"
    },
    "works_completed": {
        "LS": "Works Completed*.csv",
        "RS": "Works Completed*.csv"
    },
    "works_recommended": {
        "LS": "Works Recommended*.csv",
        "RS": "Works Recommended*.csv"
    },
    "works_sanctioned": {
        "LS": "Works Sanctioned*.csv",
        "RS": "Works Sanctioned*.csv"
    }
}

def clean_column_name(col: str) -> str:
    col = col.strip()
    col = re.sub(r'[\ufeff"]', '', col)
    col = re.sub(r'\s*\([^\)]*₹[^\)]*\)', '', col)
    col = re.sub(r'₹', '', col)
    col = col.strip()
    col = col.replace("Hon'ble Members of Parliaments", "mp_name")
    col = col.replace("Hon'ble Members of Parliament", "mp_name")
    col = col.replace("Hon'ble Member", "mp_name")
    col = col.replace("Elected/Nominated", "election_type")
    
    col = re.sub(r'[^\w\s]', '_', col)
    col = re.sub(r'\s+', '_', col)
    col = re.sub(r'_+', '_', col).strip('_').lower()
    
    alias_map = {
        'sr_no': 'sr_no',
        'state': 'state',
        'constituency': 'constituency',
        'allocated_amount': 'allocated_amount',
        'calamity_type': 'calamity_type',
        'calamity_name': 'calamity_name',
        'date_of_consent': 'consent_date',
        'consent_amount': 'consent_amount',
        'work': 'work_title',
        'work_id': 'work_id',
        'ida': 'ida',
        'expenditure_date': 'expenditure_date',
        'vendor_name': 'vendor_name',
        'payment_status': 'payment_status',
        'fund_disbursed_amount': 'disbursed_amount',
        'amount_disbursed': 'disbursed_amount',
        'work_category': 'work_category',
        'work_description': 'work_description',
        'image': 'image_url',
        'completion_date': 'completion_date',
        'recommended_date': 'recommended_date',
        'recommended_amount': 'recommended_amount',
        'sanction_date': 'sanction_date',
        'sanction_amount': 'sanction_amount',
        'work_status': 'work_status'
    }
    return alias_map.get(col, col)

def find_dataset_file(folder: str, pattern: str) -> str:
    matches = glob.glob(os.path.join(WORKSPACE, folder, pattern))
    if not matches:
        raise FileNotFoundError(f"No file matching {pattern} found in {folder}")
    return matches[0]

def clean_amount_series(series: pd.Series) -> pd.Series:
    s = series.astype(str).str.replace(r'[^0-9.-]', '', regex=True)
    return pd.to_numeric(s, errors='coerce')

def clean_date_series(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors='coerce', dayfirst=True)

def extract_and_transform(table_key: str) -> pd.DataFrame:
    dfs = []
    
    for house, folder in [("Lok Sabha", "LS_DATASET"), ("Rajya Sabha", "RS_DATASET")]:
        pattern = TABLE_FILE_MAP[table_key]["LS" if house == "Lok Sabha" else "RS"]
        file_path = find_dataset_file(folder, pattern)
        logger.info(f"Extracting [{table_key}] for [{house}] from {os.path.basename(file_path)}")
        sys.stdout.flush()
        
        try:
            df = pd.read_csv(file_path, encoding='utf-8', low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding='latin1', low_memory=False)
        
        df.columns = [clean_column_name(c) for c in df.columns]
        df['house'] = house
        df['source_file'] = os.path.basename(file_path)
        
        if 'constituency' not in df.columns:
            df['constituency'] = None
        if 'election_type' not in df.columns:
            df['election_type'] = None
            
        dfs.append(df)
        
    combined_df = pd.concat(dfs, ignore_index=True)
    
    amount_cols = [c for c in combined_df.columns if any(k in c for k in ['amount', 'disbursed', 'limit'])]
    for col in amount_cols:
        combined_df[col] = clean_amount_series(combined_df[col])
        
    date_cols = [c for c in combined_df.columns if 'date' in c]
    for col in date_cols:
        combined_df[col] = clean_date_series(combined_df[col])
        
    for col in combined_df.select_dtypes(include=['string', 'object']).columns:
        combined_df[col] = combined_df[col].astype(str).str.strip().replace({'nan': None, 'None': None, '': None})
        
    if 'sr_no' in combined_df.columns:
        combined_df.drop(columns=['sr_no'], inplace=True, errors='ignore')
        
    logger.info(f"Transformed [{table_key}]: total rows = {len(combined_df):,}")
    sys.stdout.flush()
    return combined_df

def load_data(tables: dict):
    logger.info(f"Loading datasets into DuckDB and SQLite...")
    sys.stdout.flush()
    duck_conn = duckdb.connect(DB_PATH)
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    
    for table_name, df in tables.items():
        parquet_path = os.path.join(PARQUET_DIR, f"{table_name}.parquet")
        df.to_parquet(parquet_path, index=False)
        
        csv_path = os.path.join(CSV_CLEAN_DIR, f"{table_name}.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8')
        
        duck_conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df")
        
        sqlite_df = df.copy()
        for col in sqlite_df.select_dtypes(include=['datetime64', 'datetimetz']).columns:
            sqlite_df[col] = sqlite_df[col].dt.strftime('%Y-%m-%d')
        sqlite_df.to_sql(table_name, sqlite_conn, if_exists='replace', index=False)
        
        logger.info(f"Loaded {table_name} ({len(df):,} rows) -> Parquet, CSV, DuckDB & SQLite")
        sys.stdout.flush()
        
    duck_conn.close()
    sqlite_conn.close()

def run_etl():
    logger.info("Starting Parliament MPLADS ETL Pipeline (Lok Sabha & Rajya Sabha)...")
    sys.stdout.flush()
    transformed_tables = {}
    
    for table_key in TABLE_FILE_MAP.keys():
        transformed_tables[table_key] = extract_and_transform(table_key)
        
    load_data(transformed_tables)
    
    logger.info("\n" + "="*50 + "\nETL PIPELINE SUMMARY\n" + "="*50)
    duck_conn = duckdb.connect(DB_PATH)
    for table_name in transformed_tables.keys():
        count = duck_conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        ls_count = duck_conn.execute(f"SELECT COUNT(*) FROM {table_name} WHERE house = 'Lok Sabha'").fetchone()[0]
        rs_count = duck_conn.execute(f"SELECT COUNT(*) FROM {table_name} WHERE house = 'Rajya Sabha'").fetchone()[0]
        logger.info(f"  * {table_name:20}: Total={count:>8,} | Lok Sabha={ls_count:>7,} | Rajya Sabha={rs_count:>6,}")
    duck_conn.close()
    
    logger.info("="*50)
    logger.info("ETL Pipeline completed successfully.")
    sys.stdout.flush()

if __name__ == "__main__":
    run_etl()

