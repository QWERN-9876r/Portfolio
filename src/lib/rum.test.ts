// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRumSummary, RUM_MIN_VISITORS, sentBeacon, startRum } from './rum'

vi.mock('$app/environment', () => ({ browser: true, building: false, dev: false }))

const metrics = vi.hoisted(() => ({
    measured: { paint: { kind: 'lcp', ms: 420 }, loadMs: 900, jsBytes: 63000 } as const,
    paint: { kind: 'lcp', ms: 450 } as { kind: 'lcp' | 'fcp'; ms: number } | null,
}))
vi.mock('$lib/pageMetrics', () => ({
    measurePage: () => Promise.resolve(metrics.measured),
    currentPaint: () => metrics.paint,
}))

// Поля, которые принимает сервис (Event в deploy/rum/main.go)
const SERVICE_FIELDS = ['lang', 'role', 'device', 'paint', 'paintMs', 'loadMs', 'js', 'sections', 'cta']

const sendBeacon = vi.fn((_url: string, _body: string) => true)
const flush = () => new Promise((resolve) => setTimeout(resolve))
const beacons = () => sendBeacon.mock.calls.map(([url, body]) => ({ url, event: JSON.parse(body) }))
const setNavigator = (key: string, value: unknown) =>
    Object.defineProperty(navigator, key, { value, configurable: true })

const click = (selector: string) =>
    document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
const leave = () => dispatchEvent(new Event('pagehide'))

let stop = () => {}

beforeEach(() => {
    setNavigator('webdriver', false)
    setNavigator('sendBeacon', sendBeacon)
    metrics.paint = { kind: 'lcp', ms: 450 }
    document.body.innerHTML = `
        <main id="scroll-root">
            <section id="hero" data-revealed></section>
            <section id="about" data-revealed></section>
            <section id="case-1" data-revealed><div><section id="nested" data-revealed></section></div></section>
            <section id="experience"></section>
        </main>
        <a id="tg" href="https://t.me/Qwern_9876r"><span>Telegram</span></a>
        <a id="pdf" href="/resume/dmitry-sotnikov-ru.pdf">PDF</a>
        <a id="mail" href="mailto:me@example.com">Email</a>
        <a id="gh" href="https://github.com/QWERN-9876r">GitHub</a>
        <a id="mango-docs" href="https://qwern-9876r.github.io/MangoScript/ru/">Документация</a>
        <a id="mango-repo" href="https://github.com/QWERN-9876r/MangoScript">MangoScript</a>
        <a id="hh" href="https://hh.ru/resume/123">hh</a>
        <a id="other" href="https://example.com">Другой сайт</a>
        <a id="case" href="#case-1">Кейс</a>`
    // Ссылки никуда не переходят: проверяем только, что их клики посчитаны
    document.addEventListener('click', (event) => event.preventDefault())
})

afterEach(() => {
    stop()
    sendBeacon.mockClear()
    vi.unstubAllGlobals()
})

describe('startRum', () => {
    it('при уходе — один beacon с контекстом, замерами и увиденными секциями', async () => {
        stop = startRum(() => ({ lang: 'ru', role: 'backend' }))
        await flush()
        leave()

        expect(beacons()).toEqual([
            {
                url: '/api/rum',
                event: {
                    lang: 'ru',
                    role: 'backend',
                    device: 'desktop',
                    // Отрисовка — на момент ухода: LCP мог уточниться после замера
                    paint: 'lcp',
                    paintMs: 450,
                    loadMs: 900,
                    js: 63000,
                    sections: ['hero', 'about', 'case-1'],
                    cta: [],
                },
            },
        ])
        expect(SERVICE_FIELDS).toEqual(expect.arrayContaining(Object.keys(beacons()[0].event)))
    })

    it('контакты распознаются по ссылке, повторы и чужие ссылки не считаются', async () => {
        stop = startRum(() => ({ lang: 'en', role: 'frontend' }))
        for (const id of ['tg span', 'pdf', 'mail', 'gh', 'hh', 'tg', 'other', 'case', 'mango-docs', 'mango-repo'])
            click(`#${id}`)
        leave()

        expect(beacons()[0].event.cta).toEqual(['telegram', 'resume', 'email', 'github', 'hh', 'mangoscript'])
    })

    it('отправляется один раз: и свёрнутая вкладка, и уход', async () => {
        stop = startRum(() => ({ lang: 'en', role: 'frontend' }))
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
        leave()
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

        expect(sendBeacon).toHaveBeenCalledTimes(1)
    })

    it('ушли до замеров — только то, что уже известно; телефон — по грубому указателю', () => {
        metrics.paint = null
        vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }))
        stop = startRum(() => ({ lang: 'en', role: 'fullstack' }))
        leave()

        const { event } = beacons()[0]
        expect(event.device).toBe('mobile')
        expect(event).not.toHaveProperty('paint')
        expect(event).not.toHaveProperty('loadMs')
        expect(event).not.toHaveProperty('js')
    })

    it('автотесты и боты не считаются', () => {
        setNavigator('webdriver', true)
        stop = startRum(() => ({ lang: 'en', role: 'frontend' }))
        leave()

        expect(sendBeacon).not.toHaveBeenCalled()
    })

    it('переход на другую страницу сайта — тоже уход: beacon один, дальше тишина', () => {
        startRum(() => ({ lang: 'en', role: 'frontend' }))()
        leave()
        document.dispatchEvent(new Event('visibilitychange'))

        expect(sendBeacon).toHaveBeenCalledTimes(1)
    })

    it('отправленный визит помнится — по нему статистика узнаёт «ваш» визит', async () => {
        stop = startRum(() => ({ lang: 'ru', role: 'backend' }))
        await flush()
        leave()

        expect(sentBeacon()).toEqual(beacons()[0].event)
    })

    it('браузер не принял beacon — помнить нечего', () => {
        const previous = sentBeacon()
        sendBeacon.mockReturnValueOnce(false)
        stop = startRum(() => ({ lang: 'en', role: 'fullstack' }))
        leave()

        expect(sentBeacon()).toBe(previous)
    })
})

describe('fetchRumSummary', () => {
    const summary = (visitors: number) => ({
        days: 30,
        visitors,
        lcp: { count: visitors, p50: 420, p75: 600 },
        load: { count: visitors, p50: 900, p75: 1200 },
        js: { count: visitors, p50: 63000, p75: 64000 },
    })

    it(`сводка, когда визитов не меньше ${RUM_MIN_VISITORS}`, async () => {
        const fetchMock = vi.fn(async (_url: string) => Response.json(summary(RUM_MIN_VISITORS)))
        vi.stubGlobal('fetch', fetchMock)

        expect(await fetchRumSummary()).toEqual(summary(RUM_MIN_VISITORS))
        expect(fetchMock).toHaveBeenCalledWith('/api/rum/summary')
    })

    it('мало визитов — медиана случайна, не показываем', async () => {
        vi.stubGlobal('fetch', async () => Response.json(summary(RUM_MIN_VISITORS - 1)))
        expect(await fetchRumSummary()).toBeNull()
    })

    it.each([
        ['сервис не выложен', async () => new Response('Not Found', { status: 404 })],
        ['nginx без сервиса', async () => new Response('Bad Gateway', { status: 502 })],
        ['нет сети', async () => Promise.reject(new TypeError('offline'))],
        ['не JSON', async () => new Response('<html>')],
    ])('%s — null без ошибки', async (_, fetchMock) => {
        vi.stubGlobal('fetch', fetchMock)
        expect(await fetchRumSummary()).toBeNull()
    })
})
