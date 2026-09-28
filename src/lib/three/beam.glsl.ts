// Фон (луч, ореол, луч к технологии) — в CSS-пикселях окна, начало координат снизу слева.
// Куб — на отдельном маленьком canvas поверх контента, в пикселях этого canvas.
// Все шейдеры проецируют прямо в clip space, камера не нужна

const COMMON = /* glsl */ `
const vec3 WHITE = vec3(0.92, 0.96, 1.0);
// Края спектра после призмы
const vec3 SPECTRUM_COOL = vec3(0.45, 0.78, 1.0);
const vec3 SPECTRUM_WARM = vec3(0.62, 0.45, 1.0);

float segmentDistance(vec2 p, vec2 a, vec2 b, out float along) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    along = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
    return length(pa - ba * along);
}

// Оттенки свечения из основного цвета: ореол ближе к белому, дымка глубже
vec3 innerOf(vec3 c) { return mix(c, WHITE, 0.45); }
vec3 softOf(vec3 c) { return mix(c, WHITE, 0.2); }
vec3 deepOf(vec3 c) { return c * 0.7; }

// Premultiplied alpha: канал не ярче альфы, поверх тёмного фона работает как свечение
vec4 premultiplied(vec3 color) {
    color = clamp(color, 0.0, 1.0);
    return vec4(color, max(color.r, max(color.g, color.b)));
}
`

// Полноэкранный квад: позиции PlaneGeometry(2, 2) уже в clip space
export const vertexShader = /* glsl */ `
void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

// Луч hero: падает сверху на призму в точке uSplit и расщепляется веером
// влево по горизонтали и в правый нижний угол
export const fragmentShader = /* glsl */ `
uniform vec2 uSize;
uniform vec2 uSplit;
uniform float uDpr;
uniform float uFall;
uniform float uSpread;
uniform float uImpactTime;
// Сдвиг случайности искр: у повторного удара они разлетаются иначе, чем в интро
uniform float uSparkSeed;
uniform float uIntensity;
// Насколько луч виден: при прокрутке hero гаснет свечение удара вместе с лучами
uniform float uVisible;
// Цвет роли: при смене волна нового цвета идёт сверху через призму в лучи
uniform vec3 uColorFrom;
uniform vec3 uColorTo;
uniform float uColorWave;

const int SPARKS = 36;
const float SPARK_MAX_LIFE = 1.3;
const float SHOCKWAVE_LIFE = 1.1;
// Расхождение цветных лучей после призмы, радианы
const float DISPERSION = 0.014;
const float WAVE_SOFTNESS = 140.0;
${COMMON}

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

vec2 rotate(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// Слои неона: белое ядро, светлый ореол, основное свечение и широкая дымка
vec3 neon(float d, float strength, float haze, vec3 c) {
    float core = exp(-d * d * 0.35);
    float inner = exp(-d / 5.0);
    float outer = exp(-d / 32.0);
    float wide = exp(-d / 160.0);
    return (WHITE * core + innerOf(c) * inner * 0.6 + c * outer * 0.35 + deepOf(c) * wide * haze) * strength;
}

// Светящаяся точка: яркий центр и мягкий ореол
vec3 glowPoint(vec2 p, vec2 center, float size, vec3 c) {
    float r = length(p - center);
    return (WHITE + innerOf(c)) * exp(-r / size) + softOf(c) * exp(-r / (size * 4.5)) * 0.5;
}

// Луч после призмы: основной цвет в центре и тонкие края спектра по бокам,
// расходятся с расстоянием
vec3 prismRay(vec2 p, vec2 from, vec2 dir, float len, vec3 c) {
    float along;
    float d = segmentDistance(p, from, from + dir * len, along);
    vec3 color = neon(d, mix(1.0, 0.5, along), 0.12, c);

    for (int i = 0; i < 2; i++) {
        float side = i == 0 ? -1.0 : 1.0;
        vec3 tint = mix(c, i == 0 ? SPECTRUM_WARM : SPECTRUM_COOL, 0.6);
        d = segmentDistance(p, from, from + rotate(dir, side * DISPERSION) * len, along);
        color += tint * (exp(-d * d * 0.6) * 0.9 + exp(-d / 5.0) * 0.45) * mix(0.9, 0.35, along);
    }
    return color;
}

// Цвет в точке пути и блик на фронте волны перелива
vec3 beamColor(vec2 p, vec2 top, vec2 split, vec2 edge, vec2 corner, out float glint) {
    glint = 0.0;
    if (uColorWave >= 1.0) return uColorTo;

    float along;
    float verticalLength = top.y - split.y;
    float dVertical = segmentDistance(p, top, split, along);
    float dRays = min(segmentDistance(p, split, edge, along), segmentDistance(p, split, corner, along));
    // Координата вдоль пути: по вертикали от верха, дальше — от призмы по лучам.
    // Между ними смешиваем плавно, иначе в дымке виден шов
    float sVertical = top.y - clamp(p.y, split.y, top.y);
    float sRays = verticalLength + length(p - split);
    float s = mix(sRays, sVertical, smoothstep(-60.0, 60.0, dRays - dVertical));
    float total = verticalLength + max(length(edge - split), length(corner - split));
    float front = uColorWave * (total + WAVE_SOFTNESS);

    glint = exp(-abs(s - front + WAVE_SOFTNESS * 0.5) / 40.0);
    return mix(uColorTo, uColorFrom, smoothstep(front - WAVE_SOFTNESS, front, s));
}

void main() {
    vec2 p = gl_FragCoord.xy / uDpr;
    // Старт чуть выше экрана — у луча не видно «крышки»
    vec2 top = vec2(uSplit.x, uSize.y + 20.0);
    vec2 split = uSplit;
    vec2 corner = vec2(uSize.x, 0.0);
    vec2 edge = vec2(0.0, uSplit.y);

    float glint;
    vec3 c = beamColor(p, top, split, edge, corner, glint);
    float falling = uImpactTime < 0.0 ? 1.0 : 0.0;
    vec3 color = vec3(0.0);
    float along;

    // ── Падающий луч ──
    if (uFall > 0.0) {
        vec2 tip = mix(top, split, uFall);
        float d = segmentDistance(p, top, tip, along);
        // Пока падает — хвост разгорается к голове; дымка гуще у призмы
        float trail = mix(1.0, 0.35 + 1.4 * pow(along, 6.0), falling);
        color += neon(d, trail, 0.08 + 0.2 * along, c);
        color += glowPoint(p, tip, 10.0, c) * 1.2 * falling;
    }

    // ── Удар о призму ──
    if (uImpactTime >= 0.0 && uVisible > 0.0) {
        float t = uImpactTime;
        vec2 q = p - split;
        float r = length(q);
        float flash = exp(-t * 4.0);
        vec3 impact = vec3(0.0);

        // Вспышка и свет внутри призмы
        impact += (WHITE * exp(-r / 18.0) * 1.2 + softOf(c) * exp(-r / 90.0) * 0.8) * flash;
        impact += innerOf(c) * exp(-r / 14.0) * 0.5 + c * exp(-r / 70.0) * 0.35;

        // Анаморфный блик: тонкая горизонтальная полоса через точку удара.
        // В статике почти гаснет, иначе справа от удара читается как третья ветка
        impact += innerOf(c) * exp(-abs(q.y) / 1.8) * exp(-abs(q.x) / 220.0) * (0.08 + 1.1 * flash);

        // Ударная волна: сплюснутое кольцо, как будто свет ударил в пол
        if (t < SHOCKWAVE_LIFE) {
            float radius = 20.0 + 520.0 * (1.0 - exp(-t * 3.5));
            float ring = exp(-abs(length(q * vec2(1.0, 2.8)) - radius) / 6.0);
            impact += (softOf(c) * 0.9 + WHITE * 0.2) * ring * (1.0 - t / SHOCKWAVE_LIFE);
        }

        // Искры: вылетают вверх и в стороны, падают под действием гравитации
        if (t < SPARK_MAX_LIFE && r < 700.0) {
            for (int i = 0; i < SPARKS; i++) {
                float seed = float(i) + uSparkSeed;
                float life = mix(0.6, SPARK_MAX_LIFE, hash(seed * 1.3));
                float age = t / life;
                if (age >= 1.0) continue;

                float angle = mix(0.15, 3.0, hash(seed * 3.1));
                float speed = mix(220.0, 640.0, hash(seed * 7.7));
                vec2 dir = vec2(cos(angle), sin(angle));
                vec2 pos = split + dir * speed * t + vec2(0.0, -420.0) * t * t;
                vec2 velocity = dir * speed + vec2(0.0, -840.0) * t;

                // Хвост вдоль скорости, ярче к голове искры
                float d = segmentDistance(p, pos - velocity * 0.05, pos, along);
                float fade = (1.0 - age) * (1.0 - age);
                impact += (WHITE * exp(-d * d * 0.5) * 1.6 + innerOf(c) * exp(-d / 5.0) * 0.9) * fade * along;
            }
        }

        color += impact * uVisible;
    }

    // ── Лучи после призмы ──
    if (uSpread > 0.0) {
        vec2 toEdge = edge - split;
        vec2 toCorner = corner - split;
        // С запасом за край экрана, чтобы крайние лучи веера тоже уходили за границу
        color += prismRay(p, split, normalize(toEdge), length(toEdge) * 1.15 * uSpread, c);
        color += prismRay(p, split, normalize(toCorner), length(toCorner) * 1.4 * uSpread, c);

        // Бегущие огоньки на концах лучей гаснут к концу растекания
        float racing = 1.0 - uSpread;
        color += (glowPoint(p, split + toEdge * uSpread, 9.0, c) + glowPoint(p, split + toCorner * uSpread, 9.0, c)) * racing;

        // Отсвет «на полу» под горизонтальным лучом
        float below = split.y - p.y;
        if (below > 0.0) {
            float reachX = split.x + toEdge.x * uSpread;
            float underRay = smoothstep(reachX - 60.0, reachX + 120.0, p.x)
                * (1.0 - smoothstep(split.x - 40.0, split.x + 80.0, p.x));
            color += deepOf(c) * exp(-below / 70.0) * 0.22 * underRay * uSpread;
        }
    }

    color *= uIntensity * (1.0 + 0.8 * glint);
    // Дизеринг против полос в широких градиентах
    color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;

    gl_FragColor = premultiplied(color);
}
`

// Меши с modelMatrix в пикселях своего canvas — сразу в clip space
const PIXEL_PROJECTION = /* glsl */ `
vec4 toClip(vec3 local) {
    vec4 world = modelMatrix * vec4(local, 1.0);
    return vec4(world.xy / uSize * 2.0 - 1.0, 0.0, 1.0);
}
`

// ── Призма (передний план) ──

export const cubeVertexShader = /* glsl */ `
uniform vec2 uSize;
varying vec3 vObjPos;
varying vec3 vNormal;
${PIXEL_PROJECTION}

void main() {
    vObjPos = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = toClip(position);
}
`

export const cubeFragmentShader = /* glsl */ `
uniform float uAppear;
uniform float uLight;
uniform vec3 uTint;
// Сколько рёбер горит: 0..12, дробная часть — заполненность текущего ребра
uniform float uProgress;
// В hero куб целиком освещён лучом
uniform float uLitAll;
varying vec3 vObjPos;
varying vec3 vNormal;
${COMMON}

// Номер ребра в порядке «свет наполняет призму сверху»: 0–3 — верхняя грань
// по периметру, 4–7 — вертикали сверху вниз, 8–11 — нижняя грань.
// t — положение вдоль ребра в направлении заливки
float edgeIndex(vec3 q, vec3 a, out float t) {
    if (a.x <= a.y && a.x <= a.z) {
        float x = q.x + 0.5;
        if (q.y > 0.0) {
            if (q.z < 0.0) { t = x; return 0.0; }
            t = 1.0 - x; return 2.0;
        }
        if (q.z < 0.0) { t = x; return 8.0; }
        t = 1.0 - x; return 10.0;
    }
    if (a.z <= a.x && a.z <= a.y) {
        float z = q.z + 0.5;
        if (q.y > 0.0) {
            if (q.x > 0.0) { t = z; return 1.0; }
            t = 1.0 - z; return 3.0;
        }
        if (q.x > 0.0) { t = z; return 9.0; }
        t = 1.0 - z; return 11.0;
    }
    t = 0.5 - q.y;
    if (q.x > 0.0) return q.z < 0.0 ? 4.0 : 5.0;
    return q.z > 0.0 ? 6.0 : 7.0;
}

void main() {
    // На поверхности одна координата на грани (1), расстояние до ребра — по второй по величине
    vec3 a = abs(vObjPos) * 2.0;
    float second = a.x + a.y + a.z - max(a.x, max(a.y, a.z)) - min(a.x, min(a.y, a.z));
    float edgeDistance = 1.0 - second;
    float edge = exp(-edgeDistance / 0.04);
    float edgeGlow = exp(-edgeDistance / 0.2);

    float t;
    float index = edgeIndex(vObjPos, a, t);
    float fill = clamp(uProgress - index, 0.0, 1.0);
    float lit = max(smoothstep(t, t + 0.04, fill), uLitAll);

    // Стекло: грани под углом к зрителю светлее, с отливом к краю спектра
    float fresnel = pow(1.0 - abs(normalize(vNormal).z), 2.0);
    vec3 glass = mix(uTint * 0.08, mix(uTint, SPECTRUM_WARM, vObjPos.y + 0.5) * 0.22, fresnel);

    // Незажжённые рёбра — тусклый каркас, зажжённые — яркие с цветным ореолом
    vec3 color = WHITE * edge * mix(0.25, 1.15, lit)
        + innerOf(uTint) * edgeGlow * mix(0.06, 0.55, lit)
        + glass;
    // Задние грани видны сквозь стекло, но тусклее
    color *= (gl_FrontFacing ? 1.0 : 0.4) * uAppear * uLight;

    gl_FragColor = premultiplied(color);
}
`

// ── Ореол вокруг призмы (фон) ──

export const haloVertexShader = /* glsl */ `
uniform vec2 uSize;
varying vec2 vUv;
${PIXEL_PROJECTION}

void main() {
    vUv = uv;
    gl_Position = toClip(position);
}
`

export const haloFragmentShader = /* glsl */ `
uniform float uGlow;
uniform vec3 uColor;
varying vec2 vUv;
${COMMON}

void main() {
    float r = length(vUv - 0.5) * 2.0;
    // Яркое ядро и широкий мягкий ореол, к краю квада сходят в ноль
    float halo = (exp(-r * 4.0) * 0.9 + exp(-r * 1.6) * 0.25) * (1.0 - smoothstep(0.75, 1.0, r));
    vec3 color = (innerOf(uColor) * 0.55 + uColor * 0.45) * halo * uGlow;

    gl_FragColor = premultiplied(color);
}
`

// ── Луч от призмы к технологии (фон) ──

// Квад растягивается только на bbox отрезка с запасом под свечение
export const pointerVertexShader = /* glsl */ `
uniform vec2 uSize;
uniform vec4 uRect;

void main() {
    vec2 pixel = mix(uRect.xy, uRect.zw, position.xy + 0.5);
    gl_Position = vec4(pixel / uSize * 2.0 - 1.0, 0.0, 1.0);
}
`

export const pointerFragmentShader = /* glsl */ `
uniform float uDpr;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec3 uColor;
uniform float uStrength;
${COMMON}

void main() {
    vec2 p = gl_FragCoord.xy / uDpr;
    float along;
    float d = segmentDistance(p, uFrom, uTo, along);

    // Луч разгорается к цели, на конце — яркая точка попадания
    vec3 color = (WHITE * exp(-d * d * 0.5) * 0.9
        + innerOf(uColor) * exp(-d / 4.0) * 0.6
        + uColor * exp(-d / 18.0) * 0.35) * mix(0.55, 1.0, along);
    color += (WHITE + uColor) * exp(-length(p - uTo) / 7.0) * 0.8;

    gl_FragColor = premultiplied(color * uStrength);
}
`
