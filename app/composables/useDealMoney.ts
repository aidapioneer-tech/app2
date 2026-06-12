import type { B24Frame } from '@bitrix24/b24jssdk'
import type { DealMoneyResponse } from '~/types'
import { ref } from 'vue'
import { useB24 } from './useB24'

const REST_METHOD = 'shef:reportbuilder.api.dealMoney.get'

export function useDealMoney() {
  const data = ref<DealMoneyResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Запрашивает сводку по сделке через REST (`shef:reportbuilder.api.dealMoney.get`).
   * Использует restApi:v2 (`actions.v2.call.make`). Ответ b24jssdk — `AjaxResult`:
   * `getData()` отдаёт `SuccessPayload<T>` с полем `result` (либо `undefined`).
   * Любая ошибка → `error.value` (сырое сообщение логируется в консоль), `data.value = null`.
   */
  async function load(dealId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const b24 = useB24().get() as B24Frame | undefined
      if (!b24) {
        throw new Error('Bitrix24 SDK не инициализирован')
      }
      // restApi:v2 — актуальный вызов (b24.callMethod() помечен @deprecated, удаляется в 2.0.0).
      const response = await b24.actions.v2.call.make<DealMoneyResponse>({ method: REST_METHOD, params: { dealId } })
      if (!response.isSuccess) {
        throw new Error(response.getErrorMessages().join('; ') || 'REST-вызов вернул ошибку')
      }
      const result = response.getData()?.result
      if (!result) {
        throw new Error('REST вернул пустой результат')
      }
      data.value = result
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      // Детали — в консоль (для поддержки); в UI попадёт error.value.
      console.error('[useDealMoney] load failed', message)
      error.value = message
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
}
