import { LOCALES, translations } from '../../src/lib/i18n/translations'
import { ROLES, rolePath } from '../../src/lib/role'
import { resumePdf, SITE_URL } from '../../src/lib/site'
import { expect, test } from './fixtures'

for (const lang of LOCALES) {
    for (const role of ROLES) {
        const path = rolePath(lang, role)

        test(`${path}: язык, роль и SEO`, async ({ page }) => {
            const t = translations[lang]
            // Относительно baseURL: '/en/' → http://…/Portfolio/en/
            const response = await page.goto(path.slice(1))

            expect(response?.status()).toBe(200)
            await expect(page.locator('html')).toHaveAttribute('lang', lang)
            await expect(page).toHaveTitle(t.seo.title)
            await expect(page.locator('h1')).toContainText(t.hero.lastName)
            await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL + path)
            await expect(page.locator(`#hero a[data-role="${role}"]`)).toHaveAttribute('aria-current', 'page')
            await expect(page.locator(`#hero a[href="${resumePdf(lang)}"]`)).toBeVisible()
        })
    }
}

test('корень ведёт на английскую версию', async ({ page }) => {
    await page.goto('')
    await expect(page).toHaveURL('en/')
})

test('старые ссылки ?role= ведут на путь роли', async ({ page }) => {
    await page.goto('en/?role=backend#experience')
    await expect(page).toHaveURL('en/backend/#experience')
})

test('переключение языка сохраняет роль', async ({ page }) => {
    await page.goto('en/backend/')
    await page.getByRole('link', { name: `${translations.en.languageToggle.switchTo} RU` }).click()

    await expect(page).toHaveURL('ru/backend/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
    await expect(page.locator('h1')).toContainText(translations.ru.hero.lastName)
})

test('переключение роли меняет адрес и canonical без перезагрузки', async ({ page }) => {
    await page.goto('ru/')
    await page.evaluate(() => (window.__loaded = true))
    await page.locator('#hero a[data-role="fullstack"]').click()

    await expect(page).toHaveURL('ru/fullstack/')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/ru/fullstack/`)
    expect(await page.evaluate(() => window.__loaded)).toBe(true)
})

test('страница резюме для PDF', async ({ page }) => {
    await page.goto('resume/ru/')
    await expect(page.locator('h1')).toHaveText(translations.ru.seo.name)
    // Из PDF — ссылка на интерактивную версию
    await expect(page.locator(`a[href="${SITE_URL}/ru/"]`)).toBeVisible()
})

declare global {
    interface Window {
        __loaded?: boolean
    }
}
