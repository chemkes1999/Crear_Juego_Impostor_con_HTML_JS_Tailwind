import { Crown, Skull, RefreshCw, Settings } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { playSfx } from "@/lib/sfx"
import { TenebrousEyes, VictoryStar } from "@/components/game/MysterySigils"
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
  const lastWinner = useRef<null | "civilians" | "impostor">(null)

  useEffect(() => {
    if (lastWinner.current === gameOver.winner) return
    lastWinner.current = gameOver.winner
    playSfx(isCivilians ? "victory" : "impostorWin")
  }, [gameOver.winner, isCivilians])

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col overflow-hidden px-6 py-10">
      <div aria-hidden className={cn("among-space pointer-events-none absolute inset-0", isCivilians ? "among-space-win" : "among-space-lose")} />
      <div aria-hidden className="among-stars pointer-events-none absolute inset-0" />
      <div aria-hidden className="among-vignette pointer-events-none absolute inset-0" />
      <div aria-hidden className={cn("among-scanlines pointer-events-none absolute inset-0", isCivilians ? "opacity-25" : "opacity-45")} />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Fin de la partida</div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              isCivilians ? "border-lime-200/25 bg-lime-200/10 text-lime-100" : "border-rose-200/25 bg-rose-200/10 text-rose-100",
            )}
          >
            {isCivilians ? <Crown className="h-4 w-4" /> : <Skull className="h-4 w-4" />}
            {isCivilians ? "Victoria" : "Derrota"}
          </div>
        </div>

        <div className="mt-4">
          <div
            className={cn("among-title text-balance text-5xl font-black uppercase leading-[0.9] sm:text-7xl", isCivilians ? "among-title-win" : "among-title-lose")}
            style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}
          >
            {isCivilians ? "Ganaron los inocentes" : "Ganó el impostor"}
          </div>
          <div className="mt-3 text-sm font-semibold text-white/70 sm:text-base">
            {isCivilians ? (
              <span>El impostor era {impostorName}.</span>
            ) : (
              <span>{impostorName} sobrevivió y la palabra quedó oculta.</span>
            )}
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div className={cn("among-figure relative mx-auto w-full max-w-[420px]", isCivilians ? "among-figure-win" : "among-figure-lose")}>
            <div aria-hidden className={cn("among-figure-glow absolute inset-0", isCivilians ? "among-figure-glow-win" : "among-figure-glow-lose")} />
            <div className="relative mx-auto flex w-full items-center justify-center">
              {isCivilians ? <VictoryStar /> : <TenebrousEyes />}
            </div>
          </div>

          <div className={cn("among-panel rounded-[28px] border p-6 sm:p-8", isCivilians ? "among-panel-win" : "among-panel-lose")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-white/50">Palabra</div>
                <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
                  {gameOver.word}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-white/50">Impostor</div>
                <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}>
                  {impostorName}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={startGame}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-4 text-base font-black uppercase tracking-wide transition",
                  isCivilians
                    ? "border-lime-300/30 bg-lime-300/15 text-lime-100 hover:bg-lime-300/20"
                    : "border-rose-300/30 bg-rose-300/15 text-rose-100 hover:bg-rose-300/20",
                )}
              >
                <RefreshCw className="h-5 w-5" />
                Nueva partida
              </button>
              <button
                type="button"
                onClick={resetToSetup}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-black uppercase tracking-wide text-white/75 transition hover:bg-white/10"
              >
                <Settings className="h-5 w-5" />
                Ajustes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
