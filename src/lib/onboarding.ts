import { onUserGlow } from '$lib/three/prismGlow.svelte'

// Онбординг механики свечения: сценарий из шагов по таймеру. Обрывается, как только
// посетитель сам навёл или коснулся чего-то светящегося, и по возвращённой функции
// (секция ушла с экрана). Сценарий сам гасит зажжённое в finally

// Пауза, которая обрывается вместе со сценарием
export const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason)
        const id = setTimeout(resolve, ms)
        signal.addEventListener(
            'abort',
            () => {
                clearTimeout(id)
                reject(signal.reason)
            },
            { once: true },
        )
    })

export const runOnboarding = (script: (signal: AbortSignal) => Promise<void>) => {
    const controller = new AbortController()
    const stopListening = onUserGlow(() => controller.abort())

    script(controller.signal)
        .catch((error) => {
            if (!controller.signal.aborted) console.warn('Onboarding error:', error)
        })
        .finally(stopListening)

    return () => controller.abort()
}

// Центр элемента в координатах контейнера — туда палец ставит кончик
export const centerIn = (container: Element, element: Element) => {
    const target = element.getBoundingClientRect()
    const origin = container.getBoundingClientRect()
    return {
        x: target.left + target.width / 2 - origin.left,
        y: target.top + target.height / 2 - origin.top,
    }
}
