<script lang="ts">
    import type { Snippet } from 'svelte'

    // Замена MUI Tooltip (placement top, arrow, enterDelay 200) на чистом CSS
    let { label, block = false, children }: { label: string; block?: boolean; children: Snippet } =
        $props()
</script>

<span class="tooltip-anchor" class:block>
    {@render children()}
    <!-- Подпись дублирует aria-label ссылки внутри, скринридеру её читать не нужно -->
    <span class="tooltip" aria-hidden="true">{label}</span>
</span>

<style>
    .tooltip-anchor {
        position: relative;
        display: inline-flex;
    }

    .tooltip-anchor.block {
        display: flex;
    }

    .tooltip {
        position: absolute;
        bottom: calc(100% + 14px);
        left: 50%;
        z-index: 10;
        padding: 4px 8px;
        border: 1px solid var(--glass-border);
        border-radius: 4px;
        background: rgb(var(--c-bg-elevated));
        backdrop-filter: blur(8px);
        color: rgb(var(--c-text-primary));
        font-family: var(--font-body);
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1.4;
        letter-spacing: normal;
        text-transform: none;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transform: translate(-50%, 4px) scale(0.9);
        transform-origin: bottom center;
        transition:
            opacity 0.15s ease,
            transform 0.15s ease;
    }

    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        width: 8px;
        height: 8px;
        border-right: 1px solid var(--glass-border);
        border-bottom: 1px solid var(--glass-border);
        background: rgb(var(--c-bg-elevated));
        transform: translate(-50%, -50%) rotate(45deg);
    }

    .tooltip-anchor:hover .tooltip,
    .tooltip-anchor:focus-within .tooltip {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
        transition-delay: 0.2s;
    }
</style>
