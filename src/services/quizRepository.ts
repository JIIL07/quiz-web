import { supabase } from '../lib/supabase'
import type { QuizTemplateRow, ReviewPayload } from '../types/quiz'

const asQuizTemplate = (raw: Record<string, unknown>): QuizTemplateRow => ({
  id: Number(raw.id ?? 0),
  slug: String(raw.slug ?? ''),
  title: String(raw.title ?? ''),
  description: raw.description == null ? null : String(raw.description),
  content: (raw.content ?? []) as QuizTemplateRow['content'],
  results: (raw.results ?? []) as QuizTemplateRow['results'],
})

export const getQuizTemplateBySlug = async (slug: string): Promise<QuizTemplateRow> => {
  // select('*') чтобы не падать на несовпадении колонок между проектами
  const { data, error } = await supabase
    .from('quiz_template')
    .select('*')
    .eq('slug', slug)
    .limit(5)

  if (error || !data || data.length === 0) {
    throw new Error('Quiz template not found')
  }

  const preferred =
    (data as Record<string, unknown>[]).find(
      (row) => row.published === undefined || row.published === true,
    ) ?? (data[0] as Record<string, unknown>)

  return asQuizTemplate(preferred)
}

const toFeedbackReview = (raw: Record<string, unknown>): ReviewPayload | null => {
  const name = (raw.name ?? raw.author_name ?? raw.user_name ?? '').toString().trim()
  const text = (raw.text ?? raw.comment ?? raw.message ?? raw.feedback_text ?? '').toString().trim()
  const timeAgo = (raw.time_ago ?? raw.created_ago ?? raw.created_label ?? '').toString().trim()
  const ratingRaw = raw.rating ?? raw.stars ?? raw.score
  const ratingNum = Number(ratingRaw)
  const rating = Number.isFinite(ratingNum) ? Math.min(5, Math.max(1, Math.round(ratingNum))) : 5

  if (!name || !text) return null

  return {
    name,
    text,
    rating,
    time_ago: timeAgo || 'Недавно',
  }
}

const pickRandom = <T>(items: T[], count: number): T[] => {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export const getRandomFeedbackReviews = async (): Promise<ReviewPayload[]> => {
  // По умолчанию не трогаем feedback, чтобы не было 404 на инстансах без таблицы.
  if (import.meta.env.VITE_ENABLE_FEEDBACK_TABLE !== 'true') return []

  const { data, error } = await supabase.from('feedback').select('*').limit(30)
  if (error || !data) throw new Error('Feedback unavailable')

  const mapped = (data as Record<string, unknown>[]).map(toFeedbackReview).filter((v): v is ReviewPayload => v != null)
  if (mapped.length < 2) return []

  const count = Math.min(mapped.length, Math.floor(Math.random() * 2) + 2) // 2..3
  return pickRandom(mapped, count)
}
