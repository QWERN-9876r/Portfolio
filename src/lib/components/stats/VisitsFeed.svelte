<script lang="ts">
    import type { StatsTranslation } from '$lib/i18n/stats'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { isRole } from '$lib/role'
    import { sentBeacon } from '$lib/rum'
    import { formatKb, formatMs, pluralForm } from '$lib/stats/format'
    import type { LiveVisits } from '$lib/stats/liveVisits.svelte'
    import { deepestSection, isOwnVisit, sectionLabel, timeAgo } from '$lib/stats/visits'
    import { rate } from '$lib/stats/vitals'
    import { cssRgb, SPECTRUM } from '$lib/three/spectrum'

    // Живая лента визитов с сервера. now — общие часы страницы, чтобы «N с назад» тикало
    let {
        t,
        s,
        lang,
        feed,
        now,
    }: { t: Translation; s: StatsTranslation; lang: Locale; feed: LiveVisits; now: number } = $props()

    const v = $derived(s.visits)

    // Визит этой вкладки: его отправили при переходе сюда с главной
    const own = sentBeacon()
    const ownId = $derived(feed.items.find((item) => isOwnVisit(item.visit, own))?.id)

    const total = $derived(
        feed.visitors === null
            ? null
            : v.total
                  .replace('{n}', String(feed.visitors))
                  .replace('{visits}', pluralForm(v.visitsWord, feed.visitors, lang))
                  .replace('{days}', String(feed.days))
                  .replace('{daysWord}', pluralForm(t.whyMe.daysWord, feed.days, lang)),
    )

    const label = (labels: Record<string, string>, key: string) => labels[key] ?? key
</script>

<section class="glass-panel panel" style:--c-accent={cssRgb(SPECTRUM.cyan)}>
    <header class="panel-header">
        <div class="titles">
            <h2 class="h4">{v.title}</h2>
            <span class="caption sub">{v.caption}</span>
        </div>
        {#if total}
            <span class="total">{total}</span>
        {/if}
    </header>

    <p class="body2 try">{v.tryIt}</p>

    {#if feed.items.length > 0}
        <ol class="feed" aria-live="polite" aria-relevant="additions">
            {#each feed.items as { id, visit, live } (id)}
                {@const deepest = deepestSection(visit.sections)}
                <li class="visit" class:live class:own={id === ownId}>
                    <time class="when" datetime={new Date(visit.t * 1000).toISOString()}>
                        {timeAgo(now / 1000 - visit.t, lang, v.justNow)}
                    </time>
                    <span class="who">
                        {#if id === ownId}
                            <span class="caption you">{v.you}</span>
                        {/if}
                        {visit.lang.toUpperCase()} · {isRole(visit.role) ? t.hero.roles[visit.role] : visit.role} ·
                        {label(v.device, visit.device)}
                    </span>
                    <span class="facts">
                        {#if visit.paintMs}
                            <span
                                class="fact"
                                data-rating={visit.paint === 'lcp' ? rate('lcp', visit.paintMs) : undefined}
                            >
                                {(visit.paint ?? 'lcp').toUpperCase()}
                                {formatMs(visit.paintMs, t)}
                            </span>
                        {/if}
                        {#if visit.js}
                            <span class="fact">JS {formatKb(visit.js, t)}</span>
                        {/if}
                        {#if deepest}
                            <span class="fact">{v.deepest} «{sectionLabel(deepest, t, s)}»</span>
                        {/if}
                    </span>
                    {#if visit.cta?.length}
                        <span class="chips">
                            {#each visit.cta as cta (cta)}
                                <span class="caption chip">{label(v.cta, cta)}</span>
                            {/each}
                        </span>
                    {/if}
                </li>
            {/each}
        </ol>
    {:else if feed.status !== 'connecting'}
        <p class="body2 empty">{feed.status === 'offline' ? s.status.offline : v.empty}</p>
    {/if}

    <p class="caption privacy">{v.privacy}</p>
</section>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
    }

    .panel-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 8px 16px;
    }

    .titles {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .titles .h4 {
        color: rgb(var(--c-text-primary));
    }

    .sub,
    .privacy {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .total {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 0.9rem;
        text-shadow: 0 0 16px rgb(var(--c-accent) / 0.6);
    }

    .try {
        padding: 8px 12px;
        border-left: 2px solid rgb(var(--c-accent) / 0.6);
        background: rgb(var(--c-accent) / 0.05);
        color: rgb(var(--c-text-secondary));
        font-size: 0.8rem;
    }

    .feed {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .visit {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 14px;
        padding: 10px 12px;
        border: 1px solid rgb(var(--c-accent) / 0.12);
        border-radius: 10px;
        background: rgb(var(--c-accent) / 0.04);
        font-size: 0.8rem;
        line-height: 1.4;
    }

    /* Пришёл, пока страница открыта: въезжает сверху и гаснет подсветка */
    .visit.live {
        animation: arrive 1.6s var(--ease-out);
    }

    @keyframes arrive {
        from {
            border-color: rgb(var(--c-accent) / 0.8);
            background: rgb(var(--c-accent) / 0.25);
            box-shadow: 0 0 24px rgb(var(--c-accent) / 0.4);
            translate: 0 -8px;
        }
    }

    .visit.own {
        border-color: rgb(var(--c-accent) / 0.6);
        box-shadow: 0 0 16px rgb(var(--c-accent) / 0.2);
    }

    .when {
        min-width: 7.5em;
        color: rgb(var(--c-accent));
        font-variant-numeric: tabular-nums;
    }

    .who {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        color: rgb(var(--c-text-primary));
        font-weight: 600;
    }

    .you {
        padding: 0 6px;
        border-radius: 4px;
        background: rgb(var(--c-accent));
        color: rgb(var(--c-bg-deep));
        font-size: 0.6rem;
        font-weight: 700;
    }

    .facts {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        color: rgb(var(--c-text-secondary));
    }

    /* LCP визита — цветом оценки */
    .fact[data-rating] {
        color: rgb(var(--c-rating));
    }

    .fact[data-rating='good'] {
        --c-rating: var(--c-good);
    }
    .fact[data-rating='fair'] {
        --c-rating: var(--c-fair);
    }
    .fact[data-rating='poor'] {
        --c-rating: var(--c-poor);
    }

    .chips {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .chip {
        padding: 0 6px;
        border: 1px solid rgb(var(--c-accent) / 0.35);
        border-radius: 4px;
        color: rgb(var(--c-accent));
        font-size: 0.6rem;
        letter-spacing: 0.04em;
    }

    .empty {
        color: rgb(var(--c-text-secondary));
    }

    @media (min-width: 600px) {
        .panel {
            padding: 24px;
        }
    }
</style>
