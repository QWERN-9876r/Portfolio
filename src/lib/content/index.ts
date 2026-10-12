import { building } from '$app/environment'
import type { Locale } from '$lib/i18n/translations'
import { withBase } from '$lib/site'
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

// Контент и часть иконок — в бакете; сайт берёт их при сборке, браузер в бакет не ходит
export const STORAGE_ORIGIN = 'https://storage.yandexcloud.net/qwern-9876r'

// Иконка из контента → адрес на сайте. Иконки из бакета (/api/storage/*) лежат копией
// в /storage/* (routes/storage): так их пиксели может читать canvas (three/iconColor.ts)
export const iconUrl = (icon: string) =>
    /^https?:\/\//.test(icon) ? icon : withBase(icon.replace(/^\/api\/storage\//, '/storage/'))

// Бакет с раннеров GitHub иногда не отвечает: сетевую ошибку и 5xx пробуем ещё дважды
const ATTEMPTS = 3
const RETRY_MS = 1000

const fetchJson = async (fetchFn: typeof fetch, url: string) => {
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetchFn(url)
            if (res.ok) return await res.json()
            if (res.status < 500 || attempt === ATTEMPTS) throw new Error(`${res.status} ${url}`)
        } catch (err) {
            const network = err instanceof TypeError
            if (!network || attempt === ATTEMPTS) throw err
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS))
    }
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
                const reason = err instanceof Error ? err.message : String(err)
                // Выкладка из CI с данными по умолчанию (там кейсы только по-русски) хуже,
                // чем упавшая: на сайте остаётся прошлая версия
                if (building && process.env.CI) throw new Error(`[content] ${url} недоступен: ${reason}`)
                console.warn(`[content] ${url} недоступен, беру данные по умолчанию:`, reason)
                return [key, DEFAULTS[key]]
            }
        }),
    )

    return Object.fromEntries(entries) as Content
}
