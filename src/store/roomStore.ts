import { create } from "zustand"
import { createWsClient } from "@/network/wsClient"
import { hostHandleClientAction } from "@/game/onlineActions"
import { useGameStore } from "@/store/gameStore"

type RoomMode = "local" | "online"
type RoomStatus = "idle" | "connecting" | "in_room" | "error"

type RosterPlayer = {
  playerId: string
  name: string
}

type RoomCreatedMessage = {
  type: "ROOM_CREATED"
  code: string
  hostKey: string
  playerId: string
  roster: RosterPlayer[]
}

type JoinedMessage = {
  type: "JOINED"
  code: string
  playerId: string
  roster: RosterPlayer[]
  publicState?: unknown
}

type RosterUpdateMessage = {
  type: "ROSTER_UPDATE"
  roster: RosterPlayer[]
}

type PublicStateMessage = {
  type: "PUBLIC_STATE"
  state: unknown
}

type PrivateMessage = {
  type: "PRIVATE"
  payload: unknown
}

type ErrorMessage = {
  type: "ERROR"
  message: string
}

type RoomClosedMessage = {
  type: "ROOM_CLOSED"
  message: string
}

type ClientActionMessage = {
  type: "CLIENT_ACTION"
  playerId: string
  action: unknown
}

type ServerMessage =
  | RoomCreatedMessage
  | JoinedMessage
  | RosterUpdateMessage
  | PublicStateMessage
  | PrivateMessage
  | ErrorMessage
  | RoomClosedMessage
  | ClientActionMessage
  | { type: string; [k: string]: unknown }

type RoomState = {
  mode: RoomMode
  status: RoomStatus
  errorMessage: string | null
  roomCode: string | null
  playerId: string | null
  isHost: boolean
  hostKey: string | null
  roster: RosterPlayer[]
  publicState: unknown | null
  privatePayload: unknown | null
  selfName: string

  setMode: (mode: RoomMode) => void
  setSelfName: (name: string) => void
  createRoom: () => void
  joinRoom: (code: string) => void
  leaveRoom: () => void
  sendClientAction: (action: unknown) => void
  publishPublicState: (state: unknown) => void
  sendPrivate: (playerId: string, payload: unknown) => void
  handleServerMessage: (msg: ServerMessage) => void
}

const DEFAULT_WS_URL = "ws://localhost:3001"

export const useRoomStore = create<RoomState>((set, get) => {
  let client: ReturnType<typeof createWsClient> | null = null

  function wsUrl() {
    const envUrl = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_WS_URL
    const url = typeof envUrl === "string" && envUrl.trim() ? envUrl.trim() : DEFAULT_WS_URL
    return url
  }

  function ensureClient() {
    if (client) return client
    client = createWsClient({
      url: wsUrl(),
      onMessage: (msg) => get().handleServerMessage(msg as ServerMessage),
      onClose: () => {
        const s = get()
        if (s.status === "connecting") set({ status: "error", errorMessage: "No se pudo conectar" })
      },
    })
    return client
  }

  function resetRoomState() {
    set({
      status: "idle",
      errorMessage: null,
      roomCode: null,
      playerId: null,
      isHost: false,
      hostKey: null,
      roster: [],
      publicState: null,
      privatePayload: null,
    })
  }

  function disconnectClient() {
    try {
      client?.send({ type: "LEAVE_ROOM" })
    } catch (err) {
      void err
    }
    client?.disconnect()
    client = null
  }

  return {
    mode: "local",
    status: "idle",
    errorMessage: null,
    roomCode: null,
    playerId: null,
    isHost: false,
    hostKey: null,
    roster: [],
    publicState: null,
    privatePayload: null,
    selfName: "",

    setMode: (mode) => {
      const prev = get().mode
      if (prev === mode) return
      if (mode === "local") get().leaveRoom()
      set({ mode })
    },

    setSelfName: (name) => set({ selfName: name }),

    createRoom: () => {
      const name = get().selfName.trim()
      if (!name) {
        set({ status: "error", errorMessage: "Escribe tu nombre" })
        return
      }
      set({ status: "connecting", errorMessage: null, privatePayload: null })
      useGameStore.getState().resetToSetup()
      ensureClient().send({ type: "CREATE_ROOM", name })
    },

    joinRoom: (code) => {
      const name = get().selfName.trim()
      const normalized = code.replace(/\s+/g, "")
      if (!name) {
        set({ status: "error", errorMessage: "Escribe tu nombre" })
        return
      }
      if (!/^\d{6}$/.test(normalized)) {
        set({ status: "error", errorMessage: "Código inválido" })
        return
      }
      set({ status: "connecting", errorMessage: null, privatePayload: null })
      useGameStore.getState().resetToSetup()
      ensureClient().send({ type: "JOIN_ROOM", code: normalized, name })
    },

    leaveRoom: () => {
      disconnectClient()
      resetRoomState()
      useGameStore.getState().resetToSetup()
    },

    sendClientAction: (action) => {
      const s = get()
      if (s.status !== "in_room" || !s.roomCode || !s.playerId) return
      ensureClient().send({ type: "CLIENT_ACTION", code: s.roomCode, playerId: s.playerId, action })
    },

    publishPublicState: (state) => {
      const s = get()
      if (s.status !== "in_room" || !s.isHost || !s.roomCode || !s.hostKey) return
      ensureClient().send({ type: "HOST_PUBLIC_STATE", code: s.roomCode, hostKey: s.hostKey, state })
    },

    sendPrivate: (playerId, payload) => {
      const s = get()
      if (s.status !== "in_room" || !s.isHost || !s.roomCode || !s.hostKey) return
      ensureClient().send({ type: "HOST_PRIVATE", code: s.roomCode, hostKey: s.hostKey, playerId, payload })
    },

    handleServerMessage: (msg) => {
      if (msg.type === "ROOM_CREATED") {
        const m = msg as RoomCreatedMessage
        set({
          status: "in_room",
          errorMessage: null,
          roomCode: m.code,
          playerId: m.playerId,
          isHost: true,
          hostKey: m.hostKey,
          roster: m.roster,
        })
        return
      }

      if (msg.type === "JOINED") {
        const m = msg as JoinedMessage
        set({
          status: "in_room",
          errorMessage: null,
          roomCode: m.code,
          playerId: m.playerId,
          isHost: false,
          hostKey: null,
          roster: m.roster,
          publicState: m.publicState ?? null,
        })
        if (m.publicState) useGameStore.getState().applyPublicState(m.publicState)
        return
      }

      if (msg.type === "ROSTER_UPDATE") {
        const m = msg as RosterUpdateMessage
        set({ roster: m.roster })
        return
      }

      if (msg.type === "PUBLIC_STATE") {
        const m = msg as PublicStateMessage
        set({ publicState: m.state })
        if (!get().isHost) useGameStore.getState().applyPublicState(m.state)
        return
      }

      if (msg.type === "PRIVATE") {
        const m = msg as PrivateMessage
        set({ privatePayload: m.payload })
        if (!get().isHost) useGameStore.getState().applyPrivate(m.payload)
        return
      }

      if (msg.type === "CLIENT_ACTION") {
        if (!get().isHost) return
        const m = msg as ClientActionMessage
        hostHandleClientAction(
          { roster: get().roster, publishPublicState: get().publishPublicState, sendPrivate: get().sendPrivate },
          m.playerId,
          m.action,
        )
        return
      }

      if (msg.type === "ROOM_CLOSED") {
        const m = msg as RoomClosedMessage
        disconnectClient()
        set({
          status: "error",
          errorMessage: m.message,
          roomCode: null,
          playerId: null,
          isHost: false,
          hostKey: null,
          roster: [],
          publicState: null,
          privatePayload: null,
        })
        useGameStore.getState().resetToSetup()
        return
      }

      if (msg.type === "ERROR") {
        const m = msg as ErrorMessage
        set({ status: "error", errorMessage: m.message })
      }
    },
  }
})
