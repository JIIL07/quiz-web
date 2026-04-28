import { supabase } from '../lib/supabase'

type BaseStatsPayload = {
  sessionId: string
  quizTemplateId: number
  quizSlug: string
  quizTitle: string
  totalSteps: number
  landingUrl: string
  referer: string
  userAgent: string
  utm: Record<string, string>
}

type ProgressPayload = {
  sessionId: string
  stepIndex: number
  stepId: string | null
  stepType: string | null
  answersCount: number
  scoreTotal: number
}

type CompletePayload = {
  sessionId: string
  scoreTotal: number
  resultFrom: number
  resultTitle: string
  resultAction: string
  lastStepIndex: number
  lastStepId: string | null
  lastStepType: string | null
  answersCount: number
}

const table = () => supabase.from('quiz_stats')

export const createStatsSessionId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export const startQuizStatsSession = async (input: BaseStatsPayload) => {
  const payload = {
    session_id: input.sessionId,
    status: 'started',
    quiz_template_id: input.quizTemplateId,
    quiz_slug: input.quizSlug,
    quiz_title: input.quizTitle,
    total_steps: input.totalSteps,
    started_at: new Date().toISOString(),
    last_event_at: new Date().toISOString(),
    landing_url: input.landingUrl || null,
    referer: input.referer || null,
    user_agent: input.userAgent || null,
    utm_source: input.utm.utm_source ?? null,
    utm_medium: input.utm.utm_medium ?? null,
    utm_campaign: input.utm.utm_campaign ?? null,
    utm_term: input.utm.utm_term ?? null,
    utm_content: input.utm.utm_content ?? null,
  }
  const { error } = await table().upsert(payload, { onConflict: 'session_id' })
  if (error) throw new Error(`Unable to start quiz stats session: ${error.message}`)
}

export const trackQuizProgress = async (input: ProgressPayload) => {
  const payload = {
    status: 'in_progress',
    last_event_at: new Date().toISOString(),
    last_step_index: input.stepIndex,
    last_step_id: input.stepId,
    last_step_type: input.stepType,
    answers_count: input.answersCount,
    score_total: input.scoreTotal,
  }
  const { error } = await table().update(payload).eq('session_id', input.sessionId)
  if (error) throw new Error(`Unable to track quiz progress: ${error.message}`)
}

export const completeQuizStatsSession = async (input: CompletePayload) => {
  const payload = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    last_event_at: new Date().toISOString(),
    score_total: input.scoreTotal,
    result_from: input.resultFrom,
    result_title: input.resultTitle || null,
    result_action: input.resultAction || null,
    answers_count: input.answersCount,
    last_step_index: input.lastStepIndex,
    last_step_id: input.lastStepId,
    last_step_type: input.lastStepType,
  }
  const { error } = await table().update(payload).eq('session_id', input.sessionId)
  if (error) throw new Error(`Unable to complete quiz stats session: ${error.message}`)
}

export const markQuizApplicationClick = async (sessionId: string) => {
  const payload = {
    application_clicked: true,
    application_clicked_at: new Date().toISOString(),
    last_event_at: new Date().toISOString(),
  }
  const { error } = await table().update(payload).eq('session_id', sessionId)
  if (error) throw new Error(`Unable to track application click: ${error.message}`)
}

export const markQuizAbandoned = async (sessionId: string) => {
  const payload = {
    status: 'abandoned',
    last_event_at: new Date().toISOString(),
  }
  const { error } = await table().update(payload).eq('session_id', sessionId)
  if (error) throw new Error(`Unable to track quiz abandon: ${error.message}`)
}

