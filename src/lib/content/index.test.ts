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
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
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
        vi.useFakeTimers()
        const { loadContent } = await load()
        const techGroups = [{ title: 'из бакета' }]
        const fetchFn = vi.fn(async (url: string | URL | Request) => {
            const path = String(url)
            if (path.endsWith('/cases.json')) return new Response('Not Found', { status: 404 })
            if (path.endsWith('/experience.json')) throw new TypeError('fetch failed')
            if (path.endsWith('/techGroups.json')) return json(techGroups)
            return new Response('{битый json')
        })

        const pending = loadContent(fetchFn as typeof fetch, 'en')
        await vi.runAllTimersAsync()
        const content = await pending

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

describe('бакет не ответил', () => {
    it('сетевую ошибку и 5xx пробует ещё раз, 404 — нет', async () => {
        vi.useFakeTimers()
        const { loadContent } = await load()
        const calls: Record<string, number> = {}
        const fetchFn = vi.fn(async (url: string | URL | Request) => {
            const name = String(url).split('/').pop()!
            calls[name] = (calls[name] ?? 0) + 1
            if (name === 'cases.json') return new Response('Not Found', { status: 404 })
            if (name === 'experience.json' && calls[name] < 3) throw new TypeError('fetch failed')
            if (name === 'techGroups.json' && calls[name] < 2) return new Response(null, { status: 503 })
            return json([])
        })

        const pending = loadContent(fetchFn as typeof fetch, 'en')
        await vi.runAllTimersAsync()
        const content = await pending

        expect(calls).toEqual({
            'cases.json': 1,
            'experience.json': 3,
            'techGroups.json': 2,
            'allTechnologies.json': 1,
        })
        expect(content.cases).toEqual(DEFAULT_CASES)
        expect(content.experience).toEqual([])
    })

    it('сборка в CI падает, а не выкладывает данные по умолчанию', async () => {
        env.building = true
        vi.stubEnv('CI', 'true')
        const { loadContent } = await load()
        const fetchFn = vi.fn(async () => new Response('Not Found', { status: 404 }))

        await expect(loadContent(fetchFn, 'en')).rejects.toThrow('недоступен')
    })
})

describe('iconUrl', () => {
    it('иконки сайта и копии из бакета — с base, внешние — как есть', async () => {
        const { iconUrl } = await load()

        expect(iconUrl('/icons/react.svg')).toBe('/Portfolio/icons/react.svg')
        expect(iconUrl('/api/storage/pixi.png')).toBe('/Portfolio/storage/pixi.png')
        expect(iconUrl('https://cdn.example.com/x.svg')).toBe('https://cdn.example.com/x.svg')
    })
})
