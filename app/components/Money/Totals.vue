<script setup lang="ts">
import type { MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

defineProps<{
  totals: MoneyTotals
  currency: string
}>()
</script>

<template>
  <B24Card :b24ui="{ body: 'p-5' }">
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <span class="text-xs uppercase tracking-wide text-(--ui-text-muted)">План</span>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-(--ui-text-muted)">Выручка (с НДС)</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.plan.incomeGross, currency) }}</span>

            <span class="text-(--ui-text-muted)">Выручка (без НДС)</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.plan.incomeNet, currency) }}</span>

            <span class="text-(--ui-text-muted)">Расход подряда</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.plan.expenseTotal, currency) }}</span>

            <span class="font-medium">Доход (без НДС)</span>
            <span class="text-right tabular-nums font-medium">{{ formatMoney(totals.plan.profit, currency) }}</span>

            <span class="text-(--ui-text-muted)">Маржа</span>
            <span class="text-right tabular-nums">{{ formatPercent(totals.plan.marginPercent) }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-xs uppercase tracking-wide text-(--ui-text-muted)">Факт</span>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-(--ui-text-muted)">Получено (с НДС)</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.fact.incomeGross, currency) }}</span>

            <span class="text-(--ui-text-muted)">Получено (без НДС)</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.fact.incomeNet, currency) }}</span>

            <span class="text-(--ui-text-muted)">Выплачено подряду</span>
            <span class="text-right tabular-nums">{{ formatMoney(totals.fact.expenseTotal, currency) }}</span>

            <span class="font-medium">Доход (без НДС)</span>
            <span class="text-right tabular-nums font-medium">{{ formatMoney(totals.fact.profit, currency) }}</span>

            <span class="text-(--ui-text-muted)">Маржа</span>
            <span class="text-right tabular-nums">{{ formatPercent(totals.fact.marginPercent) }}</span>
          </div>
        </div>
      </div>
    </template>
  </B24Card>
</template>
