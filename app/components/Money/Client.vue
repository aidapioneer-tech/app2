<script setup lang="ts">
import type { DealMoneyResponse } from '~/types'
import { computed } from 'vue'
import Header from './Header.vue'
import PaymentsTable from './PaymentsTable.vue'
import ContractorBlock from './ContractorBlock.vue'
import { buildHeaderMetrics } from './headerMetrics'

const props = defineProps<{
  data: DealMoneyResponse
}>()

const currency = computed(() => props.data.deal.currencyId || 'BYN')
const contractors = computed(() => props.data.contractors ?? [])

const headerMetrics = computed(() => buildHeaderMetrics(props.data.totals, currency.value, props.data.mode))
</script>

<template>
  <div class="flex flex-col gap-4">
    <Header
      :title="data.deal.companyTitle || data.deal.title"
      subtitle="Клиент"
      :metrics="headerMetrics"
    />

    <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-3' }">
      <template #default>
        <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">Платежи клиента</span>
        <PaymentsTable
          :payments="data.payments"
          :currency="currency"
          :tax-rate="data.deal.taxRate"
        />
      </template>
    </B24Card>

    <div v-if="contractors.length > 0" class="flex flex-col gap-2">
      <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide px-1">
        Подрядчики ({{ contractors.length }})
      </span>
      <ContractorBlock
        v-for="block in contractors"
        :key="block.dealId"
        :block="block"
      />
    </div>
  </div>
</template>
