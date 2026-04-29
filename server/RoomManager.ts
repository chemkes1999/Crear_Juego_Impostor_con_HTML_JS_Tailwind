import { customAlphabet } from "nanoid"
import { GameRoom } from "./GameRoom"

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4)

export class RoomManager {
  private rooms = new Map<string, GameRoom>()

  createRoom(): { room: GameRoom; code: string } {
    let code: string
    do {
      code = generateCode()
    } while (this.rooms.has(code))

    const room = new GameRoom(code)
    this.rooms.set(code, room)
    return { room, code }
  }

  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase())
  }

  removeRoom(code: string): void {
    this.rooms.delete(code.toUpperCase())
  }

  getRoomCount(): number {
    return this.rooms.size
  }

  cleanup(): void {
    const toRemove: string[] = []
    for (const [code, room] of this.rooms) {
      if (room.isEmpty()) {
        toRemove.push(code)
      }
    }
    for (const code of toRemove) {
      this.rooms.delete(code)
    }
  }
}
