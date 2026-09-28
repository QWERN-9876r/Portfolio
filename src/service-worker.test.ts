import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$service-worker', () => ({
    version: '2',
    build: ['/_app/immutable/entry/start.js', '/_app/immutable/nodes/1.js'],
    files: ['/icons/react.svg'],
    prerendered: ['/', '/en', '/ru'],
}))

const ORIGIN = 'https://qwern9876r.ru'
const CACHE = 'cache-2'

// Браузер вокруг воркера: HTTP-кэш, сеть и Cache Storage
let httpCache: Map<string, string>
let network: Map<string, string> | null // null — нет сети
let storage: Map<string, Map<string, Response>>
let listeners: Map<string, (event: unknown) => void>
let claim: ReturnType<typeof vi.fn>

const pathOf = (input: RequestInfo | URL) => new URL(input instanceof Request ? input.url : input, ORIGIN).pathname

const cacheFor = (entries: Map<string, Response>) => ({
    put: async (key: RequestInfo | URL, response: Response) => void entries.set(pathOf(key), response),
    match: async (key: RequestInfo | URL) => entries.get(pathOf(key))?.clone(),
})

const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = pathOf(input)
    if (init?.cache === 'only-if-cached') {
        const body = httpCache.get(path)
        if (body === undefined) throw new TypeError('not in HTTP cache')
        return new Response(body)
    }
    if (!network) throw new TypeError('Failed to fetch')
    const body = network.get(path)
    return body === undefined ? new Response('Not Found', { status: 404 }) : new Response(body)
})

const cached = async (path: string) => (await storage.get(CACHE)?.get(path)?.clone().text()) ?? null

const lifecycle = async (type: 'install' | 'activate') => {
    let done: Promise<unknown> = Promise.resolve()
    listeners.get(type)!({ waitUntil: (promise: Promise<unknown>) => (done = promise) })
    await done
}

// Ответ воркера; undefined — запрос идёт мимо него, как без воркера
const request = async (path: string, init: RequestInit & { mode?: RequestMode } = {}) => {
    let response: Promise<Response> | undefined
    const { mode, ...rest } = init
    const req = new Request(new URL(path, ORIGIN), rest)
    // mode у Request в Node не задать — navigate бывает только у переходов браузера
    if (mode) Object.defineProperty(req, 'mode', { value: mode })
    listeners.get('fetch')!({ request: req, respondWith: (value: Promise<Response>) => (response = value) })
    return response
}

beforeEach(async () => {
    httpCache = new Map()
    network = new Map([
        ['/en', 'en v2'],
        ['/ru', 'ru v2'],
        ['/_app/immutable/entry/start.js', 'start'],
    ])
    storage = new Map([['cache-1', new Map()]])
    listeners = new Map()
    claim = vi.fn(async () => {})

    vi.stubGlobal('fetch', fakeFetch)
    vi.stubGlobal('caches', {
        open: async (name: string) => {
            if (!storage.has(name)) storage.set(name, new Map())
            return cacheFor(storage.get(name)!)
        },
        keys: async () => [...storage.keys()],
        delete: async (name: string) => storage.delete(name),
    })
    vi.stubGlobal('self', {
        location: { origin: ORIGIN },
        clients: { claim },
        addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    })
    vi.stubEnv('DEV', false)
    fakeFetch.mockClear()
    // В воркере относительный адрес считается от его location, в Node нужен полный
    const redirect = Response.redirect
    vi.spyOn(Response, 'redirect').mockImplementation((url, status) => redirect(new URL(url, ORIGIN), status))

    // Путь не литералом: иначе TypeScript втянет воркер с его lib webworker в общую проверку
    // типов, а SvelteKit держит его отдельно — у DOM и воркера разные глобальные типы
    const worker = './service-worker'
    vi.resetModules()
    await import(/* @vite-ignore */ worker)
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

describe('установка и активация', () => {
    it('в кэш — только то, что браузер уже скачал, без запросов в сеть', async () => {
        httpCache.set('/en', 'en v2').set('/_app/immutable/entry/start.js', 'start')
        await lifecycle('install')

        expect(await cached('/en')).toBe('en v2')
        expect(await cached('/_app/immutable/entry/start.js')).toBe('start')
        expect(await cached('/ru')).toBeNull()
        expect(fakeFetch.mock.calls.every(([, init]) => init?.cache === 'only-if-cached')).toBe(true)
    })

    it('корень — редирект, его не кэшируем', async () => {
        httpCache.set('/', 'redirect')
        await lifecycle('install')
        expect(await cached('/')).toBeNull()
    })

    it('скачанное, пока воркер устанавливался, попадает в кэш при активации', async () => {
        httpCache.set('/en', 'en v2')
        await lifecycle('install')
        // Страница догружает модули и иконки, а воркер ещё не управляет ею
        httpCache.set('/_app/immutable/nodes/1.js', 'error page').set('/icons/react.svg', '<svg/>')
        await lifecycle('activate')

        expect(await cached('/_app/immutable/nodes/1.js')).toBe('error page')
        expect(await cached('/icons/react.svg')).toBe('<svg/>')
    })

    it('при активации — кэш прошлой сборки удалён, открытая страница под воркером', async () => {
        await lifecycle('install')
        await lifecycle('activate')

        expect([...storage.keys()]).toEqual([CACHE])
        expect(claim).toHaveBeenCalled()
    })
})

describe('запросы', () => {
    beforeEach(() => lifecycle('install'))

    it('страница — из сети, свежая после выкладки; копия остаётся в кэше', async () => {
        storage.get(CACHE)!.set('/en', new Response('en v1'))

        expect(await (await request('/en', { mode: 'navigate' }))!.text()).toBe('en v2')
        expect(await cached('/en')).toBe('en v2')
    })

    it('без сети страница — из кэша', async () => {
        storage.get(CACHE)!.set('/ru', new Response('ru v1'))
        network = null

        expect(await (await request('/ru', { mode: 'navigate' }))!.text()).toBe('ru v1')
    })

    it('без сети корень ведёт на язык из кэша, английский первым', async () => {
        storage.get(CACHE)!.set('/ru', new Response('ru')).set('/en', new Response('en'))
        network = null

        const response = await request('/', { mode: 'navigate' })
        expect(response!.status).toBe(302)
        expect(response!.headers.get('location')).toBe(`${ORIGIN}/en`)
    })

    it('без сети и без копии — ошибка сети, как без воркера', async () => {
        network = null
        await expect(request('/ru', { mode: 'navigate' })).rejects.toThrow('Failed to fetch')
    })

    it('файлы с хешем — из кэша без сети, промах сохраняется', async () => {
        const first = await request('/_app/immutable/entry/start.js')
        expect(await first!.text()).toBe('start')
        network = null

        expect(await (await request('/_app/immutable/entry/start.js'))!.text()).toBe('start')
    })

    it('ошибки сервера не кэшируются', async () => {
        expect((await request('/_app/immutable/nodes/404.js'))!.status).toBe(404)
        expect(await cached('/_app/immutable/nodes/404.js')).toBeNull()
    })

    it.each([
        ['метрики посетителей', '/api/rum/summary', {}],
        ['beacon', '/api/rum', { method: 'POST' }],
        ['не GET', '/en', { method: 'POST' }],
        ['чужой сайт', 'https://t.me/Qwern_9876r', {}],
    ])('%s — мимо воркера', async (_, path, init) => {
        expect(await request(path, init)).toBeUndefined()
    })

    it('в dev ничего не кэшируется', async () => {
        vi.stubEnv('DEV', true)
        expect(await request('/_app/immutable/entry/start.js')).toBeUndefined()
    })
})
