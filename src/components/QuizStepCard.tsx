import { motion } from 'framer-motion'
import type { LegacySingleStep, QuizStepItem } from '../types/quiz'
import { pageTransition, pageVariants, softSpring } from '../utils/motion'

type QuizStepCardProps = {
  step: LegacySingleStep
  selectedIndex: number | null
  imageUrl: string | null
  onPick: (item: QuizStepItem, itemIndex: number) => void
}

export const QuizStepCard = ({
  step,
  selectedIndex,
  imageUrl,
  onPick,
}: QuizStepCardProps) => (
  <motion.section
    key={step.step_id}
    className={`quiz-card legacy-quiz-card ${imageUrl ? '' : 'quiz-card--no-media'}`}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    <div className="legacy-quiz-main">
      {imageUrl && (
        <div className="quiz-media">
          <img src={imageUrl} alt="" />
        </div>
      )}

      <div className="quiz-card-body">
        <h1>{step.step_name}</h1>

        <div className="quiz-options">
          {step.step_items.map((item, index) => (
            <motion.button
              key={`${step.step_id}-${item.title}`}
              type="button"
              className={`quiz-option ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => onPick(item, index)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              transition={softSpring}
              animate={
                selectedIndex === index
                  ? { scale: [1, 1.02, 1], borderColor: 'rgba(17, 100, 102, 0.65)' }
                  : {}
              }
              style={{ transition: 'border-color 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              {item.title}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </motion.section>
)
