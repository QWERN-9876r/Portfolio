import { browser } from '$app/environment'
import { currentPaint, measurePage, type PageMetrics } from '$lib/pageMetrics'

// Метрики настоящих посетителей (сервис — deploy/rum). При уходе со страницы один beacon:
// замеры, какие секции посетитель увидел и по каким контактам кликнул. Уход — это и закрытие
// вкладки, и переход на другую страницу сайта (статистику): тогда визит виден в её ленте сразу.
// Без cookie, идентификаторов и IP; автотесты и боты (navigator.webdriver) не считаются.
// Локально (dev и preview) запросы уходят в локальный сервис через прокси Vite, не в прод

const ENDPOINT = '/api/rum'
// Меньше замеров — медиана случайна, в «Почему я» её не показываем
export const RUM_MIN_VISITORS = 10

const CTA: [RegExp, string][] = [
    [/^https:\/\/t\.me\//, 'telegram'],
    [/\/resume\/[^/]+\.pdf$/, 'resume'],
    [/^mailto:/, 'email'],
    // Раньше общего GitHub: проекты считаются отдельно — и сайт проекта, и его репозиторий
    [/^https:\/\/(qwern-9876r\.github\.io|github\.com\/QWERN-9876r)\/MangoScript\b/i, 'mangoscript'],
    [/^https:\/\/(qwern-9876r\.github\.io|github\.com\/QWERN-9876r)\/Mushrooms\b/i, 'mushrooms'],
    [/^https:\/\/github\.com\//, 'github'],
    [/^https:\/\/hh\.ru\//, 'hh'],
]

export interface VisitBeacon {
    lang: string
    role: string
    device: 'mobile' | 'desktop'
    paint?: 'lcp' | 'fcp'
    paintMs?: number
    loadMs?: number
    js?: number
    sections: string[]
    cta: string[]
}

// Что эта вкладка отправила последним — страница статистики узнаёт по нему «ваш» визит в ленте
let lastBeacon: VisitBeacon | null = null
export const sentBeacon = () => lastBeacon

export const startRum = (context: () => { lang: string; role: string }) => {
    if (!browser || navigator.webdriver || !('sendBeacon' in navigator)) return () => {}

    let metrics: PageMetrics | null = null
    measurePage().then((value) => (metrics = value))

    const cta = new Set<string>()
    const onClick = (event: MouseEvent) => {
        const href = (event.target as Element | null)?.closest?.('a[href]')?.getAttribute('href') ?? ''
        const match = CTA.find(([pattern]) => pattern.test(href))
        if (match) cta.add(match[1])
    }

    // Один раз: при уходе со страницы или первом сворачивании вкладки
    let sent = false
    const send = () => {
        if (sent) return
        sent = true
        const sections = [...document.querySelectorAll('#scroll-root > section[data-revealed]')].map((s) => s.id)
        // Отрисовку — на момент ухода: LCP мог уточниться после замера
        const paint = currentPaint()
        const beacon: VisitBeacon = {
            ...context(),
            device: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop',
            paint: paint?.kind,
            paintMs: paint?.ms,
            loadMs: metrics?.loadMs ?? undefined,
            js: metrics?.jsBytes ?? undefined,
            sections,
            cta: [...cta],
        }
        if (navigator.sendBeacon(ENDPOINT, JSON.stringify(beacon))) lastBeacon = beacon
    }
    const onVisibility = () => {
        if (document.visibilityState === 'hidden') send()
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('visibilitychange', onVisibility)
    addEventListener('pagehide', send)
    // Переход на другую страницу сайта — тоже уход
    return () => {
        send()
        document.removeEventListener('click', onClick, true)
        document.removeEventListener('visibilitychange', onVisibility)
        removeEventListener('pagehide', send)
    }
}

interface Stat {
    count: number
    p50: number
    p75: number
}

export interface RumSummary {
    days: number
    visitors: number
    lcp: Stat
    load: Stat
    js: Stat
}

// Медианы за последние дни; нет сервиса или мало замеров — null
export const fetchRumSummary = async (): Promise<RumSummary | null> => {
    try {
        const response = await fetch(`${ENDPOINT}/summary`)
        if (!response.ok) return null
        const summary = (await response.json()) as RumSummary
        return summary.visitors >= RUM_MIN_VISITORS ? summary : null
    } catch {
        return null
    }
}
