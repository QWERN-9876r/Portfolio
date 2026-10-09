// Подсветка коротких примеров MangoScript в кейсе: хватает регулярного выражения,
// компилятор с его лексером на страницу не грузим

export type TokenKind = 'text' | 'comment' | 'string' | 'tag' | 'attr' | 'keyword' | 'type' | 'number'

export interface Token {
    text: string
    kind: TokenKind
}

const KEYWORDS = new Set([
    'comp', 'state', 'func', 'return', 'const', 'let', 'if', 'else', 'for', 'in', 'switch', 'case',
    'default', 'defer', 'import', 'export', 'from', 'type', 'new', 'null', 'true', 'false',
])
const TYPES = new Set(['number', 'string', 'bool', 'error', 'any', 'void'])

// Порядок групп — приоритет: комментарий и строка поглощают всё, что внутри них.
// Атрибут — имя прямо перед «=» (onClick=, bind:value=)
const TOKEN = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(<\/?[A-Za-z][\w.-]*|\/?>)|([A-Za-z_][\w:-]*)(?==)|([A-Za-z_]\w*)|(\d+(?:\.\d+)?)/g

export const highlight = (code: string): Token[] => {
    const tokens: Token[] = []
    // Соседние куски одного вида склеиваются — меньше <span> в разметке
    const push = (text: string, kind: TokenKind) => {
        if (!text) return
        const last = tokens.at(-1)
        if (last?.kind === kind) last.text += text
        else tokens.push({ text, kind })
    }

    let cursor = 0
    for (const match of code.matchAll(TOKEN)) {
        const [text, comment, string, tag, attr, word] = match
        push(code.slice(cursor, match.index), 'text')
        push(
            text,
            comment ? 'comment'
            : string ? 'string'
            : tag ? 'tag'
            : attr ? 'attr'
            : word === undefined ? 'number'
            : KEYWORDS.has(word) ? 'keyword'
            : TYPES.has(word) ? 'type'
            : 'text',
        )
        cursor = match.index + text.length
    }
    push(code.slice(cursor), 'text')
    return tokens
}
