import { EyeOff, ShieldCheck, ShieldAlert, Undo2 } from "lucide-react"
import { useEffect, useMemo, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useWsStore } from "@/store/wsStore"
import { playSfx } from "@/lib/sfx"

export default function DealScreen() {
  const players = useGameStore((s) => s.players)
  const isRevealed = useGameStore((s) => s.isRevealed)
  const reveal = useGameStore((s) => s.reveal)
  const secretWord = useGameStore((s) => s.secretWord)
  const isImpostor = useGameStore((s) => s.isImpostor)
  const deal = useGameStore((s) => s.deal)
  const send = useWsStore((s) => s.send)
  const playerId = useWsStore((s) => s.playerId)

  const [msLeft, setMsLeft] = useState<number | null>(null)
  const hasPlayedRevealSound = useRef(false)

  const player = players.find((p) => p.id === playerId)

  useEffect(() => {
    if (isRevealed && !hasPlayedRevealSound.current) {
      hasPlayedRevealSound.current = true
      playSfx("revealWord")
    }
    if (!isRevealed) {
      hasPlayedRevealSound.current = false
    }
  }, [isRevealed])

  useEffect(() => {
    if (!isRevealed) {
      setMsLeft(null)
      return
    }
    if (!reveal.autoHide) {
      setMsLeft(null)
      return
    }

    const totalMs = reveal.seconds * 1000
    const startedAt = Date.now()
    setMsLeft(totalMs)

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextLeft = Math.max(0, totalMs - elapsed)
      setMsLeft(nextLeft)
      if (nextLeft === 0) {
        window.clearInterval(interval)
        send({ type: "revealAck", payload: null })
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [isRevealed, reveal.autoHide, reveal.seconds, send])

  const progress = useMemo(() => {
    if (msLeft === null) return null
    const total = reveal.seconds * 1000
    return total === 0 ? 0 : msLeft / total
  }, [msLeft, reveal.seconds])

  const readyCount = deal?.playersReady.length ?? 0
  const aliveCount = players.filter((p) => !p.isEliminated).length

  if (!player) return null

  const hasRevealed = deal?.playersReady.includes(playerId) ?? false

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">
            Reparto {readyCount}/{aliveCount}
          </div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            {hasRevealed ? "Esperando a los demás..." : "Revela tu rol"}
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

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="panel p-6 sm:p-10">
          {!isRevealed ? (
            <div className="text-center">
              <div className="badge mx-auto">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Pantalla segura
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-fg sm:text-3xl">
                Nadie más mire. Toca <span className="text-accent">Revelar</span>.
              </div>

              <button
                type="button"
                onClick={() => {
                  useGameStore.setState({ isRevealed: true })
                }}
                className="btn btn-primary mt-8 px-6 py-4 text-base"
              >
                Revelar
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div
                className={cn(
                  "badge mx-auto",
                  isImpostor
                    ? "border-accent2/35 bg-accent2/15 text-fg"
                    : "border-accent/35 bg-accent/15 text-fg",
                )}
              >
                {isImpostor ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {isImpostor ? "IMPOSTOR" : "PALABRA"}
              </div>

              <div className="mt-8 font-display text-balance text-4xl font-black text-fg sm:text-5xl">
                {isImpostor ? "IMPOSTOR" : secretWord ?? "—"}
              </div>

              {reveal.autoHide ? (
                <div className="mx-auto mt-6 max-w-sm">
                  <div className="h-2 overflow-hidden rounded-full bg-surface/10">
                    <div
                      className={cn("h-full", isImpostor ? "bg-accent2/70" : "bg-accent/70")}
                      style={{ width: `${Math.round(((progress ?? 0) * 100) * 10) / 10}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-fg/55">Auto-ocultar activado</div>
                </div>
              ) : (
                <div className="mt-6 text-xs font-semibold text-fg/55">Auto-ocultar desactivado</div>
              )}

              {!hasRevealed && (
                <button
                  type="button"
                  onClick={() => send({ type: "revealAck", payload: null })}
                  className={cn(
                    "btn mt-8 px-6 py-4 text-base",
                    isImpostor ? "btn-accent2" : "btn-primary",
                  )}
                >
                  <EyeOff className="h-5 w-5" />
                  Entendido
                </button>
              )}

              <div className="mt-4 text-sm text-fg/50">
                {readyCount}/{aliveCount} jugadores listos
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
