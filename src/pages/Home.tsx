import DealScreen from "@/components/game/DealScreen"
import DiscussionScreen from "@/components/game/DiscussionScreen"
import EliminationScreen from "@/components/game/EliminationScreen"
import GameOverScreen from "@/components/game/GameOverScreen"
import SetupScreen from "@/components/game/SetupScreen"
import VoteScreen from "@/components/game/VoteScreen"
import { unlockAudio } from "@/lib/sfx"
import { useGameStore } from "@/store/gameStore"

export default function Home() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="game-root" onPointerDownCapture={() => void unlockAudio()}>
      <div className="game-aurora" />
      <div className="game-grid" />
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
