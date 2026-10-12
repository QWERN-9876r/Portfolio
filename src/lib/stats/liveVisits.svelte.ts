import { rumUrl } from '$lib/site'
import type { Visit } from './visits'

// Живая лента визитов из сервиса метрик (deploy/rum, /api/rum/live — Server-Sent Events):
// при подключении — последние визиты, дальше — каждый новый, как только сервис его записал

const LIMIT = 30
// Сервер не ответил ни разу — не переподключаемся каждые несколько секунд, как сделал бы
// браузер, а пробуем снова через полминуты: страница статистики работает и без сервиса
const OFFLINE_RETRY_MS = 30_000
// Сервер может и молчать (файрвол без ответа): браузер ждал бы TCP-таймаута минутами
const CONNECT_TIMEOUT_MS = 10_000

export type LiveStatus = 'connecting' | 'live' | 'offline'

export interface FeedItem {
    // Свой номер: у двух визитов в одну секунду всё может совпасть
    id: number
    visit: Visit
    // Пришёл, пока страница открыта, — а не был в ленте при подключении
    live: boolean
}

interface Snapshot {
    days: number
    visitors: number
    visits: Visit[]
}

export class LiveVisits {
    status = $state<LiveStatus>('connecting')
    items = $state.raw<FeedItem[]>([])
    visitors = $state<number | null>(null)
    days = $state(30)
    // Когда пришёл последний визит (Date.now()), для «обновлено N с назад»
    lastVisitAt = $state<number | null>(null)

    private nextId = 0

    connect() {
        let source: EventSource | null = null
        let retry: ReturnType<typeof setTimeout> | undefined

        const open = () => {
            if (source) return
            clearTimeout(retry)
            this.status = 'connecting'
            const current = new EventSource(rumUrl('/live'))
            source = current
            let connected = false
            const giveUp = () => {
                this.status = 'offline'
                close()
                retry = setTimeout(open, OFFLINE_RETRY_MS)
            }
            retry = setTimeout(giveUp, CONNECT_TIMEOUT_MS)
            // Обрыв посреди эфира — браузер переподключится сам (retry из сервиса). Сервер не ответил
            // ни разу или закрыл поток (сервис не выложен, лимит зрителей) — сервис недоступен
            current.onerror = () => {
                if (connected && current.readyState !== EventSource.CLOSED) {
                    this.status = 'connecting'
                    return
                }
                clearTimeout(retry)
                giveUp()
            }
            current.addEventListener('snapshot', (event) => {
                connected = true
                clearTimeout(retry)
                const snapshot = JSON.parse(event.data) as Snapshot
                this.items = snapshot.visits.map((visit) => ({ id: this.nextId++, visit, live: false }))
                this.visitors = snapshot.visitors
                this.days = snapshot.days
                this.status = 'live'
            })
            current.addEventListener('visit', (event) => {
                const visit = JSON.parse(event.data) as Visit
                this.items = [{ id: this.nextId++, visit, live: true }, ...this.items].slice(0, LIMIT)
                if (this.visitors !== null) this.visitors++
                this.lastVisitAt = Date.now()
            })
        }
        const close = () => {
            source?.close()
            source = null
        }

        // Свёрнутая вкладка не держит соединение и не переподключается; при возврате — свежий снимок
        const onVisibility = () => {
            if (!document.hidden) return open()
            clearTimeout(retry)
            close()
        }

        open()
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            clearTimeout(retry)
            close()
        }
    }
}
