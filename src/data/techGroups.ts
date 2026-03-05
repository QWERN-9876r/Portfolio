// Тип одной технологии внутри группы
export interface TechGroupItem {
  name: string;
  icon: string; // путь к картинке в public/icons/
  note?: string; // строгая подпись "что делаю"
}

// Тип группы технологий (один экран)
export interface TechGroup {
  id: string;
  index: number; // порядковый номер секции (для заголовка "03", "04" ...)
  title: string;
  subtitle?: string;
  pixiPreset: "particles" | "fluid"; // будет использован в Этапе 6
  items: TechGroupItem[];
}

export const TECH_GROUPS: TechGroup[] = [
  {
    id: "stack-1",
    index: 3,
    title: "Основа фронтенда",
    subtitle: "TypeScript · HTML5 · CSS3 · SCSS",
    pixiPreset: "particles",
    items: [
      {
        name: "TypeScript",
        icon: "/icons/typescript.svg",
        note: "Строгая типизация, generics, utility types, декораторы",
      },
      {
        name: "HTML5",
        icon: "/icons/html5.svg",
        note: "Семантическая разметка, доступность, SEO",
      },
      {
        name: "CSS3",
        icon: "/icons/css3.svg",
        note: "Анимации, grid, custom properties, оптимизация",
      },
      {
        name: "SCSS",
        icon: "/icons/scss.svg",
        note: "Миксины, переменные, архитектура стилей",
      },
    ],
  },
  {
    id: "stack-2",
    index: 4,
    title: "React экосистема",
    subtitle: "React 19 · Next.js 16",
    pixiPreset: "fluid",
    items: [
      {
        name: "React 19",
        icon: "/icons/react.svg",
        note: "Hooks, Suspense, Server Components, оптимизация рендера",
      },
      {
        name: "Next.js 16",
        icon: "/icons/nextjs.svg",
        note: "App Router, SSR, SSG, ISR, middleware",
      },
    ],
  },
  {
    id: "stack-3",
    index: 5,
    title: "Web Components",
    subtitle: "Lit · Custom Elements",
    pixiPreset: "particles",
    items: [
      {
        name: "Lit",
        icon: "/icons/lit.svg",
        note: "Разработка переиспользуемых веб-компонентов",
      },
    ],
  },
  {
    id: "stack-4",
    index: 6,
    title: "Качество и тестирование",
    subtitle: "Storybook · Jest · Playwright",
    pixiPreset: "fluid",
    items: [
      {
        name: "Storybook",
        icon: "/icons/storybook.svg",
        note: "UI-документация, изолированная разработка компонентов",
      },
      {
        name: "Jest",
        icon: "/icons/jest.svg",
        note: "Unit и интеграционное тестирование",
      },
      {
        name: "Playwright",
        icon: "/icons/playwright.svg",
        note: "E2E тестирование, кроссбраузерность",
      },
    ],
  },
  {
    id: "stack-5",
    index: 7,
    title: "Backend",
    subtitle: "Go 1.25",
    pixiPreset: "particles",
    items: [
      {
        name: "Go 1.25",
        icon: "/icons/go.svg",
        note: "Конкурентность, производительность, REST API",
      },
    ],
  },
  {
    id: "stack-6",
    index: 8,
    title: "Go фреймворк",
    subtitle: "Echo 4",
    pixiPreset: "fluid",
    items: [
      {
        name: "Echo 4",
        icon: "/icons/echo.svg",
        note: "Роутинг, middleware, валидация, обработка ошибок",
      },
    ],
  },
  {
    id: "stack-7",
    index: 9,
    title: "Базы данных",
    subtitle: "MongoDB · PostgreSQL",
    pixiPreset: "particles",
    items: [
      {
        name: "MongoDB",
        icon: "/icons/mongodb.svg",
        note: "Документо-ориентированные данные, агрегации",
      },
      {
        name: "PostgreSQL",
        icon: "/icons/postgresql.svg",
        note: "Реляционные данные, индексы, сложные запросы",
      },
    ],
  },
];
