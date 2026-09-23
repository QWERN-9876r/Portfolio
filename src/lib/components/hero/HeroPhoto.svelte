<script lang="ts">
    import { createSpring } from '$lib/motion'

    let { alt, initials }: { alt: string; initials: string } = $props()

    // Размер фото по брейкпоинтам: xs 200, sm 250, md 300.
    // Внешний контейнер в 1.32 раза больше, чтобы кольца не обрезались
    const PHOTO_SIZES = '(min-width: 900px) 300px, (min-width: 600px) 250px, 200px'
    const srcSet = (ext: string) => [300, 400, 600].map((w) => `/img/photo-${w}.${ext} ${w}w`).join(', ')

    const spring = { stiffness: 80, damping: 20, mass: 0.8 }
    const rotateX = createSpring(spring)
    const rotateY = createSpring(spring)

    let failed = $state(false)

    const handleMouseMove = (event: MouseEvent & { currentTarget: HTMLDivElement }) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        rotateX.target = -y * 12
        rotateY.target = x * 12
    }

    const handleMouseLeave = () => {
        rotateX.target = 0
        rotateY.target = 0
    }
</script>

<div class="photo" role="presentation" onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
    <div class="tilt" style:transform="rotateX({rotateX.current}deg) rotateY({rotateY.current}deg)">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="glow"></div>

        <div class="frame">
            {#if failed}
                <div class="fallback">{initials}</div>
            {:else}
                <picture>
                    <source type="image/avif" srcset={srcSet('avif')} sizes={PHOTO_SIZES} />
                    <source type="image/webp" srcset={srcSet('webp')} sizes={PHOTO_SIZES} />
                    <img
                        src="/img/photo-600.jpg"
                        {alt}
                        width="600"
                        height="600"
                        fetchpriority="high"
                        onerror={() => (failed = true)}
                    />
                </picture>
            {/if}
        </div>
    </div>
</div>

<style>
    .photo {
        --size: 200px;
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: calc(var(--size) * 1.32);
        height: calc(var(--size) * 1.32);
        perspective: 800px;
    }

    @media (min-width: 600px) {
        .photo {
            --size: 250px;
        }
    }

    @media (min-width: 900px) {
        .photo {
            --size: 300px;
        }
    }

    .tilt {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
    }

    .ring {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: spin linear infinite;
    }

    .ring-1 {
        width: 75%;
        height: 75%;
        border: 1px dashed rgb(var(--c-neon) / 0.35);
        animation-duration: 18s;
    }

    .ring-2 {
        width: 82%;
        height: 82%;
        border: 1px solid rgb(var(--c-neon) / 0.15);
        animation-duration: 28s;
        animation-direction: reverse;
    }

    .ring-3 {
        width: 92%;
        height: 92%;
        border: 1px solid rgb(var(--c-neon) / 0.07);
        animation-duration: 45s;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .glow {
        position: absolute;
        width: calc(90% / 1.32);
        height: calc(90% / 1.32);
        border-radius: 50%;
        background: radial-gradient(circle, rgb(var(--c-neon) / 0.18) 0%, transparent 70%);
        filter: blur(20px);
        pointer-events: none;
    }

    .frame {
        position: relative;
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: calc(100% / 1.32);
        height: calc(100% / 1.32);
        overflow: hidden;
        border: 2px solid rgb(var(--c-neon) / 0.5);
        border-radius: 50%;
        box-shadow:
            0 0 0 4px rgb(var(--c-bg-deep) / 0.8),
            0 0 40px rgb(var(--c-neon) / 0.25),
            inset 0 0 40px rgb(var(--c-bg-deep) / 0.3);
    }

    picture {
        display: contents;
    }

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: linear-gradient(135deg, rgb(var(--c-bg-elevated)), rgb(var(--c-neon) / 0.2));
    }

    .fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgb(var(--c-bg-elevated)), rgb(var(--c-neon) / 0.15));
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-display);
        font-size: 2.5rem;
    }
</style>
