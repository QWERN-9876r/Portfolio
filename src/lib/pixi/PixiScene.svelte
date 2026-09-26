<script lang="ts" module>
    import type { Application, Ticker } from 'pixi.js'
    import type { Preset } from '$lib/content'

    interface Scene {
        destroy: () => void
        setActiveTech: (name: string | null) => void
        onMouseMove: (x: number, y: number) => void
        onMouseLeave: () => void
    }

    const PRESETS: Record<Preset, () => Promise<(app: Application) => Scene>> = {
        particles: () => import('./particlesPreset').then((m) => m.createParticlesPreset),
        fluid: () => import('./fluidPreset').then((m) => m.createFluidPreset),
        neural: () => import('./neuralPreset').then((m) => m.createNeuralPreset),
        constellation: () => import('./constellationPreset').then((m) => m.createConstellationPreset),
        matrix: () => import('./matrixPreset').then((m) => m.createMatrixPreset),
    }

    // Не destroy(true): true ещё и чистит глобальные пулы Pixi (TexturePool),
    // общие для всех сцен на странице, и соседняя сцена с Text падает при своём destroy
    const DESTROY_OPTIONS = { removeView: true } as const

    // Глобальный Ticker.system: на него подписан планировщик каждого рендерера Pixi
    // (сборка мусора текстур и т.п.), и он будит rAF каждый кадр, пока жив хоть один
    // рендерер — даже когда все сцены стоят. Держим его запущенным, только пока
    // хотя бы одна сцена видна
    let systemTicker: Ticker | null = null
    let runningScenes = 0

    const syncSystemTicker = () => {
        if (runningScenes > 0) systemTicker?.start()
        else systemTicker?.stop()
    }
</script>

<script lang="ts">
    import { intersect } from '$lib/attachments/reveal'

    // pointer — курсор из онбординга в координатах сцены: она ведёт себя как под мышью.
    // null — «мышь ушла»
    let {
        preset,
        activeTech,
        isVisible,
        pointer = null,
    }: {
        preset: Preset
        activeTech: string | null
        isVisible: boolean
        pointer?: { x: number; y: number } | null
    } = $props()

    let container: HTMLDivElement
    // WebGL-контекст живёт, только пока секция в пределах экрана от видимой области
    let isNear = $state(false)
    let app = $state.raw<Application | null>(null)
    let scene = $state.raw<Scene | null>(null)

    $effect(() => {
        if (!isNear) return

        const currentPreset = preset
        let cancelled = false
        let instance: Application | null = null
        let created: Scene | null = null

        const init = async () => {
            const [{ Application, Ticker }, createScene] = await Promise.all([
                import('pixi.js'),
                PRESETS[currentPreset](),
            ])
            if (cancelled) return
            systemTicker = Ticker.system

            instance = new Application()
            await instance.init({
                width: container.clientWidth,
                height: container.clientHeight,
                backgroundAlpha: 0,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 1.5),
                autoDensity: true,
                powerPreference: 'high-performance',
                hello: false,
            })
            if (cancelled) return

            // Мышь сцены обрабатываем через DOM. Система событий Pixi держит глобальный
            // Ticker.system и будит rAF каждый кадр, даже когда тикер сцены остановлен.
            // Pixi сам отключает её так же в EventSystem.destroy()
            instance.renderer.events.setTargetElement(null as unknown as HTMLElement)
            // Новый рендерер подписался на Ticker.system и запустил его
            syncSystemTicker()

            // Canvas создаёт сам Pixi: destroy теряет WebGL-контекст,
            // и повторно использовать тот же <canvas> после этого нельзя
            container.appendChild(instance.canvas)
            created = createScene(instance)
            app = instance
            scene = created
        }

        init().catch((err) => console.warn('Pixi init error:', err))

        return () => {
            cancelled = true
            app = null
            scene = null
            try {
                created?.destroy()
            } catch (err) {
                console.warn('Pixi scene destroy error:', err)
            }
            instance?.destroy(DESTROY_OPTIONS)
        }
    })

    // Тикер крутится, только когда секция видна и вкладка активна
    $effect(() => {
        if (!app) return
        const ticker = app.ticker
        const visible = isVisible
        let running = false

        const setRunning = (value: boolean) => {
            if (value === running) return
            running = value
            if (value) ticker.start()
            else ticker.stop()
            runningScenes += value ? 1 : -1
            syncSystemTicker()
        }
        const sync = () => setRunning(visible && !document.hidden)

        // Application запускает тикер сам при init — выравниваем с учётом
        ticker.stop()
        sync()
        document.addEventListener('visibilitychange', sync)
        return () => {
            document.removeEventListener('visibilitychange', sync)
            setRunning(false)
        }
    })

    $effect(() => {
        scene?.setActiveTech(activeTech)
    })

    let pointed = false
    $effect(() => {
        if (!scene) return
        if (pointer) {
            scene.onMouseMove(pointer.x, pointer.y)
            pointed = true
        } else if (pointed) {
            scene.onMouseLeave()
            pointed = false
        }
    })

    const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        scene?.onMouseMove(event.clientX - rect.left, event.clientY - rect.top)
    }
</script>

<div
    bind:this={container}
    class="scene"
    class:mounted={scene !== null}
    role="presentation"
    onmousemove={handleMouseMove}
    onmouseleave={() => scene?.onMouseLeave()}
    {@attach intersect((near) => (isNear = near), (node) => ({
        // root — скролл-контейнер: у viewport rootMargin не выходит за его overflow
        root: node.closest('#scroll-root'),
        rootMargin: '100% 0px',
    }))}
></div>

<style>
    .scene {
        position: relative;
        flex-shrink: 0;
        width: min(400px, 100vw - 32px);
        height: 220px;
        overflow: hidden;
        border: 1px solid rgb(var(--c-neon) / 0.15);
        border-radius: 20px;
        background:
            radial-gradient(ellipse 70% 60% at 50% 50%, rgb(var(--c-neon) / 0.04) 0%, transparent 70%),
            rgb(var(--c-bg-elevated) / 0.25);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }

    @media (min-width: 768px) {
        .scene {
            width: 400px;
            height: 400px;
        }
    }

    .scene :global(canvas) {
        display: block;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    .scene.mounted :global(canvas) {
        opacity: 1;
    }
</style>
