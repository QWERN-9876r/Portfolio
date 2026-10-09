<script lang="ts">
    import type { Translation } from '$lib/i18n/translations'
    import source from '$lib/mango/counter.mango?raw'
    import { highlight } from '$lib/mango/highlight'

    // Пример на MangoScript в правом слоте кейса: компонент целиком, с подсветкой.
    // Код — ровно пример из документации языка
    let { t }: { t: Translation } = $props()

    const FILE = 'counter.mango'
    const tokens = highlight(source.trimEnd())
</script>

<figure class="glass-panel demo">
    <figcaption class="caption label">{t.cases.demo.label}</figcaption>
    <div class="window">
        <div class="bar">
            <span class="file">{FILE}</span>
        </div>
        <!-- В одну строку: внутри <pre> каждый пробел между тегами попал бы в код -->
        <pre class="code"><code>{#each tokens as token, index (index)}{#if token.kind === 'text'}{token.text}{:else}<span class={token.kind}>{token.text}</span>{/if}{/each}</code></pre>
    </div>
    <p class="body2 note">{t.cases.demo.note}</p>
</figure>

<style>
    .demo {
        display: flex;
        flex-direction: column;
        gap: 14px;
        height: 100%;
        margin: 0;
        padding: 20px;
    }

    .label {
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.2em;
    }

    .window {
        overflow: hidden;
        border: 1px solid rgb(var(--c-neon) / 0.25);
        border-radius: 12px;
        background: rgb(var(--c-bg-deep) / 0.7);
    }

    .bar {
        display: flex;
        align-items: center;
        padding: 8px 14px;
        border-bottom: 1px solid rgb(var(--c-neon) / 0.15);
        background: rgb(var(--c-neon) / 0.06);
    }

    .file {
        color: rgb(var(--c-text-secondary));
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.72rem;
    }

    /* Системный моноширинный шрифт — без загрузки ещё одного файла шрифта */
    .code {
        margin: 0;
        padding: 14px;
        overflow-x: auto;
        color: rgb(var(--c-text-primary));
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.72rem;
        line-height: 1.7;
        tab-size: 4;
    }

    .keyword {
        color: rgb(167 139 250);
    }

    .type {
        color: rgb(34 211 238);
    }

    .tag {
        color: rgb(96 165 250);
    }

    .attr {
        color: rgb(165 180 252);
    }

    .string {
        color: rgb(var(--c-good));
    }

    .number {
        color: rgb(var(--c-fair));
    }

    .comment {
        color: rgb(var(--c-text-secondary));
        font-style: italic;
    }

    .note {
        margin: 0;
        color: rgb(var(--c-text-secondary));
        font-size: 0.85rem;
        line-height: 1.6;
    }

    @media (min-width: 900px) {
        .code {
            padding: 16px 20px;
            font-size: 0.85rem;
        }
    }
</style>
