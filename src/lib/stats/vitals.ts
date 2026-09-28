// Web Vitals по записям Performance API — те же правила, что у библиотеки web-vitals и в Chrome

export interface Shift {
    startTime: number
    value: number
    hadRecentInput: boolean
}

// CLS: сдвиги собираются в сессии — паузы меньше 1 с, вся сессия не дольше 5 с;
// итог — самая тяжёлая сессия. Сдвиги сразу после ввода посетителя ожидаемы и не считаются
export const cumulativeLayoutShift = (shifts: Shift[]) => {
    let worst = 0
    let session = 0
    let first = 0
    let last = 0
    for (const shift of shifts) {
        if (shift.hadRecentInput) continue
        if (session > 0 && shift.startTime - last < 1000 && shift.startTime - first < 5000) {
            session += shift.value
        } else {
            session = shift.value
            first = shift.startTime
        }
        last = shift.startTime
        worst = Math.max(worst, session)
    }
    return worst
}

export interface InteractionEvent {
    interactionId?: number
    duration: number
}

// INP: у действия (клик, клавиша) — самое долгое из его событий. Итог — худшее действие,
// а при десятках действий — одно из худших: на каждые 50 действий одно отбрасывается
export const interactionToNextPaint = (events: InteractionEvent[]) => {
    const worst = new Map<number, number>()
    for (const { interactionId, duration } of events) {
        if (interactionId) worst.set(interactionId, Math.max(worst.get(interactionId) ?? 0, duration))
    }
    if (worst.size === 0) return null
    const sorted = [...worst.values()].sort((a, b) => b - a)
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length / 50))]
}

// TBT: сколько основной поток был занят сверх 50 мс за каждую долгую задачу
export const blockingTime = (durations: number[]) =>
    durations.reduce((sum, duration) => sum + Math.max(0, duration - 50), 0)

// Оценка по порогам Google: хорошо / можно лучше / плохо
export type Rating = 'good' | 'fair' | 'poor'

const THRESHOLDS = {
    ttfb: [800, 1800],
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    inp: [200, 500],
    cls: [0.1, 0.25],
    // Lighthouse: Total Blocking Time и число элементов на странице
    tbt: [200, 600],
    dom: [800, 1400],
} as const

export type Vital = keyof typeof THRESHOLDS

export const rate = (vital: Vital, value: number): Rating => {
    const [good, fair] = THRESHOLDS[vital]
    return value <= good ? 'good' : value <= fair ? 'fair' : 'poor'
}

// Нормы Google (Web Vitals) и Lighthouse — граница «хорошо»
export const goodThreshold = (vital: Vital) => THRESHOLDS[vital][0]
export const normSource = (vital: Vital) => (vital === 'tbt' || vital === 'dom' ? 'lighthouse' : 'google')

// Во сколько раз значение лучше нормы — с двух раз есть чем похвастаться; ноль — отдельный случай
export const timesBetter = (vital: Vital, value: number) => {
    const times = Math.floor(goodThreshold(vital) / value)
    return value > 0 && times >= 2 ? times : null
}

// Плавность, когда что-то движется, — по интервалам между кадрами подряд. Частота — по медиане,
// частота экрана — по самым быстрым кадрам; пропуск — кадр дольше полутора кадров экрана
export const smoothness = (intervals: number[]) => {
    if (intervals.length < 20) return null
    const sorted = [...intervals].sort((a, b) => a - b)
    const screen = sorted[Math.floor(sorted.length / 10)]
    const dropped = intervals.filter((interval) => interval > screen * 1.5).length / intervals.length
    return { fps: Math.round(1000 / sorted[Math.floor(sorted.length / 2)]), dropped }
}

export const rateDropped = (dropped: number): Rating => (dropped <= 0.05 ? 'good' : dropped <= 0.15 ? 'fair' : 'poor')

// Кадры в покое: ноль — страница не рисует зря
export const rateIdleFrames = (fps: number): Rating => (fps === 0 ? 'good' : fps <= 5 ? 'fair' : 'poor')

export const rateBudget = (kb: number, budget: number): Rating =>
    kb <= budget ? 'good' : kb <= budget * 1.5 ? 'fair' : 'poor'
