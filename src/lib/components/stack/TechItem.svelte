<script lang="ts">
    import { iconUrl, type TechGroupItem } from '$lib/content'
    import { createSpring } from '$lib/motion'
    import { glowPrism } from '$lib/three/prismGlow.svelte'

    // onglow — технология зажглась или погасла: наведением, касанием или в онбординге
    let {
        item,
        index,
        onglow,
    }: { item: TechGroupItem; index: number; onglow: (lit: boolean) => void } = $props()

    // Магнитный эффект и 3D-наклон иконки — пружины с параметрами из framer-motion
    const spring = { stiffness: 200, damping: 18, mass: 0.6 }
    const x = createSpring(spring)
    const y = createSpring(spring)
    const rotateX = createSpring(spring)
    const rotateY = createSpring(spring)

    const MAGNET_PX = 18
    const MAX_TILT = 12
    // Наклон считается от смещения в px, как в исходной версии, поэтому почти сразу упирается в ±12°
    const tilt = (offset: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, offset * 2 * MAX_TILT))

    let failed = $state(false)

    const handleMouseMove = (event: MouseEvent & { currentTarget: HTMLDivElement }) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * MAGNET_PX
        const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * MAGNET_PX
        x.target = offsetX
        y.target = offsetY
        rotateX.target = -tilt(offsetY)
        rotateY.target = tilt(offsetX)
    }

    const handleMouseLeave = () => {
        x.target = 0
        y.target = 0
        rotateX.target = 0
        rotateY.target = 0
    }
</script>

<div
    class="reveal item"
    style:--delay="{index * 0.08}s"
    role="presentation"
    data-tech={item.name}
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
    {@attach glowPrism({ onchange: (lit) => onglow(lit) })}
>
    <div class="card">
        <div
            class="icon-wrap"
            style:transform="translate({x.current}px, {y.current}px) rotateX({rotateX.current}deg) rotateY({rotateY.current}deg)"
        >
            <div class="icon">
                {#if failed}
                    <span class="fallback">{item.name[0]}</span>
                {:else}
                    <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" onerror={() => (failed = true)} />
                {/if}
            </div>
        </div>

        <div class="text">
            <h3 class="h5 name">{item.name}</h3>
            {#if item.note}
                <p class="body2 note">{item.note}</p>
            {/if}
        </div>
    </div>
</div>

<style>
    .item {
        --from: translateY(30px);
        --blur: 6px;
        --duration: 0.55s;
        perspective: 600px;
    }

    .card {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        padding: 16px;
        border: 1px solid rgb(var(--c-neon) / 0.1);
        border-radius: 14px;
        background: transparent;
        cursor: default;
        transition: all 0.25s ease;
    }

    .item:hover .card,
    .item:global([data-lit]) .card {
        border-color: rgb(var(--c-neon) / 0.45);
        background: rgb(var(--c-neon) / 0.06);
        box-shadow: 0 0 24px rgb(var(--c-neon) / 0.1);
    }

    .icon-wrap {
        flex-shrink: 0;
        transform-style: preserve-3d;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        overflow: hidden;
        border: 1px solid rgb(var(--c-neon) / 0.2);
        border-radius: 14px;
        background: rgb(var(--c-bg-elevated) / 0.8);
        transition: box-shadow 0.25s ease;
    }

    .item:hover .icon,
    .item:global([data-lit]) .icon {
        box-shadow:
            0 0 20px rgb(var(--c-neon) / 0.25),
            0 0 40px rgb(var(--c-neon) / 0.1);
    }

    img {
        width: 36px;
        height: 36px;
        object-fit: contain;
        transition: filter 0.25s ease;
    }

    .item:hover img,
    .item:global([data-lit]) img {
        filter: drop-shadow(0 0 6px rgb(var(--c-neon) / 0.6));
    }

    .fallback {
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 1.4rem;
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 4px;
    }

    .name {
        color: rgb(var(--c-text-primary) / 0.85);
        font-weight: 700;
        transition: color 0.2s ease;
    }

    .item:hover .name,
    .item:global([data-lit]) .name {
        color: rgb(var(--c-text-primary));
    }

    .note {
        color: rgb(var(--c-text-secondary));
        font-size: 0.8rem;
        line-height: 1.5;
    }

    @media (min-width: 900px) {
        .card {
            padding: 20px;
        }
    }
</style>
