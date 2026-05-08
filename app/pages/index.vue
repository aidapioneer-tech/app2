<script setup lang="ts">
import type { B24Frame } from '@bitrix24/b24jssdk'
import { computed, onMounted } from 'vue'
import { useB24 } from '~/composables/useB24'
import { useDealMoney } from '~/composables/useDealMoney'
import MoneyClient from '~/components/Money/Client.vue'
import MoneyContractor from '~/components/Money/Contractor.vue'

definePageMeta({ layout: 'clear' })

useHead({ title: 'Деньги по сделке' })

const b24Instance = useB24()
const { data, loading, error, load } = useDealMoney()

const isFrame = computed(() => b24Instance.isInit())

const dealId = computed<number>(() => {
  if (!isFrame.value) return 0
  const $b24 = b24Instance.get() as B24Frame
  const opts = ($b24.placement?.options ?? {}) as Record<string, unknown>
  return Number(opts.ID ?? 0) || 0
})

const placementOk = computed<boolean>(() => {
  if (!isFrame.value) return false
  const $b24 = b24Instance.get() as B24Frame
  return $b24.placement?.title === 'CRM_DEAL_DETAIL_TAB'
})

onMounted(async () => {
  if (!isFrame.value) return
  if (dealId.value > 0) {
    await load(dealId.value)
    const $b24 = b24Instance.get() as B24Frame
    await $b24.parent.setTitle('Деньги')
  }
})
</script>

<template>
  <B24DashboardPanel id="money" :b24ui="{ body: 'p-4 sm:pt-4 scrollbar-transparent gap-4' }">
    <template #body>
      <div v-if="!isFrame" class="text-(--ui-text-muted) text-sm">
        Откройте приложение в карточке сделки Битрикс24.
      </div>

      <div v-else-if="!placementOk || dealId === 0" class="text-(--ui-text-muted) text-sm">
        Это приложение работает только во вкладке карточки сделки (CRM_DEAL_DETAIL_TAB).
      </div>

      <template v-else>
        <div v-if="loading" class="flex flex-col gap-3">
          <B24Skeleton class="h-24" />
          <B24Skeleton class="h-48" />
        </div>

        <B24Alert
          v-else-if="error"
          color="air-primary-alert"
          title="Ошибка загрузки"
          :description="error"
        />

        <template v-else-if="data">
          <MoneyClient v-if="data.mode === 'client'" :data="data" />
          <MoneyContractor v-else :data="data" />
        </template>
      </template>
    </template>
  </B24DashboardPanel>
</template>
