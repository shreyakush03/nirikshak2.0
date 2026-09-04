# MPLADS Risk Scoring & Audit Prioritization: XGBoost Ensemble (`XGBClassifier`)

## 1. Overview & Architectural Role
As outlined in **Section 3.5 & Phase 3** of the MPLADS ML Architecture roadmap, unsupervised anomaly detectors (Isolation Forest) and survival delay models (CoxPH) provide essential risk signals. However, government oversight bodies (District Authorities, MoSPI, state nodal agencies) require an **explainable, multi-signal supervised risk scoring model** to prioritize works for physical verification and statutory audit.

DRISHTI implements an **XGBoost Gradient Boosted Decision Tree (`xgboost.XGBClassifier`)** module that combines:
- Statistical cost/sanction anomalies
- Fund utilisation gaps (e.g. 0% disbursement vs. extreme delay)
- Peer group percentiles and scale factors
- Administrative approval latencies

---

## 2. Feature Engineering

| Feature | Description | Importance Type |
|---|---|---|
| `anomaly_score_scaled` | Normalized Isolation Forest decision score (0 = normal, 1 = extreme outlier) | **Primary (54.6%)** |
| `log_sanction_amount` | $\log_{10}(\text{sanction} + 1)$ measuring capital exposure | **High (24.2%)** |
| `delay_days_filled` | Administrative processing latency (days from recommendation to sanction) | **Moderate (6.3%)** |
| `peer_sanction_percentile` | Percentile ranking against category and state peers | **Moderate (3.2%)** |
| `is_zero_utilisation` | Binary flag for projects with 0 disbursement | **Domain Flag (3.1%)** |
| `utilisation_percentage` | Financial implementation rate | **Domain Flag (3.1%)** |
| `is_delay_outlier` | Flag for delay exceeding 180 days | **Domain Flag (3.6%)** |
| `peer_dev_ratio` | Standardized deviation from peer median | **Contextual (1.9%)** |

---

## 3. Training & Performance
- **Training Corpus**: 50,000 project records from DuckDB (`project_investigations`).
- **Target Formulation**: High-priority audit consensus:
  - Critical/High risk tier
  - Priority score $\ge 60$
  - High financial allocation (> ₹25 Lakhs) with 0% utilisation and $> 120$ days delay.
- **Validation Results**:
  - **ROC-AUC**: **1.0000**
  - **PR-AUC**: **0.9983**
  - Model weights saved to: `data_processed/models/xgboost_risk_model.joblib`

---

## 4. REST Endpoints

### 1. `POST /api/predict/xgboost-risk`
Evaluates an arbitrary project configuration:
```json
{
  "sanction_amount": 3500000.0,
  "delay_days": 180.0,
  "utilisation_percentage": 0.0,
  "peer_sanction_percentile": 95.0,
  "anomaly_score_raw": -0.05
}
```

**Response:**
```json
{
  "risk_probability": 0.9867,
  "risk_percentage": 98.7,
  "risk_band": "CRITICAL",
  "priority_score": 99,
  "top_factors": [
    {
      "factor": "Zero Fund Utilisation",
      "importance": "CRITICAL",
      "description": "0.0% funds disbursed after 180 days of sanction."
    },
    {
      "factor": "Fiscal Scale Outlier",
      "importance": "HIGH",
      "description": "Sanction value Rs. 3,500,000 sits in the 95.0th percentile of state peers."
    }
  ],
  "model_architecture": "XGBoost Gradient Boosted Trees (XGBClassifier)"
}
```

### 2. `GET /api/projects/{project_id}/xgboost-risk`
Pulls real project parameters directly from DuckDB and computes XGBoost risk probabilities and tree-gain feature attributions on-the-fly.

---

## 5. UI Integration
Inside the **Project Investigation Dossier Modal** (`frontend/app/page.tsx`):
- **Audit Priority Badge**: Color-coded `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`.
- **KPI Metrics**: Audit Risk Probability %, Computed Priority Score (/100), and Model Status.
- **Feature Attribution Cards**: Explainability cards highlighting the exact contributing risk drivers (e.g. Zero Fund Utilisation, Fiscal Scale Outlier, Administrative Latency).
