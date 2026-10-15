<script lang="ts">
    import type { Translation } from '$lib/i18n/translations'
    import counter from '$lib/mango/counter.mango?raw'
    import goroutines from '$lib/mango/goroutines.mango?raw'
    import { highlight } from '$lib/mango/highlight'

    // Примеры на MangoScript в правом слоте кейса, с подсветкой: компонент и горутины — вкладками.
    // Код — из документации языка; у горутин без замеров времени и комментариев
    let { t }: { t: Translation } = $props()

    const FILES = [
        { name: 'counter', tokens: highlight(counter.trimEnd()) },
        { name: 'goroutines', tokens: highlight(goroutines.trimEnd()) },
    ] as const
    const uid = $props.id()

    let active = $state(0)
    let tabs: HTMLButtonElement[] = []

    // Стрелки переключают вкладки и переносят на них фокус — как в tablist по WAI-ARIA
    const onkeydown = (event: KeyboardEvent, index: number) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (!step) return
        event.preventDefault()
        active = (index + step + FILES.length) % FILES.length
        tabs[active]?.focus()
    }
</script>

<!-- В HTML все вкладки сразу, неактивные — hidden: код и подписи видны поисковикам и без JS -->
<figure class="glass-panel demo">
    <figcaption class="caption label">{t.cases.demo.label}</figcaption>
    <div class="window">
        <div class="bar" role="tablist" aria-label={t.cases.demo.label}>
            {#each FILES as file, index (file.name)}
                <button
                    bind:this={tabs[index]}
                    type="button"
                    role="tab"
                    class="file"
                    id="{uid}-tab-{file.name}"
                    aria-controls="{uid}-{file.name}"
                    aria-selected={index === active}
                    tabindex={index === active ? 0 : -1}
                    onclick={() => (active = index)}
                    onkeydown={(event) => onkeydown(event, index)}>{file.name}.mango</button
                >
            {/each}
        </div>
        {#each FILES as file, index (file.name)}
            <div role="tabpanel" id="{uid}-{file.name}" aria-labelledby="{uid}-tab-{file.name}" hidden={index !== active}>
                <!-- В одну строку: внутри <pre> каждый пробел между тегами попал бы в код -->
                <pre class="code"><code>{#each file.tokens as token, index (index)}{#if token.kind === 'text'}{token.text}{:else}<span class={token.kind}>{token.text}</span>{/if}{/each}</code></pre>
            </div>
        {/each}
    </div>
    {#each FILES as file, index (file.name)}
        <p class="body2 note" hidden={index !== active}>{t.cases.demo.notes[file.name]}</p>
    {/each}
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
        gap: 4px;
        padding: 0 8px;
        border-bottom: 1px solid rgb(var(--c-neon) / 0.15);
        background: rgb(var(--c-neon) / 0.06);
    }

    .file {
        margin-bottom: -1px;
        padding: 8px 8px 7px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: none;
        color: rgb(var(--c-text-secondary));
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.72rem;
        cursor: pointer;
        transition: color 0.2s ease;
    }

    .file:hover,
    .file[aria-selected='true'] {
        color: rgb(var(--c-text-primary));
    }

    .file[aria-selected='true'] {
        border-bottom-color: rgb(var(--c-neon-soft));
    }

    .file:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: -2px;
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
