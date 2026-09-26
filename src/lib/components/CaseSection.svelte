<script lang="ts">
    import { scrollToAnchor } from '$lib/attachments/anchor'
    import { reveal } from '$lib/attachments/reveal'
    import CaseVisual from '$lib/components/CaseVisual.svelte'
    import Chip from '$lib/components/Chip.svelte'
    import CountUp from '$lib/components/CountUp.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import { overlaps, parsePeriod, roleAnchor, splitRole, type CaseItem, type ExperienceData } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'
    import { castSpectrum, glowPrism } from '$lib/three/prismGlow.svelte'
    import { cssRgb, SPECTRUM } from '$lib/three/spectrum'

    let {
        t,
        caseItem,
        cases,
        experience,
    }: { t: Translation; caseItem: CaseItem; cases: CaseItem[]; experience: ExperienceData } = $props()

    // Цифры результата — в цветах спектра: при появлении кейса призма бьёт в них лучами
    const COLORS = [SPECTRUM.violet, SPECTRUM.blue, SPECTRUM.cyan]

    const position = $derived(cases.findIndex((item) => item.id === caseItem.id))
    const prev = $derived(position > 0 ? cases[position - 1] : null)
    const next = $derived(position >= 0 ? (cases[position + 1] ?? null) : null)

    // Должность, во время которой сделан кейс: та же компания и пересекающийся период
    const role = $derived.by(() => {
        const period = parsePeriod(caseItem.period)
        if (!period) return null
        for (const item of experience.items) {
            const { title, company } = splitRole(item)
            const span = parsePeriod(item.period)
            const anchor = roleAnchor(item)
            if (span && anchor && (!company || company === caseItem.company) && overlaps(period, span)) {
                return { title, anchor }
            }
        }
        return null
    })

    const delay = (index: number) => `${0.1 + index * 0.12}s`
</script>

<section id={caseItem.id} class="snap-section" {@attach reveal('-10%')} {@attach castSpectrum(COLORS)}>
    <div class="section-content main">
        <div class="reveal heading">
            <SectionIndex index={caseItem.index}>
                <span class="caption case-label">
                    {t.cases.label}{#if position >= 0}&nbsp;{position + 1} {t.cases.of} {cases.length}{/if}
                </span>
            </SectionIndex>

            <h2 class="h2 title">{caseItem.title}</h2>

            <div class="meta">
                <p class="body2 company">{caseItem.company}</p>
                {#if caseItem.period}
                    <span class="meta-dot"></span>
                    <p class="body2 period">{caseItem.period}</p>
                {/if}
            </div>
            {#if role}
                <a class="body2 role-link" href="#{role.anchor}" {@attach scrollToAnchor}>{t.cases.during}: {role.title} ↗</a>
            {/if}
        </div>

        <!-- Результат первым: по цифрам решают, читать ли дальше -->
        <div class="hero">
            <div class="reveal outcome" style:--delay={delay(1)}>
                <div class="results">
                    {#each caseItem.results as result, index (result.label)}
                        <div class="result" style:--c-accent={cssRgb(COLORS[index % COLORS.length])} data-spectrum>
                            <span class="result-value">
                                <CountUp value={result.value} delay={0.3 + index * 0.15} />
                            </span>
                            <span class="caption result-label">
                                {t.cases.resultLabels[result.label] ?? result.label}
                            </span>
                            {#if t.cases.resultHints[result.label]}
                                <span class="result-hint">{t.cases.resultHints[result.label]}</span>
                            {/if}
                        </div>
                    {/each}
                </div>
                {#if caseItem.context}
                    <p class="body2 context">{caseItem.context}</p>
                {/if}
            </div>

            <div class="reveal visual-wrap" style:--delay={delay(2)}>
                <CaseVisual {t} {caseItem} colors={COLORS} />
            </div>
        </div>

        {#if caseItem.facts?.length}
            <div class="reveal facts-block" style:--delay={delay(3)}>
                <span class="caption facts-label">{t.cases.facts}</span>
                <ul class="facts">
                    {#each caseItem.facts as fact (fact)}
                        <li class="body2 fact">{fact}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        <div class="blocks">
            <div class="reveal block" style:--delay={delay(4)}>
                <div class="glass-panel panel content-block">
                    <span class="caption block-label">{t.cases.problem}</span>
                    <p class="body2 block-text">{caseItem.problem}</p>
                </div>
            </div>

            <div class="reveal block" style:--delay={delay(5)}>
                <div class="glass-panel panel content-block solution">
                    <span class="caption block-label">{t.cases.solution}</span>
                    {#if caseItem.steps?.length}
                        <ol class="steps">
                            {#each caseItem.steps as step, index (step.title)}
                                <li class="step">
                                    <span class="step-index">{index + 1}</span>
                                    <div class="step-body">
                                        <p class="step-title">{step.title}</p>
                                        {#if step.text}
                                            <p class="body2 step-text">{step.text}</p>
                                        {/if}
                                    </div>
                                </li>
                            {/each}
                        </ol>
                        <details class="details">
                            <summary class="body2">{t.cases.details}</summary>
                            <p class="body2 block-text">{caseItem.solution}</p>
                        </details>
                    {:else}
                        <p class="body2 block-text">{caseItem.solution}</p>
                    {/if}
                </div>
            </div>
        </div>

        {#if caseItem.tags?.length}
            <div class="reveal tags" style:--delay={delay(6)}>
                {#each caseItem.tags as tag (tag)}
                    <!-- Технологии кейса зажигают призму, как в стеке -->
                    <span class="tag" {@attach glowPrism()}><Chip label={tag} /></span>
                {/each}
            </div>
        {/if}

        {#if prev || next}
            <div class="reveal case-nav" style:--delay={delay(7)}>
                {#if prev}
                    <a class="nav-link" href="#{prev.id}">
                        <span class="caption nav-label">← {t.cases.prev}</span>
                        <span class="body2 nav-title">{prev.title}</span>
                    </a>
                {/if}
                {#if next}
                    <a class="nav-link next" href="#{next.id}">
                        <span class="caption nav-label">{t.cases.next} →</span>
                        <span class="body2 nav-title">{next.title}</span>
                    </a>
                {/if}
            </div>
        {/if}
    </div>
</section>

<style>
    .main {
        display: flex;
        flex-direction: column;
        gap: 24px;
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
        gap: 8px 12px;
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

    .role-link {
        width: fit-content;
        margin-top: -4px;
        color: rgb(var(--c-neon-soft));
        font-size: 0.85rem;
        text-decoration: none;
        text-underline-offset: 3px;
    }

    .role-link:hover {
        text-decoration: underline;
    }

    /* ── Результат: цифры и визуализация ── */

    .hero {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .outcome {
        --from: translateY(24px);
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    .results {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
    }

    .result {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 16px;
        border: 1px solid rgb(var(--c-accent) / 0.3);
        border-radius: 14px;
        background: rgb(var(--c-accent) / 0.08);
        box-shadow: 0 0 24px rgb(var(--c-accent) / 0.08);
    }

    .result-value {
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 1.9rem;
        line-height: 1.1;
        text-shadow: 0 0 22px rgb(var(--c-accent) / 0.8);
        white-space: nowrap;
    }

    .result-label {
        color: rgb(var(--c-accent));
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: none;
    }

    .result-hint {
        color: rgb(var(--c-text-secondary));
        font-size: 0.75rem;
        line-height: 1.3;
    }

    .context {
        color: rgb(var(--c-text-secondary));
        font-style: italic;
    }

    .visual-wrap {
        --from: translateX(30px);
    }

    /* ── Роль и условия ── */

    .facts-block {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .facts-label {
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.2em;
    }

    .facts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .fact {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border: 1px solid rgb(var(--c-neon) / 0.25);
        border-radius: 10px;
        background: rgb(var(--c-bg-elevated) / 0.6);
        color: rgb(var(--c-text-primary));
        line-height: 1.4;
    }

    .fact::before {
        content: '';
        flex-shrink: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgb(var(--c-neon-soft));
        box-shadow: 0 0 6px rgb(var(--c-neon));
    }

    /* ── Проблема и решение ── */

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

    .steps {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .step {
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }

    .step-index {
        display: grid;
        flex-shrink: 0;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 1px solid rgb(var(--c-neon) / 0.5);
        border-radius: 50%;
        background: rgb(var(--c-neon) / 0.15);
        color: rgb(var(--c-text-primary));
        font-family: var(--font-display);
        font-size: 0.75rem;
        box-shadow: 0 0 12px rgb(var(--c-neon) / 0.25);
    }

    .step-body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 3px;
    }

    .step-title {
        margin: 0;
        color: rgb(var(--c-text-primary));
        font-weight: 600;
        line-height: 1.4;
    }

    .step-text {
        margin: 0;
        color: rgb(var(--c-text-secondary));
        line-height: 1.6;
    }

    .details {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgb(var(--c-neon) / 0.15);
    }

    .details summary {
        width: fit-content;
        color: rgb(var(--c-neon-soft));
        cursor: pointer;
    }

    .details summary:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .details[open] summary {
        margin-bottom: 10px;
    }

    /* ── Теги и навигация ── */

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .tag {
        display: inline-flex;
        border-radius: 12px;
        cursor: default;
        transition: box-shadow 0.25s ease;
    }

    .tag:hover,
    .tag:global([data-lit]) {
        box-shadow: 0 0 16px rgb(var(--c-neon) / 0.45);
    }

    .case-nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid rgb(var(--c-neon) / 0.15);
    }

    .nav-link {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-width: 100%;
        color: inherit;
        text-decoration: none;
    }

    .nav-link.next {
        margin-left: auto;
        text-align: right;
    }

    .nav-label {
        color: rgb(var(--c-neon-soft));
        letter-spacing: 0.12em;
    }

    .nav-title {
        color: rgb(var(--c-text-secondary));
        transition: color 0.2s ease;
    }

    .nav-link:hover .nav-title {
        color: rgb(var(--c-text-primary));
    }

    .nav-link:focus-visible,
    .role-link:focus-visible {
        border-radius: 4px;
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    @media (min-width: 900px) {
        /* Кейс выше окна: без отступов заголовок прилипал бы к краю */
        section {
            padding-block: 56px;
        }

        .main {
            gap: 28px;
        }

        .hero {
            flex-direction: row;
            align-items: stretch;
            gap: 24px;
        }

        .visual-wrap {
            flex-shrink: 0;
            width: 340px;
        }

        .panel {
            padding: 24px;
        }

        .result {
            padding: 20px;
        }

        .result-value {
            font-size: 2.3rem;
        }
    }
</style>
