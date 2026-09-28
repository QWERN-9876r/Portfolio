import { describe, expect, it } from 'vitest'
import { statsTranslations } from '$lib/i18n/stats'
import { translations } from '$lib/i18n/translations'
import type { VisitBeacon } from '$lib/rum'
import { formatDuration, formatKb, formatMb, formatMs, vitalNote } from './format'
import { deepestSection, isOwnVisit, sectionLabel, timeAgo, type Visit } from './visits'

const ru = translations.ru
const en = translations.en
const ruStats = statsTranslations.ru
const enStats = statsTranslations.en

describe('deepestSection', () => {
    it('самая дальняя по порядку на странице, а не по порядку в списке', () => {
        expect(deepestSection(['about', 'case-2', 'stack-3', 'experience'])).toBe('case-2')
        expect(deepestSection(['stack-2', 'stack-10', 'about'])).toBe('stack-10')
    })

    it('нет секций или только незнакомые — null', () => {
        expect(deepestSection([])).toBeNull()
        expect(deepestSection(undefined)).toBeNull()
        expect(deepestSection(['footer'])).toBeNull()
    })
})

describe('sectionLabel', () => {
    it.each([
        ['case-3', 'Кейс 3'],
        ['stack-4', 'Технологии'],
        ['selling-points', 'Почему я'],
        ['hero', 'Первый экран'],
        ['all-tech', 'Все технологии'],
        ['unknown', 'unknown'],
    ])('%s → %s', (id, label) => {
        expect(sectionLabel(id, ru, ruStats)).toBe(label)
    })
})

describe('isOwnVisit', () => {
    const own: VisitBeacon = {
        lang: 'ru',
        role: 'backend',
        device: 'desktop',
        paint: 'lcp',
        paintMs: 84.3,
        loadMs: 301.7,
        js: 65331,
        sections: ['about', 'selling-points'],
        cta: ['telegram'],
    }
    // Так визит приходит из ленты: то же и время сервера
    const visit: Visit = { ...own, t: 1_790_000_000 }

    it('тот самый beacon', () => {
        expect(isOwnVisit(visit, own)).toBe(true)
    })

    it.each([
        ['другой замер', { paintMs: 84.4 }],
        ['другие секции', { sections: ['about'] }],
        ['другой клик', { cta: [] }],
        ['другая роль', { role: 'frontend' }],
    ])('%s — чужой визит', (_, change) => {
        expect(isOwnVisit({ ...visit, ...change }, own)).toBe(false)
    })

    it('эта вкладка ничего не отправляла — своих нет', () => {
        expect(isOwnVisit(visit, null)).toBe(false)
    })
})

describe('timeAgo', () => {
    // Строки — из ICU той версии Node, где идут тесты; проверяем выбор единицы и округление
    const ago = (lang: string, value: number, unit: Intl.RelativeTimeFormatUnit) =>
        new Intl.RelativeTimeFormat(lang, { style: 'short' }).format(-value, unit)

    it('первые секунды — «только что»', () => {
        expect(timeAgo(2, 'ru', ruStats.visits.justNow)).toBe('только что')
    })

    it.each([
        [12.7, 12, 'second'],
        [150, 2, 'minute'],
        [7200, 2, 'hour'],
        [3 * 86400 + 5, 3, 'day'],
    ] as const)('%s с → %s %s назад', (seconds, value, unit) => {
        expect(timeAgo(seconds, 'ru', ruStats.visits.justNow)).toBe(ago('ru', value, unit))
    })

    it('на языке страницы', () => {
        expect(timeAgo(12, 'en', enStats.visits.justNow)).toBe(ago('en', 12, 'second'))
    })
})

describe('форматы', () => {
    it('миллисекунды и секунды с разделителем языка', () => {
        expect(formatMs(84.6, ru)).toBe('85 мс')
        expect(formatMs(1234, ru)).toBe('1,2 с')
        expect(formatMs(1234, en)).toBe('1.2 s')
    })

    it('килобайты и мегабайты', () => {
        expect(formatKb(65331, ru)).toBe('64 КБ')
        expect(formatMb(12.44, ru, ruStats)).toBe('12,4 МБ')
    })

    it('сравнение с нормой — со склонением «раз»', () => {
        const ms = (value: number) => formatMs(value, ru)
        expect(vitalNote('lcp', 84, ruStats, 'ru', ms)).toBe('в 29 раз лучше нормы Google — 2,5 с')
        expect(vitalNote('lcp', 1100, ruStats, 'ru', ms)).toBe('в 2 раза лучше нормы Google — 2,5 с')
        expect(vitalNote('lcp', 119, ruStats, 'ru', ms)).toBe('в 21 раз лучше нормы Google — 2,5 с')
        expect(vitalNote('lcp', 1800, ruStats, 'ru', ms)).toBe('норма Google — 2,5 с')
        expect(vitalNote('dom', 335, ruStats, 'ru', String)).toBe('в 2 раза лучше нормы Lighthouse — 800')
        expect(vitalNote('lcp', 84, enStats, 'en', (value) => formatMs(value, en))).toBe(
            '29× better than the Google bar of 2.5 s',
        )
    })

    it('длительность: минуты или часы', () => {
        expect(formatDuration(75)).toBe('1:15')
        expect(formatDuration(3725)).toBe('1:02:05')
    })
})
