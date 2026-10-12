import { withBase } from '$lib/site'
import { redirect } from '@sveltejs/kit'

// Пререндер превращает это в страницу с meta refresh: корень сайта ведёт на английскую версию
export const load = () => redirect(308, withBase('/en/'))
