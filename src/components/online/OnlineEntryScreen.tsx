import { ArrowRight, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useRoomStore } from "@/store/roomStore"

export default function OnlineEntryScreen() {
  const setMode = useRoomStore((s) => s.setMode)
  const status = useRoomStore((s) => s.status)
  const errorMessage = useRoomStore((s) => s.errorMessage)
  const selfName = useRoomStore((s) => s.selfName)
  const setSelfName = useRoomStore((s) => s.setSelfName)
  const createRoom = useRoomStore((s) => s.createRoom)
  const joinRoom = useRoomStore((s) => s.joinRoom)

  const [code, setCode] = useState("")

  const canInteract = status !== "connecting"
  const normalizedCode = useMemo(() => code.replace(/\s+/g, ""), [code])

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <section className="panel p-6 sm:p-10">
        <div className="badge">
          <Users className="h-4 w-4" />
          Sala online
        </div>

        <div className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-fg sm:text-5xl">
          IMPOSTOR
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-fg/70">Tu nombre</div>
            <input
              value={selfName}
              onChange={(e) => setSelfName(e.target.value)}
              className="input mt-2"
              placeholder="Escribe tu nombre"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              disabled={!canInteract}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-fg/70">Código (6 dígitos)</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input mt-2"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={!canInteract}
            />
          </div>
        </div>

        {errorMessage ? <div className="mt-4 text-sm font-semibold text-accent2">{errorMessage}</div> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={createRoom}
            className={cn("btn btn-primary w-full px-5 py-4 text-base", canInteract ? "" : "cursor-not-allowed opacity-70")}
            disabled={!canInteract}
          >
            Crear sala
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => joinRoom(normalizedCode)}
            className={cn("btn w-full px-5 py-4 text-base", canInteract ? "" : "cursor-not-allowed opacity-70")}
            disabled={!canInteract}
          >
            Unirme
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <button type="button" onClick={() => setMode("local")} className="btn mt-6 w-full px-5 py-4 text-base">
          Volver a local
        </button>
      </section>
    </div>
  )
}

