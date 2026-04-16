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
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Ronda {roundNumber} • Votación {stepLabel}</div>
          <div className="mt-2 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
            Vota en secreto.
          </div>
          <div className="mt-3 text-sm text-white/60">Pasa el dispositivo: vota una persona a la vez.</div>
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

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
          {vote.isReady ? (
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">
                <ShieldCheck className="h-4 w-4 text-lime-200" />
                Pantalla segura
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-white sm:text-3xl">
                {voter?.name ?? "Jugador"}: toma el dispositivo y toca <span className="text-lime-200">Votar</span>.
              </div>
              <p className="mt-3 text-sm text-white/60">Que nadie vea tu elección.</p>
              <button
                type="button"
                onClick={startVoteTurn}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-300/15 px-6 py-4 text-base font-black uppercase tracking-wide text-lime-100 transition hover:bg-lime-300/20"
              >
                Votar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-wide text-white/80">Elige a quién eliminar</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
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
                          ? "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">{p.name}</div>
                        {selected ? <Check className="h-5 w-5 text-fuchsia-200" /> : null}
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
                  "mt-6 w-full rounded-2xl border px-5 py-4 text-base font-black uppercase tracking-wide transition",
                  vote.currentSelectionId
                    ? "border-lime-300/30 bg-lime-300/15 text-lime-100 hover:bg-lime-300/20"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-white/30",
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
