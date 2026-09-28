<script lang="ts">
    import { HISTORY } from '$lib/stats/tabMetrics.svelte'

    // Линия последних значений; масштаб — от минимума до максимума, чтобы было видно движение
    let { values }: { values: number[] } = $props()

    const points = $derived.by(() => {
        const min = Math.min(...values)
        const range = Math.max(...values) - min || 1
        return values
            .map((value, index) => `${HISTORY - values.length + index},${1 - ((value - min) / range) * 0.9 - 0.05}`)
            .join(' ')
    })
</script>

<svg class="sparkline" viewBox="0 0 {HISTORY} 1" preserveAspectRatio="none" aria-hidden="true">
    {#if values.length > 1}
        <polyline {points} />
    {/if}
</svg>

<style>
    .sparkline {
        display: block;
        width: 100%;
        height: 24px;
    }

    polyline {
        fill: none;
        stroke: rgb(var(--c-accent));
        stroke-width: 1.5px;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
    }
</style>
