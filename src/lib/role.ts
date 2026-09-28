import type { Locale } from '$lib/i18n/translations'

export const ROLES = ['frontend', 'fullstack', 'backend'] as const
export type Role = (typeof ROLES)[number]

// Роль по умолчанию живёт на /en и /ru, остальные — на /en/fullstack и т.п.
export const DEFAULT_ROLE: Role = 'frontend'

export const isRole = (value: string | null | undefined): value is Role =>
    (ROLES as readonly string[]).includes(value ?? '')

export const rolePath = (lang: Locale, role: Role) =>
    role === DEFAULT_ROLE ? `/${lang}` : `/${lang}/${role}`

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
    frontend: 'React · Next.js · TypeScript · Web Components',
    fullstack: 'React · Go · TypeScript · PostgreSQL · MongoDB',
    backend: 'Go · Echo · PostgreSQL · MongoDB · REST API',
}
