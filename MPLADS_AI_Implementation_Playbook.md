# NIRIKSHAK 2.0 (MPLADS AI) - Project Implementation & Reverse-Engineering Playbook

This document is a complete reverse-engineering and implementation blueprint of the NIRIKSHAK 2.0 (MPLADS Anomaly Investigation Layer) software project. It explains how every major feature was designed, how data flows through the application, the architectural decisions made, and how to use this exact blueprint to implement similar AI-powered monitoring systems in other domains (e.g., healthcare grants, public works).

---

## 1. Project Analysis & Overview

The project is an AI-powered analytical decision-support system designed to monitor, track, and flag anomalies in public expenditure (specifically MPLADS - Members of Parliament Local Area Development Scheme). It operates as a full-stack platform with a React-based frontend and a Python-based backend that orchestrates multiple machine learning models over an OLAP database.

**Key Discoveries during Reverse-Engineering:**
* **Frontend:** Next.js 16 (App Router) is used. The entire investigation portal is surprisingly consolidated into a single monolithic view (`frontend/app/page.tsx`) utilizing a tabbed interface, rather than deeply nested routing. It relies heavily on `recharts` for visualization and `react-simple-maps` for the geospatial (India map) UI.
* **Backend:** FastAPI handles HTTP requests, serving both JSON data and generating PDF reports. It acts as an orchestrator that calls down into the `models/` and `pipelines/` modules.
* **Database Layer:** DuckDB is used as a fast, analytical, embedded database. The backend reads from `parliament_data.duckdb` via raw SQL.
* **ML Layer:** Highly sophisticated. It uses a "6-model consensus" approach. It doesn't rely on just one model, but rather specific models for specific anomaly types (Prophet for time-series forecasting, Sentence-BERT for NLP dedup, CoxPH for survival/delay analysis, Isolation Forest for cost anomalies, NetworkX for vendor collusion, and XGBoost for unified risk scoring).

---

## 2. Project Architecture

```text
User
 ↓ (HTTP / Web Interactions)
Frontend (Next.js / Tailwind / Recharts / Map)
 ↓ (REST API via Axios/Fetch)
API / Backend (FastAPI / Uvicorn)
 ↓ (Unified Sync Orchestrator)
Business Logic (RBAC / Routing / Aggregation)
 ↓ 
Database (DuckDB) ↔ ML Models (Joblib / Scikit / HuggingFace / Prophet)
 ↓ (JSON / PDF)
Response
 ↓
Frontend State (React useState/useEffect)
 ↓
UI Rendering (Dashboards / Modal Dossiers)
```

### Technology Stack

* **Frontend:** Next.js (React), Tailwind CSS (styling), Lucide React (icons), Recharts (charts), react-simple-maps + topojson-client (interactive maps).
  * *Why:* Next.js offers rapid UI development and Turbopack for fast builds. Recharts is lightweight for dashboards.
* **Backend:** FastAPI, Uvicorn, Pydantic.
  * *Why:* Python is required for the ML stack, making FastAPI the fastest, type-safe API framework to bridge Python ML with the web.
* **Database:** DuckDB.
  * *Why:* It's an in-process SQL OLAP database. It avoids the overhead of managing a Postgres cluster while easily handling millions of rows for analytical GROUP BY/SUM queries in milliseconds.
* **Machine Learning:** Scikit-learn (Isolation Forest), Prophet (Time Series), Sentence-Transformers (NLP), Lifelines (CoxPH Survival), XGBoost, NetworkX.
  * *Why:* Domain-specific model matching. You cannot use a single LLM to accurately forecast time-series data or detect topological network collusion.

---

## 3. Project Folder Structure

```text
RS/
├── backend_api.py                 # Core FastAPI entry point. Defines all API routes.
├── anomaly_detection.py           # Legacy/Core ML script for Isolation Forest execution
├── frontend/                      # Next.js Application
│   ├── app/
│   │   ├── globals.css            # Tailwind directives
│   │   ├── layout.tsx             # Root HTML/Body layout
│   │   ├── page.tsx               # Main Portal (Tabs: Overview, Investigation, Graphs, etc.)
│   │   └── projects/page.tsx      # Filtered table view for specific state/district drilling
│   ├── components/
│   │   ├── header.tsx             # Global top navigation
│   │   ├── hero.tsx               # Renders the India Map component
│   │   └── ui/india-map.tsx       # Interactive TopoJSON map of India states/cities
│   └── public/data/               # Contains india-states.json (TopoJSON)
├── models/                        # ML Model Logic
│   ├── delay_prediction_module.py       # Cox Proportional Hazards (Survival) model
│   ├── expenditure_forecasting_module.py# Prophet time-series model
│   ├── sentence_bert_model.py           # Semantic duplicate detection (DRISHTI)
│   ├── vendor_collusion_graph_module.py # NetworkX graph analysis
│   └── xgboost_risk_scoring_module.py   # Unified risk prediction
├── pipelines/                     # Data ETL & Orchestration
│   ├── etl_pipeline.py            # Cleans raw CSVs and loads into DuckDB
│   ├── build_investigation_master.py # Joins tables for the central analytical view
│   └── unified_sync_orchestrator.py  # Fans out requests to all 6 ML models & DB
├── reports/
│   └── audit_dossier_generator.py # Generates statutory PDF reports using ReportLab/FPDF
└── data_processed/                # Database & Model artifacts
    ├── parliament_data.duckdb     # The live DuckDB database file
    └── models/                    # Saved .joblib model files
```

---

## 4. Feature-by-Feature Reverse Engineering

### Feature A: Unified Composite Risk Investigation (The Dossier)

**A. What the Feature Does**
When a user clicks on a flagged project, it opens a "Statutory Audit Dossier" modal. The system aggregates signals from 6 different ML models to generate a composite risk score and plain-English reasons for the anomaly.

**B. User Flow**
```text
User clicks project row in Investigation Queue
      ↓
Frontend `setActiveProjectId()` state triggers modal open
      ↓
API request `GET /api/works/{id}/detail`
      ↓
Backend calls `unified_sync_orchestrator.py` -> `sync_work_record()`
      ↓
Orchestrator queries DuckDB for project base data
      ↓
Orchestrator fires inference across XGBoost, Prophet, Sentence-BERT, CoxPH concurrently
      ↓
Orchestrator aggregates results into a single JSON profile
      ↓
Frontend receives response, populates Dossier UI cards
```

**C. Files Involved**
| File | Responsibility |
| ---- | -------------- |
| `backend_api.py` | Exposes `/api/works/{id}/detail` endpoint. |
| `pipelines/unified_sync_orchestrator.py` | Contains `sync_work_record()`. Coordinates ML models. |
| `frontend/app/page.tsx` | Renders the Dossier modal UI (around line 1500+). |

**D. Edge Cases**
* *Model Failure:* If one model (e.g., SBERT) fails to load or times out, the orchestrator handles the exception and returns `null` for that specific drill-down module, allowing the rest of the dossier to load.
* *Data Sparsity:* If a project has no delay data, the CoxPH model falls back to a baseline prediction.

### Feature B: Interactive Geographic Investigation (India Map)

**A. What the Feature Does**
A large interactive map of India on the home screen. Hovering over a state shows its project statistics. Clicking a state scopes the entire application (via URL parameters) to that specific jurisdiction.

**B. Implementation Logic**
1. `page.tsx` renders `<Hero>` which renders `<IndiaMap>`.
2. `<IndiaMap>` uses `react-simple-maps` and loads `india-states.json` TopoJSON.
3. On hover, a local React state `hoveredState` triggers a tooltip rendering `framer-motion` animations.
4. On click, `onStateSelect` pushes to the router `/?state=StateName`.

### Feature C: DRISHTI (NLP Duplicate Detection)

**A. What the Feature Does**
Uses Sentence-BERT to detect if a proposed public work has already been executed under a different name (e.g., "Construction of Road in Village X" vs. "CC Road building at Village X").

**B. Data Flow**
```text
User inputs query string
 ↓
FastAPI `/api/nlp/check-duplicate`
 ↓
`sentence_bert_model.py` loads `all-MiniLM-L6-v2`
 ↓
Generates text embedding vector
 ↓
Computes Cosine Similarity against all historical project embeddings in DuckDB/FAISS
 ↓
Returns pairs with > 0.82 similarity
 ↓
Frontend renders "Matched Works" table
```

### Feature D: Role-Based Access Control (RBAC) Scoping

**A. What the Feature Does**
Restricts the analytical view based on the user's role (Ministry, State Nodal, District IDA, MP).

**B. Implementation Logic**
In `page.tsx`, a dropdown sets `rbacRole` and `rbacEntity`. This state is passed as parameters to endpoints like `/api/dashboard/{role}/{entity_id}`. The backend uses these variables to dynamically alter the `WHERE` clauses in DuckDB (e.g., `WHERE state = ?` vs `WHERE district = ?`).

---

## 5. Database & Data Model

**Technology:** DuckDB (Embedded OLAP).

**Schema Structure:**
```text
[project_investigations] (The Master Materialized View)
  - project_id (PK)
  - state, district, constituency, mp_name
  - work_category, sanction_amount, total_expenditure, delay_days_filled
  - anomaly_flag (Boolean)
  - risk_level (CRITICAL, HIGH, MEDIUM, LOW)
  - priority_score (Float 0-100)

[expenditure_works]
  - Used for Prophet time-series forecasting (transactional ledgers)

[allocated_limits]
  - Used to track budget vs. expenditure constraints
```

**Important Queries:**
The system avoids ORMs (like SQLAlchemy) and uses Raw SQL for performance.
Example Aggregation:
```sql
SELECT state, COUNT(*), SUM(CASE WHEN anomaly_flag = true THEN 1 ELSE 0 END) 
FROM project_investigations GROUP BY state
```

---

## 6. API Documentation

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| GET | `/api/meta` | Retrieves dropdown lists (States, Districts, Categories). |
| GET | `/api/anomalies/states` | Nationwide aggregation stats by state. |
| GET | `/api/states/{state}` | State-specific drill-down stats. |
| GET | `/api/works/{id}/detail` | Full 6-model drill-down for a specific project. |
| GET | `/api/dashboard/{role}/{entity}` | RBAC-scoped aggregated metrics. |
| GET | `/api/forecast/mp/{mp_name}` | Prophet time-series prediction for an MP. |
| POST | `/api/nlp/check-duplicate` | Sentence-BERT semantic search for string inputs. |
| GET | `/api/works/{id}/dossier-pdf` | Returns a generated PDF file. |

---

## 7. Frontend Implementation

* **Pages:** Single-page architecture heavily utilizing conditional rendering (`activeTab === 'overview'`).
* **State Management:** Standard React `useState` and `useEffect`. Data fetching is done via native `fetch()` inside `useEffects` based on dependency arrays (e.g., `[activeTab, rbacEntity]`).
* **Dynamic Rendering:** Recharts requires data arrays formatted strictly as `[{name: 'X', value: 10}]`. The backend specifically formats dict records (`orient="records"`) so the frontend can pass them directly to `<BarChart data={data}>`.
* **Routing:** `useRouter()` is used for shallow routing to sync state with URL query parameters (e.g., `/projects?state=UP`).

---

## 8. Backend Implementation

* **Lifecyle:** Request -> FastAPI Route -> Pydantic Validation (for POSTs) -> Orchestrator function -> DuckDB Query -> Model Inference -> JSON Serialization -> Response.
* **Initialization:** Models (`exp_bundle`, `sanc_bundle`) are loaded into global memory *on startup* (lines 38-39 of `backend_api.py`). Lazy loading is used for heavier models like SBERT (`get_sbert()`) so the API starts fast and loads the 400MB NLP model only when the specific tab is clicked.

---

## 9. Machine Learning / Data Science Implementation

This is the core intellectual property of the project.

1. **Isolation Forest (Cost Anomaly):** 
   * Trained on `sanction_amount` vs `work_category` means. Flags statistical outliers.
2. **Prophet (Expenditure Forecasting):**
   * Preprocessing: Groups daily transactions into monthly buckets (`DATE_TRUNC`).
   * Feature Engineering: Adds `Indian Governance Regressors` (e.g., "March Rush" end-of-financial-year spending spikes).
3. **Cox Proportional Hazards (Delay Survival):**
   * Survival analysis. Predicts the *probability* a project will be completed at day 30, 90, 365. Used instead of linear regression because project delays are "right-censored" (some projects aren't finished yet).
4. **Sentence-BERT (DRISHTI):**
   * Uses `all-MiniLM-L6-v2`. Converts project descriptions to 384-dimensional vectors. Uses FAISS/Cosine Similarity to find semantic matches despite spelling differences.

---

## 10. Configuration & Environment

Configuration is currently handled natively in the OS or hardcoded relative paths.
* **Database Path:** `os.path.join(BASE_DIR, "data_processed", "parliament_data.duckdb")`
* **Ports:** FastAPI runs on `:8080`, Next.js runs on `:3001`.

---

## 11. Installation & Setup

```bash
# 1. Clone & Python Environment
git clone <repo>
cd RS
python -m venv .venv
source .venv/Scripts/activate # Windows
pip install -r requirements.txt

# 2. Build Database (if missing)
python -c "from pipelines.etl_pipeline import run_etl; run_etl()"
python -c "from pipelines.build_investigation_master import build_investigation_master; build_investigation_master()"

# 3. Start Backend
python -m uvicorn backend_api:app --host 127.0.0.1 --port 8080 --reload

# 4. Start Frontend
cd frontend
npm install
npm run dev -- --port 3001
```

---

## 12. Reusable Implementation Blueprint (Migration Guide)

To implement this platform for a different domain (e.g., **Healthcare Grants Monitoring**):

### Data Mapping
* `state`/`district` -> `region` / `hospital_zone`
* `mp_name` -> `grant_administrator` or `hospital_director`
* `sanction_amount` -> `grant_disbursement`

### Implementation Steps for Target Project
1. **The Database:** Create an ETL script that merges your relational data into a single, flat DuckDB table (`grant_investigations`). Do not use heavily normalized tables for the dashboard—use a materialized flat view.
2. **The ML Layer:** 
   * Retrain Isolation Forest on `grant_amount` grouped by `medical_equipment_category`.
   * Retrain Sentence-BERT on `grant_justification_text` to catch duplicate grant requests.
3. **The API:** Copy the `unified_sync_orchestrator.py` pattern. Expose one endpoint `/api/grants/{id}/detail` that fans out to your ML models.
4. **The Frontend:** Use Next.js + Recharts. Implement the "Tab" pattern used in `page.tsx`. Create a Dossier Modal that fetches the unified API endpoint.

---

## 13. Development Process & Common Mistakes

**Recommended Process:** Data Engineering (DuckDB) -> ML Model Training (.joblib generation) -> FastAPI Endpoints -> Frontend Charts -> Frontend Maps.

**Technical Debt & Lessons Learned in this Project:**
1. **Fat Frontend Component:** `frontend/app/page.tsx` is >2500 lines long. *Improvement:* Break tabs (Overview, Evaluation, DRISHTI) into separate React components inside `frontend/components/tabs/`.
2. **Hardcoded Ports:** The frontend fetches `http://127.0.0.1:8080` directly. *Improvement:* Use `NEXT_PUBLIC_API_URL` environment variables.
3. **Duplicate State Declarations:** The Turbopack cache often gets stuck on duplicate `useState` definitions when refactoring monolithic files. *Improvement:* Extract state up to context providers or use Zustand/Redux.

---

## 14. Final Reusable Checklist

* [ ] **Data Pipeline:** Raw CSV/DB -> ETL -> DuckDB Flat Master Table.
* [ ] **ML Models Trained:** Isolation Forest, SBERT, Prophet saved to `/models/`.
* [ ] **Backend Services:** `unified_sync_orchestrator` created to manage model fan-out.
* [ ] **API Layer:** FastAPI routes built, CORS configured.
* [ ] **Frontend Shell:** Next.js initialized, Tailwind configured.
* [ ] **Geospatial Map:** TopoJSON wired to React-Simple-Maps with hover states.
* [ ] **Analytics Dashboard:** Recharts wired to API aggregation endpoints.
* [ ] **Investigation Modal (Dossier):** UI built to display composite ML risks.
* [ ] **RBAC Filters:** Global state variables (Role, Entity) applied to all data fetches.

