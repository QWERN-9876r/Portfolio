<script lang="ts">
    import { intersect } from '$lib/attachments/reveal'
    import { nextFrame } from '$lib/pageMetrics'

    // Число досчитывается, когда появляется на экране, и при каждой смене значения.
    // В HTML сразу итоговое значение: его читают поисковики и скринридеры
    let { value, delay = 0 }: { value: string; delay?: number } = $props()

    const DURATION = 1200

    // «+32.5%» → «+», 32.5, «%»; знаки после запятой и разделитель — как в исходной строке
    const NUMBER = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/s
    const parse = (text: string) => {
        const match = NUMBER.exec(text)
        if (!match) return null
        const [, prefix, digits, suffix] = match
        const separator = digits.includes(',') ? ',' : '.'
        const decimals = digits.split(separator)[1]?.length ?? 0
        const format = (number: number) => prefix + number.toFixed(decimals).replace('.', separator) + suffix
        return { number: Number(digits.replace(',', '.')), format }
    }

    // null — показываем value как есть (так и в пререндеренном HTML)
    let shown = $state<string | null>(null)
    let seen = $state(false)
    // Число на экране — отсюда стартует следующий отсчёт
    let current = 0
    let counted = false

    $effect(() => {
        const target = parse(value)
        if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) {
            shown = null
            if (target) current = target.number
            return
        }
        if (!seen) {
            shown = target.format(current)
            return
        }

        const from = current
        let start = 0
        let frame = 0
        const step = (time: number) => {
            start ||= time
            const progress = Math.min((time - start) / DURATION, 1)
            current = from + (target.number - from) * (1 - (1 - progress) ** 3)
            shown = progress < 1 ? target.format(current) : null
            if (progress < 1) frame = nextFrame(step)
        }
        const timer = setTimeout(() => (frame = nextFrame(step)), counted ? 0 : delay * 1000)
        counted = true

        return () => {
            clearTimeout(timer)
            cancelAnimationFrame(frame)
        }
    })
</script>

<!-- Итоговое значение прозрачное: держит ширину и остаётся текстом страницы,
     видимые цифры поверх него -->
<span class="count" {@attach intersect((visible) => visible && (seen = true), () => ({ rootMargin: '-10%' }))}>
    <span class="final">{value}</span>
    <span class="live" aria-hidden="true">{shown ?? value}</span>
</span>

<style>
    .count {
        display: inline-grid;
    }

    .count > span {
        grid-area: 1 / 1;
    }

    .final {
        color: transparent;
        text-shadow: none;
    }
</style>
