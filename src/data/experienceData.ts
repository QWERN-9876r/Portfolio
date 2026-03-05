export interface ExperienceItem {
  period: string; // "MM.YYYY – MM.YYYY" или "MM.YYYY – н.в."
  title: string; // должность / направление
  description: string; // 1–2 строки
  tags?: string[]; // технологии на этот период
}

export interface ExperienceData {
  company: string;
  location: string;
  items: ExperienceItem[];
}

// Заполни реальными данными
export const EXPERIENCE: ExperienceData = {
  company: "Яндекс",
  location: "Москва",
  items: [
    {
      period: "08.2024 – н.в.",
      title: "Frontend-разработчик",
      description:
        "Разработка и поддержка высоконагруженных интерфейсов. " +
        "Оптимизация производительности, внедрение новых фич. " +
        "Помощь смежным командам. " +
        "Обучение стажера. " +
        "Создание новых страниц и расширение возможностьей фронтовой адмики (моя инициатива).",
      tags: [
        "TypeScript",
        "React",
        "Next",
        "SCSS",
        "GraphQL",
        "REST API",
        "Jest",
        "Storybook",
        "и т.д",
      ],
    },
    {
      period: "05.2024 – 08.2024",
      title: "Стажёр Frontend-разработчик",
      description:
        "Разработка новых фич для продукта с многими миллионами пользователей. " +
        "Создание оптимизированных анимаций, внедреннее новых технологий и подходов.",
      tags: [
        "TypeScript",
        "React",
        "Next",
        "SCSS",
        "Jest",
        "Storybook",
        "GraphQL",
        "и т.д",
      ],
    },
  ],
};
