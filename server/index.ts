import { WebSocketServer, WebSocket } from "ws"
import { RoomManager } from "./RoomManager"
import { GameRoom } from "./GameRoom"
import type { ClientMessage, ServerMessage } from "./types"

const PORT = parseInt(process.env.PORT || "3001", 10)

const roomManager = new RoomManager()
const playerRoomMap = new Map<string, string>()

function getPlayerRoom(playerId: string): GameRoom | null {
  const code = playerRoomMap.get(playerId)
  if (!code) return null
  return roomManager.getRoom(code) ?? null
}

const wss = new WebSocketServer({ port: PORT })
console.log(`WebSocket server running on ws://localhost:${PORT}`)

wss.on("connection", (ws: WebSocket) => {
  let currentPlayerId: string | null = null

  ws.on("message", (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString()) as ClientMessage

      switch (message.type) {
        case "createRoom": {
          const { room, code } = roomManager.createRoom()
          const playerId = room.handleJoin(ws, message.payload.playerName)
          room.setHost(playerId)
          currentPlayerId = playerId
          playerRoomMap.set(playerId, code)

          room.addClient(ws, playerId, message.payload.playerName)

          sendTo(ws, { type: "roomCreated", payload: { code, playerId } })
          sendTo(ws, { type: "roomJoined", payload: { room: room.getState(), playerId } })
          console.log(`Room ${code} created by ${message.payload.playerName}`)
          break
        }

        case "joinRoom": {
          const room = roomManager.getRoom(message.payload.code)
          if (!room) {
            sendTo(ws, { type: "error", payload: { message: "Sala no encontrada" } })
            return
          }
          if (room.getState().phase !== "lobby") {
            sendTo(ws, { type: "error", payload: { message: "La partida ya comenzó" } })
            return
          }
          const playerId = room.handleJoin(ws, message.payload.playerName)
          currentPlayerId = playerId
          playerRoomMap.set(playerId, message.payload.code.toUpperCase())

          room.addClient(ws, playerId, message.payload.playerName)
          const roomState = room.getState()

          sendTo(ws, { type: "roomJoined", payload: { room: roomState, playerId } })
          console.log(`${message.payload.playerName} joined room ${message.payload.code.toUpperCase()}`)
          break
        }

        case "startGame":
        case "playerReady":
        case "revealAck":
        case "chatMessage":
        case "vote":
        case "leaveRoom":
        case "startVote":
        case "continueAfterElimination":
        case "resetToSetup":
        case "startNewGame": {
          if (!currentPlayerId) {
            sendTo(ws, { type: "error", payload: { message: "No estás en ninguna sala" } })
            return
          }
          const room = getPlayerRoom(currentPlayerId)
          if (!room) {
            sendTo(ws, { type: "error", payload: { message: "Sala no encontrada" } })
            return
          }
          room.handleClientMessage(currentPlayerId, message)
          break
        }
      }
    } catch (err) {
      console.error("Error processing message:", err)
      sendTo(ws, { type: "error", payload: { message: "Mensaje inválido" } })
    }
  })

  ws.on("close", () => {
    if (currentPlayerId) {
      const room = getPlayerRoom(currentPlayerId)
      if (room) {
        room.removeClient(currentPlayerId)
      }
      playerRoomMap.delete(currentPlayerId)
    }
  })

  ws.on("error", (err) => {
    console.error("WebSocket error:", err)
  })
})

function sendTo(ws: WebSocket, message: ServerMessage): void {
  try {
    ws.send(JSON.stringify(message))
  } catch {
    // ignore send errors
  }
}

setInterval(() => {
  roomManager.cleanup()
}, 60000)

process.on("SIGINT", () => {
  console.log("Shutting down...")
  wss.close()
  process.exit(0)
})
