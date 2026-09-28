import type { Visit } from './visits'

// Живая лента визитов из сервиса метрик (deploy/rum, /api/rum/live — Server-Sent Events):
// при подключении — последние визиты, дальше — каждый новый, как только сервис его записал

const ENDPOINT = '/api/rum/live'
const LIMIT = 30

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

        const open = () => {
            if (source) return
            this.status = 'connecting'
            source = new EventSource(ENDPOINT)
            // Обрыв сети — браузер переподключится сам (retry из сервиса); закрытый поток
            // (сервис не выложен, лимит зрителей) — нет
            source.onerror = () => {
                this.status = source?.readyState === EventSource.CLOSED ? 'offline' : 'connecting'
            }
            source.addEventListener('snapshot', (event) => {
                const snapshot = JSON.parse(event.data) as Snapshot
                this.items = snapshot.visits.map((visit) => ({ id: this.nextId++, visit, live: false }))
                this.visitors = snapshot.visitors
                this.days = snapshot.days
                this.status = 'live'
            })
            source.addEventListener('visit', (event) => {
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

        // Свёрнутая вкладка не держит соединение; при возврате придёт свежий снимок
        const onVisibility = () => (document.hidden ? close() : open())

        open()
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            close()
        }
    }
}
