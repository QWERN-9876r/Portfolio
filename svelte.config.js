import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Должно совпадать с LOCALES в src/lib/i18n/translations.ts и ROLES в src/lib/role.ts
const LOCALES = ['en', 'ru']
const ROLE_SEGMENTS = ['fullstack', 'backend']

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            pages: 'dist',
            assets: 'dist',
            precompress: true,
            strict: true,
        }),
        // Весь CSS встраивается в HTML — без блокирующего запроса стилей
        inlineStyleThreshold: 100_000,
        prerender: {
            entries: [
                '/',
                ...LOCALES.flatMap((lang) => [
                    `/${lang}`,
                    ...ROLE_SEGMENTS.map((role) => `/${lang}/${role}`),
                ]),
            ],
            handleHttpError: ({ path, message }) => {
                // Иконки из бакета в проде отдаёт прокси nginx, при сборке их нет
                if (path.startsWith('/api/storage/')) return
                throw new Error(message)
            },
        },
    },
}

export default config
