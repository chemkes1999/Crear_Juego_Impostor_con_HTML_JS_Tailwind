import { Copy, Crown, LogOut, Users } from "lucide-react"
import { useMemo } from "react"
import { hostStartGameFromLobby } from "@/game/onlineActions"
import { useRoomStore } from "@/store/roomStore"

function safeCopy(text: string) {
  if (typeof navigator === "undefined") return
  if (!navigator.clipboard) return
  void navigator.clipboard.writeText(text)
}

export default function LobbyScreen() {
  const roomCode = useRoomStore((s) => s.roomCode)
  const roster = useRoomStore((s) => s.roster)
  const isHost = useRoomStore((s) => s.isHost)
  const leaveRoom = useRoomStore((s) => s.leaveRoom)
  const publishPublicState = useRoomStore((s) => s.publishPublicState)
  const sendPrivate = useRoomStore((s) => s.sendPrivate)

  const roomApi = useMemo(() => ({ roster, publishPublicState, sendPrivate }), [publishPublicState, roster, sendPrivate])

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="badge">
            <Users className="h-4 w-4" />
            Lobby
          </div>
          <div className="mt-3 font-display text-4xl font-black text-fg sm:text-5xl">Sala {roomCode ?? "—"}</div>
          <div className="mt-2 text-sm font-semibold text-fg/65">Compártelo para que se unan.</div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => safeCopy(roomCode ?? "")} className="btn rounded-xl px-3 py-2 text-sm font-semibold tracking-normal">
            <Copy className="h-4 w-4" />
            Copiar
          </button>
          <button type="button" onClick={leaveRoom} className="btn rounded-xl px-3 py-2 text-sm font-semibold tracking-normal">
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel panel-pad">
          <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Jugadores ({roster.length})</div>
          <div className="mt-4 grid gap-2">
            {roster.map((p, idx) => (
              <div key={p.playerId} className="rounded-2xl border border-border/12 bg-surface/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-fg/90">{p.name || `Jugador ${idx + 1}`}</div>
                  {isHost && idx === 0 ? (
                    <div className="badge">
                      <Crown className="h-4 w-4" />
                      Host
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-pad">
          <div className="text-sm font-bold uppercase tracking-wide text-fg/80">Listos</div>
          <div className="mt-3 text-sm text-fg/65">
            {isHost ? "Cuando estén todos, inicia la ronda." : "Esperando a que el host inicie la ronda."}
          </div>

          {isHost ? (
            <button type="button" onClick={() => hostStartGameFromLobby(roomApi)} className="btn btn-primary mt-8 w-full px-6 py-4 text-base">
              Empezar ronda
            </button>
          ) : null}
        </section>
      </div>
    </div>
  )
}

