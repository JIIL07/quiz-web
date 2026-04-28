import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { pageTransition, pageVariants, softSpring } from '../utils/motion'

type QuizResultViewProps = {
  title: string
  description: string
  score: number
  from: number
  action?: 'placeholder' | 'application'
  actionLabel?: string
  actionUrl?: string
  onApplicationClick?: () => void
  onRestart: () => void
}

export const QuizResultView = ({
  title,
  description,
  action = 'placeholder',
  actionLabel,
  actionUrl,
  onApplicationClick,
  onRestart,
}: QuizResultViewProps) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)

  const applicationUrl = useMemo(() => {
    if (!actionUrl) return ''
    const separator = actionUrl.includes('?') ? '&' : '?'
    return `${actionUrl}${separator}utm_campaign=quiz`
  }, [actionUrl])

  return (
    <>
      <motion.section
        className="quiz-result-block"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <div className="quiz-badge">Результат</div>
        <h1 className="quiz-result-title">{title}</h1>
        <p className="result-description">{description}</p>
        <div className="quiz-result-actions">
          {action === 'application' && actionLabel && applicationUrl && (
            <motion.button
              type="button"
              className="quiz-next quiz-result-primary-action"
              whileTap={{ scale: 0.98 }}
              transition={softSpring}
              onClick={() => {
                onApplicationClick?.()
                setIsApplicationOpen(true)
              }}
            >
              {actionLabel}
            </motion.button>
          )}
          <motion.button type="button" className="quiz-next" onClick={onRestart} whileTap={{ scale: 0.98 }} transition={softSpring}>
            Пройти заново
          </motion.button>
        </div>
      </motion.section>

      {isApplicationOpen && (
        <div className="quiz-application-modal" role="dialog" aria-modal="true" aria-label="Анкета записи к психологу">
          <button type="button" className="quiz-application-modal-backdrop" aria-label="Закрыть" onClick={() => setIsApplicationOpen(false)} />
          <div className="quiz-application-modal-content">
            <button type="button" className="quiz-application-close" aria-label="Закрыть" onClick={() => setIsApplicationOpen(false)}>
              ×
            </button>
            <iframe
              title="Анкета записи к психологу"
              src={applicationUrl}
              frameBorder={0}
              className="quiz-application-iframe"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  )
}
