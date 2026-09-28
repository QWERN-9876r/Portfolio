import { describe, expect, it } from 'vitest'
import {
    blockingTime,
    cumulativeLayoutShift,
    interactionToNextPaint,
    rate,
    rateBudget,
    rateDropped,
    rateIdleFrames,
    smoothness,
    timesBetter,
} from './vitals'

const shift = (startTime: number, value: number, hadRecentInput = false) => ({ startTime, value, hadRecentInput })

describe('cumulativeLayoutShift', () => {
    it('сдвигов нет — ноль', () => {
        expect(cumulativeLayoutShift([])).toBe(0)
    })

    it('близкие сдвиги — одна сессия, их сумма', () => {
        expect(cumulativeLayoutShift([shift(0, 0.05), shift(500, 0.05), shift(1200, 0.02)])).toBeCloseTo(0.12)
    })

    it('пауза в секунду начинает новую сессию; итог — самая тяжёлая', () => {
        expect(cumulativeLayoutShift([shift(0, 0.05), shift(2000, 0.1), shift(2500, 0.1)])).toBeCloseTo(0.2)
    })

    it('сессия не длиннее 5 с, даже без пауз', () => {
        const shifts = Array.from({ length: 12 }, (_, i) => shift(i * 900, 0.01))
        // 0–4,5 с: шесть сдвигов, дальше новая сессия
        expect(cumulativeLayoutShift(shifts)).toBeCloseTo(0.06)
    })

    it('сдвиги сразу после ввода посетителя не считаются', () => {
        expect(cumulativeLayoutShift([shift(0, 0.3, true), shift(100, 0.01)])).toBeCloseTo(0.01)
    })
})

describe('interactionToNextPaint', () => {
    it('действий не было — null; события без действия не в счёт', () => {
        expect(interactionToNextPaint([])).toBeNull()
        expect(interactionToNextPaint([{ interactionId: 0, duration: 400 }])).toBeNull()
    })

    it('у действия — самое долгое из его событий, итог — худшее действие', () => {
        const events = [
            { interactionId: 1, duration: 24 },
            { interactionId: 2, duration: 56 },
            { interactionId: 2, duration: 120 },
            { interactionId: 3, duration: 80 },
        ]
        expect(interactionToNextPaint(events)).toBe(120)
    })

    it('на каждые 50 действий одно худшее отбрасывается', () => {
        // Худшее — последним: порядок действий роли не играет
        const events = Array.from({ length: 60 }, (_, i) => ({ interactionId: i + 1, duration: 40 + i }))
        events.push({ interactionId: 61, duration: 900 })
        expect(interactionToNextPaint(events)).toBe(99)
    })
})

describe('blockingTime и rate', () => {
    it('TBT — всё сверх 50 мс у каждой долгой задачи', () => {
        expect(blockingTime([51, 120, 50])).toBe(71)
    })

    it.each([
        ['lcp', 2500, 'good'],
        ['lcp', 2501, 'fair'],
        ['lcp', 4001, 'poor'],
        ['inp', 180, 'good'],
        ['cls', 0.1, 'good'],
        ['cls', 0.3, 'poor'],
    ] as const)('%s %s → %s', (vital, value, expected) => {
        expect(rate(vital, value)).toBe(expected)
    })
})

describe('smoothness', () => {
    const frames = (interval: number, count: number) => Array.from({ length: count }, () => interval)

    it('мало кадров подряд — ещё не посчитать', () => {
        expect(smoothness(frames(16.7, 19))).toBeNull()
    })

    it('ровно с частотой экрана — 60 к/с без пропусков', () => {
        expect(smoothness(frames(16.7, 120))).toEqual({ fps: 60, dropped: 0 })
    })

    it('экран 120 Гц — 120 к/с', () => {
        expect(smoothness(frames(8.33, 120))?.fps).toBe(120)
    })

    it('кадры вдвое длиннее экранного — пропуски', () => {
        const result = smoothness([...frames(16.7, 90), ...frames(33.4, 10)])
        expect(result?.fps).toBe(60)
        expect(result?.dropped).toBeCloseTo(0.1)
        expect(rateDropped(result!.dropped)).toBe('fair')
    })
})

describe('нормы и оценки', () => {
    it.each([
        ['lcp', 84, 29],
        ['lcp', 1200, 2],
        ['lcp', 1300, null],
        ['cls', 0, null],
        ['dom', 335, 2],
    ] as const)('%s %s — лучше нормы в %s раз', (vital, value, times) => {
        expect(timesBetter(vital, value)).toBe(times)
    })

    it('кадры в покое: ноль — хорошо', () => {
        expect(rateIdleFrames(0)).toBe('good')
        expect(rateIdleFrames(3)).toBe('fair')
        expect(rateIdleFrames(60)).toBe('poor')
    })

    it('JS против бюджета', () => {
        expect(rateBudget(64, 70)).toBe('good')
        expect(rateBudget(90, 70)).toBe('fair')
        expect(rateBudget(140, 70)).toBe('poor')
    })
})
