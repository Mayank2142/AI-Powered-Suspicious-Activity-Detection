import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getDatasets, getQueueSummary } from '../api'

const NAV_ITEMS = [
  { to: '/', label: 'Command center', icon: '⌂' },
  { to: '/investigations', label: 'Investigations', icon: '⌕' },
  { to: '/queue', label: 'Review queue', icon: '!' },
  { to: '/customers', label: 'Customers', icon: '◎' },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/datasets', label: 'Datasets', icon: '▰' },
  { to: '/model', label: 'Model intelligence', icon: '◇' },
  { to: '/audit', label: 'Audit trail', icon: '≡' },
  { to: '/policy', label: 'Policy settings', icon: '⚙' },
]

export default function Sidebar() {
  const location = useLocation()
  const [openAlerts, setOpenAlerts] = useState<number | null>(null)
  const [activeDataset, setActiveDataset] = useState('Loading dataset…')

  useEffect(() => {
    let active = true
    getQueueSummary()
      .then((summary) => {
        if (active) {
          setOpenAlerts(summary.new + summary.in_review + summary.escalated)
        }
      })
      .catch(() => {
        if (active) setOpenAlerts(null)
      })
    getDatasets()
      .then((datasets) => {
        if (active) {
          setActiveDataset(
            datasets.find((dataset) => dataset.dataset_type === 'primary' && dataset.is_active)?.display_name
              ?? 'No active primary dataset',
          )
        }
      })
      .catch(() => { if (active) setActiveDataset('Dataset unavailable') })
    return () => {
      active = false
    }
  }, [location.pathname])

  return (
    <aside className="workspace-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand__mark" aria-hidden="true"><i /><i /><i /></span>
        <div><strong>Sentinel AML</strong><span>Investigation workspace</span></div>
      </div>

      <div className="sidebar-environment">
        <span className="status-dot status-dot--live" />
        <span><strong>Active evidence</strong>{activeDataset}</span>
      </div>

      <nav aria-label="Primary workspace navigation">
        <span className="sidebar-section-label">Workspace</span>
        {NAV_ITEMS.slice(0, 6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
          >
            <span className="sidebar-link__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/queue' ? <span className="sidebar-count">{openAlerts ?? '—'}</span> : null}
          </NavLink>
        ))}

        <span className="sidebar-section-label sidebar-section-label--spaced">Governance</span>
        {NAV_ITEMS.slice(6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
          >
            <span className="sidebar-link__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-safeguard">
        <span>Human decision required</span>
        <p>Sentinel prioritizes evidence. It does not file regulatory reports.</p>
      </div>
    </aside>
  )
}
