/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker'
import { LOCALES } from '$lib/i18n/translations'

const sw = self as unknown as ServiceWorkerGlobalScope

// Свой кэш у каждой сборки: после выкладки старый удаляется при активации нового воркера
const CACHE = `cache-${version}`

// Корень — редирект на /en (nginx отвечает 302): такой ответ в кэш не кладём
const KNOWN = [...build, ...files, ...prerendered].filter((path) => path !== '/')

// При установке забираем только то, что браузер уже скачал: only-if-cached берёт ответ
// из HTTP-кэша и в сеть не ходит. Посетитель, зашедший один раз, не качает лишнего —
// ни чанков Pixi, ни фото в других форматах. Остальное попадёт в кэш по ходу просмотра
sw.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) =>
            Promise.all(
                KNOWN.map((path) =>
                    fetch(path, { cache: 'only-if-cached', mode: 'same-origin' })
                        .then((response) => (response.ok ? cache.put(path, response) : undefined))
                        .catch(() => {}),
                ),
            ),
        ),
    )
})

// Первый воркер сразу берёт открытую страницу: её дальнейшие загрузки уже кэшируются
sw.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => sw.clients.claim()),
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
        // Корень без сети — на языковую версию из кэша; английская первой, как у nginx
        if (request.mode === 'navigate' && url.pathname === '/') {
            for (const lang of LOCALES) {
                if (await cache.match(`/${lang}`)) return Response.redirect(`/${lang}`, 302)
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
    if (url.origin !== sw.location.origin) return
    // Метрики посетителей: всегда сеть, ничего не кэшируем
    if (url.pathname.startsWith('/api/rum')) return
    // В dev ничего не кэшируем: правки должны быть видны сразу
    if (import.meta.env.DEV) return

    const fresh =
        request.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')
    event.respondWith(fresh ? networkFirst(request, url) : cacheFirst(request))
})
