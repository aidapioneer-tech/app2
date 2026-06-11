import type { B24FrameQueryParams, LoggerInterface } from '@bitrix24/b24jssdk'
import { B24Frame, LoggerFactory, Result, initializeB24Frame, useB24Helper, LoadDataType } from '@bitrix24/b24jssdk'

let $b24: undefined | B24Frame = undefined
let $b24Helper: undefined | object = undefined
const type = ref<'undefined' | 'B24Frame'>('undefined')

/**
 * Результат инициализации SDK:
 * - `ready`    — SDK поднят, приложение работает внутри фрейма Bitrix24;
 * - `no-frame` — приложение открыто вне фрейма Bitrix24 (штатный сценарий,
 *                не ошибка): информируем пользователя, где его открывать;
 * - `error`    — реальный сбой инициализации SDK; `message` — текст для UI,
 *                технические детали уходят в `console.error`.
 */
export type InitResult
  = | { status: 'ready' }
    | { status: 'no-frame' }
    | { status: 'error', message: string }

export const useB24 = () => {
  const b24Config = {}

  const { initB24Helper, getB24Helper } = useB24Helper()
  type B24HelperData = ReturnType<typeof getB24Helper>

  function buildLogger(loggerTitle?: string): LoggerInterface {
    // @todo fix this
    const devMode = typeof import.meta !== 'undefined' && import.meta.env?.DEV
    return LoggerFactory.createForBrowser(loggerTitle ?? 'dashBoard', devMode)
  }

  function get() {
    return $b24
  }

  function getHelper(): B24HelperData | undefined {
    return $b24Helper as B24HelperData | undefined
  }

  function set(newValue: unknown | B24Frame | string): Result {
    const result = new Result()
    if (
      typeof newValue !== 'undefined'
      && typeof $b24 === 'undefined'
    ) {
      if (newValue instanceof B24Frame) {
        $b24 = newValue
        nextTick(() => {
          type.value = 'B24Frame'
        })
      }
    } else if (
      typeof newValue === 'undefined'
    ) {
      nextTick(() => {
        type.value = 'undefined'
      })
      $b24 = undefined
    }

    return result
  }

  async function init(): Promise<InitResult> {
    // try to detect by Frame Params
    const queryParams: B24FrameQueryParams = {
      DOMAIN: null,
      PROTOCOL: false,
      APP_SID: null,
      LANG: null
    }

    if (window.name) {
      const [domain, appSid] = window.name.split('|')
      queryParams.DOMAIN = domain
      queryParams.APP_SID = appSid
    }

    if (!queryParams.DOMAIN || !queryParams.APP_SID) {
      // Открыто вне фрейма Bitrix24 — штатный сценарий, а не сбой.
      // Приложение работает только встроенным в портал.
      return { status: 'no-frame' }
    }

    try {
      // now init b24Frame
      const b24 = await initializeB24Frame(b24Config)
      await initB24Helper(
        b24,
        [
          LoadDataType.App,
          LoadDataType.Profile,
          LoadDataType.Currency
          // LoadDataType.AppOptions
          // LoadDataType.UserOptions
        ]
      )

      $b24Helper = getB24Helper()
      set(b24)
      return { status: 'ready' }
    } catch (error) {
      // Реальный сбой инициализации SDK. Раньше catch молча проглатывал
      // ошибку и init() возвращал успех — сообщение о сбое не доходило до UI.
      // Технические детали — в консоль, пользователю — общий текст.
      console.error('[useB24] Ошибка инициализации Bitrix24 SDK:', error)
      $b24Helper = undefined
      set(undefined)
      return {
        status: 'error',
        message: 'Не удалось подключиться к Битрикс24. Обратитесь к администратору.'
      }
    }
  }

  function isFrame() {
    return get() instanceof B24Frame
  }

  function isInit() {
    return type.value !== 'undefined'
  }

  function targetOrigin() {
    return get()?.getTargetOrigin() || '?'
  }

  function removeHookFromSessionStorage() {
    set(undefined)
  }

  function getRequiredRights(): string[] {
    return [
      'user_brief',
      'crm',
      'tasks',
      'entity'
    ]
  }

  return {
    buildLogger,
    init,
    get,
    getHelper,
    set,
    isFrame,
    isInit,
    targetOrigin,
    removeHookFromSessionStorage,
    getRequiredRights
  }
}
