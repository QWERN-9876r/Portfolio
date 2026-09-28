import { statsTranslations } from '../../src/lib/i18n/stats'
import { translations } from '../../src/lib/i18n/translations'
import { expect, test } from './fixtures'
import { SEEDED } from './rum-journal.mjs'

// Страница /stats: живые замеры вкладки и лента визитов из настоящего сервиса метрик.
// Сочетания языка и роли здесь — не ru/backend: его ищет в журнале rum.spec.ts

const ru = statsTranslations.ru
const en = statsTranslations.en

test('в эфире: визиты из журнала сервиса', async ({ page }) => {
    await page.goto('/ru/stats')

    await expect(page.getByRole('status')).toHaveText(ru.status.live)
    await expect(page.locator('.visit').filter({ hasText: `LCP ${SEEDED.lcpMs} мс` })).not.toHaveCount(0)
    await expect(page.locator('.total')).toHaveText(/^\d+ визит\S* за 30 дней$/)
})

test('новый визит появляется сверху без перезагрузки', async ({ page, request }) => {
    await page.goto('/en/stats')
    await expect(page.getByRole('status')).toHaveText(en.status.live)

    const response = await request.post('/api/rum', {
        data: { lang: 'en', role: 'backend', device: 'mobile', paint: 'lcp', paintMs: 1234.5, sections: ['case-2'] },
    })
    expect(response.status()).toBe(204)

    // Другие тесты шлют визиты параллельно — ищем свой по содержимому, а не первым в ленте
    const posted = page.locator('.visit.live').filter({ hasText: 'EN · Backend · phone' }).filter({ hasText: 'LCP 1.2 s' })
    await expect(posted.first()).toContainText('scrolled to «Case 2»')
    // Выше него — только визиты, пришедшие ещё позже, а не те, что были при подключении
    const aboveSnapshot = await page.locator('.visit').evaluateAll((rows) => {
        const text = (row: Element) => row.textContent?.replace(/\s+/g, ' ') ?? ''
        const index = rows.findIndex((row) => row.classList.contains('live') && text(row).includes('LCP 1.2 s'))
        return rows.slice(0, index).every((row) => row.classList.contains('live'))
    })
    expect(aboveSnapshot).toBe(true)
})

test('свой визит с главной помечен «это вы»', async ({ page, context }) => {
    // Автоматизированный браузер сайт не считает — здесь посетитель
    await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))

    await page.goto('/en/fullstack')
    await page.locator('#selling-points').scrollIntoViewIfNeeded()
    await page.locator('#selling-points').getByRole('link', { name: translations.en.whyMe.statsLink }).click()
    await expect(page).toHaveURL('/en/stats')

    const own = page.locator('.visit.own')
    await expect(own).toHaveCount(1)
    await expect(own).toContainText(en.visits.you)
    await expect(own).toContainText('EN · Fullstack · desktop')
    // Секции, увиденные на главной, дошли до сервиса: beacon ушёл до смены страницы.
    // Докуда именно — зависит от прилипания к секциям после клика, поэтому без названия
    await expect(own).toContainText(`${en.visits.deepest} «`)
})

test('замеры вкладки идут вживую', async ({ page }) => {
    test.slow()
    await page.goto('/ru/stats')

    const uptime = page.locator('.tile').filter({ hasText: ru.tab.uptime }).locator('.value')
    await expect(uptime).toHaveText(/^\d+:\d\d$/)
    const before = await uptime.textContent()
    await expect(uptime).not.toHaveText(before!)

    // График кадров растёт по секунде
    await expect.poll(() => page.locator('.chart rect').count()).toBeGreaterThan(2)
    await expect(page.locator('.tile').filter({ hasText: ru.load.requests }).locator('.value')).toHaveText(/^\d+$/)

    // Первое действие — отклик появляется
    const inp = page.locator('.tile').filter({ hasText: ru.tab.inp }).locator('.value')
    await expect(inp).toHaveText('—')
    await page.locator('h1').click()
    await expect(inp).toHaveText(/^\d+ мс/)

    // После интро призмы и без действий — ноль кадров в покое, зелёным
    const idle = page.locator('.big').filter({ hasText: ru.tab.idle })
    await expect(idle.locator('.big-value')).toHaveText('0', { timeout: 45_000 })
    await expect(idle).toHaveAttribute('data-rating', 'good')
    await expect(idle).toContainText(ru.tab.idleNote)
})

test('переключение языка остаётся на статистике', async ({ page }) => {
    await page.goto('/en/stats')
    await page.getByRole('link', { name: `${translations.en.languageToggle.switchTo} RU` }).click()

    await expect(page).toHaveURL('/ru/stats')
    await expect(page.locator('h1')).toHaveText(ru.title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://qwern9876r.ru/ru/stats')
})

test('вход с первого экрана — «Статистика» в верхней панели', async ({ page }) => {
    await page.goto('/ru')
    const entry = page.getByRole('link', { name: translations.ru.statsNav, exact: true })
    await expect(entry).toBeInViewport()

    await entry.click()
    await expect(page).toHaveURL('/ru/stats')
    await expect(entry).toHaveAttribute('aria-current', 'page')
})

// Призма живёт в общем макете, а #scroll-root у каждой страницы свой: после перехода
// на статистику и обратно она должна следить за прокруткой новой главной
test('призма следит за прокруткой и после возврата со статистики', async ({ page }) => {
    const { prism } = translations.ru
    await page.goto('/ru')
    // Сцена грузится лениво: куб «Наверх» после прокрутки — значит, она подписана на скролл
    await page.locator('#experience').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: prism.backToTop })).toBeVisible()

    await page.getByRole('link', { name: translations.ru.statsNav, exact: true }).click()
    await expect(page).toHaveURL('/ru/stats')
    await page.getByRole('link', { name: ru.back }).click()
    await expect(page).toHaveURL('/ru')

    // Новая главная открылась сверху — куб снова бьёт лучом, а ниже hero — ведёт наверх
    await expect(page.getByRole('button', { name: prism.strike })).toBeVisible()
    await page.locator('#experience').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: prism.backToTop })).toBeVisible()
})
