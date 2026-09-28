<script lang="ts">
    import { intersect } from '$lib/attachments/reveal'
    import CountUp from '$lib/components/CountUp.svelte'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { measurePage, watchIdleFps, type PageMetrics } from '$lib/pageMetrics'
    import { fetchRumSummary, type RumSummary } from '$lib/rum'

    let { t, lang }: { t: Translation; lang: Locale } = $props()

    const DASH = '—'

    let visible = $state(false)
    let metrics = $state.raw<PageMetrics | null>(null)
    let fps = $state<number | null>(null)

    // Меряем, когда блок показался: к этому времени страница уже загружена
    $effect(() => {
        if (visible && !metrics) measurePage().then((value) => (metrics = value))
    })

    // Кадры в покое считаем, только пока блок на экране
    $effect(() => {
        if (visible) return watchIdleFps((value) => (fps = value))
    })

    // Медианы настоящих посетителей — тоже только когда блок показался
    let visitors = $state.raw<RumSummary | null>(null)
    let asked = false
    $effect(() => {
        if (!visible || asked) return
        asked = true
        fetchRumSummary().then((value) => (visitors = value))
    })

    const plural = $derived(new Intl.PluralRules(lang))
    const visitorsLine = $derived.by(() => {
        if (!visitors) return null
        const { whyMe } = t
        const form = (forms: typeof whyMe.people, n: number) => forms[plural.select(n)] ?? forms.other
        const title = whyMe.visitors
            .replace('{n}', String(visitors.visitors))
            .replace('{people}', form(whyMe.people, visitors.visitors))
            .replace('{days}', String(visitors.days))
            .replace('{daysWord}', form(whyMe.daysWord, visitors.days))
        const values = [
            visitors.lcp.count > 0 ? `${whyMe.metrics.lcp} ${time(visitors.lcp.p50)}` : null,
            visitors.js.count > 0 ? `JS ${Math.round(visitors.js.p50 / 1024)} ${whyMe.units.kb}` : null,
        ].filter(Boolean)
        return { title, values: values.join(' · ') }
    })

    const time = (ms: number | null | undefined) => {
        if (ms == null) return DASH
        const { units } = t.whyMe
        if (ms < 1000) return `${Math.round(ms)} ${units.ms}`
        return `${(ms / 1000).toFixed(1).replace('.', units.decimal)} ${units.s}`
    }

    const cells = $derived.by(() => {
        const { metrics: labels, units } = t.whyMe
        return [
            { key: 'paint', label: labels[metrics?.paint?.kind ?? 'lcp'], value: time(metrics?.paint?.ms) },
            { key: 'load', label: labels.load, value: time(metrics?.loadMs) },
            {
                key: 'js',
                label: labels.js,
                value: metrics?.jsBytes ? `${Math.round(metrics.jsBytes / 1024)} ${units.kb}` : DASH,
            },
            { key: 'fps', label: labels.fps, value: fps === null ? DASH : String(fps) },
        ]
    })
</script>

<div class="metrics" {@attach intersect((value) => (visible = value))}>
    <span class="caption measured">{t.whyMe.measured}</span>
    <dl class="grid" style:--chars={Math.max(1, ...cells.map((cell) => cell.value.length))}>
        {#each cells as cell (cell.key)}
            <div class="cell">
                <dt class="caption label">{cell.label}</dt>
                <dd class="value"><CountUp value={cell.value} /></dd>
            </div>
        {/each}
    </dl>
    {#if visitorsLine}
        <p class="visitors">
            <span class="caption visitors-title">{visitorsLine.title}</span>
            <span class="visitors-values">{visitorsLine.values}</span>
        </p>
    {/if}
</div>

<style>
    .metrics {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .measured {
        color: rgb(var(--c-accent) / 0.8);
        font-size: 0.65rem;
        letter-spacing: 0.12em;
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 0;
    }

    .cell {
        /* Цифры по ширине плитки: самое длинное значение ряда (--chars знаков по 0,85 em)
           всегда помещается, на узких экранах текст уменьшается */
        container-type: inline-size;
        display: flex;
        flex-direction: column-reverse;
        justify-content: flex-end;
        gap: 4px;
        padding: 10px 12px;
        border: 1px solid rgb(var(--c-accent) / 0.15);
        border-radius: 10px;
        background: rgb(var(--c-accent) / 0.06);
    }

    .label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
        line-height: 1.3;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .visitors {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        padding: 8px 12px;
        border-left: 2px solid rgb(var(--c-accent) / 0.6);
        background: rgb(var(--c-accent) / 0.05);
    }

    .visitors-title {
        color: rgb(var(--c-text-secondary));
        font-size: 0.6rem;
        letter-spacing: 0.06em;
        text-transform: none;
    }

    .visitors-values {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 0.8rem;
    }

    .value {
        margin: 0;
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: min(1rem, calc(115cqi / var(--chars)));
        line-height: 1.1;
        text-shadow: 0 0 16px rgb(var(--c-accent) / 0.6);
        white-space: nowrap;
    }
</style>
