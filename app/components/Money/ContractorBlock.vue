<script setup lang="ts">
import type { ContractorBlock as ContractorBlockType } from '~/types'
import { ref, computed } from 'vue'
import PaymentsTable from './PaymentsTable.vue'
import { formatMoney, formatPercent } from './format'
import { useB24 } from '~/composables/useB24'
import ChevronDownIcon from '@bitrix24/b24icons-vue/actions/ChevronDownIcon'
import ChevronRightLIcon from '@bitrix24/b24icons-vue/outline/ChevronRightLIcon'

const props = defineProps<{
  block: ContractorBlockType
}>()

const open = ref(false)
const b24Instance = useB24()

const paidPercent = computed(() => {
  if (props.block.totals.planTotal <= 0) return 0
  return Math.round(props.block.totals.factTotal / props.block.totals.planTotal * 1000) / 10
})

const badgeMeta = computed<{ label: string, color: string }>(() => {
  switch (props.block.badge) {
    case 'paidByAct': return { label: 'Оплачено', color: 'air-primary-success' as const }
    case 'partial': return { label: 'Частично', color: 'air-primary-warning' as const }
    default: return { label: 'Не начато', color: 'air-secondary' as const }
  }
})

const contractorTaxRate = computed(() => props.block.taxRate ?? 0)

async function openDeal(event: MouseEvent) {
  event.stopPropagation()
  if (!Number.isInteger(props.block.dealId) || props.block.dealId <= 0) return
  const $b24 = b24Instance.get()
  if (!$b24) return
  try {
    await $b24.parent.openPath(`/crm/deal/details/${props.block.dealId}/`)
  }
  catch (e) {
    console.error('[ContractorBlock] openDeal failed', e instanceof Error ? e.message : String(e))
  }
}
</script>

<template>
  <B24Card :b24ui="{ body: 'p-0' }">
    <template #default>
      <button
        type="button"
        class="w-full flex items-center gap-3 p-4 text-left hover:bg-(--ui-bg-elevated) transition-colors"
        @click="open = !open"
      >
        <component :is="open ? ChevronDownIcon : ChevronRightLIcon" class="size-4 shrink-0 text-(--ui-text-muted)" />

        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-medium truncate">{{ block.companyTitle || block.title }}</span>
          <button
            type="button"
            class="text-xs text-(--ui-text-muted) hover:text-(--ui-color-accent-main) hover:underline w-fit"
            @click="openDeal"
          >
            Сделка #{{ block.dealId }} ↗
          </button>
        </div>

        <div class="hidden md:flex flex-col items-end text-xs text-(--ui-text-muted) shrink-0">
          <span>План: {{ formatMoney(block.totals.planTotal, block.currencyId) }}</span>
          <span>Факт: {{ formatMoney(block.totals.factTotal, block.currencyId) }}</span>
        </div>

        <span class="text-sm tabular-nums shrink-0 w-14 text-right">
          {{ formatPercent(paidPercent) }}
        </span>

        <B24Badge
          :color="badgeMeta.color as any"
          variant="soft"
          size="sm"
          class="shrink-0"
        >
          {{ badgeMeta.label }}
        </B24Badge>
      </button>

      <div v-if="open" class="border-t border-(--ui-border) p-4">
        <PaymentsTable
          :payments="block.payments"
          :currency="block.currencyId"
          :tax-rate="contractorTaxRate"
        />
      </div>
    </template>
  </B24Card>
</template>
