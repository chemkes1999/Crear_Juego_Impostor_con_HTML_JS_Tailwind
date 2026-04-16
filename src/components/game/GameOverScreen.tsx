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

  const lastWinner = useRef<null | "civilians" | "impostor">(null)
  const isCivilians = gameOver?.winner === "civilians"

  useEffect(() => {
    if (!gameOver) return
    if (lastWinner.current === gameOver.winner) return
    lastWinner.current = gameOver.winner
    playSfx(isCivilians ? "victory" : "impostorWin")
  }, [gameOver, isCivilians])

  if (!gameOver) return null

  return (
    <div
      className={cn(
        "screen relative flex min-h-[100svh] max-w-6xl flex-col overflow-hidden",
        isCivilians ? "among-gameover-win" : "among-gameover-lose",
      )}
    >
      <div aria-hidden className={cn("among-space pointer-events-none absolute inset-0", isCivilians ? "among-space-win" : "among-space-lose")} />
      <div aria-hidden className="among-stars pointer-events-none absolute inset-0" />
      <div aria-hidden className="among-vignette pointer-events-none absolute inset-0" />
      <div aria-hidden className={cn("among-scanlines pointer-events-none absolute inset-0", isCivilians ? "opacity-25" : "opacity-45")} />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-fg/60">Fin de la partida</div>
          <div
            className={cn(
              "badge",
              isCivilians ? "border-accent/35 bg-accent/15 text-fg" : "border-danger/35 bg-danger/14 text-fg",
            )}
          >
            {isCivilians ? <Crown className="h-4 w-4" /> : <Skull className="h-4 w-4" />}
            {isCivilians ? "Victoria" : "Derrota"}
          </div>
        </div>

        <div className="mt-4">
          <div
            className={cn(
              "among-title font-display text-balance text-5xl font-black uppercase leading-[0.9] text-fg sm:text-7xl",
              isCivilians ? "among-title-win" : "among-title-lose",
            )}
          >
            {isCivilians ? "Ganaron los inocentes" : "Ganó el impostor"}
          </div>
          <div className="mt-3 text-sm font-semibold text-fg/75 sm:text-base">
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
              <div className="rounded-2xl border border-border/12 bg-surface2/35 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-fg/60">Palabra</div>
                <div className="mt-2 font-display text-2xl font-black text-fg">
                  {gameOver.word}
                </div>
              </div>
              <div className="rounded-2xl border border-border/12 bg-surface2/35 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-fg/60">Impostor</div>
                <div className="mt-2 font-display text-2xl font-black text-fg">
                  {impostorName}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={startGame}
                className={cn(
                  "btn px-6 py-4 text-base",
                  isCivilians
                    ? "btn-primary"
                    : "btn-danger",
                )}
              >
                <RefreshCw className="h-5 w-5" />
                Nueva partida
              </button>
              <button
                type="button"
                onClick={resetToSetup}
                className="btn px-6 py-4 text-base"
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
