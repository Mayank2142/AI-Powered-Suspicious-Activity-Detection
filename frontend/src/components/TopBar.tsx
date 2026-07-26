import { useLocation } from 'react-router-dom'
import { resolveWorkspaceRoute } from '../router/manifest'
import type { ApiStatus } from '../types'

const STATUS_LABELS: Record<ApiStatus, string> = {
  checking: 'Checking API',
  online: 'API connected',
  offline: 'API unavailable',
}

interface TopBarProps {
  apiStatus: ApiStatus
  activeDataset: string
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export default function TopBar({
  apiStatus,
  activeDataset,
  isMenuOpen,
  onMenuToggle,
}: TopBarProps) {
  const location = useLocation()
  const page = resolveWorkspaceRoute(location.pathname)

  return (
    <header className="workspace-topbar">
      <div className="topbar-location">
        <button
          type="button"
          className="topbar-menu"
          aria-label="Open workspace navigation"
          aria-controls="primary-workspace-navigation"
          aria-expanded={isMenuOpen}
          onClick={onMenuToggle}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div>
          <span>{page?.context ?? 'Sentinel AML'}</span>
          <strong>{page?.title ?? 'Page not found'}</strong>
        </div>
      </div>

      <div className="topbar-operations">
        <div className="topbar-evidence" title={activeDataset}>
          <span>Evidence</span>
          <strong>{activeDataset}</strong>
        </div>
        <span
          className={`topbar-api-status topbar-api-status--${apiStatus}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          {STATUS_LABELS[apiStatus]}
        </span>
        <span className="topbar-reviewer" title="Signed in as Mayank Gupta">
          <span aria-hidden="true">MG</span>
          <span><strong>Mayank Gupta</strong><small>AML reviewer</small></span>
        </span>
      </div>
    </header>
  )
}
