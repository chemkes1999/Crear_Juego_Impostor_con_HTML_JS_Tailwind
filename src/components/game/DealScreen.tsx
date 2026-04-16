import { Eye, EyeOff, ShieldAlert, ShieldCheck, Undo2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"

function formatPlayerLabel(name: string, index: number) {
  const safe = name.trim()
  return safe ? safe : `Jugador ${index + 1}`
}

export default function DealScreen() {
  const players = useGameStore((s) => s.players)
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex)
  const isRevealed = useGameStore((s) => s.isRevealed)
  const reveal = useGameStore((s) => s.reveal)
  const secretWord = useGameStore((s) => s.secretWord)
  const impostorId = useGameStore((s) => s.impostorId)
  const revealRole = useGameStore((s) => s.revealRole)
  const hideAndNext = useGameStore((s) => s.hideAndNext)
  const resetToSetup = useGameStore((s) => s.resetToSetup)

  const player = players[currentPlayerIndex]
  const isImpostor = player?.id === impostorId

  const [msLeft, setMsLeft] = useState<number | null>(null)

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
        hideAndNext()
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [hideAndNext, isRevealed, reveal.autoHide, reveal.seconds])

  const progress = useMemo(() => {
    if (msLeft === null) return null
    const total = reveal.seconds * 1000
    return total === 0 ? 0 : msLeft / total
  }, [msLeft, reveal.seconds])

  if (!player) return null

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">
            Reparto {currentPlayerIndex + 1}/{players.length}
          </div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            {formatPlayerLabel(player.name, currentPlayerIndex)}
          </div>
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

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="panel p-6 sm:p-10">
          {!isRevealed ? (
            <div className="text-center">
              <div className="badge mx-auto">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Pantalla segura
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-fg sm:text-3xl">
                Toma el dispositivo y toca <span className="text-accent">Revelar</span>.
              </div>
              <p className="mt-3 text-sm text-fg/65">Asegúrate de que nadie más mire.</p>

              <button
                type="button"
                onClick={revealRole}
                className="btn btn-primary mt-8 px-6 py-4 text-base"
              >
                <Eye className="h-5 w-5" />
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

              <button
                type="button"
                onClick={hideAndNext}
                className={cn(
                  "btn mt-8 px-6 py-4 text-base",
                  isImpostor
                    ? "btn-accent2"
                    : "btn-primary",
                )}
              >
                <EyeOff className="h-5 w-5" />
                Ocultar y pasar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
