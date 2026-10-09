import { expect, test as base, type Page } from '@playwright/test'

declare global {
    interface Window {
        __frames: number
        // Кто просил кадры: место вызова requestAnimationFrame → сколько раз
        __frameCallers: Record<string, number>
    }
}

// Бакет с контентом и частью иконок — внешний сервис за прокси /api/storage. С раннеров GitHub
// он бывает недоступен (ETIMEDOUT, прокси отвечает 502): это не ошибка сайта — контент уже
// в HTML, обновление из бакета тихо пропускается. 404 из бакета по-прежнему ошибка
const isStorageDown = (url: string, text: string) =>
    new URL(url, 'http://localhost').pathname.startsWith('/api/storage/') && /status of 50[234]\b/.test(text)

// Любой тест падает на необработанном исключении или console.error страницы.
// Ожидаемые ошибки тест убирает сам через ignoreErrors
export const test = base.extend<{ pageErrors: string[] }>({
    pageErrors: [
        async ({ page }, use) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`))
            page.on('console', (message) => {
                if (message.type() !== 'error' || isStorageDown(message.location().url, message.text())) return
                errors.push(message.text())
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
export const trackFrames = (page: Page) =>
    page.addInitScript(() => {
        const requestFrame = window.requestAnimationFrame.bind(window)
        let lastFrame = -1
        window.__frames = 0
        window.__frameCallers = {}
        window.requestAnimationFrame = (callback) => {
            // Три кадра стека над обёртками: по чанку и месту видно, чья это анимация.
            // «чанк.js 5:313» без скобок — иначе Playwright принимает строку отчёта за кадр стека
            const caller = (new Error().stack ?? '')
                .split('\n')
                .slice(2, 5)
                .map((line) =>
                    line
                        .trim()
                        .replace(/^at /, '')
                        .replace(/\(?(?:\S*\/)?([^/\s()]+):(\d+):(\d+)\)?/, '$1 $2:$3'),
                )
                .join(' ← ')
            window.__frameCallers[caller] = (window.__frameCallers[caller] ?? 0) + 1
            return requestFrame((time) => {
                if (time !== lastFrame) {
                    lastFrame = time
                    window.__frames++
                }
                callback(time)
            })
        }
    })

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
    // Места вызова requestAnimationFrame на начало каждой секунды: при провале — кто просил
    // кадры за последние seconds секунд
    const snapshots: Record<string, number>[] = []
    while (history.length < seconds || history.slice(-seconds).some((frames) => frames > 0)) {
        if (Date.now() > deadline) {
            const before = snapshots.at(-seconds) ?? {}
            const after = await page.evaluate(() => ({ ...window.__frameCallers }))
            const callers = Object.entries(after)
                .map(([caller, count]) => [caller, count - (before[caller] ?? 0)] as const)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([caller, count]) => `  ${count} × ${caller}`)
            throw new Error(
                `страница не затихла за ${timeout / 1000} с, кадров по секундам: ${history.join(' ')}\n` +
                    `кадры за последние ${seconds} с просили:\n${callers.join('\n')}`,
            )
        }
        snapshots.push(await page.evaluate(() => ({ ...window.__frameCallers })))
        history.push(await framesInSecond(page))
    }
}
