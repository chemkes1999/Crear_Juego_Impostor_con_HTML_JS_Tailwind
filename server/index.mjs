import http from "node:http"
import { randomBytes, randomUUID } from "node:crypto"
import { WebSocketServer } from "ws"
import { broadcast, routeToHost, routeToPlayer, send } from "./messages.mjs"

const PORT = Number(process.env.PORT ?? 3001)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173"

function createConnId() {
  return typeof randomUUID === "function" ? randomUUID() : randomBytes(16).toString("hex")
}

function createToken() {
  return randomBytes(24).toString("hex")
}

function normalizeName(value) {
  const name = String(value ?? "").trim()
  if (!name) return null
  if (name.length > 20) return name.slice(0, 20)
  return name
}

function createRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const rooms = new Map()
const connMeta = new Map()

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify({ ok: true }))
})

const wss = new WebSocketServer({ server })

function getRoom(code) {
  const normalized = String(code ?? "").trim()
  if (!/^\d{6}$/.test(normalized)) return null
  return rooms.get(normalized) ?? null
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  if (CORS_ORIGIN === "*") return true
  return origin === CORS_ORIGIN
}

function safeRoster(room) {
  return room.players.map((p) => ({ playerId: p.playerId, name: p.name }))
}

function handleDisconnect(connId) {
  const meta = connMeta.get(connId)
  connMeta.delete(connId)
  if (!meta) return

  const room = rooms.get(meta.roomCode)
  if (!room) return

  if (room.hostConnId === connId) {
    broadcast(room, { type: "ROOM_CLOSED", message: "El host se desconectó" })
    for (const player of room.players) {
      const ws = room.connections.get(player.connId)
      try {
        ws?.close()
      } catch {
      }
    }
    rooms.delete(meta.roomCode)
    return
  }

  room.players = room.players.filter((p) => p.connId !== connId)
  room.connections.delete(connId)
  broadcast(room, { type: "ROSTER_UPDATE", roster: safeRoster(room) })
  routeToHost(room, { type: "CLIENT_LEFT", playerId: meta.playerId })
}

wss.on("connection", (ws, req) => {
  if (!isAllowedOrigin(req)) {
    send(ws, { type: "ERROR", message: "Origen no permitido" })
    ws.close()
    return
  }

  const connId = createConnId()

  ws.on("message", (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      send(ws, { type: "ERROR", message: "JSON inválido" })
      return
    }

    const type = msg?.type

    if (type === "CREATE_ROOM") {
      const name = normalizeName(msg?.name)
      if (!name) {
        send(ws, { type: "ERROR", message: "Nombre inválido" })
        return
      }

      let code = createRoomCode()
      while (rooms.has(code)) code = createRoomCode()

      const hostKey = createToken()
      const playerId = createToken()

      const room = {
        code,
        hostConnId: connId,
        hostKey,
        players: [{ playerId, name, connId }],
        lastPublicState: null,
        connections: new Map([[connId, ws]]),
      }

      rooms.set(code, room)
      connMeta.set(connId, { roomCode: code, playerId, isHost: true })

      send(ws, { type: "ROOM_CREATED", code, hostKey, playerId, roster: safeRoster(room) })
      return
    }

    if (type === "JOIN_ROOM") {
      const code = String(msg?.code ?? "").trim()
      const room = getRoom(code)
      if (!room) {
        send(ws, { type: "ERROR", message: "Sala no encontrada" })
        return
      }

      const name = normalizeName(msg?.name)
      if (!name) {
        send(ws, { type: "ERROR", message: "Nombre inválido" })
        return
      }

      if (room.players.length >= 15) {
        send(ws, { type: "ERROR", message: "Sala llena" })
        return
      }

      const playerId = createToken()
      room.players.push({ playerId, name, connId })
      room.connections.set(connId, ws)
      connMeta.set(connId, { roomCode: room.code, playerId, isHost: false })

      send(ws, {
        type: "JOINED",
        code: room.code,
        playerId,
        roster: safeRoster(room),
        publicState: room.lastPublicState,
      })

      broadcast(room, { type: "ROSTER_UPDATE", roster: safeRoster(room) })
      routeToHost(room, { type: "CLIENT_JOINED", playerId, name })
      return
    }

    const meta = connMeta.get(connId)
    if (!meta) {
      send(ws, { type: "ERROR", message: "No estás en una sala" })
      return
    }

    const room = rooms.get(meta.roomCode)
    if (!room) {
      send(ws, { type: "ERROR", message: "Sala no encontrada" })
      return
    }

    if (type === "LEAVE_ROOM") {
      try {
        ws.close()
      } catch {
      }
      return
    }

    if (type === "HOST_PUBLIC_STATE") {
      if (room.hostConnId !== connId) {
        send(ws, { type: "ERROR", message: "Solo el host puede hacer eso" })
        return
      }
      if (msg?.hostKey !== room.hostKey) {
        send(ws, { type: "ERROR", message: "HostKey inválida" })
        return
      }
      room.lastPublicState = msg?.state ?? null
      broadcast(room, { type: "PUBLIC_STATE", state: room.lastPublicState })
      return
    }

    if (type === "HOST_PRIVATE") {
      if (room.hostConnId !== connId) {
        send(ws, { type: "ERROR", message: "Solo el host puede hacer eso" })
        return
      }
      if (msg?.hostKey !== room.hostKey) {
        send(ws, { type: "ERROR", message: "HostKey inválida" })
        return
      }
      const ok = routeToPlayer(room, msg?.playerId, { type: "PRIVATE", payload: msg?.payload ?? null })
      if (!ok) send(ws, { type: "ERROR", message: "Jugador no encontrado" })
      return
    }

    if (type === "CLIENT_ACTION") {
      if (msg?.playerId !== meta.playerId) {
        send(ws, { type: "ERROR", message: "playerId inválido" })
        return
      }
      routeToHost(room, { type: "CLIENT_ACTION", playerId: meta.playerId, action: msg?.action ?? null })
      return
    }

    send(ws, { type: "ERROR", message: "Mensaje desconocido" })
  })

  ws.on("close", () => {
    handleDisconnect(connId)
  })
})

server.listen(PORT, () => {
  process.stdout.write(`ws-server listening on :${PORT}\n`)
})
