import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { checkHealth, getDatasets, getQueueSummary } from './api'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import AppRoutes from './router/AppRoutes'
import './App.css'
import './Workspace.css'
import './styles/tokens.css'
import './styles/shell.css'
import type { ApiStatus } from './types'

export { ExecutionTrace } from './components/ExecutionTrace'

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
          <AppRoutes />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={(
              <ProtectedRoute>
                <ApplicationShell />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
