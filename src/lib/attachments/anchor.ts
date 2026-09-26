import { pushState } from '$app/navigation'
import type { Attachment } from 'svelte/attachments'
import { on } from 'svelte/events'

// Ссылка-якорь на элемент внутри секции со scroll-snap. Браузер ставит цель к верху окна,
// но если тогда окно заходит в соседнюю секцию, mandatory-snap отбрасывает прокрутку
// к ближайшей секции — со стороны кажется, что ничего не произошло. Прокручиваем сами:
// цель как можно ближе к верху, но в пределах своей секции — такая позиция всегда допустима
export const scrollToAnchor: Attachment<HTMLAnchorElement> = (link) =>
    on(link, 'click', (event) => {
        const id = decodeURIComponent(link.hash.slice(1))
        const target = id ? document.getElementById(id) : null
        const section = target?.closest('section')
        const root = document.getElementById('scroll-root')
        if (!target || !section || !root) return

        event.preventDefault()
        const offsetOf = (element: Element) =>
            element.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop
        const start = offsetOf(section)
        const end = Math.max(start, start + section.offsetHeight - root.clientHeight)
        const wanted = offsetOf(target) - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)

        // Плавность задаёт CSS #scroll-root. Адрес с якорем — как у обычной ссылки
        root.scrollTo({ top: Math.min(Math.max(wanted, start), end) })
        pushState(link.hash, {})
    })
