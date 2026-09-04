# Step 4: Unified Multi-Model Synchronization & Role-Based API Layer

## 1. Overview & Architectural Role
As defined in **Section 1, Section 5, and Section 6 of the MPLADS ML Integration Guide**, the platform requires a **Fan-Out / Fan-In** integration layer. Each model runs independently to answer its specialized question, and the synchronization layer merges all signals into **one unified composite risk score + explanation** per work record.

---

## 2. Multi-Model Fan-In Synchronization Map

```
                     ┌───────────────────────────┐
                     │     Work Record (ID)      │
                     └─────────────┬─────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
 [Isolation Forest]       [Sentence-BERT]              [CoxPH Survival]
 Cost/Sanction Outliers   Semantic Duplicate Check     Right-Censored Delay
      │                            │                            │
      ├────────────────────────────┼────────────────────────────┤
      ▼                            ▼                            ▼
 [Prophet Trends]        [Vendor Collusion]           [XGBoost Classifier]
 March Rush & Lulls      Network Concentration Share  Supervised Priority
      │                            │                            │
      └────────────────────────────┼────────────────────────────┘
                                   │ Fan-in Consensus
                     ┌─────────────▼─────────────┐
                     │ Unified Composite Risk &   │
                     │ Statutory Plain Explanations│
                     └─────────────┬─────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
/api/works/{id}/risk      /api/works/{id}/detail     /api/dashboard/{role}/{id}
High-level Badge & Score   Full Model Specifics       RBAC Scoped Governance
```

### 2.1 Ensemble Weighting Specification (Section 5)
$$\text{Weighted Score} = 0.25 \cdot C_{\text{anomaly}} + 0.20 \cdot S_{\text{dup}} + 0.15 \cdot T_{\text{trend}} + 0.20 \cdot D_{\text{delay}} + 0.20 \cdot V_{\text{vendor}}$$

$$\text{Composite Risk} = 0.40 \cdot \text{Weighted Score} + 0.60 \cdot P_{\text{XGBoost}}$$

- **Banding Thresholds**:
  - $\ge 0.65$: `CRITICAL`
  - $\ge 0.40$: `HIGH`
  - $\ge 0.22$: `MEDIUM`
  - $< 0.22$: `LOW`

---

## 3. Step 4 API Endpoints

### 1. `GET /api/works/{sanction_id}/risk`
Returns high-level consensus for overview tables and dashboards.
```json
{
  "sanction_id": "WS/MP18173/2024-2025/137452",
  "composite_risk_score": 10.8,
  "risk_band": "LOW",
  "reasons": [
    "Parameters lie within normative financial and operational tolerance bounds."
  ],
  "stored_risk_level": "NORMAL",
  "stored_priority_score": 4
}
```

### 2. `GET /api/works/{sanction_id}/detail`
Drill-down API returning individual model outputs for forensic auditors:
- `cost_anomaly`: Isolation Forest raw and normalized anomaly scores.
- `duplicates`: Sentence-BERT top matches and cosine scores.
- `delay_prediction`: CoxPH survival overdue probabilities and milestone curve.
- `vendor_flags`: Concentration share within constituency and monopoly status.
- `xgboost`: Supervised priority score and tree-gain feature drivers.

### 3. `GET /api/dashboard/{role}/{entity_id}`
Role-Based Access Control (RBAC) Scoped Portfolio Governance:
- **`role = 'mp'`**: Scoped to the individual MP name (e.g. `GET /api/dashboard/mp/Pankaj Chowdhary`).
- **`role = 'district'`**: Scoped to the District Authority (e.g. `GET /api/dashboard/district/Varanasi`).
- **`role = 'state'`**: Scoped to State Nodal Agency (e.g. `GET /api/dashboard/state/Tamil Nadu`).
- **`role = 'ministry'`**: Full nationwide oversight portfolio.

---

## 4. UI Integration
Inside the **Project Investigation Dossier Modal** (`frontend/app/page.tsx`):
- Top-level **Step 4 Synchronized Multi-Model Composite Risk Banner**.
- Displays consensus risk badge (`CRITICAL`, `HIGH`, `MEDIUM`, or `LOW RISK BAND`) and final score (/100).
- Dynamically enumerates all multi-model statutory plain-English explanations.
