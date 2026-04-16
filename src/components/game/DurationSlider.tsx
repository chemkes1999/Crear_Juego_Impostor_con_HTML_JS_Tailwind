import { cn } from "@/lib/utils"

function clampStep(params: { value: number; min: number; max: number; step: number }) {
  const { value, min, max, step } = params
  const clamped = Math.max(min, Math.min(max, value))
  const stepped = Math.round((clamped - min) / step) * step + min
  return Math.max(min, Math.min(max, stepped))
}

export default function DurationSlider(props: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  minLabel?: string
  maxLabel?: string
}) {
  const { label, value, min, max, step, onChange, formatValue, minLabel, maxLabel } = props

  const displayValue = formatValue ? formatValue(value) : String(value)
  const leftLabel = minLabel ?? (formatValue ? formatValue(min) : String(min))
  const rightLabel = maxLabel ?? (formatValue ? formatValue(max) : String(max))

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white/70">{label}</div>
        <div className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-3 py-1 text-sm font-black text-white">
          {displayValue}
        </div>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = clampStep({ value: Number(e.target.value), min, max, step })
          onChange(next)
        }}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 outline-none",
          "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgba(163,230,53,0.18)]",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_6px_rgba(163,230,53,0.18)]",
        )}
      />

      <div className="flex items-center justify-between text-xs font-semibold text-white/40">
        <div>{leftLabel}</div>
        <div>{rightLabel}</div>
      </div>
    </div>
  )
}
