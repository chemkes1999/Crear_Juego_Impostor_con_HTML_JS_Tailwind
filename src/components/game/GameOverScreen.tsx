import { Crown, Skull, RefreshCw, Settings } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useGameStore } from "@/store/gameStore"

export default function GameOverScreen() {
  const gameOver = useGameStore((s) => s.gameOver)
  const players = useGameStore((s) => s.players)
  const startGame = useGameStore((s) => s.startGame)
  const resetToSetup = useGameStore((s) => s.resetToSetup)

  const impostorName = useMemo(() => {
    if (!gameOver) return null
    return players.find((p) => p.id === gameOver.impostorId)?.name ?? "Impostor"
  }, [gameOver, players])

  if (!gameOver) return null

  const isCivilians = gameOver.winner === "civilians"

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Fin de la partida</div>
        <div className="mt-2 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
          {isCivilians ? "Ganaron los inocentes" : "Ganó el impostor"}
        </div>
      </div>

      <div className="mt-8 flex flex-1 flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
          <div
            className={cn(
              "mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              isCivilians ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200",
            )}
          >
            {isCivilians ? <Crown className="h-4 w-4" /> : <Skull className="h-4 w-4" />}
            {isCivilians ? "Impostor eliminado" : "Quedaron 2 jugadores"}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-white/50">Palabra</div>
              <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
                {gameOver.word}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-white/50">Impostor</div>
              <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
                {impostorName}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-300/15 px-6 py-4 text-base font-black uppercase tracking-wide text-lime-100 transition hover:bg-lime-300/20"
            >
              <RefreshCw className="h-5 w-5" />
              Nueva partida
            </button>
            <button
              type="button"
              onClick={resetToSetup}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-black uppercase tracking-wide text-white/70 transition hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
              Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

