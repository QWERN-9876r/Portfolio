import { useEffect } from "react";

interface SeoOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string;
}

const DEFAULT_SEO: Required<SeoOptions> = {
  title: "Сотников Дмитрий — Frontend / Fullstack / Backend разработчик",
  description:
    "Делаю сложное — стабильным, быстрым и масштабируемым. Портфолио и контакты.",
  ogImage: "/og-image.jpg",
  canonicalUrl: "https://YOUR_DOMAIN.ru",
  keywords:
    "Сотников Дмитрий, Qwern_9876r, frontend разработчик, fullstack, backend, React, TypeScript, Go, портфолио",
};

// JSON-LD Person schema
const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Сотников Дмитрий",
  alternateName: "Qwern_9876r",
  jobTitle: "Frontend / Fullstack / Backend разработчик",
  url: "https://YOUR_DOMAIN.ru",
  sameAs: [
    "https://t.me/Qwern_9876r",
    // "https://github.com/YOUR_GITHUB",
    // "https://hh.ru/resume/YOUR_ID",
  ],
};

// Утилита: найти или создать <meta> тег
const upsertMeta = (
  selector: string,
  attr: string,
  attrValue: string,
  content: string,
): void => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

// Утилита: найти или создать <link> тег
const upsertLink = (rel: string, href: string): void => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

// Утилита: найти или создать JSON-LD <script>
const upsertJsonLd = (data: object): void => {
  const id = "json-ld-person";
  let el = document.head.querySelector<HTMLScriptElement>(`#${id}`);
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

export const useSeoHead = (options: SeoOptions = {}): void => {
  const seo = { ...DEFAULT_SEO, ...options };

  useEffect(() => {
    // Title
    document.title = seo.title;

    // Description
    upsertMeta(
      'meta[name="description"]',
      "name",
      "description",
      seo.description,
    );

    // Keywords
    upsertMeta('meta[name="keywords"]', "name", "keywords", seo.keywords);

    // Robots
    upsertMeta('meta[name="robots"]', "name", "robots", "index, follow");

    // Canonical
    upsertLink("canonical", seo.canonicalUrl);

    // Open Graph
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      seo.description,
    );
    upsertMeta(
      'meta[property="og:image"]',
      "property",
      "og:image",
      seo.ogImage,
    );
    upsertMeta(
      'meta[property="og:url"]',
      "property",
      "og:url",
      seo.canonicalUrl,
    );
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", "ru_RU");
    upsertMeta(
      'meta[property="og:site_name"]',
      "property",
      "og:site_name",
      "Сотников Дмитрий — Portfolio",
    );

    // Twitter Card
    upsertMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image",
    );
    upsertMeta(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      seo.title,
    );
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      seo.description,
    );
    upsertMeta(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image",
      seo.ogImage,
    );

    // JSON-LD
    upsertJsonLd(PERSON_JSON_LD);
  }, [seo.title, seo.description, seo.ogImage, seo.canonicalUrl, seo.keywords]);
};
