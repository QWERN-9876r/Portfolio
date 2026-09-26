import { browser, dev } from '$app/environment'
import { currentPaint, measurePage, type PageMetrics } from '$lib/pageMetrics'

// Метрики настоящих посетителей (сервис — deploy/rum). При уходе со страницы один beacon:
// замеры, какие секции посетитель увидел и по каким контактам кликнул.
// Без cookie, идентификаторов и IP; автотесты и боты (navigator.webdriver) не считаются

const ENDPOINT = '/api/rum'
// Меньше замеров — медиана случайна, в «Почему я» её не показываем
export const RUM_MIN_VISITORS = 10

const CTA: [RegExp, string][] = [
    [/^https:\/\/t\.me\//, 'telegram'],
    [/\/resume\/[^/]+\.pdf$/, 'resume'],
    [/^mailto:/, 'email'],
    [/^https:\/\/github\.com\//, 'github'],
    [/^https:\/\/hh\.ru\//, 'hh'],
]

export const startRum = (context: () => { lang: string; role: string }) => {
    if (!browser || dev || navigator.webdriver || !('sendBeacon' in navigator)) return () => {}

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
        navigator.sendBeacon(
            ENDPOINT,
            JSON.stringify({
                ...context(),
                device: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop',
                paint: paint?.kind,
                paintMs: paint?.ms,
                loadMs: metrics?.loadMs ?? undefined,
                js: metrics?.jsBytes ?? undefined,
                sections,
                cta: [...cta],
            }),
        )
    }
    const onVisibility = () => {
        if (document.visibilityState === 'hidden') send()
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('visibilitychange', onVisibility)
    addEventListener('pagehide', send)
    return () => {
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

// Медианы за последние дни; нет сервиса или мало замеров — null.
// В dev не спрашиваем вовсе, как и не отправляем: сервис проверяют через preview
export const fetchRumSummary = async (): Promise<RumSummary | null> => {
    if (dev) return null
    try {
        const response = await fetch(`${ENDPOINT}/summary`)
        if (!response.ok) return null
        const summary = (await response.json()) as RumSummary
        return summary.visitors >= RUM_MIN_VISITORS ? summary : null
    } catch {
        return null
    }
}
