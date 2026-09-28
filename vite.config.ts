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

// В проде то же самое делает nginx
const storageProxy = {
    '/api/storage': {
        target: 'https://storage.yandexcloud.net',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/storage/, '/qwern-9876r'),
    },
}

// Метрики посетителей локально (dev и preview): /api/rum → сервис deploy/rum на 8090,
// в проде это делает nginx. Сервис не запущен — пустой 204: без ошибок в консоли
// браузера, сводка в «Почему я» просто не показывается; в терминале — одна подсказка.
// RUM_SERVICE — другой адрес: e2e поднимают свой сервис с чистым журналом
const RUM_SERVICE = process.env.RUM_SERVICE ?? 'http://127.0.0.1:8090'
const rumLocal = (): Plugin => {
    let warned = false
    const forward: Connect.NextHandleFunction = async (req, res) => {
        try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk)
            const upstream = await fetch(RUM_SERVICE + (req.originalUrl ?? req.url), {
                method: req.method,
                body: req.method === 'POST' ? Buffer.concat(chunks).toString() : undefined,
            })
            res.statusCode = upstream.status
            const type = upstream.headers.get('content-type')
            if (type) res.setHeader('Content-Type', type)
            res.end(new Uint8Array(await upstream.arrayBuffer()))
        } catch {
            if (!warned) {
                warned = true
                console.warn('[rum] сервис метрик не запущен: cd deploy/rum && go run . -data /tmp/rum.jsonl')
            }
            res.statusCode = 204
            res.end()
        }
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
                // чанка Threlte, выносятся в отдельный файл: лишний запрос на первом экране
                codeSplitting: {
                    groups: [{ name: 'svelte', test: /node_modules[\\/]svelte[\\/]/ }],
                },
            },
        },
    },
    server: { proxy: storageProxy },
    preview: { proxy: storageProxy },
    // Unit-тесты лежат рядом с кодом; e2e — в tests/e2e, их запускает Playwright
    test: {
        include: ['src/**/*.test.ts'],
    },
})
