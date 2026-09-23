import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

// В проде то же самое делает nginx
const storageProxy = {
    '/api/storage': {
        target: 'https://storage.yandexcloud.net',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/storage/, '/qwern-9876r'),
    },
}

export default defineConfig({
    plugins: [sveltekit()],
    server: { proxy: storageProxy },
    preview: { proxy: storageProxy },
})
