import { useEffect, useState } from "react";
import { createDataHook } from "./createDataHook";

export interface Tech {
  name: string;
  url: string;
  icon: string; // путь к картинке в public/icons/
  priority?: 1 | 2 | 3;
}

// Заполни сам — добавляй/убирай технологии
// Клик по иконке откроет url в новой вкладке
const ALL_TECHNOLOGIES_BY_DEFAULT: Tech[] = [
  {
    name: "TypeScript",
    url: "https://www.typescriptlang.org",
    icon: "/icons/typescript.svg",
    priority: 1,
  },
  { name: "Go", url: "https://go.dev", icon: "/icons/go.svg", priority: 1 },
  {
    name: "C++",
    url: "https://learn.microsoft.com/ru-ru/cpp/cpp",
    icon: "/icons/cpp.svg",
    priority: 3,
  },
  {
    name: "Java",
    url: "https://www.oracle.com/java",
    icon: "/icons/java.svg",
    priority: 3,
  },
  {
    name: "Python",
    url: "https://www.python.org",
    icon: "/icons/python.svg",
    priority: 3,
  },
  {
    name: "React",
    url: "https://react.dev",
    icon: "/icons/react.svg",
    priority: 1,
  },
  {
    name: "Next.js",
    url: "https://nextjs.org",
    icon: "/icons/nextjs.svg",
    priority: 1,
  },

  {
    name: "HTML5",
    url: "https://developer.mozilla.org/docs/Web/HTML",
    icon: "/icons/html5.svg",
    priority: 2,
  },
  {
    name: "CSS3",
    url: "https://developer.mozilla.org/docs/Web/CSS",
    icon: "/icons/css3.svg",
    priority: 2,
  },
  {
    name: "SCSS",
    url: "https://sass-lang.com",
    icon: "/icons/scss.svg",
    priority: 2,
  },
  {
    name: "Rive",
    url: "https://rive.app",
    icon: "/icons/rive.svg",
    priority: 2,
  },
  { name: "Lit", url: "https://lit.dev", icon: "/icons/lit.svg", priority: 2 },
  {
    name: "Storybook",
    url: "https://storybook.js.org",
    icon: "/icons/storybook.svg",
    priority: 2,
  },
  {
    name: "Jest",
    url: "https://jestjs.io",
    icon: "/icons/jest.svg",
    priority: 2,
  },
  {
    name: "Playwright",
    url: "https://playwright.dev",
    icon: "/icons/playwright.svg",
    priority: 2,
  },
  {
    name: "Echo",
    url: "https://echo.labstack.com",
    icon: "/icons/echo.svg",
    priority: 2,
  },
  {
    name: "MongoDB",
    url: "https://www.mongodb.com",
    icon: "/icons/mongodb.svg",
    priority: 2,
  },
  {
    name: "PostgreSQL",
    url: "https://www.postgresql.org",
    icon: "/icons/postgresql.svg",
    priority: 2,
  },
  {
    name: "MUI",
    url: "https://mui.com",
    icon: "/icons/mui.svg",
    priority: 3,
  },
  {
    name: "Chakra",
    url: "https://chakra-ui.com",
    icon: "/icons/chakra.ico",
    priority: 3,
  },
  {
    name: "Git",
    url: "https://git-scm.com",
    icon: "/icons/git.svg",
    priority: 3,
  },
  {
    name: "Vite",
    url: "https://vitejs.dev",
    icon: "/icons/vite.svg",
    priority: 3,
  },
  {
    name: "Linux/Ubuntu",
    url: "https://www.linux.org",
    icon: "/icons/ubuntu.svg",
    priority: 3,
  },
  {
    name: "Nginx",
    url: "https://nginx.org",
    icon: "/icons/nginx.svg",
    priority: 3,
  },
];

const S3_URL = "api/storage/allTechnologies.json";

export const useAllTechnologies = createDataHook(
  S3_URL,
  ALL_TECHNOLOGIES_BY_DEFAULT,
);
