# Member of Parliament Local Area Development Scheme (MPLADS)
## AI & Machine Learning Anomaly Detection, Duplicate Detection & Risk Governance Platform

---

## 📁 Repository Organization

```
RS/
├── 📁 models/                     # Individual ML Model Implementations
│   ├── anomaly_detection.py       # Isolation Forest (Cost & Sanctions Outliers)
│   ├── sentence_bert_model.py     # Sentence-BERT Semantic Duplicate Detection
│   ├── expenditure_forecasting_module.py # Prophet Expenditure Trend Forecasting
│   ├── delay_prediction_module.py # Cox Proportional Hazards Delay Prediction
│   ├── vendor_collusion_graph_module.py  # Bipartite Network Collusion Analysis
│   └── xgboost_risk_scoring_module.py    # Supervised XGBoost Priority Scorer
│
├── 📁 ensemble/                   # Step 3 Aggregation / Ensemble Layer
│   └── aggregate.py               # Canonical weighted risk aggregator & reasons builder
│
├── 📁 pipelines/                  # Data Pipelines & ETL Orchestration
│   ├── etl_pipeline.py            # Raw CSV to DuckDB & Parquet ETL
│   ├── build_investigation_master.py # Master investigation warehouse table builder
│   ├── train_models.py            # Batch model training runner
│   ├── evaluate_anomalies.py      # Anomaly evaluation benchmarks
│   └── unified_sync_orchestrator.py # Multi-Model Fan-Out / Fan-In Sync Orchestrator
│
├── 📁 docs/                       # Technical & Mathematical Documentation
│   ├── COMPLETE_MPLADS_ML_SYSTEM_DOCUMENTATION.md
│   ├── ANOMALY_DETECTION_PIPELINE_EXPLANATION.md
│   ├── PROPHET_EXPENDITURE_FORECASTING_DOCUMENTATION.md
│   ├── COXPH_SURVIVAL_DELAY_PREDICTION.md
│   ├── VENDOR_COLLUSION_GRAPH_DOCUMENTATION.md
│   ├── XGBOOST_RISK_SCORING_DOCUMENTATION.md
│   └── STEP_4_UNIFIED_API_DOCUMENTATION.md
│
├── 📁 data_processed/             # Processed DuckDB, Serialized Models & Anomaly Files
├── 📁 frontend/                   # Next.js 16 Web Dashboard Application
├── 🚀 backend_api.py              # Main FastAPI Application Service (Port 8080)
├── ⚡ start_portal.bat             # One-click startup script for backend & frontend
└── 📄 requirements.txt            # Python dependencies
```

---

## 🚀 Quick Start

### 1. Launch Backend & Frontend
Run the one-click startup script:
```cmd
start_portal.bat
```
* **FastAPI Backend**: `http://127.0.0.1:8080` (Swagger UI: `http://127.0.0.1:8080/docs`)
* **Next.js Web Portal**: `http://localhost:3000`

### 2. Run Individual Models
```bash
# Run Anomaly Detection
python models/anomaly_detection.py

# Run CoxPH Survival Analysis
python models/delay_prediction_module.py

# Run XGBoost Risk Scoring
python models/xgboost_risk_scoring_module.py

# Run Vendor Collusion Graph Analysis
python models/vendor_collusion_graph_module.py
```
