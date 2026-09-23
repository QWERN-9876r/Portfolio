<script lang="ts">
    import Icon from '$lib/components/Icon.svelte'
    import type { Locale, Translation } from '$lib/i18n/translations'
    import type { Role } from '$lib/role'
    import { NICKNAME, TG_URL } from '$lib/site'
    import HeroPhoto from './HeroPhoto.svelte'
    import HeroRole from './HeroRole.svelte'

    let { t, lang, role }: { t: Translation; lang: Locale; role: Role } = $props()

    // Появление с первой отрисовки — CSS, без ожидания гидрации
    const delay = (index: number) => `${0.1 + index * 0.12}s`
</script>

<section id="hero" class="snap-section">
    <div class="content">
        <div class="layout">
            <div class="text">
                <div class="item" style:--delay={delay(0)}>
                    <p class="nickname">{NICKNAME}</p>
                </div>

                <div class="item" style:--delay={delay(1)}>
                    <h1 class="h1 name">
                        {t.hero.lastName}
                        <br />
                        <span>{t.hero.firstName}</span>
                    </h1>
                </div>

                <div class="item" style:--delay={delay(2)}>
                    <HeroRole {lang} {role} labels={t.hero.roles} />
                </div>

                <div class="item divider" style:--delay={delay(3)}>
                    <div class="neon-line"></div>
                </div>

                <div class="item" style:--delay={delay(4)}>
                    <p class="body1 intro">
                        {t.hero.intro}
                        <span>{t.hero.introAccent}</span>
                        {t.hero.introJoin}
                        <span>{t.hero.introEnd}</span>
                    </p>
                </div>

                <div class="item" style:--delay={delay(5)}>
                    <a class="btn-primary cta" href={TG_URL} target="_blank" rel="noopener noreferrer">
                        <span class="cta-icon"><Icon name="telegram" size={22} /></span>
                        {t.hero.telegram}
                    </a>
                </div>
            </div>

            <div class="photo">
                <HeroPhoto
                    alt={t.hero.photoAlt}
                    initials={t.hero.lastName[0] + t.hero.firstName[0]}
                />
            </div>
        </div>
    </div>
</section>

<style>
    section {
        overflow: hidden;
    }

    .content {
        width: 100%;
        max-width: var(--content-width);
        animation: section-in 0.8s cubic-bezier(0.76, 0, 0.24, 1) both;
    }

    .layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 40px;
        width: 100%;
    }

    .text {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        min-width: 0;
        text-align: center;
    }

    .item {
        animation: item-in 0.65s var(--ease-out) var(--delay) both;
    }

    .nickname {
        color: rgb(var(--c-neon-soft) / 0.7);
        font-size: 1.4rem;
        font-style: italic;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.02em;
        user-select: none;
    }

    .name {
        color: rgb(var(--c-text-primary));
        line-height: 1.05;
    }

    .name span {
        color: rgb(var(--c-neon-soft));
        text-shadow: 0 0 40px rgb(var(--c-neon) / 0.5);
    }

    .divider {
        width: 100%;
    }

    .divider .neon-line {
        width: 80%;
        max-width: 280px;
    }

    .intro {
        max-width: 480px;
        color: rgb(var(--c-text-secondary));
        font-weight: 500;
        line-height: 1.6;
    }

    .intro span {
        color: rgb(var(--c-text-primary));
        font-weight: 600;
    }

    .cta {
        width: fit-content;
        margin-top: 4px;
    }

    .cta-icon {
        display: flex;
        margin: 0 8px 0 -4px;
    }

    .photo {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        animation: photo-in 0.9s var(--ease-out) 0.3s both;
    }

    @keyframes section-in {
        from {
            clip-path: inset(0 0 100% 0);
            opacity: 0;
        }
        to {
            clip-path: inset(0 0 0% 0);
            opacity: 1;
        }
    }

    @keyframes item-in {
        from {
            opacity: 0;
            transform: translateY(32px);
            filter: blur(8px);
        }
    }

    @keyframes photo-in {
        from {
            opacity: 0;
            transform: scale(0.85);
            filter: blur(12px);
        }
    }

    @media (min-width: 600px) {
        .nickname {
            font-size: 1.65rem;
        }
    }

    @media (min-width: 900px) {
        .layout {
            flex-direction: row;
            justify-content: space-between;
            gap: 32px;
        }

        .text {
            align-items: flex-start;
            gap: 20px;
            text-align: left;
        }

        .nickname {
            font-size: 1.9rem;
        }

        .divider .neon-line {
            width: 60%;
        }
    }

    @media (min-width: 1200px) {
        .layout {
            gap: 48px;
        }
    }
</style>
