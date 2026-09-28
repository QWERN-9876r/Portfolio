import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CASES } from './cases'
import { DEFAULT_EXPERIENCE } from './experience'

const env = vi.hoisted(() => ({ building: false }))
vi.mock('$app/environment', () => env)

const BUCKET = 'https://storage.yandexcloud.net/qwern-9876r'
const json = (body: unknown) => new Response(JSON.stringify(body))

// Кэш сборки живёт в модуле — каждому тесту свежий
const load = () => import('./index')

beforeEach(() => {
    vi.resetModules()
    env.building = false
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe('loadContent', () => {
    it('все четыре файла — из бакета, для своего языка', async () => {
        const { loadContent } = await load()
        const fetchFn = vi.fn(async (url: string | URL | Request) => json({ from: String(url) }))

        const content = await loadContent(fetchFn as typeof fetch, 'ru')

        expect(fetchFn.mock.calls.map(([url]) => url).sort()).toEqual([
            `${BUCKET}/ru/allTechnologies.json`,
            `${BUCKET}/ru/cases.json`,
            `${BUCKET}/ru/experience.json`,
            `${BUCKET}/ru/techGroups.json`,
        ])
        expect(content.cases).toEqual({ from: `${BUCKET}/ru/cases.json` })
    })

    it('недоступный файл заменяется данными по умолчанию, остальные — из бакета', async () => {
        const { loadContent } = await load()
        const techGroups = [{ title: 'из бакета' }]
        const fetchFn = vi.fn(async (url: string | URL | Request) => {
            const path = String(url)
            if (path.endsWith('/cases.json')) return new Response('Not Found', { status: 404 })
            if (path.endsWith('/experience.json')) throw new TypeError('fetch failed')
            if (path.endsWith('/techGroups.json')) return json(techGroups)
            return new Response('{битый json')
        })

        const content = await loadContent(fetchFn as typeof fetch, 'en')

        expect(content.cases).toEqual(DEFAULT_CASES)
        expect(content.experience).toEqual(DEFAULT_EXPERIENCE)
        expect(content.techGroups).toEqual(techGroups)
        expect(console.warn).toHaveBeenCalledTimes(3)
    })

    it('при сборке язык качается один раз на все страницы ролей', async () => {
        env.building = true
        const { loadContent } = await load()
        const fetchFn = vi.fn(async () => json([]))

        const pages = await Promise.all([
            loadContent(fetchFn, 'en'),
            loadContent(fetchFn, 'en'),
            loadContent(fetchFn, 'en'),
            loadContent(fetchFn, 'ru'),
        ])

        expect(fetchFn).toHaveBeenCalledTimes(8)
        expect(pages[0]).toBe(pages[2])
    })

    it('в dev не кэшируется: правки в бакете видны сразу', async () => {
        const { loadContent } = await load()
        const fetchFn = vi.fn(async () => json([]))

        await loadContent(fetchFn, 'en')
        await loadContent(fetchFn, 'en')

        expect(fetchFn).toHaveBeenCalledTimes(8)
    })
})

describe('refreshContent', () => {
    it('только изменившиеся файлы, через прокси и мимо HTTP-кэша', async () => {
        const { refreshContent } = await load()
        const current = {
            techGroups: [],
            cases: DEFAULT_CASES,
            experience: DEFAULT_EXPERIENCE,
            allTechnologies: [],
        }
        const newCases = [{ ...DEFAULT_CASES[0], title: 'Новый заголовок' }]
        const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
            const path = String(url)
            if (path.endsWith('/cases.json')) return json(newCases)
            if (path.endsWith('/experience.json')) return json(DEFAULT_EXPERIENCE)
            if (path.endsWith('/techGroups.json')) return new Response(null, { status: 502 })
            throw new TypeError('offline')
        })
        vi.stubGlobal('fetch', fetchMock)

        expect(await refreshContent('ru', current)).toEqual({ cases: newCases })
        expect(fetchMock).toHaveBeenCalledWith('/api/storage/ru/cases.json', { cache: 'no-cache' })
    })
})
