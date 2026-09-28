<script lang="ts">
    // Палец онбординга: подъезжает кончиком к точке (x, y), с каждым taps — «нажимает».
    // tap: false — на компьютере палец только наводится, без нажатия.
    // glide — палец ведут по кадрам из кода, поэтому без собственной анимации переезда
    let {
        x,
        y,
        shown,
        taps,
        tap,
        glide = false,
    }: { x: number; y: number; shown: boolean; taps: number; tap: boolean; glide?: boolean } = $props()
</script>

<div class="finger" class:shown class:glide style:--x="{x}px" style:--y="{y}px" aria-hidden="true">
    {#key taps}
        <span class="hand" class:press={tap && taps > 0}>
            <!-- pan_tool_alt из Material Icons (Apache 2.0) -->
            <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
                <path
                    d="m19.98 14.82-.63 4.46c-.14.99-.99 1.72-1.98 1.72h-6.16c-.53 0-1.29-.21-1.66-.59L5 15.62l.83-.84c.24-.24.58-.35.92-.28l3.25.74V4.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v6h.91c.31 0 .62.07.89.21l4.09 2.04c.77.39 1.21 1.22 1.09 2.07z"
                />
            </svg>
        </span>
        {#if tap && taps > 0}
            <span class="ripple"></span>
        {/if}
    {/key}
</div>

<style>
    /* Кончик пальца в иконке — (11.5, 3) из 24, при 44px это (21, 5.5): совмещаем его с точкой.
       Пока палец скрыт, переставляем без анимации, чтобы он не выезжал из угла секции */
    .finger {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 5;
        color: #fff;
        opacity: 0;
        filter: drop-shadow(0 4px 10px rgb(var(--c-bg-deep) / 0.7)) drop-shadow(0 0 8px rgb(var(--c-neon) / 0.6));
        pointer-events: none;
        transform: translate(calc(var(--x) - 21px), calc(var(--y) - 5.5px));
        transition: opacity 0.3s ease;
    }

    .finger.shown {
        opacity: 1;
        transition:
            opacity 0.3s ease,
            transform 0.7s cubic-bezier(0.45, 0, 0.25, 1);
    }

    .finger.shown.glide {
        transition: opacity 0.3s ease;
    }

    .hand {
        display: block;
        transform-origin: 21px 5.5px;
    }

    .press {
        animation: press 0.35s ease;
    }

    @keyframes press {
        40% {
            transform: scale(0.85);
        }
    }

    .ripple {
        position: absolute;
        top: 5.5px;
        left: 21px;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border: 2px solid rgb(var(--c-neon-soft));
        border-radius: 50%;
        opacity: 0;
        animation: ripple 0.6s ease-out 0.1s;
    }

    @keyframes ripple {
        from {
            opacity: 1;
            transform: scale(0.2);
        }
        to {
            opacity: 0;
            transform: scale(1.4);
        }
    }
</style>
