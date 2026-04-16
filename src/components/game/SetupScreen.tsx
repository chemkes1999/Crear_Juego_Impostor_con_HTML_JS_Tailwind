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

function IntroEye({ className }: { className?: string }) {
  return (
    <div className={cn("intro-eye", className)}>
      <div className="intro-iris">
        <div className="intro-pupil" />
        <div className="intro-shine" />
      </div>
      <div className="intro-eye-lid" />
    </div>
  )
}

function IntroEyes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-16 top-1/2 flex -translate-y-1/2 scale-[0.78] items-center gap-5 opacity-75 sm:-right-10 sm:scale-100 sm:gap-7 sm:opacity-90"
    >
      <IntroEye className="intro-eye-left" />
      <IntroEye className="intro-eye-right" />
    </div>
  )
}

function IntroBackgroundEyes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-10 top-8 opacity-25 blur-[0.25px]">
        <IntroEye className="intro-eye-left intro-eye-sm" />
      </div>
      <div className="absolute left-10 top-40 opacity-20 blur-[0.45px]">
        <IntroEye className="intro-eye-right intro-eye-sm" />
      </div>
      <div className="absolute right-28 top-16 opacity-18 blur-[0.6px]">
        <IntroEye className="intro-eye-left intro-eye-sm" />
      </div>
      <div className="absolute -right-12 bottom-10 opacity-22 blur-[0.35px]">
        <IntroEye className="intro-eye-right intro-eye-sm" />
      </div>
      <div className="absolute left-1/2 top-12 -translate-x-1/2 opacity-14 blur-[0.7px]">
        <IntroEye className="intro-eye-right intro-eye-sm" />
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
    <div className="screen max-w-5xl">
      <section className="panel relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(900px_circle_at_12%_18%,rgba(163,230,53,0.18),transparent_48%),radial-gradient(900px_circle_at_88%_28%,rgba(217,70,239,0.16),transparent_50%),radial-gradient(900px_circle_at_50%_115%,rgba(59,130,246,0.12),transparent_55%)]"
        />
        <div aria-hidden className="intro-questionmarks pointer-events-none absolute inset-0" />
        <div aria-hidden className="intro-hero-noise pointer-events-none absolute inset-0" />
        <IntroBackgroundEyes />
        <IntroEyes />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="badge">
              <Users className="h-4 w-4" />
              Misterio local
            </div>
            <h1
              className={cn(
                "mt-4 font-display text-balance font-black uppercase tracking-tight text-fg",
                "text-[clamp(2.75rem,12vw,5.25rem)]",
              )}
            >
              IMPOSTOR
              <span className="block text-[clamp(1.05rem,4vw,1.5rem)] font-bold tracking-normal text-fg/65">
                Un misterio en cada ronda
              </span>
            </h1>

            <div className="mt-5 grid gap-2 text-sm font-semibold text-fg/75 sm:text-base">
              <div className="flex items-start gap-2">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-fg/50" />
                Pasa el dispositivo y no mires la pantalla.
              </div>
              <div className="flex items-start gap-2">
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-fg/50" />
                Todos comparten una palabra… menos 1 impostor.
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-fg/50" />
                Voten, eliminen y descubran quién miente.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn mt-1 h-11 rounded-xl px-3.5 py-0 text-sm font-semibold tracking-normal"
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {isDark ? "Oscuro" : "Claro"}
          </button>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="panel panel-sm panel-pad-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg/80">Jugadores</h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="text-sm text-fg/70">Cantidad</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlayerCount(players.length - 1)}
                aria-label="Reducir jugadores"
                className="btn h-11 w-11 rounded-xl p-0 text-lg font-bold tracking-normal"
              >
                −
              </button>
              <div className="w-14 text-center text-2xl font-black text-fg">{players.length}</div>
              <button
                type="button"
                onClick={() => setPlayerCount(players.length + 1)}
                aria-label="Aumentar jugadores"
                className="btn h-11 w-11 rounded-xl p-0 text-lg font-bold tracking-normal"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {players.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2">
                <label htmlFor={`player-${p.id}`} className="w-20 shrink-0 text-xs font-semibold text-fg/55">
                  Jugador {idx + 1}
                </label>
                <input
                  id={`player-${p.id}`}
                  name={`player-${idx + 1}`}
                  value={p.name}
                  onChange={(e) => setPlayerName(idx, e.target.value)}
                  className="input"
                  placeholder={`Jugador ${idx + 1}`}
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-sm panel-pad-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg/80">Palabras</h2>

          <div className="mt-4">
            <div className="text-sm font-semibold text-fg/70">Categorías</div>
            <div className="mt-2">
              <CategoryPicker selected={categories} onToggle={toggleCategory} />
            </div>
            <p className="mt-3 text-xs text-fg/55">Si apagas todas, se usan todas automáticamente.</p>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-fg/70">Dificultad</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDifficulty("basic")}
                className={cn(
                  "flex-1 min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  difficulty === "basic"
                    ? "border-accent2/35 bg-accent2/15 text-fg"
                    : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
                )}
              >
                Básica
              </button>
              <button
                type="button"
                onClick={() => setDifficulty("extended")}
                className={cn(
                  "flex-1 min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  difficulty === "extended"
                    ? "border-accent2/35 bg-accent2/15 text-fg"
                    : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
                )}
              >
                Extendida
              </button>
            </div>
          </div>
        </section>

        <section className="panel panel-sm panel-pad-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg/80">Seguridad</h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-fg/70">Auto-ocultar palabra</div>
              <div className="text-xs text-fg/55">Ideal para que nadie se quede mirando.</div>
            </div>
            <button
              type="button"
              onClick={() => setRevealAutoHide(!reveal.autoHide)}
              className={cn(
                "h-11 rounded-xl border px-3 text-sm font-bold transition",
                reveal.autoHide
                  ? "border-accent/35 bg-accent/15 text-fg"
                  : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
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
            <div className="text-sm font-semibold text-fg/70">Discusión</div>
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
            className="btn btn-primary mt-6 w-full rounded-2xl px-4 py-4 text-base shadow-[0_0_0_1px_rgb(var(--accent)_/_0.15),0_25px_80px_-40px_rgb(var(--accent)_/_0.55)]"
          >
            Empezar ronda
          </button>
        </section>
      </div>
    </div>
  )
}
