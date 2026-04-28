import { motion } from 'framer-motion'
import { easeOutGentle } from '../utils/motion'

type QuizTopChromeProps = {
  questionNumber: number
  totalQuestions: number
  onBack?: () => void
}

export const QuizTopChrome = ({ questionNumber, totalQuestions, onBack }: QuizTopChromeProps) => (
  <header className="quiz-fixed-chrome" aria-hidden={false}>
    <div className="quiz-fixed-chrome-inner">
      {onBack ? (
        <button type="button" className="scenario-back scenario-back--chevron" onClick={onBack} aria-label="Назад">
          ‹
        </button>
      ) : (
        <span className="scenario-back-spacer scenario-back-spacer--chevron" />
      )}
      <div className="scenario-likert-progress">
        <motion.div
          className="scenario-likert-progress-fill"
          initial={false}
          animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          transition={{ duration: 1.65, ease: easeOutGentle }}
        />
      </div>
      <span className="scenario-likert-count">
        {questionNumber} из {totalQuestions}
      </span>
    </div>
  </header>
)
