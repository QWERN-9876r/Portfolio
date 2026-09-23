<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import Chip from '$lib/components/Chip.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { CaseItem } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'

    let { t, caseItem }: { t: Translation; caseItem: CaseItem } = $props()

    const blockDelay = (index: number) => `${0.1 + index * 0.15}s`
    const resultDelay = (index: number) => `${0.05 + index * 0.1}s`
</script>

<section id={caseItem.id} class="snap-section" {@attach reveal('-10%')}>
    <div class="section-content layout" class:with-slot={!caseItem.hideRightSlot}>
        <div class="main">
            <div class="reveal heading">
                <SectionIndex index={caseItem.index}>
                    <span class="caption case-label">{t.cases.label}</span>
                </SectionIndex>

                <h2 class="h2 title">{caseItem.title}</h2>

                <div class="meta">
                    <p class="body2 company">{caseItem.company}</p>
                    {#if caseItem.period}
                        <span class="meta-dot"></span>
                        <p class="body2 period">{caseItem.period}</p>
                    {/if}
                </div>
            </div>

            <div class="blocks">
                {@render contentBlock(t.cases.problem, 'problem', caseItem.problem, 0)}
                {@render contentBlock(t.cases.solution, 'solution', caseItem.solution, 1)}

                <div class="reveal block" style:--delay={blockDelay(2)}>
                    <div class="glass-panel panel">
                        <span class="caption results-label">{t.cases.result}</span>
                        <div class="results">
                            {#each caseItem.results as result, index (result.label)}
                                <div class="reveal result-wrap" style:--delay={resultDelay(index)}>
                                    <div class="result">
                                        <p class="result-value">{result.value}</p>
                                        <span class="caption result-label">{result.label}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                {#if caseItem.tags?.length}
                    <div class="reveal block tags" style:--delay={blockDelay(3)}>
                        {#each caseItem.tags as tag (tag)}
                            <Chip label={tag} />
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        {#if !caseItem.hideRightSlot}
            <!-- Точка монтирования будущих 3D-сцен (Threlte) -->
            <div class="reveal slot-wrap">
                <div class="slot" data-case-id={caseItem.id}>
                    <span class="caption slot-label">
                        ПРАВЫЙ СЛОТ<br />{caseItem.id.toUpperCase()}<br />ТВОЙ ИНТЕРАКТИВ
                    </span>
                </div>
            </div>
        {/if}
    </div>
</section>

{#snippet contentBlock(label: string, kind: 'problem' | 'solution', text: string, index: number)}
    <div class="reveal block" style:--delay={blockDelay(index)}>
        <div class="glass-panel panel content-block {kind}">
            <span class="caption block-label">{label}</span>
            <p class="body2 block-text">{text}</p>
        </div>
    </div>
{/snippet}

<style>
    .layout {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
    }

    .main {
        display: flex;
        flex: none;
        flex-direction: column;
        gap: 24px;
        width: 100%;
        min-width: 0;
    }

    .with-slot .main {
        flex: 1;
    }

    .heading {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .case-label {
        color: rgb(var(--c-neon-soft) / 0.5);
        letter-spacing: 0.15em;
    }

    .title {
        color: rgb(var(--c-text-primary));
        line-height: 1;
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    }

    .company {
        color: rgb(var(--c-neon-soft));
        font-size: 0.9rem;
        font-weight: 600;
    }

    .meta-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgb(var(--c-neon) / 0.4);
    }

    .period {
        color: rgb(var(--c-text-secondary));
        font-size: 0.85rem;
        font-style: italic;
    }

    .blocks {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .block {
        --from: translateY(24px);
        --blur: 6px;
        --duration: 0.6s;
    }

    .panel {
        padding: 20px;
    }

    .content-block {
        --accent: rgb(var(--c-neon) / 0.6);
        border-left: 3px solid var(--accent);
        border-radius: 4px 16px 16px 4px;
    }

    .content-block.solution {
        --accent: rgb(var(--c-neon-soft));
    }

    .block-label {
        display: block;
        margin-bottom: 12px;
        color: var(--accent);
        letter-spacing: 0.2em;
    }

    .block-text {
        color: rgb(var(--c-text-secondary));
        line-height: 1.8;
    }

    .results-label {
        display: block;
        margin-bottom: 16px;
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.2em;
    }

    .results {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
    }

    .result-wrap {
        --from: scale(0.8);
        --blur: 4px;
        --duration: 0.45s;
        --ease: var(--ease-overshoot);
    }

    .result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px;
        border: 1px solid rgb(var(--c-neon) / 0.15);
        border-radius: 12px;
        background: rgb(var(--c-neon) / 0.06);
        text-align: center;
        transition: all 0.25s ease;
    }

    .result:hover {
        border-color: rgb(var(--c-neon) / 0.4);
        background: rgb(var(--c-neon) / 0.1);
        box-shadow: 0 0 20px rgb(var(--c-neon) / 0.12);
        transform: translateY(-2px);
    }

    .result-value {
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1.4rem;
        line-height: 1;
        text-shadow: 0 0 20px rgb(var(--c-neon) / 0.5);
    }

    .result-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.7rem;
        line-height: 1.3;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .slot-wrap {
        --from: translateX(40px);
        --blur: 10px;
        --duration: 0.75s;
        --delay: 0.2s;
        flex-shrink: 0;
        width: 100%;
    }

    .slot {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        height: 220px;
        border: 1px dashed rgb(var(--c-neon) / 0.2);
        border-radius: 20px;
        background:
            radial-gradient(ellipse 60% 50% at 50% 50%, rgb(var(--c-neon) / 0.04) 0%, transparent 70%),
            rgb(var(--c-bg-elevated) / 0.2);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }

    .slot-label {
        color: rgb(var(--c-neon-soft) / 0.25);
        font-size: 0.65rem;
        letter-spacing: 0.2em;
        text-align: center;
    }

    @media (min-width: 900px) {
        .main {
            gap: 28px;
        }

        .panel {
            padding: 24px;
        }

        .result {
            padding: 16px;
        }

        .result-value {
            font-size: 1.75rem;
        }
    }

    @media (min-width: 1200px) {
        .layout {
            align-items: center;
        }

        .layout.with-slot {
            flex-direction: row;
            gap: 48px;
        }

        .slot-wrap {
            width: auto;
        }

        .slot {
            width: 400px;
            height: 400px;
        }
    }
</style>
