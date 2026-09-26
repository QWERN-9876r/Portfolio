import type { Attachment } from 'svelte/attachments'
import type { Rgb } from './prism'

// Модуль без three — его подключают обычные компоненты страницы, а сцена лишь читает

export interface GlowTarget {
    element: HTMLElement
    // Иконка технологии: в неё бьёт луч и из неё берётся цвет свечения
    icon: HTMLImageElement | null
    ray: boolean
    // Свой цвет свечения вместо цвета иконки
    color: Rgb | null
}

// Стек элементов, которые сейчас «зажигают» призму; текущий — последний
let targets = $state.raw<GlowTarget[]>([])

export const prismGlow = {
    get active() {
        return targets.length > 0
    },
    get current(): GlowTarget | null {
        return targets.at(-1) ?? null
    },
}

// На тач-экранах наведения нет: касание закрепляет свечение за элементом.
// Одновременно закреплён один элемент
let pinned: { element: HTMLElement; release: () => void } | null = null

const unpin = () => {
    const current = pinned
    pinned = null
    current?.release()
}

// Посетитель сам навёл, коснулся или перешёл с клавиатуры на светящийся элемент:
// онбординг механики больше не нужен
const userGlowListeners = new Set<() => void>()
const userGlowed = () => userGlowListeners.forEach((listener) => listener())
export const onUserGlow = (listener: () => void) => {
    userGlowListeners.add(listener)
    return () => userGlowListeners.delete(listener)
}

// Свечение из кода (онбординг): то же, что при наведении. Возвращает «погасить»
const controls = new WeakMap<HTMLElement, { enter: () => void; leave: () => void }>()
export const lightUp = (element: HTMLElement) => {
    const control = controls.get(element)
    control?.enter()
    return () => control?.leave()
}

// Призма светится, пока элемент под курсором или в фокусе. На тач-экранах — после касания
// и до касания в другом месте или пока элемент не уйдёт с экрана.
// Горящий элемент помечен data-lit — CSS рисует его как при наведении.
// pin: false — по касанию только короткая вспышка (у кнопки на кубе своё действие).
// onchange — зажёгся или погас, от чего угодно: наведения, касания, фокуса, онбординга
export const glowPrism =
    ({
        ray = true,
        color = null,
        pin = true,
        onchange,
    }: {
        ray?: boolean
        color?: Rgb | null
        pin?: boolean
        onchange?: (lit: boolean) => void
    } = {}): Attachment<HTMLElement> =>
    (node) => {
        const enter = () => {
            const target = { element: node, icon: node.querySelector('img'), ray, color }
            targets = [...targets.filter((t) => t.element !== node), target]
            node.setAttribute('data-lit', '')
            onchange?.(true)
        }
        const leave = () => {
            if (targets.some((t) => t.element === node)) {
                targets = targets.filter((t) => t.element !== node)
                node.removeAttribute('data-lit')
                onchange?.(false)
            }
        }
        controls.set(node, { enter, leave })

        // У касания pointerenter и pointerleave идут подряд — закреплённое так не погасить
        const pointerEnter = (event: PointerEvent) => {
            if (pin && event.pointerType === 'touch') return
            enter()
            userGlowed()
        }
        const focusIn = () => {
            enter()
            userGlowed()
        }
        const pointerLeave = (event: PointerEvent) => {
            if (!pin || event.pointerType !== 'touch') leave()
        }

        // pointerup у касания бывает только у тапа: жест прокрутки заканчивается pointercancel
        const tap = (event: PointerEvent) => {
            if (!pin || event.pointerType !== 'touch' || pinned?.element === node) return
            unpin()
            enter()
            userGlowed()

            const observer = new IntersectionObserver(([entry]) => {
                if (!entry.isIntersecting) unpin()
            })
            // Слушатель добавлен во время всплытия этого же pointerup — его он уже не поймает
            const tapOutside = (event: PointerEvent) => {
                if (!(event.target instanceof Node && node.contains(event.target))) unpin()
            }
            observer.observe(node)
            document.addEventListener('pointerup', tapOutside, true)

            pinned = {
                element: node,
                release: () => {
                    observer.disconnect()
                    document.removeEventListener('pointerup', tapOutside, true)
                    leave()
                },
            }
        }

        node.addEventListener('pointerenter', pointerEnter)
        node.addEventListener('pointerleave', pointerLeave)
        node.addEventListener('pointerup', tap)
        node.addEventListener('focusin', focusIn)
        node.addEventListener('focusout', leave)

        return () => {
            node.removeEventListener('pointerenter', pointerEnter)
            node.removeEventListener('pointerleave', pointerLeave)
            node.removeEventListener('pointerup', tap)
            node.removeEventListener('focusin', focusIn)
            node.removeEventListener('focusout', leave)
            controls.delete(node)
            if (pinned?.element === node) unpin()
            // Элемент мог исчезнуть под курсором (например, при смене роли)
            leave()
        }
    }

export interface SpectrumTarget {
    element: HTMLElement
    color: Rgb
}

// Элементы, в которые призма светит постоянно, каждый своим лучом
let spectrum = $state.raw<SpectrumTarget[]>([])

export const prismSpectrum = {
    get targets() {
        return spectrum
    },
}

// Пока секция проходит середину экрана, призма расщепляет свет на её элементы
// [data-spectrum]: луч цвета colors[i] — в i-й элемент по порядку в DOM
export const castSpectrum =
    (colors: readonly Rgb[]): Attachment<HTMLElement> =>
    (section) => {
        let cast: SpectrumTarget[] | null = null
        const clear = () => {
            if (spectrum === cast) spectrum = []
            cast = null
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return clear()
                cast = [...section.querySelectorAll<HTMLElement>('[data-spectrum]')].map((element, index) => ({
                    element,
                    color: colors[index % colors.length],
                }))
                spectrum = cast
            },
            { rootMargin: '-35% 0px' },
        )

        observer.observe(section)
        return () => {
            observer.disconnect()
            clear()
        }
    }
