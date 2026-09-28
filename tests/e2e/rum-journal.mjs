// Сервис метрик для e2e: свой порт и журнал, рабочий сервис на 8090 не трогаем.
// `node tests/e2e/rum-journal.mjs` (запускает playwright.config.ts) пишет журнал заново:
// в нём уже есть посетители — иначе «Почему я» не покажет медиану
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RUM_PORT = 8091
export const RUM_JOURNAL = join(tmpdir(), 'portfolio-rum-e2e.jsonl')

// У всех один LCP: медиана не сдвинется, даже если beacon из теста придёт раньше запроса сводки.
// Язык и роль — не те, что у визитов из тестов, чтобы их было легко отличить
export const SEEDED = { visitors: 12, lang: 'en', role: 'frontend', lcpMs: 777, jsBytes: 64 * 1024 }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const event = {
        t: Math.floor(Date.now() / 1000),
        lang: SEEDED.lang,
        role: SEEDED.role,
        device: 'desktop',
        paint: 'lcp',
        paintMs: SEEDED.lcpMs,
        loadMs: 1200,
        js: SEEDED.jsBytes,
    }
    writeFileSync(RUM_JOURNAL, `${JSON.stringify(event)}\n`.repeat(SEEDED.visitors))
}
