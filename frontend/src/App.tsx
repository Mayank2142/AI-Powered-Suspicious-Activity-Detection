import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { checkHealth, getDatasets, getQueueSummary } from './api'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { useRevealOnScroll } from './hooks/useMotion'
import AppRoutes from './router/AppRoutes'
import './App.css'
import './Workspace.css'
import './styles/tokens.css'
import './styles/shell.css'
import './styles/motion.css'
import './styles/redesign.css'
import type { ApiStatus } from './types'

export { ExecutionTrace } from './components/ExecutionTrace'

/** Initialize theme on app boot (before first paint) */
function initTheme() {
  try {
    const stored = localStorage.getItem('aml-theme')
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'light')
  }
}

initTheme()

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

function isCompactNavigation() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(max-width: 780px)').matches
}

function ApplicationShell() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compactNavigation, setCompactNavigation] = useState(isCompactNavigation)
  const [workspaceState, setWorkspaceState] = useState(INITIAL_WORKSPACE_STATE)
  useRevealOnScroll(location.pathname)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(max-width: 780px)')
    const syncNavigationMode = () => setCompactNavigation(media.matches)
    syncNavigationMode()
    media.addEventListener('change', syncNavigationMode)
    return () => media.removeEventListener('change', syncNavigationMode)
  }, [])

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

  const navigationVisible = compactNavigation ? sidebarOpen : !sidebarCollapsed

  function toggleNavigation() {
    if (compactNavigation) {
      setSidebarOpen((current) => !current)
      return
    }
    setSidebarCollapsed((current) => !current)
  }

  function closeNavigation() {
    if (compactNavigation) {
      setSidebarOpen(false)
      return
    }
    setSidebarCollapsed(true)
  }

  return (
    <div
      className={[
        'workspace-shell',
        sidebarOpen ? 'workspace-shell--nav-open' : '',
        sidebarCollapsed ? 'workspace-shell--sidebar-collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      <a className="skip-link" href="#workspace-main">
        Skip to workspace content
      </a>
      <Sidebar
        activeDataset={workspaceState.activeDataset}
        openAlerts={workspaceState.openAlerts}
        isOpen={sidebarOpen}
        onClose={closeNavigation}
        onNavigate={() => setSidebarOpen(false)}
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
          isMenuOpen={navigationVisible}
          onMenuToggle={toggleNavigation}
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
      <Routes>
        <Route path="/*" element={<ApplicationShell />} />
      </Routes>
    </BrowserRouter>
  )
}
