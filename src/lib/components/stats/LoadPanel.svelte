<script lang="ts">
    import StatTile from '$lib/components/stats/StatTile.svelte'
    import type { StatsTranslation } from '$lib/i18n/stats'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { JS_BUDGET_KB } from '$lib/site'
    import { formatKb, formatMs, vitalNote } from '$lib/stats/format'
    import type { TabMetrics } from '$lib/stats/tabMetrics.svelte'
    import { rate, rateBudget, type Vital } from '$lib/stats/vitals'
    import { cssRgb, SPECTRUM } from '$lib/three/spectrum'
    import { glowPrism } from '$lib/three/prismGlow.svelte'

    // Как загрузился сайт в этой вкладке: шкала от запроса до load, JS и запросы.
    // JS «сейчас» и запросы растут, пока догружаются 3D-сцена и Pixi
    let {
        t,
        s,
        lang,
        metrics,
    }: { t: Translation; s: StatsTranslation; lang: Locale; metrics: TabMetrics } = $props()

    const ms = (value: number) => formatMs(value, t)

    const marks = $derived.by(() => {
        const load = metrics.load
        if (!load) return []
        const items: { key: string; label: string; ms: number | null; vital?: Vital }[] = [
            { key: 'ttfb', label: s.load.ttfb, ms: load.ttfb, vital: 'ttfb' },
            { key: 'fcp', label: s.load.fcp, ms: load.fcp, vital: 'fcp' },
            { key: 'lcp', label: s.load.lcp, ms: load.lcp, vital: 'lcp' },
            { key: 'dom', label: s.load.domReady, ms: load.domReady },
            { key: 'load', label: s.load.load, ms: load.load },
        ]
        const known = items.filter((item): item is typeof item & { ms: number } => item.ms !== null && item.ms > 0)
        const end = Math.max(...known.map((item) => item.ms))
        return known.map((item) => {
            const level = item.vital ? rate(item.vital, item.ms) : null
            return {
                ...item,
                at: item.ms / end,
                rating: level && { level, label: s.rating[level] },
                // С чем сравнивать: «в 30 раз лучше нормы Google — 2,5 с»
                note: item.vital && vitalNote(item.vital, item.ms, s, lang, ms),
            }
        })
    })

    // JS до загрузки — против бюджета, который держат тесты
    const jsRating = $derived.by(() => {
        if (!metrics.js.atLoad) return null
        const level = rateBudget(metrics.js.atLoad / 1024, JS_BUDGET_KB)
        return { level, label: s.rating[level] }
    })
</script>

<section
    class="glass-panel panel"
    style:--c-accent={cssRgb(SPECTRUM.blue)}
    {@attach glowPrism({ ray: false, color: SPECTRUM.blue })}
>
    <header class="panel-header">
        <h2 class="h4">{s.load.title}</h2>
        {#if metrics.load}
            <span class="caption path">{s.load.caption.replace('{path}', metrics.load.path)}</span>
        {/if}
    </header>

    <div class="timeline" aria-hidden="true">
        <div class="track"></div>
        {#each marks as mark (mark.key)}
            <span class="mark" data-key={mark.key} style:--at={mark.at}></span>
        {/each}
    </div>

    <dl class="tiles">
        {#each marks as mark (mark.key)}
            <StatTile label={mark.label} value={ms(mark.ms)} rating={mark.rating} hint={mark.note || undefined} />
        {:else}
            <StatTile label={s.load.load} value="—" />
        {/each}
        <StatTile
            label={s.load.jsAtLoad}
            value={metrics.js.atLoad ? formatKb(metrics.js.atLoad, t) : '—'}
            rating={jsRating}
            hint={jsRating?.level === 'good'
                ? s.inBudget.replace('{budget}', `${JS_BUDGET_KB} ${t.whyMe.units.kb}`)
                : undefined}
        />
        <StatTile label={s.load.jsNow} value={metrics.js.now ? formatKb(metrics.js.now, t) : '—'} />
        <StatTile
            label={s.load.requests}
            value={metrics.requests.total ? String(metrics.requests.total) : '—'}
            hint={metrics.requests.total ? s.load.cached.replace('{n}', String(metrics.requests.cached)) : undefined}
        />
        {#if metrics.offline !== null}
            <StatTile label={s.load.offline} value={String(metrics.offline)} />
        {/if}
    </dl>
</section>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 20px;
    }

    .panel-header {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .panel-header .h4 {
        color: rgb(var(--c-text-primary));
    }

    .path {
        color: rgb(var(--c-accent) / 0.85);
        font-size: 0.65rem;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    /* Шкала от запроса до load: отметки — в цветах плиток ниже */
    .timeline {
        position: relative;
        height: 18px;
    }

    .track {
        position: absolute;
        inset: 8px 0 auto;
        height: 2px;
        border-radius: 2px;
        background: linear-gradient(90deg, rgb(var(--c-accent) / 0.8), rgb(var(--c-accent) / 0.15));
    }

    .mark {
        position: absolute;
        top: 3px;
        left: calc(var(--at) * 100%);
        width: 2px;
        height: 12px;
        border-radius: 1px;
        background: rgb(var(--c-text-primary) / 0.8);
        box-shadow: 0 0 8px rgb(var(--c-accent));
        translate: -1px 0;
    }

    .mark[data-key='lcp'] {
        height: 16px;
        top: 1px;
        background: rgb(var(--c-accent));
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
    }

    @media (min-width: 600px) {
        .panel {
            padding: 24px;
        }
    }
</style>
