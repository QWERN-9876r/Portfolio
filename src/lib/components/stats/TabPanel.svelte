<script lang="ts">
    import FramesChart from '$lib/components/stats/FramesChart.svelte'
    import Sparkline from '$lib/components/stats/Sparkline.svelte'
    import StatTile from '$lib/components/stats/StatTile.svelte'
    import type { StatsTranslation } from '$lib/i18n/stats'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { formatDuration, formatMb, formatMs, vitalNote } from '$lib/stats/format'
    import type { TabMetrics } from '$lib/stats/tabMetrics.svelte'
    import { rate, rateDropped, rateIdleFrames, type Rating, type Vital } from '$lib/stats/vitals'
    import { cssRgb, SPECTRUM } from '$lib/three/spectrum'
    import { glowPrism } from '$lib/three/prismGlow.svelte'

    // Эта вкладка прямо сейчас: всё меняется от действий посетителя.
    // Кадры — двумя числами: в покое (0 — ничего не рисуется зря) и плавность, когда что-то движется
    let {
        t,
        s,
        lang,
        metrics,
    }: { t: Translation; s: StatsTranslation; lang: Locale; metrics: TabMetrics } = $props()

    const number = $derived(new Intl.NumberFormat(lang))
    const labeled = (level: Rating) => ({ level, label: s.rating[level] })
    const rating = (vital: Vital, value: number) => labeled(rate(vital, value))
    const decimal = (value: number) => String(value).replace('.', t.whyMe.units.decimal)
    const ms = (value: number) => formatMs(value, t)

    const idle = $derived(metrics.idleFps === null ? null : labeled(rateIdleFrames(metrics.idleFps)))
    const smooth = $derived(metrics.smooth && labeled(rateDropped(metrics.smooth.dropped)))
    const dropped = $derived(metrics.smooth ? Math.round(metrics.smooth.dropped * 100) : 0)
    const tasks = $derived(metrics.longTasks)
</script>

<section
    class="glass-panel panel"
    style:--c-accent={cssRgb(SPECTRUM.violet)}
    {@attach glowPrism({ ray: false, color: SPECTRUM.violet })}
>
    <header class="panel-header">
        <h2 class="h4">{s.tab.title}</h2>
        <span class="caption tick">{s.tab.caption}</span>
    </header>

    <div class="frames">
        <dl class="frames-now">
            <div class="big" data-rating={idle?.level}>
                <dt class="caption big-label">{s.tab.idle}</dt>
                <dd class="big-value">{metrics.idleFps ?? '—'}</dd>
                {#if idle}
                    <dd class="visually-hidden">{idle.label}</dd>
                    {#if metrics.idleFps === 0}
                        <dd class="big-note">{s.tab.idleNote}</dd>
                    {/if}
                {/if}
            </div>
            <div class="big" data-rating={smooth?.level}>
                <dt class="caption big-label">{s.tab.smooth}</dt>
                <dd class="big-value">{metrics.smooth?.fps ?? '—'}</dd>
                {#if smooth}
                    <dd class="visually-hidden">{smooth.label}</dd>
                {/if}
                <dd class="big-note">
                    {#if !metrics.smooth}
                        {s.tab.smoothHint}
                    {:else if dropped === 0}
                        {s.tab.noDrops}
                    {:else}
                        {s.tab.dropped.replace('{n}', String(dropped))}
                    {/if}
                </dd>
            </div>
        </dl>

        <div class="chart">
            <span class="caption chart-title">{s.tab.frames}</span>
            <FramesChart values={metrics.fps} />
            <p class="caption legend" aria-hidden="true">
                <span class="legend-item idle">{s.tab.legendIdle}</span>
                <span class="legend-item motion">{s.tab.legendMotion}</span>
            </p>
        </div>
        <p class="body2 hint">{s.tab.framesHint}</p>
    </div>

    <dl class="tiles">
        <StatTile
            label={s.tab.inp}
            value={metrics.inp === null ? '—' : ms(metrics.inp)}
            rating={metrics.inp === null ? null : rating('inp', metrics.inp)}
            hint={metrics.inp !== null
                ? vitalNote('inp', metrics.inp, s, lang, ms)
                : metrics.measuresInp
                  ? s.tab.inpHint
                  : s.unsupported}
        />
        <StatTile
            label={s.tab.longTasks}
            value={tasks ? String(tasks.count) : '—'}
            rating={tasks && rating('tbt', tasks.blocking)}
            hint={!tasks
                ? s.unsupported
                : tasks.blocking === 0
                  ? s.noBlocking
                  : s.tab.blocking.replace('{ms}', ms(tasks.blocking))}
        />
        <StatTile
            label={s.tab.cls}
            value={metrics.cls === null ? '—' : decimal(Number(metrics.cls.toFixed(3)))}
            rating={metrics.cls === null ? null : rating('cls', metrics.cls)}
            hint={metrics.cls === null
                ? s.unsupported
                : metrics.cls === 0
                  ? s.noShifts
                  : vitalNote('cls', metrics.cls, s, lang, decimal)}
        />
        <StatTile
            label={s.tab.memory}
            value={metrics.memory ? formatMb(metrics.memory.at(-1) ?? 0, t, s) : '—'}
            hint={metrics.memory ? undefined : s.unsupported}
        >
            {#if metrics.memory}
                <Sparkline values={metrics.memory} />
            {/if}
        </StatTile>
        <StatTile
            label={s.tab.nodes}
            value={metrics.nodes ? number.format(metrics.nodes) : '—'}
            rating={metrics.nodes ? rating('dom', metrics.nodes) : null}
            hint={metrics.nodes ? vitalNote('dom', metrics.nodes, s, lang, (norm) => number.format(norm)) : undefined}
        />
        <StatTile label={s.tab.uptime} value={metrics.uptime ? formatDuration(metrics.uptime) : '—'} />
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
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 4px 16px;
    }

    .panel-header .h4 {
        color: rgb(var(--c-text-primary));
    }

    .tick {
        color: rgb(var(--c-accent) / 0.85);
        font-size: 0.65rem;
    }

    .frames {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .frames-now {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin: 0;
    }

    /* Число над подписью, хотя в разметке подпись (dt) — первой */
    .big {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    dd {
        margin: 0;
    }

    .big-value {
        order: -1;
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 2.25rem;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 24px rgb(var(--c-accent) / 0.7);
    }

    .big-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.7rem;
    }

    .big-note {
        color: rgb(var(--c-text-secondary) / 0.85);
        font-size: 0.75rem;
        line-height: 1.4;
    }

    /* Хорошо — зелёным, можно лучше — янтарём, плохо — розовым */
    .big[data-rating='good'] {
        --c-rating: var(--c-good);
    }
    .big[data-rating='fair'] {
        --c-rating: var(--c-fair);
    }
    .big[data-rating='poor'] {
        --c-rating: var(--c-poor);
    }

    .big[data-rating] .big-value {
        color: rgb(var(--c-rating));
        text-shadow: 0 0 24px rgb(var(--c-rating) / 0.6);
    }

    .big[data-rating='good'] .big-note {
        color: rgb(var(--c-good) / 0.85);
    }

    .chart {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .chart-title {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
    }

    .legend {
        display: flex;
        gap: 16px;
        color: rgb(var(--c-text-secondary));
        font-size: 0.6rem;
        letter-spacing: 0.06em;
    }

    .legend-item::before {
        content: '';
        display: inline-block;
        width: 8px;
        margin-right: 6px;
        border-radius: 1px;
    }

    .legend-item.idle::before {
        height: 4px;
        background: rgb(var(--c-good) / 0.8);
    }

    .legend-item.motion::before {
        height: 10px;
        background: rgb(var(--c-accent) / 0.85);
    }

    .hint {
        color: rgb(var(--c-text-secondary));
        font-size: 0.78rem;
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    @media (min-width: 600px) {
        .panel {
            padding: 24px;
        }

        .tiles {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
</style>
