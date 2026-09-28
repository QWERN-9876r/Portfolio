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
                '/robots.txt',
                '/sitemap.xml',
                // Тип возврата — для checkJs: иначе шаблонные строки выводятся как string
                ...LOCALES.flatMap(
                    /** @returns {`/${string}`[]} */
                    (lang) => [
                        `/${lang}`,
                        ...ROLE_SEGMENTS.map((role) => /** @type {const} */ (`/${lang}/${role}`)),
                        `/${lang}/manifest.webmanifest`,
                        // Страница резюме: из неё после сборки печатается PDF
                        `/resume/${lang}`,
                    ],
                ),
            ],
            handleHttpError: ({ path, message }) => {
                // Иконки из бакета в проде отдаёт прокси nginx, при сборке их нет
                if (path.startsWith('/api/storage/')) return
                // PDF-резюме печатается из /resume/{lang} уже после пререндера
                if (path.startsWith('/resume/') && path.endsWith('.pdf')) return
                throw new Error(message)
            },
        },
    },
}

export default config
