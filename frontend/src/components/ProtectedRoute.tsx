import type { PropsWithChildren } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { AnalystRole } from '../auth/types'

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: AnalystRole[]
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { status, session } = useAuth()

  if (status === 'checking' || status === 'authenticating') {
    return (
      <main className="auth-state" aria-busy="true">
        <span className="auth-state__spinner" aria-hidden="true" />
        <div>
          <strong>Verifying analyst session</strong>
          <span>Applying access and role controls.</span>
        </div>
      </main>
    )
  }

  if (!session) {
    const destination = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from: destination }} />
  }

  const hasRequiredRole =
    !allowedRoles?.length
    || allowedRoles.some((role) => session.user.roles.includes(role))

  if (!hasRequiredRole) {
    return (
      <main className="auth-state auth-state--denied">
        <span className="auth-state__code" aria-hidden="true">403</span>
        <div>
          <span className="section-kicker">Access restricted</span>
          <h1>Your role cannot open this workspace.</h1>
          <p>
            The attempted route requires an additional compliance role.
            No case data or workflow action was changed.
          </p>
          <Link to="/">Return to command center</Link>
        </div>
      </main>
    )
  }

  return children
}
