import { cn } from "@/lib/utils"
import type { WordCategory } from "@/data/words"
import { WORD_CATEGORIES } from "@/data/words"

export default function CategoryPicker(props: {
  selected: WordCategory[]
  onToggle: (category: WordCategory) => void
}) {
  const { selected, onToggle } = props
  const enabled = new Set(selected)

  return (
    <div className="flex flex-wrap gap-2">
      {WORD_CATEGORIES.map((cat) => {
        const isOn = enabled.has(cat)
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition",
              isOn
                ? "border-accent/35 bg-accent/15 text-fg hover:bg-accent/20"
                : "border-border/12 bg-surface/5 text-fg/70 hover:bg-surface/10",
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
