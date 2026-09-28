import { describe, expect, it } from 'vitest'
import { overlaps, parsePeriod, roleAnchor, splitRole } from './experience'

// Месяц от начала эры — так parsePeriod хранит даты
const month = (m: number, year: number) => year * 12 + m - 1

describe('parsePeriod', () => {
    it('начало и конец', () => {
        expect(parsePeriod('05.2024 – 08.2024')).toEqual({ start: month(5, 2024), end: month(8, 2024) })
    })

    it('разделитель любой, месяц — одной цифрой или двумя', () => {
        expect(parsePeriod('4.2025 - 05.2025')).toEqual({ start: month(4, 2025), end: month(5, 2025) })
    })

    it.each(['05.2026 – н.в.', '05.2026 – present', '05.2026'])('«%s» — по настоящее время', (text) => {
        expect(parsePeriod(text)).toEqual({ start: month(5, 2026), end: null })
    })

    it.each([undefined, '', 'весна 2024'])('без даты (%j) — null', (text) => {
        expect(parsePeriod(text)).toBeNull()
    })
})

describe('overlaps', () => {
    const period = (text: string) => parsePeriod(text)!

    it('пересекаются в обе стороны', () => {
        const role = period('08.2024 – 03.2026')
        const project = period('04.2025 - 05.2025')
        expect(overlaps(role, project)).toBe(true)
        expect(overlaps(project, role)).toBe(true)
    })

    it('общий месяц на стыке — пересечение', () => {
        expect(overlaps(period('05.2024 – 08.2024'), period('08.2024 – 03.2026'))).toBe(true)
    })

    it('соседние месяцы не пересекаются', () => {
        expect(overlaps(period('05.2024 – 07.2024'), period('08.2024 – 03.2026'))).toBe(false)
    })

    it('незаконченный период идёт до бесконечности', () => {
        expect(overlaps(period('05.2026 – н.в.'), period('09.2030'))).toBe(true)
        expect(overlaps(period('05.2026 – н.в.'), period('01.2026 – 04.2026'))).toBe(false)
    })
})

describe('splitRole', () => {
    it('новый формат: компания в отдельном поле', () => {
        expect(splitRole({ period: '', title: 'Fullstack-разработчик (игры)', company: 'МТС' })).toEqual({
            title: 'Fullstack-разработчик (игры)',
            company: 'МТС',
        })
    })

    it('старый формат: компания в скобках в конце должности', () => {
        expect(splitRole({ period: '', title: 'Frontend-разработчик (Яндекс)' })).toEqual({
            title: 'Frontend-разработчик',
            company: 'Яндекс',
        })
    })

    it('скобки не в конце — это часть должности', () => {
        expect(splitRole({ period: '', title: 'Разработчик (React) в МТС' })).toEqual({
            title: 'Разработчик (React) в МТС',
            company: null,
        })
    })
})

describe('roleAnchor', () => {
    it.each([
        ['05.2024 – 08.2024', 'role-2024-05'],
        ['12.2023 – 02.2024', 'role-2023-12'],
        ['1.2025 – н.в.', 'role-2025-01'],
    ])('%s → #%s', (period, anchor) => {
        expect(roleAnchor({ period, title: '' })).toBe(anchor)
    })

    it('без периода якоря нет', () => {
        expect(roleAnchor({ period: 'скоро', title: '' })).toBeNull()
    })
})
