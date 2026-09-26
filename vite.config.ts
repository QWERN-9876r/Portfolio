import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type Plugin } from 'vite'

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

// Метрики посетителей: локально — сервис deploy/rum на 8090 (в проде проксирует nginx)
const rumProxy = { '/api/rum': { target: 'http://127.0.0.1:8090' } }

export default defineConfig({
    plugins: [treeShakeThrelteT(), sveltekit()],
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
    preview: { proxy: { ...storageProxy, ...rumProxy } },
})
