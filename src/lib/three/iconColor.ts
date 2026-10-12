import type { Rgb } from './prism'

// Фирменный цвет технологии берётся прямо из её иконки: без ручной карты цветов.
// Иконки same-origin (/icons и копии из бакета в /storage), canvas не «загрязняется»
const SIZE = 32
const MIN_SATURATION = 0.35
const MIN_VALUE = 0.3
// Меньше такой доли насыщенных пикселей — иконка монохромная (Next.js, Rive)
const MIN_SHARE = 0.05

const cache = new Map<string, Rgb | null>()
let canvas: HTMLCanvasElement | null = null

export const iconColor = (img: HTMLImageElement | null): Rgb | null => {
    if (!img?.complete || img.naturalWidth === 0) return null
    const src = img.currentSrc || img.src
    if (cache.has(src)) return cache.get(src) ?? null

    canvas ??= document.createElement('canvas')
    canvas.width = canvas.height = SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null

    let color: Rgb | null = null
    try {
        context.clearRect(0, 0, SIZE, SIZE)
        context.drawImage(img, 0, 0, SIZE, SIZE)
        const { data } = context.getImageData(0, 0, SIZE, SIZE)

        // Среднее по насыщенным пикселям с весом по насыщенности
        let r = 0
        let g = 0
        let b = 0
        let weight = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue
            const pr = data[i] / 255
            const pg = data[i + 1] / 255
            const pb = data[i + 2] / 255
            const max = Math.max(pr, pg, pb)
            const saturation = max === 0 ? 0 : (max - Math.min(pr, pg, pb)) / max
            if (saturation < MIN_SATURATION || max < MIN_VALUE) continue
            r += pr * saturation
            g += pg * saturation
            b += pb * saturation
            weight += saturation
            count++
        }

        if (count >= SIZE * SIZE * MIN_SHARE) {
            // Для свечения нужен яркий цвет: вытягиваем до максимальной яркости
            const max = Math.max(r, g, b) / weight
            color = [r / weight / max, g / weight / max, b / weight / max]
        }
    } catch {
        color = null
    }

    cache.set(src, color)
    return color
}
