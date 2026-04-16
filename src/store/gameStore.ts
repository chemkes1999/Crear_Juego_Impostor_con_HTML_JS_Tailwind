import { create } from "zustand"
import type { WordCategory, WordDifficulty } from "@/data/words"
import { WORD_CATEGORIES } from "@/data/words"
import { randomInt } from "@/utils/random"
import { getRandomWord } from "@/utils/words"

export type Player = {
  id: string
  name: string
  isEliminated: boolean
}

export type GamePhase = "setup" | "deal" | "discussion" | "vote" | "elimination" | "gameover"

type RevealOptions = {
  autoHide: boolean
  seconds: number
}

type DiscussionState = {
  secondsTotal: number
  secondsLeft: number
  running: boolean
}

type VoteState = {
  voterIds: string[]
  voterIndex: number
  isReady: boolean
  currentSelectionId: string | null
  eligibleIds: string[]
  selectionsByVoterId: Record<string, string>
}

type EliminationResult =
  | { type: "player"; playerId: string; wasImpostor: boolean }
  | { type: "tie"; playerIds: string[] }

type GameOverState = {
  winner: "civilians" | "impostor"
  word: string
  impostorId: string
}

type GameState = {
  phase: GamePhase
  roundNumber: number
  players: Player[]
  categories: WordCategory[]
  difficulty: WordDifficulty
  secretWord: string | null
  impostorId: string | null
  isImpostorLocal: boolean | null
  currentPlayerIndex: number
  isRevealed: boolean
  reveal: RevealOptions
  discussion: DiscussionState
  vote: VoteState | null
  elimination: EliminationResult | null
  gameOver: GameOverState | null

  setPlayerCount: (count: number) => void
  setPlayerName: (index: number, name: string) => void
  setPlayersFromRoster: (roster: Array<{ playerId: string; name: string }>) => void
  toggleCategory: (category: WordCategory) => void
  setDifficulty: (difficulty: WordDifficulty) => void
  setRevealAutoHide: (value: boolean) => void
  setRevealSeconds: (seconds: number) => void
  setDiscussionSeconds: (seconds: number) => void
  startGame: () => void
  startOnlineDiscussion: () => void
  revealRole: () => void
  hideAndNext: () => void
  resetToSetup: () => void
  applyPublicState: (state: unknown) => void
  applyPrivate: (payload: unknown) => void
  toggleDiscussion: () => void
  resetDiscussion: () => void
  tickDiscussion: () => void
  startVote: () => void
  startVoteTurn: () => void
  setVoteTarget: (playerId: string) => void
  submitVote: () => void
  applyOnlineVoteSelection: (voterId: string, targetId: string) => void
  continueAfterElimination: () => void
}

function createPlayers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: createId(),
    name: `Jugador ${i + 1}`,
    isEliminated: false,
  }))
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

function getAlivePlayers(players: Player[]) {
  return players.filter((p) => !p.isEliminated)
}

function initVoteRound(state: GameState, eligibleIds?: string[]): GameState {
  const alive = getAlivePlayers(state.players).map((p) => p.id)
  const eligible = (eligibleIds && eligibleIds.length > 0 ? eligibleIds : alive).filter((id) => alive.includes(id))
  return {
    ...state,
    phase: "vote",
    vote: {
      voterIds: alive,
      voterIndex: 0,
      isReady: true,
      currentSelectionId: null,
      eligibleIds: eligible,
      selectionsByVoterId: {},
    },
    elimination: null,
    discussion: { ...state.discussion, running: false },
  }
}

function computeVoteResult(params: { players: Player[]; impostorId: string; vote: VoteState }): EliminationResult {
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

export const useGameStore = create<GameState>((set, get) => ({
  phase: "setup",
  roundNumber: 1,
  players: createPlayers(5),
  categories: [...WORD_CATEGORIES],
  difficulty: "basic",
  secretWord: null,
  impostorId: null,
  isImpostorLocal: null,
  currentPlayerIndex: 0,
  isRevealed: false,
  reveal: { autoHide: true, seconds: 5 },
  discussion: { secondsTotal: 180, secondsLeft: 180, running: false },
  vote: null,
  elimination: null,
  gameOver: null,

  setPlayerCount: (count) => {
    const safeCount = Math.max(3, Math.min(15, Math.floor(count)))
    set({ players: createPlayers(safeCount) })
  },
  setPlayerName: (index, name) => {
    set((s) => {
      const players = [...s.players]
      const current = players[index]
      if (!current) return s
      players[index] = { ...current, name: name.trim() || `Jugador ${index + 1}` }
      return { ...s, players }
    })
  },
  setPlayersFromRoster: (roster) => {
    set((s) => {
      const nextPlayers = roster.map((p) => ({ id: p.playerId, name: p.name, isEliminated: false }))
      if (nextPlayers.length < 3) return s
      return { ...s, players: nextPlayers }
    })
  },
  toggleCategory: (category) => {
    set((s) => {
      const enabled = new Set(s.categories)
      if (enabled.has(category)) enabled.delete(category)
      else enabled.add(category)
      return { ...s, categories: [...enabled] }
    })
  },
  setDifficulty: (difficulty) => set({ difficulty }),
  setRevealAutoHide: (value) => set((s) => ({ ...s, reveal: { ...s.reveal, autoHide: value } })),
  setRevealSeconds: (seconds) =>
    set((s) => ({ ...s, reveal: { ...s.reveal, seconds: Math.max(2, Math.min(15, Math.floor(seconds))) } })),
  setDiscussionSeconds: (seconds) =>
    set((s) => {
      const safeSeconds = Math.max(30, Math.min(15 * 60, Math.floor(seconds)))
      return { ...s, discussion: { ...s.discussion, secondsTotal: safeSeconds, secondsLeft: safeSeconds } }
    }),
  startGame: () => {
    const s = get()
    const word = getRandomWord({ categories: s.categories, difficulty: s.difficulty }).value
    const resetPlayers = s.players.map((p) => ({ ...p, isEliminated: false }))
    const impostorId = resetPlayers[randomInt(resetPlayers.length)]?.id ?? null
    set((prev) => ({
      ...prev,
      phase: "deal",
      roundNumber: 1,
      players: resetPlayers,
      secretWord: word,
      impostorId,
      isImpostorLocal: null,
      currentPlayerIndex: 0,
      isRevealed: false,
      vote: null,
      elimination: null,
      gameOver: null,
      discussion: { ...prev.discussion, secondsLeft: prev.discussion.secondsTotal, running: false },
    }))
  },
  startOnlineDiscussion: () =>
    set((s) => ({
      ...s,
      phase: "discussion",
      currentPlayerIndex: 0,
      isRevealed: false,
      vote: null,
      elimination: null,
      discussion: { ...s.discussion, secondsLeft: s.discussion.secondsTotal, running: false },
    })),
  revealRole: () => set({ isRevealed: true }),
  hideAndNext: () => {
    set((s) => {
      const nextIndex = s.currentPlayerIndex + 1
      if (nextIndex < s.players.length) {
        return { ...s, currentPlayerIndex: nextIndex, isRevealed: false }
      }
      return {
        ...s,
        phase: "discussion",
        isRevealed: false,
        vote: null,
        elimination: null,
        discussion: { ...s.discussion, secondsLeft: s.discussion.secondsTotal, running: false },
      }
    })
  },
  resetToSetup: () =>
    set((s) => ({
      ...s,
      phase: "setup",
      roundNumber: 1,
      secretWord: null,
      impostorId: null,
      isImpostorLocal: null,
      currentPlayerIndex: 0,
      isRevealed: false,
      vote: null,
      elimination: null,
      gameOver: null,
      discussion: { ...s.discussion, secondsLeft: s.discussion.secondsTotal, running: false },
    })),
  applyPublicState: (state) =>
    set((s) => {
      if (!state || typeof state !== "object") return s
      const next = state as Partial<GameState>
      return {
        ...s,
        phase: next.phase ?? s.phase,
        roundNumber: next.roundNumber ?? s.roundNumber,
        players: Array.isArray(next.players) ? next.players : s.players,
        categories: Array.isArray(next.categories) ? next.categories : s.categories,
        difficulty: (next.difficulty ?? s.difficulty) as WordDifficulty,
        currentPlayerIndex: next.currentPlayerIndex ?? s.currentPlayerIndex,
        isRevealed: next.isRevealed ?? s.isRevealed,
        reveal: (next.reveal ?? s.reveal) as RevealOptions,
        discussion: (next.discussion ?? s.discussion) as DiscussionState,
        vote: (next.vote ?? s.vote) as VoteState | null,
        elimination: (next.elimination ?? s.elimination) as EliminationResult | null,
        gameOver: (next.gameOver ?? s.gameOver) as GameOverState | null,
      }
    }),
  applyPrivate: (payload) =>
    set((s) => {
      if (!payload || typeof payload !== "object") return s
      const p = payload as { secretWord?: unknown; isImpostor?: unknown }
      const word = typeof p.secretWord === "string" ? p.secretWord : null
      const isImpostor = typeof p.isImpostor === "boolean" ? p.isImpostor : null
      return { ...s, secretWord: word, isImpostorLocal: isImpostor }
    }),
  toggleDiscussion: () => set((s) => ({ ...s, discussion: { ...s.discussion, running: !s.discussion.running } })),
  resetDiscussion: () =>
    set((s) => ({ ...s, discussion: { ...s.discussion, running: false, secondsLeft: s.discussion.secondsTotal } })),
  tickDiscussion: () =>
    set((s) => {
      if (!s.discussion.running) return s
      const next = Math.max(0, s.discussion.secondsLeft - 1)
      const nextState = {
        ...s,
        discussion: { ...s.discussion, secondsLeft: next, running: next === 0 ? false : s.discussion.running },
      }
      if (next === 0) return initVoteRound(nextState)
      return nextState
    }),
  startVote: () =>
    set((s) => {
      if (s.phase !== "discussion") return s
      return initVoteRound(s)
    }),
  startVoteTurn: () =>
    set((s) => {
      if (s.phase !== "vote" || !s.vote) return s
      return { ...s, vote: { ...s.vote, isReady: false, currentSelectionId: null } }
    }),
  setVoteTarget: (playerId) =>
    set((s) => {
      if (s.phase !== "vote" || !s.vote) return s
      return { ...s, vote: { ...s.vote, currentSelectionId: playerId } }
    }),
  submitVote: () =>
    set((s) => {
      if (s.phase !== "vote" || !s.vote) return s
      if (!s.impostorId) return s

      const voterId = s.vote.voterIds[s.vote.voterIndex]
      const targetId = s.vote.currentSelectionId
      if (!voterId || !targetId) return s

      const nextSelections = { ...s.vote.selectionsByVoterId, [voterId]: targetId }
      const isLast = s.vote.voterIndex >= s.vote.voterIds.length - 1

      if (!isLast) {
        return {
          ...s,
          vote: {
            ...s.vote,
            selectionsByVoterId: nextSelections,
            voterIndex: s.vote.voterIndex + 1,
            isReady: true,
            currentSelectionId: null,
          },
        }
      }

      const finalVote: VoteState = {
        ...s.vote,
        selectionsByVoterId: nextSelections,
        currentSelectionId: null,
        isReady: true,
      }

      const result = computeVoteResult({ players: s.players, impostorId: s.impostorId, vote: finalVote })

      if (result.type === "tie") {
        return { ...s, phase: "elimination", vote: null, elimination: result }
      }

      const nextPlayers = s.players.map((p) => (p.id === result.playerId ? { ...p, isEliminated: true } : p))

      if (result.wasImpostor && s.secretWord) {
        return {
          ...s,
          phase: "gameover",
          players: nextPlayers,
          vote: null,
          elimination: null,
          gameOver: { winner: "civilians", word: s.secretWord, impostorId: s.impostorId },
          discussion: { ...s.discussion, running: false },
        }
      }

      const aliveCount = getAlivePlayers(nextPlayers).length
      if (aliveCount <= 2 && s.secretWord) {
        return {
          ...s,
          phase: "gameover",
          players: nextPlayers,
          vote: null,
          elimination: null,
          gameOver: { winner: "impostor", word: s.secretWord, impostorId: s.impostorId },
          discussion: { ...s.discussion, running: false },
        }
      }

      return {
        ...s,
        phase: "elimination",
        players: nextPlayers,
        vote: null,
        elimination: result,
        discussion: { ...s.discussion, running: false },
      }
    }),
  applyOnlineVoteSelection: (voterId, targetId) =>
    set((s) => {
      if (s.phase !== "vote" || !s.vote) return s
      if (!s.impostorId) return s
      if (!s.vote.voterIds.includes(voterId)) return s
      if (!s.vote.eligibleIds.includes(targetId)) return s
      if (voterId === targetId) return s

      const aliveIds = new Set(getAlivePlayers(s.players).map((p) => p.id))
      if (!aliveIds.has(voterId) || !aliveIds.has(targetId)) return s

      const nextSelections = { ...s.vote.selectionsByVoterId, [voterId]: targetId }
      const isComplete = s.vote.voterIds.every((id) => Boolean(nextSelections[id]))
      if (!isComplete) return { ...s, vote: { ...s.vote, selectionsByVoterId: nextSelections } }

      const finalVote: VoteState = {
        ...s.vote,
        selectionsByVoterId: nextSelections,
        currentSelectionId: null,
        isReady: true,
      }

      const result = computeVoteResult({ players: s.players, impostorId: s.impostorId, vote: finalVote })

      if (result.type === "tie") {
        return { ...s, phase: "elimination", vote: null, elimination: result }
      }

      const nextPlayers = s.players.map((p) => (p.id === result.playerId ? { ...p, isEliminated: true } : p))

      if (result.wasImpostor && s.secretWord) {
        return {
          ...s,
          phase: "gameover",
          players: nextPlayers,
          vote: null,
          elimination: null,
          gameOver: { winner: "civilians", word: s.secretWord, impostorId: s.impostorId },
          discussion: { ...s.discussion, running: false },
        }
      }

      const aliveCount = getAlivePlayers(nextPlayers).length
      if (aliveCount <= 2 && s.secretWord) {
        return {
          ...s,
          phase: "gameover",
          players: nextPlayers,
          vote: null,
          elimination: null,
          gameOver: { winner: "impostor", word: s.secretWord, impostorId: s.impostorId },
          discussion: { ...s.discussion, running: false },
        }
      }

      return {
        ...s,
        phase: "elimination",
        players: nextPlayers,
        vote: null,
        elimination: result,
        discussion: { ...s.discussion, running: false },
      }
    }),
  continueAfterElimination: () =>
    set((s) => {
      if (s.phase !== "elimination" || !s.elimination) return s
      if (s.elimination.type === "tie") {
        return initVoteRound({ ...s, elimination: null, vote: null }, s.elimination.playerIds)
      }
      return {
        ...s,
        phase: "discussion",
        roundNumber: s.roundNumber + 1,
        vote: null,
        elimination: null,
        discussion: { ...s.discussion, secondsLeft: s.discussion.secondsTotal, running: false },
      }
    }),
}))
