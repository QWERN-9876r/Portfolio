import { sveltekit } from '@sveltejs/kit/vite'
import type { Connect, Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// В @threlte/core нет "sideEffects": false, поэтому прокси <T> (import * as THREE)
// попадает в бандл даже без использования и тянет весь three: +~58 КБ gzip
const treeShakeThrelteT = (): Plugin => ({
    name: 'tree-shake-threlte-t',
    transform(code, id) {
        if (id.endsWith('/@threlte/core/dist/components/T/T.js')) {
            return { code, map: null, moduleSideEffects: false }
        }
    },
})

// Метрики посетителей локально (dev и preview): /api/rum → сервис deploy/rum на 8090,
// в проде страница ходит прямо в сервис на qwern9876r.ru (rumUrl в src/lib/site.ts).
// Сервис не запущен — пустой 204: без ошибок в консоли браузера, сводка в «Почему я»
// просто не показывается; в терминале — одна подсказка.
// RUM_SERVICE — другой адрес: e2e поднимают свой сервис с чистым журналом
const RUM_SERVICE = process.env.RUM_SERVICE ?? 'http://127.0.0.1:8090'
const rumLocal = (): Plugin => {
    let warned = false
    const forward: Connect.NextHandleFunction = async (req, res) => {
        // Зритель ушёл — обрываем и запрос к сервису: иначе живая лента висела бы открытой
        const abort = new AbortController()
        res.on('close', () => abort.abort())

        let upstream: Response
        try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk)
            upstream = await fetch(RUM_SERVICE + (req.originalUrl ?? req.url), {
                method: req.method,
                body: req.method === 'POST' ? Buffer.concat(chunks).toString() : undefined,
                signal: abort.signal,
            })
        } catch {
            if (!warned) {
                warned = true
                console.warn('[rum] сервис метрик не запущен: cd deploy/rum && go run . -data /tmp/rum.jsonl')
            }
            res.statusCode = 204
            res.end()
            return
        }

        res.statusCode = upstream.status
        for (const name of ['content-type', 'cache-control']) {
            const value = upstream.headers.get(name)
            if (value) res.setHeader(name, value)
        }
        // Потоком, а не целиком: события живой ленты (SSE) уходят в браузер сразу
        const reader = upstream.body?.getReader()
        try {
            for (let chunk = await reader?.read(); chunk && !chunk.done; chunk = await reader?.read()) {
                res.write(chunk.value)
            }
        } catch {
            // Зритель закрыл страницу посреди потока
        }
        res.end()
    }
    return {
        name: 'rum-local',
        configureServer: (server) => {
            server.middlewares.use('/api/rum', forward)
        },
        configurePreviewServer: (server) => {
            server.middlewares.use('/api/rum', forward)
        },
    }
}

export default defineConfig({
    plugins: [treeShakeThrelteT(), rumLocal(), sveltekit()],
    build: {
        rolldownOptions: {
            output: {
                // Рантайм Svelte — одним чанком. Иначе модули, общие для страницы и ленивого
                // чанка Threlte, выносятся в отдельный файл: лишний запрос на первом экране.
                // Туда же — свои модули, общие для главной и /stats (замеры, RUM, адреса, роли, оценки):
                // иначе у главной лишние маленькие запросы
                codeSplitting: {
                    groups: [
                        {
                            name: 'svelte',
                            test: /node_modules[\\/]svelte[\\/]|src[\\/]lib[\\/](pageMetrics|rum|role|site|stats[\\/]vitals)\.ts$/,
                        },
                    ],
                },
            },
        },
    },
    // Unit-тесты лежат рядом с кодом; e2e — в tests/e2e, их запускает Playwright
    test: {
        include: ['src/**/*.test.ts'],
    },
})
