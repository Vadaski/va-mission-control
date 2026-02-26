import { motion } from 'framer-motion'
import {
  AgentStatusPanel,
  QualityGatesPanel,
  StateMachinePanel,
  StreamPanel,
  WishPipelinePanel,
} from './components/DashboardPanels'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useMissionControlStream } from './hooks/useMissionControlStream'

const formatStreamLine = (event: { ts: string; channel: string; payload: Record<string, unknown> }): string => {
  return JSON.stringify({
    ts: event.ts,
    channel: event.channel,
    ...event.payload,
  })
}

function App() {
  const { state, startDemo, resetDemo, socketClient } = useMissionControlStream()
  const streamRef = useAutoScroll<HTMLDivElement>([state.stream.length])

  return (
    <main className="mission-shell relative isolate min-h-screen overflow-hidden p-3 md:p-4 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="ambient-grid absolute inset-0" />
        <div className="ambient-orb ambient-orb-cyan" />
        <div className="ambient-orb ambient-orb-emerald" />
      </div>

      <motion.header
        className="panel mb-4 rounded-xl px-4 py-3 md:mb-5 md:px-5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">VA MISSION CONTROL</p>
            <h1 className="text-xl font-semibold text-cyan-50 md:text-2xl">Wish Engine Operations Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startDemo}
              className="rounded border border-cyan-300/50 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
            >
              Demo Mode (15s)
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="rounded border border-slate-400/40 bg-slate-400/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-400/20"
            >
              Reset
            </button>
            <div className="rounded border border-slate-500/30 bg-black/30 px-2 py-1 text-xs text-slate-300">
              WS: {socketClient.isConnected ? 'Connected' : 'Standby'}
            </div>
          </div>
        </div>
      </motion.header>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="lg:col-span-2 xl:col-span-6">
          <WishPipelinePanel state={state} />
        </div>
        <div className="xl:col-span-3">
          <AgentStatusPanel agents={state.agents} />
        </div>
        <div className="xl:col-span-3">
          <QualityGatesPanel gates={state.qualityGates} />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2 xl:mt-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <StateMachinePanel activeStage={state.activeStage} progress={state.demoProgress} />
        </div>
        <div className="xl:col-span-5">
          <StreamPanel streamLines={state.stream.map(formatStreamLine)} streamRef={streamRef} />
        </div>
      </section>

      <footer className="mt-3 text-right text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {state.demoRunning ? `Demo Running ${state.demoProgress}%` : 'Demo Ready'}
      </footer>
    </main>
  )
}

export default App
