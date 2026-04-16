import { Check, ShieldCheck, Undo2 } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"

export default function VoteScreen() {
  const roundNumber = useGameStore((s) => s.roundNumber)
  const players = useGameStore((s) => s.players)
  const vote = useGameStore((s) => s.vote)
  const startVoteTurn = useGameStore((s) => s.startVoteTurn)
  const setVoteTarget = useGameStore((s) => s.setVoteTarget)
  const submitVote = useGameStore((s) => s.submitVote)
  const resetToSetup = useGameStore((s) => s.resetToSetup)

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])

  if (!vote) return null

  const voterId = vote.voterIds[vote.voterIndex]
  const voter = alive.find((p) => p.id === voterId)
  const eligible = new Set(vote.eligibleIds)
  const availableTargets = alive.filter((p) => eligible.has(p.id) && p.id !== voterId)
  const stepLabel = `${vote.voterIndex + 1}/${vote.voterIds.length}`

  return (
    <div className="screen flex min-h-[100svh] max-w-5xl flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">Ronda {roundNumber} • Votación {stepLabel}</div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            Vota en secreto.
          </div>
          <div className="mt-3 text-sm text-fg/65">Pasa el dispositivo: vota una persona a la vez.</div>
        </div>
        <button
          type="button"
          onClick={resetToSetup}
          className="btn h-11 rounded-xl px-3.5 py-0 text-sm font-semibold tracking-normal"
        >
          <Undo2 className="h-4 w-4" />
          Ajustes
        </button>
      </div>

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="panel p-6 sm:p-10">
          {vote.isReady ? (
            <div className="text-center">
              <div className="badge mx-auto">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Pantalla segura
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-fg sm:text-3xl">
                {voter?.name ?? "Jugador"}: toma el dispositivo y toca <span className="text-accent">Votar</span>.
              </div>
              <p className="mt-3 text-sm text-fg/65">Que nadie vea tu elección.</p>
              <button
                type="button"
                onClick={startVoteTurn}
                className="btn btn-primary mt-8 px-6 py-4 text-base"
              >
                Votar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Elige a quién eliminar</div>
                <div className="badge">
                  {voter?.name ?? "Jugador"} vota
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {availableTargets.map((p) => {
                  const selected = vote.currentSelectionId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setVoteTarget(p.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition",
                        selected
                          ? "border-accent2/35 bg-accent2/15 text-fg"
                          : "border-border/12 bg-surface/5 text-fg/80 hover:bg-surface/10",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">{p.name}</div>
                        {selected ? <Check className="h-5 w-5 text-fg" /> : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={submitVote}
                disabled={!vote.currentSelectionId}
                className={cn(
                  "btn mt-6 w-full px-5 py-4 text-base",
                  vote.currentSelectionId ? "btn-primary" : "cursor-not-allowed",
                )}
              >
                Confirmar voto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
