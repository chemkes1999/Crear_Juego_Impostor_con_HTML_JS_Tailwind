import { Play, Pause, RotateCcw, Undo2, ArrowRight, Users } from "lucide-react"
import { useEffect, useMemo } from "react"
import { hostPublishGameState } from "@/game/onlineActions"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useRoomStore } from "@/store/roomStore"

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

  const mode = useRoomStore((s) => s.mode)
  const roomStatus = useRoomStore((s) => s.status)
  const isHost = useRoomStore((s) => s.isHost)
  const roster = useRoomStore((s) => s.roster)
  const publishPublicState = useRoomStore((s) => s.publishPublicState)
  const sendPrivate = useRoomStore((s) => s.sendPrivate)

  const roomApi = useMemo(() => ({ roster, publishPublicState, sendPrivate }), [publishPublicState, roster, sendPrivate])
  const isOnline = mode === "online" && roomStatus === "in_room"

  useEffect(() => {
    if (!discussion.running) return
    if (isOnline && !isHost) return
    const id = window.setInterval(() => {
      tickDiscussion()
      if (isOnline && isHost) hostPublishGameState(roomApi)
    }, 1000)
    return () => window.clearInterval(id)
  }, [discussion.running, isHost, isOnline, roomApi, tickDiscussion])

  const clock = useMemo(() => formatClock(discussion.secondsLeft), [discussion.secondsLeft])
  const progress = useMemo(() => {
    if (discussion.secondsTotal === 0) return 0
    return discussion.secondsLeft / discussion.secondsTotal
  }, [discussion.secondsLeft, discussion.secondsTotal])

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])
  const eliminated = useMemo(() => players.filter((p) => p.isEliminated), [players])

  const onToggle = useMemo(() => {
    if (!isOnline || isHost) return () => {
      toggleDiscussion()
      if (isOnline && isHost) hostPublishGameState(roomApi)
    }
    return () => {}
  }, [isHost, isOnline, roomApi, toggleDiscussion])

  const onReset = useMemo(() => {
    if (!isOnline || isHost) return () => {
      resetDiscussion()
      if (isOnline && isHost) hostPublishGameState(roomApi)
    }
    return () => {}
  }, [isHost, isOnline, resetDiscussion, roomApi])

  const onStartVote = useMemo(() => {
    if (!isOnline || isHost) return () => {
      startVote()
      if (isOnline && isHost) hostPublishGameState(roomApi)
    }
    return () => {}
  }, [isHost, isOnline, roomApi, startVote])

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg/55">
            <span>Ronda {roundNumber}</span>
            <span className="text-fg/30">•</span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {alive.length} vivos
            </span>
          </div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            Encuentra al impostor.
          </div>
          <div className="mt-3 text-sm text-fg/65">No mostramos la palabra aquí para no dar ventaja.</div>
        </div>
        <button
          type="button"
          onClick={resetToSetup}
          className="btn rounded-xl px-3 py-2 text-sm font-semibold tracking-normal"
        >
          <Undo2 className="h-4 w-4" />
          Ajustes
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel panel-pad">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Temporizador</div>
            <div
              className={cn(
                "badge",
                discussion.running ? "border-accent/35 bg-accent/15 text-fg" : "border-border/12 bg-surface/5 text-fg/70",
              )}
            >
              {discussion.running ? "EN MARCHA" : "PAUSADO"}
            </div>
          </div>

          <div className="mt-6 text-center font-display text-6xl font-black tracking-tight text-fg sm:text-7xl">
            {clock}
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-surface/10">
              <div className="h-full bg-accent/70" style={{ width: `${Math.round(((progress ?? 0) * 100) * 10) / 10}%` }} />
            </div>
          </div>

          {isOnline && !isHost ? null : (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={onToggle} className="btn btn-primary">
                {discussion.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {discussion.running ? "Pausar" : "Iniciar"}
              </button>
              <button type="button" onClick={onReset} className="btn">
                <RotateCcw className="h-5 w-5" />
                Reiniciar
              </button>
            </div>
          )}

          {isOnline && !isHost ? null : (
            <button
              type="button"
              onClick={onStartVote}
              className={cn(
                "btn mt-6 w-full px-5 py-4 text-base",
                discussion.secondsLeft === 0 ? "btn-accent2" : "",
              )}
            >
              Ir a votación
              <ArrowRight className="ml-2 inline h-5 w-5" />
            </button>
          )}
        </section>

        <section className="panel panel-pad">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Jugadores</div>
          </div>

          <div className="mt-4 grid gap-2">
            {alive.map((p, idx) => (
              <div key={p.id} className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-fg/90">{p.name.trim() || `Jugador ${idx + 1}`}</div>
                  <div className="text-xs font-semibold text-fg/55">VIVO</div>
                </div>
              </div>
            ))}
            {eliminated.length > 0 ? (
              <div className="mt-2 rounded-2xl border border-border/12 bg-surface/5 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-fg/70">Eliminados</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {eliminated.map((p) => (
                    <div key={p.id} className="chip">
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
