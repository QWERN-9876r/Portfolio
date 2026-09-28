import type { Rgb } from './prism'

// Цвета, на которые призма расщепляет свет. Модуль без three: им красят и сцену, и карточки

const rgb = (r: number, g: number, b: number): Rgb => [r / 255, g / 255, b / 255]

export const SPECTRUM = {
    violet: rgb(139, 92, 246),
    blue: rgb(41, 121, 255),
    cyan: rgb(34, 211, 238),
} as const

// Тройка «r g b» для CSS-переменных вида rgb(var(--c-accent) / 0.4)
export const cssRgb = (color: Rgb) => color.map((channel) => Math.round(channel * 255)).join(' ')
