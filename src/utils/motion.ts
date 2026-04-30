/** Плавное замедление в конце */
export const easeOut = [0.22, 1, 0.36, 1] as const

/** Ещё мягче для смены экранов */
export const easeOutGentle = [0.33, 1, 0.68, 1] as const

export const pageTransition = {
  duration: 0.44,
  ease: easeOutGentle,
}

export const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const softSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 32,
  mass: 0.95,
}
