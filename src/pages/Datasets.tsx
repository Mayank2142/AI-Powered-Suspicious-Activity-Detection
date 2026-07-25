import { useEffect, useState } from 'react'
import { getDatasets } from '../api'
import type { DatasetCard } from '../types'

function DatasetPanel({ dataset }: { dataset: DatasetCard }) {
  return (
    <article className="dataset-card">
      <header><div><span className="section-kicker">{dataset.dataset_id}</span><h2>{dataset.name}</h2></div><span className="model-status model-status--live">{dataset.status}</span></header>
      <p>{dataset.role}</p>
      <div className="dataset-metrics">
        <div><strong>{dataset.rows.toLocaleString()}</strong><span>Rows</span></div>
        <div><strong>{dataset.laundering_rows.toLocaleString()}</strong><span>Known laundering</span></div>
        {dataset.laundering_rate_pct !== undefined ? <div><strong>{dataset.laundering_rate_pct.toFixed(2)}%</strong><span>Label prevalence</span></div> : null}
        {dataset.unique_accounts !== undefined ? <div><strong>{dataset.unique_accounts.toLocaleString()}</strong><span>Unique accounts</span></div> : null}
        {dataset.normal_sample_rows !== undefined ? <div><strong>{dataset.normal_sample_rows.toLocaleString()}</strong><span>Normal sample</span></div> : null}
        {dataset.typology_count !== undefined ? <div><strong>{dataset.typology_count}</strong><span>Typologies</span></div> : null}
      </div>
      <dl className="dataset-lineage">
        <div><dt>Source</dt><dd>{dataset.source}</dd></div>
        {dataset.date_min ? <div><dt>Coverage</dt><dd>{dataset.date_min} → {dataset.date_max}</dd></div> : null}
      </dl>
    </article>
  )
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<{ primary: DatasetCard; knowledge: DatasetCard } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    getDatasets().then(setDatasets).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load dataset registry'))
  }, [])
  return (
    <main className="workspace-page">
      <header className="workspace-page__header">
        <div><span className="eyebrow">Data governance</span><h1>Datasets</h1><p>Active analytical sources, coverage, label context, and the distinct role each dataset plays.</p></div>
        <span className="metric-pill">2 governed sources</span>
      </header>
      {error ? <div className="workspace-error">{error}</div> : null}
      {datasets ? <div className="dataset-grid"><DatasetPanel dataset={datasets.primary} /><DatasetPanel dataset={datasets.knowledge} /></div> : !error ? <div className="workspace-loading">Loading dataset registry…</div> : null}
      <section className="data-governance-note"><strong>Separation of duties</strong><p>HI-Small is the active investigation dataset. SAML-D is used for typology grounding and model training context; it is not presented as live production evidence.</p></section>
    </main>
  )
}
