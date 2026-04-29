import { useState, useRef, useEffect } from "react"
import { EyeOff, Search, Users, Wifi, WifiOff, AlertCircle, Volume2, VolumeX } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import { useWsStore } from "@/store/wsStore"
import { useGameStore, type Player, type WordCategory } from "@/store/gameStore"
import { playSfx } from "@/lib/sfx"

const ALL_CATEGORIES: WordCategory[] = [
  "Animales", "Comida", "Objetos", "Lugares", "Profesiones", "Acciones", "Deportes", "Naturaleza",
]

export default function LobbyScreen() {
  const { isDark, toggleTheme } = useTheme()
  const connectionState = useWsStore((s) => s.connectionState)
  const lastError = useWsStore((s) => s.lastError)
  const connect = useWsStore((s) => s.connect)
  const clearError = useWsStore((s) => s.clearError)
  const send = useWsStore((s) => s.send)
  const playerId = useWsStore((s) => s.playerId)
  const roomCode = useWsStore((s) => s.roomCode)

  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const difficulty = useGameStore((s) => s.difficulty)
  const discussionSeconds = useGameStore((s) => s.discussion.secondsTotal)
  const phase = useGameStore((s) => s.phase)

  const [mode, setMode] = useState<"create" | "join">("create")
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [lobbySoundsEnabled, setLobbySoundsEnabled] = useState(true)
  const lastPlayerCount = useRef(players.length)

  useEffect(() => {
    if (phase !== "lobby") return
    if (players.length > lastPlayerCount.current && lobbySoundsEnabled) {
      playSfx("playerJoined")
    } else if (players.length < lastPlayerCount.current && lobbySoundsEnabled) {
      playSfx("playerLeft")
    }
    lastPlayerCount.current = players.length
  }, [players.length, phase, lobbySoundsEnabled])

  const categoriesRef = useRef(categories)
  categoriesRef.current = categories
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty
  const discussionSecondsRef = useRef(discussionSeconds)
  discussionSecondsRef.current = discussionSeconds

  const isConnected = connectionState === "connected"
  const isInRoom = roomCode !== null && phase === "lobby"
  const isHost = isInRoom && playerId !== null && players.find((p) => p.id === playerId)?.isHost === true

  function handleCreateRoom() {
    if (!playerName.trim()) return
    send({
      type: "createRoom",
      payload: { playerName: playerName.trim() },
    })
  }

  function handleJoinRoom() {
    if (!playerName.trim() || !joinCode.trim()) return
    send({
      type: "joinRoom",
      payload: { code: joinCode.toUpperCase(), playerName: playerName.trim() },
    })
  }

  function handleStartGame() {
    send({
      type: "startGame",
      payload: {
        categories: categoriesRef.current,
        difficulty: difficultyRef.current,
        discussionSeconds: discussionSecondsRef.current,
      },
    })
  }

  function toggleCategory(cat: WordCategory) {
    const next = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat]
    useGameStore.setState({ categories: next })
  }

  function setDifficulty(d: "basic" | "extended") {
    useGameStore.setState({ difficulty: d })
  }

  function setDiscussionSecs(s: number) {
    const safe = Math.max(30, Math.min(900, s))
    useGameStore.setState((prev) => ({
      ...prev,
      discussion: { ...prev.discussion, secondsTotal: safe, secondsLeft: safe },
    }))
  }

  function formatClock(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="panel relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_circle_at_12%_18%,rgba(163,230,53,0.18),transparent_48%),radial-gradient(900px_circle_at_88%_28%,rgba(217,70,239,0.16),transparent_50%),radial-gradient(900px_circle_at_50%_115%,rgba(59,130,246,0.12),transparent_55%)]"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="badge">
              <Users className="h-4 w-4" />
              Multijugador online
            </div>
            <h1
              className={cn(
                "mt-4 font-display text-balance font-black uppercase tracking-tight text-fg",
                "text-5xl sm:text-6xl md:text-7xl",
              )}
            >
              IMPOSTOR
              <span className="block text-lg font-bold tracking-normal text-fg/65 sm:text-xl md:text-2xl">
                Juega con amigos, donde sea
              </span>
            </h1>

            <div className="mt-5 flex items-center gap-4 text-sm font-semibold text-fg/75">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-accent" />
                  Conectado
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-fg/50" />
                  Desconectado
                  <button onClick={connect} className="text-accent underline ml-2">
                    Reconectar
                  </button>
                </>
              )}
              <button
                onClick={() => setLobbySoundsEnabled(!lobbySoundsEnabled)}
                className="flex items-center gap-1 text-xs text-fg/50 hover:text-fg/70"
              >
                {lobbySoundsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                Sonidos
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn mt-1 rounded-xl px-3 py-2 text-sm font-semibold tracking-normal"
          >
            {isDark ? "🌙" : "☀️"}
          </button>
        </div>
      </section>

      {lastError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-fg">
          <AlertCircle className="h-4 w-4 text-danger" />
          {lastError}
          <button onClick={clearError} className="ml-auto text-xs text-fg/50 underline">
            Cerrar
          </button>
        </div>
      )}

      {isInRoom ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="panel panel-sm panel-pad-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-fg/80">
              Sala: <span className="text-accent">{roomCode}</span>
            </h2>
            <p className="mt-1 text-xs text-fg/50">Comparte este código con tus amigos</p>

            <div className="mt-4 grid gap-2">
              {players.map((p: Player) => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border/12 bg-surface/5 px-4 py-2">
                  <div className={cn("h-2 w-2 rounded-full", p.isConnected ? "bg-accent" : "bg-fg/30")} />
                  <span className="text-sm font-semibold text-fg/90">{p.name}</span>
                  {p.isHost && <span className="ml-auto text-xs font-bold text-accent">HOST</span>}
                </div>
              ))}
            </div>

            <div className="mt-4 text-center text-sm text-fg/50">
              {players.length} jugador{players.length !== 1 ? "es" : ""} · Mínimo 3 para empezar
            </div>
          </section>

          {isHost && (
            <section className="panel panel-sm panel-pad-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-fg/80">Configuración</h3>

              <div className="mt-3">
                <label className="text-xs font-semibold text-fg/70">Categorías</label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "rounded-lg border px-2 py-1 text-xs font-semibold transition",
                        categories.includes(cat)
                          ? "border-accent/35 bg-accent/15 text-fg"
                          : "border-border/12 bg-surface/5 text-fg/70",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-fg/70">Dificultad</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDifficulty("basic")}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-bold",
                      difficulty === "basic" ? "border-accent/35 bg-accent/15 text-fg" : "border-border/12 text-fg/70",
                    )}
                  >
                    Básica
                  </button>
                  <button
                    onClick={() => setDifficulty("extended")}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-bold",
                      difficulty === "extended" ? "border-accent/35 bg-accent/15 text-fg" : "border-border/12 text-fg/70",
                    )}
                  >
                    Extendida
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-fg/70">Discusión</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDiscussionSecs(discussionSeconds - 30)} className="btn h-8 w-8 rounded-lg p-0 text-sm">
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-black text-fg">{formatClock(discussionSeconds)}</span>
                  <button onClick={() => setDiscussionSecs(discussionSeconds + 30)} className="btn h-8 w-8 rounded-lg p-0 text-sm">
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                disabled={players.length < 3}
                className={cn(
                  "btn btn-primary mt-4 w-full px-4 py-4 text-base",
                  players.length < 3 && "cursor-not-allowed opacity-50",
                )}
              >
                Empezar Partida
              </button>
            </section>
          )}

          {!isHost && (
            <section className="panel panel-sm panel-pad-sm">
              <p className="text-sm text-fg/60">Esperando a que el host inicie la partida...</p>
              <div className="mt-4 flex items-center gap-2 text-fg/40">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                En espera
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="panel panel-sm panel-pad-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("create")}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition",
                  mode === "create"
                    ? "border-accent/35 bg-accent/15 text-fg"
                    : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
                )}
              >
                Crear Sala
              </button>
              <button
                onClick={() => setMode("join")}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition",
                  mode === "join"
                    ? "border-accent/35 bg-accent/15 text-fg"
                    : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
                )}
              >
                Unirse
              </button>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-fg/70">Tu nombre</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="input mt-2 w-full"
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (mode === "create") handleCreateRoom()
                    else handleJoinRoom()
                  }
                }}
              />
            </div>

            {mode === "create" ? (
              <button
                onClick={handleCreateRoom}
                disabled={!isConnected || !playerName.trim()}
                className={cn(
                  "btn btn-primary mt-6 w-full px-4 py-4 text-base",
                  (!isConnected || !playerName.trim()) && "cursor-not-allowed opacity-50",
                )}
              >
                <EyeOff className="h-5 w-5" />
                Crear Sala
              </button>
            ) : (
              <>
                <div className="mt-6">
                  <label className="text-sm font-semibold text-fg/70">Código de sala</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="ABCD"
                    className="input mt-2 w-full text-center text-2xl font-black tracking-widest"
                    maxLength={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoinRoom()
                    }}
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={!isConnected || !playerName.trim() || joinCode.length !== 4}
                  className={cn(
                    "btn btn-primary mt-6 w-full px-4 py-4 text-base",
                    (!isConnected || !playerName.trim() || joinCode.length !== 4) && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Search className="h-5 w-5" />
                  Unirse a la Sala
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
