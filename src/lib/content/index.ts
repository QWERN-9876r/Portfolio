import { building } from '$app/environment'
import type { Locale } from '$lib/i18n/translations'
import { DEFAULT_ALL_TECHNOLOGIES, type Tech } from './allTechnologies'
import { DEFAULT_CASES, type CaseItem } from './cases'
import { DEFAULT_EXPERIENCE, type ExperienceData } from './experience'
import { DEFAULT_TECH_GROUPS, type TechGroup } from './techGroups'

export type { Tech } from './allTechnologies'
export type { CaseItem, CaseLink, CaseResult, CaseStep } from './cases'
export { findResult } from './cases'
export type { ExperienceData, ExperienceItem } from './experience'
export { overlaps, parsePeriod, roleAnchor, splitRole, type Period } from './experience'
export type { TechGroup, TechGroupItem, Preset } from './techGroups'

export interface Content {
    techGroups: TechGroup[]
    cases: CaseItem[]
    experience: ExperienceData
    allTechnologies: Tech[]
}

type ContentKey = keyof Content

const FILES: Record<ContentKey, string> = {
    techGroups: 'techGroups.json',
    cases: 'cases.json',
    experience: 'experience.json',
    allTechnologies: 'allTechnologies.json',
}

const DEFAULTS: Content = {
    techGroups: DEFAULT_TECH_GROUPS,
    cases: DEFAULT_CASES,
    experience: DEFAULT_EXPERIENCE,
    allTechnologies: DEFAULT_ALL_TECHNOLOGIES,
}

const KEYS = Object.keys(FILES) as ContentKey[]

// При сборке — напрямую из бакета: vite-прокси на серверный fetch не действует
const STORAGE_ORIGIN = 'https://storage.yandexcloud.net/qwern-9876r'
// В браузере — через прокси (vite в dev, nginx в проде)
const STORAGE_PROXY = '/api/storage'

const fetchJson = async (fetchFn: typeof fetch, url: string, init?: RequestInit) => {
    const res = await fetchFn(url, init)
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return res.json()
}

// При сборке один язык пререндерится трижды (по странице на роль) — качаем один раз.
// В dev не кэшируем, чтобы правки в бакете были видны сразу
const buildCache = new Map<Locale, Promise<Content>>()

export const loadContent = (fetchFn: typeof fetch, lang: Locale): Promise<Content> => {
    if (!building) return fetchContent(fetchFn, lang)

    let content = buildCache.get(lang)
    if (!content) {
        content = fetchContent(fetchFn, lang)
        buildCache.set(lang, content)
    }
    return content
}

const fetchContent = async (fetchFn: typeof fetch, lang: Locale): Promise<Content> => {
    const entries = await Promise.all(
        KEYS.map(async (key) => {
            const url = `${STORAGE_ORIGIN}/${lang}/${FILES[key]}`
            try {
                return [key, await fetchJson(fetchFn, url)]
            } catch (err) {
                console.warn(
                    `[content] ${url} недоступен, беру данные по умолчанию:`,
                    err instanceof Error ? err.message : err,
                )
                return [key, DEFAULTS[key]]
            }
        }),
    )

    return Object.fromEntries(entries) as Content
}

// Возвращает только файлы, которые изменились в бакете после сборки
export const refreshContent = async (lang: Locale, current: Content): Promise<Partial<Content>> => {
    const changed = await Promise.all(
        KEYS.map(async (key) => {
            try {
                const fresh = await fetchJson(fetch, `${STORAGE_PROXY}/${lang}/${FILES[key]}`, {
                    cache: 'no-cache',
                })
                return JSON.stringify(fresh) === JSON.stringify(current[key]) ? null : [key, fresh]
            } catch {
                return null
            }
        }),
    )

    return Object.fromEntries(changed.filter((entry) => entry !== null))
}
