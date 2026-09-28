<script lang="ts">
    import { page } from '$app/state'
    import LanguageToggle from '$lib/components/LanguageToggle.svelte'
    import { translations, type Locale } from '$lib/i18n/translations'

    // Верхняя панель поверх всех секций: вход в живую статистику и переключатель языка.
    // Точка статистики не пульсирует — бесконечная анимация спорила бы с «0 кадров в покое»
    let { lang, hrefs }: { lang: Locale; hrefs: Record<Locale, string> } = $props()

    const t = $derived(translations[lang])
    const statsHref = $derived(`/${lang}/stats`)
    const onStats = $derived(page.url.pathname === statsHref)
</script>

<div class="top-bar">
    <a class="caption stats" class:active={onStats} href={statsHref} aria-current={onStats ? 'page' : undefined}>
        <span class="dot" aria-hidden="true"></span>
        {t.statsNav}
    </a>
    <LanguageToggle {lang} {hrefs} />
</div>

<style>
    .top-bar {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 20;
        display: flex;
        align-items: stretch;
        gap: 8px;
    }

    @media (min-width: 900px) {
        .top-bar {
            top: 24px;
            right: 32px;
        }
    }

    /* Как переключатель языка рядом: то же стекло и та же высота */
    .stats {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        background: rgb(var(--c-bg-elevated) / 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        color: rgb(var(--c-text-secondary));
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .stats:hover {
        border-color: rgb(var(--c-good) / 0.45);
        color: rgb(var(--c-text-primary));
    }

    .stats.active {
        border-color: rgb(var(--c-good) / 0.5);
        background: rgb(var(--c-good) / 0.12);
        color: rgb(var(--c-text-primary));
    }

    .stats:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgb(var(--c-good));
        box-shadow: 0 0 8px rgb(var(--c-good) / 0.9);
    }
</style>
