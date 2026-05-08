<script setup lang="ts">
import type { PaymentRow } from '~/types'
import { computed } from 'vue'
import { formatMoney, formatDate } from './format'

const props = defineProps<{
  payments: PaymentRow[]
  currency: string
}>()

const isEmpty = computed(() => props.payments.length === 0)

function typeLabel(type: PaymentRow['type']): string {
  return type === 'prepay' ? 'пред-оплата' : 'пост-оплата'
}

function isOverdue(row: PaymentRow): boolean {
  if (!row.dateDue || row.isFullyPaid) return false
  const today = new Date().toISOString().slice(0, 10)
  return row.leftToPay > 0 && row.dateDue < today
}
</script>

<template>
  <div v-if="isEmpty" class="text-sm text-(--ui-text-muted) px-1 py-3">
    Платежи не запланированы.
  </div>

  <div v-else class="overflow-x-auto">
    <table class="w-full text-sm border-separate" style="border-spacing: 0">
      <thead>
        <tr class="text-(--ui-text-muted) text-xs uppercase tracking-wide">
          <th class="text-left font-medium py-2 px-2">Тип</th>
          <th class="text-right font-medium py-2 px-2">Сумма</th>
          <th class="text-right font-medium py-2 px-2">НДС</th>
          <th class="text-right font-medium py-2 px-2">Всего</th>
          <th class="text-right font-medium py-2 px-2">К оплате</th>
          <th class="text-left font-medium py-2 px-2">Срок</th>
          <th class="text-left font-medium py-2 px-2">Получено</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in payments"
          :key="row.paymentId"
          class="hover:bg-(--ui-bg-elevated) transition-colors"
        >
          <td class="py-2 px-2">
            <B24Badge
              :color="row.type === 'prepay' ? 'air-primary' : 'air-secondary'"
              variant="soft"
              size="sm"
            >
              {{ typeLabel(row.type) }}
            </B24Badge>
          </td>
          <td class="py-2 px-2 text-right tabular-nums">
            {{ formatMoney(row.factNet, currency) }}
          </td>
          <td class="py-2 px-2 text-right tabular-nums">
            {{ formatMoney(row.factVat, currency) }}
          </td>
          <td
            class="py-2 px-2 text-right tabular-nums font-medium"
            :class="row.isFullyPaid ? 'text-(--ui-color-accent-main-success)' : ''"
          >
            {{ formatMoney(row.planTotal, currency) }}
          </td>
          <td
            class="py-2 px-2 text-right tabular-nums"
            :class="isOverdue(row) ? 'text-(--ui-color-accent-main-alert)' : ''"
          >
            {{ formatMoney(row.leftToPay, currency) }}
          </td>
          <td class="py-2 px-2 text-(--ui-text-muted)">
            {{ formatDate(row.dateDue) }}
          </td>
          <td class="py-2 px-2">
            <span v-if="row.dateReceived" class="text-(--ui-color-accent-main-success)">
              {{ formatDate(row.dateReceived) }}
            </span>
            <span v-else class="text-(--ui-text-muted)">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
