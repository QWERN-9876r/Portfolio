import { error } from '@sveltejs/kit'
import { isLocale, translations } from '$lib/i18n/translations'
import type { RequestHandler } from './$types'

export const prerender = true

// Манифест PWA на языке страницы: имя, описание и стартовая страница — этого языка.
// id общий, поэтому приложение одно, с какой бы версии его ни установили.
// Иконка 512 px годится и как maskable: куб целиком в безопасной зоне (центральные 80%)
export const GET: RequestHandler = ({ params }) => {
    if (!isLocale(params.lang)) error(404)
    const t = translations[params.lang]

    const manifest = {
        id: '/',
        lang: params.lang,
        dir: 'ltr',
        name: t.seo.title,
        short_name: t.seo.title,
        description: t.seo.description,
        start_url: `/${params.lang}`,
        scope: '/',
        display: 'standalone',
        background_color: '#050816',
        theme_color: '#050816',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }

    return new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
    })
}
