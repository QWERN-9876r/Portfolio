<script lang="ts">
    import { page } from '$app/state'
    import { useTask, useThrelte } from '@threlte/core'
    import { Camera, Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from 'three'
    import { untrack } from 'svelte'
    import type { Role } from '$lib/role'
    import { fragmentShader, vertexShader } from './beam.glsl'
    import { iconColor } from './iconColor'
    import { createCube, createHalo, createPointerRay, type FrontLayout, type Rgb } from './prism'
    import { prismGlow, prismSpectrum, type GlowTarget, type SpectrumTarget } from './prismGlow.svelte'
    import { SPECTRUM } from './spectrum'

    let {
        reducedMotion,
        role,
        frontCanvas,
        strikes,
        onlayout,
        onattop,
    }: {
        reducedMotion: boolean
        role: Role
        frontCanvas: HTMLCanvasElement
        // Сколько раз нажали на призму в hero: каждое нажатие — новый удар луча
        strikes: number
        onlayout: (layout: FrontLayout) => void
        onattop: (atTop: boolean) => void
    } = $props()

    // Место призмы: доли ширины и высоты окна от левого нижнего угла
    const BEAM_X = 0.9
    const SPLIT_Y = 0.2
    // Передний canvas с кубом вдвое шире ребра: хватает на повороты и «вздох»
    const FRONT_SCALE = 2

    const FALL_SECONDS = 0.6
    const SPREAD_SECONDS = 0.5
    // Искры и ударная волна в шейдере живут до 1.3 с после удара
    const AFTERMATH_SECONDS = 1.4
    // Призма проявляется, пока луч летит, и доворачивается к моменту удара
    const PRISM_APPEAR_SECONDS = 0.35
    const PRISM_INTRO_TURN = 0.8
    // Удар луча о призму на телефоне отдаётся короткой вибрацией: толчок и отголосок, мс.
    // Короче ~40 мс многие вибромоторы не успевают раскрутиться — удар не чувствуется
    const IMPACT_VIBRATION = [50, 40, 30]

    // Луч прячется за первые 35% высоты окна прокрутки hero: сначала лучи
    // втягиваются в призму, потом вертикаль уходит вверх. Назад — в обратном порядке
    const RETRACT_VIEWPORTS = 0.35
    // Призма поворачивается вслед за прокруткой (радиан на пиксель) и слегка покачивается
    const SCROLL_TURN = 0.002
    const SCROLL_TILT = 0.25
    // Без луча призма светится приглушённо; наведение на технологию добавляет света
    const DIM_LIGHT = 0.7
    const GLOW_LIGHT = 1.3
    const NARROW_SCREEN = 900
    // Рёбра куба загораются по мере прокрутки страницы
    const EDGES = 12

    const ROLE_COLORS: Record<Role, Rgb> = {
        frontend: SPECTRUM.blue,
        backend: SPECTRUM.violet,
        fullstack: SPECTRUM.cyan,
    }
    const ROLE_WAVE_SECONDS = 0.9

    // Скорости сглаживания, 1/с
    const GLOW_RATE = 9
    const REACH_RATE = 16
    const RETARGET_RATE = 14
    const COLOR_RATE = 10

    // Лучи спектра тянутся по очереди: следующий стартует, когда предыдущий прошёл
    // CASCADE пути. В покое они приглушены, наведение на карточку разжигает свой луч
    const SPECTRUM_RATE = 6
    const SPECTRUM_CASCADE = 0.5
    const SPECTRUM_DIM = 0.4
    const SPECTRUM_LIGHT = 0.35

    const { renderer, scene, scheduler, size, dpr, invalidate } = useThrelte()

    // ── Фон: луч hero, ореол и луч к технологии ──

    const uniforms = {
        uSize: { value: new Vector2() },
        uSplit: { value: new Vector2() },
        uDpr: { value: 1 },
        uFall: { value: 0 },
        uSpread: { value: 0 },
        // Секунды после удара; пока луч падает — отрицательное значение
        uImpactTime: { value: -1 },
        uSparkSeed: { value: 0 },
        uIntensity: { value: 1 },
        uVisible: { value: 1 },
        uColorFrom: { value: new Vector3() },
        uColorTo: { value: new Vector3() },
        uColorWave: { value: 1 },
    }

    // Без <T.Mesh>: прокси T импортирует весь namespace three (+~58 КБ gzip),
    // а здесь хватает нескольких классов
    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
    })
    const beam = new Mesh(new PlaneGeometry(2, 2), material)
    beam.frustumCulled = false
    const halo = createHalo(uniforms.uSize)
    const pointer = createPointerRay(uniforms.uSize, uniforms.uDpr)
    scene.add(beam, halo.mesh, pointer.mesh)

    // Лучи спектра — те же лучи к элементу, только сразу несколько и постоянно
    interface SpectrumBeam {
        ray: ReturnType<typeof createPointerRay>
        // Текущая цель или последняя, пока луч втягивается
        target: SpectrumTarget | null
        on: boolean
        reach: number
        boost: number
        point: Vector2
    }
    const spectrumBeams: SpectrumBeam[] = []
    const spectrumBeam = (index: number) => {
        if (!spectrumBeams[index]) {
            const ray = createPointerRay(uniforms.uSize, uniforms.uDpr)
            scene.add(ray.mesh)
            spectrumBeams[index] = { ray, target: null, on: false, reach: 0, boost: 0, point: new Vector2() }
        }
        return spectrumBeams[index]
    }

    // ── Передний план: куб над контентом, свой маленький WebGL-контекст ──

    const front = new WebGLRenderer({
        canvas: untrack(() => frontCanvas),
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
    })
    front.setClearColor(0x000000, 0)
    front.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const frontScene = new Scene()
    // Шейдер куба проецирует сам; камера нужна только как аргумент render()
    const frontCamera = new Camera()
    const cube = createCube()
    frontScene.add(cube.mesh)

    $effect(() => () => {
        cancelAnimationFrame(frame)
        scene.remove(beam, halo.mesh, pointer.mesh)
        beam.geometry.dispose()
        material.dispose()
        halo.dispose()
        pointer.dispose()
        for (const { ray } of spectrumBeams) {
            scene.remove(ray.mesh)
            ray.dispose()
        }
        cube.dispose()
        front.dispose()
        front.forceContextLoss()
    })

    const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)
    const smoothstep = (from: number, to: number, value: number) => {
        const t = clamp01((value - from) / (to - from))
        return t * t * (3 - 2 * t)
    }
    const easeInQuad = (t: number) => t * t
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
    const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ]
    // Шаг к цели; совсем близко — прилипает, чтобы аниматор мог остановиться
    const approach = (value: number, target: number, factor: number) => {
        const next = value + (target - value) * factor
        return Math.abs(target - next) < 0.002 ? target : next
    }
    const approachRgb = (value: Rgb, target: Rgb, factor: number): Rgb => [
        approach(value[0], target[0], factor),
        approach(value[1], target[1], factor),
        approach(value[2], target[2], factor),
    ]
    const sameRgb = (a: Rgb, b: Rgb) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

    // ── Входы сцены ──

    let elapsed = 0
    // Секунды с последнего нажатия на призму; Infinity — нажатий не было
    let strikeTime = Infinity
    let scroll = 0
    let scrollRoot: HTMLElement | null = null
    const split = new Vector2()

    let roleFrom: Rgb = [0, 0, 0]
    let roleTo: Rgb = [0, 0, 0]
    let roleWave = 1
    // Цвет роли там, где волна уже прошла призму
    const roleColor = () => mixRgb(roleFrom, roleTo, smoothstep(0.3, 0.7, roleWave))

    let glowOn = false
    let rayOn = false
    // Цель луча — текущая технология под курсором или последняя, пока луч втягивается
    let target: GlowTarget | null = null
    // Элемент под курсором: луч спектра внутри него разгорается
    let glowElement: HTMLElement | null = null

    // ── Плавные величины ──

    let glow = 0
    let reach = 0
    // 0..1: конец луча переезжает от rayFrom к новой цели
    let retarget = 1
    let techColor: Rgb = [0, 0, 0]
    let techColorTarget: Rgb = [0, 0, 0]

    const rayFrom = new Vector2()
    const rayEnd = new Vector2()
    const rayTip = new Vector2()
    const targetPoint = new Vector2()

    // Цель сдвинулась с прошлого кадра (карточка доезжает на место, иконка тянется за курсором):
    // аниматор не останавливается, пока луч не догонит
    let targetsMoved = false

    // Центр элемента в координатах фона; у исчезнувшего элемента — последнее известное место
    const readPoint = (node: HTMLElement | null | undefined, point: Vector2) => {
        if (node?.isConnected) {
            const rect = node.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = size.current.height - rect.top - rect.height / 2
            if (Math.abs(x - point.x) > 0.1 || Math.abs(y - point.y) > 0.1) targetsMoved = true
            point.set(x, y)
        }
        return point
    }

    const progress = () => {
        if (!scrollRoot) return 0
        const max = scrollRoot.scrollHeight - scrollRoot.clientHeight
        return max > 0 ? clamp01(scroll / max) : 0
    }

    let wasAtTop: boolean | null = null

    // Состояние сцены — функция входов: интро, прокрутки, наведения и роли
    const apply = () => {
        targetsMoved = false
        const impactTime = elapsed - FALL_SECONDS
        // Искры, волна и вспышка — от последнего удара: интро или нажатия на призму
        const sinceImpact = Math.min(impactTime, strikeTime)
        const hidden = clamp01(scroll / (RETRACT_VIEWPORTS * Math.max(size.current.height, 1)))
        const raysShown = 1 - smoothstep(0, 0.5, hidden)
        const beamShown = 1 - smoothstep(0.5, 1, hidden)
        const appear = clamp01(elapsed / PRISM_APPEAR_SECONDS)

        uniforms.uFall.value = Math.min(easeInQuad(clamp01(elapsed / FALL_SECONDS)), beamShown)
        uniforms.uSpread.value = Math.min(easeOutCubic(clamp01(impactTime / SPREAD_SECONDS)), raysShown)
        uniforms.uImpactTime.value = sinceImpact
        uniforms.uVisible.value = 1 - hidden
        uniforms.uColorFrom.value.set(...roleFrom)
        uniforms.uColorTo.value.set(...roleTo)
        uniforms.uColorWave.value = roleWave
        // Спрятанный луч не рисуем: полноэкранный шейдер на кадрах прокрутки не нужен
        beam.visible = hidden < 1

        const tint = mixRgb(roleColor(), techColor, glow)
        halo.update(glow * appear, tint)

        if (reach > 0) {
            rayEnd.copy(rayFrom).lerp(readPoint(target?.icon ?? target?.element, targetPoint), retarget)
            pointer.update(split, rayTip.copy(split).lerp(rayEnd, reach), reach, techColor)
        } else {
            pointer.update(split, split, 0, techColor)
        }

        let spectrumShown = 0
        for (const spectrum of spectrumBeams) {
            if (spectrum.reach > 0 && spectrum.target) {
                const end = readPoint(spectrum.target.element, spectrum.point)
                const strength =
                    spectrum.reach *
                    uniforms.uIntensity.value *
                    (SPECTRUM_DIM + (1 - SPECTRUM_DIM) * spectrum.boost)
                spectrum.ray.update(split, rayTip.copy(split).lerp(end, spectrum.reach), strength, spectrum.target.color)
                spectrumShown = Math.max(spectrumShown, spectrum.reach)
            } else {
                spectrum.ray.update(split, split, 0, roleTo)
            }
        }

        // До удара стекло тусклое, в момент удара вспыхивает и оседает до ровного света
        const litByBeam = sinceImpact < 0 ? 0.45 : 1 + 1.2 * Math.exp(-sinceImpact * 3.5)
        const introTurn =
            PRISM_INTRO_TURN * (1 - easeOutCubic(clamp01(elapsed / (FALL_SECONDS + SPREAD_SECONDS))))
        const scrollAngle = reducedMotion ? 0 : scroll * SCROLL_TURN

        cube.update({
            appear,
            light:
                DIM_LIGHT +
                (litByBeam - DIM_LIGHT) * (1 - hidden) +
                GLOW_LIGHT * glow +
                SPECTRUM_LIGHT * spectrumShown,
            tint,
            progress: progress() * EDGES,
            litAll: 1 - hidden,
            pulse: reducedMotion ? 0 : glow,
            turn: introTurn + scrollAngle,
            tilt: SCROLL_TILT * Math.sin(scrollAngle * 0.75),
        })

        // Пока луч виден, кнопка на кубе бьёт лучом, а не возвращает наверх
        const atTop = hidden < 1
        if (atTop !== wasAtTop) {
            wasAtTop = atTop
            onattop(atTop)
        }
    }

    // ── Кадры ──

    let idle = false

    // После интро цикл Threlte остановлен: фон — один проход планировщика, куб — свой рендер
    const renderFront = () => front.render(frontScene, frontCamera)
    const render = () => {
        invalidate()
        scheduler.run(performance.now())
        renderFront()
    }

    // Один шаг всех плавных величин; true — всё сошлось
    const step = (dt: number) => {
        // Движение при reduced motion сразу в цель, свет и цвет — плавно
        const motion = (rate: number) => (reducedMotion ? 1 : 1 - Math.exp(-rate * dt))
        const fade = (rate: number) => 1 - Math.exp(-rate * dt)
        const glowTarget = glowOn ? 1 : 0
        const reachTarget = rayOn ? 1 : 0

        glow = approach(glow, glowTarget, fade(GLOW_RATE))
        reach = approach(reach, reachTarget, motion(REACH_RATE))
        retarget = approach(retarget, 1, motion(RETARGET_RATE))
        techColor = approachRgb(techColor, techColorTarget, fade(COLOR_RATE))
        roleWave = reducedMotion ? 1 : Math.min(1, roleWave + dt / ROLE_WAVE_SECONDS)
        if (strikeTime < AFTERMATH_SECONDS) strikeTime += dt

        let spectrumSettled = true
        spectrumBeams.forEach((spectrum, index) => {
            const previous = spectrumBeams[index - 1]
            const turn = !previous?.on || previous.reach >= SPECTRUM_CASCADE
            const reachTarget = spectrum.on && turn ? 1 : 0
            const boostTarget = spectrum.target && glowElement?.contains(spectrum.target.element) ? 1 : 0
            spectrum.reach = approach(spectrum.reach, reachTarget, motion(SPECTRUM_RATE))
            spectrum.boost = approach(spectrum.boost, boostTarget, fade(GLOW_RATE))
            spectrumSettled &&= spectrum.reach === reachTarget && spectrum.boost === boostTarget
        })

        return (
            glow === glowTarget &&
            reach === reachTarget &&
            retarget === 1 &&
            roleWave === 1 &&
            sameRgb(techColor, techColorTarget) &&
            spectrumSettled &&
            strikeTime >= AFTERMATH_SECONDS
        )
    }

    // Единый аниматор: кадры идут, только пока что-то догоняет цель, и не чаще кадра экрана
    let frame = 0
    let lastTime = 0
    const tick = (now: number) => {
        // Не меньше нуля: после длинной задачи (компиляция шейдеров) Chrome отдаёт кадру время
        // его начала — раньше, чем kick() запомнил performance.now(). Отрицательный шаг отбросил бы
        // волну цвета роли на секунды назад, и аниматор впустую рисовал бы кадры, пока она вернётся
        const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05)
        lastTime = now
        const settled = step(dt)
        apply()
        // Во время интро кадры рисует задача Threlte
        if (idle) render()
        frame = settled && !targetsMoved ? 0 : requestAnimationFrame(tick)
    }
    const kick = () => {
        if (frame) return
        lastTime = performance.now()
        frame = requestAnimationFrame(tick)
    }

    // ── Реакции на входы ──

    $effect(() => {
        const { width, height } = $size
        uniforms.uSize.value.set(width, height)
        uniforms.uDpr.value = $dpr
        // На узких экранах вертикаль и лучи спектра проходят за текстом — приглушаем
        uniforms.uIntensity.value = width < NARROW_SCREEN ? 0.6 : 1

        // Призма целиком на экране: у правого края точку расщепления отодвигаем
        const edge = Math.min(Math.max(width * 0.0495, 44), 75)
        split.set(Math.min(BEAM_X * width, width - edge * 0.9), SPLIT_Y * height)
        uniforms.uSplit.value.copy(split)
        halo.setLayout(split.x, split.y, edge)

        const frontSize = Math.round(edge * FRONT_SCALE)
        front.setSize(frontSize, frontSize, false)
        cube.setLayout(frontSize, edge)
        // У сцены y снизу, у CSS — сверху
        onlayout({ left: split.x - frontSize / 2, top: height - split.y - frontSize / 2, size: frontSize })

        apply()
        if (idle) render()
    })

    let shownRole: Role | null = null
    $effect(() => {
        const next = role
        if (shownRole === null) {
            roleFrom = roleTo = ROLE_COLORS[next]
            techColor = techColorTarget = roleTo
        } else if (next !== shownRole) {
            // Волна нового цвета стартует от того цвета, что виден сейчас
            roleFrom = roleColor()
            roleTo = ROLE_COLORS[next]
            roleWave = 0
            if (!glowOn) techColorTarget = roleTo
        }
        shownRole = next
        // Высота страницы тоже поменялась — прогресс рёбер пересчитается
        kick()
    })

    $effect(() => {
        const current = prismGlow.current
        const next = current?.ray ? current : null

        if (next && next.element !== target?.element) {
            // Горящий луч переезжает к новой цели; погасший — сразу в цель, без проезда через экран
            if (reach > 0.05) {
                rayFrom.copy(rayEnd)
                retarget = 0
            } else {
                retarget = 1
            }
            target = next
        }
        if (current) techColorTarget = current.color ?? (next ? iconColor(next.icon) : null) ?? roleColor()

        glowOn = current !== null
        rayOn = next !== null
        glowElement = current?.element ?? null
        kick()
    })

    $effect(() => {
        const targets = prismSpectrum.targets
        targets.forEach((target, index) => {
            const spectrum = spectrumBeam(index)
            spectrum.target = target
            spectrum.on = true
        })
        // Лишние лучи втягиваются к последней цели
        for (const spectrum of spectrumBeams.slice(targets.length)) spectrum.on = false
        kick()
    })

    // Прокрутка — у #scroll-root текущей страницы. Сцена живёт в общем макете и переживает
    // переходы (главная ↔ /stats), а #scroll-root у каждой страницы свой: после перехода
    // подписываемся заново и сразу берём его положение, иначе лучи застынут как при уходе
    let unbindScroll = () => {}
    const bindScroll = () => {
        unbindScroll()
        const root = document.getElementById('scroll-root')
        scrollRoot = root
        if (!root) return

        const onScroll = () => {
            scroll = root.scrollTop
            apply()
            kick()
        }

        onScroll()
        root.addEventListener('scroll', onScroll, { passive: true })
        unbindScroll = () => root.removeEventListener('scroll', onScroll)
    }
    // При монтировании и после каждого перехода: эффект идёт после обновления DOM, новая
    // страница уже на месте. Не afterNavigate: при ленивом монтировании сцены он не зовётся,
    // а $app/navigation в этом чанке стал бы лишним запросом на первом экране
    $effect(() => {
        void page.url.pathname
        untrack(bindScroll)
        return () => unbindScroll()
    })

    // Удар отдаётся вибрацией на сенсорных экранах. Chrome разрешает vibrate лишь после
    // касания страницы — поэтому надёжно она работает у удара по нажатию.
    // В Safari Vibration API нет вовсе
    const vibrate = () => {
        if (!matchMedia('(pointer: coarse)').matches) return
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
        navigator.vibrate?.(IMPACT_VIBRATION)
    }

    // В интро — только если удар виден и был: с reduced motion интро нет, сразу финальный кадр
    let impactFelt = false
    const feelImpact = () => {
        impactFelt = true
        if (!reducedMotion && uniforms.uVisible.value > 0) vibrate()
    }

    // Нажатие на призму в hero повторяет удар: искры с новым разбросом, волна, вспышка.
    // Во время интро и с reduced motion не повторяем
    let strikesSeen: number | null = null
    $effect(() => {
        const count = strikes
        const first = strikesSeen === null
        strikesSeen = count
        if (first || !idle || reducedMotion) return

        strikeTime = 0
        uniforms.uSparkSeed.value = Math.random() * 1000
        vibrate()
        kick()
    })

    const { task } = useTask((delta) => {
        // С reduced motion сразу финальный кадр: всё упало, искры догорели
        elapsed = reducedMotion ? FALL_SECONDS + AFTERMATH_SECONDS : elapsed + delta
        apply()
        renderFront()
        if (!impactFelt && elapsed >= FALL_SECONDS) feelImpact()

        if (elapsed - FALL_SECONDS < AFTERMATH_SECONDS) return
        task.stop()
        // Threlte крутит rAF каждый кадр даже в режиме on-demand.
        // Дальше кадры только по событиям: останавливаем цикл, этот кадр ещё отрисуется
        renderer.setAnimationLoop(null)
        idle = true
    })
</script>
