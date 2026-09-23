<script lang="ts">
    import { page } from '$app/state'
    import LanguageToggle from '$lib/components/LanguageToggle.svelte'
    import { LOCALES, translations, type Locale } from '$lib/i18n/translations'
    import { DEFAULT_ROLE, isRole, rolePath } from '$lib/role'
    import { GITHUB_URL, HH_URL, NICKNAME, SITE_URL, TG_URL } from '$lib/site'

    let { data, children } = $props()

    // Шрифты заголовка и основного текста первого экрана — остальные подтянутся сами
    const FONT_PRELOADS: Record<Locale, string[]> = {
        en: ['/fonts/rubik-mono-one-latin-400-normal.woff2', '/fonts/montserrat-latin-wght-normal.woff2'],
        ru: ['/fonts/rubik-mono-one-cyrillic-400-normal.woff2', '/fonts/montserrat-cyrillic-wght-normal.woff2'],
    }
    const OG_IMAGE = `${SITE_URL}/img/og-image.jpg`

    const t = $derived(translations[data.lang])
    const role = $derived(isRole(page.params.role) ? page.params.role : DEFAULT_ROLE)

    // При пререндере lang подставляет hooks.server.ts, при клиентской смене языка — здесь
    $effect(() => {
        document.documentElement.lang = data.lang
    })
    const canonical = $derived(SITE_URL + rolePath(data.lang, role))

    const jsonLd = $derived(
        JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: t.seo.name,
            alternateName: NICKNAME,
            jobTitle: t.seo.jobTitle,
            url: canonical,
            image: `${SITE_URL}/img/photo-600.jpg`,
            sameAs: [TG_URL, GITHUB_URL, HH_URL],
        }).replaceAll('<', '\\u003c'),
    )
</script>

<svelte:head>
    <title>{t.seo.title}</title>
    <meta name="description" content={t.seo.description} />
    <meta name="keywords" content={t.seo.keywords} />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={canonical} />
    {#each LOCALES as locale (locale)}
        <link rel="alternate" hreflang={locale} href={SITE_URL + rolePath(locale, role)} />
    {/each}
    <link rel="alternate" hreflang="x-default" href={SITE_URL + rolePath('en', role)} />

    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={t.seo.title} />
    <meta property="og:description" content={t.seo.ogDescription} />
    <meta property="og:image" content={OG_IMAGE} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content={t.seo.ogLocale} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={OG_IMAGE} />

    {#each FONT_PRELOADS[data.lang] as href (href)}
        <link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" {href} />
    {/each}

    {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div id="bg-layer" aria-hidden="true"></div>
<LanguageToggle lang={data.lang} {role} />

{@render children()}
