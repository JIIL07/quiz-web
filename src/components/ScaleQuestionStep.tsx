import { motion } from 'framer-motion'
import type { SingleScaleStep } from '../types/quiz'
import { easeOutGentle, pageTransition, pageVariants } from '../utils/motion'

type ScaleQuestionStepProps = {
  step: SingleScaleStep
  selectedValue: number | null
  /** Клик по баллу: родитель сохраняет ответ и переводит дальше */
  onPick: (value: number) => void
}

const defaultMin = 1
const defaultMax = 5

const tapTransition = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.9 }

export const ScaleQuestionStep = ({
  step,
  selectedValue,
  onPick,
}: ScaleQuestionStepProps) => {
  const p = step.payload ?? {}
  const min = p.min_value ?? defaultMin
  const max = p.max_value ?? defaultMax
  const minLabel = p.min_label ?? 'Не согласен'
  const maxLabel = p.max_label ?? 'Полностью согласен'
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <motion.section
      className="scenario-screen scenario-likert"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <div className="scenario-likert-main">
        <motion.h1
          className="scenario-likert-question"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.58, ease: easeOutGentle }}
        >
          {step.step_name}
        </motion.h1>

        <div className="scenario-likert-scale">
          <div className="scenario-likert-circles">
            {values.map((v) => (
              <motion.button
                key={v}
                type="button"
                className={`scenario-likert-circle ${selectedValue === v ? 'selected' : ''}`}
                onClick={() => onPick(v)}
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.05 }}
                animate={
                  selectedValue === v
                    ? { scale: [1, 1.05, 1], boxShadow: '0 0 0 2px rgba(17, 100, 102, 0.35)' }
                    : { scale: 1, boxShadow: '0 0 0 0px rgba(17, 100, 102, 0)' }
                }
                transition={selectedValue === v ? { duration: 0.52, ease: easeOutGentle } : tapTransition}
                aria-label={`Оценка ${v}`}
              >
                {v}
              </motion.button>
            ))}
          </div>
          <div className="scenario-likert-labels">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
