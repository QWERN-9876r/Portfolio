<script lang="ts" module>
    // Онбординг показывается один раз за визит, при первом появлении секции
    let onboarded = false
</script>

<script lang="ts">
    import { intersect, reveal } from '$lib/attachments/reveal'
    import CountUp from '$lib/components/CountUp.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import { findResult, type CaseItem } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'
    import { runOnboarding, wait } from '$lib/onboarding'
    import { glowPrism, lightUp } from '$lib/three/prismGlow.svelte'

    let { t, cases }: { t: Translation; cases: CaseItem[] } = $props()

    // Результаты из кейсов вместо стажа — по подписям из cases.json
    const STATS = ['DAU', 'MAU', 'Profit']
    const COMPANIES = [
        { id: 'yandex', logo: '/icons/yandex.svg' },
        { id: 'mts', logo: '/icons/mts.svg' },
    ] as const

    const stats = $derived(STATS.flatMap((label) => findResult(cases, label) ?? []))

    // Текст кусками: ключевые слова (первое вхождение каждого) — <strong>, в них бьёт луч призмы.
    // wave — место слова в световой волне при появлении секции
    const segments = $derived.by(() => {
        const { text, highlights } = t.about
        const ranges = highlights
            .map((word) => [text.indexOf(word), word.length])
            .filter(([start]) => start !== -1)
            .sort((a, b) => a[0] - b[0])

        const parts: { text: string; wave: number | null }[] = []
        let cursor = 0
        let wave = 0
        for (const [start, length] of ranges) {
            if (start < cursor) continue
            parts.push({ text: text.slice(cursor, start), wave: null })
            parts.push({ text: text.slice(start, start + length), wave: wave++ })
            cursor = start + length
        }
        parts.push({ text: text.slice(cursor), wave: null })
        return parts
    })

    const delay = (index: number) => 0.15 + index * 0.13

    // Онбординг: луч призмы по очереди бьёт в логотипы — так видно, что элементы
    // страницы можно «зажечь». Стартует, когда колонка с логотипами уже проявилась
    const ONBOARDING_START = 1200
    const ONBOARDING_STEP = 3000

    // $state: bind:this пишет в элементы массива, Svelte должен о них знать
    const companyTiles: HTMLElement[] = $state([])
    let stopOnboarding = () => {}

    const onboard = (visible: boolean) => {
        if (!visible) return stopOnboarding()
        if (onboarded) return
        onboarded = true
        stopOnboarding = runOnboarding(async (signal) => {
            await wait(ONBOARDING_START, signal)
            for (const tile of companyTiles) {
                const release = lightUp(tile)
                try {
                    await wait(ONBOARDING_STEP, signal)
                } finally {
                    release()
                }
            }
        })
    }

    $effect(() => () => stopOnboarding())
</script>

<section
    id="about"
    class="snap-section"
    {@attach reveal()}
    {@attach intersect(onboard, () => ({ rootMargin: '-15%' }))}
>
    <div class="section-content reveal" style:--from="translateY(60px)" style:--blur="10px" style:--duration="0.75s">
        <div class="stack">
            <div class="reveal item" style:--delay="{delay(0)}s">
                <SectionIndex index={1}>
                    <h2 class="h2 title">{t.sections.about}</h2>
                </SectionIndex>
            </div>

            <div class="row">
                <div class="reveal item bio" style:--delay="{delay(1)}s">
                    <div class="glass-panel panel">
                        <span class="caption label">{t.about.bio}</span>
                        <!-- В одну строку: пробелы между тегами попали бы в текст -->
                        <p class="body1 text">{#each segments as segment, index (index)}{#if segment.wave === null}{segment.text}{:else}<strong style:--wave={segment.wave} {@attach glowPrism()}>{segment.text}</strong>{/if}{/each}</p>
                    </div>
                </div>

                <div class="reveal item side" style:--delay="{delay(2)}s">
                    <div
                        class="stats"
                        style:--chars={Math.max(
                            String(COMPANIES.length).length,
                            ...stats.map(({ result }) => result.value.length),
                        )}
                    >
                        {#each stats as { caseItem, result } (result.label)}
                            <a class="glass-panel stat" href="#{caseItem.id}" title="{t.cases.label} «{caseItem.title}»">
                                <span class="stat-value">
                                    <CountUp value={result.value} delay={delay(2) + 0.2} />
                                </span>
                                <span class="caption stat-label">
                                    {t.cases.resultLabels[result.label] ?? result.label}
                                </span>
                            </a>
                        {/each}
                        <div class="glass-panel stat">
                            <span class="stat-value">
                                <CountUp value={String(COMPANIES.length)} delay={delay(2) + 0.2} />
                            </span>
                            <span class="caption stat-label">{t.about.companies}</span>
                        </div>
                    </div>

                    <div class="companies">
                        {#each COMPANIES as company, index (company.id)}
                            <!-- Луч призмы бьёт в логотип и берёт из него цвет -->
                            <div class="glass-panel company" bind:this={companyTiles[index]} {@attach glowPrism()}>
                                <img src={company.logo} alt="" width="32" height="32" loading="lazy" />
                                <span class="company-name">{t.about.companyNames[company.id]}</span>
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
        gap: 24px;
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

    .text strong {
        color: rgb(var(--c-text-primary));
        font-weight: 600;
        transition:
            color 0.2s ease,
            text-shadow 0.2s ease;
    }

    .text strong:hover,
    .text strong:global([data-lit]) {
        color: #fff;
        text-shadow:
            0 0 10px rgb(var(--c-neon) / 0.9),
            0 0 24px rgb(var(--c-neon) / 0.5);
    }

    /* Световая волна по ключевым словам, когда панель уже проявилась */
    :global([data-revealed]) .text strong {
        animation: flash 0.9s ease-out calc(1s + var(--wave) * 0.15s);
    }

    @keyframes flash {
        30% {
            color: #fff;
            text-shadow:
                0 0 10px rgb(var(--c-neon) / 0.9),
                0 0 24px rgb(var(--c-neon) / 0.5);
        }
    }

    .side {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .stat {
        /* Цифры по ширине плитки: самое длинное значение ряда (--chars знаков по 0,85 em)
           всегда помещается, на узких экранах текст уменьшается */
        container-type: inline-size;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        color: inherit;
        text-decoration: none;
        transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
    }

    a.stat:hover {
        border-color: rgb(var(--c-neon) / 0.5);
        box-shadow: 0 0 24px rgb(var(--c-neon) / 0.12);
        transform: translateY(-2px);
    }

    a.stat:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .stat-value {
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: min(1.5rem, calc(115cqi / var(--chars)));
        line-height: 1;
        text-shadow: 0 0 20px rgb(var(--c-neon) / 0.5);
        white-space: nowrap;
    }

    .stat-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.7rem;
        line-height: 1.3;
        letter-spacing: 0.05em;
        text-transform: none;
    }

    .companies {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .company {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
    }

    .company img {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        transition: filter 0.25s ease;
    }

    .company:global([data-lit]) {
        border-color: rgb(var(--c-neon) / 0.45);
        box-shadow: 0 0 32px rgb(var(--c-neon) / 0.1);
    }

    .company:hover img,
    .company:global([data-lit]) img {
        filter: drop-shadow(0 0 8px rgb(255 255 255 / 0.35));
    }

    .company-name {
        color: rgb(var(--c-text-primary));
        font-weight: 600;
    }

    @media (min-width: 600px) and (max-width: 899px) {
        .stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .row {
            flex-direction: row;
            align-items: flex-start;
            gap: 40px;
        }

        .side {
            flex-shrink: 0;
            width: 340px;
        }

        .panel {
            padding: 32px;
        }

        .stat {
            padding: 20px 18px;
        }
    }
</style>
