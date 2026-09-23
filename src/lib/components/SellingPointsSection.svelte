<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import Icon, { type IconName } from '$lib/components/Icon.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { Translation } from '$lib/i18n/translations'

    let { t }: { t: Translation } = $props()

    const POINTS: { icon: IconName; tag: string }[] = [
        { icon: 'speed', tag: 'PERFORMANCE' },
        { icon: 'idea', tag: 'INITIATIVE' },
        { icon: 'trendingUp', tag: 'PRODUCT FOCUS' },
    ]

    const delay = (index: number) => `${0.1 + index * 0.18}s`
</script>

<section id="selling-points" class="snap-section" {@attach reveal()}>
    <div class="section-content stack">
        <div class="reveal" style:--delay={delay(0)}>
            <SectionIndex index={2}>
                <h2 class="h2 title">{t.sections.whyMe}</h2>
            </SectionIndex>
        </div>

        <div class="grid">
            {#each POINTS as point, index (point.tag)}
                <div class="reveal card-wrap" style:--delay={delay(index + 1)}>
                    <div class="glass-panel card">
                        <div class="card-top">
                            <div class="icon">
                                <Icon name={point.icon} />
                            </div>
                            <span class="caption tag">{point.tag}</span>
                        </div>

                        <h3 class="h4 card-title">{t.sellingPoints[index].title}</h3>
                        <div class="divider"></div>
                        <p class="body2 description">{t.sellingPoints[index].description}</p>
                        <div class="scan"></div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<style>
    .stack {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .title {
        color: rgb(var(--c-text-primary));
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .card-wrap {
        --from: translateY(50px);
        --duration: 0.7s;
        height: 100%;
    }

    .card {
        display: flex;
        flex-direction: column;
        gap: 20px;
        height: 100%;
        padding: 24px;
        cursor: default;
        transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
    }

    .card:hover {
        border-color: rgb(var(--c-neon) / 0.5);
        box-shadow:
            0 0 40px rgb(var(--c-neon) / 0.1),
            0 8px 32px rgb(var(--c-bg-deep) / 0.4);
        transform: translateY(-6px);
    }

    .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 1px solid rgb(var(--c-neon) / 0.25);
        border-radius: 12px;
        background: rgb(var(--c-neon) / 0.12);
        box-shadow: 0 0 16px rgb(var(--c-neon) / 0.1);
        color: rgb(var(--c-neon-soft));
        filter: drop-shadow(0 0 6px rgb(var(--c-neon) / 0.6));
    }

    .tag {
        color: rgb(var(--c-neon-soft) / 0.5);
        font-size: 0.65rem;
        letter-spacing: 0.15em;
    }

    .card-title {
        color: rgb(var(--c-text-primary));
        line-height: 1.3;
    }

    .divider {
        height: 1px;
        background: linear-gradient(90deg, rgb(var(--c-neon) / 0.4), transparent);
    }

    .description {
        flex-grow: 1;
        color: rgb(var(--c-text-secondary));
        line-height: 1.75;
    }

    .scan {
        height: 2px;
        border-radius: 2px;
        background: linear-gradient(90deg, transparent, rgb(var(--c-neon) / 0.6), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .card:hover .scan {
        opacity: 1;
    }

    @media (min-width: 600px) {
        .grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .grid {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
        }

        .card {
            padding: 28px;
        }
    }
</style>
