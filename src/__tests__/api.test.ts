import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCustomers, getPolicy, getTransactions, runQuery } from '../api'
import type { AgentResponse } from '../types'

const responsePayload: AgentResponse = {
  query: 'Find structuring',
  intent: {
    intent: 'pattern_search',
    pattern_type: 'structuring',
    filters: {
      date_range: null,
      entity_id: null,
      from_country: null,
      payment_format: null,
      min_amount: null,
      max_amount: null,
      min_count: null,
    },
    entities: [],
    require_ml: true,
    require_graph: false,
    require_eda: false,
  },
  plan: {
    steps: ['data_loader', 'rule_engine', 'explanation'],
    skipped: [],
    reasoning: 'Pattern query',
  },
  execution_trace: [],
  top_entities: [],
  summary_stats: {
    total_analyzed: 0,
    flagged: 0,
    high_risk: 0,
  },
}

describe('runQuery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends POST to /api/query with the correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await runQuery('Find structuring')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/query')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ query: 'Find structuring' })
  })

  it('parses the AgentResponse JSON shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const result = await runQuery('Find structuring')

    expect(result.intent.pattern_type).toBe('structuring')
    expect(result.plan.steps[0]).toBe('data_loader')
  })

  it('throws the API detail on a non-200 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Agent query failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(runQuery('Find structuring')).rejects.toThrow(
      'Agent query failed',
    )
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('retries a transient GET without retrying mutable POST requests', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ detail: 'Starting service' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          version: '1.0.0',
          effective_date: '2026-07-26',
          approved_by: 'Policy owner',
          jurisdiction: 'US',
          currency: 'USD',
          mode: 'read_only',
          thresholds: {},
          risk_weights: {},
          high_risk_countries: [],
          change_history: [],
          limitations: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ))
    vi.stubGlobal('fetch', fetchMock)

    const policyPromise = getPolicy()
    await vi.runAllTimersAsync()
    await expect(policyPromise).resolves.toMatchObject({ mode: 'read_only' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('encodes customer evidence filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ items: [], total: 0, limit: 25, offset: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getCustomers({ search: '8000 A', risk_label: 'high', limit: 25 })

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/customers?search=8000+A&risk_label=high&limit=25',
    )
  })

  it('encodes bounded transaction filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ items: [], total: 0, limit: 50, offset: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getTransactions({
      account_id: 'A/1',
      direction: 'outbound',
      min_amount: 8_000,
      laundering_only: true,
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/transactions?account_id=A%2F1&direction=outbound&min_amount=8000&laundering_only=true',
    )
  })
})
