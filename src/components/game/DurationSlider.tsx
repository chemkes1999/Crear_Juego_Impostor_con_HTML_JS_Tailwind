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
        <div className="text-sm font-semibold text-fg/70">{label}</div>
        <div className="chip text-sm font-black text-fg">
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
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-surface/10 outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--accent)_/_0.4)]",
          "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fg [&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgb(var(--accent)_/_0.18)]",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-fg [&::-moz-range-thumb]:shadow-[0_0_0_6px_rgb(var(--accent)_/_0.18)]",
        )}
      />

      <div className="flex items-center justify-between text-xs font-semibold text-fg/50">
        <div>{leftLabel}</div>
        <div>{rightLabel}</div>
      </div>
    </div>
  )
}
