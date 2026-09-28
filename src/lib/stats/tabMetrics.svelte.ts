import { currentPaint, framesDrawn, scriptBytes, watchIdleFps } from '$lib/pageMetrics'
import {
    blockingTime,
    cumulativeLayoutShift,
    interactionToNextPaint,
    smoothness,
    type InteractionEvent,
    type Shift,
} from './vitals'

// Замеры этой вкладки для страницы статистики: всё из Performance API браузера посетителя,
// раз в секунду. Свёрнутая вкладка не считает

// Секунд в графиках
export const HISTORY = 60

export interface LoadTimings {
    // Страница, с которой открыли сайт: при переходах внутри сайта документ тот же
    path: string
    ttfb: number
    fcp: number | null
    lcp: number | null
    domReady: number
    load: number | null
}

type LongTask = PerformanceEntry
type LayoutShift = PerformanceEntry & Shift
type EventTiming = PerformanceEntry & InteractionEvent

// Нестандартное, только в Chromium
type ChromeMemory = { memory?: { usedJSHeapSize: number } }

const supports = (type: string) => PerformanceObserver.supportedEntryTypes?.includes(type) ?? false

// Пауза между кадрами дольше — уже не кадр анимации, а новый её всплеск
const BURST_GAP = 250
// Интервалов для плавности — последние секунды анимации
const INTERVALS = 240

export class TabMetrics {
    // Кадров по секундам — для графика
    fps = $state.raw<number[]>([])
    // Кадров в секунду покоя (2 с без ввода) — как в «Почему я»; null — покоя ещё не было
    idleFps = $state<number | null>(null)
    // Плавность, когда что-то движется; null — ещё ничего не двигалось
    smooth = $state.raw<{ fps: number; dropped: number } | null>(null)
    // МБ по секундам; null — браузер не отдаёт
    memory = $state.raw<number[] | null>(null)
    nodes = $state(0)
    uptime = $state(0)
    // null — ещё не было действий или браузер этого не умеет (measuresInp)
    inp = $state<number | null>(null)
    measuresInp = $state(false)
    // null — браузер этого не умеет (Safari, Firefox)
    longTasks = $state.raw<{ count: number; blocking: number } | null>(null)
    cls = $state<number | null>(null)
    load = $state.raw<LoadTimings | null>(null)
    requests = $state.raw({ total: 0, cached: 0, bytes: 0 })
    js = $state.raw({ atLoad: 0, now: 0 })
    // Файлов в кэше service worker; null — воркера нет
    offline = $state<number | null>(null)

    start() {
        const observers: PerformanceObserver[] = []
        const observe = <T extends PerformanceEntry>(type: string, onEntries: (entries: T[]) => void, options = {}) => {
            if (!supports(type)) return false
            const observer = new PerformanceObserver((list) => onEntries(list.getEntries() as T[]))
            observer.observe({ type, buffered: true, ...options })
            observers.push(observer)
            return true
        }

        // Наблюдатели отвечают асинхронно: до первого ответа — ноль, если браузер это умеет
        const tasks: number[] = []
        const watchesTasks = observe<LongTask>('longtask', (entries) => {
            tasks.push(...entries.map((entry) => entry.duration))
            this.longTasks = { count: tasks.length, blocking: blockingTime(tasks) }
        })
        if (watchesTasks) this.longTasks ??= { count: 0, blocking: 0 }

        const shifts: Shift[] = []
        const watchesShifts = observe<LayoutShift>('layout-shift', (entries) => {
            shifts.push(...entries)
            this.cls = cumulativeLayoutShift(shifts)
        })
        if (watchesShifts) this.cls ??= 0

        const events: InteractionEvent[] = []
        const onEvents = (entries: EventTiming[]) => {
            events.push(...entries)
            this.inp = interactionToNextPaint(events)
        }
        this.measuresInp = observe<EventTiming>('event', onEvents, { durationThreshold: 16 })
        observe<EventTiming>('first-input', onEvents)

        const resources: PerformanceResourceTiming[] = []
        observe<PerformanceResourceTiming>('resource', (entries) => {
            resources.push(...entries)
            this.countRequests(resources)
        })

        // Интервалы между кадрами подряд, пока открыта статистика: обёртка поверх pageMetrics
        const intervals: number[] = []
        let lastFrame = -1
        const requestFrame = window.requestAnimationFrame
        const measured: typeof requestAnimationFrame = (callback) =>
            requestFrame((time) => {
                if (time !== lastFrame) {
                    if (lastFrame >= 0 && time - lastFrame < BURST_GAP) intervals.push(time - lastFrame)
                    if (intervals.length > INTERVALS) intervals.shift()
                    lastFrame = time
                }
                callback(time)
            })
        window.requestAnimationFrame = measured
        const stopIdle = watchIdleFps((fps) => (this.idleFps = fps))

        this.measureLoad()
        let lastFrames = framesDrawn()
        let second = 0
        const tick = () => {
            if (document.hidden) return
            const frames = framesDrawn()
            this.fps = [...this.fps, frames - lastFrames].slice(-HISTORY)
            lastFrames = frames
            this.smooth = smoothness(intervals) ?? this.smooth
            const heap = (performance as ChromeMemory).memory?.usedJSHeapSize
            if (heap) this.memory = [...(this.memory ?? []), heap / 1048576].slice(-HISTORY)
            this.nodes = document.getElementsByTagName('*').length
            this.uptime = Math.floor(performance.now() / 1000)
            // Первая загрузка могла ещё не закончиться, когда страницу открыли
            if (this.load?.load === null) {
                this.measureLoad()
                if (this.load?.load) this.countRequests(resources)
            }
            if (second++ % 5 === 0) this.countOffline()
        }
        tick()
        const id = setInterval(tick, 1000)

        return () => {
            clearInterval(id)
            stopIdle()
            if (window.requestAnimationFrame === measured) window.requestAnimationFrame = requestFrame
            for (const observer of observers) observer.disconnect()
        }
    }

    private measureLoad() {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        if (!navigation) return
        const paint = currentPaint()
        this.load = {
            path: new URL(navigation.name).pathname,
            ttfb: navigation.responseStart,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
            lcp: paint?.kind === 'lcp' ? paint.ms : null,
            domReady: navigation.domContentLoadedEventEnd,
            load: navigation.loadEventEnd || null,
        }
    }

    private async countRequests(resources: PerformanceResourceTiming[]) {
        // Из кэша — без байтов по сети: HTTP-кэш или service worker. Все ресурсы сайта свои,
        // чужих (у них transferSize тоже 0) здесь нет
        const cached = resources.filter((entry) => entry.transferSize === 0).length
        const bytes = resources.reduce((sum, entry) => sum + entry.transferSize, 0)
        this.requests = { total: resources.length, cached, bytes }

        const loadEnd = this.load?.load ?? Infinity
        const [atLoad, now] = await Promise.all([
            scriptBytes(resources.filter((entry) => entry.startTime < loadEnd)),
            scriptBytes(resources),
        ])
        this.js = { atLoad, now }
    }

    private async countOffline() {
        if (!('caches' in window) || !navigator.serviceWorker?.controller) return
        const names = await caches.keys()
        const sizes = await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).length))
        this.offline = sizes.reduce((sum, size) => sum + size, 0)
    }
}
