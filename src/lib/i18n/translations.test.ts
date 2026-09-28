import { describe, expect, it } from 'vitest'
import { match as langParam } from '../../params/lang'
import { statsTranslations } from './stats'
import { isLocale, LOCALES, translations } from './translations'

// Словари с произвольными ключами: подписи из cases.json переводятся выборочно
const DICTIONARIES = new Set(['cases.resultLabels', 'cases.resultHints'])
const PLURAL_CATEGORIES = new Set<string>(['zero', 'one', 'two', 'few', 'many', 'other'])

type Leaf = { kind: 'text'; value: string } | { kind: 'plural'; forms: Record<string, string> }

const isPlural = (value: object) =>
    'other' in value && Object.keys(value).every((key) => PLURAL_CATEGORIES.has(key))

// Все строки перевода по путям: «whyMe.metrics.lcp», «sellingPoints.0.title»
const flatten = (value: unknown, path = '', out = new Map<string, Leaf>()) => {
    if (typeof value === 'string') out.set(path, { kind: 'text', value })
    else if (value && typeof value === 'object') {
        if (DICTIONARIES.has(path)) return out
        if (isPlural(value)) out.set(path, { kind: 'plural', forms: value as Record<string, string> })
        else for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, out)
    }
    return out
}

const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(([name]) => name).sort()

describe('языки', () => {
    it('isLocale и маршрут /[lang]', () => {
        for (const lang of LOCALES) {
            expect(isLocale(lang)).toBe(true)
            expect(langParam(lang)).toBe(true)
        }
        for (const value of ['de', 'EN', '', null, undefined]) expect(isLocale(value)).toBe(false)
        expect(langParam('de')).toBe(false)
    })
})

// Основные строки и строки страницы /stats (отдельный модуль) проверяются одинаково
describe.each([
    ['переводы', translations],
    ['строки /stats', statsTranslations],
] as const)('%s', (_, strings: Record<(typeof LOCALES)[number], object>) => {
    const [base, ...others] = LOCALES
    const baseLeaves = flatten(strings[base])

    it.each(others)(`у %s те же строки, что у ${base}`, (lang) => {
        expect([...flatten(strings[lang]).keys()].sort()).toEqual([...baseLeaves.keys()].sort())
    })

    it.each(others)(`у %s те же подстановки {…}, что у ${base}`, (lang) => {
        const leaves = flatten(strings[lang])
        for (const [path, leaf] of baseLeaves) {
            const other = leaves.get(path)
            if (leaf.kind === 'text' && other?.kind === 'text') {
                expect(placeholders(other.value), path).toEqual(placeholders(leaf.value))
            }
        }
    })

    it.each(LOCALES)('%s: пустых строк нет', (lang) => {
        for (const [path, leaf] of flatten(strings[lang])) {
            const texts = leaf.kind === 'text' ? [leaf.value] : Object.values(leaf.forms)
            for (const text of texts) expect(text.trim(), path).not.toBe('')
        }
    })

    // Без нужной формы LiveMetrics возьмёт other: «у 5 посетителя»
    it.each(LOCALES)('%s: формы множественного числа — на все случаи языка', (lang) => {
        const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
        for (const [path, leaf] of flatten(strings[lang])) {
            if (leaf.kind === 'plural') expect(Object.keys(leaf.forms).sort(), path).toEqual([...categories].sort())
        }
    })
})
