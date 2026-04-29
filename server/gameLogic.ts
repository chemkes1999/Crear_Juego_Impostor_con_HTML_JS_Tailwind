import { randomInt, pickRandom } from "./utils"
import type { WordCategory, WordDifficulty, Player, VoteState, EliminationResult } from "./types"
import { WORDS } from "./words"

export function getRandomWord(params: { categories: WordCategory[]; difficulty: WordDifficulty }) {
  const { categories, difficulty } = params
  const allowedCategories = categories.length > 0 ? new Set(categories) : null

  const pool = WORDS.filter((w) => {
    const difficultyOk = difficulty === "extended" ? true : w.difficulty === "basic"
    if (!difficultyOk) return false
    if (!allowedCategories) return true
    return w.categories.some((c) => allowedCategories.has(c))
  })

  return pickRandom(pool)
}

export function createPlayers(hostName: string) {
  const hostId = createId()
  return [{
    id: hostId,
    name: hostName.trim() || "Host",
    isEliminated: false,
    isHost: true,
    isConnected: true,
  }]
}

export function addPlayer(players: Player[], name: string): { players: Player[]; newPlayerId: string } {
  const id = createId()
  return {
    players: [...players, { id, name: name.trim() || `Jugador ${players.length + 1}`, isEliminated: false, isHost: false, isConnected: true }],
    newPlayerId: id,
  }
}

export function chooseImpostor(players: Player[]): string | null {
  const alive = getAlivePlayers(players)
  if (alive.length === 0) return null
  return alive[randomInt(alive.length)].id
}

export function getWord(categories: WordCategory[], difficulty: WordDifficulty): string {
  return getRandomWord({ categories, difficulty }).value
}

export function getAlivePlayers(players: Player[]) {
  return players.filter((p) => !p.isEliminated)
}

export function initVoteRound(players: Player[], eligibleIds?: string[]): VoteState {
  const alive = getAlivePlayers(players).map((p) => p.id)
  const eligible = (eligibleIds && eligibleIds.length > 0 ? eligibleIds : alive).filter((id) => alive.includes(id))
  return {
    voterIds: alive,
    voterIndex: 0,
    currentSelectionId: null,
    eligibleIds: eligible,
    selectionsByVoterId: {},
    votesSubmitted: 0,
  }
}

export function computeVoteResult(params: { players: Player[]; impostorId: string; vote: VoteState }): EliminationResult {
  const { players, impostorId, vote } = params
  const aliveIds = new Set(getAlivePlayers(players).map((p) => p.id))
  const eligibleIds = new Set(vote.eligibleIds)
  const counts = new Map<string, number>()

  for (const voterId of vote.voterIds) {
    const targetId = vote.selectionsByVoterId[voterId]
    if (!targetId) continue
    if (!aliveIds.has(targetId)) continue
    if (!eligibleIds.has(targetId)) continue
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1)
  }

  let max = 0
  for (const v of counts.values()) max = Math.max(max, v)
  const winners = Array.from(counts.entries())
    .filter(([, c]) => c === max)
    .map(([id]) => id)

  if (winners.length === 0) {
    const aliveArr = [...aliveIds]
    const pick = aliveArr[randomInt(aliveArr.length)]
    return { type: "player", playerId: pick, wasImpostor: pick === impostorId }
  }

  if (winners.length > 1) {
    return { type: "tie", playerIds: winners }
  }

  const eliminatedId = winners[0]
  return { type: "player", playerId: eliminatedId, wasImpostor: eliminatedId === impostorId }
}

export function checkGameOver(players: Player[], impostorId: string): "civilians" | "impostor" | null {
  const alive = getAlivePlayers(players)
  const impostorAlive = alive.some((p) => p.id === impostorId)
  const civilianCount = alive.filter((p) => p.id !== impostorId).length

  if (!impostorAlive) return "civilians"
  if (civilianCount <= 1) return "impostor"
  return null
}

export function sanitizeChat(text: string): string {
  return text.trim().slice(0, 280)
}

function createId() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const arr = new Uint32Array(4)
    crypto.getRandomValues(arr)
    return Array.from(arr)
      .map((n) => n.toString(16).padStart(8, "0"))
      .join("")
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
