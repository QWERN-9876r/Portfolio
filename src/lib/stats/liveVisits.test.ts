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
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    feed = new LiveVisits()
    stop = feed.connect()
})

afterEach(() => {
    stop()
    setHidden(false)
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

    it('обрыв — переподключение, закрытый поток — сервис недоступен', () => {
        last().fail(FakeEventSource.CONNECTING)
        expect(feed.status).toBe('connecting')
        last().fail(FakeEventSource.CLOSED)
        expect(feed.status).toBe('offline')
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
