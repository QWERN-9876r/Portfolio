import { readFileSync } from 'node:fs'
import { TG_URL } from '../../src/lib/site'
import { expect, test } from './fixtures'
import { RUM_JOURNAL, SEEDED } from './rum-journal.mjs'

// Метрики посетителей целиком: страница → прокси /api/rum → сервис deploy/rum → журнал

const journal = (): Record<string, unknown>[] =>
    readFileSync(RUM_JOURNAL, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))

test('визит записан в журнал: замеры, увиденные секции, клик по контакту', async ({ page, context }) => {
    // Playwright — автоматизированный браузер, такие визиты сайт не считает. Здесь — посетитель
    await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
    await context.route(`${TG_URL}**`, (route) => route.fulfill({ body: 'Telegram' }))
    const since = Math.floor(Date.now() / 1000)

    await page.goto('ru/backend/')
    // Сайт отбрасывает LCP после первого ввода (прокрутка тоже ввод), а посетитель не крутит
    // страницу в ту же миллисекунду, что закончилась загрузка
    await page.evaluate(
        () =>
            new Promise((resolve) =>
                new PerformanceObserver(resolve).observe({ type: 'largest-contentful-paint', buffered: true }),
            ),
    )
    await page.locator('#about').scrollIntoViewIfNeeded()
    await expect(page.locator('#about')).toHaveAttribute('data-revealed')
    const popup = page.waitForEvent('popup')
    await page.locator(`#hero a[href="${TG_URL}"]`).click()
    await (await popup).close()
    // Уход со страницы — beacon
    await page.goto('about:blank')

    // Журнал общий на прогон: визиты из повторов и ретраев этого теста — раньше since
    const visit = () =>
        journal().find((event) => event.lang === 'ru' && event.role === 'backend' && Number(event.t) >= since)
    await expect.poll(visit, { timeout: 10_000 }).toBeDefined()
    expect(visit()).toMatchObject({
        device: 'desktop',
        paint: 'lcp',
        paintMs: expect.any(Number),
        loadMs: expect.any(Number),
        js: expect.any(Number),
        sections: expect.arrayContaining(['about']),
        cta: ['telegram'],
    })
})

test('автотесты и боты в метрики не попадают', async ({ page, context }) => {
    const beacons: string[] = []
    context.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/rum') beacons.push(request.url())
    })

    await page.goto('en/fullstack/')
    await page.goto('about:blank')
    await page.waitForTimeout(1000)

    expect(beacons).toEqual([])
})

test('«Почему я» показывает медиану посетителей из сервиса', async ({ page }) => {
    await page.goto('ru/')
    await page.locator('#selling-points').scrollIntoViewIfNeeded()

    const visitors = page.locator('#selling-points .visitors')
    await expect(visitors).toContainText(/Медиана у \d+ посетителей за 30 дней/)
    await expect(visitors).toContainText(`LCP ${SEEDED.lcpMs} мс`)
    await expect(visitors).toContainText(`JS ${SEEDED.jsBytes / 1024} КБ`)
    // Замеры этой вкладки — с оценкой цветом (нормы Google, бюджет JS)
    await expect(page.locator('#selling-points .cell[data-rating]').first()).toBeVisible()
})
