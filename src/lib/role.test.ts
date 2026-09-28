import { describe, expect, it } from 'vitest'
import { match as roleParam } from '../params/role'
import { DEFAULT_ROLE, isRole, rolePath, ROLES } from './role'

describe('роли', () => {
    it('isRole — только известные роли', () => {
        expect(ROLES.every(isRole)).toBe(true)
        for (const value of ['designer', 'Frontend', '', null, undefined]) expect(isRole(value)).toBe(false)
    })

    it('роль по умолчанию — без сегмента в пути', () => {
        expect(rolePath('en', DEFAULT_ROLE)).toBe('/en')
        expect(rolePath('ru', 'backend')).toBe('/ru/backend')
        expect(rolePath('en', 'fullstack')).toBe('/en/fullstack')
    })

    it('в маршруте /[lang]/[[role]] нет дубля /en/frontend', () => {
        expect(roleParam('fullstack')).toBe(true)
        expect(roleParam('backend')).toBe(true)
        expect(roleParam(DEFAULT_ROLE)).toBe(false)
        expect(roleParam('admin')).toBe(false)
    })
})
