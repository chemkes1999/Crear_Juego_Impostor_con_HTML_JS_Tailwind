import { useEffect, useRef, useCallback } from "react"
import { useWsStore, handleServerMessage } from "@/store/wsStore"
import type { RoomState } from "@/store/gameStore"
import type { ServerMessage } from "../../server/types"

type UseWebSocketCallbacks = {
  onRoomState: (room: RoomState) => void
  onRoomCreated: (code: string, playerId: string) => void
  onRoomJoined: (room: RoomState, playerId: string) => void
  onYourWord: (word: string | null, isImpostor: boolean) => void
  onError: (message: string) => void
}

export function useWebSocket(callbacks: UseWebSocketCallbacks) {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const ws = useWsStore((s) => s.ws)
  const lastError = useWsStore((s) => s.lastError)
  const send = useWsStore((s) => s.send)
  const connect = useWsStore((s) => s.connect)
  const disconnect = useWsStore((s) => s.disconnect)
  const clearError = useWsStore((s) => s.clearError)

  const connectionState = useWsStore((s) => s.connectionState)
  const playerId = useWsStore((s) => s.playerId)
  const roomCode = useWsStore((s) => s.roomCode)

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as ServerMessage
      handleServerMessage(message, {
        onRoomState: callbacksRef.current.onRoomState,
        onRoomCreated: callbacksRef.current.onRoomCreated,
        onRoomJoined: callbacksRef.current.onRoomJoined,
        onYourWord: callbacksRef.current.onYourWord,
        onError: callbacksRef.current.onError,
      })
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    if (!ws) return
    ws.addEventListener("message", handleMessage)
    return () => {
      ws.removeEventListener("message", handleMessage)
    }
  }, [ws, handleMessage])

  return {
    ws,
    connectionState,
    playerId,
    roomCode,
    lastError,
    send,
    connect,
    disconnect,
    clearError,
  }
}
