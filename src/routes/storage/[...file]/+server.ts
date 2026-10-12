import { STORAGE_ORIGIN } from '$lib/content'
import { error } from '@sveltejs/kit'

// Иконки из бакета — копией внутри сайта: пререндер скачивает файл, как только встретит его
// в <img src>. Браузер не зависит от бакета, а canvas может читать пиксели иконки (iconColor.ts)
export const prerender = true

export const GET = async ({ params, fetch }) => {
    const response = await fetch(`${STORAGE_ORIGIN}/${params.file}`)
    if (!response.ok) error(response.status, `${params.file}: ${response.status} из бакета`)

    return new Response(await response.arrayBuffer(), {
        headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream' },
    })
}
