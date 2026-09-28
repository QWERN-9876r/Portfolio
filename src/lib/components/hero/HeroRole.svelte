<script lang="ts" module>
    // Подсказка показывается один раз за визит
    let onboarded = false
</script>

<script lang="ts">
    import { cubicOut } from 'svelte/easing'
    import { on } from 'svelte/events'
    import { intersect } from '$lib/attachments/reveal'
    import FingerHint from '$lib/components/FingerHint.svelte'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import { centerIn, runOnboarding, wait } from '$lib/onboarding'
    import { ROLE_DESCRIPTIONS, ROLES, rolePath, type Role } from '$lib/role'

    let { lang, role, labels }: { lang: Locale; role: Role; labels: Translation['hero']['roles'] } = $props()

    const activeIndex = $derived(ROLES.indexOf(role))

    // Аналог AnimatePresence mode="wait": новое описание появляется после ухода старого
    const DURATION = 250
    const blurFly = (_node: Element, { y, delay = 0 }: { y: number; delay?: number }) => ({
        delay,
        duration: DURATION,
        easing: cubicOut,
        css: (t: number, u: number) =>
            `opacity: ${t}; transform: translateY(${u * y}px); filter: blur(${u * 4}px)`,
    })

    // Онбординг: после интро луча палец по очереди нажимает на другие роли — роль
    // при этом не меняется, кнопка лишь откликается нажатием. Обрывается, если посетитель
    // сам взялся за переключатель, сменил роль или ушёл с первого экрана
    const HINT_START = 1000
    const HINT_MOVE = 700
    const HINT_PRESS = 250
    const HINT_HOLD = 900

    let switchEl: HTMLElement
    let finger = $state({ x: 0, y: 0, shown: false, taps: 0, tap: true })
    let pressed = $state<Role | null>(null)
    let stopOnboarding = () => {}

    const onboard = (visible: boolean) => {
        if (!visible) return stopOnboarding()
        if (onboarded) return
        onboarded = true

        stopOnboarding = runOnboarding(async (signal) => {
            try {
                await wait(HINT_START, signal)
                const links = new Map(
                    [...switchEl.querySelectorAll<HTMLElement>('a[data-role]')].map((a) => [a.dataset.role, a]),
                )
                const targets = ROLES.filter((r) => r !== role).flatMap((r) => {
                    const link = links.get(r)
                    return link ? [{ role: r, link }] : []
                })
                if (targets.length === 0) return

                // Появляется чуть ниже первой цели и подъезжает к ней
                const first = centerIn(switchEl, targets[0].link)
                Object.assign(finger, { x: first.x + 30, y: first.y + 60 })
                await wait(50, signal)
                finger.shown = true

                for (const target of targets) {
                    Object.assign(finger, centerIn(switchEl, target.link))
                    await wait(HINT_MOVE, signal)
                    finger.taps++
                    pressed = target.role
                    await wait(HINT_PRESS, signal)
                    pressed = null
                    await wait(HINT_HOLD, signal)
                }
            } finally {
                finger.shown = false
                pressed = null
            }
        })
    }

    // Смена роли (в том числе самим посетителем) и уход со страницы обрывают подсказку
    $effect(() => {
        void role
        return () => stopOnboarding()
    })
</script>

<div class="role">
    <div
        class="switch"
        style:--active={activeIndex}
        bind:this={switchEl}
        {@attach (node) => on(node, 'pointerenter', () => stopOnboarding())}
        {@attach intersect(onboard, () => ({ threshold: 0.9 }))}
    >
        <div class="pill" aria-hidden="true"></div>
        {#each ROLES as r (r)}
            <a
                href={rolePath(lang, r)}
                class="body2"
                class:active={r === role}
                class:pressed={pressed === r}
                data-role={r}
                aria-current={r === role ? 'page' : undefined}
                data-sveltekit-noscroll
                data-sveltekit-replacestate
                data-sveltekit-keepfocus
            >
                {labels[r]}
            </a>
        {/each}

        <FingerHint {...finger} />
    </div>

    <div class="description">
        {#key role}
            <p class="body2" in:blurFly={{ y: 6, delay: DURATION }} out:blurFly={{ y: -6 }}>
                {ROLE_DESCRIPTIONS[role]}
            </p>
        {/key}
    </div>
</div>

<style>
    .role {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Колонки равной ширины: плашку можно двигать чистым CSS, и она верна уже в SSR */
    .switch {
        position: relative;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        width: fit-content;
        padding: 4px;
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        background: rgb(var(--c-bg-elevated) / 0.8);
    }

    .pill {
        position: absolute;
        top: 4px;
        left: 4px;
        width: calc((100% - 16px) / 3);
        height: calc(100% - 8px);
        border: 1px solid rgb(var(--c-neon) / 0.5);
        border-radius: 9px;
        background: linear-gradient(135deg, rgb(var(--c-neon) / 0.3), rgb(var(--c-neon-soft) / 0.2));
        box-shadow: 0 0 12px rgb(var(--c-neon) / 0.2);
        transform: translateX(calc(var(--active) * (100% + 4px)));
        transition: transform 0.35s cubic-bezier(0.3, 1.25, 0.5, 1);
    }

    a {
        position: relative;
        z-index: 1;
        padding: 8px 20px;
        border-radius: 9px;
        color: rgb(var(--c-text-secondary));
        font-size: 0.85rem;
        font-weight: 500;
        text-align: center;
        text-decoration: none;
        user-select: none;
        transition:
            color 0.2s ease,
            background 0.3s ease;
    }

    a:hover {
        color: rgb(var(--c-text-primary) / 0.7);
    }

    /* Нажатие пальцем онбординга: кнопка откликается, роль не меняется */
    a.pressed {
        background: rgb(var(--c-neon) / 0.18);
        color: rgb(var(--c-text-primary));
        transition:
            color 0.1s ease,
            background 0.1s ease;
    }

    a.active {
        color: rgb(var(--c-text-primary));
        font-weight: 700;
    }

    a:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: -2px;
    }

    .description {
        display: grid;
    }

    .description p {
        grid-area: 1 / 1;
        color: rgb(var(--c-text-secondary));
        font-size: 0.85rem;
        font-weight: 500;
    }
</style>
