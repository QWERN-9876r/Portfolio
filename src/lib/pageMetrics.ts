import { browser } from '$app/environment'

// Замеры этой страницы в браузере посетителя: только Performance API, без библиотек

export interface PageMetrics {
    // LCP, а где его нет (Safari) — FCP
    paint: { kind: 'lcp' | 'fcp'; ms: number } | null
    loadMs: number | null
    // JS, загруженный до события load, в сжатом виде
    jsBytes: number | null
}

// Свои анимации (счётчики цифр) идут мимо подсчёта кадров ниже
export const nextFrame: typeof requestAnimationFrame = browser
    ? window.requestAnimationFrame.bind(window)
    : () => 0

// Кадры, которые страница рисует сама. Считаем кадры, где сработал requestAnimationFrame:
// через него рисуют и Svelte, и three, и Pixi. Ввод посетителя — чтобы отличить покой
let frames = 0
let lastFrameTime = -1
let lastInput = 0
let firstInput = Infinity

// LCP нет в общем буфере Performance, его отдаёт только наблюдатель. Подписываемся сразу:
// buffered вернёт и то, что было до загрузки этого модуля
let lcp: number | null = null

if (browser) {
    window.requestAnimationFrame = (callback) =>
        nextFrame((time) => {
            if (time !== lastFrameTime) {
                lastFrameTime = time
                frames++
            }
            callback(time)
        })

    const onInput = () => {
        lastInput = performance.now()
        firstInput = Math.min(firstInput, lastInput)
    }
    for (const type of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']) {
        addEventListener(type, onInput, { capture: true, passive: true })
    }

    // Браузер обрывает LCP на клике, клавише и прокрутке, мы — ещё и на движении мыши.
    // Текст hero проявляется из opacity 0, и Chrome не засчитывает его при первой отрисовке.
    // Зато при наведении кнопка перерисовывается и приходит «LCP» через секунды — это не загрузка
    if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.startTime < firstInput) lcp = entry.startTime
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true })
    }
}

const JS = /\.m?js(?:$|\?)/

// Через service worker Resource Timing отдаёт уже распакованный размер: кэш хранит тело
// без сжатия. Сжатый остаётся в Content-Length сохранённого ответа, если сервер его прислал
// (nginx с gzip_static присылает). Нет заголовка — распакованный: честно, только больше
const jsSize = async (entry: PerformanceResourceTiming) => {
    if (entry.workerStart > 0 && 'caches' in window) {
        const length = Number((await caches.match(entry.name))?.headers.get('content-length'))
        if (length > 0) return length
    }
    return entry.encodedBodySize
}

export const measurePage = async (): Promise<PageMetrics> => {
    if (document.readyState !== 'complete') {
        await new Promise((resolve) => addEventListener('load', resolve, { once: true }))
    }
    // loadEventEnd заполняется после обработчиков load
    await new Promise((resolve) => setTimeout(resolve))

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const loadEnd = navigation?.loadEventEnd || null
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null

    const scripts = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
        (entry) => JS.test(entry.name) && (loadEnd === null || entry.startTime < loadEnd),
    )
    const jsBytes = (await Promise.all(scripts.map(jsSize))).reduce((sum, size) => sum + size, 0)

    return {
        paint: lcp !== null ? { kind: 'lcp', ms: lcp } : fcp !== null ? { kind: 'fcp', ms: fcp } : null,
        loadMs: loadEnd,
        // 0 — браузер не отдал размеры, а не «JS нет»
        jsBytes: jsBytes || null,
    }
}

// Секунда считается покоем, если ни в ней, ни за 2 с до неё не было ввода: за это время
// догорают анимации отклика (свечение призмы ~0,7 с, лучи спектра дотягиваются ~1,3 с)
const INTERVAL = 1000
const INPUT_GRACE = 2000

// Раз в секунду покоя сообщает, сколько кадров страница нарисовала за эту секунду
export const watchIdleFps = (report: (fps: number) => void) => {
    let windowStart = performance.now()
    let framesAtStart = frames

    const id = setInterval(() => {
        const now = performance.now()
        const counted = frames - framesAtStart
        const idle = lastInput < windowStart - INPUT_GRACE
        if (idle) report(Math.round((counted * 1000) / (now - windowStart)))
        windowStart = now
        framesAtStart = frames
    }, INTERVAL)

    return () => clearInterval(id)
}
