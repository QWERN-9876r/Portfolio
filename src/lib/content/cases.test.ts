import { describe, expect, it } from 'vitest'
import { findResult, type CaseItem } from './cases'

const item = (id: string, results: CaseItem['results']): CaseItem => ({
    id,
    title: id,
    company: 'Яндекс',
    problem: '',
    solution: '',
    results,
})

describe('findResult', () => {
    const cases = [
        item('case-1', [{ label: 'DAU', value: '+53%' }]),
        item('case-2', [
            { label: 'MAU', value: '+38%' },
            { label: 'DAU', value: '+10%' },
        ]),
    ]

    it('результат вместе с кейсом, где он получен', () => {
        expect(findResult(cases, 'MAU')).toEqual({ caseItem: cases[1], result: { label: 'MAU', value: '+38%' } })
    })

    it('при повторе подписи — из первого кейса', () => {
        expect(findResult(cases, 'DAU')?.caseItem.id).toBe('case-1')
    })

    it('подпись сравнивается точно', () => {
        expect(findResult(cases, 'dau')).toBeNull()
        expect(findResult([], 'DAU')).toBeNull()
    })
})
