<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import AboutSection from '$lib/components/AboutSection.svelte'
    import AllTechSection from '$lib/components/AllTechSection.svelte'
    import CaseSection from '$lib/components/CaseSection.svelte'
    import ExperienceSection from '$lib/components/ExperienceSection.svelte'
    import FooterSection from '$lib/components/FooterSection.svelte'
    import HeroSection from '$lib/components/hero/HeroSection.svelte'
    import SellingPointsSection from '$lib/components/SellingPointsSection.svelte'
    import StackGroupSection from '$lib/components/stack/StackGroupSection.svelte'
    import { refreshContent, type Content } from '$lib/content'
    import { translations, type Locale } from '$lib/i18n/translations'
    import { DEFAULT_ROLE, isRole, rolePath } from '$lib/role'
    import { onMount } from 'svelte'

    let { data } = $props()

    const t = $derived(translations[data.lang])
    const role = $derived(isRole(page.params.role) ? page.params.role : DEFAULT_ROLE)

    // HTML собран с данными на момент сборки; свежие правки из бакета подменяют их после загрузки
    let fresh = $state.raw<{ lang: Locale; patch: Partial<Content> } | null>(null)
    const content = $derived<Content>(
        fresh?.lang === data.lang ? { ...data.content, ...fresh.patch } : data.content,
    )
    const groups = $derived(
        content.techGroups.filter((group) => !group.roles || group.roles.includes(role)),
    )

    $effect(() => {
        const lang = data.lang
        const built = data.content
        let cancelled = false

        const refresh = () =>
            refreshContent(lang, built).then((patch) => {
                if (!cancelled && Object.keys(patch).length > 0) fresh = { lang, patch }
            })

        // Не конкурируем с загрузкой первого экрана
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(refresh, { timeout: 3000 })
            return () => {
                cancelled = true
                cancelIdleCallback(id)
            }
        }
        const id = setTimeout(refresh, 1500)
        return () => {
            cancelled = true
            clearTimeout(id)
        }
    })

    // Старые ссылки вида /en?role=backend (в проде их перенаправляет nginx)
    onMount(() => {
        const legacyRole = new URLSearchParams(location.search).get('role')
        if (legacyRole === null) return

        const target = isRole(legacyRole) ? legacyRole : role
        goto(rolePath(data.lang, target) + location.hash, { replaceState: true, noScroll: true })
    })
</script>

<main id="scroll-root">
    <HeroSection {t} lang={data.lang} {role} />
    <AboutSection {t} />
    <SellingPointsSection {t} />

    {#each groups as group (group.id)}
        <StackGroupSection {group} />
    {/each}

    <AllTechSection {t} technologies={content.allTechnologies} />
    <ExperienceSection {t} experience={content.experience} />

    {#each content.cases as caseItem (caseItem.id)}
        <CaseSection {t} {caseItem} />
    {/each}

    <FooterSection {t} />
</main>
