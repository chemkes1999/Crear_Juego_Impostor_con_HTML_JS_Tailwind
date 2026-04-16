import { Play, Pause, RotateCcw, Undo2, ArrowRight, Users } from "lucide-react"
import { useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function DiscussionScreen() {
  const players = useGameStore((s) => s.players)
  const roundNumber = useGameStore((s) => s.roundNumber)
  const discussion = useGameStore((s) => s.discussion)
  const toggleDiscussion = useGameStore((s) => s.toggleDiscussion)
  const resetDiscussion = useGameStore((s) => s.resetDiscussion)
  const tickDiscussion = useGameStore((s) => s.tickDiscussion)
  const resetToSetup = useGameStore((s) => s.resetToSetup)
  const startVote = useGameStore((s) => s.startVote)

  useEffect(() => {
    if (!discussion.running) return
    const id = window.setInterval(() => tickDiscussion(), 1000)
    return () => window.clearInterval(id)
  }, [discussion.running, tickDiscussion])

  const clock = useMemo(() => formatClock(discussion.secondsLeft), [discussion.secondsLeft])
  const progress = useMemo(() => {
    if (discussion.secondsTotal === 0) return 0
    return discussion.secondsLeft / discussion.secondsTotal
  }, [discussion.secondsLeft, discussion.secondsTotal])

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])
  const eliminated = useMemo(() => players.filter((p) => p.isEliminated), [players])

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
            <span>Ronda {roundNumber}</span>
            <span className="text-white/25">•</span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {alive.length} vivos
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
            Encuentra al impostor.
          </div>
          <div className="mt-3 text-sm text-white/60">No mostramos la palabra aquí para no dar ventaja.</div>
        </div>
        <button
          type="button"
          onClick={resetToSetup}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
        >
          <Undo2 className="h-4 w-4" />
          Ajustes
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold uppercase tracking-wide text-white/80">Temporizador</div>
            <div className={cn("rounded-full border px-3 py-1 text-xs font-semibold", discussion.running ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 bg-white/5 text-white/60")}>
              {discussion.running ? "EN MARCHA" : "PAUSADO"}
            </div>
          </div>

          <div className="mt-6 text-center text-6xl font-black tracking-tight text-white sm:text-7xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
            {clock}
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-lime-300/70" style={{ width: `${Math.round(((progress ?? 0) * 100) * 10) / 10}%` }} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={toggleDiscussion}
              className="inline-flex items-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-300/15 px-5 py-3 text-sm font-black uppercase tracking-wide text-lime-100 transition hover:bg-lime-300/20"
            >
              {discussion.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {discussion.running ? "Pausar" : "Iniciar"}
            </button>
            <button
              type="button"
              onClick={resetDiscussion}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-wide text-white/70 transition hover:bg-white/10"
            >
              <RotateCcw className="h-5 w-5" />
              Reiniciar
            </button>
          </div>

          <button
            type="button"
            onClick={startVote}
            className={cn(
              "mt-6 w-full rounded-2xl border px-5 py-4 text-base font-black uppercase tracking-wide transition",
              discussion.secondsLeft === 0
                ? "border-fuchsia-300/30 bg-fuchsia-300/15 text-fuchsia-100 hover:bg-fuchsia-300/20"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
            )}
          >
            Ir a votación
            <ArrowRight className="ml-2 inline h-5 w-5" />
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold uppercase tracking-wide text-white/80">Jugadores</div>
          </div>

          <div className="mt-4 grid gap-2">
            {alive.map((p, idx) => (
              <div key={p.id} className="rounded-2xl border border-lime-300/20 bg-lime-300/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-white/90">{p.name.trim() || `Jugador ${idx + 1}`}</div>
                  <div className="text-xs font-semibold text-white/40">VIVO</div>
                </div>
              </div>
            ))}
            {eliminated.length > 0 ? (
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-white/60">Eliminados</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {eliminated.map((p) => (
                    <div key={p.id} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/60">
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
