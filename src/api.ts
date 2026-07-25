import type {
  AgentResponse,
  AlertDisposition,
  AlertQueueItem,
  AuditResponse,
  CustomerDetail,
  CustomerFilters,
  CustomerPage,
  DatasetsResponse,
  HealthResponse,
  InvestigationRecord,
  InvestigationSummary,
  ModelCard,
  ModelDriftReport,
  PolicyResponse,
  QueueResponse,
  QueueSummary,
  TransactionFilters,
  TransactionPage,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
class HttpFailure extends Error {
  readonly retryable: boolean

  constructor(message: string, retryable: boolean) {
    super(message)
    this.retryable = retryable
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET'
  const attempts = method === 'GET' ? 3 : 1
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })
      if (response.ok) return response.json() as Promise<T>

      let detail = `Request failed with status ${response.status}`
      try {
        const payload = (await response.json()) as { detail?: string }
        if (payload.detail) detail = payload.detail
      } catch {
        // Preserve the status fallback for non-JSON upstream errors.
      }
      throw new HttpFailure(detail, RETRYABLE_STATUS.has(response.status))
    } catch (reason) {
      lastError = reason
      if (
        attempt === attempts - 1
        || (reason instanceof HttpFailure && !reason.retryable)
      ) throw reason
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** attempt))
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed')
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

export function getModelCard() {
  return request<ModelCard>('/model-card')
}

export function getModelDrift(limit = 1_000) {
  return request<ModelDriftReport>(`/model-card/drift?limit=${limit}`)
}

export function getInvestigations(limit = 50) {
  return request<InvestigationSummary[]>(`/investigations?limit=${limit}`)
}

export function getInvestigation(investigationId: string) {
  return request<InvestigationRecord>(
    `/investigations/${encodeURIComponent(investigationId)}`,
  )
}

export function getQueue(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<QueueResponse>(`/queue${query}`)
}

export function getQueueSummary() {
  return request<QueueSummary>('/queue/summary')
}

export function assignAlert(alertId: string, assignedTo: string) {
  return request<AlertQueueItem>(
    `/queue/${encodeURIComponent(alertId)}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        assigned_to: assignedTo,
        actor: 'demo.analyst',
      }),
    },
  )
}

export function dispositionAlert(
  alertId: string,
  disposition: Exclude<AlertDisposition, 'pending'>,
) {
  return request<AlertQueueItem>(
    `/queue/${encodeURIComponent(alertId)}/disposition`,
    {
      method: 'POST',
      body: JSON.stringify({
        disposition,
        actor: 'demo.analyst',
      }),
    },
  )
}

export function addAlertNote(alertId: string, note: string) {
  return request<AlertQueueItem>(
    `/queue/${encodeURIComponent(alertId)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ note, actor: 'demo.analyst' }),
    },
  )
}

export function getAuditEvents(eventType?: string) {
  const query = eventType
    ? `?event_type=${encodeURIComponent(eventType)}`
    : ''
  return request<AuditResponse>(`/audit${query}`)
}

export function getPolicy() {
  return request<PolicyResponse>('/policy')
}

export function getDatasets() {
  return request<DatasetsResponse>('/datasets')
}

function queryString(values: object) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}

export function getCustomers(filters: CustomerFilters = {}) {
  return request<CustomerPage>(`/customers${queryString(filters)}`)
}

export function getCustomer(accountId: string) {
  return request<CustomerDetail>(
    `/customers/${encodeURIComponent(accountId)}`,
  )
}

export function getTransactions(filters: TransactionFilters = {}) {
  return request<TransactionPage>(`/transactions${queryString(filters)}`)
}

export function getTransactionPaymentFormats() {
  return request<{ items: string[] }>('/transactions/payment-formats')
}
