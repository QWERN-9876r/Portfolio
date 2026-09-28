<script lang="ts">
    import type { Snippet } from 'svelte'
    import type { Rating } from '$lib/stats/vitals'

    // Плитка в <dl>: подпись, значение, под ним — график или пояснение.
    // rating — оценка по нормам Google и Lighthouse: цвет значения и подпись для скринридеров
    let {
        label,
        value,
        hint,
        rating,
        children,
    }: {
        label: string
        value: string
        hint?: string
        rating?: { level: Rating; label: string } | null
        children?: Snippet
    } = $props()
</script>

<div class="tile" data-rating={rating?.level}>
    <dt class="caption label">{label}</dt>
    <dd class="value">{value}</dd>
    {#if rating}
        <dd class="visually-hidden">{rating.label}</dd>
    {/if}
    {#if children}
        <dd class="extra">{@render children()}</dd>
    {/if}
    {#if hint}
        <dd class="hint">{hint}</dd>
    {/if}
</div>

<style>
    .tile {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid rgb(var(--c-accent) / 0.15);
        border-radius: 10px;
        background: rgb(var(--c-accent) / 0.06);
    }

    dd {
        margin: 0;
    }

    .label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
        line-height: 1.3;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .value {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 1.05rem;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 16px rgb(var(--c-accent) / 0.5);
        white-space: nowrap;
    }

    /* Значение — цветом оценки: хорошие цифры видны сразу */
    [data-rating] .value {
        color: rgb(var(--c-rating));
        text-shadow: 0 0 18px rgb(var(--c-rating) / 0.55);
    }

    [data-rating='good'] .hint {
        color: rgb(var(--c-good) / 0.85);
    }

    [data-rating='good'] {
        --c-rating: var(--c-good);
    }
    [data-rating='fair'] {
        --c-rating: var(--c-fair);
    }
    [data-rating='poor'] {
        --c-rating: var(--c-poor);
    }

    .hint {
        color: rgb(var(--c-text-secondary) / 0.85);
        font-size: 0.7rem;
        line-height: 1.4;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
</style>
