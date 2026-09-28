import { statSync } from 'node:fs'
import { JS_BUDGET_KB } from '../../src/lib/site'
import { expect, framesInSecond, test, trackFrames, waitForQuiet } from './fixtures'

// JS до события load в сжатом виде — как его отдаёт nginx (gzip_static, .gz из сборки).
// Держит цифру «JS на первом экране» в кейсе «Этот сайт»: three и Pixi (~140 КБ) грузятся после load

test(`JS до load — не больше ${JS_BUDGET_KB} КБ gzip`, async ({ page }) => {
    await page.goto('/en')
    // loadEventEnd заполняется после обработчиков load
    await page.waitForFunction(() => performance.getEntriesByType('navigation')[0]?.toJSON().loadEventEnd > 0)

    const scripts = await page.evaluate(() => {
        const { loadEventEnd } = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return performance
            .getEntriesByType('resource')
            .filter((entry) => entry.startTime < loadEventEnd && /\.js$/.test(new URL(entry.name).pathname))
            .map((entry) => new URL(entry.name).pathname)
    })
    const sizes = scripts.map((path) => ({ path, kb: statSync(`dist${path}.gz`).size / 1024 }))
    const total = sizes.reduce((sum, { kb }) => sum + kb, 0)

    expect(scripts.length).toBeGreaterThan(0)
    expect(total, sizes.map(({ path, kb }) => `${kb.toFixed(1)} КБ ${path}`).join('\n')).toBeLessThanOrEqual(
        JS_BUDGET_KB,
    )
})

test('в покое страница не рисует ни одного кадра', async ({ page }) => {
    test.slow()
    await trackFrames(page)
    await page.goto('/en')

    // Сначала интро: удар луча по призме и подсказка пальцем в hero, потом — ни кадра
    await waitForQuiet(page)
})

test('сцена Pixi рисует, пока на неё смотрят, и засыпает в покое', async ({ page }) => {
    // Дважды ждём тишины: после интро и после сцены
    test.setTimeout(150_000)
    await trackFrames(page)
    await page.goto('/en')
    await waitForQuiet(page)

    await page.locator('#stack-1').scrollIntoViewIfNeeded()
    // Hero уже затих — кадры теперь рисует только сцена
    await expect.poll(() => framesInSecond(page), { timeout: 10_000, intervals: [0] }).toBeGreaterThan(0)
    // Подсказка пальцем, затем IDLE_MS без курсора — и сцена спит
    await waitForQuiet(page)
})
