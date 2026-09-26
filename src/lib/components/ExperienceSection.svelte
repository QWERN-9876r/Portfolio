<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import Chip from '$lib/components/Chip.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import Tooltip from '$lib/components/Tooltip.svelte'
    import {
        overlaps,
        parsePeriod,
        roleAnchor,
        splitRole,
        type CaseItem,
        type ExperienceData,
        type Period,
    } from '$lib/content'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { SITE_STACK } from '$lib/site'
    import { glowPrism } from '$lib/three/prismGlow.svelte'

    let {
        t,
        lang,
        experience,
        cases,
    }: { t: Translation; lang: Locale; experience: ExperienceData; cases: CaseItem[] } = $props()

    const LOGOS: Record<string, string> = {
        Яндекс: '/icons/yandex.svg',
        Yandex: '/icons/yandex.svg',
        МТС: '/icons/mts.svg',
        MTS: '/icons/mts.svg',
    }
    const MAX_TAGS = 5
    // Бейдж «этот сайт — на том же стеке», если совпало хотя бы столько технологий сайта
    const SAME_STACK_MIN = 3
    // Луч проходит по таймлайну от прошлого к настоящему, когда карточки уже проявились
    const BEAM_DELAY = 1.2
    const BEAM_SECONDS = 1.8

    // Кейсы той же компании, чей период пересекается с должностью
    const casesOf = (company: string | null, span: Period | null) =>
        span
            ? cases.filter((caseItem) => {
                  const other = parsePeriod(caseItem.period)
                  return other !== null && (!company || caseItem.company === company) && overlaps(other, span)
              })
            : []

    interface Role {
        key: string
        anchor: string | null
        title: string
        period: string
        current: boolean
        achievements: string[]
        description: string | undefined
        cases: CaseItem[]
        stack: string[]
        tags: string[]
        moreTags: string[]
        // Сколько месяцев прошло до этой должности от предыдущей в той же компании
        promotedAfter: number | null
        order: number
    }

    interface Group {
        key: string
        company: string | null
        logo: string | null
        roles: Role[]
        order: number
    }

    // Должности подряд в одной компании — одна группа с логотипом на таймлайне.
    // order — номер отметки снизу вверх: в этом порядке их зажигает луч
    const timeline = $derived.by(() => {
        const groups: Group[] = []
        experience.items.forEach((item, index) => {
            const { title, company } = splitRole(item)
            const span = parsePeriod(item.period)
            const shared = item.tags?.filter((tag) => SITE_STACK.includes(tag)) ?? []
            const stack = shared.length >= SAME_STACK_MIN ? shared : []
            const tags = (item.tags ?? []).filter((tag) => !stack.includes(tag))
            const role: Role = {
                key: `${item.period}-${index}`,
                anchor: roleAnchor(item),
                title,
                period: item.period,
                current: span !== null && span.end === null,
                achievements: item.achievements ?? [],
                description: item.description,
                cases: casesOf(company, span),
                stack,
                tags: tags.slice(0, MAX_TAGS),
                moreTags: tags.slice(MAX_TAGS),
                promotedAfter: null,
                order: 0,
            }

            const group = groups.at(-1)
            if (group && group.company === company) {
                // Список от новых к старым: предыдущая в группе — следующая по времени
                const newer = group.roles.at(-1)!
                const newerSpan = parsePeriod(newer.period)
                if (span && newerSpan && newer.title !== title) newer.promotedAfter = newerSpan.start - span.start
                group.roles.push(role)
            } else {
                groups.push({
                    key: `${company}-${index}`,
                    company,
                    logo: (company && LOGOS[company]) || null,
                    roles: [role],
                    order: 0,
                })
            }
        })

        const marks = groups.reduce((count, group) => count + 1 + group.roles.length, 0)
        let fromTop = 0
        for (const group of groups) {
            group.order = marks - 1 - fromTop++
            for (const role of group.roles) role.order = marks - 1 - fromTop++
        }
        return { groups, step: BEAM_SECONDS / Math.max(marks - 1, 1) }
    })

    const plural = $derived(new Intl.PluralRules(lang))
    const promotion = (months: number) =>
        `${t.experience.promotion} ${months} ${t.experience.months[plural.select(months)] ?? t.experience.months.other}`

    const delay = (index: number) => `${0.25 + index * 0.15}s`
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

        <div
            class="timeline"
            style:--beam-delay="{BEAM_DELAY}s"
            style:--beam-duration="{BEAM_SECONDS}s"
            style:--step="{timeline.step}s"
        >
            <div class="reveal rail" aria-hidden="true">
                <div class="beam"></div>
            </div>

            {#each timeline.groups as group, groupIndex (group.key)}
                <div class="group">
                    <div class="reveal group-head" style:--delay={delay(groupIndex)}>
                        <!-- Луч призмы бьёт в логотип и берёт из него цвет -->
                        <div class="glass-panel mark logo" style:--order={group.order} {@attach glowPrism()}>
                            {#if group.logo}
                                <img src={group.logo} alt="" width="28" height="28" loading="lazy" />
                            {/if}
                        </div>
                        {#if group.company}
                            <h3 class="h5 company-name">{group.company}</h3>
                        {/if}
                    </div>

                    {#each group.roles as role, roleIndex (role.key)}
                        <article
                            class="reveal role"
                            id={role.anchor}
                            style:--delay={delay(groupIndex + roleIndex + 1)}
                        >
                            <span class="mark dot" class:current={role.current} style:--order={role.order}></span>

                            <div class="glass-panel card">
                                <div class="card-head">
                                    <h4 class="h5 card-title">{role.title}</h4>
                                    <div class="when">
                                        <span class="caption period">{role.period}</span>
                                        {#if role.current}
                                            <span class="caption now">{t.experience.now}</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="divider"></div>

                                {#if role.achievements.length > 0}
                                    <ul class="body2 achievements">
                                        {#each role.achievements as achievement (achievement)}
                                            <li>{achievement}</li>
                                        {/each}
                                    </ul>
                                {:else if role.description}
                                    <p class="body2 description">{role.description}</p>
                                {/if}

                                <!-- Цифры кейсов этого периода — доказательство вместо обязанностей -->
                                {#each role.cases as caseItem (caseItem.id)}
                                    <a class="proof" href="#{caseItem.id}">
                                        <span class="proof-results">
                                            {#each caseItem.results.slice(0, 2) as result (result.label)}
                                                <span class="proof-result">
                                                    <span class="proof-value">{result.value}</span>
                                                    <span class="caption proof-label">
                                                        {t.cases.resultLabels[result.label] ?? result.label}
                                                    </span>
                                                </span>
                                            {/each}
                                        </span>
                                        <span class="body2 proof-case">
                                            {t.cases.label} «{caseItem.title}»<span class="arrow" aria-hidden="true">→</span>
                                        </span>
                                    </a>
                                {/each}

                                {#if role.stack.length > 0}
                                    <!-- Наведение зажигает призму: стек этой работы — прямо на странице -->
                                    <div class="same-stack" {@attach glowPrism()}>
                                        <svg class="cube" viewBox="0 0 64 64" aria-hidden="true">
                                            <path
                                                d="M32 10 51 21v22L32 54 13 43V21ZM13 21l19 11 19-11"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="5"
                                                stroke-linejoin="round"
                                            />
                                            <path d="M32 32v22" stroke="#EBF5FF" stroke-width="5" stroke-linecap="round" />
                                        </svg>
                                        <span class="same-stack-text">
                                            <span class="caption same-stack-label">{t.experience.sameStack}</span>
                                            <span class="body2 same-stack-techs">{role.stack.join(' · ')}</span>
                                        </span>
                                    </div>
                                {/if}

                                {#if role.tags.length > 0}
                                    <div class="tags">
                                        {#each role.tags as tag (tag)}
                                            <Chip label={tag} />
                                        {/each}
                                        {#if role.moreTags.length > 0}
                                            <Tooltip label={role.moreTags.join(', ')}>
                                                <span class="more">
                                                    <Chip label="+{role.moreTags.length}" />
                                                    <span class="visually-hidden">
                                                        {t.experience.moreTags}: {role.moreTags.join(', ')}
                                                    </span>
                                                </span>
                                            </Tooltip>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </article>

                        {#if role.promotedAfter !== null}
                            <p class="reveal caption promotion" style:--delay={delay(groupIndex + roleIndex + 1)}>
                                <span class="promotion-arrow" aria-hidden="true">↑</span>
                                {promotion(role.promotedAfter)}
                            </p>
                        {/if}
                    {/each}
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

    /* ── Таймлайн: линия слева, логотипы компаний и точки должностей на ней ──
       --rail — центр линии от левого края, --gutter — отступ контента */
    .timeline {
        --rail: 18px;
        --gutter: 48px;
        --logo: 36px;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 28px;
        padding-left: var(--gutter);
    }

    .rail {
        --from: none;
        position: absolute;
        top: calc(var(--logo) / 2);
        bottom: 0;
        left: calc(var(--rail) - 1px);
        width: 2px;
        border-radius: 1px;
        background: linear-gradient(to top, transparent, rgb(var(--c-neon) / 0.2) 15%, rgb(var(--c-neon) / 0.6));
    }

    /* Световой сгусток идёт снизу вверх — от прошлого к настоящему, один раз */
    .beam {
        position: absolute;
        top: 75%;
        left: -3px;
        width: 8px;
        height: 25%;
        border-radius: 4px;
        background: linear-gradient(to top, transparent, rgb(var(--c-neon-soft)), #fff 50%, rgb(var(--c-neon-soft)), transparent);
        filter: blur(1.5px);
        opacity: 0;
    }

    :global([data-revealed]) .beam {
        animation: beam-travel var(--beam-duration) cubic-bezier(0.45, 0, 0.25, 1) var(--beam-delay) both;
    }

    @keyframes beam-travel {
        0% {
            opacity: 0;
            transform: translateY(0);
        }
        12%,
        85% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: translateY(-400%);
        }
    }

    /* Отметки на линии загораются, когда до них доходит луч, и остаются гореть */
    :global([data-revealed]) .mark {
        animation: mark-lit 0.6s ease-out calc(var(--beam-delay) + var(--order) * var(--step)) both;
    }

    @keyframes mark-lit {
        from {
            filter: brightness(0.5) saturate(0.4);
        }
        40% {
            filter: brightness(1.8);
        }
        to {
            filter: none;
        }
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .group-head {
        --from: translateX(-24px);
        position: relative;
        display: flex;
        align-items: center;
        min-height: var(--logo);
    }

    .logo {
        position: absolute;
        top: 0;
        left: calc(var(--rail) - var(--gutter) - var(--logo) / 2);
        display: grid;
        place-items: center;
        width: var(--logo);
        height: var(--logo);
        border-radius: 10px;
    }

    .logo img {
        width: 60%;
        height: 60%;
        border-radius: 4px;
        transition: filter 0.25s ease;
    }

    .logo:hover img,
    .logo:global([data-lit]) img {
        filter: drop-shadow(0 0 8px rgb(255 255 255 / 0.35));
    }

    .company-name {
        color: rgb(var(--c-text-primary));
        font-weight: 700;
    }

    .role {
        --from: translateX(-24px);
        --blur: 6px;
        --duration: 0.6s;
        position: relative;
        scroll-margin-top: 24px;
    }

    .dot {
        position: absolute;
        top: 26px;
        left: calc(var(--rail) - var(--gutter) - 6px);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgb(var(--c-neon));
        box-shadow: 0 0 12px rgb(var(--c-neon) / 0.8);
    }

    /* Текущая работа — яркая точка с ореолом */
    .dot.current {
        background: #ebf5ff;
        box-shadow:
            0 0 0 4px rgb(var(--c-neon) / 0.3),
            0 0 16px rgb(var(--c-neon-soft));
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

    .when {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }

    .period {
        color: rgb(var(--c-neon-soft));
        font-size: 0.8rem;
        font-style: italic;
        letter-spacing: 0.08em;
        text-transform: none;
        white-space: nowrap;
    }

    .now {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        border: 1px solid rgb(var(--c-neon) / 0.4);
        border-radius: 999px;
        background: rgb(var(--c-neon) / 0.12);
        color: rgb(var(--c-text-primary));
        font-size: 0.65rem;
        letter-spacing: 0.12em;
    }

    .now::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ebf5ff;
        box-shadow: 0 0 8px rgb(var(--c-neon-soft));
    }

    .divider {
        height: 1px;
        background: linear-gradient(90deg, rgb(var(--c-neon) / 0.3), transparent);
    }

    .description {
        color: rgb(var(--c-text-secondary));
        line-height: 1.7;
    }

    .achievements {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 0;
        color: rgb(var(--c-text-secondary));
        line-height: 1.6;
        list-style: none;
    }

    .achievements li {
        position: relative;
        padding-left: 18px;
    }

    .achievements li::before {
        content: '';
        position: absolute;
        top: 0.62em;
        left: 2px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgb(var(--c-neon-soft));
        box-shadow: 0 0 6px rgb(var(--c-neon) / 0.8);
    }

    .proof {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 20px;
        padding: 12px 14px;
        border: 1px solid rgb(var(--c-neon) / 0.2);
        border-radius: 12px;
        background: rgb(var(--c-neon) / 0.06);
        color: inherit;
        text-decoration: none;
        transition:
            border-color 0.25s ease,
            background 0.25s ease;
    }

    .proof:hover {
        border-color: rgb(var(--c-neon) / 0.45);
        background: rgb(var(--c-neon) / 0.1);
    }

    .proof:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .proof-results {
        display: flex;
        gap: 16px;
    }

    .proof-result {
        display: flex;
        align-items: baseline;
        gap: 6px;
    }

    .proof-value {
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1.05rem;
        text-shadow: 0 0 16px rgb(var(--c-neon) / 0.5);
        white-space: nowrap;
    }

    .proof-label {
        color: rgb(var(--c-text-secondary));
        font-size: 0.65rem;
        letter-spacing: 0.04em;
        text-transform: none;
    }

    .proof-case {
        color: rgb(var(--c-neon-soft));
        line-height: 1.4;
    }

    .arrow {
        display: inline-block;
        margin-left: 6px;
        transition: transform 0.2s ease;
    }

    .proof:hover .arrow {
        transform: translateX(3px);
    }

    .same-stack {
        display: flex;
        align-items: center;
        gap: 12px;
        width: fit-content;
        padding: 10px 14px;
        border: 1px solid rgb(var(--c-neon) / 0.3);
        border-radius: 12px;
        background: rgb(var(--c-neon) / 0.08);
        cursor: default;
        transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease;
    }

    .same-stack:hover,
    .same-stack:global([data-lit]) {
        border-color: rgb(var(--c-neon) / 0.6);
        box-shadow: 0 0 24px rgb(var(--c-neon) / 0.2);
    }

    .cube {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        color: rgb(var(--c-neon));
        filter: drop-shadow(0 0 6px rgb(var(--c-neon) / 0.7));
    }

    .same-stack-text {
        display: flex;
        flex-direction: column;
    }

    .same-stack-label {
        color: rgb(var(--c-text-primary));
        font-size: 0.7rem;
        letter-spacing: 0.08em;
    }

    .same-stack-techs {
        color: rgb(var(--c-neon-soft));
        font-size: 0.8rem;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .more {
        display: inline-flex;
        cursor: default;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .promotion {
        --from: translateX(-24px);
        display: flex;
        align-items: center;
        gap: 8px;
        margin: -4px 0;
        color: rgb(var(--c-neon-soft));
        font-size: 0.7rem;
        letter-spacing: 0.1em;
    }

    .promotion-arrow {
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border: 1px solid rgb(var(--c-neon) / 0.4);
        border-radius: 50%;
        background: rgb(var(--c-neon) / 0.12);
        font-size: 0.75rem;
        letter-spacing: 0;
    }

    @media (min-width: 600px) {
        .card-head {
            flex-direction: row;
            align-items: center;
        }
    }

    @media (min-width: 900px) {
        /* Экран выше окна: без отступов заголовок прилипал бы к краю */
        section {
            padding-block: 56px;
        }

        .stack {
            gap: 40px;
        }

        .timeline {
            --rail: 24px;
            --gutter: 64px;
            --logo: 48px;
            gap: 32px;
        }

        .logo {
            border-radius: 12px;
        }

        .card {
            padding: 24px;
        }
    }
</style>
