/** Legacy 4-option step from older templates */
export type QuizStepItem = {
  coins: number
  title: string
}

export type LegacySingleStep = {
  step_id: string
  step_name: string
  step_type: 'single'
  step_items: QuizStepItem[]
}

export type SingleScalePayload = {
  min_value?: number
  max_value?: number
  min_label?: string
  max_label?: string
}

export type SingleScaleStep = {
  step_id: string
  step_name: string
  step_type: 'single_scale'
  payload?: SingleScalePayload
}

export type CounterInfoPayload = {
  line_before: string
  count_target: number
  line_after: string
  duration_ms?: number
  /** Картинка под счётчиком (например карта), путь из public */
  illustration_src?: string
}

export type CounterInfoStep = {
  step_id: string
  step_type: 'counter_info'
  payload: CounterInfoPayload
}

export type LoadingStagePayload = {
  label: string
  /** Target fill percent 0–100 for this stage */
  fill_to?: number
}

export type LoadingProfilePayload = {
  title: string
  stages: LoadingStagePayload[]
  /** Total auto-advance ms after stages animate */
  total_duration_ms?: number
}

export type LoadingProfileStep = {
  step_id: string
  step_type: 'loading_profile'
  payload: LoadingProfilePayload
}

export type BinaryPayload = {
  subtitle?: string
  question: string
}

export type BinaryStep = {
  step_id: string
  step_type: 'binary'
  payload: BinaryPayload
}

export type ReviewPayload = {
  name: string
  time_ago: string
  text: string
  rating: number
}

export type ReviewCardStep = {
  step_id: string
  step_type: 'review_card'
  payload: ReviewPayload
}

export type ScenarioStep =
  | LegacySingleStep
  | SingleScaleStep
  | CounterInfoStep
  | LoadingProfileStep
  | BinaryStep
  | ReviewCardStep

export type QuizResultRange = {
  from: number
  description: string
  title?: string
  action?: 'placeholder' | 'application'
  action_label?: string
  action_url?: string
}

export type QuizTemplateRow = {
  id: number
  slug: string
  title: string
  description: string | null
  content: ScenarioStep[]
  results: QuizResultRange[]
}

export type QuizAnswer = {
  stepId: string
  stepType: ScenarioStep['step_type']
  /** Human-readable answer */
  optionTitle: string
  /** For scoring: single_scale uses 1–5; binary uses 0/1; others 0 */
  coins: number
}

export type QuizSubmissionInput = {
  quizTemplateId: number
  quizSlug: string
  quizTitle: string
  scoreTotal: number
  resultFrom: number
  resultDescription: string
  answers: QuizAnswer[]
  utm: Record<string, string>
  landingUrl: string
  referer: string
  userAgent: string
}

export const isLegacySingle = (step: ScenarioStep): step is LegacySingleStep =>
  step.step_type === 'single'

export const isSingleScale = (step: ScenarioStep): step is SingleScaleStep =>
  step.step_type === 'single_scale'

export const isCounterInfo = (step: ScenarioStep): step is CounterInfoStep =>
  step.step_type === 'counter_info'

export const isLoadingProfile = (step: ScenarioStep): step is LoadingProfileStep =>
  step.step_type === 'loading_profile'

export const isBinary = (step: ScenarioStep): step is BinaryStep => step.step_type === 'binary'

export const isReviewCard = (step: ScenarioStep): step is ReviewCardStep =>
  step.step_type === 'review_card'
