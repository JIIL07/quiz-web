import { motion } from 'framer-motion'
import type { BinaryPayload } from '../types/quiz'
import { easeOutGentle, softSpring } from '../utils/motion'

type BinaryQuestionStepProps = {
  payload: BinaryPayload
  onAnswer: (yes: boolean) => void
  /** Например модалка поверх экрана загрузки */
  overlayClassName?: string
}

export const BinaryQuestionStep = ({ payload, onAnswer, overlayClassName }: BinaryQuestionStepProps) => (
  <motion.div
    className={overlayClassName ?? 'scenario-binary-overlay'}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.52, ease: easeOutGentle }}
  >
    <motion.div
      className="scenario-binary-card"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.58, ease: easeOutGentle }}
    >
      {payload.subtitle && <p className="scenario-binary-subtitle">{payload.subtitle}</p>}
      <p className="scenario-binary-question">{payload.question}</p>
      <div className="scenario-binary-actions">
        <motion.button
          type="button"
          className="scenario-binary-btn"
          onClick={() => onAnswer(false)}
          whileTap={{ scale: 0.98 }}
          transition={softSpring}
        >
          Нет
        </motion.button>
        <motion.button
          type="button"
          className="scenario-binary-btn primary"
          onClick={() => onAnswer(true)}
          whileTap={{ scale: 0.98 }}
          transition={softSpring}
        >
          Да
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
)
