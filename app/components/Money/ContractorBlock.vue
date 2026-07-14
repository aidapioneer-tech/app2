<script setup lang="ts">
import type { ContractorBlock as ContractorBlockType } from '~/types'
import { computed } from 'vue'
import PaymentsTable from './PaymentsTable.vue'
import { useB24 } from '~/composables/useB24'

const props = defineProps<{
  block: ContractorBlockType
}>()

const b24Instance = useB24()

/** Цвета бейджа из air-палитры b24ui (подмножество, которое мы используем). */
type BadgeColor = 'air-primary-success' | 'air-primary-warning' | 'air-secondary'

/**
 * Единый источник вида блока по статусу оплаты подрядчика:
 * текст бейджа + цвет бейджа + цвет левого акцента карточки.
 * Один switch — чтобы три значения не разъезжались при добавлении статусов.
 */
const status = computed<{ label: string, color: BadgeColor, accentClass: string }>(() => {
  switch (props.block.badge) {
    case 'paidByAct':
      return { label: 'Оплачено', color: 'air-primary-success', accentClass: 'border-l-(--ui-color-accent-main-success)' }
    case 'partial':
      return { label: 'Частично', color: 'air-primary-warning', accentClass: 'border-l-(--ui-color-accent-main-warning)' }
    default:
      return { label: 'Не начато', color: 'air-secondary', accentClass: 'border-l-(--ui-border)' }
  }
})

async function openDeal() {
  if (!Number.isInteger(props.block.dealId) || props.block.dealId <= 0) return
  const $b24 = b24Instance.get()
  if (!$b24) return
  try {
    const url = $b24.slider.getUrl(`/crm/deal/details/${props.block.dealId}/`)
    await $b24.slider.openPath(url)
  } catch (e) {
    console.error('[ContractorBlock] openDeal failed', e instanceof Error ? e.message : String(e))
  }
}
</script>

<template>
  <B24Card :b24ui="{ body: 'p-0' }" :class="['border-l-4', status.accentClass]">
    <template #default>
      <div class="flex items-center gap-3 p-4 bg-(--ui-bg-elevated)">
        <div class="flex flex-col min-w-0 flex-1 gap-0.5">
          <span class="text-sm font-medium truncate">
            {{ block.companyTitle || block.title || 'Подрядчик' }}
          </span>
          <button
            type="button"
            class="text-xs text-(--ui-text-muted) hover:text-(--ui-color-accent-main) hover:underline w-fit max-w-full truncate text-left"
            @click="openDeal"
          >
            {{ block.title || `Сделка #${block.dealId}` }} ↗
          </button>
        </div>

        <B24Badge
          :color="status.color"
          variant="soft"
          size="sm"
          class="shrink-0"
        >
          {{ status.label }}
        </B24Badge>
      </div>

      <div class="border-t border-(--ui-border) p-4">
        <PaymentsTable
          :payments="block.payments"
          :currency="block.currencyId"
        />
      </div>
    </template>
  </B24Card>
</template>
