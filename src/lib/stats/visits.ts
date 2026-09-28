import type { StatsTranslation } from '$lib/i18n/stats'
import type { Translation } from '$lib/i18n/translations'
import type { VisitBeacon } from '$lib/rum'

// Визит из живой ленты сервиса (deploy/rum): то, что прислал beacon, и время приёма
export interface Visit extends Partial<Omit<VisitBeacon, 'lang' | 'role' | 'device'>> {
    t: number
    lang: string
    role: string
    device: string
}

// Порядок секций на странице: до какой посетитель досмотрел — самая дальняя из увиденных
const ORDER = [/^hero$/, /^about$/, /^selling-points$/, /^stack-(\d+)$/, /^all-tech$/, /^experience$/, /^case-(\d+)$/]

const position = (id: string) => {
    const group = ORDER.findIndex((pattern) => pattern.test(id))
    if (group < 0) return -1
    return group * 1000 + Number(ORDER[group].exec(id)?.[1] ?? 0)
}

export const deepestSection = (sections: string[] = []) => {
    let deepest: string | null = null
    for (const id of sections) {
        if (position(id) > (deepest === null ? -1 : position(deepest))) deepest = id
    }
    return deepest
}

export const sectionLabel = (id: string, t: Translation, s: StatsTranslation) => {
    const caseNumber = /^case-(\d+)$/.exec(id)?.[1]
    if (caseNumber) return `${t.cases.label} ${caseNumber}`
    if (/^stack-\d+$/.test(id)) return t.sections.technologies
    const labels: Record<string, string> = {
        hero: s.visits.hero,
        about: t.sections.about,
        'selling-points': t.sections.whyMe,
        'all-tech': s.visits.allTech,
        experience: t.sections.experience,
    }
    return labels[id] ?? id
}

const sameList = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((item, i) => item === b[i])

// Визит этой вкладки: тот beacon, что она отправила при уходе с главной. Замеры — дробные
// миллисекунды, и совпадение всех полей сразу у двух разных визитов практически исключено
export const isOwnVisit = (visit: Visit, own: VisitBeacon | null) =>
    own !== null &&
    visit.lang === own.lang &&
    visit.role === own.role &&
    visit.device === own.device &&
    visit.paintMs === own.paintMs &&
    visit.loadMs === own.loadMs &&
    visit.js === own.js &&
    sameList(visit.sections, own.sections) &&
    sameList(visit.cta, own.cta)

// «только что», «12 с назад», «3 мин назад» — на языке страницы
export const timeAgo = (seconds: number, lang: string, justNow: string) => {
    if (seconds < 5) return justNow
    const format = new Intl.RelativeTimeFormat(lang, { style: 'short' })
    if (seconds < 60) return format.format(-Math.floor(seconds), 'second')
    if (seconds < 3600) return format.format(-Math.floor(seconds / 60), 'minute')
    if (seconds < 86400) return format.format(-Math.floor(seconds / 3600), 'hour')
    return format.format(-Math.floor(seconds / 86400), 'day')
}
