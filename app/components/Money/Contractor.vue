<script setup lang="ts">
import type { DealMoneyResponse } from '~/types'
import { computed } from 'vue'
import Header from './Header.vue'
import PaymentsTable from './PaymentsTable.vue'
import ParentClientCard from './ParentClientCard.vue'
import Totals from './Totals.vue'

const props = defineProps<{
  data: DealMoneyResponse
}>()

const currency = computed(() => props.data.deal.currencyId || 'BYN')
</script>

<template>
  <div class="flex flex-col gap-4">
    <Header
      :title="data.deal.companyTitle || data.deal.title"
      subtitle="Подрядчик"
      :currency="currency"
      :totals="data.totals"
      progress-kind="contractor"
    />

    <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-3' }">
      <template #default>
        <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">Платежи подрядчику</span>
        <PaymentsTable
          :payments="data.payments"
          :currency="currency"
          :tax-rate="20"
        />
      </template>
    </B24Card>

    <ParentClientCard
      v-if="data.parentClientDeal"
      :parent="data.parentClientDeal"
      :currency="currency"
    />

    <Totals :totals="data.totals" :currency="currency" />
  </div>
</template>
