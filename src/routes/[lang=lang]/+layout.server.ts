import { loadContent } from '$lib/content'
import { isLocale } from '$lib/i18n/translations'
import { error } from '@sveltejs/kit'

export const load = async ({ params, fetch }) => {
    const lang = params.lang
    if (!isLocale(lang)) error(404)

    return {
        lang,
        content: await loadContent(fetch, lang),
    }
}
