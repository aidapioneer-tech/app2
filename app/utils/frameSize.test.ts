import { describe, it, expect } from 'vitest'
import { computeFrameSize, HEIGHT_BUFFER_PERCENT } from './frameSize'

describe('computeFrameSize', () => {
  it('высота = ceil(scrollHeight +10%), ширина = вьюпорт (без float-артефакта)', () => {
    // 100 × 1.1 в JS = 110.00000000000001 → наивный ceil дал бы 111; целочисленно — 110
    expect(computeFrameSize({ scrollWidth: 300, scrollHeight: 100 }, 800)).toEqual({ width: 800, height: 110 })
  })

  it('округляет высоту вверх (ceil)', () => {
    // 91 × 110 / 100 = 100.1 → 101
    expect(computeFrameSize({ scrollWidth: 300, scrollHeight: 91 }, 800)).toEqual({ width: 800, height: 101 })
  })

  it('большой контент', () => {
    expect(computeFrameSize({ scrollWidth: 300, scrollHeight: 5000 }, 1280)).toEqual({ width: 1280, height: 5500 })
  })

  it('viewportWidth = 0 → фолбэк на scrollWidth элемента', () => {
    expect(computeFrameSize({ scrollWidth: 600, scrollHeight: 200 }, 0)).toEqual({ width: 600, height: 220 })
  })

  it('scrollHeight = 0 → null (нет валидной высоты)', () => {
    expect(computeFrameSize({ scrollWidth: 300, scrollHeight: 0 }, 800)).toBeNull()
  })

  it('нет ни вьюпорта, ни ширины элемента → null', () => {
    expect(computeFrameSize({ scrollWidth: 0, scrollHeight: 200 }, 0)).toBeNull()
  })

  it('HEIGHT_BUFFER_PERCENT = 10 (контракт)', () => {
    expect(HEIGHT_BUFFER_PERCENT).toBe(10)
  })
})
