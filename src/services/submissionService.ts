import { supabase } from '../lib/supabase'
import type { QuizSubmissionInput } from '../types/quiz'

export const saveQuizSubmission = async (input: QuizSubmissionInput) => {
  const answersMap = input.answers.reduce<Record<string, number | string>>((acc, answer) => {
    if (answer.stepType === 'binary') {
      acc[answer.stepId] = answer.optionTitle
    } else {
      acc[answer.stepId] = answer.coins
    }
    return acc
  }, {})

  const payload = {
    quiz_template_id: input.quizTemplateId,
    quiz_slug: input.quizSlug,
    quiz_title: input.quizTitle,
    score_total: input.scoreTotal,
    result_from: input.resultFrom,
    result_description: input.resultDescription,
    answers_json: input.answers,
    answers_map: answersMap,
    utm_source: input.utm.utm_source ?? null,
    utm_medium: input.utm.utm_medium ?? null,
    utm_campaign: input.utm.utm_campaign ?? null,
    utm_term: input.utm.utm_term ?? null,
    utm_content: input.utm.utm_content ?? null,
    referer: input.referer || null,
    landing_url: input.landingUrl,
    user_agent: input.userAgent || null,
    raw_payload: {
      utm: input.utm,
      answers: input.answers,
      scoreTotal: input.scoreTotal,
      stepTypes: input.answers.map((a) => ({ stepId: a.stepId, stepType: a.stepType })),
    },
  }

  const { error } = await supabase.from('quiz_results').insert(payload)

  if (error) {
    throw new Error(`Unable to save quiz result: ${error.message}`)
  }
}
