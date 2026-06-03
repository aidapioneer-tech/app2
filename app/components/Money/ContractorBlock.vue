<script setup lang="ts">
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { ContractorBlock as ContractorBlockType } from '~/types'
import { ref, computed } from 'vue'
import PaymentsTable from './PaymentsTable.vue'
import { formatMoney, formatPercent } from './format'
import { useB24 } from '~/composables/useB24'
import ChevronDownIcon from '@bitrix24/b24icons-vue/actions/ChevronDownIcon'
import ChevronRightLIcon from '@bitrix24/b24icons-vue/outline/ChevronRightLIcon'
import ExternalLinkIcon from '@bitrix24/b24icons-vue/outline/ExternalLinkLIcon'

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

async function openDeal(event: MouseEvent) {
  event.stopPropagation()
  const $b24 = b24Instance.get() as B24Frame | undefined
  if (!$b24) return
  await $b24.parent.openPath(`/crm/deal/details/${props.block.dealId}/`)
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
            class="text-xs text-(--ui-text-muted) hover:text-(--ui-color-accent-main) hover:underline flex items-center gap-1 w-fit"
            @click="openDeal"
          >
            <component :is="ExternalLinkIcon" class="size-3" />
            Сделка #{{ block.dealId }}
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
        <PaymentsTable :payments="block.payments" :currency="block.currencyId" :tax-rate="20" />
      </div>
    </template>
  </B24Card>
</template>
