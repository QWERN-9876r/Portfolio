<script lang="ts">
    import { onMount, type Component } from 'svelte'
    import type { Translation } from '$lib/i18n/translations'
    import type { Role } from '$lib/role'
    import type { FrontLayout } from './prism'
    import { glowPrism } from './prismGlow.svelte'

    let { role, labels }: { role: Role; labels: Translation['prism'] } = $props()

    type CanvasProps = {
        reducedMotion: boolean
        role: Role
        frontCanvas: HTMLCanvasElement
        strikes: number
        onlayout: (layout: FrontLayout) => void
        onattop: (atTop: boolean) => void
    }

    // Three.js не нужен для первого экрана: грузим его после load и в простое браузера
    let Canvas = $state.raw<Component<CanvasProps> | null>(null)
    let reducedMotion = $state(false)
    let frontCanvas = $state<HTMLCanvasElement>()
    let layout = $state<FrontLayout | null>(null)
    let atTop = $state(true)
    let strikes = $state(0)

    onMount(() => {
        reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

        let cancelled = false
        let cancelScheduled = () => {}

        const load = () =>
            import('./PrismCanvas.svelte').then((module) => {
                if (!cancelled) Canvas = module.default
            })

        const schedule = () => {
            if ('requestIdleCallback' in window) {
                const id = requestIdleCallback(load, { timeout: 2000 })
                cancelScheduled = () => cancelIdleCallback(id)
            } else {
                const id = setTimeout(load, 200)
                cancelScheduled = () => clearTimeout(id)
            }
        }

        if (document.readyState === 'complete') schedule()
        else window.addEventListener('load', schedule, { once: true })

        return () => {
            cancelled = true
            window.removeEventListener('load', schedule)
            cancelScheduled()
        }
    })

    // Плавность задаёт CSS #scroll-root (и отключает её при reduced motion)
    const scrollToTop = () => document.getElementById('scroll-root')?.scrollTo({ top: 0 })

    // В hero кнопка на кубе повторяет удар луча (с reduced motion удара нет — кнопки тоже),
    // ниже по странице — возвращает наверх
    const label = $derived(atTop ? labels.strike : labels.backToTop)
</script>

<div class="prism-layer" aria-hidden="true">
    {#if Canvas && frontCanvas}
        <!-- Нет WebGL или ошибка сцены — призмы просто нет, остальная страница работает -->
        <svelte:boundary onerror={(error) => console.warn('Prism layer disabled:', error)}>
            <Canvas
                {reducedMotion}
                {role}
                {frontCanvas}
                {strikes}
                onlayout={(value) => (layout = value)}
                onattop={(value) => (atTop = value)}
            />
        </svelte:boundary>
    {/if}
</div>

<!-- Куб поверх контента — он же кнопка: в hero удар луча, ниже — «наверх».
     Появляется, когда сцена заняла место -->
<div
    class="prism-front"
    hidden={!layout}
    style:--left={layout && `${layout.left}px`}
    style:--top={layout && `${layout.top}px`}
    style:--size={layout && `${layout.size}px`}
>
    <canvas bind:this={frontCanvas} aria-hidden="true"></canvas>
    <button
        type="button"
        aria-label={label}
        title={label}
        inert={atTop && reducedMotion}
        onclick={() => (atTop ? strikes++ : scrollToTop())}
        {@attach glowPrism({ ray: false, pin: false })}
    ></button>
</div>

<style>
    /* Тот же z-index, что у #bg-layer, но позже в DOM: над фоном, под всем контентом */
    .prism-layer {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
    }

    /* Над контентом, но под переключателем языка */
    .prism-front {
        position: fixed;
        top: var(--top);
        left: var(--left);
        z-index: 15;
        width: var(--size);
        height: var(--size);
        pointer-events: none;
    }

    canvas {
        display: block;
        width: 100%;
        height: 100%;
    }

    button {
        position: absolute;
        inset: 18%;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        pointer-events: auto;
    }

    button[inert] {
        pointer-events: none;
    }

    button:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }
</style>
