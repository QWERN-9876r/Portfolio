<script lang="ts">
    import { LOCALES, translations, type Locale } from '$lib/i18n/translations'
    import { rolePath, type Role } from '$lib/role'

    let { lang, role }: { lang: Locale; role: Role } = $props()

    const t = $derived(translations[lang].languageToggle)
</script>

<nav aria-label={t.label}>
    {#each LOCALES as locale (locale)}
        <a
            href={rolePath(locale, role)}
            hreflang={locale}
            class="caption"
            class:active={locale === lang}
            aria-current={locale === lang ? 'page' : undefined}
            aria-label="{t.switchTo} {locale.toUpperCase()}"
            data-sveltekit-noscroll
            data-sveltekit-keepfocus
        >
            {locale}
        </a>
    {/each}
</nav>

<style>
    nav {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 20;
        display: flex;
        gap: 2px;
        padding: 4px;
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        background: rgb(var(--c-bg-elevated) / 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
    }

    @media (min-width: 900px) {
        nav {
            top: 24px;
            right: 32px;
        }
    }

    a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 34px;
        min-height: 30px;
        padding: 0 8px;
        border: 1px solid transparent;
        border-radius: 7px;
        color: rgb(var(--c-text-secondary));
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    a:hover {
        color: rgb(var(--c-text-primary));
        background: rgb(var(--c-neon) / 0.14);
    }

    a.active {
        border-color: rgb(var(--c-neon) / 0.45);
        background: rgb(var(--c-neon) / 0.22);
        color: rgb(var(--c-text-primary));
    }

    a:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 1px;
    }
</style>
