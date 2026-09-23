<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import Chip from '$lib/components/Chip.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { ExperienceData } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'

    let { t, experience }: { t: Translation; experience: ExperienceData } = $props()

    const delay = (index: number) => `${0.25 + index * 0.2}s`
</script>

<section id="experience" class="snap-section" {@attach reveal()}>
    <div class="section-content stack">
        <div class="reveal heading">
            <SectionIndex index={11} />
            <div class="title-row">
                <h2 class="h2 title">{t.sections.experience}</h2>
                <p class="h2 company">{experience.company}</p>
                <p class="body2 location">{experience.location}</p>
            </div>
        </div>

        <div class="timeline">
            <div class="track" aria-hidden="true">
                <div class="dot"></div>
                <div class="line"></div>
                <div class="dot open"></div>
            </div>

            <div class="items">
                {#each experience.items as item, index (item.period)}
                    <div class="reveal item" style:--delay={delay(index)}>
                        <div class="glass-panel card">
                            <div class="card-head">
                                <h3 class="h5 card-title">{item.title}</h3>
                                <span class="caption period">{item.period}</span>
                            </div>
                            <div class="divider"></div>
                            <p class="body2 description">{item.description}</p>
                            {#if item.tags?.length}
                                <div class="tags">
                                    {#each item.tags as tag (tag)}
                                        <Chip label={tag} />
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</section>

<style>
    .stack {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .heading {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 16px;
    }

    .title {
        color: rgb(var(--c-text-primary));
    }

    .company {
        color: rgb(var(--c-neon-soft));
        text-shadow: 0 0 30px rgb(var(--c-neon) / 0.4);
    }

    .location {
        align-self: center;
        color: rgb(var(--c-text-secondary));
        font-style: italic;
    }

    .timeline {
        display: flex;
        gap: 24px;
    }

    .track {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        align-items: center;
        padding-top: 6px;
    }

    .dot {
        z-index: 1;
        flex-shrink: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgb(var(--c-neon));
        box-shadow: 0 0 12px rgb(var(--c-neon) / 0.8);
    }

    .dot.open {
        border: 2px solid rgb(var(--c-neon) / 0.5);
        background: transparent;
        box-shadow: none;
    }

    .line {
        flex: 1;
        width: 1px;
        min-height: 40px;
        margin: 4px 0;
        background: linear-gradient(180deg, rgb(var(--c-neon)), rgb(var(--c-neon) / 0.15));
        transform-origin: top;
    }

    :global(.js) .line {
        transform: scaleY(0);
        transition: transform 0.8s var(--ease-out) 0.3s;
    }

    :global(.js [data-revealed]) .line {
        transform: none;
    }

    .items {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
    }

    .item {
        --from: translateX(-24px);
        --blur: 6px;
        --duration: 0.6s;
    }

    .card {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        transition: all 0.25s ease;
    }

    .card:hover {
        border-color: rgb(var(--c-neon) / 0.45);
        box-shadow: 0 0 32px rgb(var(--c-neon) / 0.1);
        transform: translateX(4px);
    }

    .card-head {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
    }

    .card-title {
        color: rgb(var(--c-text-primary));
        font-weight: 700;
    }

    .period {
        color: rgb(var(--c-neon-soft));
        font-size: 0.8rem;
        font-style: italic;
        letter-spacing: 0.08em;
        text-transform: none;
        white-space: nowrap;
    }

    .divider {
        height: 1px;
        background: linear-gradient(90deg, rgb(var(--c-neon) / 0.3), transparent);
    }

    .description {
        color: rgb(var(--c-text-secondary));
        line-height: 1.7;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    @media (min-width: 600px) {
        .card-head {
            flex-direction: row;
            align-items: center;
        }
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .timeline {
            gap: 32px;
        }

        .items {
            gap: 24px;
        }

        .card {
            padding: 24px;
        }
    }
</style>
