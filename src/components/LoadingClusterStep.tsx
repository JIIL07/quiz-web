import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { BinaryStep, LoadingProfilePayload, ReviewCardStep } from '../types/quiz'
import { pageTransition, pageVariants, softSpring } from '../utils/motion'
import { BinaryQuestionStep } from './BinaryQuestionStep'

type LoadingClusterStepProps = {
  flowKey: string
  payload: LoadingProfilePayload
  binaries: BinaryStep[]
  reviews: ReviewCardStep[]
  onBinaryAnswer: (stepId: string, yes: boolean) => void
  onComplete: () => void
}

export const LoadingClusterStep = ({
  flowKey,
  payload,
  binaries,
  reviews,
  onBinaryAnswer,
  onComplete,
}: LoadingClusterStepProps) => {
  const { stages, title } = payload
  const [fills, setFills] = useState<number[]>(() => stages.map(() => 0))
  const [binaryModalIndex, setBinaryModalIndex] = useState<number | null>(null)
  const [finishedBars, setFinishedBars] = useState(false)

  const binaryWaitRef = useRef<((v: boolean) => void) | null>(null)
  const cancelledRef = useRef(false)
  const onBinaryAnswerRef = useRef(onBinaryAnswer)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onBinaryAnswerRef.current = onBinaryAnswer
  }, [onBinaryAnswer])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    cancelledRef.current = false
    const targets = stages.map((s) => s.fill_to ?? 100)
    const bin = binaries
    const rev = reviews
    const questionsCount = Math.min(bin.length, stages.length)
    const triggerBars = Array.from({ length: questionsCount }, (_, i) => {
      if (questionsCount === 1) return Math.floor((stages.length - 1) / 2)
      return Math.round((i * (stages.length - 1)) / (questionsCount - 1))
    })

    const waitBinary = () =>
      new Promise<boolean>((resolve) => {
        binaryWaitRef.current = resolve
      })

    const run = async () => {
      const next = stages.map(() => 0)
      setFills([...next])

      const animateBar = async (idx: number) => {
        const target = Math.max(100, targets[idx] ?? 100)
        const steps = 72
        for (let s = 0; s <= steps; s++) {
          if (cancelledRef.current) return
          const t = s / steps
          const eased = 1 - (1 - t) ** 3
          next[idx] = target * eased
          setFills([...next])
          await new Promise((r) => setTimeout(r, 28))
        }
        next[idx] = target
        setFills([...next])
        await new Promise((r) => setTimeout(r, 260))
      }

      for (let b = 0; b < stages.length; b++) {
        if (cancelledRef.current) return
        await animateBar(b)
        const qIdx = triggerBars.indexOf(b)
        if (qIdx !== -1 && qIdx < bin.length) {
          setBinaryModalIndex(qIdx)
          const yes = await waitBinary()
          if (cancelledRef.current) return
          onBinaryAnswerRef.current(bin[qIdx].step_id, yes)
          setBinaryModalIndex(null)
        }
      }

      if (cancelledRef.current) return
      setFinishedBars(true)
      setFills(stages.map(() => 100))

      if (rev.length === 0) {
        const totalDelay = payload.total_duration_ms ?? 900
        await new Promise((r) => setTimeout(r, totalDelay))
        if (cancelledRef.current) return
        onCompleteRef.current()
      }
    }

    void run()

    return () => {
      cancelledRef.current = true
      binaryWaitRef.current = null
    }
  }, [flowKey]) // eslint-disable-line react-hooks/exhaustive-deps -- один прогон на шаг (flowKey)

  const handleBinary = (yes: boolean) => {
    binaryWaitRef.current?.(yes)
    binaryWaitRef.current = null
  }

  const activeBinary = binaryModalIndex !== null ? binaries[binaryModalIndex] : null

  return (
    <motion.section
      className="scenario-screen scenario-loading scenario-loading-cluster"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <div
        className={`scenario-loading-cluster-bg ${binaryModalIndex !== null ? 'scenario-loading-cluster-bg--blurred' : ''}`}
      >
        <h1 className="scenario-loading-title">{title}</h1>
        <div className="scenario-loading-stages">
          {stages.map((stage, i) => (
            <div key={`${stage.label}-${i}`} className="scenario-loading-row">
              <div className="scenario-loading-label-row">
                <span>{stage.label}</span>
                <span className="scenario-loading-pct">{Math.round(fills[i])}%</span>
              </div>
              <div className="scenario-loading-bar">
                <div className="scenario-loading-bar-fill" style={{ width: `${fills[i]}%` }} />
              </div>
            </div>
          ))}
        </div>
        {finishedBars && reviews.length === 0 && (
          <p className="scenario-loading-hint">Завершаем…</p>
        )}

        {reviews.length > 0 && (
          <div className="scenario-loading-reviews">
            {reviews.map((r) => (
              <div key={r.step_id} className="scenario-review-card">
                <div className="scenario-review-stars" aria-label={`Рейтинг ${r.payload.rating} из 5`}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <span key={k} className={k < r.payload.rating ? 'star on' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
                <div className="scenario-review-meta">
                  <span className="scenario-review-name">{r.payload.name}</span>
                  <span className="scenario-review-time">{r.payload.time_ago}</span>
                </div>
                <p className="scenario-review-text">{r.payload.text}</p>
              </div>
            ))}
            <motion.button
              type="button"
              className="scenario-primary-btn scenario-primary-btn--cluster"
              onClick={() => onComplete()}
              disabled={!finishedBars}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={softSpring}
            >
              Далее
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeBinary && (
          <BinaryQuestionStep
            key={activeBinary.step_id}
            payload={activeBinary.payload}
            onAnswer={handleBinary}
            overlayClassName="scenario-binary-overlay scenario-binary-overlay--cluster"
          />
        )}
      </AnimatePresence>
    </motion.section>
  )
}
