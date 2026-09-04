# MPLADS Delay Prediction System: Survival Analysis with Cox Proportional Hazards (`CoxPHFitter`)

## 1. Executive Overview & Problem Formulation
In government infrastructure tracking under the Members of Parliament Local Area Development Scheme (**MPLADS**), traditional regression models fail when predicting project completion times because ongoing projects are **right-censored**. Ongoing works have not yet completed; discarding them introduces survivorship bias, while treating their current age as their completion time drastically underestimates project durations.

To solve this, DRISHTI uses **Survival Analysis** via the semi-parametric **Cox Proportional Hazards Model** (`lifelines.CoxPHFitter`).

---

## 2. Mathematical Formulation
For a project $i$ with covariate vector $\mathbf{x}_i$, the hazard of completion at time $t$ (days from sanction) is modeled as:

$$h(t \mid \mathbf{x}_i) = h_0(t) \exp(\mathbf{x}_i^\top \boldsymbol{\beta})$$

where:
- $h_0(t)$ is the non-parametric **baseline hazard** (estimated via the Breslow method).
- $\mathbf{x}_i$ represents project-level covariates (sanction size, approval latency, work category).
- $\boldsymbol{\beta}$ is the vector of estimated hazard regression coefficients.

### 2.1 Right-Censoring Definition
For each project record in DuckDB (`project_investigations`):
- **Event Indicator ($E_i$)**:
  $$E_i = \begin{cases} 1 & \text{if project is completed} \\ 0 & \text{if project is ongoing (right-censored)} \end{cases}$$
- **Duration ($T_i$)**:
  $$T_i = \begin{cases} \text{completion\_duration\_days} & \text{if } E_i = 1 \\ \text{datediff}(\text{'day'}, \text{sanction\_date}, \text{'current\_date'}) & \text{if } E_i = 0 \end{cases}$$

### 2.2 Model Covariates
1. **$\log_{10}(\text{sanction\_amount} + 1)$**: Reflects fiscal scale. Larger capital outlays experience higher structural inertia and procedural scrutiny ($p < 0.005$).
2. **$\text{approval\_delay\_days}$**: Latency between initial proposal recommendation and administrative sanction ($p < 0.005$).
3. **$\text{work\_category}$**: Categorical dummy indicators for major development sectors (e.g., Roads & Bridges, Drinking Water, Education, Community Infrastructure).

---

## 3. Key Outputs & Interpretations

### 3.1 Overdue Risk Probability $P(\text{Overdue} \mid \text{Deadline})$
Given a target completion deadline $D$ (standard benchmark = 365 days) and the current elapsed age $t_{\text{elapsed}}$ of an ongoing project, the conditional probability of exceeding the deadline is:

$$P(T > D \mid T > t_{\text{elapsed}}) = \frac{S(D \mid \mathbf{x}_i)}{S(t_{\text{elapsed}} \mid \mathbf{x}_i)}$$

where $S(t) = \exp\left(-\int_0^t h(u) du\right)$ is the survival function.

### 3.2 Estimated Median Completion Horizon
The estimated median duration $t_{\text{median}}$ is the point in time where the conditional survival probability reaches $50\%$:

$$S(t_{\text{median}} \mid \mathbf{x}_i) \le 0.50 \cdot S(t_{\text{elapsed}} \mid \mathbf{x}_i)$$

### 3.3 Relative Hazard Ratio (Acceleration Factor)
$$\text{Hazard Ratio} = \exp(\mathbf{x}_i^\top \boldsymbol{\beta})$$
- **$\text{HR} > 1.0$**: Above-average completion pace.
- **$\text{HR} < 1.0$**: Elevated probability of execution bottleneck and delay.

---

## 4. Architecture & Integration

```
  +-------------------------------------------------------------------+
  |                      DuckDB Database                              |
  |               (project_investigations table)                      |
  +---------------------------------+---------------------------------+
                                    |
                                    v
  +-------------------------------------------------------------------+
  |              delay_prediction_module.py                           |
  |     - Reads completed & right-censored projects                   |
  |     - Fits CoxPHFitter(penalizer=0.1)                             |
  |     - Serializes to delay_survival_model.joblib                   |
  +---------------------------------+---------------------------------+
                                    |
                                    v
  +-------------------------------------------------------------------+
  |                    FastAPI Backend                                |
  |   - POST /api/predict/delay-risk (Arbitrary profile inputs)       |
  |   - GET  /api/projects/{project_id}/delay-risk (Live DB lookup)   |
  +---------------------------------+---------------------------------+
                                    |
                                    v
  +-------------------------------------------------------------------+
  |                 DRISHTI Next.js Portal                            |
  |   - Project Investigation Dossier Modal                           |
  |   - Overdue Risk Badge & Estimated Median Horizon                 |
  |   - Milestone Survival Likelihood Trajectory (90d -> 1000d)       |
  +-------------------------------------------------------------------+
```

---

## 5. API Endpoints

### 1. `POST /api/predict/delay-risk`
Computes overdue probability, estimated median completion days, and survival curve points.

### 2. `GET /api/projects/{project_id}/delay-risk`
Evaluates survival trajectory on-the-fly directly using historical parameters from DuckDB.
