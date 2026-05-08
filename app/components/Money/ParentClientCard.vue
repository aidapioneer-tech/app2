<script setup lang="ts">
import type { ParentClientDeal } from '~/types'
import { formatMoney, formatPercent } from './format'

defineProps<{
  parent: ParentClientDeal
  currency: string
}>()
</script>

<template>
  <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-3' }">
    <template #default>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">Клиентская сделка</span>
        <span class="text-base font-medium">{{ parent.companyTitle || parent.title }}</span>
        <span class="text-xs text-(--ui-text-muted)">Сделка #{{ parent.id }} — {{ parent.title }}</span>
      </div>

      <div class="grid grid-cols-2 gap-y-2 text-sm mt-2">
        <span class="text-(--ui-text-muted)">Доход (с НДС)</span>
        <span class="text-right tabular-nums">{{ formatMoney(parent.incomeGross, currency) }}</span>

        <span class="text-(--ui-text-muted)">Доход (без НДС)</span>
        <span class="text-right tabular-nums">{{ formatMoney(parent.incomeNet, currency) }}</span>

        <span class="text-(--ui-text-muted)">Доля этого подряда</span>
        <span class="text-right tabular-nums">{{ formatPercent(parent.thisContractorShare) }}</span>
      </div>
    </template>
  </B24Card>
</template>
