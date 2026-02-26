export const PIPELINE_STAGES = ['Backlog', 'In Progress', 'Review', 'Testing', 'Done'] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export type AgentState = 'idle' | 'working' | 'blocked' | 'reviewing'

export type GateStatus = 'pass' | 'warn' | 'fail' | 'pending'

export interface WishInput {
  id: string
  requester: string
  text: string
  priority: 'P0' | 'P1' | 'P2'
  createdAt: string
}

export interface TaskUnit {
  id: string
  summary: string
  stage: PipelineStage
  progress: number
  etaMinutes: number
  owner: string
}

export interface AgentStatus {
  id: string
  name: string
  role: string
  state: AgentState
  cpu: number
  queueDepth: number
  currentTask: string
}

export interface QualityGate {
  id: string
  name: string
  status: GateStatus
  score: number
  latencyMs: number
}

export interface ThroughputSample {
  tick: number
  throughput: number
  retries: number
}

export interface StreamEvent {
  id: string
  ts: string
  channel: string
  payload: Record<string, unknown>
}

export interface MissionDashboardState {
  wish: WishInput
  task: TaskUnit
  agents: AgentStatus[]
  qualityGates: QualityGate[]
  throughput: ThroughputSample[]
  stream: StreamEvent[]
  activeStage: PipelineStage
  demoProgress: number
  demoRunning: boolean
}

export interface MissionWebSocketClient {
  connect: (url: string) => void
  disconnect: () => void
  isConnected: boolean
}
