import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login'
import { AuthProvider } from './AuthProvider'
import type { AuthSession } from './types'

const session: AuthSession = {
  user: {
    user_id: 'usr-analyst-1',
    email: 'analyst@institution.test',
    display_name: 'Avery Analyst',
    roles: ['analyst'],
  },
  expires_at: '2026-07-27T10:00:00Z',
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderGuard(path = '/customers') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login destination</div>} />
          <Route
            path="/customers"
            element={(
              <ProtectedRoute>
                <div>Protected customer evidence</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('authentication boundary', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(cleanup)

  it('redirects an unauthenticated deep link to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)))

    renderGuard()

    expect(await screen.findByText('Login destination')).toBeTruthy()
    expect(screen.queryByText('Protected customer evidence')).toBeNull()
  })

  it('renders protected evidence for an authenticated analyst', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(session)))

    renderGuard()

    expect(await screen.findByText('Protected customer evidence')).toBeTruthy()
  })

  it('posts credentials using a cookie session and stores no browser token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse(session))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Authenticated workspace</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Sign in to Sentinel' })
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'Analyst@Institution.Test',
    )
    await user.type(screen.getByLabelText('Password'), 'ValidPassphrase!')
    await user.click(screen.getByRole('button', { name: 'Continue securely' }))

    expect(await screen.findByText('Authenticated workspace')).toBeTruthy()
    const [, loginInit] = fetchMock.mock.calls[1]
    expect(loginInit.credentials).toBe('include')
    expect(JSON.parse(loginInit.body)).toEqual({
      email: 'analyst@institution.test',
      password: 'ValidPassphrase!',
    })
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('shows a generic message when credentials are rejected', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(
        jsonResponse({ detail: 'User analyst@example.test does not exist' }, 401),
      )
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Sign in to Sentinel' })
    await user.type(
      screen.getByRole('textbox', { name: 'Email address' }),
      'analyst@example.test',
    )
    await user.type(screen.getByLabelText('Password'), 'IncorrectPass!')
    await user.click(screen.getByRole('button', { name: 'Continue securely' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'credentials were not accepted',
      )
    })
    expect(screen.getByRole('alert').textContent).not.toContain('does not exist')
  })
})
