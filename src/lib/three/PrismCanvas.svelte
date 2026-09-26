<script lang="ts">
    import { Canvas } from '@threlte/core'
    import { WebGLRenderer } from 'three'
    import type { Role } from '$lib/role'
    import type { FrontLayout } from './prism'
    import PrismScene from './PrismScene.svelte'

    let props: {
        reducedMotion: boolean
        role: Role
        frontCanvas: HTMLCanvasElement
        strikes: number
        onlayout: (layout: FrontLayout) => void
        onattop: (atTop: boolean) => void
    } = $props()

    const createRenderer = (canvas: HTMLCanvasElement) =>
        new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
</script>

<Canvas {createRenderer} dpr={[1, 1.5]} renderMode="on-demand">
    <PrismScene {...props} />
</Canvas>
