import { LOCALES } from '$lib/i18n/translations'
import { ROLES, rolePath, type Role } from '$lib/role'
import { SITE_URL } from '$lib/site'

export const prerender = true

const alternates = (role: Role) =>
    [
        ...LOCALES.map((lang) => [lang, rolePath(lang, role)]),
        ['x-default', rolePath('en', role)],
    ]
        .map(([hreflang, path]) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${SITE_URL}${path}"/>`)
        .join('')

export const GET = () => {
    const urls = ROLES.flatMap((role) =>
        LOCALES.map((lang) => `<url><loc>${SITE_URL}${rolePath(lang, role)}</loc>${alternates(role)}</url>`),
    )

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
    )
}
