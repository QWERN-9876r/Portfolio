/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker'
import { LOCALES } from '$lib/i18n/translations'

const sw = self as unknown as ServiceWorkerGlobalScope

// Свой кэш у каждой сборки: после выкладки старый удаляется при активации нового воркера
const CACHE = `cache-${version}`

// Корень сайта — страница-редирект на /en/: её в кэш не кладём, без сети ведём на язык сами
const ROOT = `${base}/`
const KNOWN = [...build, ...files, ...prerendered].filter((path) => path !== ROOT)

// Забираем только то, что браузер уже скачал: only-if-cached берёт ответ из HTTP-кэша
// и в сеть не ходит. Посетитель, зашедший один раз, не качает лишнего —
// ни чанков Pixi, ни фото в других форматах. Остальное попадёт в кэш по ходу просмотра
const saveDownloaded = async () => {
    const cache = await caches.open(CACHE)
    await Promise.all(
        KNOWN.map((path) =>
            fetch(path, { cache: 'only-if-cached', mode: 'same-origin' })
                .then((response) => (response.ok ? cache.put(path, response) : undefined))
                .catch(() => {}),
        ),
    )
}

sw.addEventListener('install', (event) => event.waitUntil(saveDownloaded()))

// Первый воркер сразу берёт открытую страницу: её дальнейшие загрузки уже кэшируются.
// Скачанное, пока воркер устанавливался, мимо него — забираем ещё раз. Иначе второй визит
// без сети покажет HTML, но приложение не поднимется: нет модулей, загруженных в эти секунды
sw.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => sw.clients.claim())
            .then(saveDownloaded),
    )
})

// HTML и JSON (данные страниц, контент из бакета, version.json, манифест) должны быть
// свежими после выкладки: сначала сеть, кэш — только без неё
const networkFirst = async (request: Request, url: URL) => {
    const cache = await caches.open(CACHE)
    try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' })
        if (cached) return cached
        // Корень без сети — на языковую версию из кэша; английская первой, как у страницы-редиректа
        if (request.mode === 'navigate' && url.pathname === ROOT) {
            for (const lang of LOCALES) {
                const page = `${base}/${lang}/`
                if (await cache.match(page)) return Response.redirect(page, 302)
            }
        }
        throw error
    }
}

// Файлы с хешем, шрифты, иконки, картинки: из кэша, при промахе — из сети с сохранением
const cacheFirst = async (request: Request) => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
}

sw.addEventListener('fetch', (event) => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    // Чужие адреса — мимо, в том числе сервис метрик на своём сервере
    if (url.origin !== sw.location.origin) return
    // Он же локально (dev, preview, e2e) — через прокси Vite: всегда сеть, ничего не кэшируем
    if (url.pathname.startsWith('/api/rum')) return
    // В dev ничего не кэшируем: правки должны быть видны сразу
    if (import.meta.env.DEV) return

    const fresh =
        request.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')
    event.respondWith(fresh ? networkFirst(request, url) : cacheFirst(request))
})
