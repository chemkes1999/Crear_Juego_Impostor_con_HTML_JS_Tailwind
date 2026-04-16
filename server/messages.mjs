export function send(ws, message) {
  if (!ws) return
  if (ws.readyState !== ws.OPEN) return
  ws.send(JSON.stringify(message))
}

export function broadcast(room, message, opts = {}) {
  const { exceptConnId } = opts
  for (const player of room.players) {
    if (exceptConnId && player.connId === exceptConnId) continue
    send(room.connections.get(player.connId), message)
  }
}

export function routeToHost(room, message) {
  send(room.connections.get(room.hostConnId), message)
}

export function routeToPlayer(room, playerId, message) {
  const player = room.players.find((p) => p.playerId === playerId)
  if (!player) return false
  send(room.connections.get(player.connId), message)
  return true
}

