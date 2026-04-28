import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { CounterInfoPayload } from '../types/quiz'
import { easeOutGentle, pageTransition, pageVariants } from '../utils/motion'

type CounterInfoStepProps = {
  payload: CounterInfoPayload
  onContinue: () => void
}

export const CounterInfoStep = ({ payload, onContinue }: CounterInfoStepProps) => {
  const durationSec = (payload.duration_ms ?? 2200) / 1000
  const target = payload.count_target
  const [display, setDisplay] = useState(1)
  const [allowContinue, setAllowContinue] = useState(false)

  useEffect(() => {
    const controls = animate(1, target, {
      duration: durationSec * 1.12,
      ease: easeOutGentle,
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => {
        setDisplay(target)
        setAllowContinue(true)
      },
    })
    return () => controls.stop()
  }, [target, durationSec])

  const formatted = new Intl.NumberFormat('ru-RU').format(display)

  return (
    <motion.section
      className="scenario-screen scenario-counter"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <p className="scenario-counter-line">{payload.line_before}</p>
      <motion.p
        className="scenario-counter-number"
        key={formatted}
        initial={{ scale: 0.99, opacity: 0.92 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.95 }}
      >
        {formatted}
      </motion.p>
      <p className="scenario-counter-line">{payload.line_after}</p>

      {payload.illustration_src ? (
        <div className="scenario-counter-visual">
          <img src={payload.illustration_src} alt="" className="scenario-counter-illustration" />
        </div>
      ) : (
        <div className="scenario-counter-map" aria-hidden>
          <div className="scenario-counter-map-dots" />
        </div>
      )}

      <motion.button
        type="button"
        className="scenario-dark-btn scenario-dark-btn--brand"
        disabled={!allowContinue}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: allowContinue ? 1 : 0.4 }}
        transition={{ duration: 0.55, ease: easeOutGentle }}
        onClick={onContinue}
        whileHover={allowContinue ? { y: -1, scale: 1.01 } : undefined}
        whileTap={{ scale: 0.98 }}
      >
        Продолжить
      </motion.button>
    </motion.section>
  )
}
