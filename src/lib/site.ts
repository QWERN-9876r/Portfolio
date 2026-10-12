import type { Locale } from '$lib/i18n/translations'

// Сайт — на GitHub Pages, в папке репозитория: https://qwern-9876r.github.io/Portfolio.
// BASE_PATH совпадает с kit.paths.base в svelte.config.js (проверяет seo.test.ts)
export const BASE_PATH = '/Portfolio'
// Используется в canonical, hreflang, og:url, JSON-LD, robots.txt и sitemap.xml
export const SITE_URL = `https://qwern-9876r.github.io${BASE_PATH}`

// Путь внутри сайта → адрес: '/en/' → '/Portfolio/en/'
export const withBase = (path: string) => BASE_PATH + path

// Сервис метрик посетителей (deploy/rum) живёт на своём сервере, сайт работает и без него.
// Локально (dev, preview, e2e) — тот же путь на своём адресе: Vite проксирует его к локальному сервису
export const RUM_ORIGIN = 'https://qwern9876r.ru'
export const rumUrl = (path = '') => {
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    return `${local ? '' : RUM_ORIGIN}/api/rum${path}`
}

// Фото в hero: {PHOTO}-{300,400,600}.{avif,webp} и {PHOTO}-600.jpg (scripts/hero-photo.sh). Хеш
// исходника в имени — после замены фото браузеры не покажут старое из кэша
export const PHOTO = '/img/photo-948a13ea'

// JS до события load, КБ gzip: держит e2e-тест, показывают «Почему я» и /stats
export const JS_BUDGET_KB = 70

// На чём сделан сам сайт: в опыте работы с тем же стеком — бейдж «этот сайт — на том же стеке»
export const SITE_STACK = ['Svelte', 'Threlte', 'Three.js', 'Pixi.js', 'WebGL']

// PDF-резюме: печатается из /resume/{lang}/ после сборки (scripts/resume-pdf.mjs)
export const resumePdf = (lang: Locale) => withBase(`/resume/dmitry-sotnikov-${lang}.pdf`)

export const NICKNAME = 'Qwern_9876r'
export const TG_URL = 'https://t.me/Qwern_9876r'
export const GITHUB_URL = 'https://github.com/QWERN-9876r'
export const EMAIL = 'sotnikovdmitrij176@gmail.com'
export const HH_URL = 'https://hh.ru/resume/a94d9208ff101e27e70039ed1f3755764d3255'
