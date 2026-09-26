<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import Icon, { type IconName } from '$lib/components/Icon.svelte'
    import Tooltip from '$lib/components/Tooltip.svelte'
    import type { Translation } from '$lib/i18n/translations'
    import type { Locale } from '$lib/i18n/translations'
    import { EMAIL, GITHUB_URL, HH_URL, NICKNAME, resumePdf, TG_URL } from '$lib/site'

    let { t, lang }: { t: Translation; lang: Locale } = $props()

    const socialLinks: { icon: IconName; label: string; href: string; primary?: boolean }[] = $derived([
        { icon: 'telegram', label: 'Telegram', href: TG_URL, primary: true },
        { icon: 'github', label: 'GitHub', href: GITHUB_URL },
        { icon: 'email', label: 'Email', href: `mailto:${EMAIL}` },
        { icon: 'work', label: 'HeadHunter', href: HH_URL },
        { icon: 'download', label: t.resume.download, href: resumePdf(lang) },
    ])

    const year = new Date().getFullYear()
    const delay = (index: number) => `${0.1 + index * 0.12}s`
</script>

<footer id="footer" class="snap-section" {@attach reveal('-10%')}>
    <div class="section-content stack">
        <div class="reveal item wide" style:--delay={delay(0)}>
            <div class="top-line"></div>
        </div>

        <div class="reveal item" style:--delay={delay(1)}>
            <div class="identity">
                <p class="nickname">{NICKNAME}</p>
                <p class="h3 name">{t.footer.name}</p>
                <p class="body2 tagline">{t.footer.tagline}</p>
            </div>
        </div>

        <div class="reveal item" style:--delay={delay(2)}>
            <div class="socials">
                {#each socialLinks as link (link.href)}
                    <Tooltip label={link.label}>
                        <a
                            class="social"
                            class:primary={link.primary}
                            href={link.href}
                            target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            aria-label={link.label}
                        >
                            <Icon name={link.icon} size={22} />
                        </a>
                    </Tooltip>
                {/each}
            </div>
        </div>

        <div class="reveal item" style:--delay={delay(3)}>
            <a class="cta" href={TG_URL} target="_blank" rel="noopener noreferrer">
                <span class="cta-icon"><Icon name="telegram" size={20} /></span>
                <span class="cta-text">{t.footer.telegram}</span>
            </a>
        </div>

        <div class="reveal item wide" style:--delay={delay(4)}>
            <div class="bottom">
                <span class="caption copyright">© {year} {NICKNAME} · {t.footer.name}</span>
            </div>
        </div>
    </div>
</footer>

<style>
    .stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
        text-align: center;
    }

    .item {
        --from: translateY(24px);
        --blur: 6px;
        --duration: 0.6s;
    }

    .wide {
        width: 100%;
    }

    .top-line {
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            rgb(var(--c-neon) / 0.5),
            rgb(var(--c-neon)),
            rgb(var(--c-neon) / 0.5),
            transparent
        );
        box-shadow: 0 0 12px rgb(var(--c-neon) / 0.3);
    }

    .identity {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .nickname {
        color: rgb(var(--c-neon-soft) / 0.6);
        font-size: 1.1rem;
        font-style: italic;
        font-weight: 600;
        letter-spacing: 0.02em;
        user-select: none;
    }

    .name {
        color: rgb(var(--c-text-primary));
        line-height: 1.1;
    }

    .tagline {
        margin-top: 4px;
        color: rgb(var(--c-text-secondary));
        font-style: italic;
    }

    .socials {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .social {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 1px solid rgb(var(--c-neon) / 0.15);
        border-radius: 50%;
        background: rgb(var(--c-bg-elevated) / 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: rgb(var(--c-text-secondary));
        transition: all 0.2s ease;
    }

    .social.primary {
        border-color: rgb(var(--c-neon) / 0.45);
        background: rgb(var(--c-neon) / 0.12);
        color: rgb(var(--c-neon-soft));
    }

    .social:hover {
        border-color: rgb(var(--c-neon) / 0.7);
        background: rgb(var(--c-neon) / 0.18);
        box-shadow: 0 0 20px rgb(var(--c-neon) / 0.25);
        color: rgb(var(--c-neon-soft));
        transform: translateY(-3px);
    }

    .social:focus-visible,
    .cta:focus-visible {
        outline: 2px solid rgb(var(--c-neon-soft));
        outline-offset: 2px;
    }

    .cta {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 14px 32px;
        border: 1px solid rgb(var(--c-neon) / 0.35);
        border-radius: 12px;
        background: linear-gradient(135deg, rgb(var(--c-neon) / 0.15), rgb(var(--c-neon-soft) / 0.1));
        box-shadow: 0 0 24px rgb(var(--c-neon) / 0.12);
        text-decoration: none;
        transition: all 0.25s ease;
    }

    .cta:hover {
        border-color: rgb(var(--c-neon) / 0.6);
        background: linear-gradient(135deg, rgb(var(--c-neon) / 0.25), rgb(var(--c-neon-soft) / 0.15));
        box-shadow: 0 0 40px rgb(var(--c-neon) / 0.25);
        transform: translateY(-2px);
    }

    .cta-icon {
        display: flex;
        color: rgb(var(--c-neon-soft));
        filter: drop-shadow(0 0 6px rgb(var(--c-neon) / 0.6));
    }

    .cta-text {
        color: rgb(var(--c-text-primary));
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.03em;
    }

    .bottom {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding-top: 16px;
        border-top: 1px solid rgb(var(--c-neon) / 0.08);
    }

    .copyright {
        color: rgb(var(--c-text-secondary) / 0.5);
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: none;
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .nickname {
            font-size: 1.3rem;
        }
    }
</style>
