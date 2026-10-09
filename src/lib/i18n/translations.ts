import type { Role } from '$lib/role'

export const LOCALES = ['en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

export const isLocale = (value: string | null | undefined): value is Locale =>
    (LOCALES as readonly string[]).includes(value ?? '')

export interface Translation {
    seo: {
        title: string
        description: string
        ogDescription: string
        ogLocale: string
        // Описание картинки превью (og-image.jpg) для соцсетей и мессенджеров
        ogImageAlt: string
        keywords: string
        name: string
        jobTitle: string
    }
    hero: {
        firstName: string
        lastName: string
        intro: string
        introAccent: string
        introJoin: string
        introEnd: string
        telegram: string
        photoAlt: string
        roles: Record<Role, string>
        // Статус поиска работы над ником: что ищу и в каком формате
        status: { label: string; detail: string }
        // Плашка под кнопками: ведёт в кейс про MangoScript
        // detail — продолжение text, на телефоне не помещается и скрыто
        openSource: { badge: string; text: string; detail: string }
    }
    sections: {
        about: string
        whyMe: string
        technologies: string
        technologiesHint: string
        experience: string
    }
    sellingPoints: { title: string; description: string }[]
    whyMe: {
        // Ссылка на страницу живой статистики /stats
        statsLink: string
        // «Медиана у {n} {people} за {days} {daysWord}»: числа и формы слов подставляет LiveMetrics
        visitors: string
        people: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
        daysWord: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
        measured: string
        metrics: Record<'lcp' | 'fcp' | 'load' | 'js' | 'fps', string>
        units: Record<'ms' | 's' | 'kb' | 'decimal', string>
    }
    about: {
        bio: string
        text: string
        highlights: string[]
        companies: string
        companyNames: Record<'yandex' | 'mts', string>
    }
    experience: {
        now: string
        // «Повышение за» + «3 месяца»: число и форма слова по правилам языка
        promotion: string
        months: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
        sameStack: string
        moreTags: string
    }
    cases: {
        label: string
        problem: string
        solution: string
        result: string
        // Подписи результатов из cases.json, которые стоит перевести
        resultLabels: Record<string, string>
        // Пояснения к метрикам под цифрами: DAU → ежедневная аудитория
        resultHints: Record<string, string>
        of: string
        facts: string
        details: string
        during: string
        prev: string
        next: string
        visual: string
        sizes: string
        before: string
        after: string
        team: string
        // Пример кода в кейсе про MangoScript
        demo: { label: string; note: string }
    }
    allTech: {
        openSite: string
    }
    footer: {
        telegram: string
        tagline: string
        name: string
    }
    languageToggle: {
        label: string
        switchTo: string
    }
    // Кнопка живой статистики в верхней панели
    statsNav: string
    prism: {
        backToTop: string
        strike: string
    }
    resume: {
        title: string
        download: string
        cases: string
        online: string
    }
}

export const translations: Record<Locale, Translation> = {
    en: {
        seo: {
            title: 'Qwern9876r',
            description:
                'I make complex systems stable, fast and scalable. Portfolio and contacts.',
            ogDescription: 'I make complex systems stable, fast and scalable.',
            ogLocale: 'en_US',
            ogImageAlt: 'Dmitry Sotnikov in the Yandex office under the Yandex Go neon sign',
            keywords:
                'Dmitry Sotnikov, Qwern_9876r, frontend developer, fullstack, backend, React, TypeScript, Go, MangoScript, portfolio',
            name: 'Dmitry Sotnikov',
            jobTitle: 'Frontend / Fullstack / Backend developer',
        },
        hero: {
            firstName: 'Dmitry',
            lastName: 'Sotnikov',
            intro: 'I make complex systems',
            introAccent: 'stable and fast',
            introJoin: 'and',
            introEnd: 'scalable',
            telegram: 'Message on Telegram',
            photoAlt: 'Dmitry Sotnikov',
            roles: {
                frontend: 'Frontend',
                fullstack: 'Fullstack',
                backend: 'Backend',
            },
            status: { label: 'Open to offers', detail: 'Middle+ Frontend / Fullstack · Moscow or remote' },
            openSource: { badge: 'Open source', text: 'My language MangoScript', detail: ', compiles to JS' },
        },
        sections: {
            about: 'About me',
            whyMe: 'Why me',
            technologies: 'Technologies',
            technologiesHint: 'Click an icon to visit the technology website',
            experience: 'Experience',
        },
        sellingPoints: [
            {
                title: 'High performance',
                description:
                    'I write code that does not just work — it works fast. I optimize rendering, bundle size, network requests, and response time. Lighthouse metrics, Core Web Vitals, and profiling are a required part of the work, not an option.',
            },
            {
                title: 'Initiative',
                description:
                    'I do not wait for tasks to be assigned — I find problems and propose solutions myself. I take on complex, uncertain tasks and see them through without constant supervision. I work autonomously and take responsibility for the result.',
            },
            {
                title: 'Business mindset',
                description:
                    'I look at tasks through a business lens: I assess the long-term impact of technical decisions, avoid overengineering, and focus on what creates real value for the product and its users.',
            },
        ],
        whyMe: {
            statsLink: 'All live stats',
            visitors: 'Median across {n} {people}, last {days} {daysWord}',
            people: { one: 'visitor', other: 'visitors' },
            daysWord: { one: 'day', other: 'days' },
            measured: 'This page, in your browser',
            metrics: {
                lcp: 'LCP',
                fcp: 'FCP',
                load: 'full load',
                js: 'JS on load',
                fps: 'fps at rest',
            },
            units: { ms: 'ms', s: 's', kb: 'KB', decimal: '.' },
        },
        about: {
            bio: 'BIO',
            text: 'I am a fullstack developer with experience at Yandex, where I handled complex technical challenges — from optimizing interface performance to designing large-scale projects. I write high-performance, maintainable code and always look beyond the immediate task: I think about how a solution affects the product and the business as a whole. I take initiative, see work through to completion, and do not wait to be told what to do. In my spare time I build MangoScript, my own programming language that compiles to JavaScript.',
            highlights: [
                'Yandex',
                'performance',
                'high-performance',
                'business',
                'I take initiative',
                'MangoScript',
            ],
            companies: 'companies',
            companyNames: { yandex: 'Yandex', mts: 'MTS' },
        },
        experience: {
            now: 'now',
            promotion: 'Promoted in',
            months: { one: 'month', other: 'months' },
            sameStack: 'This site runs on the same stack',
            moreTags: 'More',
        },
        cases: {
            label: 'Case',
            problem: 'Problem',
            solution: 'Solution',
            result: 'Result',
            resultLabels: {},
            resultHints: { DAU: 'daily active users', MAU: 'monthly active users' },
            of: 'of',
            facts: 'Role and constraints',
            details: 'Full story',
            during: 'While working as',
            prev: 'Previous case',
            next: 'Next case',
            visual: 'Before → after',
            sizes: 'What loads, and when',
            before: 'before',
            after: 'after',
            team: 'Frontend team',
            demo: {
                label: 'Example',
                note: 'The whole component: after count++ the compiler updates the button text by itself — no virtual DOM, no library.',
            },
        },
        allTech: {
            openSite: 'Open the website of',
        },
        footer: {
            telegram: 'Message on Telegram',
            tagline: 'I make complex systems stable, fast and scalable',
            name: 'Dmitry Sotnikov',
        },
        languageToggle: {
            label: 'Language',
            switchTo: 'Switch language to',
        },
        statsNav: 'Live stats',
        prism: {
            backToTop: 'Back to top',
            strike: 'Strike the prism with the beam',
        },
        resume: {
            title: 'Resume',
            download: 'Resume PDF',
            cases: 'Cases',
            online: 'Interactive version with 3D and live metrics',
        },
    },
    ru: {
        seo: {
            title: 'Сотников Дмитрий — Frontend / Fullstack / Backend разработчик',
            description:
                'Делаю сложное — стабильным, быстрым и масштабируемым. Портфолио и контакты.',
            ogDescription:
                'Делаю сложное — стабильным, быстрым и масштабируемым.',
            ogLocale: 'ru_RU',
            ogImageAlt: 'Дмитрий Сотников в офисе Яндекса под неоновой вывеской Яндекс Go',
            keywords:
                'Сотников Дмитрий, Qwern_9876r, frontend разработчик, fullstack, backend, React, TypeScript, Go, MangoScript, портфолио',
            name: 'Сотников Дмитрий',
            jobTitle: 'Frontend / Fullstack / Backend разработчик',
        },
        hero: {
            firstName: 'Дмитрий',
            lastName: 'Сотников',
            intro: 'Делаю сложное —',
            introAccent: 'стабильным, быстрым',
            introJoin: 'и',
            introEnd: 'масштабируемым',
            telegram: 'Написать в Telegram',
            photoAlt: 'Сотников Дмитрий',
            roles: {
                frontend: 'Frontend',
                fullstack: 'Fullstack',
                backend: 'Backend',
            },
            status: { label: 'Открыт к предложениям', detail: 'Middle+ Frontend / Fullstack · Москва или удалёнка' },
            openSource: { badge: 'Open source', text: 'Мой язык MangoScript', detail: ' — компилируется в JS' },
        },
        sections: {
            about: 'О себе',
            whyMe: 'Почему я',
            technologies: 'Технологии',
            technologiesHint:
                'Нажми на иконку — перейдёшь на официальный сайт технологии',
            experience: 'Опыт',
        },
        sellingPoints: [
            {
                title: 'Высокая производительность',
                description:
                    'Пишу код, который не просто работает — он работает быстро. Оптимизирую рендер, bundle size, сетевые запросы и время отклика. Метрики Lighthouse, Core Web Vitals и профилирование — обязательная часть работы, а не опция.',
            },
            {
                title: 'Инициативность',
                description:
                    'Не жду постановки задачи — нахожу проблемы и предлагаю решения сам. Беру на себя сложные и неопределённые задачи, довожу их до конца без постоянного контроля. Работаю автономно и несу ответственность за результат.',
            },
            {
                title: 'Бизнес-мышление',
                description:
                    'Смотрю на задачи через призму бизнеса: оцениваю долгосрочные последствия технических решений, избегаю оверинжиниринга и фокусируюсь на том, что реально приносит ценность продукту и пользователям.',
            },
        ],
        whyMe: {
            statsLink: 'Вся статистика вживую',
            visitors: 'Медиана у {n} {people} за {days} {daysWord}',
            people: { one: 'посетителя', few: 'посетителей', many: 'посетителей', other: 'посетителя' },
            daysWord: { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
            measured: 'Эта страница в вашем браузере',
            metrics: {
                lcp: 'LCP',
                fcp: 'FCP',
                load: 'полная загрузка',
                js: 'JS при загрузке',
                fps: 'кадров/с в покое',
            },
            units: { ms: 'мс', s: 'с', kb: 'КБ', decimal: ',' },
        },
        about: {
            bio: 'BIO',
            text: 'Я fullstack-разработчик с опытом в Яндексе, где закрывал сложные технические задачи — от оптимизации производительности интерфейсов до проектирования огромных проектов. Пишу высокопроизводительный, поддерживаемый код и всегда смотрю шире задачи: думаю о том, как решение влияет на продукт и бизнес в целом. Инициативен, довожу начатое до результата и не жду, когда скажут что делать. В свободное время развиваю MangoScript — свой язык программирования, который компилируется в JavaScript.',
            highlights: [
                'Яндексе',
                'производительности',
                'высокопроизводительный',
                'бизнес',
                'Инициативен',
                'MangoScript',
            ],
            companies: 'компании',
            companyNames: { yandex: 'Яндекс', mts: 'МТС' },
        },
        experience: {
            now: 'сейчас',
            promotion: 'Повышение за',
            months: { one: 'месяц', few: 'месяца', many: 'месяцев', other: 'месяца' },
            sameStack: 'Этот сайт — на том же стеке',
            moreTags: 'Ещё',
        },
        cases: {
            label: 'Кейс',
            problem: 'Проблема',
            solution: 'Решение',
            result: 'Результат',
            resultLabels: { Profit: 'Прибыль' },
            resultHints: { DAU: 'ежедневная аудитория', MAU: 'ежемесячная аудитория' },
            of: 'из',
            facts: 'Роль и условия',
            details: 'Подробнее',
            during: 'Во время работы',
            prev: 'Предыдущий кейс',
            next: 'Следующий кейс',
            visual: 'Было → стало',
            sizes: 'Что грузится и когда',
            before: 'до',
            after: 'после',
            team: 'Фронтенд в команде',
            demo: {
                label: 'Пример',
                note: 'Это весь компонент: после count++ компилятор сам обновит текст кнопки — без виртуального DOM и библиотеки.',
            },
        },
        allTech: {
            openSite: 'Открыть сайт',
        },
        footer: {
            telegram: 'Написать в Telegram',
            tagline: 'Делаю сложное — стабильным, быстрым и масштабируемым',
            name: 'Сотников Дмитрий',
        },
        languageToggle: {
            label: 'Язык',
            switchTo: 'Переключить язык на',
        },
        statsNav: 'Статистика',
        prism: {
            backToTop: 'Наверх',
            strike: 'Ударить лучом по призме',
        },
        resume: {
            title: 'Резюме',
            download: 'Резюме PDF',
            cases: 'Кейсы',
            online: 'Интерактивная версия с 3D и живыми метриками',
        },
    },
}
