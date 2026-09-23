<script lang="ts">
    import { intersect, reveal } from '$lib/attachments/reveal'
    import SectionIndex from '$lib/components/SectionIndex.svelte'
    import type { TechGroup } from '$lib/content'
    import PixiScene from '$lib/pixi/PixiScene.svelte'
    import TechItem from './TechItem.svelte'

    let { group }: { group: TechGroup } = $props()

    let isVisible = $state(false)
    let activeTech = $state<string | null>(null)
</script>

<section
    id={group.id}
    class="snap-section"
    {@attach reveal()}
    {@attach intersect((visible) => (isVisible = visible), () => ({ threshold: 0.1 }))}
>
    <div class="section-content layout">
        <div class="main">
            <div class="reveal heading">
                <SectionIndex index={group.index} />
                <h2 class="h2 title">{group.title}</h2>
                {#if group.subtitle}
                    <p class="body2 subtitle">{group.subtitle}</p>
                {/if}
            </div>

            <div class="items">
                {#each group.items as item, index (item.name)}
                    <TechItem {item} {index} onhover={(name) => (activeTech = name)} />
                {/each}
            </div>
        </div>

        <div class="reveal scene-wrap">
            <PixiScene preset={group.pixiPreset} {activeTech} {isVisible} />
        </div>
    </div>
</section>

<style>
    section {
        overflow: hidden;
    }

    .layout {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
    }

    .main {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 24px;
        min-width: 0;
    }

    .heading {
        --from: translateX(-30px);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .title {
        color: rgb(var(--c-text-primary));
        line-height: 1.1;
    }

    .subtitle {
        margin-top: 4px;
        color: rgb(var(--c-neon-soft) / 0.6);
        font-style: italic;
        letter-spacing: 0.03em;
    }

    .items {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .scene-wrap {
        --from: translateX(40px);
        --blur: 10px;
        --duration: 0.75s;
        --delay: 0.2s;
        flex-shrink: 0;
    }

    @media (min-width: 900px) {
        .layout {
            flex-direction: row;
            align-items: center;
            gap: 48px;
        }

        .main {
            gap: 32px;
        }
    }
</style>
