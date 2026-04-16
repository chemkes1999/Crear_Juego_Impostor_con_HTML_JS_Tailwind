import { ArrowRight, Scale, UserX } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { playSfx } from "@/lib/sfx"
import { TenebrousEyes, VictoryStar } from "@/components/game/MysterySigils"
import { useGameStore } from "@/store/gameStore"

export default function EliminationScreen() {
  const roundNumber = useGameStore((s) => s.roundNumber)
  const players = useGameStore((s) => s.players)
  const elimination = useGameStore((s) => s.elimination)
  const continueAfterElimination = useGameStore((s) => s.continueAfterElimination)

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const lastDeathId = useRef<string | null>(null)
  const eliminatedId = elimination?.type === "player" ? elimination.playerId : null

  useEffect(() => {
    if (!eliminatedId) return
    if (lastDeathId.current === eliminatedId) return
    lastDeathId.current = eliminatedId
    playSfx("death")
  }, [eliminatedId])

  if (!elimination) return null

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col overflow-hidden px-6 py-10">
      <div aria-hidden className="among-space among-space-elim pointer-events-none absolute inset-0" />
      <div aria-hidden className="among-stars pointer-events-none absolute inset-0 opacity-80" />
      <div aria-hidden className="among-vignette pointer-events-none absolute inset-0" />
      <div aria-hidden className="among-scanlines pointer-events-none absolute inset-0 opacity-35" />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-fg/60">Ronda {roundNumber} • Resultado</div>
          <div className="badge">
            {elimination.type === "tie" ? <Scale className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
            {elimination.type === "tie" ? "Empate" : "Expulsión"}
          </div>
        </div>

        <div className="mt-5">
          <div className="among-title font-display text-balance text-5xl font-black uppercase leading-[0.9] text-fg sm:text-7xl">
            {elimination.type === "tie" ? "No se va nadie" : "Expulsado"}
          </div>
          <div className="mt-3 text-sm font-semibold text-fg/75 sm:text-base">
            {elimination.type === "tie" ? (
              <span>Se repite la votación solo entre los empatados.</span>
            ) : elimination.wasImpostor ? (
              <span>Era el impostor.</span>
            ) : (
              <span>No era el impostor.</span>
            )}
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div className="relative mx-auto w-full max-w-[360px]">
            <div aria-hidden className="among-figure-glow among-figure-glow-elim absolute inset-0" />
            <div className="relative mx-auto flex w-full items-center justify-center">
              {elimination.type === "tie" ? <VictoryStar className="victory-star-elim" /> : <TenebrousEyes className="mystery-eyes-elim" />}
            </div>
          </div>

          <div className="among-panel rounded-[28px] border border-border/12 bg-surface/5 p-6 sm:p-8">
            {elimination.type === "tie" ? (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-fg/60">Empatados</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {elimination.playerIds.map((id) => {
                    const p = byId.get(id)
                    if (!p) return null
                    return (
                      <div key={id} className="chip">
                        {p.name}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={continueAfterElimination}
                  className="btn btn-primary mt-8 w-full px-6 py-4 text-base"
                >
                  Re-votar
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-fg/60">Jugador</div>
                <div className="mt-2 font-display text-3xl font-black text-fg">
                  {byId.get(elimination.playerId)?.name ?? "Jugador"}
                </div>
                <div className="mt-3 text-sm text-fg/65">Siguiente ronda: discutan de nuevo y vuelvan a votar.</div>

                <button
                  type="button"
                  onClick={continueAfterElimination}
                  className="btn mt-8 w-full px-6 py-4 text-base"
                >
                  Siguiente ronda
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
