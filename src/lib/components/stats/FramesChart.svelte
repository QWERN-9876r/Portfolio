<script lang="ts">
    import { HISTORY } from '$lib/stats/tabMetrics.svelte'

    // Кадры по секундам: справа — последняя. Секунды без кадров — зелёная точка на оси:
    // это покой, а не пропуск данных. Шкала — до 60 кадров или частоты экрана, если она выше
    let { values }: { values: number[] } = $props()

    const max = $derived(Math.max(60, ...values))
    const bars = $derived(
        values.map((value, index) => ({
            x: HISTORY - values.length + index,
            height: value === 0 ? 0.06 : Math.max(value / max, 0.06),
            idle: value === 0,
        })),
    )
</script>

<svg class="chart" viewBox="0 0 {HISTORY} 1" preserveAspectRatio="none" aria-hidden="true">
    <line class="grid" x1="0" x2={HISTORY} y1="0.5" y2="0.5" />
    {#each bars as bar, index (index)}
        <rect class:idle={bar.idle} x={bar.x + 0.15} y={1 - bar.height} width="0.7" height={bar.height} />
    {/each}
</svg>

<style>
    .chart {
        display: block;
        width: 100%;
        height: 72px;
        overflow: visible;
    }

    .grid {
        stroke: rgb(var(--c-accent) / 0.15);
        stroke-dasharray: 0.5 0.5;
        stroke-width: 1px;
        vector-effect: non-scaling-stroke;
    }

    rect {
        fill: rgb(var(--c-accent) / 0.85);
    }

    rect.idle {
        fill: rgb(var(--c-good) / 0.8);
    }
</style>
