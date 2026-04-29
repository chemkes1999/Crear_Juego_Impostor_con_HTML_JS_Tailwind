import { create } from "zustand"
import type { GamePhase, Player, WordCategory, WordDifficulty, ChatMessage, EliminationResult, GameOverState } from "../../server/types"

export type { GamePhase, Player, WordCategory, WordDifficulty, ChatMessage } from "../../server/types"

export type VoteState = {
  voterIds: string[]
  voterIndex: number
  currentSelectionId: string | null
  eligibleIds: string[]
  selectionsByVoterId: Record<string, string>
  votesSubmitted: number
}

export type RoomState = {
  code: string
  phase: GamePhase
  players: Player[]
  categories: WordCategory[]
  difficulty: WordDifficulty
  secretWord: string | null
  impostorId: string | null
  currentPlayerIndex: number
  reveal: { autoHide: boolean; seconds: number }
  discussion: {
    secondsTotal: number
    secondsLeft: number
    running: boolean
    chatMessages: ChatMessage[]
  }
  vote: VoteState | null
  elimination: EliminationResult | null
  gameOver: GameOverState | null
  deal: { playersReady: string[] } | null
  roundNumber: number
}

type GameStoreState = {
  phase: GamePhase
  roundNumber: number
  players: Player[]
  categories: WordCategory[]
  difficulty: WordDifficulty
  secretWord: string | null
  isImpostor: boolean
  impostorId: string | null
  currentPlayerIndex: number
  isRevealed: boolean
  reveal: { autoHide: boolean; seconds: number }
  discussion: {
    secondsTotal: number
    secondsLeft: number
    running: boolean
    chatMessages: ChatMessage[]
  }
  vote: VoteState | null
  elimination: EliminationResult | null
  gameOver: GameOverState | null
  deal: { playersReady: string[] } | null

  setRoomState: (state: Partial<GameStoreState>) => void
  resetToLobby: () => void
}

export type { GameStoreState }

export const useGameStore = create<GameStoreState>((set) => ({
  phase: "lobby",
  roundNumber: 1,
  players: [],
  categories: ["Animales", "Comida", "Objetos", "Lugares", "Profesiones", "Acciones", "Deportes", "Naturaleza"],
  difficulty: "basic",
  secretWord: null,
  isImpostor: false,
  impostorId: null,
  currentPlayerIndex: 0,
  isRevealed: false,
  reveal: { autoHide: true, seconds: 5 },
  discussion: {
    secondsTotal: 180,
    secondsLeft: 180,
    running: false,
    chatMessages: [],
  },
  vote: null,
  elimination: null,
  gameOver: null,
  deal: null,

  setRoomState: (partial) => set(partial),
  resetToLobby: () =>
    set({
      phase: "lobby",
      roundNumber: 1,
      secretWord: null,
      isImpostor: false,
      impostorId: null,
      currentPlayerIndex: 0,
      isRevealed: false,
      vote: null,
      elimination: null,
      gameOver: null,
      deal: null,
    }),
}))
