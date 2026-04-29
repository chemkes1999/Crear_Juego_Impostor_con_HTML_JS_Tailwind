import { create } from "zustand"
import type { ClientMessage, ServerMessage } from "../../server/types"
import type { RoomState } from "@/store/gameStore"

type ConnectionState = "disconnected" | "connecting" | "connected"

type WsState = {
  ws: WebSocket | null
  connectionState: ConnectionState
  playerId: string | null
  roomCode: string | null
  lastError: string | null

  connect: () => void
  disconnect: () => void
  send: (message: ClientMessage) => void
  clearError: () => void
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001"
const MAX_RECONNECT_DELAY = 5000
const INITIAL_RECONNECT_DELAY = 1000

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = INITIAL_RECONNECT_DELAY

export const useWsStore = create<WsState>((set, get) => ({
  ws: null,
  connectionState: "disconnected",
  playerId: null,
  roomCode: null,
  lastError: null,

  connect: () => {
    const { ws, connectionState } = get()
    if (ws && connectionState === "connected") return

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    set({ connectionState: "connecting", lastError: null })

    try {
      const newWs = new WebSocket(WS_URL)

      newWs.onopen = () => {
        reconnectDelay = INITIAL_RECONNECT_DELAY
        set({ ws: newWs, connectionState: "connected", lastError: null })
      }

      newWs.onclose = () => {
        set({ ws: null, connectionState: "disconnected" })
        scheduleReconnect()
      }

      newWs.onerror = () => {
        set({ lastError: "Error de conexión" })
      }

      set({ ws: newWs })
    } catch {
      set({ connectionState: "disconnected", lastError: "No se pudo conectar" })
      scheduleReconnect()
    }
  },

  disconnect: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    const { ws } = get()
    if (ws) {
      ws.close()
    }
    set({ ws: null, connectionState: "disconnected" })
  },

  send: (message: ClientMessage) => {
    const { ws, connectionState } = get()
    if (ws && connectionState === "connected") {
      try {
        ws.send(JSON.stringify(message))
      } catch {
        set({ lastError: "Error al enviar mensaje" })
      }
    }
  },

  clearError: () => set({ lastError: null }),
}))

function scheduleReconnect() {
  if (reconnectTimeout) return

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    const { connect, connectionState } = useWsStore.getState()
    if (connectionState === "disconnected") {
      connect()
    }
  }, reconnectDelay)

  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
}

export function handleServerMessage(
  message: ServerMessage,
  callbacks: {
    onRoomState: (room: RoomState) => void
    onRoomCreated: (code: string, playerId: string) => void
    onRoomJoined: (room: RoomState, playerId: string) => void
    onYourWord: (word: string | null, isImpostor: boolean) => void
    onError: (message: string) => void
  },
) {
  switch (message.type) {
    case "roomCreated":
      callbacks.onRoomCreated(message.payload.code, message.payload.playerId)
      break
    case "roomJoined":
      callbacks.onRoomJoined(message.payload.room, message.payload.playerId)
      callbacks.onRoomState(message.payload.room)
      break
    case "roomUpdated":
      callbacks.onRoomState(message.payload.room)
      break
    case "gameStarted":
      callbacks.onRoomState(message.payload.room)
      break
    case "phaseChanged":
      callbacks.onRoomState(message.payload.room)
      break
    case "yourWord":
      callbacks.onYourWord(message.payload.word, message.payload.isImpostor)
      break
    case "error":
      callbacks.onError(message.payload.message)
      break
  }
}
