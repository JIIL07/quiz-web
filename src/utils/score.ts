import type { QuizAnswer, QuizResultRange } from '../types/quiz'

/** Likert `single_scale` and legacy `single` answers count toward the main score */
export const calculateScore = (answers: QuizAnswer[]) =>
  answers
    .filter((a) => a.stepType === 'single_scale' || a.stepType === 'single')
    .reduce((acc, item) => acc + item.coins, 0)

export const pickResultRange = (score: number, ranges: QuizResultRange[]) => {
  const sorted = [...ranges].sort((a, b) => a.from - b.from)
  if (!sorted.length) {
    return {
      from: 0,
      description: '',
      title: '',
      action: 'placeholder' as const,
    }
  }
  let result = sorted[0]

  for (const range of sorted) {
    if (score >= range.from) {
      result = range
    }
  }

  return result
}
