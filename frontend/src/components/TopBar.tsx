import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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
  const { session, signOut } = useAuth()
  const user = session?.user
  const initials = user?.display_name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AML'
  const role = user?.roles[0]?.replaceAll('_', ' ') ?? 'AML reviewer'

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
        <button
          type="button"
          className="topbar-reviewer"
          title={`Sign out ${user?.display_name ?? 'reviewer'}`}
          aria-label={`Sign out ${user?.display_name ?? 'reviewer'}`}
          onClick={() => void signOut()}
        >
          <span aria-hidden="true">{initials}</span>
          <span>
            <strong>{user?.display_name ?? 'AML reviewer'}</strong>
            <small>{role}</small>
          </span>
        </button>
      </div>
    </header>
  )
}
