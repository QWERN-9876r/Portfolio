import { translations } from '../../src/lib/i18n/translations'
import { expect, ignoreErrors, test, trackFrames, waitForQuiet } from './fixtures'

test('второй визит открывается без сети', async ({ page, context, pageErrors }) => {
    await page.goto('/ru')
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated')
    // Визит под воркером: всё, что грузит страница, проходит через него. Что скачалось, пока
    // воркер устанавливался, проверяет unit-тест service-worker.test.ts — здесь эта гонка
    // зависела бы от нагрузки на машину
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Худший случай: ленивые чанки приложения (3D, Pixi), скачанные после load, не попали в кэш
    // воркера — например, грузились, пока он активировался. Без них страница должна работать
    const dropped = await page.evaluate(async () => {
        const { loadEventEnd } = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const lazy = performance
            .getEntriesByType('resource')
            .filter(
                (entry) =>
                    entry.startTime > loadEventEnd &&
                    /^\/_app\/immutable\/chunks\/.+\.js$/.test(new URL(entry.name).pathname),
            )
        const cache = await caches.open((await caches.keys())[0])
        await Promise.all(lazy.map((entry) => cache.delete(entry.name)))
        return lazy.length
    })
    expect(dropped).toBeGreaterThan(0)

    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('h1')).toContainText(translations.ru.hero.lastName)
    // Приложение поднялось: секции проявляются при прокрутке
    await page.locator('#about').scrollIntoViewIfNeeded()
    await expect(page.locator('#about')).toHaveAttribute('data-revealed')
    await context.setOffline(false)

    // Без сети не грузится то, что не попало в кэш: иконки из бакета, свежий контент, 3D
    ignoreErrors(pageErrors, /net::ERR_(FAILED|INTERNET_DISCONNECTED)/)
})

test('без WebGL сайт работает, только без 3D', async ({ page, pageErrors }) => {
    test.slow()
    await trackFrames(page)
    // Как у посетителя с выключенным ускорением: контекста WebGL нет ни у одного canvas, WebGPU
    // тоже. Pixi тогда ищет адаптер WebGPU и рисует через Canvas 2D; поиск растягиваем на 3 с,
    // чтобы секция ушла с экрана точно посреди запуска сцены
    await page.addInitScript(() => {
        for (const canvas of [HTMLCanvasElement.prototype, OffscreenCanvas.prototype]) {
            const getContext = canvas.getContext as (this: unknown, type: string, ...rest: unknown[]) => unknown
            Object.defineProperty(canvas, 'getContext', {
                value(this: unknown, type: string, ...rest: unknown[]) {
                    return /webgl/i.test(type) ? null : getContext.call(this, type, ...rest)
                },
            })
        }
        Object.defineProperty(Navigator.prototype, 'gpu', {
            value: {
                requestAdapter: () => {
                    window.__pixiStarting = true
                    return new Promise((resolve) => setTimeout(() => resolve(null), 3000))
                },
            },
        })
    })
    const threeFailed = page.waitForEvent('console', (message) => message.text().startsWith('THREE.WebGLRenderer'))

    await page.goto('/en')
    await threeFailed
    await page.locator('#stack-1').scrollIntoViewIfNeeded()
    await expect(page.locator('#stack-1')).toHaveAttribute('data-revealed')
    await page.waitForFunction(() => window.__pixiStarting)
    await page.locator('#experience').scrollIntoViewIfNeeded()
    await expect(page.locator('#experience')).toHaveAttribute('data-revealed')
    // Сцена дозапустилась, когда секции уже нет рядом: её убрали, кадры никто не рисует
    await waitForQuiet(page)

    // three сообщает, что контекст не создался; необработанных исключений быть не должно
    ignoreErrors(pageErrors, /^THREE\.WebGLRenderer: /)
})

declare global {
    interface Window {
        __pixiStarting?: boolean
    }
}
