<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { Translation } from '$lib/i18n/translations'

    let { t }: { t: Translation } = $props()

    const FACTS = [
        { value: '2', kind: 'years' },
        { value: '2', kind: 'company' },
    ] as const

    // Ключевые слова подсвечиваются <strong>; тексты свои, из translations
    const aboutText = $derived(
        t.about.highlights.reduce(
            (text, word) => text.replace(word, `<strong>${word}</strong>`),
            t.about.text,
        ),
    )

    const delay = (index: number) => `${0.15 + index * 0.13}s`
</script>

<section id="about" class="snap-section" {@attach reveal()}>
    <div class="section-content reveal" style:--from="translateY(60px)" style:--blur="10px" style:--duration="0.75s">
        <div class="stack">
            <div class="reveal item" style:--delay={delay(0)}>
                <SectionIndex index={1}>
                    <h2 class="h2 title">{t.sections.about}</h2>
                </SectionIndex>
            </div>

            <div class="row">
                <div class="reveal item bio" style:--delay={delay(1)}>
                    <div class="glass-panel panel">
                        <span class="caption label">{t.about.bio}</span>
                        <p class="body1 text">{@html aboutText}</p>
                    </div>
                </div>

                <div class="reveal item" style:--delay={delay(2)}>
                    <div class="facts">
                        {#each FACTS as fact (fact.kind)}
                            <div class="glass-panel fact">
                                <p class="fact-value">{fact.value}</p>
                                <span class="caption fact-label">{t.about[fact.kind]}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .item {
        --from: translateY(28px);
        --blur: 6px;
        --duration: 0.6s;
    }

    .stack {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .title {
        color: rgb(var(--c-text-primary));
    }

    .row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
    }

    .bio {
        flex: 1;
    }

    .panel {
        padding: 24px;
    }

    .label {
        display: block;
        margin-bottom: 16px;
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.2em;
    }

    .text {
        color: rgb(var(--c-text-secondary));
        line-height: 1.85;
    }

    .text :global(strong) {
        color: rgb(var(--c-text-primary));
        font-weight: 600;
    }

    .facts {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }

    .fact {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 120px;
        padding: 16px;
        text-align: center;
        transition: all 0.25s ease;
    }

    .fact:hover {
        border-color: rgb(var(--c-neon) / 0.5);
        box-shadow: 0 0 24px rgb(var(--c-neon) / 0.12);
        transform: translateY(-2px);
    }

    .fact-value {
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1.6rem;
        line-height: 1;
        text-shadow: 0 0 20px rgb(var(--c-neon) / 0.5);
    }

    .fact-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.7rem;
        line-height: 1.3;
        letter-spacing: 0.05em;
        text-transform: none;
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .row {
            flex-direction: row;
            gap: 48px;
        }

        .panel {
            padding: 32px;
        }

        .facts {
            flex-direction: column;
        }

        .fact {
            padding: 24px;
        }

        .fact-value {
            font-size: 2rem;
        }
    }
</style>
