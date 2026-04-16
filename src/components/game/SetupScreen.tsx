import { EyeOff, Moon, Search, Sun, Users } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import CategoryPicker from "@/components/game/CategoryPicker"
import DurationSlider from "@/components/game/DurationSlider"
import { useGameStore } from "@/store/gameStore"

function formatClock(secondsTotal: number) {
  const minutes = Math.floor(secondsTotal / 60)
  const seconds = String(secondsTotal % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

function IntroEyes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-6 top-1/2 flex -translate-y-1/2 items-center gap-5 opacity-90 sm:-right-10 sm:gap-7"
    >
      <div className="intro-eye intro-eye-left">
        <div className="intro-iris">
          <div className="intro-pupil" />
          <div className="intro-shine" />
        </div>
        <div className="intro-eye-lid" />
      </div>
      <div className="intro-eye intro-eye-right">
        <div className="intro-iris">
          <div className="intro-pupil" />
          <div className="intro-shine" />
        </div>
        <div className="intro-eye-lid" />
      </div>
    </div>
  )
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
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_circle_at_12%_18%,rgba(163,230,53,0.18),transparent_48%),radial-gradient(900px_circle_at_88%_28%,rgba(217,70,239,0.16),transparent_50%),radial-gradient(900px_circle_at_50%_115%,rgba(59,130,246,0.12),transparent_55%)]"
        />
        <div aria-hidden className="intro-hero-noise pointer-events-none absolute inset-0" />
        <IntroEyes />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/75">
              <Users className="h-4 w-4" />
              Misterio local
            </div>
            <h1
              className={cn(
                "mt-4 text-balance font-black uppercase tracking-tight text-white",
                "text-5xl sm:text-6xl md:text-7xl",
              )}
              style={{ fontFamily: '"Bungee", system-ui, sans-serif' }}
            >
              IMPOSTOR
              <span className="block text-lg font-bold tracking-normal text-white/65 sm:text-xl md:text-2xl">
                Un misterio en cada ronda
              </span>
            </h1>

            <div className="mt-5 grid gap-2 text-sm font-semibold text-white/75 sm:text-base">
              <div className="flex items-start gap-2">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                Pasa el dispositivo y no mires la pantalla.
              </div>
              <div className="flex items-start gap-2">
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                Todos comparten una palabra… menos 1 impostor.
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                Voten, eliminen y descubran quién miente.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {isDark ? "Oscuro" : "Claro"}
          </button>
        </div>
      </section>

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

          <div className="mt-5">
            <DurationSlider
              label="Segundos de reveal"
              value={reveal.seconds}
              min={2}
              max={15}
              step={1}
              onChange={setRevealSeconds}
              formatValue={(v) => `${v}s`}
            />
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-white/70">Discusión</div>
            <div className="mt-3">
              <DurationSlider
                label="Duración"
                value={discussion.secondsTotal}
                min={30}
                max={900}
                step={15}
                onChange={setDiscussionSeconds}
                formatValue={formatClock}
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
