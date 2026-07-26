import { useLocation } from 'react-router-dom'
import type { ApiStatus } from '../types'

const PAGE_DETAILS: Record<string, { title: string; context: string }> = {
  '/': {
    title: 'Command center',
    context: 'Query-aware investigation',
  },
  '/investigations': {
    title: 'Investigations',
    context: 'Retained decision evidence',
  },
  '/queue': {
    title: 'Review queue',
    context: 'Human escalation workflow',
  },
  '/customers': {
    title: 'Customers',
    context: 'Entity risk intelligence',
  },
  '/transactions': {
    title: 'Transactions',
    context: 'Transaction evidence',
  },
  '/datasets': {
    title: 'Datasets',
    context: 'Governed data workspace',
  },
  '/model': {
    title: 'Model intelligence',
    context: 'Detection controls',
  },
  '/audit': {
    title: 'Audit trail',
    context: 'Immutable decision trace',
  },
  '/policy': {
    title: 'Policy settings',
    context: 'Risk governance',
  },
}

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
  const page = PAGE_DETAILS[location.pathname] ?? {
    title: 'Workspace',
    context: 'Sentinel AML',
  }

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
          <span>{page.context}</span>
          <strong>{page.title}</strong>
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
