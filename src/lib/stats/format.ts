import type { StatsTranslation } from '$lib/i18n/stats'
import type { Translation } from '$lib/i18n/translations'
import { goodThreshold, normSource, timesBetter, type Vital } from './vitals'

// Числа страницы статистики в единицах и с разделителем языка страницы

export const formatMs = (ms: number, t: Translation) => {
    const { units } = t.whyMe
    if (ms < 1000) return `${Math.round(ms)} ${units.ms}`
    return `${(ms / 1000).toFixed(1).replace('.', units.decimal)} ${units.s}`
}

export const formatKb = (bytes: number, t: Translation) => `${Math.round(bytes / 1024)} ${t.whyMe.units.kb}`

export const formatMb = (mb: number, t: Translation, s: StatsTranslation) =>
    `${mb.toFixed(1).replace('.', t.whyMe.units.decimal)} ${s.mb}`

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

export const pluralForm = (forms: PluralForms, n: number, lang: string) =>
    forms[new Intl.PluralRules(lang).select(n)] ?? forms.other

// «в 30 раз лучше нормы Google — 2,5 с»; не лучше хотя бы вдвое — просто «норма Google — 2,5 с»
export const vitalNote = (
    vital: Vital,
    value: number,
    s: StatsTranslation,
    lang: string,
    formatNorm: (norm: number) => string,
) => {
    const times = timesBetter(vital, value)
    const text =
        times === null ? s.norm : s.better.replace('{n}', String(times)).replace('{times}', pluralForm(s.times, times, lang))
    return text.replace('{source}', s.sources[normSource(vital)]).replace('{norm}', formatNorm(goodThreshold(vital)))
}

// 75 → «1:15», 3725 → «1:02:05»
export const formatDuration = (seconds: number) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const rest = seconds % 60
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}
