# Vendor Collusion & Monopoly Network Analysis (NetworkX)

## 1. Overview & Architectural Role
As specified in **Section 3.6 of the MPLADS ML Integration Guide**, single-transaction anomaly detection cannot detect institutionalized corruption rings where:
1. A single vendor captures a monopolistic share of all development contracts within a constituency.
2. A single contractor syndicate operates across multiple distinct MP jurisdictions and administrative implementing agencies (IDAs) simultaneously.

DRISHTI implements a **Multi-partite Graph Network Analysis Engine** using `networkx` to model interactions between **Vendors**, **Constituencies**, and **MPs**, computing concentration shares, degree distributions, and identifying high-risk procurement collusion.

---

## 2. Graph Formulation

```
      (MP A)              (MP B)              (MP C)
        │                   │                   │
        │ Patronage         │ Patronage         │ Patronage
        ▼                   ▼                   ▼
    [Vendor 1] ───Disbursement───► [Constituency X] ◄───Disbursement─── [Vendor 2]
        │
        └─────────Disbursement───► [Constituency Y]
```

- **Nodes $V$**:
  - `VENDOR`: Contractors and agencies receiving MPLADS disbursements ($28,000+$ distinct vendors in the corpus).
  - `CONSTITUENCY`: Parliamentary constituencies and districts.
  - `MP`: Sitting or former Members of Parliament recommending works.
- **Edges $E$**:
  - `DISBURSEMENT`: Weighted by cumulative disbursed amount (₹) and transaction count.
  - `PATRONAGE`: Weighted by cumulative allocation approved by the MP.

---

## 3. Core Graph Analytics Algorithms

### 3.1 Local Monopoly Detection (Constituency Concentration Share)
For vendor $v$ and constituency $c$:

$$\text{Concentration Share}(v, c) = \frac{\sum_{e \in E(v, c)} \text{Disbursed}(e)}{\sum_{u \in V_{\text{vendor}}} \sum_{e \in E(u, c)} \text{Disbursed}(e)}$$

- **Alert Trigger**: Any vendor holding **$\ge 30\%$** of all recorded disbursements in a constituency (with minimum outlay $\ge ₹10$ Lakhs) is flagged as a procurement monopoly.
- **Extreme Outlier**: Vendors holding **$\ge 60\%$** (up to $100\%$) are flagged as `HIGH MONOPOLY`.

### 3.2 Cross-MP Syndicate Detection
Aggregates distinct MP jurisdictions awarded to the same vendor:
- Flags vendors executing projects across **$\ge 3$ distinct MPs** with $> ₹50$ Lakhs in total disbursed public funds.
- Detects multi-district syndicates bypassing local competitive bidding procedures.

---

## 4. API Endpoints

### `GET /api/graph/vendor-collusion`
**Query Parameters:**
- `state`: Filter by specific State/UT or `All`.
- `threshold`: Minimum concentration percentage (default `0.30` = 30%).

**Response Structure:**
```json
{
  "monopoly_alerts": [
    {
      "vendor_name": "ATANU PATRA",
      "constituency": "PURULIA",
      "state": "West Bengal",
      "mp_name": "Shri Jyotirmay Singh Mahato",
      "vendor_disbursed_cr": 1.171,
      "total_const_disbursed_cr": 1.17,
      "concentration_share_pct": 100.0,
      "works_count": 31,
      "risk_signal": "HIGH MONOPOLY",
      "explanation": "Vendor captured 100.0% of all recorded MPLADS disbursements in PURULIA (Rs. 1.17 Cr)."
    }
  ],
  "syndicate_alerts": [
    {
      "vendor_name": "KRIDL BHUSIRI ACCOUNT WORKS",
      "distinct_mps": 20,
      "distinct_constituencies": 17,
      "states_covered": 1,
      "total_disbursed_cr": 24.89,
      "risk_signal": "CROSS-REPRESENTATIVE CONCENTRATION",
      "explanation": "Operates across 20 separate MP jurisdictions across 17 constituencies."
    }
  ],
  "total_monopolies_flagged": 50,
  "total_syndicates_flagged": 30,
  "graph_visualization": {
    "nodes": [...],
    "edges": [...]
  }
}
```

---

## 5. UI Integration
Inside DRISHTI (`frontend/app/page.tsx`):
- Dedicated **"Vendor Collusion"** tab with Network icon (`<Network />`).
- **Interactive Controls**: State/UT selector, concentration threshold slider (20%, 30%, 50%).
- **KPI Summary**: Monopoly Alert Instances, Multi-MP Syndicates, Network Nodes & Edges mapped.
- **Constituency Monopolies Table**: Displays vendor capture share %, total expenditure, MP attribution, and audit explanation.
- **Cross-MP Syndicate Cards**: Displays inter-jurisdictional contractors spanning 5–20+ MPs simultaneously.
