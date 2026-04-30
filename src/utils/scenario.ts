import {
  type BinaryStep,
  type CounterInfoStep,
  type ReviewCardStep,
  type ScenarioStep,
  isCounterInfo,
  isLoadingProfile,
} from '../types/quiz'

export const isQuestionStep = (s: ScenarioStep): boolean =>
  s.step_type === 'single_scale' || s.step_type === 'single'

/** Вставляется приложением после 3-го вопроса (не из БД) */
export const INJECT_HELPED_CLIENTS: CounterInfoStep = {
  step_id: '__inject_helped_clients',
  step_type: 'counter_info',
  payload: {
    line_before: 'Мы уже помогли',
    count_target: 4999,
    line_after: 'людям с похожими переживаниями',
    duration_ms: 2200,
    illustration_src: '/card/world.png',
  },
}

/** Вставляется приложением после 7-го вопроса (не из БД)  */
export const INJECT_MID_JOURNEY: CounterInfoStep = {
  step_id: '__inject_mid_journey',
  step_type: 'counter_info',
  payload: {
    line_before: 'Создано психологами сообщества Хранители',
    line_after:
      'Все психологи имеют высшее психологическое образование, постоянную личную терапию, посещают супервизии',
    duration_ms: 2000,
    illustration_src: '/card/banner.png',
  },
}

/**
 * Убирает counter_info из БД, режет «хвост» (loading / binary / review),
 * вставляет две встроенные анимации после 3-го и 7-го вопроса.
 */
export function expandQuizFlow(raw: ScenarioStep[]): ScenarioStep[] {
  const stripped = raw.filter((s) => s.step_type !== 'counter_info')
  const firstTailIdx = stripped.findIndex(
    (s) =>
      s.step_type === 'loading_profile' ||
      s.step_type === 'binary' ||
      s.step_type === 'review_card',
  )

  let questions: ScenarioStep[]
  let tail: ScenarioStep[]

  if (firstTailIdx === -1) {
    questions = stripped.filter(isQuestionStep)
    tail = stripped.filter((s) => !isQuestionStep(s))
  } else {
    questions = stripped.slice(0, firstTailIdx).filter(isQuestionStep)
    tail = stripped.slice(firstTailIdx)
  }

  const out: ScenarioStep[] = []
  questions.forEach((q, idx) => {
    out.push(q)
    const n = idx + 1
    if (n === 3) out.push(INJECT_HELPED_CLIENTS)
    if (n === 7) out.push(INJECT_MID_JOURNEY)
  })
  out.push(...tail)
  return out
}

export const countStepsOfType = (
  content: ScenarioStep[],
  stepType: ScenarioStep['step_type'],
) => content.filter((s) => s.step_type === stepType).length

/** 1-based номер текущего single_scale среди всех single_scale в потоке */
export const likertQuestionNumber = (content: ScenarioStep[], stepIndex: number): number => {
  let n = 0
  for (let i = 0; i < stepIndex; i++) {
    if (content[i]?.step_type === 'single_scale') n++
  }
  return n + 1
}

/** 1-based номер legacy-вопроса и всего legacy в потоке */
export const legacyQuestionNumber = (content: ScenarioStep[], stepIndex: number): number => {
  let n = 0
  for (let i = 0; i < stepIndex; i++) {
    if (content[i]?.step_type === 'single') n++
  }
  return n + 1
}

export const countLegacyQuestions = (content: ScenarioStep[]) =>
  content.filter((s) => s.step_type === 'single').length

/**
 * Подряд идущие binary + review_card сразу после loading_profile (для одного экрана загрузки).
 */
export function getLoadingProfileTail(
  content: ScenarioStep[],
  loadingIndex: number,
): { binaries: BinaryStep[]; reviews: ReviewCardStep[]; skipCount: number } | null {
  const step = content[loadingIndex]
  if (!step || step.step_type !== 'loading_profile') return null
  const tail = content.slice(loadingIndex + 1)
  const binaries: BinaryStep[] = []
  const reviews: ReviewCardStep[] = []
  let i = 0
  while (i < tail.length && tail[i].step_type === 'binary') {
    binaries.push(tail[i] as BinaryStep)
    i++
  }
  while (i < tail.length && tail[i].step_type === 'review_card') {
    reviews.push(tail[i] as ReviewCardStep)
    i++
  }
  if (i === 0) return null
  return { binaries, reviews, skipCount: i }
}

/** Назад с вопроса: не останавливаемся на counter_info и loading_profile */
export function getPreviousStepIndexSkippingAnimations(content: ScenarioStep[], stepIndex: number): number {
  let prev = stepIndex - 1
  while (prev > 0 && (isCounterInfo(content[prev]) || isLoadingProfile(content[prev]))) {
    prev -= 1
  }
  return prev
}
