import { ArrowRight, Scale, UserX } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"

export default function EliminationScreen() {
  const roundNumber = useGameStore((s) => s.roundNumber)
  const players = useGameStore((s) => s.players)
  const elimination = useGameStore((s) => s.elimination)
  const continueAfterElimination = useGameStore((s) => s.continueAfterElimination)

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  if (!elimination) return null

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Ronda {roundNumber} • Resultado</div>
        <div className="mt-2 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
          Eliminación
        </div>
        <div className="mt-3 text-sm text-white/60">Se aplica el resultado y empieza la siguiente ronda.</div>
      </div>

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
          {elimination.type === "tie" ? (
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
                <Scale className="h-4 w-4" />
                Empate
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-white sm:text-3xl">No se elimina a nadie.</div>
              <p className="mt-3 text-sm text-white/60">Se repite la votación solo entre los empatados.</p>

              <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                {elimination.playerIds.map((id) => {
                  const p = byId.get(id)
                  if (!p) return null
                  return (
                    <div key={id} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                      {p.name}
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={continueAfterElimination}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-300/15 px-6 py-4 text-base font-black uppercase tracking-wide text-lime-100 transition hover:bg-lime-300/20"
              >
                Re-votar
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className={cn("mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", "border-white/10 bg-white/5 text-white/70")}>
                <UserX className="h-4 w-4" />
                Eliminado
              </div>
              <div className="mt-6 text-balance text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
                {byId.get(elimination.playerId)?.name ?? "Jugador"}
              </div>
              <p className="mt-3 text-sm text-white/60">Siguiente ronda: discutan de nuevo y vuelvan a votar.</p>

              <button
                type="button"
                onClick={continueAfterElimination}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-300/15 px-6 py-4 text-base font-black uppercase tracking-wide text-lime-100 transition hover:bg-lime-300/20"
              >
                Siguiente ronda
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

