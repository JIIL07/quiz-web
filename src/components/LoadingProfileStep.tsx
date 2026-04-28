import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { LoadingProfilePayload } from '../types/quiz'
import { pageTransition, pageVariants } from '../utils/motion'

type LoadingProfileStepProps = {
  payload: LoadingProfilePayload
  onComplete: () => void
}

export const LoadingProfileStep = ({ payload, onComplete }: LoadingProfileStepProps) => {
  const { stages, total_duration_ms: totalDurationMs = 400 } = payload
  const [fills, setFills] = useState<number[]>(() => stages.map(() => 0))
  const [finished, setFinished] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const next = stages.map(() => 0)
      setFills(next)

      for (let i = 0; i < stages.length; i++) {
        const target = stages[i].fill_to ?? (i === 0 ? 100 : 0)
        const steps = 56
        for (let s = 0; s <= steps; s++) {
          if (cancelled) return
          const t = s / steps
          const eased = 1 - (1 - t) ** 3
          next[i] = target * eased
          setFills([...next])
          await new Promise((r) => setTimeout(r, 32))
        }
        next[i] = target
        setFills([...next])
        await new Promise((r) => setTimeout(r, 480))
      }
      if (!cancelled) {
        setFinished(true)
        await new Promise((r) => setTimeout(r, totalDurationMs))
        if (!cancelled) onCompleteRef.current()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [stages, totalDurationMs])

  return (
    <motion.section
      className="scenario-screen scenario-loading"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <h1 className="scenario-loading-title">{payload.title}</h1>
      <div className="scenario-loading-stages">
        {stages.map((stage, i) => (
          <div key={`${stage.label}-${i}`} className="scenario-loading-row">
            <div className="scenario-loading-label-row">
              <span>{stage.label}</span>
              {fills[i] >= 99 && (
                <span className="scenario-loading-pct">{Math.round(fills[i])}%</span>
              )}
            </div>
            <div className="scenario-loading-bar">
              <div className="scenario-loading-bar-fill" style={{ width: `${fills[i]}%` }} />
            </div>
          </div>
        ))}
      </div>
      {!finished && <p className="scenario-loading-hint">Подождите несколько секунд…</p>}
    </motion.section>
  )
}
