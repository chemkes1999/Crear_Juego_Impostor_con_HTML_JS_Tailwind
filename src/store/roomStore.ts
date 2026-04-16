import type { RealtimeChannel } from "@supabase/supabase-js"
import { create } from "zustand"
import { hostHandleClientAction } from "@/game/onlineActions"
import { getSupabase } from "@/network/supabaseClient"
import { useGameStore } from "@/store/gameStore"

type RoomMode = "local" | "online"
type RoomStatus = "idle" | "connecting" | "in_room" | "error"

type RosterPlayer = {
  playerId: string
  name: string
}

type RoomState = {
  mode: RoomMode
  status: RoomStatus
  errorMessage: string | null
  roomCode: string | null
  playerId: string | null
  isHost: boolean
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
}

function normalizeName(value: string) {
  const name = value.trim()
  if (!name) return null
  if (name.length > 20) return name.slice(0, 20)
  return name
}

function createRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function ensureAnonUser() {
  const supabase = getSupabase()
  const sessionRes = await supabase.auth.getSession()
  const existingUser = sessionRes.data.session?.user ?? null
  if (existingUser) return existingUser

  const res = await supabase.auth.signInAnonymously()
  if (res.error) throw res.error
  const user = res.data.user
  if (!user) throw new Error("No se pudo iniciar sesión")
  return user
}

export const useRoomStore = create<RoomState>((set, get) => {
  let channels: RealtimeChannel[] = []
  let supabase: ReturnType<typeof getSupabase> | null = null

  function sb() {
    if (supabase) return supabase
    supabase = getSupabase()
    return supabase
  }

  function resetRoomState() {
    set({
      status: "idle",
      errorMessage: null,
      roomCode: null,
      playerId: null,
      isHost: false,
      roster: [],
      publicState: null,
      privatePayload: null,
    })
  }

  function unsubscribeAll() {
    for (const ch of channels) void ch.unsubscribe()
    channels = []
  }

  async function fetchRoster(roomCode: string) {
    const res = await sb()
      .from("room_members")
      .select("user_id,name")
      .eq("room_code", roomCode)
      .order("joined_at", { ascending: true })
    if (res.error) throw res.error
    const roster = (res.data ?? []).map((p) => ({ playerId: String(p.user_id), name: String(p.name ?? "") }))
    set({ roster })
  }

  async function fetchPublicState(roomCode: string) {
    const res = await sb().from("room_state").select("state").eq("room_code", roomCode).maybeSingle()
    if (res.error) throw res.error
    if (!res.data) return null
    return (res.data as { state: unknown }).state
  }

  function subscribeRoom(roomCode: string, userId: string, isHost: boolean) {
    unsubscribeAll()
    const s = sb()

    const rosterChannel = s
      .channel(`room:${roomCode}:roster`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_code=eq.${roomCode}` },
        () => void fetchRoster(roomCode).catch((err) => void err),
      )
      .subscribe()

    const stateChannel = s
      .channel(`room:${roomCode}:state`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_state", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const next = (payload.new as { state?: unknown } | null)?.state ?? null
          set({ publicState: next })
          if (!get().isHost && next) useGameStore.getState().applyPublicState(next)
        },
      )
      .subscribe()

    const privateChannel = s
      .channel(`room:${roomCode}:private:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages", filter: `recipient_user_id=eq.${userId}` },
        (payload) => {
          const p = (payload.new as { payload?: unknown } | null)?.payload ?? null
          set({ privatePayload: p })
          if (p) useGameStore.getState().applyPrivate(p)
        },
      )
      .subscribe()

    channels = [rosterChannel, stateChannel, privateChannel]

    if (!isHost) return

    const actionsChannel = s
      .channel(`room:${roomCode}:actions`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_actions", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const row = payload.new as { user_id?: unknown; action?: unknown } | null
          const playerId = typeof row?.user_id === "string" ? row.user_id : null
          if (!playerId) return
          hostHandleClientAction(
            { roster: get().roster, publishPublicState: get().publishPublicState, sendPrivate: get().sendPrivate },
            playerId,
            row?.action ?? null,
          )
        },
      )
      .subscribe()

    channels = [...channels, actionsChannel]
  }

  return {
    mode: "local",
    status: "idle",
    errorMessage: null,
    roomCode: null,
    playerId: null,
    isHost: false,
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
      void (async () => {
        const name = normalizeName(get().selfName)
        if (!name) {
          set({ status: "error", errorMessage: "Escribe tu nombre" })
          return
        }

        set({ status: "connecting", errorMessage: null, privatePayload: null })
        useGameStore.getState().resetToSetup()

        try {
          const user = await ensureAnonUser()

          let code = createRoomCode()
          let ok = false
          for (let i = 0; i < 6; i += 1) {
            const res = await sb().from("rooms").insert({ code, host_user_id: user.id })
            if (!res.error) {
              ok = true
              break
            }
            code = createRoomCode()
          }
          if (!ok) throw new Error("No se pudo crear la sala")

          const memberRes = await sb().from("room_members").insert({ room_code: code, user_id: user.id, name })
          if (memberRes.error) throw memberRes.error

          const initialState = useGameStore.getState()
          const stateRes = await sb().from("room_state").upsert({
            room_code: code,
            state: {
              phase: initialState.phase,
              roundNumber: initialState.roundNumber,
              players: initialState.players,
              categories: initialState.categories,
              difficulty: initialState.difficulty,
              currentPlayerIndex: initialState.currentPlayerIndex,
              isRevealed: initialState.isRevealed,
              reveal: initialState.reveal,
              discussion: initialState.discussion,
              vote: initialState.vote,
              elimination: initialState.elimination,
              gameOver: initialState.gameOver,
            },
          })
          if (stateRes.error) throw stateRes.error

          set({
            status: "in_room",
            errorMessage: null,
            roomCode: code,
            playerId: user.id,
            isHost: true,
          })

          await fetchRoster(code)
          const publicState = await fetchPublicState(code)
          set({ publicState })
          if (publicState) useGameStore.getState().applyPublicState(publicState)
          subscribeRoom(code, user.id, true)
        } catch (err) {
          set({ status: "error", errorMessage: err instanceof Error ? err.message : "Error al crear sala" })
        }
      })()
    },

    joinRoom: (code) => {
      void (async () => {
        const name = normalizeName(get().selfName)
        const normalizedCode = code.replace(/\s+/g, "")
        if (!name) {
          set({ status: "error", errorMessage: "Escribe tu nombre" })
          return
        }
        if (!/^\d{6}$/.test(normalizedCode)) {
          set({ status: "error", errorMessage: "Código inválido" })
          return
        }

        set({ status: "connecting", errorMessage: null, privatePayload: null })
        useGameStore.getState().resetToSetup()

        try {
          const user = await ensureAnonUser()
          const memberRes = await sb()
            .from("room_members")
            .upsert({ room_code: normalizedCode, user_id: user.id, name }, { onConflict: "room_code,user_id" })
          if (memberRes.error) throw memberRes.error

          set({
            status: "in_room",
            errorMessage: null,
            roomCode: normalizedCode,
            playerId: user.id,
            isHost: false,
          })

          await fetchRoster(normalizedCode)
          const publicState = await fetchPublicState(normalizedCode)
          set({ publicState })
          if (publicState) useGameStore.getState().applyPublicState(publicState)
          subscribeRoom(normalizedCode, user.id, false)
        } catch (err) {
          set({ status: "error", errorMessage: err instanceof Error ? err.message : "Error al unirse" })
        }
      })()
    },

    leaveRoom: () => {
      unsubscribeAll()
      resetRoomState()
      useGameStore.getState().resetToSetup()
    },

    sendClientAction: (action) => {
      void (async () => {
        const s = get()
        if (s.status !== "in_room" || !s.roomCode || !s.playerId) return
        await sb().from("client_actions").insert({ room_code: s.roomCode, user_id: s.playerId, action })
      })()
    },

    publishPublicState: (state) => {
      void (async () => {
        const s = get()
        if (s.status !== "in_room" || !s.isHost || !s.roomCode) return
        await sb().from("room_state").upsert({ room_code: s.roomCode, state })
      })()
    },

    sendPrivate: (playerId, payload) => {
      void (async () => {
        const s = get()
        if (s.status !== "in_room" || !s.isHost || !s.roomCode) return
        await sb().from("private_messages").insert({ room_code: s.roomCode, recipient_user_id: playerId, payload })
      })()
    },
  }
})
