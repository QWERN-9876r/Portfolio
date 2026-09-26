<script lang="ts">
    import { splitRole } from '$lib/content'
    import { translations } from '$lib/i18n/translations'
    import { EMAIL, GITHUB_URL, HH_URL, SITE_URL, TG_URL } from '$lib/site'

    // Резюме для печати в PDF: те же данные, что на сайте, светлая вёрстка под A4
    let { data } = $props()

    const t = $derived(translations[data.lang])
    const content = $derived(data.content)
    const site = $derived(`${SITE_URL}/${data.lang}`)

    const CONTACTS = [
        { label: 'Telegram', href: TG_URL },
        { label: 'Email', href: `mailto:${EMAIL}`, text: EMAIL },
        { label: 'GitHub', href: GITHUB_URL },
        { label: 'HeadHunter', href: HH_URL, text: 'hh.ru' },
    ]
    // В PDF видно адрес, а не только слово-ссылку: его можно переписать с распечатки
    const shortUrl = (href: string) => href.replace(/^https?:\/\//, '').replace(/\/$/, '')
</script>

<svelte:head>
    <title>{t.seo.name} — {t.resume.title}</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<main class="sheet">
    <header class="head">
        <h1 class="name">{t.seo.name}</h1>
        <p class="role">{t.hero.status.detail}</p>
        <ul class="contacts">
            {#each CONTACTS as contact (contact.label)}
                <li>
                    <span class="contact-label">{contact.label}:</span>
                    <a href={contact.href}>{contact.text ?? shortUrl(contact.href)}</a>
                </li>
            {/each}
        </ul>
    </header>

    <section>
        <h2>{t.sections.about}</h2>
        <p>{t.about.text}</p>
    </section>

    <section>
        <h2>{t.sections.experience}</h2>
        {#each content.experience.items as item (item.period + item.title)}
            {@const role = splitRole(item)}
            <article class="entry">
                <div class="entry-head">
                    <h3>{role.title}{#if role.company}<span class="company">{' · '}{role.company}</span>{/if}</h3>
                    <span class="period">{item.period}</span>
                </div>
                {#if item.achievements?.length}
                    <ul class="points">
                        {#each item.achievements as achievement (achievement)}
                            <li>{achievement}</li>
                        {/each}
                    </ul>
                {:else if item.description}
                    <p>{item.description}</p>
                {/if}
            </article>
        {/each}
    </section>

    <section>
        <h2>{t.resume.cases}</h2>
        {#each content.cases as caseItem (caseItem.id)}
            <article class="entry">
                <div class="entry-head">
                    <h3>{caseItem.title}</h3>
                    <span class="period">{caseItem.company}{#if caseItem.period}{' · '}{caseItem.period}{/if}</span>
                </div>
                <p class="results">
                    {#each caseItem.results as result (result.label)}
                        <span class="result">
                            <strong>{result.value}</strong>
                            {t.cases.resultLabels[result.label] ?? result.label}
                        </span>
                    {/each}
                </p>
                {#if caseItem.context}
                    <p class="muted">{caseItem.context}</p>
                {/if}
            </article>
        {/each}
    </section>

    <section>
        <h2>{t.sections.technologies}</h2>
        <dl class="stack">
            {#each content.techGroups as group (group.id)}
                <dt>{group.title}</dt>
                <dd>{group.items.map((item) => item.name).join(', ')}</dd>
            {/each}
        </dl>
    </section>

    <footer class="foot">
        {t.resume.online}: <a href={site}>{shortUrl(site)}</a>
    </footer>
</main>

<style>
    @page {
        size: A4;
        margin: 14mm 14mm 12mm;
    }

    /* Светлый лист вместо тёмной темы сайта */
    :global(html),
    :global(body) {
        background: #eef0f6;
        color: #151a33;
        color-scheme: light;
    }

    .sheet {
        box-sizing: border-box;
        max-width: 210mm;
        margin: 24px auto;
        padding: 16mm 16mm 14mm;
        background: #fff;
        box-shadow: 0 8px 40px rgb(21 26 51 / 0.12);
        font-family: var(--font-body);
        font-size: 10pt;
        line-height: 1.5;
    }

    .head {
        padding-bottom: 12px;
        border-bottom: 2px solid #2979ff;
    }

    .name {
        margin: 0;
        font-family: var(--font-display);
        font-size: 20pt;
        font-weight: 400;
        line-height: 1.1;
        letter-spacing: -0.01em;
    }

    .role {
        margin: 6px 0 8px;
        color: #2962d8;
        font-size: 11pt;
        font-weight: 600;
    }

    .contacts {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 9pt;
    }

    .contact-label {
        color: #5b6385;
    }

    a {
        color: #1e4fd1;
        text-decoration: none;
    }

    section {
        margin-top: 14px;
    }

    h2 {
        margin: 0 0 6px;
        color: #2979ff;
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    p {
        margin: 0;
    }

    .entry {
        margin-bottom: 10px;
        break-inside: avoid;
    }

    .entry-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 2px 12px;
    }

    h3 {
        margin: 0;
        font-size: 10.5pt;
        font-weight: 700;
    }

    .company {
        color: #2962d8;
        font-weight: 600;
    }

    .period {
        color: #5b6385;
        font-size: 9pt;
        white-space: nowrap;
    }

    .points {
        margin: 4px 0 0;
        padding-left: 16px;
    }

    .points li {
        margin-top: 2px;
    }

    .results {
        display: flex;
        flex-wrap: wrap;
        gap: 2px 14px;
        margin-top: 3px;
    }

    .result strong {
        color: #2962d8;
    }

    .muted {
        color: #5b6385;
        font-size: 9pt;
    }

    .stack {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 3px 12px;
        margin: 0;
    }

    .stack dt {
        font-weight: 600;
    }

    .stack dd {
        margin: 0;
        color: #3a4163;
    }

    .foot {
        margin-top: 16px;
        padding-top: 8px;
        border-top: 1px solid #d9ddec;
        color: #5b6385;
        font-size: 9pt;
    }

    @media print {
        :global(html),
        :global(body) {
            background: #fff;
        }

        .sheet {
            max-width: none;
            margin: 0;
            padding: 0;
            box-shadow: none;
        }
    }
</style>
