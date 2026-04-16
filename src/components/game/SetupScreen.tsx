import { Moon, Sun, Users } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import CategoryPicker from "@/components/game/CategoryPicker"
import { useGameStore } from "@/store/gameStore"

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

export default function SetupScreen() {
  const { isDark, toggleTheme } = useTheme()

  const players = useGameStore((s) => s.players)
  const setPlayerCount = useGameStore((s) => s.setPlayerCount)
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const categories = useGameStore((s) => s.categories)
  const toggleCategory = useGameStore((s) => s.toggleCategory)
  const difficulty = useGameStore((s) => s.difficulty)
  const setDifficulty = useGameStore((s) => s.setDifficulty)
  const reveal = useGameStore((s) => s.reveal)
  const setRevealAutoHide = useGameStore((s) => s.setRevealAutoHide)
  const setRevealSeconds = useGameStore((s) => s.setRevealSeconds)
  const discussion = useGameStore((s) => s.discussion)
  const setDiscussionSeconds = useGameStore((s) => s.setDiscussionSeconds)
  const startGame = useGameStore((s) => s.startGame)

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Users className="h-4 w-4" />
            Impostor local
          </div>
          <h1
            className={cn(
              "mt-4 text-balance font-black uppercase tracking-tight text-white",
              "text-4xl sm:text-5xl md:text-6xl",
            )}
            style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}
          >
            Pasa el dispositivo.
            <span className="block text-white/70">No mires la pantalla.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
            Todos reciben una palabra secreta (en español) menos 1 impostor. Configura la ronda y reparte los roles uno por uno con
            pantalla de seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {isDark ? "Oscuro" : "Claro"}
        </button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/80">Jugadores</h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="text-sm text-white/70">Cantidad</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlayerCount(players.length - 1)}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white/80 transition hover:bg-white/10"
              >
                −
              </button>
              <div className="w-14 text-center text-2xl font-black text-white">{players.length}</div>
              <button
                type="button"
                onClick={() => setPlayerCount(players.length + 1)}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white/80 transition hover:bg-white/10"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {players.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="w-20 shrink-0 text-xs font-semibold text-white/50">Jugador {idx + 1}</div>
                <input
                  value={p.name}
                  onChange={(e) => setPlayerName(idx, e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-lime-300/40"
                  placeholder={`Jugador ${idx + 1}`}
                  inputMode="text"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/80">Palabras</h2>

          <div className="mt-4">
            <div className="text-sm font-semibold text-white/70">Categorías</div>
            <div className="mt-2">
              <CategoryPicker selected={categories} onToggle={toggleCategory} />
            </div>
            <p className="mt-3 text-xs text-white/50">Si apagas todas, se usan todas automáticamente.</p>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white/70">Dificultad</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDifficulty("basic")}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  difficulty === "basic"
                    ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                Básica
              </button>
              <button
                type="button"
                onClick={() => setDifficulty("extended")}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  difficulty === "extended"
                    ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                Extendida
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/80">Seguridad</h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/70">Auto-ocultar palabra</div>
              <div className="text-xs text-white/50">Ideal para que nadie se quede mirando.</div>
            </div>
            <button
              type="button"
              onClick={() => setRevealAutoHide(!reveal.autoHide)}
              className={cn(
                "h-10 rounded-xl border px-3 text-sm font-bold transition",
                reveal.autoHide
                  ? "border-lime-300/40 bg-lime-300/15 text-lime-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              )}
            >
              {reveal.autoHide ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="text-sm text-white/70">Segundos de reveal</label>
            <input
              value={reveal.seconds}
              onChange={(e) => setRevealSeconds(clampInt(Number(e.target.value), 2, 15))}
              className="h-10 w-24 rounded-xl border border-white/10 bg-black/40 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/40"
              inputMode="numeric"
            />
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white/70">Discusión</div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <label className="text-sm text-white/70">Duración (seg)</label>
              <input
                value={discussion.secondsTotal}
                onChange={(e) => setDiscussionSeconds(clampInt(Number(e.target.value), 30, 900))}
                className="h-10 w-24 rounded-xl border border-white/10 bg-black/40 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/40"
                inputMode="numeric"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="mt-6 w-full rounded-2xl border border-lime-300/30 bg-gradient-to-b from-lime-300/25 to-lime-300/10 px-4 py-4 text-base font-black uppercase tracking-wide text-lime-100 shadow-[0_0_0_1px_rgba(163,230,53,0.15),0_25px_80px_-40px_rgba(163,230,53,0.65)] transition hover:from-lime-300/30 hover:to-lime-300/15"
          >
            Empezar ronda
          </button>
        </section>
      </div>
    </div>
  )
}
