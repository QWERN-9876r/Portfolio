<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import CountUp from '$lib/components/CountUp.svelte'
    import Icon, { type IconName } from '$lib/components/Icon.svelte'
    import LiveMetrics from '$lib/components/LiveMetrics.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import { findResult, type CaseItem } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'
    import type { Rgb } from '$lib/three/prism'
    import { castSpectrum, glowPrism } from '$lib/three/prismGlow.svelte'
    import { cssRgb, SPECTRUM } from '$lib/three/spectrum'

    let { t, cases }: { t: Translation; cases: CaseItem[] } = $props()

    // Три качества — три цвета, на которые призма расщепляет свет.
    // results — подписи результатов из кейсов, которыми качество подтверждается
    const POINTS: { icon: IconName; tag: string; color: Rgb; results: string[] }[] = [
        { icon: 'speed', tag: 'PERFORMANCE', color: SPECTRUM.violet, results: [] },
        { icon: 'idea', tag: 'INITIATIVE', color: SPECTRUM.blue, results: ['DAU'] },
        { icon: 'trendingUp', tag: 'PRODUCT FOCUS', color: SPECTRUM.cyan, results: ['Profit', 'E-REACH'] },
    ]
    const COLORS = POINTS.map((point) => point.color)

    // Доказательства из кейсов; ссылка ведёт в кейс первого результата
    const proofs = $derived(
        POINTS.map((point) => point.results.flatMap((label) => findResult(cases, label) ?? [])),
    )

    const delay = (index: number) => 0.1 + index * 0.18
</script>

<section id="selling-points" class="snap-section" {@attach reveal()} {@attach castSpectrum(COLORS)}>
    <div class="section-content stack">
        <div class="reveal" style:--delay="{delay(0)}s">
            <SectionIndex index={2}>
                <h2 class="h2 title">{t.sections.whyMe}</h2>
            </SectionIndex>
        </div>

        <div class="grid">
            {#each POINTS as point, index (point.tag)}
                <div class="reveal card-wrap" style:--delay="{delay(index + 1)}s">
                    <div
                        class="glass-panel card"
                        style:--c-accent={cssRgb(point.color)}
                        {@attach glowPrism({ ray: false, color: point.color })}
                    >
                        <div class="card-top">
                            <div class="icon" data-spectrum>
                                <Icon name={point.icon} />
                            </div>
                            <span class="caption tag">{point.tag}</span>
                        </div>

                        <h3 class="h4 card-title">{t.sellingPoints[index].title}</h3>
                        <div class="divider"></div>
                        <p class="body2 description">{t.sellingPoints[index].description}</p>

                        {#if index === 0}
                            <LiveMetrics {t} />
                        {:else if proofs[index].length > 0}
                            {@const caseItem = proofs[index][0].caseItem}
                            <div class="proof">
                                <div class="results">
                                    {#each proofs[index] as { result } (result.label)}
                                        <p class="result">
                                            <span class="result-value">
                                                <CountUp value={result.value} delay={delay(index + 1) + 0.3} />
                                            </span>
                                            <span class="caption result-label">
                                                {t.cases.resultLabels[result.label] ?? result.label}
                                            </span>
                                        </p>
                                    {/each}
                                </div>
                                <a class="body2 case-link" href="#{caseItem.id}">
                                    {t.cases.label} «{caseItem.title}»<span class="arrow" aria-hidden="true">→</span>
                                </a>
                            </div>
                        {/if}

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

    .card:hover,
    .card:global([data-lit]) {
        border-color: rgb(var(--c-accent) / 0.5);
        box-shadow:
            0 0 40px rgb(var(--c-accent) / 0.1),
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
        border: 1px solid rgb(var(--c-accent) / 0.25);
        border-radius: 12px;
        background: rgb(var(--c-accent) / 0.12);
        box-shadow: 0 0 16px rgb(var(--c-accent) / 0.1);
        color: rgb(var(--c-accent));
        filter: drop-shadow(0 0 6px rgb(var(--c-accent) / 0.6));
    }

    .tag {
        color: rgb(var(--c-accent) / 0.6);
        font-size: 0.65rem;
        letter-spacing: 0.15em;
    }

    .card-title {
        color: rgb(var(--c-text-primary));
        line-height: 1.3;
    }

    .divider {
        height: 1px;
        background: linear-gradient(90deg, rgb(var(--c-accent) / 0.4), transparent);
    }

    .description {
        flex-grow: 1;
        color: rgb(var(--c-text-secondary));
        line-height: 1.75;
    }

    .proof {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .results {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .result {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;
        margin: 0;
        padding: 10px 12px;
        border: 1px solid rgb(var(--c-accent) / 0.15);
        border-radius: 10px;
        background: rgb(var(--c-accent) / 0.06);
    }

    .result-value {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 1.4rem;
        line-height: 1.1;
        text-shadow: 0 0 20px rgb(var(--c-accent) / 0.6);
        white-space: nowrap;
    }

    .result-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
        line-height: 1.3;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .case-link {
        align-self: flex-start;
        color: rgb(var(--c-accent));
        line-height: 1.4;
        text-decoration: none;
        text-underline-offset: 3px;
    }

    .case-link:hover {
        text-decoration: underline;
    }

    .case-link:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgb(var(--c-accent));
        outline-offset: 2px;
    }

    .arrow {
        display: inline-block;
        margin-left: 6px;
        transition: transform 0.2s ease;
    }

    .case-link:hover .arrow {
        transform: translateX(3px);
    }

    .scan {
        height: 2px;
        border-radius: 2px;
        background: linear-gradient(90deg, transparent, rgb(var(--c-accent) / 0.6), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .card:hover .scan,
    .card:global([data-lit]) .scan {
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
