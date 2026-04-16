import { cn } from "@/lib/utils"

export default function Crewmate({ variant, className }: { variant: "civilians" | "impostor"; className?: string }) {
  const isImpostor = variant === "impostor"
  return (
    <svg viewBox="0 0 180 200" className={cn("among-crewmate", className)} aria-hidden>
      <defs>
        <linearGradient id="crewBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={isImpostor ? "#fb7185" : "#bef264"} />
          <stop offset="0.55" stopColor={isImpostor ? "#ef4444" : "#84cc16"} />
          <stop offset="1" stopColor={isImpostor ? "#7f1d1d" : "#14532d"} />
        </linearGradient>
        <linearGradient id="crewVisor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="0.45" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <path
        d="M78 18c-25 0-44 20-44 45v62c0 34 18 57 50 57h14c32 0 50-23 50-57V63c0-25-19-45-44-45H78z"
        fill="url(#crewBody)"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M131 70c18 0 31 13 31 31v36c0 14-9 26-24 29V98c0-9-3-18-7-28z"
        fill={isImpostor ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.18)"}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M62 58c6-16 24-26 48-23 19 2 33 11 38 24 3 9 1 18-6 25-9 10-25 15-45 13-22-2-38-12-41-25-1-5 0-9 2-14z"
        fill="url(#crewVisor)"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M70 49c13-9 35-8 52 2" stroke="rgba(255,255,255,0.55)" strokeWidth="6" strokeLinecap="round" />
      <path d="M64 176c10 8 41 9 52 0" stroke="rgba(0,0,0,0.45)" strokeWidth="10" strokeLinecap="round" />
      <path d="M52 170c-10 3-18 10-22 19" stroke="rgba(0,0,0,0.55)" strokeWidth="12" strokeLinecap="round" />
      <path d="M128 170c10 3 18 10 22 19" stroke="rgba(0,0,0,0.55)" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

