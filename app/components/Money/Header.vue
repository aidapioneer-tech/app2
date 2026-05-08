<script setup lang="ts">
import { computed } from 'vue'
import type { MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

const props = defineProps<{
  title: string
  subtitle: string
  currency: string
  totals: MoneyTotals
  /**
   * 'client' — прогресс показывает «Получено X из Y» (доход).
   * 'contractor' — «Выплачено X из Y» (расход).
   */
  progressKind: 'client' | 'contractor'
}>()

const planGross = computed(() =>
  props.progressKind === 'client'
    ? props.totals.plan.incomeGross
    : props.totals.plan.expenseTotal
)
const factGross = computed(() =>
  props.progressKind === 'client'
    ? props.totals.fact.incomeGross
    : props.totals.fact.expenseTotal
)
const progressPercent = computed(() =>
  props.progressKind === 'client'
    ? props.totals.progress.incomeReceivedPercent
    : props.totals.progress.expensePaidPercent
)
const progressLabel = computed(() =>
  props.progressKind === 'client' ? 'Получено' : 'Выплачено'
)
</script>

<template>
  <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-3' }">
    <template #default>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">{{ subtitle }}</span>
        <span class="text-lg font-medium">{{ title }}</span>
      </div>

      <div class="flex flex-wrap items-baseline gap-x-8 gap-y-2 mt-2">
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">Доход план</span>
          <span class="text-2xl font-semibold">{{ formatMoney(planGross, currency) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">Маржа план</span>
          <span class="text-xl font-medium">{{ formatPercent(totals.plan.marginPercent) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">Маржа факт</span>
          <span class="text-xl font-medium">{{ formatPercent(totals.fact.marginPercent) }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-1 mt-2">
        <div class="flex justify-between text-xs">
          <span class="text-(--ui-text-muted)">
            {{ progressLabel }}: {{ formatMoney(factGross, currency) }} из {{ formatMoney(planGross, currency) }}
          </span>
          <span class="text-(--ui-text-muted)">{{ formatPercent(progressPercent) }}</span>
        </div>
        <B24Progress
          :model-value="progressPercent"
          size="xs"
          :color="progressPercent >= 99 ? 'air-primary-success' : 'air-primary'"
        />
      </div>
    </template>
  </B24Card>
</template>
