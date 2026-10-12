import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { RUM_JOURNAL, RUM_PORT } from './tests/e2e/rum-journal.mjs'

// E2e: собранный сайт в vite preview и настоящий сервис метрик (deploy/rum) за его прокси.
// В CI сборка уже есть (тот же dist уходит на сервер), локально — собирается перед тестами
// Сайт, как на GitHub Pages, — в папке /Portfolio/: в тестах пути относительные ('en/', 'ru/stats/')
const SITE = 'http://127.0.0.1:4174/Portfolio/'
const preview = 'npx vite preview --host 127.0.0.1 --port 4174 --strictPort'

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    // WebGL в SwiftShader рисуется на процессоре — всё медленнее, чем у посетителя с GPU
    expect: { timeout: 10_000 },
    use: {
        baseURL: SITE,
        // Установленный Chrome, как у печати резюме: браузеры Playwright не качаем
        channel: 'chrome',
        // Без GPU (раннеры CI) WebGL есть только в программном SwiftShader. Включаем его
        // и локально, чтобы сцены везде рисовались одинаково
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
        // Функциональным тестам интро призмы не нужно, а в SwiftShader на раннере с 2 ядрами
        // кадр рисуется до секунды: пока идёт интро, клики и переходы растягиваются на десятки
        // секунд. С reduced motion сразу финальный кадр — это и настоящий режим посетителей.
        // Анимации проверяют тесты с test.use({ reducedMotion: 'no-preference' })
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
    },
    webServer: [
        {
            command: `node ../../tests/e2e/rum-journal.mjs && go run . -addr 127.0.0.1:${RUM_PORT} -data "${RUM_JOURNAL}"`,
            cwd: fileURLToPath(new URL('deploy/rum', import.meta.url)),
            url: `http://127.0.0.1:${RUM_PORT}/api/rum/summary`,
            timeout: 120_000,
        },
        {
            command: process.env.CI ? preview : `npx vite build && ${preview}`,
            url: `${SITE}en/`,
            env: { RUM_SERVICE: `http://127.0.0.1:${RUM_PORT}` },
            timeout: 180_000,
        },
    ],
})
