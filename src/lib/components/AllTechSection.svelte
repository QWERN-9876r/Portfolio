<script lang="ts">
    import { reveal } from '$lib/attachments/reveal'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import Tooltip from '$lib/components/Tooltip.svelte'
    import type { Tech } from '$lib/content'
    import type { Translation } from '$lib/i18n/translations'
    import { glowPrism } from '$lib/three/prismGlow.svelte'

    let { t, technologies }: { t: Translation; technologies: Tech[] } = $props()

    let failedIcons = $state<Record<string, boolean>>({})

    const delay = (index: number) => `${0.2 + index * 0.045}s`
</script>

<section id="all-tech" class="snap-section" {@attach reveal('-10%')}>
    <div class="section-content stack">
        <div class="reveal heading">
            <SectionIndex index={10} />
            <h2 class="h2 title">{t.sections.technologies}</h2>
            <p class="body2 hint">{t.sections.technologiesHint}</p>
        </div>

        <div class="grid">
            {#each technologies as tech, index (tech.name)}
                <div class="reveal cell" style:--delay={delay(index)}>
                    <Tooltip label={tech.name} block>
                        <a
                            class="tile"
                            href={tech.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="{t.allTech.openSite} {tech.name}"
                            {@attach glowPrism()}
                        >
                            <span class="icon">
                                {#if failedIcons[tech.name]}
                                    <span class="fallback">{tech.name[0]}</span>
                                {:else}
                                    <img
                                        src={tech.icon}
                                        alt=""
                                        loading="lazy"
                                        onerror={() => (failedIcons[tech.name] = true)}
                                    />
                                {/if}
                            </span>
                        </a>
                    </Tooltip>
                </div>
            {/each}
        </div>
    </div>
</section>

<style>
    .stack {
        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .heading {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .title {
        color: rgb(var(--c-text-primary));
    }

    .hint {
        max-width: 480px;
        margin-top: 4px;
        color: rgb(var(--c-text-secondary));
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
    }

    .cell {
        --from: translateY(20px) scale(0.5);
        --blur: 6px;
        --duration: 0.45s;
        --ease: var(--ease-overshoot);
    }

    .tile {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        aspect-ratio: 1 / 1;
        padding: 12px;
        border: 1px solid rgb(var(--c-neon) / 0.08);
        border-radius: 16px;
        background: rgb(var(--c-bg-elevated) / 0.3);
        color: white;
        outline: none;
        transition: all 0.2s ease;
    }

    .tile:hover,
    .tile:global([data-lit]) {
        border-color: rgb(var(--c-neon) / 0.5);
        background: rgb(var(--c-neon) / 0.08);
        box-shadow:
            0 0 20px rgb(var(--c-neon) / 0.15),
            0 4px 16px rgb(var(--c-bg-deep) / 0.3);
    }

    .tile:focus-visible {
        border-color: rgb(var(--c-neon) / 0.7);
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        transition: transform 0.35s var(--ease-overshoot);
    }

    .tile:hover .icon,
    .tile:global([data-lit]) .icon {
        transform: translateY(-3px) scale(1.15);
    }

    img,
    .fallback {
        width: 32px;
        height: 32px;
        transition: filter 0.2s ease;
    }

    img {
        display: block;
        object-fit: contain;
    }

    .fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1rem;
    }

    .tile:hover img,
    .tile:global([data-lit]) img {
        filter: drop-shadow(0 0 6px rgb(var(--c-neon) / 0.6));
    }

    .tile:hover .fallback,
    .tile:global([data-lit]) .fallback {
        filter: drop-shadow(0 0 8px rgb(var(--c-neon) / 0.7));
    }

    @media (min-width: 600px) {
        .grid {
            grid-template-columns: repeat(6, 1fr);
        }
    }

    @media (min-width: 900px) {
        .stack {
            gap: 40px;
        }

        .grid {
            grid-template-columns: repeat(8, 1fr);
            gap: 20px;
        }

        .tile {
            padding: 16px;
        }

        img,
        .fallback {
            width: 40px;
            height: 40px;
        }

        .fallback {
            font-size: 1.2rem;
        }
    }

    @media (min-width: 1200px) {
        .grid {
            grid-template-columns: repeat(10, 1fr);
        }
    }
</style>
