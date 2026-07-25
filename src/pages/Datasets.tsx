import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { activateDataset, deleteDataset, getDatasets } from '../api'
import DatasetCard from '../components/DatasetCard'
import UploadModal from '../components/UploadModal'
import type { DatasetInfo, DatasetUploadResult } from '../types'

export default function Datasets() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState<DatasetInfo[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setDatasets(await getDatasets())
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dataset registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const active = useMemo(
    () => datasets.filter((dataset) => dataset.is_active),
    [datasets],
  )
  const available = useMemo(
    () => datasets.filter((dataset) => !dataset.is_active),
    [datasets],
  )

  async function activate(dataset: DatasetInfo): Promise<boolean> {
    setBusy(dataset.dataset_id); setError(''); setNotice('')
    try {
      const result = await activateDataset(dataset.dataset_id)
      setNotice(result.message)
      await refresh()
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to activate dataset')
      return false
    } finally {
      setBusy('')
    }
  }

  async function analyze(dataset: DatasetInfo) {
    if (!dataset.is_active && !(await activate(dataset))) return
    navigate('/')
  }

  async function remove(dataset: DatasetInfo) {
    if (!window.confirm(`Delete the isolated workspace “${dataset.display_name}”? This cannot be undone.`)) return
    setBusy(dataset.dataset_id); setError('')
    try {
      await deleteDataset(dataset.dataset_id)
      setNotice(`${dataset.display_name} was deleted.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete dataset')
    } finally {
      setBusy('')
    }
  }

  function uploaded(result: DatasetUploadResult) {
    setShowUpload(false)
    setNotice(`${result.display_name} was validated and ingested with ${result.row_count.toLocaleString()} rows.`)
    void refresh()
  }

  const card = (dataset: DatasetInfo) => (
    <DatasetCard
      key={dataset.dataset_id}
      dataset={dataset}
      busy={busy === dataset.dataset_id}
      onActivate={(item) => void activate(item)}
      onAnalyze={(item) => void analyze(item)}
      onDelete={(item) => void remove(item)}
    />
  )

  return (
    <main className="workspace-page workspace-page--wide">
      <header className="workspace-page__header">
        <div><span className="eyebrow">Data governance</span><h1>Dataset workspaces</h1><p>Import, validate, isolate, activate, and analyze institutional data without mixing evidence histories.</p></div>
        <button className="primary-action" onClick={() => setShowUpload(true)}>Upload dataset</button>
      </header>
      <section className="dataset-control-strip">
        <div><span>Registered</span><strong>{datasets.length}</strong></div>
        <div><span>Active workspaces</span><strong>{active.length}</strong></div>
        <div><span>Total governed rows</span><strong>{datasets.reduce((sum, item) => sum + item.row_count, 0).toLocaleString()}</strong></div>
      </section>
      {notice ? <div className="workspace-notice" role="status">{notice}</div> : null}
      {error ? <div className="workspace-error" role="alert">{error}</div> : null}
      {loading ? <div className="workspace-loading">Loading governed workspaces…</div> : null}
      {!loading ? (
        <>
          <section className="dataset-section"><div className="dataset-section__heading"><span className="section-kicker">Active analytical context</span><h2>Active datasets</h2></div><div className="dataset-grid">{active.map(card)}</div></section>
          <section className="dataset-section"><div className="dataset-section__heading"><span className="section-kicker">Isolated and available</span><h2>Other datasets</h2></div>{available.length ? <div className="dataset-grid">{available.map(card)}</div> : <p className="panel-empty">No inactive datasets. Upload another institutional source to create an isolated workspace.</p>}</section>
        </>
      ) : null}
      <section className="data-governance-note"><strong>Isolation and human control</strong><p>Each upload is validated, fingerprinted, and stored in its own DuckDB schema. Activating a primary workspace changes the evidence source for future analyses; existing investigations remain immutable.</p></section>
      {showUpload ? <UploadModal onClose={() => setShowUpload(false)} onUploaded={uploaded} /> : null}
    </main>
  )
}
