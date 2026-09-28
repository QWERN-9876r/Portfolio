import { expect, test as base, type Page } from '@playwright/test'

declare global {
    interface Window {
        __frames: number
    }
}

// Любой тест падает на необработанном исключении или console.error страницы.
// Ожидаемые ошибки тест убирает сам через ignoreErrors
export const test = base.extend<{ pageErrors: string[] }>({
    pageErrors: [
        async ({ page }, use) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`))
            page.on('console', (message) => {
                if (message.type() === 'error') errors.push(message.text())
            })
            await use(errors)
            expect(errors, 'ошибки на странице').toEqual([])
        },
        { auto: true },
    ],
})

export { expect }

export const ignoreErrors = (errors: string[], pattern: RegExp) => {
    const unexpected = errors.filter((error) => !pattern.test(error))
    errors.splice(0, errors.length, ...unexpected)
}

// Кадры, в которые страница что-то рисовала через requestAnimationFrame: так рисуют Svelte,
// three и Pixi. Так же считает сама страница (pageMetrics.ts) — ставим раньше её кода
export const trackFrames = async (page: Page) => {
    await page.addInitScript((fps) => {
        const raf = window.requestAnimationFrame.bind(window)
        let queue = new Map<number, FrameRequestCallback>()
        let timer = 0
        let last = 0
        let id = 0
        const flush = () =>
            raf((time) => {
                timer = 0
                last = performance.now()
                const batch = queue
                queue = new Map()
                batch.forEach((callback) => callback(time))
            })
        window.requestAnimationFrame = (callback) => {
            queue.set(++id, callback)
            if (!timer) timer = window.setTimeout(flush, Math.max(0, last + 1000 / fps - performance.now()))
            return id
        }
        window.cancelAnimationFrame = (handle) => void queue.delete(handle)
    }, Number(process.env.E2E_FPS))
    return page.addInitScript(() => {
        const requestFrame = window.requestAnimationFrame.bind(window)
        let lastFrame = -1
        window.__frames = 0
        window.requestAnimationFrame = (callback) =>
            requestFrame((time) => {
                if (time !== lastFrame) {
                    lastFrame = time
                    window.__frames++
                }
                callback(time)
            })
    })
}

export const framesInSecond = async (page: Page) => {
    const frames = () => page.evaluate(() => window.__frames)
    const start = await frames()
    await page.waitForTimeout(1000)
    return (await frames()) - start
}

// Страница затихла: несколько секунд подряд ни одного кадра. Одной секунды мало — длинная
// задача (компиляция шейдеров в SwiftShader) блокирует rAF посреди анимации.
// На раннере с 2 ядрами SwiftShader рисует ~1–2 кадра в секунду, и интро идёт медленнее
// (шаг анимации призмы не больше 0,05 с на кадр): тесты с ожиданием тишины — test.slow()
export const waitForQuiet = async (page: Page, { seconds = 3, timeout = 60_000 } = {}) => {
    const deadline = Date.now() + timeout
    const history: number[] = []
    while (history.length < seconds || history.slice(-seconds).some((frames) => frames > 0)) {
        if (Date.now() > deadline) {
            throw new Error(`страница не затихла за ${timeout / 1000} с, кадров по секундам: ${history.join(' ')}`)
        }
        history.push(await framesInSecond(page))
    }
}
