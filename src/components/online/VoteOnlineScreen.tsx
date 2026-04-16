import { Check, Undo2 } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useRoomStore } from "@/store/roomStore"

export default function VoteOnlineScreen() {
  const roundNumber = useGameStore((s) => s.roundNumber)
  const players = useGameStore((s) => s.players)
  const vote = useGameStore((s) => s.vote)
  const resetToSetup = useGameStore((s) => s.resetToSetup)

  const playerId = useRoomStore((s) => s.playerId)
  const sendClientAction = useRoomStore((s) => s.sendClientAction)

  const alive = useMemo(() => players.filter((p) => !p.isEliminated), [players])

  const eligibleTargets = useMemo(() => {
    if (!vote || !playerId) return []
    const eligible = new Set(vote.eligibleIds)
    return alive.filter((p) => eligible.has(p.id) && p.id !== playerId)
  }, [alive, playerId, vote])

  const existingSelection = useMemo(() => {
    if (!vote || !playerId) return null
    return vote.selectionsByVoterId[playerId] ?? null
  }, [playerId, vote])

  const [selection, setSelection] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (!vote) return null

  const submitted = sent || Boolean(existingSelection)

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">Ronda {roundNumber} • Votación (online)</div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">Vota en tu dispositivo.</div>
          <div className="mt-3 text-sm text-fg/65">Tu voto se envía al host.</div>
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
          {submitted ? (
            <div className="text-center">
              <div className="text-sm font-semibold text-fg/70">Voto enviado</div>
              <div className="mt-2 text-sm text-fg/65">Esperando al resto…</div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Elige a quién eliminar</div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {eligibleTargets.map((p) => {
                  const selected = selection === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelection(p.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition",
                        selected ? "border-accent2/35 bg-accent2/15 text-fg" : "border-border/12 bg-surface/5 text-fg/80 hover:bg-surface/10",
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
                  if (!selection) return
                  setSent(true)
                  sendClientAction({ type: "VOTE", targetId: selection })
                }}
                disabled={!selection}
                className={cn("btn mt-6 w-full px-5 py-4 text-base", selection ? "btn-primary" : "cursor-not-allowed")}
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

