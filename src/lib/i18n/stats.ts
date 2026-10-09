import type { Locale } from './translations'

// Строки страницы /stats — отдельно от основных переводов: грузятся только с ней,
// первый экран портфолио их не тянет
export interface StatsTranslation {
    title: string
    lead: string
    back: string
    status: Record<'connecting' | 'live' | 'offline', string>
    rating: Record<'good' | 'fair' | 'poor', string>
    unsupported: string
    // Мегабайты — остальные единицы в whyMe.units
    mb: string
    // «в {n} {times} лучше нормы {source} — {norm}» и «норма {source} — {norm}»
    better: string
    norm: string
    times: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
    sources: Record<'google' | 'lighthouse', string>
    noShifts: string
    noBlocking: string
    // «в бюджете {budget}: его держат тесты»
    inBudget: string
    tab: {
        title: string
        caption: string
        frames: string
        framesHint: string
        idle: string
        idleNote: string
        smooth: string
        smoothHint: string
        noDrops: string
        // «пропущено {n}% кадров»
        dropped: string
        legendIdle: string
        legendMotion: string
        inp: string
        inpHint: string
        longTasks: string
        // «поток занят {ms}»
        blocking: string
        cls: string
        memory: string
        nodes: string
        uptime: string
    }
    load: {
        title: string
        // «Первая загрузка в этой вкладке — {path}»
        caption: string
        ttfb: string
        fcp: string
        lcp: string
        domReady: string
        load: string
        jsAtLoad: string
        jsNow: string
        requests: string
        // «{n} из кэша»
        cached: string
        offline: string
    }
    visits: {
        title: string
        caption: string
        // «{n} {visits} за {days} {daysWord}»: формы — visitsWord и whyMe.daysWord
        total: string
        visitsWord: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
        tryIt: string
        empty: string
        you: string
        justNow: string
        device: Record<'mobile' | 'desktop', string>
        deepest: string
        hero: string
        allTech: string
        cta: Record<'telegram' | 'resume' | 'email' | 'github' | 'hh' | 'mangoscript', string>
        privacy: string
    }

}

export const statsTranslations: Record<Locale, StatsTranslation> = {
    en: {
        title: 'This site, live',
        lead: 'Everything here is real data, not mock-up numbers: measurements of your own tab from the browser Performance API, and visits by real people that the server streams the moment it records them.',
        back: 'Back to portfolio',
        status: { connecting: 'Connecting…', live: 'Live', offline: 'Metrics service unavailable' },
        rating: { good: 'good', fair: 'needs work', poor: 'poor' },
        unsupported: 'Not exposed by this browser',
        mb: 'MB',
        better: '{n}{times} better than the {source} bar of {norm}',
        norm: '{source} bar: {norm}',
        times: { one: '×', other: '×' },
        sources: { google: 'Google', lighthouse: 'Lighthouse' },
        noShifts: 'not a single shift',
        noBlocking: 'main thread never blocked over 50 ms',
        inBudget: 'within the {budget} budget enforced by tests',
        tab: {
            title: 'Your tab, right now',
            caption: 'Updates every second',
            frames: 'Frames, second by second',
            framesHint:
                'At rest the page draws nothing, leaving CPU and battery alone. When something moves, frames run at your screen rate. Move the mouse or scroll to wake the chart.',
            idle: 'frames/s at rest',
            idleNote: 'never draws for nothing',
            smooth: 'fps in motion',
            smoothHint: 'move the mouse to measure',
            noDrops: 'no dropped frames',
            dropped: '{n}% frames dropped',
            legendIdle: 'at rest',
            legendMotion: 'motion',
            inp: 'Interaction delay (INP)',
            inpHint: 'Click anything to measure',
            longTasks: 'Long tasks',
            blocking: 'main thread busy {ms}',
            cls: 'Layout shift (CLS)',
            memory: 'JS memory',
            nodes: 'Elements on the page',
            uptime: 'Tab open for',
        },
        load: {
            title: 'How the site loaded',
            caption: 'First load in this tab — {path}',
            ttfb: 'Server response (TTFB)',
            fcp: 'First paint (FCP)',
            lcp: 'Main content (LCP)',
            domReady: 'HTML parsed',
            load: 'Load event',
            jsAtLoad: 'JS before load',
            jsNow: 'JS now, with 3D and scenes',
            requests: 'Requests',
            cached: '{n} from cache',
            offline: 'Files in offline cache',
        },
        visits: {
            title: 'Visitors, in real time',
            caption: 'A visit shows up when the visitor leaves the page',
            total: '{n} {visits} in {days} {daysWord}',
            visitsWord: { one: 'visit', other: 'visits' },
            tryIt: 'Try it: open the portfolio in a new tab, scroll a bit and close it — your visit appears at the top within a second.',
            empty: 'No visits in the last days yet',
            you: 'you',
            justNow: 'just now',
            device: { mobile: 'phone', desktop: 'desktop' },
            deepest: 'scrolled to',
            hero: 'First screen',
            allTech: 'All technologies',
            cta: {
                telegram: 'Telegram',
                resume: 'PDF resume',
                email: 'Email',
                github: 'GitHub',
                hh: 'hh.ru',
                mangoscript: 'MangoScript',
            },
            privacy: 'No cookies, IPs or identifiers: only measurements, language, role and sections seen.',
        },
    },
    ru: {
        title: 'Этот сайт вживую',
        lead: 'Всё на этой странице — настоящие данные, а не цифры из макета: замеры вашей вкладки через Performance API браузера и визиты реальных посетителей, которые сервер присылает сразу, как только записал.',
        back: 'К портфолио',
        status: { connecting: 'Подключение…', live: 'В эфире', offline: 'Сервис метрик недоступен' },
        rating: { good: 'хорошо', fair: 'можно лучше', poor: 'плохо' },
        unsupported: 'Браузер не отдаёт',
        mb: 'МБ',
        better: 'в {n} {times} лучше нормы {source} — {norm}',
        norm: 'норма {source} — {norm}',
        times: { one: 'раз', few: 'раза', many: 'раз', other: 'раза' },
        sources: { google: 'Google', lighthouse: 'Lighthouse' },
        noShifts: 'ни одного сдвига',
        noBlocking: 'поток ни разу не занят дольше 50 мс',
        inBudget: 'в бюджете {budget}: его держат тесты',
        tab: {
            title: 'Ваша вкладка — прямо сейчас',
            caption: 'Обновляется каждую секунду',
            frames: 'Кадры по секундам',
            framesHint:
                'В покое страница не рисует ни кадра — процессор и батарея свободны. Когда что-то движется, кадры идут с частотой экрана. Подвигайте мышью или прокрутите — график оживёт.',
            idle: 'кадров/с в покое',
            idleNote: 'страница не рисует зря',
            smooth: 'к/с в анимации',
            smoothHint: 'подвигайте мышью — посчитаем',
            noDrops: 'без пропусков кадров',
            dropped: 'пропущено {n}% кадров',
            legendIdle: 'покой',
            legendMotion: 'анимация',
            inp: 'Отклик на действия (INP)',
            inpHint: 'Кликните что-нибудь — появится',
            longTasks: 'Долгие задачи',
            blocking: 'поток занят {ms}',
            cls: 'Сдвиги вёрстки (CLS)',
            memory: 'Память JS',
            nodes: 'Элементов на странице',
            uptime: 'Вкладка открыта',
        },
        load: {
            title: 'Как загрузился сайт',
            caption: 'Первая загрузка в этой вкладке — {path}',
            ttfb: 'Ответ сервера (TTFB)',
            fcp: 'Первая отрисовка (FCP)',
            lcp: 'Главный контент (LCP)',
            domReady: 'HTML разобран',
            load: 'Загрузка (load)',
            jsAtLoad: 'JS до загрузки',
            jsNow: 'JS сейчас — с 3D и сценами',
            requests: 'Запросов',
            cached: '{n} из кэша',
            offline: 'Файлов в офлайн-кэше',
        },
        visits: {
            title: 'Посетители — в реальном времени',
            caption: 'Визит появляется, когда посетитель уходит со страницы',
            total: '{n} {visits} за {days} {daysWord}',
            visitsWord: { one: 'визит', few: 'визита', many: 'визитов', other: 'визита' },
            tryIt: 'Проверьте: откройте портфолио в новой вкладке, пролистайте и закройте её — ваш визит появится сверху за секунду.',
            empty: 'За последние дни визитов пока нет',
            you: 'это вы',
            justNow: 'только что',
            device: { mobile: 'телефон', desktop: 'компьютер' },
            deepest: 'досмотрено до',
            hero: 'Первый экран',
            allTech: 'Все технологии',
            cta: {
                telegram: 'Telegram',
                resume: 'PDF-резюме',
                email: 'Почта',
                github: 'GitHub',
                hh: 'hh.ru',
                mangoscript: 'MangoScript',
            },
            privacy: 'Без cookie, IP и идентификаторов: только замеры, язык, роль и увиденные секции.',
        },
    },
}
