import { Play, Pause, RotateCcw, Undo2, ArrowRight, Users, Send, Volume2, VolumeX } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useWsStore } from "@/store/wsStore"
import { playSfx } from "@/lib/sfx"

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function DiscussionScreen() {
  const players = useGameStore((s) => s.players)
  const roundNumber = useGameStore((s) => s.roundNumber)
  const discussion = useGameStore((s) => s.discussion)
  const send = useWsStore((s) => s.send)

  const [chatInput, setChatInput] = useState("")
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCount = useRef(discussion.chatMessages.length)
  const lastSecondLeft = useRef(discussion.secondsLeft)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [discussion.chatMessages.length])

  useEffect(() => {
    if (discussion.chatMessages.length > lastMessageCount.current && chatSoundEnabled) {
      playSfx("chatMessage")
    }
    lastMessageCount.current = discussion.chatMessages.length
  }, [discussion.chatMessages.length, chatSoundEnabled])

  useEffect(() => {
    if (discussion.running && discussion.secondsLeft <= 10 && discussion.secondsLeft > 0) {
      if (lastSecondLeft.current !== discussion.secondsLeft) {
        playSfx("countdownTick")
      }
    }
    lastSecondLeft.current = discussion.secondsLeft
  }, [discussion.secondsLeft, discussion.running])

  useEffect(() => {
    if (!discussion.running) return
    const id = window.setInterval(() => {
      useGameStore.setState((s) => ({
        ...s,
        discussion: {
          ...s.discussion,
          secondsLeft: Math.max(0, s.discussion.secondsLeft - 1),
        },
      }))
    }, 1000)
    return () => window.clearInterval(id)
  }, [discussion.running])

  const clock = useMemo(() => formatClock(discussion.secondsLeft), [discussion.secondsLeft])
  const progress = useMemo(() => {
    if (discussion.secondsTotal === 0) return 0
    return discussion.secondsLeft / discussion.secondsTotal
  }, [discussion.secondsLeft, discussion.secondsTotal])

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])
  const eliminated = useMemo(() => players.filter((p) => p.isEliminated), [players])
  const connected = useMemo(() => players.filter((p) => p.isConnected), [players])

  function handleSendChat() {
    if (!chatInput.trim()) return
    send({ type: "chatMessage", payload: { text: chatInput.trim() } })
    setChatInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendChat()
    }
  }

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
            <span className="text-fg/30">•</span>
            <span>{connected.length} conectados</span>
          </div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            Encuentra al impostor.
          </div>
        </div>
        <button
          type="button"
          onClick={() => send({ type: "leaveRoom", payload: null })}
          className="btn rounded-xl px-3 py-2 text-sm font-semibold tracking-normal"
        >
          <Undo2 className="h-4 w-4" />
          Salir
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

          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                useGameStore.setState((s) => ({
                  ...s,
                  discussion: { ...s.discussion, running: !s.discussion.running },
                }))
              }}
              className="btn btn-primary"
            >
              {discussion.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {discussion.running ? "Pausar" : "Iniciar"}
            </button>
            <button
              type="button"
              onClick={() => {
                useGameStore.setState((s) => ({
                  ...s,
                  discussion: { ...s.discussion, secondsLeft: s.discussion.secondsTotal, running: false },
                }))
              }}
              className="btn"
            >
              <RotateCcw className="h-5 w-5" />
              Reiniciar
            </button>
          </div>

          <button
            type="button"
            onClick={() => send({ type: "startVote", payload: null })}
            className="btn btn-accent2 mt-6 w-full px-5 py-4 text-base"
          >
            Ir a votación
            <ArrowRight className="ml-2 inline h-5 w-5" />
          </button>
        </section>

        <section className="panel panel-pad">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Chat</div>
            <button
              onClick={() => setChatSoundEnabled(!chatSoundEnabled)}
              className="btn h-8 w-8 rounded-lg p-0"
              title={chatSoundEnabled ? "Silenciar chat" : "Activar sonido del chat"}
            >
              {chatSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-4 flex h-48 flex-col gap-2 overflow-y-auto rounded-xl border border-border/12 bg-surface/5 p-3">
            {discussion.chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-fg/40">
                No hay mensajes aún
              </div>
            ) : (
              discussion.chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="font-bold text-accent">{msg.playerName}</span>
                  <span className="text-fg/80">: {msg.text}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="input flex-1"
              maxLength={280}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="btn btn-primary h-10 w-10 rounded-xl p-0 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Jugadores</div>
            <div className="mt-3 grid gap-2">
              {alive.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    p.isConnected
                      ? "border-accent/25 bg-accent/10"
                      : "border-border/12 bg-surface/5 opacity-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", p.isConnected ? "bg-accent" : "bg-fg/30")} />
                      <span className="truncate text-sm font-semibold text-fg/90">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-fg/55">
                      {p.isConnected ? "VIVO" : "DESCONECTADO"}
                    </span>
                  </div>
                </div>
              ))}
              {eliminated.length > 0 && (
                <div className="mt-1 rounded-2xl border border-border/12 bg-surface/5 px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-fg/70">Eliminados</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eliminated.map((p) => (
                      <span key={p.id} className="chip">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
