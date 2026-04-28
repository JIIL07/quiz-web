import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BinaryQuestionStep } from '../components/BinaryQuestionStep'
import { CounterInfoStep } from '../components/CounterInfoStep'
import { LoadingClusterStep } from '../components/LoadingClusterStep'
import { LoadingProfileStep } from '../components/LoadingProfileStep'
import { QuizResultView } from '../components/QuizResultView'
import { QuizStepCard } from '../components/QuizStepCard'
import { QuizTopChrome } from '../components/QuizTopChrome'
import { ReviewStep } from '../components/ReviewStep'
import { ScaleQuestionStep } from '../components/ScaleQuestionStep'
import { getQuizTemplateBySlug, getRandomFeedbackReviews } from '../services/quizRepository'
import { saveQuizSubmission } from '../services/submissionService'
import {
  completeQuizStatsSession,
  createStatsSessionId,
  markQuizAbandoned,
  markQuizApplicationClick,
  startQuizStatsSession,
  trackQuizProgress,
} from '../services/quizStatsService'
import {
  type ReviewPayload,
  type QuizAnswer,
  type QuizResultRange,
  type QuizTemplateRow,
  type ScenarioStep,
  isBinary,
  isCounterInfo,
  isLegacySingle,
  isLoadingProfile,
  isReviewCard,
  isSingleScale,
} from '../types/quiz'
import {
  countLegacyQuestions,
  countStepsOfType,
  expandQuizFlow,
  getLoadingProfileTail,
  getPreviousStepIndexSkippingAnimations,
  isQuestionStep,
  legacyQuestionNumber,
  likertQuestionNumber,
} from '../utils/scenario'
import { pageTransition } from '../utils/motion'
import { calculateScore, pickResultRange } from '../utils/score'
import './quiz.css'

type Stage = 'loading' | 'start' | 'quiz' | 'result' | 'error'

const getUtm = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') ?? '',
    utm_medium: params.get('utm_medium') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    utm_term: params.get('utm_term') ?? '',
    utm_content: params.get('utm_content') ?? '',
  }
}

const ADVANCE_MS = 320

export const QuizPage = () => {
  const { title = '' } = useParams()
  const [quiz, setQuiz] = useState<QuizTemplateRow | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [resultRange, setResultRange] = useState<QuizResultRange | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackReviews, setFeedbackReviews] = useState<ReviewPayload[] | null>(null)
  const [statsSessionId, setStatsSessionId] = useState<string | null>(null)
  const answersRef = useRef<QuizAnswer[]>([])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    let cancelled = false

    getQuizTemplateBySlug(title)
      .then((template) => {
        if (cancelled) return
        setQuiz(template)
        setStage('start')
      })
      .catch(() => {
        if (cancelled) return
        setStage('error')
        setErrorMessage('Не удалось найти или загрузить квиз.')
      })

    return () => {
      cancelled = true
    }
  }, [title])

  useEffect(() => {
    let cancelled = false
    getRandomFeedbackReviews()
      .then((items) => {
        if (cancelled) return
        setFeedbackReviews(items.length > 0 ? items : null)
      })
      .catch(() => {
        if (cancelled) return
        setFeedbackReviews(null)
      })

    return () => {
      cancelled = true
    }
  }, [title])

  const content = useMemo(() => expandQuizFlow(quiz?.content ?? []), [quiz])
  const questionSteps = useMemo(() => content.filter(isQuestionStep), [content])
  const currentStep = content[stepIndex] ?? null
  const totalLikert = useMemo(() => countStepsOfType(content, 'single_scale'), [content])
  const likertNum = useMemo(
    () => (currentStep && isSingleScale(currentStep) ? likertQuestionNumber(content, stepIndex) : 0),
    [content, currentStep, stepIndex],
  )

  const legNum = useMemo(
    () => (currentStep && isLegacySingle(currentStep) ? legacyQuestionNumber(content, stepIndex) : 0),
    [content, currentStep, stepIndex],
  )
  const legTotal = useMemo(() => countLegacyQuestions(content), [content])

  const selectedScale = useMemo(() => {
    if (!currentStep || !isSingleScale(currentStep)) return null
    const existing = answers.find((a) => a.stepId === currentStep.step_id)
    return existing ? existing.coins : null
  }, [currentStep, answers])

  const selectedLegacyIndex = useMemo(() => {
    if (!currentStep || !isLegacySingle(currentStep)) return null
    const existing = answers.find((a) => a.stepId === currentStep.step_id)
    if (!existing) return null
    const idx = currentStep.step_items.findIndex((it) => it.title === existing.optionTitle)
    return idx >= 0 ? idx : null
  }, [currentStep, answers])

  const finishQuizWithAnswers = useCallback(
    async (ans: QuizAnswer[]) => {
      if (!quiz) return
      const score = calculateScore(ans)
      const result = pickResultRange(score, quiz.results)

      setIsSubmitting(true)
      try {
        await saveQuizSubmission({
          quizTemplateId: quiz.id,
          quizSlug: quiz.slug,
          quizTitle: quiz.title,
          scoreTotal: score,
          resultFrom: result.from,
          resultDescription: result.description,
          answers: ans,
          utm: getUtm(),
          landingUrl: window.location.href,
          referer: document.referrer,
          userAgent: navigator.userAgent,
        })
      } catch {
        // non-blocking
      } finally {
        setIsSubmitting(false)
      }

      if (statsSessionId) {
        const lastQuestion = questionSteps[questionSteps.length - 1]
        completeQuizStatsSession({
          sessionId: statsSessionId,
          scoreTotal: score,
          resultFrom: result.from,
          resultTitle: result.title ?? '',
          resultAction: result.action ?? '',
          answersCount: ans.length,
          lastStepIndex: Math.max(0, questionSteps.length - 1),
          lastStepId: lastQuestion?.step_id ?? null,
          lastStepType: lastQuestion?.step_type ?? null,
        }).catch(() => {
          // non-blocking analytics
        })
      }

      setResultRange(result)
      setStage('result')
    },
    [quiz, statsSessionId, questionSteps],
  )

  const goNext = useCallback(() => {
    setStepIndex((i) => {
      const last = content.length - 1
      if (i >= last) {
        queueMicrotask(() => {
          void finishQuizWithAnswers(answersRef.current)
        })
        return i
      }
      return i + 1
    })
  }, [content.length, finishQuizWithAnswers])

  const handleBack = useCallback(() => {
    if (stepIndex <= 0 || !quiz) return
    const prev = getPreviousStepIndexSkippingAnimations(content, stepIndex)
    const keepIds = new Set(content.slice(0, prev + 1).map((s) => s.step_id))
    setAnswers((prevAns) => prevAns.filter((a) => keepIds.has(a.stepId)))
    setStepIndex(prev)
  }, [quiz, stepIndex, content])

  const handleScalePick = useCallback(
    (value: number) => {
      const step = content[stepIndex]
      if (!step || !isSingleScale(step)) return
      setAnswers((prev) => {
        const next = [
          ...prev.filter((a) => a.stepId !== step.step_id),
          {
            stepId: step.step_id,
            stepType: 'single_scale' as const,
            optionTitle: String(value),
            coins: value,
          },
        ]
        answersRef.current = next
        return next
      })
      window.setTimeout(() => goNext(), ADVANCE_MS)
    },
    [content, stepIndex, goNext],
  )

  const handleLegacyPick = useCallback(
    (coins: number, optionTitle: string) => {
      const step = content[stepIndex]
      if (!step || !isLegacySingle(step)) return
      setAnswers((prev) => {
        const next = [
          ...prev.filter((a) => a.stepId !== step.step_id),
          {
            stepId: step.step_id,
            stepType: 'single' as ScenarioStep['step_type'],
            optionTitle,
            coins,
          },
        ]
        answersRef.current = next
        return next
      })
      window.setTimeout(() => goNext(), ADVANCE_MS)
    },
    [content, stepIndex, goNext],
  )

  const handleBinary = (yes: boolean) => {
    if (!currentStep || !isBinary(currentStep) || !quiz) return
    const nextAns = [
      ...answersRef.current.filter((a) => a.stepId !== currentStep.step_id),
      {
        stepId: currentStep.step_id,
        stepType: 'binary' as const,
        optionTitle: yes ? 'Да' : 'Нет',
        coins: yes ? 1 : 0,
      },
    ]
    answersRef.current = nextAns
    setAnswers(nextAns)
    const last = content.length - 1
    if (stepIndex >= last) {
      void finishQuizWithAnswers(nextAns)
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const handleStart = async () => {
    if (!quiz) return

    const sessionId = createStatsSessionId()
    try {
      await startQuizStatsSession({
        sessionId,
        quizTemplateId: quiz.id,
        quizSlug: quiz.slug,
        quizTitle: quiz.title,
        totalSteps: questionSteps.length,
        utm: getUtm(),
        landingUrl: window.location.href,
        referer: document.referrer,
        userAgent: navigator.userAgent,
      })
      setStatsSessionId(sessionId)
    } catch {
      console.warn('[quiz_stats] start failed')
    }

    setStage('quiz')
    setStepIndex(0)
    setAnswers([])
    answersRef.current = []
  }

  const handleRestart = () => {
    setAnswers([])
    answersRef.current = []
    setStepIndex(0)
    setResultRange(null)
    setStatsSessionId(null)
    setStage('start')
  }

  useEffect(() => {
    if (stage !== 'quiz' || !statsSessionId) return

    const questionAnswers = answers.filter((a) => a.stepType === 'single' || a.stepType === 'single_scale')
    const questionAnswersCount = questionAnswers.length
    const currentQuestionIndex = currentStep && isQuestionStep(currentStep)
      ? questionSteps.findIndex((s) => s.step_id === currentStep.step_id)
      : -1

    const trackedStepIndex =
      currentQuestionIndex >= 0 ? currentQuestionIndex : questionAnswersCount > 0 ? questionAnswersCount - 1 : null
    const trackedStepId =
      currentQuestionIndex >= 0
        ? currentStep?.step_id ?? null
        : questionAnswersCount > 0
          ? questionAnswers[questionAnswersCount - 1]?.stepId ?? null
          : null
    const trackedStepType =
      currentQuestionIndex >= 0
        ? currentStep?.step_type ?? null
        : questionAnswersCount > 0
          ? (questionAnswers[questionAnswersCount - 1]?.stepType ?? null)
          : null

    trackQuizProgress({
      sessionId: statsSessionId,
      stepIndex: trackedStepIndex ?? -1,
      stepId: trackedStepId,
      stepType: trackedStepType,
      answersCount: answers.length,
      scoreTotal: calculateScore(answers),
    }).catch(() => {
      console.warn('[quiz_stats] progress failed')
    })
  }, [stage, statsSessionId, currentStep, answers, questionSteps])

  useEffect(() => {
    if (!statsSessionId) return

    const flushAbandon = () => {
      if (stage !== 'quiz') return
      const scoreTotal = calculateScore(answersRef.current)
      const questionAnswers = answersRef.current.filter((a) => a.stepType === 'single' || a.stepType === 'single_scale')
      const questionAnswersCount = questionAnswers.length
      const currentQuestionIndex = currentStep && isQuestionStep(currentStep)
        ? questionSteps.findIndex((s) => s.step_id === currentStep.step_id)
        : -1
      const trackedStepIndex =
        currentQuestionIndex >= 0 ? currentQuestionIndex : questionAnswersCount > 0 ? questionAnswersCount - 1 : null
      const trackedStepId =
        currentQuestionIndex >= 0
          ? currentStep?.step_id ?? null
          : questionAnswersCount > 0
            ? questionAnswers[questionAnswersCount - 1]?.stepId ?? null
            : null
      const trackedStepType =
        currentQuestionIndex >= 0
          ? currentStep?.step_type ?? null
          : questionAnswersCount > 0
            ? (questionAnswers[questionAnswersCount - 1]?.stepType ?? null)
            : null
      trackQuizProgress({
        sessionId: statsSessionId,
        stepIndex: trackedStepIndex ?? -1,
        stepId: trackedStepId,
        stepType: trackedStepType,
        answersCount: answersRef.current.length,
        scoreTotal,
      })
        .then(() => markQuizAbandoned(statsSessionId))
        .catch(() => {
          console.warn('[quiz_stats] abandon flush failed')
        })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushAbandon()
    }

    window.addEventListener('pagehide', flushAbandon)
    window.addEventListener('beforeunload', flushAbandon)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('pagehide', flushAbandon)
      window.removeEventListener('beforeunload', flushAbandon)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [statsSessionId, stage, currentStep, questionSteps])

  const loadingComplete = useCallback(() => {
    setStepIndex((i) => {
      const last = content.length - 1
      if (i >= last) {
        queueMicrotask(() => {
          void finishQuizWithAnswers(answersRef.current)
        })
        return i
      }
      return i + 1
    })
  }, [content.length, finishQuizWithAnswers])

  const loadingTail = useMemo(
    () =>
      currentStep && isLoadingProfile(currentStep) ? getLoadingProfileTail(content, stepIndex) : null,
    [content, stepIndex, currentStep],
  )

  const effectiveLoadingReviews = useMemo(() => {
    if (!loadingTail) return []
    if (!feedbackReviews || feedbackReviews.length === 0) return loadingTail.reviews
    return feedbackReviews.map((r, idx) => ({
      step_id: `feedback-${idx + 1}`,
      step_type: 'review_card' as const,
      payload: r,
    }))
  }, [loadingTail, feedbackReviews])

  const recordClusterBinary = useCallback((stepId: string, yes: boolean) => {
    const nextAns = [
      ...answersRef.current.filter((a) => a.stepId !== stepId),
      {
        stepId,
        stepType: 'binary' as const,
        optionTitle: yes ? 'Да' : 'Нет',
        coins: yes ? 1 : 0,
      },
    ]
    answersRef.current = nextAns
    setAnswers(nextAns)
  }, [])

  const finishLoadingCluster = useCallback(() => {
    const skip = getLoadingProfileTail(content, stepIndex)?.skipCount ?? 0
    setStepIndex((i) => {
      const nextIdx = i + 1 + skip
      if (nextIdx >= content.length) {
        queueMicrotask(() => {
          void finishQuizWithAnswers(answersRef.current)
        })
        return i
      }
      return nextIdx
    })
  }, [content, stepIndex, finishQuizWithAnswers])

  const showQuestionChrome =
    stage === 'quiz' &&
    currentStep != null &&
    (isSingleScale(currentStep) || isLegacySingle(currentStep))

  const renderQuizStep = () => {
    if (!quiz || !currentStep) return null

    if (isSingleScale(currentStep)) {
      return (
        <ScaleQuestionStep
          key={currentStep.step_id}
          step={currentStep}
          selectedValue={selectedScale}
          onPick={handleScalePick}
        />
      )
    }

    if (isLegacySingle(currentStep)) {
      return (
        <QuizStepCard
          key={currentStep.step_id}
          step={currentStep}
          selectedIndex={selectedLegacyIndex}
          imageUrl={null}
          onPick={(item) => {
            handleLegacyPick(item.coins, item.title)
          }}
        />
      )
    }

    if (isCounterInfo(currentStep)) {
      return (
        <CounterInfoStep key={currentStep.step_id} payload={currentStep.payload} onContinue={goNext} />
      )
    }

    if (isLoadingProfile(currentStep)) {
      if (loadingTail) {
        return (
          <LoadingClusterStep
            key={currentStep.step_id}
            flowKey={`${currentStep.step_id}-${stepIndex}`}
            payload={currentStep.payload}
            binaries={loadingTail.binaries}
            reviews={effectiveLoadingReviews}
            onBinaryAnswer={recordClusterBinary}
            onComplete={finishLoadingCluster}
          />
        )
      }
      return (
        <LoadingProfileStep
          key={currentStep.step_id}
          payload={currentStep.payload}
          onComplete={loadingComplete}
        />
      )
    }

    if (isBinary(currentStep)) {
      return (
        <div key={currentStep.step_id} className="scenario-binary-wrap">
          <BinaryQuestionStep payload={currentStep.payload} onAnswer={handleBinary} />
        </div>
      )
    }

    if (isReviewCard(currentStep)) {
      return <ReviewStep key={currentStep.step_id} payload={currentStep.payload} onContinue={goNext} />
    }

    return (
      <div key="unknown" className="scenario-screen">
        <p>Неизвестный тип шага: {(currentStep as ScenarioStep).step_type}</p>
        <button type="button" className="scenario-primary-btn" onClick={goNext}>
          Пропустить
        </button>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="quiz-shell centered scenario-root scenario-on-green">
        <p className="quiz-loading-text">Загрузка квиза…</p>
      </div>
    )
  }

  if (stage === 'error' || !quiz) {
    return (
      <div className="quiz-shell centered scenario-root scenario-on-green">
        <div className="quiz-glass-panel quiz-glass-panel--narrow">
          <div className="error-box error-box--glass">
            <h2>Квиз недоступен</h2>
            <p>{errorMessage || 'Проверь slug и публикацию шаблона.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main
      className={`quiz-shell scenario-root scenario-on-green ${showQuestionChrome ? 'quiz-shell--with-chrome' : ''}`}
    >
      {showQuestionChrome && currentStep && (
        <QuizTopChrome
          questionNumber={isSingleScale(currentStep) ? likertNum : legNum}
          totalQuestions={Math.max(1, isSingleScale(currentStep) ? totalLikert : legTotal)}
          onBack={stepIndex > 0 ? handleBack : undefined}
        />
      )}
      <div className="quiz-glass-panel">
        <div className="quiz-glass-panel-inner">
          <AnimatePresence mode="wait">
            {stage === 'start' && (
              <motion.section
                key="start"
                className="quiz-intro-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={pageTransition}
              >
                <div className="quiz-badge">AI психологический квиз</div>
                <h1 className="quiz-intro-title">{quiz.title}</h1>
                {quiz.description && <p className="quiz-intro-description">{quiz.description}</p>}
                <motion.button type="button" className="quiz-next" onClick={handleStart} whileTap={{ scale: 0.98 }}>
                  Начать
                </motion.button>
              </motion.section>
            )}

            {stage === 'quiz' && renderQuizStep()}

            {stage === 'result' && resultRange && (
              <QuizResultView
                key="result"
                title={resultRange.title ?? ''}
                description={resultRange.description}
                score={calculateScore(answers)}
                from={resultRange.from}
                action={resultRange.action}
                actionLabel={resultRange.action_label}
                actionUrl={resultRange.action_url}
                onApplicationClick={() => {
                  if (!statsSessionId) return
                  markQuizApplicationClick(statsSessionId).catch(() => {
                    // non-blocking analytics
                  })
                }}
                onRestart={handleRestart}
              />
            )}
          </AnimatePresence>
        </div>

        {isSubmitting && <p className="quiz-saving quiz-saving--on-glass">Сохраняем результат…</p>}
      </div>
    </main>
  )
}
