<script lang="ts">
    import type { Snippet } from 'svelte'

    let { index, children }: { index: number; children?: Snippet } = $props()
</script>

<div class="section-index">
    <span class="caption number">{String(index).padStart(2, '0')}</span>
    <div class="neon-line"></div>
    {@render children?.()}
</div>

<style>
    .section-index {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .number {
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.25em;
    }

    .neon-line {
        width: 40px;
    }
</style>
