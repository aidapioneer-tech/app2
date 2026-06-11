<script setup lang="ts">
import type { DealMoneyResponse } from '~/types'
import { computed } from 'vue'
import Header from './Header.vue'
import PaymentsTable from './PaymentsTable.vue'
import ParentClientCard from './ParentClientCard.vue'
import { formatMoney, formatPercent } from './format'

const props = defineProps<{
  data: DealMoneyResponse
}>()

const currency = computed(() => props.data.deal.currencyId || 'BYN')

const headerMetrics = computed(() => {
  const plan = props.data.totals.plan
  return [
    { label: 'Сумма расхода', value: formatMoney(plan.expenseTotal, currency.value) },
    { label: 'Маржинальность', value: formatPercent(plan.marginPercent) },
    { label: 'Доход (без НДС)', value: formatMoney(plan.incomeNet, currency.value) }
  ]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Header
      :title="data.deal.companyTitle || data.deal.title"
      subtitle="Подрядчик"
      :metrics="headerMetrics"
    />

    <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-3' }">
      <template #default>
        <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">Платежи подрядчику</span>
        <PaymentsTable
          :payments="data.payments"
          :currency="currency"
          :tax-rate="data.deal.taxRate"
        />
      </template>
    </B24Card>

    <ParentClientCard
      v-if="data.parentClientDeal"
      :parent="data.parentClientDeal"
      :currency="currency"
    />
  </div>
</template>
