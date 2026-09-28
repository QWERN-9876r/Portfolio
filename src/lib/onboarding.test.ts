import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runOnboarding, wait } from './onboarding'

// Сцену с призмой не грузим: от неё нужна только подписка на свечение от посетителя
const glow = vi.hoisted(() => ({ listeners: new Set<() => void>() }))
vi.mock('$lib/three/prismGlow.svelte', () => ({
    onUserGlow: (listener: () => void) => {
        glow.listeners.add(listener)
        return () => glow.listeners.delete(listener)
    },
}))
const userGlows = () => glow.listeners.forEach((listener) => listener())

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    glow.listeners.clear()
})

describe('wait', () => {
    it('ждёт заданное время', async () => {
        const done = vi.fn()
        wait(1000, new AbortController().signal).then(done)

        await vi.advanceTimersByTimeAsync(999)
        expect(done).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1)
        expect(done).toHaveBeenCalled()
    })

    it('обрывается вместе со сценарием и не оставляет таймер', async () => {
        const controller = new AbortController()
        const paused = wait(1000, controller.signal)
        controller.abort('ушли с секции')

        await expect(paused).rejects.toBe('ушли с секции')
        expect(vi.getTimerCount()).toBe(0)
    })

    it('уже оборванный сценарий дальше не идёт', async () => {
        await expect(wait(1000, AbortSignal.abort('поздно'))).rejects.toBe('поздно')
    })
})

describe('runOnboarding', () => {
    // Сценарий из двух шагов: что успело выполниться
    const script = (steps: string[]) => async (signal: AbortSignal) => {
        steps.push('палец на первую')
        await wait(3000, signal)
        steps.push('палец на вторую')
    }

    it('доигрывает сценарий и отписывается от свечения', async () => {
        const steps: string[] = []
        runOnboarding(script(steps))

        await vi.runAllTimersAsync()
        expect(steps).toEqual(['палец на первую', 'палец на вторую'])
        expect(glow.listeners.size).toBe(0)
    })

    it('посетитель сам зажёг технологию — подсказка больше не нужна', async () => {
        const steps: string[] = []
        runOnboarding(script(steps))

        userGlows()
        await vi.runAllTimersAsync()
        expect(steps).toEqual(['палец на первую'])
        expect(glow.listeners.size).toBe(0)
    })

    it('секция ушла с экрана — сценарий обрывается без предупреждений', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const steps: string[] = []
        const stop = runOnboarding(script(steps))

        stop()
        await vi.runAllTimersAsync()
        expect(steps).toEqual(['палец на первую'])
        expect(warn).not.toHaveBeenCalled()
    })

    it('настоящая ошибка сценария не глотается молча', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        runOnboarding(async () => {
            throw new Error('нет элемента')
        })

        await vi.runAllTimersAsync()
        expect(warn).toHaveBeenCalledWith('Onboarding error:', new Error('нет элемента'))
    })
})
