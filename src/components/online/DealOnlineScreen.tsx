import { Check, ShieldAlert, ShieldCheck, Undo2 } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"
import { useRoomStore } from "@/store/roomStore"

export default function DealOnlineScreen() {
  const players = useGameStore((s) => s.players)
  const secretWord = useGameStore((s) => s.secretWord)
  const impostorId = useGameStore((s) => s.impostorId)
  const isImpostorLocal = useGameStore((s) => s.isImpostorLocal)
  const resetToSetup = useGameStore((s) => s.resetToSetup)

  const playerId = useRoomStore((s) => s.playerId)
  const isHost = useRoomStore((s) => s.isHost)
  const sendClientAction = useRoomStore((s) => s.sendClientAction)

  const [sent, setSent] = useState(false)

  const player = useMemo(() => players.find((p) => p.id === playerId) ?? null, [playerId, players])
  const isImpostor = useMemo(() => {
    if (!playerId) return false
    if (isHost) return playerId === impostorId
    return isImpostorLocal === true
  }, [impostorId, isHost, isImpostorLocal, playerId])

  const label = player?.name?.trim() ? player.name.trim() : "Tu rol"

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg/55">Online • Revela solo para ti</div>
          <div className="mt-2 font-display text-3xl font-black text-fg sm:text-4xl">{label}</div>
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
        <div className="panel p-6 text-center sm:p-10">
          <div
            className={cn(
              "badge mx-auto",
              isImpostor ? "border-accent2/35 bg-accent2/15 text-fg" : "border-accent/35 bg-accent/15 text-fg",
            )}
          >
            {isImpostor ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {isImpostor ? "IMPOSTOR" : "PALABRA"}
          </div>

          <div className="mt-8 font-display text-balance text-4xl font-black text-fg sm:text-5xl">
            {isImpostor ? "IMPOSTOR" : secretWord ?? "—"}
          </div>

          <button
            type="button"
            onClick={() => {
              setSent(true)
              sendClientAction({ type: "READY" })
            }}
            disabled={sent}
            className={cn("btn mt-8 w-full px-6 py-4 text-base", sent ? "cursor-not-allowed opacity-70" : "btn-primary")}
          >
            <Check className="h-5 w-5" />
            {sent ? "Esperando…" : "Listo"}
          </button>
        </div>
      </div>
    </div>
  )
}

