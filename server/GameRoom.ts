import { WebSocket } from "ws"
import type {
  RoomState,
  WordCategory,
  WordDifficulty,
  ChatMessage,
  ServerMessage,
  ClientMessage,
} from "./types"
import * as logic from "./gameLogic"

type ClientInfo = {
  ws: WebSocket
  playerId: string
  playerName: string
}

export class GameRoom {
  private clients = new Map<string, ClientInfo>()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  private state: RoomState

  constructor(public readonly code: string) {
    this.state = {
      code,
      phase: "lobby",
      players: [],
      categories: ["Animales", "Comida", "Objetos", "Lugares", "Profesiones", "Acciones", "Deportes", "Naturaleza"],
      difficulty: "basic",
      secretWord: null,
      impostorId: null,
      currentPlayerIndex: 0,
      reveal: { autoHide: true, seconds: 5 },
      discussion: { secondsTotal: 180, secondsLeft: 180, running: false, chatMessages: [] },
      vote: null,
      elimination: null,
      gameOver: null,
      deal: { playersReady: [] },
      roundNumber: 1,
    }
  }

  getState(): RoomState {
    return { ...this.state }
  }

  getPlayerCount(): number {
    return this.clients.size
  }

  isEmpty(): boolean {
    return this.clients.size === 0
  }

  hasPlayer(playerId: string): boolean {
    return this.clients.has(playerId)
  }

  addClient(ws: WebSocket, playerId: string, playerName: string): void {
    const existing = this.clients.get(playerId)
    if (existing) {
      existing.ws = ws
      existing.playerName = playerName
      this.updatePlayerConnection(playerId, true)
      this.broadcastToAll({ type: "playerReconnected", payload: { playerId } })
      return
    }

    this.clients.set(playerId, { ws, playerId, playerName })
    this.updatePlayerConnection(playerId, true)
    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })
  }

  removeClient(playerId: string): void {
    const client = this.clients.get(playerId)
    if (!client) return

    this.clients.delete(playerId)

    if (this.state.phase === "lobby") {
      if (this.clients.size === 0) return
    } else {
      this.updatePlayerConnection(playerId, false)
    }

    this.broadcastToAll({ type: "playerDisconnected", payload: { playerId } })
    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })
  }

  handleJoin(ws: WebSocket, playerName: string): string {
    const result = logic.addPlayer(this.state.players, playerName)
    this.state.players = result.players
    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })
    return result.newPlayerId
  }

  setHost(playerId: string): void {
    this.state.players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, isHost: true } : p
    )
  }

  handleClientMessage(playerId: string, message: ClientMessage): void {
    const client = this.clients.get(playerId)
    if (!client) return

    switch (message.type) {
      case "startGame":
        this.handleStartGame(message.payload)
        break
      case "playerReady":
        this.handlePlayerReady(playerId)
        break
      case "revealAck":
        this.handleRevealAck(playerId)
        break
      case "chatMessage":
        this.handleChatMessage(playerId, message.payload.text)
        break
      case "vote":
        this.handleVote(playerId, message.payload.targetPlayerId)
        break
      case "leaveRoom":
        this.removeClient(playerId)
        break
      case "startVote":
        this.handleStartVote()
        break
      case "continueAfterElimination":
        this.handleContinueAfterElimination()
        break
      case "resetToSetup":
        this.handleResetToSetup()
        break
      case "startNewGame":
        this.handleStartNewGame()
        break
    }
  }

  private handleStartGame(payload: { categories: WordCategory[]; difficulty: WordDifficulty; discussionSeconds: number }): void {
    if (this.state.phase !== "lobby") return

    const alivePlayers = this.state.players.filter((p) => !p.isEliminated)
    if (alivePlayers.length < 3) return

    const word = logic.getWord(payload.categories, payload.difficulty)
    const impostorId = logic.chooseImpostor(this.state.players)

    this.state.phase = "deal"
    this.state.roundNumber = 1
    this.state.players = this.state.players.map((p) => ({ ...p, isEliminated: false }))
    this.state.secretWord = word
    this.state.impostorId = impostorId
    this.state.currentPlayerIndex = 0
    this.state.categories = payload.categories
    this.state.difficulty = payload.difficulty
    this.state.discussion.secondsTotal = payload.discussionSeconds
    this.state.discussion.secondsLeft = payload.discussionSeconds
    this.state.discussion.chatMessages = []
    this.state.discussion.running = false
    this.state.deal = { playersReady: [] }
    this.state.vote = null
    this.state.elimination = null
    this.state.gameOver = null

    this.broadcastToAll({ type: "gameStarted", payload: { room: this.getState() } })

    for (const [, client] of this.clients) {
      const isImpostor = client.playerId === impostorId
      this.sendTo(client.playerId, {
        type: "yourWord",
        payload: { word: isImpostor ? null : word, isImpostor },
      })
    }
  }

  private handlePlayerReady(playerId: string): void {
    if (this.state.phase !== "deal" || !this.state.deal) return
    if (this.state.deal.playersReady.includes(playerId)) return

    this.state.deal.playersReady.push(playerId)

    const alivePlayers = this.state.players.filter((p) => !p.isEliminated)
    const allReady = alivePlayers.every((p) => this.state.deal!.playersReady.includes(p.id))

    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })

    if (allReady) {
      this.advanceToDiscussion()
    }
  }

  private handleRevealAck(playerId: string): void {
    if (this.state.phase !== "deal" || !this.state.deal) return
    if (this.state.deal.playersReady.includes(playerId)) return

    this.state.deal.playersReady.push(playerId)

    const alivePlayers = this.state.players.filter((p) => !p.isEliminated)
    const allReady = alivePlayers.every((p) => this.state.deal!.playersReady.includes(p.id))

    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })

    if (allReady) {
      this.advanceToDiscussion()
    }
  }

  private advanceToDiscussion(): void {
    this.state.phase = "discussion"
    this.state.discussion.running = true
    this.state.deal = null

    this.broadcastToAll({ type: "phaseChanged", payload: { phase: "discussion", room: this.getState() } })

    this.startDiscussionTimer()
  }

  private handleChatMessage(playerId: string, text: string): void {
    if (this.state.phase !== "discussion") return

    const sanitized = logic.sanitizeChat(text)
    if (!sanitized) return

    const player = this.state.players.find((p) => p.id === playerId)
    if (!player) return

    const msg: ChatMessage = {
      playerId,
      playerName: player.name,
      text: sanitized,
      timestamp: Date.now(),
    }

    this.state.discussion.chatMessages.push(msg)
    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })
  }

  private handleStartVote(): void {
    if (this.state.phase !== "discussion") return

    this.state.discussion.running = false
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.state.vote = logic.initVoteRound(this.state.players)
    this.state.phase = "vote"

    this.broadcastToAll({ type: "phaseChanged", payload: { phase: "vote", room: this.getState() } })
  }

  private handleVote(playerId: string, targetPlayerId: string): void {
    if (this.state.phase !== "vote" || !this.state.vote) return
    if (!this.state.impostorId) return

    const vote = this.state.vote
    if (vote.selectionsByVoterId[playerId]) return

    vote.selectionsByVoterId[playerId] = targetPlayerId
    vote.votesSubmitted++

    this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })

    if (vote.votesSubmitted >= vote.voterIds.length) {
      this.resolveVote()
    }
  }

  private resolveVote(): void {
    const vote = this.state.vote
    if (!vote || !this.state.impostorId) return

    const result = logic.computeVoteResult({
      players: this.state.players,
      impostorId: this.state.impostorId,
      vote,
    })

    if (result.type === "tie") {
      this.state.elimination = result
      this.state.phase = "elimination"
      this.state.vote = null
      this.broadcastToAll({ type: "phaseChanged", payload: { phase: "elimination", room: this.getState() } })
      return
    }

    this.state.players = this.state.players.map((p) =>
      p.id === result.playerId ? { ...p, isEliminated: true } : p
    )

    if (result.wasImpostor && this.state.secretWord) {
      this.state.gameOver = {
        winner: "civilians",
        word: this.state.secretWord,
        impostorId: this.state.impostorId,
      }
      this.state.phase = "gameover"
      this.state.vote = null
      this.state.elimination = null
      this.state.discussion.running = false
      this.broadcastToAll({ type: "phaseChanged", payload: { phase: "gameover", room: this.getState() } })
      return
    }

    const aliveCount = logic.getAlivePlayers(this.state.players).length
    if (aliveCount <= 2 && this.state.secretWord) {
      this.state.gameOver = {
        winner: "impostor",
        word: this.state.secretWord,
        impostorId: this.state.impostorId,
      }
      this.state.phase = "gameover"
      this.state.vote = null
      this.state.elimination = null
      this.state.discussion.running = false
      this.broadcastToAll({ type: "phaseChanged", payload: { phase: "gameover", room: this.getState() } })
      return
    }

    this.state.elimination = result
    this.state.phase = "elimination"
    this.state.vote = null
    this.broadcastToAll({ type: "phaseChanged", payload: { phase: "elimination", room: this.getState() } })
  }

  private handleContinueAfterElimination(): void {
    if (this.state.phase !== "elimination" || !this.state.elimination) return

    if (this.state.elimination.type === "tie") {
      this.state.vote = logic.initVoteRound(this.state.players, this.state.elimination.playerIds)
      this.state.phase = "vote"
      this.state.elimination = null
      this.broadcastToAll({ type: "phaseChanged", payload: { phase: "vote", room: this.getState() } })
      return
    }

    this.state.phase = "discussion"
    this.state.roundNumber++
    this.state.vote = null
    this.state.elimination = null
    this.state.discussion.secondsLeft = this.state.discussion.secondsTotal
    this.state.discussion.running = false
    this.state.discussion.chatMessages = []

    this.broadcastToAll({ type: "phaseChanged", payload: { phase: "discussion", room: this.getState() } })

    this.startDiscussionTimer()
  }

  private handleResetToSetup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.state.phase = "lobby"
    this.state.roundNumber = 1
    this.state.secretWord = null
    this.state.impostorId = null
    this.state.currentPlayerIndex = 0
    this.state.vote = null
    this.state.elimination = null
    this.state.gameOver = null
    this.state.deal = null
    this.state.discussion.running = false
    this.state.discussion.chatMessages = []
    this.state.discussion.secondsLeft = this.state.discussion.secondsTotal
    this.state.players = this.state.players.map((p) => ({ ...p, isEliminated: false }))

    this.broadcastToAll({ type: "phaseChanged", payload: { phase: "lobby", room: this.getState() } })
  }

  private handleStartNewGame(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    const word = logic.getWord(this.state.categories, this.state.difficulty)
    const impostorId = logic.chooseImpostor(this.state.players)

    this.state.phase = "deal"
    this.state.roundNumber = 1
    this.state.players = this.state.players.map((p) => ({ ...p, isEliminated: false }))
    this.state.secretWord = word
    this.state.impostorId = impostorId
    this.state.currentPlayerIndex = 0
    this.state.discussion.secondsLeft = this.state.discussion.secondsTotal
    this.state.discussion.chatMessages = []
    this.state.discussion.running = false
    this.state.deal = { playersReady: [] }
    this.state.vote = null
    this.state.elimination = null
    this.state.gameOver = null

    this.broadcastToAll({ type: "gameStarted", payload: { room: this.getState() } })

    for (const [, client] of this.clients) {
      const isImpostor = client.playerId === impostorId
      this.sendTo(client.playerId, {
        type: "yourWord",
        payload: { word: isImpostor ? null : word, isImpostor },
      })
    }
  }

  private startDiscussionTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      if (!this.state.discussion.running) return

      this.state.discussion.secondsLeft--

      if (this.state.discussion.secondsLeft <= 0) {
        this.state.discussion.running = false
        this.state.discussion.secondsLeft = 0
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer)
          this.cleanupTimer = null
        }
        this.handleStartVote()
      } else {
        this.broadcastToAll({ type: "roomUpdated", payload: { room: this.getState() } })
      }
    }, 1000)
  }

  private updatePlayerConnection(playerId: string, connected: boolean): void {
    this.state.players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, isConnected: connected } : p
    )
  }

  private sendTo(playerId: string, message: ServerMessage): void {
    const client = this.clients.get(playerId)
    if (!client) return
    try {
      client.ws.send(JSON.stringify(message))
    } catch {
      // ignore send errors
    }
  }

  private broadcastToAll(message: ServerMessage): void {
    const data = JSON.stringify(message)
    for (const [, client] of this.clients) {
      try {
        client.ws.send(data)
      } catch {
        // ignore send errors
      }
    }
  }
}
