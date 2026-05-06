import { motion } from 'framer-motion'
import { pageTransition } from '../utils/motion'

export type Gender = 'female' | 'male'

interface GenderSelectStepProps {
  onSelect: (gender: Gender) => void
}

export const GenderSelectStep = ({ onSelect }: GenderSelectStepProps) => {
  return (
    <motion.section
      key="gender"
      className="gender-step"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={pageTransition}
    >
      <h1 className="gender-step-title">Ваш пол</h1>
      <div className="gender-step-cards">
        <motion.button
          type="button"
          className="gender-card"
          onClick={() => onSelect('female')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="gender-card-img-wrap">
            <img src="/card/female.jpeg" alt="Женский" />
          </div>
          <span className="gender-card-label">Женский</span>
        </motion.button>

        <motion.button
          type="button"
          className="gender-card"
          onClick={() => onSelect('male')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="gender-card-img-wrap">
            <img src="/card/male.jpeg" alt="Мужской" />
          </div>
          <span className="gender-card-label">Мужской</span>
        </motion.button>
      </div>
    </motion.section>
  )
}
