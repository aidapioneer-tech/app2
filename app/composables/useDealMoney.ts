import type { B24Frame } from '@bitrix24/b24jssdk'
import type { DealMoneyResponse } from '~/types'
import { ref } from 'vue'
import { useB24 } from './useB24'

const REST_METHOD = 'shef:reportbuilder.api.dealMoney.get'

export function useDealMoney() {
  const data = ref<DealMoneyResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(dealId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const b24 = useB24().get() as B24Frame | undefined
      if (!b24) {
        throw new Error('Bitrix24 SDK не инициализирован')
      }
      const response = await b24.callMethod(REST_METHOD, { dealId })
      const payload = response.getData() as { result?: DealMoneyResponse } | DealMoneyResponse
      const unwrapped = (payload as { result?: DealMoneyResponse }).result ?? (payload as DealMoneyResponse)
      data.value = unwrapped
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      error.value = message
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
}
