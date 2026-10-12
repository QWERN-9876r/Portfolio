// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveVisits } from './liveVisits.svelte'
import type { Visit } from './visits'

// Поддельный EventSource: тест сам присылает события и ошибки
class FakeEventSource {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSED = 2
    static instances: FakeEventSource[] = []

    readyState = FakeEventSource.CONNECTING
    onerror: (() => void) | null = null
    private listeners = new Map<string, (event: MessageEvent) => void>()

    constructor(public url: string) {
        FakeEventSource.instances.push(this)
    }
    addEventListener(type: string, listener: (event: MessageEvent) => void) {
        this.listeners.set(type, listener)
    }
    close() {
        this.readyState = FakeEventSource.CLOSED
    }
    emit(type: string, data: unknown) {
        this.readyState = FakeEventSource.OPEN
        this.listeners.get(type)?.(new MessageEvent(type, { data: JSON.stringify(data) }))
    }
    fail(readyState: number) {
        this.readyState = readyState
        this.onerror?.()
    }
}

const visit = (role: string): Visit => ({ t: 1_790_000_000, lang: 'ru', role, device: 'desktop', paintMs: 420 })
const last = () => FakeEventSource.instances.at(-1)!
const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
}

let feed: LiveVisits
let stop = () => {}

beforeEach(() => {
    // Таймауты подключения и повторы — по фейковым часам, иначе остались бы висеть после теста
    vi.useFakeTimers()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    feed = new LiveVisits()
    stop = feed.connect()
})

afterEach(() => {
    stop()
    setHidden(false)
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('LiveVisits', () => {
    it('подключается к живой ленте сервиса', () => {
        expect(last().url).toBe('/api/rum/live')
        expect(feed.status).toBe('connecting')
    })

    it('снимок: визиты, сколько всего и за сколько дней', () => {
        last().emit('snapshot', { days: 30, visitors: 127, visits: [visit('backend'), visit('frontend')] })

        expect(feed.status).toBe('live')
        expect(feed.visitors).toBe(127)
        expect(feed.items.map((item) => [item.visit.role, item.live])).toEqual([
            ['backend', false],
            ['frontend', false],
        ])
    })

    it('новый визит — сверху, помечен живым, счётчик растёт', () => {
        last().emit('snapshot', { days: 30, visitors: 1, visits: [visit('backend')] })
        last().emit('visit', visit('fullstack'))

        expect(feed.items[0]).toMatchObject({ live: true, visit: { role: 'fullstack' } })
        expect(feed.visitors).toBe(2)
        expect(feed.lastVisitAt).not.toBeNull()
        // У каждого свой номер для {#each}, даже если визиты одинаковые
        expect(new Set(feed.items.map((item) => item.id)).size).toBe(2)
    })

    it('в ленте не больше 30 визитов', () => {
        last().emit('snapshot', { days: 30, visitors: 30, visits: Array.from({ length: 30 }, () => visit('backend')) })
        last().emit('visit', visit('fullstack'))

        expect(feed.items).toHaveLength(30)
        expect(feed.items[0].visit.role).toBe('fullstack')
    })

    it('сервер не ответил ни разу — сервис недоступен, новая попытка через 30 с', () => {
        const first = last()
        first.fail(FakeEventSource.CONNECTING)

        expect(feed.status).toBe('offline')
        // Браузер не долбит лежащий сервер переподключениями
        expect(first.readyState).toBe(FakeEventSource.CLOSED)
        vi.advanceTimersByTime(29_999)
        expect(FakeEventSource.instances).toHaveLength(1)
        vi.advanceTimersByTime(1)
        expect(FakeEventSource.instances).toHaveLength(2)
        expect(feed.status).toBe('connecting')
    })

    it('обрыв посреди эфира — браузер переподключается сам, закрытый поток — сервис недоступен', () => {
        last().emit('snapshot', { days: 30, visitors: 1, visits: [visit('backend')] })
        last().fail(FakeEventSource.CONNECTING)
        expect(feed.status).toBe('connecting')
        expect(FakeEventSource.instances).toHaveLength(1)

        last().fail(FakeEventSource.CLOSED)
        expect(feed.status).toBe('offline')
    })

    it('сервер молчит — через 10 с сервис недоступен, соединение закрыто', () => {
        const first = last()
        vi.advanceTimersByTime(9_999)
        expect(feed.status).toBe('connecting')
        vi.advanceTimersByTime(1)

        expect(feed.status).toBe('offline')
        expect(first.readyState).toBe(FakeEventSource.CLOSED)
    })

    it('снимок пришёл — таймаут подключения не срабатывает', () => {
        last().emit('snapshot', { days: 30, visitors: 1, visits: [visit('backend')] })
        vi.advanceTimersByTime(60_000)

        expect(feed.status).toBe('live')
        expect(FakeEventSource.instances).toHaveLength(1)
    })

    it('свёрнутая вкладка не ждёт новой попытки', () => {
        last().fail(FakeEventSource.CONNECTING)
        setHidden(true)
        vi.advanceTimersByTime(60_000)

        expect(FakeEventSource.instances).toHaveLength(1)
    })

    it('свёрнутая вкладка не держит соединение, при возврате — новое', () => {
        const first = last()
        setHidden(true)
        expect(first.readyState).toBe(FakeEventSource.CLOSED)

        setHidden(false)
        expect(FakeEventSource.instances).toHaveLength(2)
        expect(feed.status).toBe('connecting')
    })

    it('после остановки соединение закрыто', () => {
        stop()
        expect(last().readyState).toBe(FakeEventSource.CLOSED)
        setHidden(false)
        expect(FakeEventSource.instances).toHaveLength(1)
    })
})
