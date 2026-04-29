export type GamePhase = "lobby" | "deal" | "discussion" | "vote" | "elimination" | "gameover"

export type WordCategory =
  | "Animales"
  | "Comida"
  | "Objetos"
  | "Lugares"
  | "Profesiones"
  | "Acciones"
  | "Deportes"
  | "Naturaleza"

export type WordDifficulty = "basic" | "extended"

export type Player = {
  id: string
  name: string
  isEliminated: boolean
  isHost: boolean
  isConnected: boolean
}

export type ChatMessage = {
  playerId: string
  playerName: string
  text: string
  timestamp: number
}

export type VoteState = {
  voterIds: string[]
  voterIndex: number
  currentSelectionId: string | null
  eligibleIds: string[]
  selectionsByVoterId: Record<string, string>
  votesSubmitted: number
}

export type EliminationResult =
  | { type: "player"; playerId: string; wasImpostor: boolean }
  | { type: "tie"; playerIds: string[] }

export type GameOverState = {
  winner: "civilians" | "impostor"
  word: string
  impostorId: string
}

export type DealState = {
  playersReady: string[]
}

export type DiscussionState = {
  secondsTotal: number
  secondsLeft: number
  running: boolean
  chatMessages: ChatMessage[]
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
  discussion: DiscussionState
  vote: VoteState | null
  elimination: EliminationResult | null
  gameOver: GameOverState | null
  deal: DealState | null
  roundNumber: number
}

export type ClientMessage =
  | { type: "createRoom"; payload: { playerName: string } }
  | { type: "joinRoom"; payload: { code: string; playerName: string } }
  | { type: "startGame"; payload: { categories: WordCategory[]; difficulty: WordDifficulty; discussionSeconds: number } }
  | { type: "playerReady"; payload: null }
  | { type: "revealAck"; payload: null }
  | { type: "chatMessage"; payload: { text: string } }
  | { type: "vote"; payload: { targetPlayerId: string } }
  | { type: "leaveRoom"; payload: null }
  | { type: "startVote"; payload: null }
  | { type: "continueAfterElimination"; payload: null }
  | { type: "resetToSetup"; payload: null }
  | { type: "startNewGame"; payload: null }

export type ServerMessage =
  | { type: "roomCreated"; payload: { code: string; playerId: string } }
  | { type: "roomJoined"; payload: { room: RoomState; playerId: string } }
  | { type: "roomUpdated"; payload: { room: RoomState } }
  | { type: "gameStarted"; payload: { room: RoomState } }
  | { type: "phaseChanged"; payload: { phase: GamePhase; room: RoomState } }
  | { type: "yourWord"; payload: { word: string | null; isImpostor: boolean } }
  | { type: "error"; payload: { message: string } }
  | { type: "playerDisconnected"; payload: { playerId: string } }
  | { type: "playerReconnected"; payload: { playerId: string } }
