import type { Attachment } from 'svelte/attachments'

// Один раз помечает элемент data-revealed, когда он входит в экран.
// Дальше всё делает CSS: .reveal внутри проявляются с задержкой --delay (см. app.css)
export const reveal =
    (margin = '-15%'): Attachment<HTMLElement> =>
    (node) => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return
                node.setAttribute('data-revealed', '')
                observer.disconnect()
            },
            { rootMargin: margin },
        )

        observer.observe(node)
        return () => observer.disconnect()
    }

export const intersect =
    (
        onChange: (isIntersecting: boolean) => void,
        options: (node: HTMLElement) => IntersectionObserverInit = () => ({}),
    ): Attachment<HTMLElement> =>
    (node) => {
        const observer = new IntersectionObserver(
            ([entry]) => onChange(entry.isIntersecting),
            options(node),
        )

        observer.observe(node)
        return () => observer.disconnect()
    }
