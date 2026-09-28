import { isHttpError } from '@sveltejs/kit'
import { describe, expect, it } from 'vitest'
import config from '../../svelte.config.js'
import { LOCALES, translations } from '$lib/i18n/translations'
import { ROLES, rolePath } from '$lib/role'
import { SITE_URL } from '$lib/site'
import { GET as manifest } from './[lang=lang]/manifest.webmanifest/+server'
import { GET as robots } from './robots.txt/+server'
import { GET as sitemap } from './sitemap.xml/+server'

type ManifestEvent = Parameters<typeof manifest>[0]
const manifestFor = (lang: string) => manifest({ params: { lang } } as unknown as ManifestEvent)

// svelte.config.js перечисляет страницы для пререндера сам — без импорта из src
const prerendered = new Set(config.kit?.prerender?.entries)

describe('sitemap.xml', async () => {
    const response = sitemap()
    const xml = await response.text()
    const urls = [...xml.matchAll(/<url>(.*?)<\/url>/g)].map(([, url]) => url)

    it('XML с адресами всех страниц ролей на всех языках', () => {
        expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8')
        expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset /)
        const locs = urls.map((url) => /<loc>(.*?)<\/loc>/.exec(url)?.[1])
        expect(locs.sort()).toEqual(
            ROLES.flatMap((role) => LOCALES.map((lang) => SITE_URL + rolePath(lang, role))).sort(),
        )
    })

    it('у каждой страницы — версии на других языках и x-default на английскую', () => {
        for (const url of urls) {
            const alternates = Object.fromEntries(
                [...url.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => [lang, href]),
            )
            expect(Object.keys(alternates).sort()).toEqual([...LOCALES, 'x-default'].sort())
            expect(alternates['x-default']).toBe(alternates.en)
            // Версия на своём языке — сама страница
            const loc = /<loc>(.*?)<\/loc>/.exec(url)![1]
            expect(alternates[new URL(loc).pathname.split('/')[1]]).toBe(loc)
        }
    })

    it('всё из sitemap пререндерится', () => {
        for (const role of ROLES) for (const lang of LOCALES) expect(prerendered).toContain(rolePath(lang, role))
        expect(prerendered).toContain('/sitemap.xml')
    })
})

describe('robots.txt', () => {
    it('открыт для всех и ведёт на sitemap', async () => {
        const text = await robots().text()
        expect(text).toContain('User-agent: *\nAllow: /')
        expect(text).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
        expect(prerendered).toContain('/robots.txt')
    })
})

describe('manifest.webmanifest', () => {
    it.each(LOCALES)('%s: имя, описание и стартовая страница — на языке страницы', async (lang) => {
        const response = await manifestFor(lang)
        const body = await response.json()

        expect(response.headers.get('content-type')).toBe('application/manifest+json; charset=utf-8')
        expect(body).toMatchObject({
            lang,
            name: translations[lang].seo.title,
            description: translations[lang].seo.description,
            start_url: `/${lang}`,
            display: 'standalone',
        })
        expect(prerendered).toContain(`/${lang}/manifest.webmanifest`)
    })

    it('id общий: приложение одно, с какого языка его ни установи', async () => {
        const ids = await Promise.all(LOCALES.map(async (lang) => (await (await manifestFor(lang)).json()).id))
        expect(new Set(ids)).toEqual(new Set(['/']))
    })

    it('иконки 192 и 512, одна из них — maskable', async () => {
        const { icons } = await (await manifestFor('en')).json()
        expect(icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
            expect.arrayContaining(['192x192', '512x512']),
        )
        expect(icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true)
    })

    it('неизвестный язык — 404', () => {
        try {
            manifestFor('de')
            expect.unreachable()
        } catch (error) {
            expect(isHttpError(error, 404)).toBe(true)
        }
    })
})
