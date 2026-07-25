import type { Data, Layout } from 'plotly.js'

export type ApiStatus = 'checking' | 'online' | 'offline'
export type RiskLabel = 'low' | 'medium' | 'high'
export type EscalationAction = 'monitor' | 'flag_for_review' | 'report'

export interface IntentFilters {
  date_range: [string, string] | null
  entity_id: string | null
  from_country: string | null
  payment_format: string | null
  min_amount: number | null
  max_amount: number | null
}

export interface IntentResult {
  intent: 'pattern_search' | 'aggregation' | 'entity_lookup' | 'broad_eda'
  pattern_type: string | null
  filters: IntentFilters
  entities: string[]
  require_ml: boolean
  require_graph: boolean
  require_eda: boolean
}

export interface SkippedTool {
  tool: string
  reason: string
}

export interface PlanResult {
  steps: string[]
  skipped: SkippedTool[]
  reasoning: string
}

export interface ExecutionStep {
  tool: string
  status: 'run' | 'skipped'
  duration_ms: number
  reason: string
}

export interface FlaggedEntity {
  entity_id: string
  risk_score: number
  risk_label: RiskLabel
  escalation_action: EscalationAction
  rule_flags: string[]
  rule_score: number
  stat_score: number
  ml_score: number
  saml_d_typology: string
  explanation: string
  sar_draft: string
  citation: string
}

export interface SummaryStats {
  total_analyzed: number
  flagged: number
  high_risk: number
}

export interface PlotlyChartData {
  chart_id: string
  title: string
  data: Data[]
  layout: Partial<Layout>
  meta?: {
    note?: string
    [key: string]: unknown
  }
}

export interface GraphResult {
  status: 'ok' | 'skipped'
  summary: {
    input_rows: number
    nodes: number | null
    edges: number | null
    self_loops: number
    density: number
  }
  cycles: unknown[]
  fan_in: unknown[]
  fan_out: unknown[]
  bipartite: unknown[]
  gather_scatter: unknown[]
  scatter_gather: unknown[]
  note: string
}

export interface AgentResponse {
  query: string
  intent: IntentResult
  plan: PlanResult
  execution_trace: ExecutionStep[]
  top_entities: FlaggedEntity[]
  summary_stats: SummaryStats
  eda_summary?: Record<string, unknown> | null
  charts?: PlotlyChartData[] | null
  graph?: GraphResult | null
}

export interface HealthResponse {
  status: 'ok'
  phase: string
}
