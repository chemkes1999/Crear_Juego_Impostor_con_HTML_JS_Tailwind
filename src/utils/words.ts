import type { WordCategory, WordDifficulty, WordEntry } from "@/data/words"
import { WORDS } from "@/data/words"
import { pickRandom } from "@/utils/random"

export function getRandomWord(params: { categories: WordCategory[]; difficulty: WordDifficulty }) {
  const { categories, difficulty } = params
  const allowedCategories = categories.length > 0 ? new Set(categories) : null

  const pool = WORDS.filter((w) => {
    const difficultyOk = difficulty === "extended" ? true : w.difficulty === "basic"
    if (!difficultyOk) return false
    if (!allowedCategories) return true
    return w.categories.some((c) => allowedCategories.has(c))
  })

  return pickRandom(pool) satisfies WordEntry
}
