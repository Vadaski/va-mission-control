import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PIPELINE_STAGES,
  type AgentStatus,
  type MissionDashboardState,
  type MissionWebSocketClient,
  type PipelineStage,
  type QualityGate,
  type StreamEvent,
  type ThroughputSample,
  type WishInput,
} from '../types/mission'

const DEMO_DURATION_MS = 15_000
const TICK_MS = 250
const STAGE_WINDOW_MS = DEMO_DURATION_MS / PIPELINE_STAGES.length

const wishPool: WishInput[] = [
  {
    id: 'WISH-4421',
    requester: 'va-memory-router',
    text: 'Build persistent episodic memory with auto-recall checkpoints.',
    priority: 'P0',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'WISH-4422',
    requester: 'va-planner',
    text: 'Optimize task decomposition to reduce cycle time by 30%.',
    priority: 'P1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'WISH-4423',
    requester: 'va-ui-agent',
    text: 'Generate mission dashboard with live quality gates and analytics.',
    priority: 'P1',
    createdAt: new Date().toISOString(),
  },
]

const baseAgents: Omit<AgentStatus, 'state' | 'cpu' | 'queueDepth' | 'currentTask'>[] = [
  { id: 'A-01', name: 'architect', role: 'TaskUnit Planner' },
  { id: 'A-02', name: 'executor', role: 'Implementation Agent' },
  { id: 'A-03', name: 'critic', role: 'Quality Evaluator' },
  { id: 'A-04', name: 'synth', role: 'Release Synthesizer' },
]

const gateNames = ['Schema', 'TypeCheck', 'Tests', 'Review'] as const

const stageOrder = PIPELINE_STAGES

const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const statusByStage: Record<PipelineStage, AgentStatus['state'][]> = {
  Backlog: ['working', 'idle', 'idle', 'idle'],
  'In Progress': ['working', 'working', 'idle', 'idle'],
  Review: ['reviewing', 'working', 'working', 'idle'],
  Testing: ['reviewing', 'working', 'working', 'working'],
  Done: ['idle', 'idle', 'reviewing', 'idle'],
}

const gateByStage: Record<PipelineStage, QualityGate['status'][]> = {
  Backlog: ['pending', 'pending', 'pending', 'pending'],
  'In Progress': ['pass', 'pending', 'pending', 'pending'],
  Review: ['pass', 'pass', 'pending', 'warn'],
  Testing: ['pass', 'pass', 'pass', 'warn'],
  Done: ['pass', 'pass', 'pass', 'pass'],
}

const stageMessage: Record<PipelineStage, string> = {
  Backlog: 'wish_received',
  'In Progress': 'taskunit_dispatched',
  Review: 'peer_review_started',
  Testing: 'quality_gate_run',
  Done: 'mission_done',
}

const makeStreamEvent = (channel: string, payload: Record<string, unknown>): StreamEvent => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  ts: new Date().toISOString(),
  channel,
  payload,
})

const makeThroughputPoint = (tick: number, stage: PipelineStage, progress: number): ThroughputSample => {
  const stageWeight: Record<PipelineStage, number> = {
    Backlog: 1,
    'In Progress': 3,
    Review: 2,
    Testing: 2,
    Done: 4,
  }

  return {
    tick,
    throughput: stageWeight[stage] * 8 + Math.floor(progress * 0.2) + randomBetween(0, 4),
    retries: stage === 'Review' || stage === 'Testing' ? randomBetween(0, 3) : randomBetween(0, 1),
  }
}

const createBaseState = (): MissionDashboardState => {
  const wish = wishPool[0]
  return {
    wish,
    task: {
      id: `TU-${wish.id.split('-')[1]}`,
      summary: wish.text,
      stage: 'Backlog',
      progress: 0,
      etaMinutes: 15,
      owner: 'architect',
    },
    agents: baseAgents.map((agent) => ({
      ...agent,
      state: 'idle',
      cpu: 8,
      queueDepth: 0,
      currentTask: 'awaiting_assignment',
    })),
    qualityGates: gateNames.map((name, index) => ({
      id: `QG-${index + 1}`,
      name,
      status: 'pending',
      score: 0,
      latencyMs: 0,
    })),
    throughput: Array.from({ length: 10 }, (_, index) => ({
      tick: index,
      throughput: 8,
      retries: 0,
    })),
    stream: [
      makeStreamEvent('bootstrap', {
        app: 'va-mission-control',
        mode: 'demo',
        status: 'ready',
      }),
    ],
    activeStage: 'Backlog',
    demoProgress: 0,
    demoRunning: false,
  }
}

const deriveAgents = (stage: PipelineStage, taskId: string): AgentStatus[] => {
  return baseAgents.map((agent, index) => {
    const state = statusByStage[stage][index]
    return {
      ...agent,
      state,
      cpu: state === 'working' ? randomBetween(55, 93) : state === 'reviewing' ? randomBetween(38, 68) : randomBetween(8, 25),
      queueDepth: state === 'idle' ? 0 : randomBetween(1, 5),
      currentTask: state === 'idle' ? 'awaiting_assignment' : `${taskId}:${stage.toLowerCase().replace(/\s+/g, '_')}`,
    }
  })
}

const deriveGates = (stage: PipelineStage): QualityGate[] => {
  return gateNames.map((name, index) => {
    const status = gateByStage[stage][index]
    const score =
      status === 'pass' ? randomBetween(88, 99) : status === 'warn' ? randomBetween(72, 85) : status === 'fail' ? randomBetween(30, 60) : 0

    return {
      id: `QG-${index + 1}`,
      name,
      status,
      score,
      latencyMs: status === 'pending' ? 0 : randomBetween(35, 240),
    }
  })
}

const deriveTaskOwner = (stage: PipelineStage): string => {
  if (stage === 'Backlog') {
    return 'architect'
  }

  if (stage === 'In Progress') {
    return 'executor'
  }

  if (stage === 'Review' || stage === 'Testing') {
    return 'critic'
  }

  return 'synth'
}

export interface UseMissionControlStreamResult {
  state: MissionDashboardState
  startDemo: () => void
  resetDemo: () => void
  socketClient: MissionWebSocketClient
}

export const useMissionControlStream = (): UseMissionControlStreamResult => {
  const [state, setState] = useState<MissionDashboardState>(() => createBaseState())
  const timerRef = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const startedAtRef = useRef<number>(0)
  const previousStageRef = useRef<PipelineStage>('Backlog')

  const stopTicker = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetDemo = useCallback(() => {
    stopTicker()
    previousStageRef.current = 'Backlog'
    setState(createBaseState())
  }, [stopTicker])

  const socketClient = useMemo<MissionWebSocketClient>(
    () => ({
      connect: (url) => {
        if (wsRef.current) {
          wsRef.current.close()
        }

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as Record<string, unknown>
            setState((prev) => ({
              ...prev,
              stream: [...prev.stream.slice(-99), makeStreamEvent('ws_message', payload)],
            }))
          } catch {
            setState((prev) => ({
              ...prev,
              stream: [
                ...prev.stream.slice(-99),
                makeStreamEvent('ws_message_parse_error', { raw: String(event.data) }),
              ],
            }))
          }
        }

        ws.onopen = () => {
          setState((prev) => ({
            ...prev,
            stream: [...prev.stream.slice(-99), makeStreamEvent('ws_connected', { url })],
          }))
        }

        ws.onclose = () => {
          setState((prev) => ({
            ...prev,
            stream: [...prev.stream.slice(-99), makeStreamEvent('ws_disconnected', { url })],
          }))
        }
      },
      disconnect: () => {
        wsRef.current?.close()
        wsRef.current = null
      },
      get isConnected() {
        return wsRef.current?.readyState === WebSocket.OPEN
      },
    }),
    [],
  )

  const startDemo = useCallback(() => {
    stopTicker()

    const nextWish = wishPool[randomBetween(0, wishPool.length - 1)]
    const taskId = `TU-${nextWish.id.split('-')[1]}-${Math.floor(Math.random() * 90 + 10)}`

    previousStageRef.current = 'Backlog'
    startedAtRef.current = Date.now()

    setState((prev) => ({
      ...prev,
      wish: { ...nextWish, createdAt: new Date().toISOString() },
      task: {
        id: taskId,
        summary: nextWish.text,
        stage: 'Backlog',
        progress: 0,
        etaMinutes: 15,
        owner: 'architect',
      },
      agents: deriveAgents('Backlog', taskId),
      qualityGates: deriveGates('Backlog'),
      stream: [
        ...prev.stream.slice(-40),
        makeStreamEvent('wish_input', {
          wishId: nextWish.id,
          priority: nextWish.priority,
          requester: nextWish.requester,
        }),
      ],
      activeStage: 'Backlog',
      demoProgress: 0,
      demoRunning: true,
    }))

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      const boundedElapsed = Math.min(elapsed, DEMO_DURATION_MS)
      const demoProgress = Math.round((boundedElapsed / DEMO_DURATION_MS) * 100)
      const stageIndex = Math.min(Math.floor(boundedElapsed / STAGE_WINDOW_MS), stageOrder.length - 1)
      const activeStage = stageOrder[stageIndex]
      const isFinalTick = boundedElapsed >= DEMO_DURATION_MS

      setState((prev) => {
        const stageChanged = previousStageRef.current !== activeStage
        if (stageChanged) {
          previousStageRef.current = activeStage
        }

        const throughputPoint = makeThroughputPoint(Math.floor(boundedElapsed / 1000), activeStage, demoProgress)
        const updatedStream = [...prev.stream]

        if (stageChanged || boundedElapsed % 1000 < TICK_MS) {
          updatedStream.push(
            makeStreamEvent(stageMessage[activeStage], {
              taskId: prev.task.id,
              stage: activeStage,
              progress: demoProgress,
              agentsOnline: prev.agents.length,
            }),
          )
        }

        return {
          ...prev,
          task: {
            ...prev.task,
            stage: activeStage,
            owner: deriveTaskOwner(activeStage),
            progress: demoProgress,
            etaMinutes: Math.max(1, Math.ceil((DEMO_DURATION_MS - boundedElapsed) / 1000)),
          },
          agents: deriveAgents(activeStage, prev.task.id),
          qualityGates: deriveGates(activeStage),
          activeStage,
          demoProgress,
          demoRunning: !isFinalTick,
          throughput: [...prev.throughput.slice(-18), throughputPoint],
          stream: updatedStream.slice(-120),
        }
      })

      if (isFinalTick) {
        stopTicker()
      }
    }, TICK_MS)
  }, [stopTicker])

  useEffect(() => {
    return () => {
      stopTicker()
      socketClient.disconnect()
    }
  }, [socketClient, stopTicker])

  return {
    state,
    startDemo,
    resetDemo,
    socketClient,
  }
}
