// PDF-резюме после сборки: /resume/{lang} из dist печатается в установленном Chrome.
// Данные те же, что на сайте, поэтому PDF всегда совпадает с ним.
// SKIP_RESUME_PDF=1 — пропустить (например, где нет Chrome)
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const LOCALES = ['en', 'ru']
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
}

if (process.env.SKIP_RESUME_PDF) {
    console.log('resume-pdf: пропущено (SKIP_RESUME_PDF)')
    process.exit(0)
}

// Как try_files в nginx: /resume/en → resume/en.html
const isFile = (path) => existsSync(path) && statSync(path).isFile()
const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const file = [path, `${path}.html`, `${path}/index.html`].map((p) => join(DIST, p)).find(isFile)
    if (!file) {
        res.writeHead(404).end()
        return
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
})
await new Promise((resolve) => server.listen(0, resolve))
const origin = `http://localhost:${server.address().port}`

const browser = await chromium.launch({ channel: 'chrome' }).catch((error) => {
    server.close()
    console.error('resume-pdf: нужен установленный Google Chrome (или SKIP_RESUME_PDF=1)')
    throw error
})

try {
    for (const lang of LOCALES) {
        const page = await browser.newPage()
        await page.goto(`${origin}/resume/${lang}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        const path = join(DIST, `resume/dmitry-sotnikov-${lang}.pdf`)
        await page.pdf({ path, format: 'A4', printBackground: true, preferCSSPageSize: true })
        console.log(`resume-pdf: ${path.replace(DIST, 'dist/')} (${Math.round(statSync(path).size / 1024)} КБ)`)
        await page.close()
    }
} finally {
    await browser.close()
    server.close()
}
