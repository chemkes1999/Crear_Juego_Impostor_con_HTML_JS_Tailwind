import { useEffect, useRef } from "react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useWsStore } from "@/store/wsStore"
import { useGameStore, type RoomState } from "@/store/gameStore"
import LobbyScreen from "@/pages/LobbyScreen"
import DealScreen from "@/components/game/DealScreen"
import DiscussionScreen from "@/components/game/DiscussionScreen"
import VoteScreen from "@/components/game/VoteScreen"
import EliminationScreen from "@/components/game/EliminationScreen"
import GameOverScreen from "@/components/game/GameOverScreen"
import { unlockAudio, playSfx } from "@/lib/sfx"

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const lastPhaseRef = useRef(phase)

  const syncRoomState = (room: RoomState) => {
    if (room.phase !== lastPhaseRef.current) {
      if (room.phase === "deal") playSfx("gameStarted")
      else if (room.phase === "discussion") playSfx("phaseChange")
      else if (room.phase === "vote") playSfx("phaseChange")
      lastPhaseRef.current = room.phase
    }

    useGameStore.setState({
      phase: room.phase,
      roundNumber: room.roundNumber,
      players: room.players,
      categories: room.categories,
      difficulty: room.difficulty,
      impostorId: room.impostorId,
      currentPlayerIndex: room.currentPlayerIndex,
      reveal: room.reveal,
      discussion: room.discussion,
      vote: room.vote,
      elimination: room.elimination,
      gameOver: room.gameOver,
      deal: room.deal,
    })
  }

  const syncRoomStateRef = useRef(syncRoomState)
  syncRoomStateRef.current = syncRoomState

  useWebSocket({
    onRoomState: (room) => syncRoomStateRef.current(room),
    onRoomCreated: (code, playerId) => {
      useWsStore.setState({ playerId, roomCode: code })
    },
    onRoomJoined: (room, playerId) => {
      useWsStore.setState({ playerId, roomCode: room.code })
      syncRoomStateRef.current(room)
    },
    onYourWord: (word, isImpostor) => {
      useGameStore.setState({ secretWord: word, isImpostor })
    },
    onError: (message) => {
      useWsStore.setState({ lastError: message })
    },
  })

  useEffect(() => {
    useWsStore.getState().connect()
  }, [])

  return (
    <div className="game-root" onPointerDownCapture={() => void unlockAudio()}>
      <div className="game-aurora" />
      <div className="game-grid" />
      <div className="relative">
        {phase === "lobby" ? (
          <LobbyScreen />
        ) : phase === "deal" ? (
          <DealScreen />
        ) : phase === "discussion" ? (
          <DiscussionScreen />
        ) : phase === "vote" ? (
          <VoteScreen />
        ) : phase === "elimination" ? (
          <EliminationScreen />
        ) : phase === "gameover" ? (
          <GameOverScreen />
        ) : null}
      </div>
    </div>
  )
}
