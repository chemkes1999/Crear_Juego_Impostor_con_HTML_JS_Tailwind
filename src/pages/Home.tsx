import DealScreen from "@/components/game/DealScreen"
import DiscussionScreen from "@/components/game/DiscussionScreen"
import EliminationScreen from "@/components/game/EliminationScreen"
import GameOverScreen from "@/components/game/GameOverScreen"
import SetupScreen from "@/components/game/SetupScreen"
import VoteScreen from "@/components/game/VoteScreen"
import { useGameStore } from "@/store/gameStore"

export default function Home() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(163,230,53,0.18),transparent_45%),radial-gradient(900px_circle_at_85%_20%,rgba(217,70,239,0.18),transparent_40%),radial-gradient(1200px_circle_at_60%_110%,rgba(59,130,246,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative">
        {phase === "setup" ? <SetupScreen /> : null}
        {phase === "deal" ? <DealScreen /> : null}
        {phase === "discussion" ? <DiscussionScreen /> : null}
        {phase === "vote" ? <VoteScreen /> : null}
        {phase === "elimination" ? <EliminationScreen /> : null}
        {phase === "gameover" ? <GameOverScreen /> : null}
      </div>
    </div>
  )
}
