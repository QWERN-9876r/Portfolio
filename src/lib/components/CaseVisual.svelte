<script lang="ts">
    import type { CaseItem } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'
    import type { Rgb } from '$lib/three/prism'
    import { cssRgb } from '$lib/three/spectrum'

    // Цифры кейса наглядно: столбики «до» и «после» в цветах спектра, размеры — одной полосой
    // «что грузится и когда», для команды — схема «было → осталось».
    // Повторяет результат из плиток, поэтому скрыт от скринридеров
    let { t, caseItem, colors }: { t: Translation; caseItem: CaseItem; colors: readonly Rgb[] } = $props()

    // «+53%» → «после» выше «до» на 53%; результаты без процентов не рисуем
    const PERCENT = /([+-]?\d+(?:[.,]\d+)?)\s*%/
    const bars = $derived.by(() => {
        const items = caseItem.results.flatMap((result, index) => {
            const match = PERCENT.exec(result.value)
            if (!match) return []
            return [{ result, color: colors[index % colors.length], after: 100 + Number(match[1].replace(',', '.')) }]
        })
        const max = Math.max(100, ...items.map((item) => item.after))
        return items.map((item) => ({ ...item, before: 100 / max, after: item.after / max }))
    })

    // «62 КБ», «1,2 MB» → килобайты; доли полосы — от суммы. Нужно хотя бы два размера
    const SIZE = /(\d+(?:[.,]\d+)?)\s*(KB|КБ|MB|МБ)/i
    const sizes = $derived.by(() => {
        const items = caseItem.results.flatMap((result, index) => {
            const match = SIZE.exec(result.value)
            if (!match) return []
            const kb = Number(match[1].replace(',', '.')) * (/^(MB|МБ)$/i.test(match[2]) ? 1024 : 1)
            return [{ result, color: colors[index % colors.length], kb }]
        })
        const total = items.reduce((sum, item) => sum + item.kb, 0)
        return items.length > 1 ? items.map((item) => ({ ...item, share: item.kb / total })) : []
    })
</script>

{#if bars.length > 0 || sizes.length > 0 || caseItem.team}
    <div class="glass-panel visual" aria-hidden="true">
        {#if bars.length > 0}
            <span class="caption label">{t.cases.visual}</span>
            <div class="bars">
                {#each bars as bar, index (bar.result.label)}
                    <div class="bar-group" style:--c-accent={cssRgb(bar.color)} style:--i={index}>
                        <div class="pair">
                            <div class="bar before" style:--h={bar.before}>
                                <span class="caption bar-caption">{t.cases.before}</span>
                            </div>
                            <div class="bar after" style:--h={bar.after}>
                                <span class="caption bar-caption">{t.cases.after}</span>
                            </div>
                        </div>
                        <span class="value">{bar.result.value}</span>
                        <span class="caption name">{t.cases.resultLabels[bar.result.label] ?? bar.result.label}</span>
                    </div>
                {/each}
            </div>
        {/if}

        {#if bars.length === 0 && sizes.length > 0}
            <span class="caption label">{t.cases.sizes}</span>
            <div class="stacked">
                {#each sizes as size, index (size.result.label)}
                    <div
                        class="segment"
                        style:--share={size.share}
                        style:--c-accent={cssRgb(size.color)}
                        style:--i={index}
                    ></div>
                {/each}
            </div>
            <ul class="legend">
                {#each sizes as size (size.result.label)}
                    <li style:--c-accent={cssRgb(size.color)}>
                        <span class="swatch"></span>
                        <span class="legend-value">{size.result.value}</span>
                        <span class="legend-label">{t.cases.resultLabels[size.result.label] ?? size.result.label}</span>
                    </li>
                {/each}
            </ul>
        {/if}

        {#if caseItem.team}
            <div class="team">
                <span class="caption label">{t.cases.team}</span>
                <div class="people">
                    {#each Array.from({ length: caseItem.team.before }, (_, index) => index) as index (index)}
                        <svg class="person" class:gone={index >= caseItem.team.after} viewBox="0 0 24 24">
                            <!-- person из Material Icons (Apache 2.0) -->
                            <path
                                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                            />
                        </svg>
                    {/each}
                    <span class="count">{caseItem.team.before} → {caseItem.team.after}</span>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .visual {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
    }

    .label {
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.2em;
    }

    /* Сверху место под подписи «до» и «после» над столбиками */
    .bars {
        display: flex;
        justify-content: space-around;
        gap: 16px;
        padding-top: 14px;
    }

    .bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .pair {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 150px;
    }

    .bar {
        position: relative;
        width: 26px;
        height: calc(var(--h) * 100%);
        border-radius: 6px 6px 2px 2px;
        transform-origin: bottom;
    }

    .before {
        border: 1px solid rgb(var(--c-accent) / 0.35);
        background: rgb(var(--c-accent) / 0.12);
    }

    .after {
        background: linear-gradient(to top, rgb(var(--c-accent) / 0.55), rgb(var(--c-accent)));
        box-shadow: 0 0 18px rgb(var(--c-accent) / 0.45);
    }

    /* Столбики растут, когда кейс появился: сначала «до», за ним «после» */
    :global(.js) .bar {
        transform: scaleY(0);
        transition: transform 0.8s var(--ease-out) calc(0.5s + var(--i) * 0.15s);
    }

    :global(.js) .after {
        transition-delay: calc(0.75s + var(--i) * 0.15s);
    }

    :global(.js [data-revealed]) .bar {
        transform: none;
    }

    .bar-caption {
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        color: rgb(var(--c-text-secondary));
        font-size: 0.55rem;
        letter-spacing: 0.06em;
        transform: translateX(-50%);
    }

    .value {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 1rem;
        text-shadow: 0 0 14px rgb(var(--c-accent) / 0.7);
        white-space: nowrap;
    }

    .name {
        color: rgb(var(--c-text-secondary));
        font-size: 0.6rem;
        letter-spacing: 0.06em;
        text-transform: none;
    }

    /* Одна полоса: доли размеров. Сегменты вырастают слева направо, когда кейс появился */
    .stacked {
        display: flex;
        gap: 3px;
        height: 28px;
        margin-top: 6px;
    }

    .segment {
        flex: var(--share);
        border-radius: 6px;
        background: linear-gradient(to right, rgb(var(--c-accent) / 0.55), rgb(var(--c-accent)));
        box-shadow: 0 0 16px rgb(var(--c-accent) / 0.4);
        transform-origin: left;
    }

    :global(.js) .segment {
        transform: scaleX(0);
        transition: transform 0.8s var(--ease-out) calc(0.5s + var(--i) * 0.3s);
    }

    :global(.js [data-revealed]) .segment {
        transform: none;
    }

    .legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .legend li {
        display: flex;
        align-items: baseline;
        gap: 10px;
    }

    .swatch {
        flex-shrink: 0;
        width: 10px;
        height: 10px;
        border-radius: 3px;
        background: rgb(var(--c-accent));
        box-shadow: 0 0 8px rgb(var(--c-accent) / 0.7);
        transform: translateY(1px);
    }

    .legend-value {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 0.95rem;
        white-space: nowrap;
    }

    .legend-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.8rem;
        line-height: 1.3;
    }

    .team {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 16px;
        border-top: 1px solid rgb(var(--c-neon) / 0.15);
    }

    .bars + .team {
        margin-top: 4px;
    }

    .people {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .person {
        width: 30px;
        height: 30px;
        color: #ebf5ff;
        fill: currentColor;
        filter: drop-shadow(0 0 8px rgb(var(--c-neon)));
    }

    .person.gone {
        color: rgb(var(--c-neon) / 0.25);
        filter: none;
    }

    .count {
        margin-left: 8px;
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1rem;
    }
</style>
