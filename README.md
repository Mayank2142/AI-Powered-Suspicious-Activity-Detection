# AML Suspicious Activity Detection Agent

> AI-powered, agentic AML compliance system built on the IBM AML dataset.
> Architecture: **Dynamic Planner → Tool Registry → Risk Score → Explanation → SAR Draft**

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/Mayank2142/AI-Powered-Suspicious-Activity-Detection.git aml-agent
cd aml-agent
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
copy .env.example .env
# Edit .env — add your GROQ_API_KEY
```

### 3. Download the IBM AML dataset

From Kaggle: `ealtman2019/ibm-transactions-for-anti-money-laundering-aml`
Place `HI-Small_Trans.csv` (or `LI-Small_Trans.csv`) in the `data/` directory.
Update `CSV_PATH` in `.env` if using LI variant.

### 4. Ingest data & run the API

```bash
python -m tools.data_loader          # smoke test + ingest
uvicorn api.main:app --reload        # start FastAPI on :8000
```

### 5. Run the Streamlit UI

```bash
streamlit run ui/streamlit_app.py
```

---

## Collaboration workflow

Development uses the protected `main` branch and the contributor-owned
`mayank` and `devesh` branches. Branch ownership, commit checkpoints, and
push/merge approval rules are defined in
[`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md). Contributor responsibilities
are recorded in [`CONTRIBUTORS.md`](CONTRIBUTORS.md).

---

## Project Structure

```
aml-agent/
├── agent/
│   ├── intent_extractor.py   # LLM-based query → structured intent
│   ├── planner.py            # dynamic tool plan builder
│   ├── validator.py          # allow-list plan validation
│   └── knowledge.py          # BM25 AML typology lookup
├── tools/
│   ├── data_loader.py        # ★ Phase 1 — DuckDB filtered load
│   ├── workflow_store.py     # Investigations, alert queue, append-only audit
│   ├── aggregation.py        # Direct grouped/count threshold queries
│   ├── eda.py                # Phase 5
│   ├── feature_engineering.py# Phase 3
│   ├── rule_engine.py        # Phase 3
│   ├── statistical.py        # Phase 3
│   ├── ml_engine.py          # Phase 3 (Isolation Forest)
│   ├── graph_tool.py         # Phase 5 (conditional)
│   ├── risk_scorer.py        # Phase 4
│   ├── escalation.py         # Phase 4
│   └── explanation.py        # Phase 4 (BM25 + LLM)
├── knowledge_base/
│   ├── fatf_structuring.md
│   ├── fincen_smurfing.md
│   └── typologies.json
├── api/
│   └── main.py               # FastAPI app + model-card endpoint
├── frontend/
│   └── src/                  # Routed investigation workspace
├── ui/
│   └── streamlit_app.py
├── tests/
│   └── test_data_loader.py
├── config.py
├── requirements.txt
└── .env.example
```

---

## Running Tests

```bash
pytest tests/ -v
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Dataset and knowledge-table readiness probe |
| POST | `/ingest` | Trigger CSV → DuckDB ingest |
| GET | `/stats` | Dataset summary statistics |
| GET | `/model-card` | Active Isolation Forest metadata and limitations |
| GET | `/customers` | Bounded, risk-ranked customer/account summaries |
| GET | `/customers/{account_id}` | Customer behavior, relationships, labels, and workflow alerts |
| GET | `/transactions` | Parameterized transaction evidence browser |
| GET | `/transactions/payment-formats` | Available transaction payment formats |
| GET | `/investigations` | Persistent investigation register |
| GET | `/investigations/{id}` | Full retained decision record |
| GET | `/queue` | Risk-ranked analyst review queue |
| GET | `/queue/summary` | Queue status counts |
| POST | `/queue/{id}/assign` | Assign an analyst |
| POST | `/queue/{id}/notes` | Append a governed analyst note |
| POST | `/queue/{id}/disposition` | Close or escalate an alert |
| GET | `/audit` | Read-only immutable activity trail |
| GET | `/policy` | Effective read-only AML risk policy |
| GET | `/datasets` | Governed dataset registry |
| POST | `/datasets/inspect` | Validate and preview a CSV/XLSX upload without retaining it |
| POST | `/datasets/upload` | Fingerprint and ingest a dataset into an isolated workspace |
| GET | `/datasets/{id}` | Governed dataset metadata and detected schema |
| POST | `/datasets/{id}/activate` | Activate a primary or knowledge workspace |
| DELETE | `/datasets/{id}` | Delete an inactive, non-protected workspace |
| GET | `/export/entities` | Flagged entities as CSV, XLSX, or JSON |
| GET | `/export/investigation/{id}` | Investigation package as PDF, Markdown, or JSON |
| GET | `/export/sar/{entity_id}` | Reviewer-only SAR draft as text or PDF |
| GET | `/export/trace/{id}` | Execution trace as CSV or JSON |
| GET | `/export/model-card` | Model card as Markdown or PDF |
| GET | `/export/audit` | Immutable audit records as CSV or JSON |
| GET | `/export/eda` | Query-scoped EDA report as HTML or JSON |
| POST | `/query` | Dynamic plan execution and atomic workflow persistence |

Interactive docs: http://localhost:8000/docs

### Governed dataset workflow

CSV and XLSX imports are inspected before ingestion, mapped to the canonical
transaction contract, and rejected when required fields or valid analytical
rows are missing. Each accepted file receives an MD5 fingerprint and a
dedicated DuckDB schema. Only one primary and one knowledge workspace can be
active at a time; activation affects future analysis while retained
investigations keep their original dataset identity. Upload, activation, and
deletion actions are written to the immutable audit trail. The default upload
limit is 5 GB and can be changed with `MAX_UPLOAD_BYTES`.

---

## Models Used

| Role | Model | Rationale |
|---|---|---|
| Intent extraction + planning | `openai/gpt-oss-20b` | Fast, cheap, structured output |
| Explanation + SAR draft | `openai/gpt-oss-120b` | Reasoning + citation quality |
| Fallback explanation | `qwen/qwen3-27b` | Free-tier alternative |

All served via **Groq** (low-latency inference, free tier available).

---

## AML Patterns Detected

| Pattern | Method | Regulatory Reference |
|---|---|---|
| Structuring | Rule + Statistical | 31 U.S.C. § 5324, FinCEN SAR |
| Smurfing | Rule + Graph | FATF Rec. 20, FinCEN FIN-2014-A005 |
| Layering | Graph + ML | FATF 40 Recommendations |
| Rapid Cash-Out | Rule + Feature Eng. | FATF TBML Guidance 2020 |
| Round-Trip | Graph | FATF Typology Report 2020 |

---

## Phase Status

| Phase | Hours | Description | Status |
|---|---|---|---|
| 0 | 0–4 | Setup + repo structure | ✅ Done |
| 1 | 4–8 | Data layer (DuckDB) | ✅ Done |
| 2 | 8–18 | Agentic skeleton | ✅ Done |
| 3 | 18–30 | Detection tools | ✅ Done |
| 4 | 30–38 | Risk, escalation, explanation | ✅ Done |
| 5 | 38–43 | EDA + Graph | ✅ Done |
| 6 | 43–47 | UI + demo polish | ✅ Done |
| A | — | Judge-critical investigation workspace | ✅ Done |
| B | — | Persistent banking workflow | ✅ Done |
| C | — | Advanced quality and deployment | ✅ Implemented · production activation needs data-bundle URL |
