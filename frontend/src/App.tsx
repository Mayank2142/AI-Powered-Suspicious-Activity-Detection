import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { checkHealth, getDatasets, getQueueSummary } from './api'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AuditTrail from './pages/AuditTrail'
import CommandCenter, { ExecutionTrace } from './pages/CommandCenter'
import Customers from './pages/Customers'
import Datasets from './pages/Datasets'
import Investigations from './pages/Investigations'
import ModelCard from './pages/ModelCard'
import PolicySettings from './pages/PolicySettings'
import ReviewQueue from './pages/ReviewQueue'
import Transactions from './pages/Transactions'
import './App.css'
import './Workspace.css'
import './styles/tokens.css'
import './styles/shell.css'
import type { ApiStatus } from './types'

export { ExecutionTrace }

interface WorkspaceState {
  apiStatus: ApiStatus
  activeDataset: string
  openAlerts: number | null
}

const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  apiStatus: 'checking',
  activeDataset: 'Loading evidence',
  openAlerts: null,
}

function ApplicationShell() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [workspaceState, setWorkspaceState] = useState(INITIAL_WORKSPACE_STATE)

  useEffect(() => {
    let active = true

    async function refreshWorkspaceState() {
      const [health, datasets, queue] = await Promise.allSettled([
        checkHealth(),
        getDatasets(),
        getQueueSummary(),
      ])

      if (!active) return

      const activeDataset =
        datasets.status === 'fulfilled'
          ? datasets.value.find(
              (dataset) => dataset.dataset_type === 'primary' && dataset.is_active,
            )?.display_name ?? 'No active primary dataset'
          : 'Evidence unavailable'

      const openAlerts =
        queue.status === 'fulfilled'
          ? queue.value.new + queue.value.in_review + queue.value.escalated
          : null

      setWorkspaceState({
        apiStatus: health.status === 'fulfilled' ? 'online' : 'offline',
        activeDataset,
        openAlerts,
      })
    }

    void refreshWorkspaceState()
    return () => {
      active = false
    }
  }, [location.pathname])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className={`workspace-shell${sidebarOpen ? ' workspace-shell--nav-open' : ''}`}>
      <a className="skip-link" href="#workspace-main">
        Skip to workspace content
      </a>
      <Sidebar
        activeDataset={workspaceState.activeDataset}
        openAlerts={workspaceState.openAlerts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <button
        type="button"
        className="workspace-nav-scrim"
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="workspace-frame">
        <TopBar
          apiStatus={workspaceState.apiStatus}
          activeDataset={workspaceState.activeDataset}
          isMenuOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((current) => !current)}
        />
        <main className="workspace-content" id="workspace-main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/queue" element={<ReviewQueue />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/model" element={<ModelCard />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/policy" element={<PolicySettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ApplicationShell />
    </BrowserRouter>
  )
}
