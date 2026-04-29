import { Check, ShieldCheck, Undo2 } from "lucide-react"
import { useMemo, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useWsStore } from "@/store/wsStore"
import { playSfx } from "@/lib/sfx"

export default function VoteScreen() {
  const roundNumber = useGameStore((s) => s.roundNumber)
  const players = useGameStore((s) => s.players)
  const vote = useGameStore((s) => s.vote)
  const send = useWsStore((s) => s.send)
  const playerId = useWsStore((s) => s.playerId)

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])
  const currentPlayer = useMemo(() => players.find((p) => p.id === playerId), [players, playerId])
  const [voteSoundEnabled] = useState(true)
  const lastVoteCount = useRef(vote?.votesSubmitted ?? 0)

  useEffect(() => {
    if (vote && voteSoundEnabled && vote.votesSubmitted > lastVoteCount.current) {
      playSfx("voteSubmitted")
    }
    lastVoteCount.current = vote?.votesSubmitted ?? 0
  }, [vote?.votesSubmitted, voteSoundEnabled])

  if (!vote || !currentPlayer) return null

  const hasVoted = !!vote.selectionsByVoterId[playerId]
  const totalVotes = vote.votesSubmitted
  const totalVoters = vote.voterIds.length

  const eligible = new Set(vote.eligibleIds)
  const availableTargets = alive.filter((p) => eligible.has(p.id) && p.id !== playerId)

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">
            Ronda {roundNumber} • Votación
          </div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">
            {hasVoted ? "Voto registrado" : "Elige a quién eliminar"}
          </div>
          <div className="mt-3 text-sm text-fg/65">
            {hasVoted
              ? `Esperando a los demás jugadores (${totalVotes}/${totalVoters})`
              : "Tu voto es secreto. Elige sabiamente."}
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
          {hasVoted ? (
            <div className="text-center">
              <div className="badge mx-auto">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Voto registrado
              </div>
              <div className="mt-6 text-balance text-2xl font-black text-fg sm:text-3xl">
                Esperando a los demás...
              </div>

              <div className="mx-auto mt-6 max-w-md">
                <div className="h-3 overflow-hidden rounded-full bg-surface/10">
                  <div
                    className="h-full bg-accent/70"
                    style={{ width: `${Math.round(((totalVotes / totalVoters) * 100) * 10) / 10}%` }}
                  />
                </div>
                <div className="mt-2 text-sm font-semibold text-fg/55">
                  {totalVotes}/{totalVoters} votos
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Elige a quién eliminar</div>
                <div className="badge">
                  Vota como {currentPlayer.name}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {availableTargets.map((p) => {
                  const selected = vote.currentSelectionId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => useGameStore.setState((s) => ({
                        ...s,
                        vote: s.vote ? { ...s.vote, currentSelectionId: p.id } : s.vote,
                      }))}
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
                onClick={() => {
                  if (vote.currentSelectionId) {
                    send({ type: "vote", payload: { targetPlayerId: vote.currentSelectionId } })
                  }
                }}
                disabled={!vote.currentSelectionId}
                className={cn(
                  "btn mt-6 w-full px-5 py-4 text-base",
                  vote.currentSelectionId ? "btn-primary" : "cursor-not-allowed opacity-50",
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
