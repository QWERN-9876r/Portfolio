<script lang="ts">
    import { browser } from '$app/environment'
    import { page } from '$app/state'
    import TopBar from '$lib/components/TopBar.svelte'
    import PrismLayer from '$lib/three/PrismLayer.svelte'
    import { LOCALES, translations, type Locale } from '$lib/i18n/translations'
    import { DEFAULT_ROLE, isRole } from '$lib/role'
    import { GITHUB_URL, HH_URL, NICKNAME, PHOTO, SITE_URL, TG_URL } from '$lib/site'

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
    // Та же страница на другом языке: /en/backend → /ru/backend, /en/stats → /ru/stats
    const localePath = (locale: Locale) => page.url.pathname.replace(/^\/[^/]+/, `/${locale}`)
    const hrefs = $derived(
        Object.fromEntries(LOCALES.map((locale) => [locale, localePath(locale)])) as Record<Locale, string>,
    )
    const canonical = $derived(SITE_URL + hrefs[data.lang])

    const jsonLd = $derived(
        JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: t.seo.name,
            alternateName: NICKNAME,
            jobTitle: t.seo.jobTitle,
            url: canonical,
            image: `${SITE_URL}${PHOTO}-600.jpg`,
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
        <link rel="alternate" hreflang={locale} href={SITE_URL + hrefs[locale]} />
    {/each}
    <link rel="alternate" hreflang="x-default" href={SITE_URL + hrefs.en} />
    <link rel="manifest" href="/{data.lang}/manifest.webmanifest" />

    <!-- Превью ссылки в Telegram, соцсетях и мессенджерах. site_name Telegram показывает
         цветной строкой над заголовком; summary_large_image — крупная картинка, а не миниатюра -->
    <meta property="og:site_name" content={NICKNAME} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:title" content={t.seo.title} />
    <meta property="og:description" content={t.seo.ogDescription} />
    <meta property="og:image" content={OG_IMAGE} />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={t.seo.ogImageAlt} />
    <meta property="og:locale" content={t.seo.ogLocale} />
    {#each LOCALES.filter((locale) => locale !== data.lang) as locale (locale)}
        <meta property="og:locale:alternate" content={translations[locale].seo.ogLocale} />
    {/each}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={t.seo.title} />
    <meta name="twitter:description" content={t.seo.ogDescription} />
    <meta name="twitter:image" content={OG_IMAGE} />
    <meta name="twitter:image:alt" content={t.seo.ogImageAlt} />

    <!-- Preload нужен только исходному HTML: при клиентской смене языка он приходит
         уже после load, и браузер предупреждает о неиспользованной предзагрузке -->
    {#if !browser}
        {#each FONT_PRELOADS[data.lang] as href (href)}
            <link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" {href} />
        {/each}
    {/if}

    {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div id="bg-layer" aria-hidden="true"></div>
<TopBar lang={data.lang} {hrefs} />

{@render children()}

<!-- После контента: кнопка на кубе — последняя в порядке Tab.
     Наложение слоёв задаёт z-index, а не порядок в DOM -->
<PrismLayer {role} labels={t.prism} />
