<script lang="ts">
    import LoadPanel from '$lib/components/stats/LoadPanel.svelte'
    import TabPanel from '$lib/components/stats/TabPanel.svelte'
    import VisitsFeed from '$lib/components/stats/VisitsFeed.svelte'
    import { statsTranslations } from '$lib/i18n/stats'
    import { translations } from '$lib/i18n/translations'
    import { DEFAULT_ROLE, rolePath } from '$lib/role'
    import { NICKNAME, withBase } from '$lib/site'
    import { LiveVisits } from '$lib/stats/liveVisits.svelte'
    import { TabMetrics } from '$lib/stats/tabMetrics.svelte'
    import { onMount } from 'svelte'

    // Статистика сайта вживую: замеры этой вкладки и визиты настоящих посетителей с сервера.
    // В HTML — только каркас, данные появляются в браузере
    let { data } = $props()

    const t = $derived(translations[data.lang])
    const s = $derived(statsTranslations[data.lang])

    const tab = new TabMetrics()
    const visits = new LiveVisits()
    // Общие часы для «N с назад» в ленте; свёрнутая вкладка не тикает
    let now = $state(Date.now())

    onMount(() => {
        const stopTab = tab.start()
        const stopVisits = visits.connect()
        const clock = setInterval(() => {
            if (!document.hidden) now = Date.now()
        }, 1000)
        return () => {
            stopTab()
            stopVisits()
            clearInterval(clock)
        }
    })
</script>

<svelte:head>
    <title>{s.title} · {NICKNAME}</title>
</svelte:head>

<main id="scroll-root">
    <div class="section-content page">
        <header class="header">
            <a class="caption back" href={withBase(rolePath(data.lang, DEFAULT_ROLE))}>
                <span aria-hidden="true">←</span>
                {s.back}
            </a>
            <div class="title-row">
                <h1 class="h2 title">{s.title}</h1>
                <p class="status" data-status={visits.status} role="status">
                    <span class="dot" aria-hidden="true">
                        <!-- Вспышка на каждый новый визит -->
                        {#if visits.lastVisitAt}
                            {#key visits.lastVisitAt}
                                <span class="ping"></span>
                            {/key}
                        {/if}
                    </span>
                    <span class="caption">{s.status[visits.status]}</span>
                </p>
            </div>
            <p class="body1 lead">{s.lead}</p>
        </header>

        <div class="grid">
            <TabPanel {t} {s} lang={data.lang} metrics={tab} />
            <LoadPanel {t} {s} lang={data.lang} metrics={tab} />
        </div>

        <VisitsFeed {t} {s} lang={data.lang} feed={visits} {now} />
    </div>
</main>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin: 0 auto;
        padding: 88px 16px 64px;
    }

    .header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 780px;
    }

    .back {
        align-self: flex-start;
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.12em;
        text-decoration: none;
    }

    .back:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .back:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 20px;
    }

    .title {
        color: rgb(var(--c-text-primary));
    }

    .lead {
        color: rgb(var(--c-text-secondary));
    }

    .status {
        --c-status: var(--c-fair);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        border: 1px solid rgb(var(--c-status) / 0.4);
        border-radius: 999px;
        background: rgb(var(--c-status) / 0.08);
        color: rgb(var(--c-status));
    }

    .status[data-status='live'] {
        --c-status: var(--c-good);
    }

    .status[data-status='offline'] {
        --c-status: var(--c-poor);
    }

    .dot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgb(var(--c-status));
        box-shadow: 0 0 10px rgb(var(--c-status));
    }

    .ping {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgb(var(--c-status));
        opacity: 0;
        animation: ping 1.2s ease-out;
    }

    @keyframes ping {
        from {
            opacity: 0.9;
            scale: 1;
        }
        to {
            opacity: 0;
            scale: 4;
        }
    }

    .grid {
        display: grid;
        gap: 20px;
        align-items: start;
    }

    @media (min-width: 600px) {
        .page {
            padding: 104px 32px 80px;
        }
    }

    @media (min-width: 900px) {
        .page {
            padding: 112px 48px 96px;
        }

        .grid {
            grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        }
    }
</style>
