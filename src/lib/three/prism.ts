import {
    AddEquation,
    BoxGeometry,
    CustomBlending,
    DoubleSide,
    Mesh,
    OneFactor,
    PlaneGeometry,
    ShaderMaterial,
    Vector2,
    Vector3,
    Vector4,
} from 'three'
import {
    cubeFragmentShader,
    cubeVertexShader,
    haloFragmentShader,
    haloVertexShader,
    pointerFragmentShader,
    pointerVertexShader,
} from './beam.glsl'

export type Rgb = readonly [number, number, number]

// Где стоит передний canvas с кубом, в CSS-пикселях окна
export interface FrontLayout {
    left: number
    top: number
    size: number
}

// Наклон к зрителю — видна верхняя грань, поворот — две боковые
const TILT = 0.42
const TURN = 0.6
// Ореол в несколько раз шире куба; при свечении куб чуть «вздыхает»
const HALO_SCALE = 5
const GLOW_PULSE = 0.08
// Запас вокруг луча к технологии под его свечение, px
const POINTER_MARGIN = 60

// Свет складывается с тем, что уже нарисовано; цвет premultiplied, поэтому ONE/ONE
const additive = {
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
} as const

// Камеры нет: вершинные шейдеры проецируют сами, отсечение по фрустуму тут неверно
const pixelMesh = <T extends Mesh>(mesh: T) => {
    mesh.frustumCulled = false
    return mesh
}

export interface CubeState {
    appear: number
    light: number
    tint: Rgb
    progress: number
    litAll: number
    pulse: number
    turn: number
    tilt: number
}

// Куб на своём маленьком canvas поверх контента
export const createCube = () => {
    const uniforms = {
        uSize: { value: new Vector2(1, 1) },
        uAppear: { value: 0 },
        uLight: { value: 0 },
        uTint: { value: new Vector3() },
        uProgress: { value: 0 },
        uLitAll: { value: 0 },
    }
    const material = new ShaderMaterial({
        vertexShader: cubeVertexShader,
        fragmentShader: cubeFragmentShader,
        uniforms,
        side: DoubleSide,
        ...additive,
    })
    const mesh = pixelMesh(new Mesh(new BoxGeometry(1, 1, 1), material))
    let edge = 1

    return {
        mesh,
        setLayout(canvasSize: number, edgeSize: number) {
            edge = edgeSize
            uniforms.uSize.value.set(canvasSize, canvasSize)
            mesh.position.set(canvasSize / 2, canvasSize / 2, 0)
        },
        update({ appear, light, tint, progress, litAll, pulse, turn, tilt }: CubeState) {
            uniforms.uAppear.value = appear
            uniforms.uLight.value = light
            uniforms.uTint.value.set(...tint)
            uniforms.uProgress.value = progress
            uniforms.uLitAll.value = litAll
            mesh.scale.setScalar(edge * (1 + GLOW_PULSE * pulse))
            mesh.rotation.set(TILT + tilt, TURN + turn, 0)
        },
        dispose() {
            mesh.geometry.dispose()
            material.dispose()
        },
    }
}

// Ореол вокруг призмы — на фоне, под контентом
export const createHalo = (size: { value: Vector2 }) => {
    const uniforms = {
        uSize: size,
        uGlow: { value: 0 },
        uColor: { value: new Vector3() },
    }
    const material = new ShaderMaterial({
        vertexShader: haloVertexShader,
        fragmentShader: haloFragmentShader,
        uniforms,
        ...additive,
    })
    const mesh = pixelMesh(new Mesh(new PlaneGeometry(1, 1), material))
    mesh.visible = false

    return {
        mesh,
        setLayout(x: number, y: number, edge: number) {
            mesh.position.set(x, y, 0)
            mesh.scale.setScalar(edge * HALO_SCALE)
        },
        update(glow: number, color: Rgb) {
            uniforms.uGlow.value = glow
            uniforms.uColor.value.set(...color)
            // Погасший ореол не рисуем вовсе
            mesh.visible = glow > 0
        },
        dispose() {
            mesh.geometry.dispose()
            material.dispose()
        },
    }
}

// Луч от призмы к технологии под курсором — на фоне, уходит «в» иконку за карточкой
export const createPointerRay = (size: { value: Vector2 }, dpr: { value: number }) => {
    const uniforms = {
        uSize: size,
        uDpr: dpr,
        uRect: { value: new Vector4() },
        uFrom: { value: new Vector2() },
        uTo: { value: new Vector2() },
        uColor: { value: new Vector3() },
        uStrength: { value: 0 },
    }
    const material = new ShaderMaterial({
        vertexShader: pointerVertexShader,
        fragmentShader: pointerFragmentShader,
        uniforms,
        ...additive,
    })
    const mesh = pixelMesh(new Mesh(new PlaneGeometry(1, 1), material))
    mesh.visible = false

    return {
        mesh,
        update(from: Vector2, to: Vector2, strength: number, color: Rgb) {
            uniforms.uFrom.value.copy(from)
            uniforms.uTo.value.copy(to)
            uniforms.uStrength.value = strength
            uniforms.uColor.value.set(...color)
            uniforms.uRect.value.set(
                Math.min(from.x, to.x) - POINTER_MARGIN,
                Math.min(from.y, to.y) - POINTER_MARGIN,
                Math.max(from.x, to.x) + POINTER_MARGIN,
                Math.max(from.y, to.y) + POINTER_MARGIN,
            )
            mesh.visible = strength > 0
        },
        dispose() {
            mesh.geometry.dispose()
            material.dispose()
        },
    }
}
