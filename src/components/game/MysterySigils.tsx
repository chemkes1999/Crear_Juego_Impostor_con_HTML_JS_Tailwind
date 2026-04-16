import { cn } from "@/lib/utils"

export function VictoryStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={cn("victory-star", className)} aria-hidden>
      <defs>
        <radialGradient id="starCore" cx="50%" cy="45%" r="65%">
          <stop offset="0" stopColor="#fef9c3" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#fef08a" stopOpacity="0.92" />
          <stop offset="0.62" stopColor="#a7f3d0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0.05" />
        </radialGradient>
        <linearGradient id="starEdge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fef3c7" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#93c5fd" stopOpacity="0.78" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0.55" />
        </linearGradient>
        <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feColorMatrix
            in="b"
            type="matrix"
            values="1 0 0 0 0.2  0 1 0 0 0.25  0 0 1 0 0.35  0 0 0 0.9 0"
            result="c"
          />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#starGlow)">
        <path
          d="M120 18l22 64h68l-55 40 21 64-56-39-56 39 21-64-55-40h68l22-64z"
          fill="url(#starCore)"
          stroke="url(#starEdge)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          className="victory-star-shine"
          d="M120 28l18 52h54l-44 32 16 52-44-31-44 31 16-52-44-32h54l18-52z"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      <g className="victory-star-sparks" opacity="0.7">
        <circle cx="34" cy="78" r="2.2" fill="rgba(255,255,255,0.8)" />
        <circle cx="196" cy="62" r="1.8" fill="rgba(255,255,255,0.75)" />
        <circle cx="210" cy="146" r="2.1" fill="rgba(255,255,255,0.7)" />
        <circle cx="58" cy="184" r="1.9" fill="rgba(255,255,255,0.6)" />
        <circle cx="120" cy="214" r="1.6" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>
  )
}

function Eye({ className }: { className?: string }) {
  return (
    <div className={cn("mystery-eye intro-eye", className)}>
      <div className="intro-iris">
        <div className="intro-pupil" />
        <div className="intro-shine" />
      </div>
      <div className="intro-eye-lid" />
      <div className="mystery-eye-fog" aria-hidden />
    </div>
  )
}

export function TenebrousEyes({ className }: { className?: string }) {
  return (
    <div className={cn("mystery-eyes", className)} aria-hidden>
      <div className="mystery-eyes-aura" />
      <div className="mystery-eyes-row">
        <Eye className="mystery-eye-left" />
        <Eye className="mystery-eye-right" />
      </div>
    </div>
  )
}

