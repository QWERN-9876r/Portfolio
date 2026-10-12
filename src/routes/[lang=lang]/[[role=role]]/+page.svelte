<script lang="ts">
    import { beforeNavigate, goto } from '$app/navigation'
    import { page } from '$app/state'
    import AboutSection from '$lib/components/AboutSection.svelte'
    import AllTechSection from '$lib/components/AllTechSection.svelte'
    import CaseSection from '$lib/components/CaseSection.svelte'
    import ExperienceSection from '$lib/components/ExperienceSection.svelte'
    import FooterSection from '$lib/components/FooterSection.svelte'
    import HeroSection from '$lib/components/hero/HeroSection.svelte'
    import SellingPointsSection from '$lib/components/SellingPointsSection.svelte'
    import StackGroupSection from '$lib/components/stack/StackGroupSection.svelte'
    import { translations } from '$lib/i18n/translations'
    import { DEFAULT_ROLE, isRole, rolePath } from '$lib/role'
    import { startRum } from '$lib/rum'
    import { withBase } from '$lib/site'
    import { onMount } from 'svelte'

    let { data } = $props()

    const t = $derived(translations[data.lang])
    const role = $derived(isRole(page.params.role) ? page.params.role : DEFAULT_ROLE)

    // Контент из бакета — на момент сборки: после заливки в бакет сайт пересобирается
    const content = $derived(data.content)
    const groups = $derived(
        content.techGroups.filter((group) => !group.roles || group.roles.includes(role)),
    )

    // Номера секций по порядку на странице: набор секций стека зависит от роли.
    // 01 — «О себе», 02 — «Почему я»
    const numbers = $derived.by(() => {
        let next = 3
        const stack = groups.map(() => next++)
        const allTech = next++
        const experience = next++
        return { stack, allTech, experience, cases: content.cases.map(() => next++) }
    })

    // Метрики и путь посетителя уходят на deploy/rum одним beacon при уходе со страницы.
    // Переход на другую страницу сайта (статистику) — тоже уход: отправляем до смены страницы,
    // пока её секции на месте, — после DOM уже убран и увиденные секции не найти
    let leaveRum = () => {}
    onMount(() => (leaveRum = startRum(() => ({ lang: data.lang, role }))))
    beforeNavigate(({ to }) => {
        if (to && to.route.id !== page.route.id) leaveRum()
    })

    // Старые ссылки вида /en/?role=backend: статический хостинг их не перенаправит
    onMount(() => {
        const legacyRole = new URLSearchParams(location.search).get('role')
        if (legacyRole === null) return

        const target = isRole(legacyRole) ? legacyRole : role
        goto(withBase(rolePath(data.lang, target)) + location.hash, { replaceState: true, noScroll: true })
    })
</script>

<main id="scroll-root">
    <HeroSection
        {t}
        lang={data.lang}
        {role}
        openSource={content.cases.find((item) => item.demo === 'mangoscript')}
    />
    <AboutSection {t} cases={content.cases} />
    <SellingPointsSection {t} lang={data.lang} cases={content.cases} />

    {#each groups as group, index (group.id)}
        <StackGroupSection {group} index={numbers.stack[index]} />
    {/each}

    <AllTechSection {t} index={numbers.allTech} technologies={content.allTechnologies} />
    <ExperienceSection
        {t}
        index={numbers.experience}
        lang={data.lang}
        experience={content.experience}
        cases={content.cases}
    />

    {#each content.cases as caseItem, index (caseItem.id)}
        <CaseSection
            {t}
            index={numbers.cases[index]}
            {caseItem}
            cases={content.cases}
            experience={content.experience}
        />
    {/each}

    <FooterSection {t} lang={data.lang} />
</main>
