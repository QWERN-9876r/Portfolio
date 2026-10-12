import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Должно совпадать с LOCALES в src/lib/i18n/translations.ts и ROLES в src/lib/role.ts
const LOCALES = ['en', 'ru']
// Сайт на GitHub Pages живёт в папке репозитория — как BASE_PATH в src/lib/site.ts
const BASE = '/Portfolio'
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
        paths: { base: BASE },
        // Весь CSS встраивается в HTML — без блокирующего запроса стилей
        inlineStyleThreshold: 100_000,
        prerender: {
            // Пути без base, страницы — со слэшем на конце (trailingSlash: 'always' в +layout.ts)
            entries: [
                '/',
                '/robots.txt',
                '/sitemap.xml',
                // Тип возврата — для checkJs: иначе шаблонные строки выводятся как string
                ...LOCALES.flatMap(
                    /** @returns {`/${string}`[]} */
                    (lang) => [
                        `/${lang}/`,
                        ...ROLE_SEGMENTS.map((role) => /** @type {const} */ (`/${lang}/${role}/`)),
                        `/${lang}/manifest.webmanifest`,
                        // Живая статистика: HTML-каркас, данные приходят в браузере
                        `/${lang}/stats/`,
                        // Страница резюме: из неё после сборки печатается PDF
                        `/resume/${lang}/`,
                    ],
                ),
            ],
            handleHttpError: ({ path, message }) => {
                // PDF-резюме печатается из /resume/{lang}/ уже после пререндера
                if (path.startsWith(`${BASE}/resume/`) && path.endsWith('.pdf')) return
                // Иконки, которой нет в бакете, не будет и на сайте — как раньше через прокси
                if (path.startsWith(`${BASE}/storage/`)) {
                    console.warn(`[storage] ${message}`)
                    return
                }
                throw new Error(message)
            },
        },
    },
}

export default config
