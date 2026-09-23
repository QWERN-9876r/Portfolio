// Разметка и стили прелоадера лежат в index.html, чтобы он появлялся с первой
// отрисовкой, пока грузится JS. Здесь только плавно убираем его.

// Минимум от начала навигации — чтобы на быстром соединении ник не мелькал
const MIN_VISIBLE_MS = 600
const EXIT_MS = 450

export const hidePreloader = () => {
    const el = document.getElementById('preloader')
    if (!el || el.dataset.hiding) return
    el.dataset.hiding = 'true'

    const delay = Math.max(0, MIN_VISIBLE_MS - performance.now())

    setTimeout(() => {
        el.classList.add('is-done')
        // transitionend не приходит при reduced motion и в фоновой вкладке
        setTimeout(() => el.remove(), EXIT_MS + 100)
    }, delay)
}
