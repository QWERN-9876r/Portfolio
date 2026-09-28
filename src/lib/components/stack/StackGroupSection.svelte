<script lang="ts" module>
    // Каждая подсказка — один раз за визит, в первой подходящей секции, до которой дошли
    let techHintShown = false
    let wavesHintShown = false
</script>

<script lang="ts">
    import { intersect, reveal } from '$lib/attachments/reveal'
    import FingerHint from '$lib/components/FingerHint.svelte'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { TechGroup } from '$lib/content'
    import { centerIn, runOnboarding, wait } from '$lib/onboarding'
    import PixiScene from '$lib/pixi/PixiScene.svelte'
    import { lightUp } from '$lib/three/prismGlow.svelte'
    import { on } from 'svelte/events'
    import TechItem from './TechItem.svelte'

    let { group, index }: { group: TechGroup; index: number } = $props()

    let isVisible = $state(false)
    let activeTech = $state<string | null>(null)

    // Pixi подсвечивает технологию, пока она горит; погасшая сбрасывает, только если она текущая
    const onglow = (name: string, lit: boolean) => {
        if (lit) activeTech = name
        else if (activeTech === name) activeTech = null
    }

    // Онбординг пальцем. Технологии: палец по очереди показывает на первые из них, и они
    // загораются как при наведении. Волны: палец ведёт по сцене, и она откликается как на мышь.
    // На телефоне палец «нажимает» — так там и вызываются оба эффекта.
    // Старт — когда секция проявилась
    const FINGER_START = 900
    const FINGER_MOVE = 700
    const FINGER_HOLD = 2000
    const FINGER_ITEMS = 2
    // Между подсказками, если обе выпали на одну секцию
    const HINTS_GAP = 600
    const WAVES_SWEEP = 2400
    const WAVES_TAP_HOLD = 1500
    const WAVES_REST = 500

    let section: HTMLElement
    let sceneWrap: HTMLElement
    let finger = $state({ x: 0, y: 0, shown: false, taps: 0, tap: false, glide: false })
    let scenePointer = $state<{ x: number; y: number } | null>(null)
    let stopOnboarding = () => {}

    // Палец показывает на иконку технологии
    const pointOf = (item: HTMLElement) => centerIn(section, item.querySelector('img') ?? item)

    // Точка сцены по долям её ширины и высоты: для сцены и для пальца в координатах секции
    const scenePoint = (u: number, v: number) => {
        const box = sceneWrap.getBoundingClientRect()
        const origin = section.getBoundingClientRect()
        const local = { x: box.width * u, y: box.height * v }
        return { local, finger: { x: box.left - origin.left + local.x, y: box.top - origin.top + local.y } }
    }

    // Появляется чуть ниже и правее точки и подъезжает к ней
    const appear = async (at: { x: number; y: number }, signal: AbortSignal) => {
        Object.assign(finger, { x: at.x + 40, y: at.y + 70, glide: false })
        await wait(50, signal)
        finger.shown = true
        Object.assign(finger, at)
        await wait(FINGER_MOVE, signal)
    }

    const pointAtTechs = async (signal: AbortSignal) => {
        const items = [...section.querySelectorAll<HTMLElement>('[data-tech]')].slice(0, FINGER_ITEMS)
        for (const [index, item] of items.entries()) {
            if (index === 0) await appear(pointOf(item), signal)
            else {
                Object.assign(finger, pointOf(item))
                await wait(FINGER_MOVE, signal)
            }
            finger.taps++
            const release = lightUp(item)
            try {
                await wait(FINGER_HOLD, signal)
            } finally {
                release()
            }
        }
        finger.shown = false
    }

    // Дуга слева направо над волнами, по кадрам: сцене нужен курсор в каждом кадре
    const glideOverScene = (signal: AbortSignal) =>
        new Promise<void>((resolve, reject) => {
            let frame = 0
            let started = 0
            const step = (now: number) => {
                started ||= now
                const t = Math.min((now - started) / WAVES_SWEEP, 1)
                const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
                const point = scenePoint(0.15 + 0.7 * eased, 0.6 - 0.25 * Math.sin(eased * Math.PI))
                Object.assign(finger, point.finger)
                scenePointer = point.local
                if (t < 1) frame = requestAnimationFrame(step)
                else resolve()
            }
            frame = requestAnimationFrame(step)
            signal.addEventListener(
                'abort',
                () => {
                    cancelAnimationFrame(frame)
                    reject(signal.reason)
                },
                { once: true },
            )
        })

    const showWaves = async (signal: AbortSignal) => {
        if (finger.tap) {
            // На телефоне сцена откликается на касание: круги встают в точку тапа
            for (const [index, [u, v]] of [
                [0.35, 0.45],
                [0.7, 0.65],
            ].entries()) {
                const point = scenePoint(u, v)
                if (index === 0) await appear(point.finger, signal)
                else {
                    Object.assign(finger, point.finger)
                    await wait(FINGER_MOVE, signal)
                }
                finger.taps++
                scenePointer = point.local
                await wait(WAVES_TAP_HOLD, signal)
            }
        } else {
            await appear(scenePoint(0.15, 0.6).finger, signal)
            finger.glide = true
            await glideOverScene(signal)
            await wait(WAVES_REST, signal)
        }
        finger.shown = false
        scenePointer = null
    }

    const onboard = (visible: boolean) => {
        if (!visible) return stopOnboarding()
        const techs = !techHintShown
        const waves = !wavesHintShown && group.pixiPreset === 'fluid'
        if (!techs && !waves) return
        if (techs) techHintShown = true
        if (waves) wavesHintShown = true
        finger.tap = matchMedia('(hover: none)').matches

        stopOnboarding = runOnboarding(async (signal) => {
            try {
                await wait(FINGER_START, signal)
                if (techs) await pointAtTechs(signal)
                if (techs && waves) await wait(HINTS_GAP, signal)
                if (waves) await showWaves(signal)
            } finally {
                finger.shown = false
                finger.glide = false
                scenePointer = null
            }
        })
    }

    $effect(() => () => stopOnboarding())
</script>

<section
    id={group.id}
    class="snap-section"
    bind:this={section}
    {@attach reveal()}
    {@attach intersect((visible) => (isVisible = visible), () => ({ threshold: 0.1 }))}
    {@attach intersect(onboard, () => ({ rootMargin: '-15%' }))}
>
    <div class="section-content layout">
        <div class="main">
            <div class="reveal heading">
                <SectionIndex {index} />
                <h2 class="h2 title">{group.title}</h2>
                {#if group.subtitle}
                    <p class="body2 subtitle">{group.subtitle}</p>
                {/if}
            </div>

            <div class="items">
                {#each group.items as item, index (item.name)}
                    <TechItem {item} {index} onglow={(lit) => onglow(item.name, lit)} />
                {/each}
            </div>
        </div>

        <!-- Своя мышь над сценой обрывает подсказку -->
        <div
            class="reveal scene-wrap"
            bind:this={sceneWrap}
            {@attach (node) => on(node, 'pointerenter', () => stopOnboarding())}
        >
            <PixiScene preset={group.pixiPreset} {activeTech} {isVisible} pointer={scenePointer} />
        </div>
    </div>

    <FingerHint {...finger} />
</section>

<style>
    section {
        overflow: hidden;
    }

    .layout {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
    }

    .main {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 24px;
        min-width: 0;
    }

    .heading {
        --from: translateX(-30px);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .title {
        color: rgb(var(--c-text-primary));
        line-height: 1.1;
    }

    .subtitle {
        margin-top: 4px;
        color: rgb(var(--c-neon-soft) / 0.6);
        font-style: italic;
        letter-spacing: 0.03em;
    }

    .items {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .scene-wrap {
        --from: translateX(40px);
        --blur: 10px;
        --duration: 0.75s;
        --delay: 0.2s;
        flex-shrink: 0;
    }

    @media (min-width: 900px) {
        .layout {
            flex-direction: row;
            align-items: center;
            gap: 48px;
        }

        .main {
            gap: 32px;
        }
    }
</style>
