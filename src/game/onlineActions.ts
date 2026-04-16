import { useGameStore } from "@/store/gameStore"

type OnlineReadyAction = { type: "READY" }
type OnlineVoteAction = { type: "VOTE"; targetId: string }
type OnlineAction = OnlineReadyAction | OnlineVoteAction | { type: string; [k: string]: unknown }

type OnlineRoomApi = {
  roster: Array<{ playerId: string; name: string }>
  publishPublicState: (state: unknown) => void
  sendPrivate: (playerId: string, payload: unknown) => void
}

function getPublicGameState() {
  const s = useGameStore.getState()
  return {
    phase: s.phase,
    roundNumber: s.roundNumber,
    players: s.players,
    categories: s.categories,
    difficulty: s.difficulty,
    currentPlayerIndex: s.currentPlayerIndex,
    isRevealed: s.isRevealed,
    reveal: s.reveal,
    discussion: s.discussion,
    vote: s.vote,
    elimination: s.elimination,
    gameOver: s.gameOver,
    secretWord: null,
    impostorId: null,
  }
}

function publish(room: OnlineRoomApi) {
  room.publishPublicState(getPublicGameState())
}

let readyByPlayerId = new Set<string>()

export function hostStartGameFromLobby(room: OnlineRoomApi) {
  const roster = room.roster
  useGameStore.getState().setPlayersFromRoster(roster)
  useGameStore.getState().startGame()
  publish(room)

  const gs = useGameStore.getState()
  const impostorId = gs.impostorId
  const word = gs.secretWord
  if (!impostorId || !word) return

  readyByPlayerId = new Set()

  for (const p of roster) {
    const isImpostor = p.playerId === impostorId
    room.sendPrivate(p.playerId, { secretWord: isImpostor ? null : word, isImpostor })
  }
}

export function hostHandleClientAction(room: OnlineRoomApi, playerId: string, action: unknown) {
  const a = action as OnlineAction

  if (a?.type === "READY") {
    readyByPlayerId.add(playerId)
    if (readyByPlayerId.size >= room.roster.length) {
      useGameStore.getState().startOnlineDiscussion()
      publish(room)
    }
    return
  }

  if (a?.type === "VOTE" && typeof (a as OnlineVoteAction).targetId === "string") {
    useGameStore.getState().applyOnlineVoteSelection(playerId, (a as OnlineVoteAction).targetId)
    publish(room)
  }
}

export function hostPublishGameState(room: OnlineRoomApi) {
  publish(room)
}
