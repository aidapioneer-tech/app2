<script setup lang="ts">
import type { B24Frame } from '@bitrix24/b24jssdk'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { useB24 } from '~/composables/useB24'
import { useDealMoney } from '~/composables/useDealMoney'
import { moneyRefreshKey } from '~/components/Money/refresh'
import MoneyClient from '~/components/Money/Client.vue'
import MoneyContractor from '~/components/Money/Contractor.vue'

definePageMeta({ layout: 'clear' })

useHead({ title: 'Деньги по сделке' })

const b24Instance = useB24()
const { data, loading, error, load } = useDealMoney()

// Реальный контент-элемент — по нему меряем высоту фрейма (см. fitFrame).
const contentEl = ref<HTMLElement | null>(null)

const isFrame = computed(() => b24Instance.isInit())

const dealId = computed<number>(() => {
  if (!isFrame.value) return 0
  const $b24 = b24Instance.get() as B24Frame
  const opts = ($b24.placement?.options ?? {}) as Record<string, unknown>
  const id = Number(opts.ID ?? 0)
  // Только целое положительное — дробный/мусорный ID не уходит в REST.
  return Number.isInteger(id) && id > 0 ? id : 0
})

const placementOk = computed<boolean>(() => {
  if (!isFrame.value) return false
  const $b24 = b24Instance.get() as B24Frame
  return $b24.placement?.title === 'CRM_DEAL_DETAIL_TAB'
})

/**
 * Подогнать высоту встройки под содержимое — убирает внутренний скролл.
 *
 * Важно: `fitWindow()` меряет высоту ДОКУМЕНТА, а наш контент живёт внутри
 * dashboard-обёртки (`B24DashboardGroup`/`B24DashboardPanel`) с собственной
 * высотой во весь вьюпорт и внутренним скроллом — поэтому fitWindow видел бы
 * высоту вьюпорта, а не контента, и фрейм не рос. Меряем реальный
 * контент-элемент (`contentEl`, с учётом его паддингов) и подгоняем фрейм по нему
 * через `resizeWindowAuto(appNode)`. Вызывать после рендера данных (nextTick + кадр).
 */
async function fitFrame(): Promise<void> {
  const $b24 = b24Instance.get() as B24Frame | undefined
  if (!$b24) return
  await nextTick()
  // ещё один кадр после nextTick — дать b24ui дорисовать карточки/бейджи до замера.
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  try {
    const el = contentEl.value
    if (el) await $b24.parent.resizeWindowAuto(el)
    else await $b24.parent.fitWindow()
  } catch (e) {
    console.error('[index] resize frame failed', e instanceof Error ? e.message : String(e))
  }
}

/** Повторный запрос к серверу + подгонка высоты. Дёргается кнопкой «Обновить». */
async function reloadAll(): Promise<void> {
  if (!isFrame.value || dealId.value <= 0 || loading.value) return
  await load(dealId.value)
  await fitFrame()
}

provide(moneyRefreshKey, { refresh: reloadAll, busy: loading })

onMounted(async () => {
  if (!isFrame.value) return
  if (dealId.value > 0) {
    await load(dealId.value)
    const $b24 = b24Instance.get() as B24Frame | undefined
    if ($b24) await $b24.parent.setTitle('Деньги')
    await fitFrame()
  }
})
</script>

<template>
  <B24DashboardPanel id="money" :b24ui="{ body: 'p-0' }">
    <template #body>
      <!-- contentEl: измеряемый контент-элемент. Паддинги здесь (а не на body
           панели), чтобы resizeWindowAuto учитывал их в высоте фрейма. -->
      <div ref="contentEl" class="p-4 sm:pt-4 flex flex-col gap-4">
        <div v-if="!isFrame" class="text-(--ui-text-muted) text-sm">
          Откройте приложение в карточке сделки Битрикс24.
        </div>

        <div v-else-if="!placementOk || dealId === 0" class="text-(--ui-text-muted) text-sm">
          Это приложение работает только во вкладке карточки сделки (CRM_DEAL_DETAIL_TAB).
        </div>

        <template v-else>
          <div v-if="loading && !data" class="flex flex-col gap-3">
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
      </div>
    </template>
  </B24DashboardPanel>
</template>
