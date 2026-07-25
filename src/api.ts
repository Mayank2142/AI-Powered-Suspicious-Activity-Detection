import type { AgentResponse, HealthResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) detail = payload.detail
    } catch {
      // The status message remains the safest fallback for non-JSON errors.
    }
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export function checkHealth() {
  return request<HealthResponse>('/health')
}

export function runQuery(query: string) {
  return request<AgentResponse>('/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}
