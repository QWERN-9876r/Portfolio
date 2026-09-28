export interface ExperienceItem {
    period: string // "MM.YYYY – MM.YYYY" или "MM.YYYY – н.в."
    title: string // должность
    // Компания. В старом формате её нет — она в скобках в конце title: «Frontend-разработчик (МТС)»
    company?: string
    // 2–3 пункта-достижения; если их нет, показывается description
    achievements?: string[]
    description?: string // 1–2 строки; его же читают сборки до появления achievements
    tags?: string[] // технологии на этот период
}

export interface ExperienceData {
    company: string
    location: string
    items: ExperienceItem[] // от новых к старым
}

// Период в месяцах от начала эры: «05.2024 – 08.2024» → { start, end }.
// end: null — по настоящее время («н.в.», «present»). Разделитель любой, так же пишутся периоды кейсов
export const parsePeriod = (text: string | undefined) => {
    const [start, end] = [...(text ?? '').matchAll(/(\d{1,2})\.(\d{4})/g)].map(
        ([, month, year]) => Number(year) * 12 + Number(month) - 1,
    )
    return start === undefined ? null : { start, end: end ?? null }
}

export type Period = NonNullable<ReturnType<typeof parsePeriod>>

// Периоды пересекаются; незаконченный идёт до бесконечности
export const overlaps = (a: Period, b: Period) => a.start <= (b.end ?? Infinity) && b.start <= (a.end ?? Infinity)

// Должность и компания. В старом формате компании нет — она в скобках в конце title
const TITLE_COMPANY = /^(.*?)\s*\(([^)]+)\)$/
export const splitRole = (item: ExperienceItem) => {
    if (item.company) return { title: item.title, company: item.company }
    const match = TITLE_COMPANY.exec(item.title)
    return match ? { title: match[1], company: match[2] } : { title: item.title, company: null }
}

// Якорь должности на странице по началу периода: #role-2024-05 — на него ссылаются кейсы
export const roleAnchor = (item: ExperienceItem) => {
    const period = parsePeriod(item.period)
    if (!period) return null
    return `role-${Math.floor(period.start / 12)}-${String((period.start % 12) + 1).padStart(2, '0')}`
}

export const DEFAULT_EXPERIENCE: ExperienceData = {
    company: 'Яндекс и МТС',
    location: 'Москва',
    items: [
        {
            period: '05.2026 – н.в.',
            title: 'Fullstack-разработчик',
            company: 'МТС',
            achievements: [
                'Разрабатываю браузерные игры на WebGL: игровые механики и серверные API',
                'Оптимизирую производительность игр в браузере',
                'Спроектировал и разработал админ-панель и модули для создания игр',
            ],
            description:
                'Разработка браузерных игр на WebGL: игровые механики, серверные API и оптимизация производительности. ' +
                'Проектирование и разработка админ-панели и модулей для создания игр.',
            tags: [
                'TypeScript',
                'Go',
                'WebGL',
                'Three.js',
                'Pixi.js',
                'Svelte',
                'Threlte',
                'React',
                'Vite',
                'Fastify',
                'PostgreSQL',
            ],
        },
        {
            period: '08.2024 – 03.2026',
            title: 'Frontend-разработчик',
            company: 'Яндекс',
            achievements: [
                'Разрабатывал и поддерживал высоконагруженные интерфейсы: новые фичи и оптимизация производительности',
                'По своей инициативе создал новые страницы и расширил возможности фронтовой админки',
                'Помогал смежным командам и обучил стажёра',
            ],
            description:
                'Разработка и поддержка высоконагруженных интерфейсов. Оптимизация производительности, внедрение новых фич. Помощь смежным командам. Обучение стажёра. Создание новых страниц и расширение возможностей фронтовой админки (моя инициатива).',
            tags: ['TypeScript', 'React', 'Next', 'SCSS', 'GraphQL', 'REST API', 'Jest', 'Storybook'],
        },
        {
            period: '05.2024 – 08.2024',
            title: 'Стажёр Frontend-разработчик',
            company: 'Яндекс',
            achievements: [
                'Разрабатывал новые фичи для продукта с многими миллионами пользователей',
                'Создавал оптимизированные анимации, внедрял новые технологии и подходы',
            ],
            description:
                'Разработка новых фич для продукта с многими миллионами пользователей. Создание оптимизированных анимаций, внедрение новых технологий и подходов.',
            tags: ['TypeScript', 'React', 'Next', 'SCSS', 'Jest', 'Storybook', 'GraphQL'],
        },
    ],
}
