export function randomInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive)
}

export function pickRandom<T>(items: readonly T[]) {
  if (items.length === 0) {
    throw new Error("Cannot pick from empty array")
  }
  return items[randomInt(items.length)]
}

export function shuffle<T>(items: readonly T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}
