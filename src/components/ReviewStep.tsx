import { motion } from 'framer-motion'
import type { ReviewPayload } from '../types/quiz'
import { pageTransition, pageVariants, softSpring } from '../utils/motion'

type ReviewStepProps = {
  payload: ReviewPayload
  onContinue: () => void
}

export const ReviewStep = ({ payload, onContinue }: ReviewStepProps) => (
  <motion.section
    className="scenario-screen scenario-review"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    <div className="scenario-review-card">
      <div className="scenario-review-stars" aria-label="Рейтинг 5 из 5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="star on">
            ★
          </span>
        ))}
      </div>
      <div className="scenario-review-meta">
        <span className="scenario-review-name">{payload.name}</span>
        <span className="scenario-review-time">{payload.time_ago}</span>
      </div>
      <p className="scenario-review-text">{payload.text}</p>
    </div>
    <motion.button
      type="button"
      className="scenario-primary-btn"
      onClick={onContinue}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={softSpring}
    >
      Далее
    </motion.button>
  </motion.section>
)
