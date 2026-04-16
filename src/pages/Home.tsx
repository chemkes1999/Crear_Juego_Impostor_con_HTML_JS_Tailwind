import DealScreen from "@/components/game/DealScreen"
import DiscussionScreen from "@/components/game/DiscussionScreen"
import EliminationScreen from "@/components/game/EliminationScreen"
import GameOverScreen from "@/components/game/GameOverScreen"
import SetupScreen from "@/components/game/SetupScreen"
import VoteScreen from "@/components/game/VoteScreen"
import DealOnlineScreen from "@/components/online/DealOnlineScreen"
import LobbyScreen from "@/components/online/LobbyScreen"
import OnlineEntryScreen from "@/components/online/OnlineEntryScreen"
import VoteOnlineScreen from "@/components/online/VoteOnlineScreen"
import { unlockAudio } from "@/lib/sfx"
import { useGameStore } from "@/store/gameStore"
import { useRoomStore } from "@/store/roomStore"

export default function Home() {
  const phase = useGameStore((s) => s.phase)
  const mode = useRoomStore((s) => s.mode)
  const roomStatus = useRoomStore((s) => s.status)

  return (
    <div className="game-root" onPointerDownCapture={() => void unlockAudio()}>
      <div className="game-aurora" />
      <div className="game-grid" />
      <div className="relative">
        {mode === "online" && roomStatus !== "in_room" ? <OnlineEntryScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "setup" ? <LobbyScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "deal" ? <DealOnlineScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "discussion" ? <DiscussionScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "vote" ? <VoteOnlineScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "elimination" ? <EliminationScreen /> : null}
        {mode === "online" && roomStatus === "in_room" && phase === "gameover" ? <GameOverScreen /> : null}

        {mode === "local" && phase === "setup" ? <SetupScreen /> : null}
        {mode === "local" && phase === "deal" ? <DealScreen /> : null}
        {mode === "local" && phase === "discussion" ? <DiscussionScreen /> : null}
        {mode === "local" && phase === "vote" ? <VoteScreen /> : null}
        {mode === "local" && phase === "elimination" ? <EliminationScreen /> : null}
        {mode === "local" && phase === "gameover" ? <GameOverScreen /> : null}
      </div>
    </div>
  )
}
