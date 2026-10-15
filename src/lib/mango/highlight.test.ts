import { describe, expect, it } from 'vitest'
import counter from './counter.mango?raw'
import goroutines from './goroutines.mango?raw'
import { highlight, type TokenKind } from './highlight'

const kinds = (code: string) =>
    highlight(code)
        .filter((token) => token.kind !== 'text')
        .map((token) => [token.kind, token.text] as [TokenKind, string])

describe('highlight', () => {
    it.each([counter, goroutines])('ничего не теряет: куски складываются в исходный код', (source) => {
        expect(
            highlight(source)
                .map((token) => token.text)
                .join(''),
        ).toBe(source)
    })

    it('код и разметка примера', () => {
        expect(kinds('comp Counter(start number) {\n    state count = start')).toEqual([
            ['keyword', 'comp'],
            ['type', 'number'],
            ['keyword', 'state'],
        ])
        expect(kinds('<button onClick={count++}>Clicked</button>')).toEqual([
            ['tag', '<button'],
            ['attr', 'onClick'],
            ['tag', '>'],
            ['tag', '</button>'],
        ])
        expect(kinds('<Counter start={0} />')).toEqual([
            ['tag', '<Counter'],
            ['attr', 'start'],
            ['number', '0'],
            ['tag', '/>'],
        ])
        expect(kinds('<input bind:value={title} />')).toEqual([
            ['tag', '<input'],
            ['attr', 'bind:value'],
            ['tag', '/>'],
        ])
    })

    it('комментарий и строка поглощают ключевые слова', () => {
        expect(kinds('// return if\nconst s = "for in"')).toEqual([
            ['comment', '// return if'],
            ['keyword', 'const'],
            ['string', '"for in"'],
        ])
    })

    it('имя с цифрой — не число, соседние куски одного вида склеены', () => {
        expect(kinds('x1 = 2.5')).toEqual([['number', '2.5']])
        expect(highlight('a b')).toEqual([{ text: 'a b', kind: 'text' }])
    })

    it('горутины: go и await, «_» в числе, «>» в стрелке и сравнении — не тег', () => {
        expect(kinds('const PART = 1_000_000')).toEqual([
            ['keyword', 'const'],
            ['number', '1_000_000'],
        ])
        expect(kinds('map((_, i) => go count(i)) await all(n >= 2)')).toEqual([
            ['keyword', 'go'],
            ['keyword', 'await'],
            ['number', '2'],
        ])
        expect(kinds('if a > b {')).toEqual([['keyword', 'if']])
        expect(kinds('func countPrimes(from, to number)')).toEqual([
            ['keyword', 'func'],
            ['type', 'number'],
        ])
    })
})
