import { Spring } from 'svelte/motion'

// Svelte считает пружину в кадрах (1/60 с): stiffness = (k/m) / 3600, damping = (c/m) / 60.
// Так сохраняется физика пружин framer-motion, заданных как { stiffness, damping, mass }
export const physicalSpring = ({ stiffness, damping, mass = 1 }: { stiffness: number; damping: number; mass?: number }) => ({
    stiffness: stiffness / mass / 3600,
    damping: damping / mass / 60,
})

export const createSpring = (options: Parameters<typeof physicalSpring>[0]) =>
    new Spring(0, physicalSpring(options))
