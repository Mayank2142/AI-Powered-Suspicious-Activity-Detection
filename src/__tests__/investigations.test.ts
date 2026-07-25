import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadInvestigations,
  saveInvestigation,
} from '../store/investigations'
import type { AgentResponse } from '../types'

const response: AgentResponse = {
  query: 'Which customers made 10+ transactions under $10,000?',
  intent: {
    intent: 'aggregation',
    pattern_type: 'structuring',
    filters: {
      date_range: null,
      entity_id: null,
      from_country: null,
      payment_format: null,
      min_amount: null,
      max_amount: 10_000,
      min_count: 10,
    },
    entities: [],
    require_ml: false,
    require_graph: false,
    require_eda: false,
  },
  plan: {
    steps: ['data_loader', 'aggregation'],
    skipped: [],
    reasoning: 'Direct grouped threshold query',
  },
  execution_trace: [],
  top_entities: [],
  summary_stats: {
    total_analyzed: 100,
    flagged: 0,
    high_risk: 0,
  },
}

describe('investigation history store', () => {
  beforeEach(() => localStorage.clear())

  it('persists a completed investigation across page loads', () => {
    const saved = saveInvestigation(response)
    const loaded = loadInvestigations()

    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(saved.id)
    expect(loaded[0].query).toBe(response.query)
    expect(loaded[0].disposition).toBe('pending')
  })
})
