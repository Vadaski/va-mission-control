import { AnimatePresence, motion } from 'framer-motion'
import type { RefObject } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  AgentStatus,
  GateStatus,
  MissionDashboardState,
  PipelineStage,
  QualityGate,
} from '../types/mission'

interface WishPipelinePanelProps {
  state: MissionDashboardState
}

interface AgentStatusPanelProps {
  agents: AgentStatus[]
}

interface QualityGatesPanelProps {
  gates: QualityGate[]
}

interface StateMachinePanelProps {
  activeStage: PipelineStage
  progress: number
}

interface StreamPanelProps {
  streamLines: string[]
  streamRef: RefObject<HTMLDivElement | null>
}

const badgeClassByGate: Record<GateStatus, string> = {
  pass: 'text-emerald-300 border-emerald-300/40 bg-emerald-400/10',
  warn: 'text-amber-300 border-amber-300/40 bg-amber-400/10',
  fail: 'text-red-300 border-red-300/40 bg-red-400/10',
  pending: 'text-slate-300 border-slate-300/30 bg-slate-400/10',
}

const statusClassByAgent: Record<AgentStatus['state'], string> = {
  idle: 'bg-slate-400',
  working: 'bg-amber-300 shadow-amber-300/70',
  blocked: 'bg-red-400 shadow-red-400/70',
  reviewing: 'bg-cyan-300 shadow-cyan-300/70',
}

const toneByAgentState: Record<AgentStatus['state'], string> = {
  idle: 'border-slate-500/20 bg-black/25',
  working: 'border-amber-300/35 bg-amber-400/10',
  blocked: 'border-red-300/35 bg-red-400/10',
  reviewing: 'border-cyan-300/35 bg-cyan-400/10',
}

const cpuBarByAgentState: Record<AgentStatus['state'], string> = {
  idle: 'bg-slate-400/60',
  working: 'bg-gradient-to-r from-amber-300 to-amber-200',
  blocked: 'bg-gradient-to-r from-red-400 to-red-300',
  reviewing: 'bg-gradient-to-r from-cyan-300 to-sky-300',
}

const pulseShadowByAgentState: Record<AgentStatus['state'], string[]> = {
  idle: ['0 0 0 rgba(0, 0, 0, 0)', '0 0 0 rgba(0, 0, 0, 0)', '0 0 0 rgba(0, 0, 0, 0)'],
  working: [
    '0 0 0 rgba(251, 191, 36, 0)',
    '0 0 22px rgba(251, 191, 36, 0.22)',
    '0 0 0 rgba(251, 191, 36, 0)',
  ],
  blocked: [
    '0 0 0 rgba(248, 113, 113, 0)',
    '0 0 22px rgba(248, 113, 113, 0.22)',
    '0 0 0 rgba(248, 113, 113, 0)',
  ],
  reviewing: [
    '0 0 0 rgba(34, 211, 238, 0)',
    '0 0 22px rgba(34, 211, 238, 0.2)',
    '0 0 0 rgba(34, 211, 238, 0)',
  ],
}

const STAGES: PipelineStage[] = ['Backlog', 'In Progress', 'Review', 'Testing', 'Done']

const stageThemeByStage: Record<
  PipelineStage,
  {
    active: string
    glow: string
    particle: string
    connector: string
    progress: string
    detail: string
  }
> = {
  Backlog: {
    active: 'border-cyan-300/70 bg-cyan-400/20 text-cyan-100',
    glow: 'bg-cyan-300/45',
    particle: 'bg-cyan-200',
    connector: 'bg-cyan-300/80',
    progress: 'bg-gradient-to-r from-cyan-300 via-cyan-200 to-sky-300',
    detail: 'Ingestion queue primed and waiting for dispatch.',
  },
  'In Progress': {
    active: 'border-amber-300/70 bg-amber-400/20 text-amber-100',
    glow: 'bg-amber-300/45',
    particle: 'bg-amber-200',
    connector: 'bg-amber-300/80',
    progress: 'bg-gradient-to-r from-amber-300 via-amber-200 to-orange-300',
    detail: 'Primary implementation running with active agent load.',
  },
  Review: {
    active: 'border-sky-300/70 bg-sky-400/20 text-sky-100',
    glow: 'bg-sky-300/45',
    particle: 'bg-sky-200',
    connector: 'bg-sky-300/80',
    progress: 'bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-200',
    detail: 'Peer validation and coherence checks are underway.',
  },
  Testing: {
    active: 'border-red-300/70 bg-red-400/20 text-red-100',
    glow: 'bg-red-300/45',
    particle: 'bg-red-200',
    connector: 'bg-red-300/80',
    progress: 'bg-gradient-to-r from-red-300 via-amber-200 to-red-200',
    detail: 'Quality gates executing with defensive verification.',
  },
  Done: {
    active: 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100',
    glow: 'bg-emerald-300/45',
    particle: 'bg-emerald-200',
    connector: 'bg-emerald-300/80',
    progress: 'bg-gradient-to-r from-emerald-300 via-emerald-200 to-cyan-200',
    detail: 'Mission completed. Results packaged and handed off.',
  },
}

const stageParticleOffsets = [
  { left: '14%', top: '70%' },
  { left: '28%', top: '28%' },
  { left: '56%', top: '64%' },
  { left: '82%', top: '36%' },
] as const

const humanize = (text: string): string => {
  return text.replace(/_/g, ' ')
}

export const WishPipelinePanel = ({ state }: WishPipelinePanelProps) => {
  return (
    <section className="panel rounded-xl p-4 md:p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-cyan-100">Wish Pipeline</h2>
        <span className="rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
          {state.wish.priority}
        </span>
      </header>

      <motion.div
        layout
        className="mb-3 rounded-lg border border-sky-300/20 bg-sky-500/5 p-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-sky-200/80">Wish Input</p>
        <p className="text-sm text-slate-100">{state.wish.text}</p>
      </motion.div>

      <div className="mb-3 rounded-lg border border-slate-500/20 bg-black/30 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span>TaskUnit: {state.task.id}</span>
          <span>Owner: {state.task.owner}</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300"
            animate={{ width: `${state.task.progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.35 }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
          <span>{state.task.stage}</span>
          <span>{state.task.progress}%</span>
        </div>
      </div>

      <div className="h-40 rounded-lg border border-slate-500/20 bg-black/20 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={state.throughput}>
            <defs>
              <linearGradient id="throughputGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#53d7ff" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#53d7ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="tick" tick={{ fill: '#8db7c8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8db7c8', fontSize: 11 }} width={26} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(2, 6, 23, 0.95)',
                border: '1px solid rgba(83, 215, 255, 0.35)',
                borderRadius: '0.5rem',
                color: '#d8f7ff',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="throughput"
              stroke="#53d7ff"
              strokeWidth={2}
              fill="url(#throughputGradient)"
              animationDuration={300}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export const AgentStatusPanel = ({ agents }: AgentStatusPanelProps) => {
  return (
    <section className="panel rounded-xl p-4 md:p-5">
      <h2 className="mb-4 text-base font-semibold text-cyan-100">Agent Status</h2>
      <ul className="space-y-3">
        {agents.map((agent) => (
          <motion.li
            key={agent.id}
            layout
            className={`rounded-lg border p-3 ${toneByAgentState[agent.state]}`}
            initial={{ opacity: 0, x: 8 }}
            animate={
              agent.state === 'idle'
                ? { opacity: 1, x: 0, scale: 1, boxShadow: pulseShadowByAgentState.idle }
                : {
                    opacity: 1,
                    x: 0,
                    scale: [1, 1.01, 1],
                    boxShadow: pulseShadowByAgentState[agent.state],
                  }
            }
            transition={
              agent.state === 'idle'
                ? { duration: 0.25 }
                : {
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{agent.name}</p>
                <p className="text-xs text-slate-400">{agent.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  className={`h-2.5 w-2.5 rounded-full ${statusClassByAgent[agent.state]}`}
                  animate={agent.state === 'idle' ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
                  transition={agent.state === 'idle' ? { duration: 0.2 } : { repeat: Infinity, duration: 1.4 }}
                />
                <span className="text-xs uppercase tracking-wide text-slate-300">{humanize(agent.state)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>CPU</span>
                <span>{agent.cpu}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                <motion.div
                  className={`h-full ${cpuBarByAgentState[agent.state]}`}
                  animate={{ width: `${agent.cpu}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Queue</span>
                <span>{agent.queueDepth}</span>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

export const QualityGatesPanel = ({ gates }: QualityGatesPanelProps) => {
  return (
    <section className="panel rounded-xl p-4 md:p-5">
      <h2 className="mb-4 text-base font-semibold text-cyan-100">Quality Gates</h2>
      <ul className="space-y-3">
        {gates.map((gate) => (
          <motion.li
            key={gate.id}
            layout
            className="rounded-lg border border-slate-500/20 bg-black/25 p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-100">{gate.name}</p>
              <span className={`rounded border px-1.5 py-0.5 text-[11px] uppercase ${badgeClassByGate[gate.status]}`}>
                {gate.status}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Score</span>
                <span>{gate.status === 'pending' ? '--' : `${gate.score}%`}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  animate={{ width: `${gate.score}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                <span>Latency</span>
                <span>{gate.status === 'pending' ? '--' : `${gate.latencyMs}ms`}</span>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

export const StateMachinePanel = ({ activeStage, progress }: StateMachinePanelProps) => {
  const activeIndex = STAGES.indexOf(activeStage)
  const activeTheme = stageThemeByStage[activeStage]

  return (
    <section className="panel rounded-xl p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-cyan-100">State Machine</h2>
        <p className="text-xs text-slate-400">Pipeline Flow</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-center">
        {STAGES.map((stage, index) => {
          const isActive = stage === activeStage
          const stagePast = activeIndex > index
          const theme = stageThemeByStage[stage]

          return (
            <div key={stage} className="relative">
              <motion.div
                layout
                className={`relative overflow-hidden rounded-lg border px-3 py-2 text-center text-xs uppercase tracking-[0.14em] ${
                  isActive
                    ? theme.active
                    : stagePast
                      ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                      : 'border-slate-500/30 bg-black/30 text-slate-400'
                }`}
                animate={isActive ? { y: [0, -2, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
                transition={
                  isActive
                    ? {
                        repeat: Infinity,
                        duration: 2,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.25 }
                }
              >
                {isActive && (
                  <>
                    <motion.span
                      className={`pointer-events-none absolute inset-0 blur-xl ${theme.glow}`}
                      animate={{ opacity: [0.2, 0.55, 0.25] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {stageParticleOffsets.map((particle, particleIndex) => (
                      <motion.span
                        key={`${stage}-${particleIndex}`}
                        className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full ${theme.particle}`}
                        style={particle}
                        animate={{
                          y: [0, -7, 0],
                          opacity: [0.35, 0.95, 0.35],
                          scale: [0.85, 1.2, 0.85],
                        }}
                        transition={{
                          duration: 1.5 + particleIndex * 0.18,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: particleIndex * 0.14,
                        }}
                      />
                    ))}
                    <motion.span
                      layoutId="active-stage-outline"
                      className="pointer-events-none absolute inset-0 rounded-lg border border-white/30"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  </>
                )}
                {stage}
              </motion.div>

              {index < STAGES.length - 1 && (
                <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 sm:block">
                  <motion.div
                    className={`h-full w-full rounded-full ${
                      stagePast || isActive ? theme.connector : 'bg-slate-500/60'
                    }`}
                    initial={false}
                    animate={{
                      scaleX: stagePast || isActive ? 1 : 0.6,
                      opacity: stagePast || isActive ? 1 : 0.35,
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 min-h-[54px] rounded-lg border border-slate-500/25 bg-black/35 px-3 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">{activeStage}</p>
            <p className="text-xs text-slate-200">{activeTheme.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800/80">
        <motion.div
          className={`h-full ${activeTheme.progress}`}
          animate={{ width: `${progress}%` }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
        />
      </div>
    </section>
  )
}

export const StreamPanel = ({ streamLines, streamRef }: StreamPanelProps) => {
  return (
    <section className="panel rounded-xl p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-cyan-100">Real-time Data Stream</h2>
        <span className="rounded border border-slate-500/40 px-2 py-0.5 text-[11px] text-slate-300">JSON</span>
      </div>

      <div
        ref={streamRef}
        className="stream-panel h-[240px] overflow-auto rounded-lg border border-slate-500/20 bg-black/45 p-3 text-xs text-slate-200 sm:h-[280px] lg:h-[320px] xl:h-[280px]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {streamLines.map((line, index) => (
            <motion.pre
              key={`${line}-${index}`}
              layout
              className="mb-1.5 whitespace-pre-wrap break-all text-[11px] leading-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {line}
            </motion.pre>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
