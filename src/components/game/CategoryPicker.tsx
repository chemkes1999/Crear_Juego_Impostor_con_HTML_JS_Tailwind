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
              "rounded-full border px-3 py-1 text-sm font-medium transition",
              isOn
                ? "border-lime-300/40 bg-lime-300/10 text-lime-200 hover:bg-lime-300/15"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
