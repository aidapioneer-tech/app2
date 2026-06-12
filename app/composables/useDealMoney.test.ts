import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealMoney } from './useDealMoney'

// useDealMoney дергает useB24().get() внутри load() — мокаем модуль целиком,
// чтобы не тянуть b24jssdk-nuxt и рантайм Nuxt. Достаточно метода get().
// vi.mock хойстится vitest'ом выше импортов, поэтому импорт получает мок.
const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))
vi.mock('./useB24', () => ({ useB24: () => ({ get: mockGet }) }))

interface FakeAjax {
  isSuccess: boolean
  getData: () => { result?: unknown } | undefined
  getErrorMessages: () => string[]
}

// Фейковый B24Frame с цепочкой actions.v2.call.make.
function fakeB24(make: ReturnType<typeof vi.fn>) {
  return { actions: { v2: { call: { make } } } }
}

function ajax(opts: Partial<FakeAjax> = {}): FakeAjax {
  return {
    isSuccess: true,
    getData: () => ({ result: { mode: 'client' } }),
    getErrorMessages: () => [],
    ...opts
  }
}

beforeEach(() => {
  mockGet.mockReset()
  // глушим console.error — load() логирует туда детали ошибок.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('useDealMoney.load', () => {
  it('успешный ответ — кладёт result в data, error пуст, loading сброшен', async () => {
    const make = vi.fn().mockResolvedValue(ajax({ getData: () => ({ result: { mode: 'client' } }) }))
    mockGet.mockReturnValue(fakeB24(make))

    const { data, error, loading, load } = useDealMoney()
    await load(129)

    expect(make).toHaveBeenCalledWith({ method: 'shef:reportbuilder.api.dealMoney.get', params: { dealId: 129 } })
    expect(data.value).toEqual({ mode: 'client' })
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('isSuccess=false — error из getErrorMessages, data=null', async () => {
    const make = vi.fn().mockResolvedValue(ajax({ isSuccess: false, getErrorMessages: () => ['Нет доступа', 'ещё'] }))
    mockGet.mockReturnValue(fakeB24(make))

    const { data, error, load } = useDealMoney()
    await load(1)

    expect(error.value).toBe('Нет доступа; ещё')
    expect(data.value).toBeNull()
  })

  it('isSuccess=false без сообщений — фолбэк-текст', async () => {
    const make = vi.fn().mockResolvedValue(ajax({ isSuccess: false, getErrorMessages: () => [] }))
    mockGet.mockReturnValue(fakeB24(make))

    const { error, load } = useDealMoney()
    await load(1)

    expect(error.value).toBe('REST-вызов вернул ошибку')
  })

  it('пустой result (getData=undefined) — ошибка «пустой результат»', async () => {
    const make = vi.fn().mockResolvedValue(ajax({ getData: () => undefined }))
    mockGet.mockReturnValue(fakeB24(make))

    const { data, error, load } = useDealMoney()
    await load(1)

    expect(error.value).toBe('REST вернул пустой результат')
    expect(data.value).toBeNull()
  })

  it('make бросает исключение — сообщение в error, data=null, loading сброшен', async () => {
    const make = vi.fn().mockRejectedValue(new Error('network down'))
    mockGet.mockReturnValue(fakeB24(make))

    const { data, error, loading, load } = useDealMoney()
    await load(1)

    expect(error.value).toBe('network down')
    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('SDK не инициализирован (get() → undefined)', async () => {
    mockGet.mockReturnValue(undefined)

    const { data, error, load } = useDealMoney()
    await load(1)

    expect(error.value).toBe('Bitrix24 SDK не инициализирован')
    expect(data.value).toBeNull()
  })

  it('сбрасывает прошлую ошибку при новом запросе', async () => {
    mockGet.mockReturnValue(undefined)
    const { data, error, load } = useDealMoney()
    await load(1)
    expect(error.value).not.toBeNull()

    const make = vi.fn().mockResolvedValue(ajax({ getData: () => ({ result: { mode: 'contractor' } }) }))
    mockGet.mockReturnValue(fakeB24(make))
    await load(2)

    expect(error.value).toBeNull()
    expect(data.value).toEqual({ mode: 'contractor' })
  })
})
