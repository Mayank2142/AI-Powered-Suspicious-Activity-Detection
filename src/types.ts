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
  min_count: number | null
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
  risk_contributions: RiskContribution | null
  top_transactions: TransactionEvidence[]
  txn_count: number
  total_amount: number
  observation_window: [string, string] | null
  distinct_counterparties: number
}

export interface TransactionEvidence {
  txn_id: string
  timestamp: string
  amount: number
  payment_format: string
  to_account: string
  from_country: string | null
  to_country: string | null
  triggered_rules: string[]
}

export interface RiskContribution {
  rule_score: number
  rule_weight: number
  rule_contribution: number
  stat_score: number
  stat_weight: number
  stat_contribution: number
  ml_score: number
  ml_weight: number
  ml_contribution: number
  country_boost: number
  active_detector_count: number
  final_risk_score: number
  formula: string
}

export interface AggregationRow {
  entity_id: string
  txn_count: number
  total_amount: number
  avg_amount: number
  min_amount: number
  max_amount: number
  date_first: string
  date_last: string
  distinct_counterparties: number
  risk_score: number
  risk_label: RiskLabel
}

export interface AggregationResult {
  rows: AggregationRow[]
  total_groups: number
  filter_applied: Record<string, unknown>
  group_by_field: string
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
  investigation_id?: string | null
  query: string
  intent: IntentResult
  plan: PlanResult
  execution_trace: ExecutionStep[]
  top_entities: FlaggedEntity[]
  summary_stats: SummaryStats
  eda_summary?: Record<string, unknown> | null
  charts?: PlotlyChartData[] | null
  graph?: GraphResult | null
  aggregation?: AggregationResult | null
}

export interface HealthResponse {
  status: 'ok'
  phase: string
}

export interface ModelCard {
  model_id: string
  model_type: string
  library: string
  library_version: string
  algorithm: string
  training_dataset: string
  training_rows: number
  contamination_rate: number
  random_state: number
  n_estimators: number
  features: string[]
  feature_count: number
  score_range: {
    raw_min: number
    raw_max: number
  }
  decision_rule: string
  normalization: string
  status: string
  drift_status: string
  limitations: string[]
  grounding: string
}

export interface DriftFeature {
  feature: string
  psi: number
  status: 'stable' | 'caution' | 'drift'
  baseline_mean: number
  current_mean: number
}

export interface ModelDriftReport {
  model_id: string
  method: 'population_stability_index'
  status: 'stable' | 'caution' | 'drift'
  overall_psi: number
  thresholds: {
    stable_below: number
    drift_above: number
  }
  baseline_rows: number
  current_rows: number
  features: DriftFeature[]
  compared_at: string
  interpretation: string
  current_dataset: string
  baseline_dataset: string
}

export type WorkflowStatus = 'new' | 'in_review' | 'escalated' | 'closed'
export type AlertDisposition =
  | 'pending'
  | 'true_positive'
  | 'false_positive'
  | 'escalated'
  | 'sar_filed'

export interface InvestigationSummary {
  investigation_id: string
  query: string
  intent: string
  pattern_type: string | null
  status: 'open' | 'in_review' | 'escalated' | 'closed'
  disposition: string | null
  flagged_count: number
  high_risk_count: number
  alert_count: number
  created_at: string
  updated_at: string
}

export interface InvestigationRecord extends InvestigationSummary {
  response: AgentResponse
}

export interface AlertQueueItem {
  alert_id: string
  entity_id: string
  risk_score: number
  risk_label: RiskLabel
  escalation_action: EscalationAction
  saml_d_typology: string
  created_at: string
  sla_hours: number
  age_hours: number
  assigned_to: string | null
  status: WorkflowStatus
  disposition: AlertDisposition | null
  investigation_id: string
  notes: string
}

export interface QueueSummary {
  total: number
  new: number
  in_review: number
  escalated: number
  closed: number
}

export interface QueueResponse {
  items: AlertQueueItem[]
  returned: number
  summary: QueueSummary
}

export interface AuditEvent {
  event_id: string
  event_type: string
  actor: string
  investigation_id: string | null
  alert_id: string | null
  payload: Record<string, unknown>
  risk_policy_version: string
  model_version: string
  dataset_snapshot: string
  created_at: string
}

export interface AuditResponse {
  items: AuditEvent[]
  total: number
  limit: number
  offset: number
}

export interface PolicyResponse {
  version: string
  effective_date: string
  approved_by: string
  jurisdiction: string
  currency: string
  mode: 'read_only'
  thresholds: Record<string, number>
  risk_weights: Record<string, number>
  high_risk_countries: string[]
  change_history: unknown[]
  limitations: string[]
}

export interface DatasetCard {
  dataset_id: string
  name: string
  source: string
  rows: number
  laundering_rows: number
  status: string
  role: string
  laundering_rate_pct?: number
  date_min?: string
  date_max?: string
  unique_accounts?: number
  normal_sample_rows?: number
  typology_count?: number
}

export interface DatasetsResponse {
  primary: DatasetCard
  knowledge: DatasetCard
}
