import { useEffect, useState } from 'react'
import { getInvestigation, getInvestigations } from '../api'
import type { InvestigationRecord, InvestigationSummary } from '../types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function Investigations() {
  const [items, setItems] = useState<InvestigationSummary[]>([])
  const [selected, setSelected] = useState<InvestigationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getInvestigations()
      .then(async (records) => {
        if (!active) return
        setItems(records)
        if (records[0]) setSelected(await getInvestigation(records[0].investigation_id))
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load investigations')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const selectRecord = async (record: InvestigationSummary) => {
    try {
      setSelected(await getInvestigation(record.investigation_id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load investigation')
    }
  }

  return (
    <main className="workspace-page">
      <header className="workspace-page__header">
        <div>
          <span className="eyebrow">Decision history</span>
          <h1>Investigations</h1>
          <p>Server-retained query, plan, evidence, and outcome records.</p>
        </div>
        <span className="metric-pill">{items.length} retained</span>
      </header>

      {error ? <div className="workspace-error">{error}</div> : null}
      {loading ? <div className="workspace-loading">Loading investigation register…</div> : null}

      {!loading && items.length ? (
        <div className="investigation-layout">
          <section className="investigation-list" aria-label="Investigation history">
            {items.map((record) => (
              <button
                className={`investigation-card${selected?.investigation_id === record.investigation_id ? ' investigation-card--active' : ''}`}
                key={record.investigation_id}
                onClick={() => void selectRecord(record)}
              >
                <span>{formatDate(record.created_at)} · {record.investigation_id}</span>
                <strong>{record.query}</strong>
                <div>
                  <span>{record.intent.replaceAll('_', ' ')}</span>
                  <span>{record.flagged_count} flagged</span>
                  <span>{record.status.replaceAll('_', ' ')}</span>
                </div>
              </button>
            ))}
          </section>

          {selected ? (
            <section className="investigation-detail">
              <div className="detail-heading-row">
                <span className="section-kicker">Investigation record</span>
                <span className={`status-badge status-badge--${selected.status}`}>{selected.status.replaceAll('_', ' ')}</span>
              </div>
              <h2>{selected.query}</h2>
              <div className="investigation-detail__metrics">
                <div><strong>{selected.response.summary_stats.total_analyzed}</strong><span>Analyzed</span></div>
                <div><strong>{selected.flagged_count}</strong><span>Flagged</span></div>
                <div><strong>{selected.high_risk_count}</strong><span>High risk</span></div>
              </div>
              <h3>Agent decision</h3>
              <p className="decision-reasoning">{selected.response.plan.reasoning}</p>
              <h3>Execution plan</h3>
              <ol className="compact-plan">
                {selected.response.plan.steps.map((step) => <li key={step}>{step.replaceAll('_', ' ')}</li>)}
              </ol>
              <p className="investigation-retention-note">Persisted in the governed workflow store with versioned audit events.</p>
            </section>
          ) : null}
        </div>
      ) : null}

      {!loading && !items.length ? (
        <section className="workspace-placeholder">
          <span className="workspace-placeholder__mark" aria-hidden="true">⌕</span>
          <div><h2>No retained investigations</h2><p>Run an analysis from Command center. Its response and decision trace will be retained here.</p></div>
        </section>
      ) : null}
    </main>
  )
}
