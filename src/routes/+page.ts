import { redirect } from '@sveltejs/kit'

// В проде редиректит nginx; пререндер превращает это в страницу с meta refresh
export const load = () => redirect(308, '/en')
