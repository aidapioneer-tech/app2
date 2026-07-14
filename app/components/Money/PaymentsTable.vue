<script setup lang="ts">
import type { PaymentRow } from '~/types'
import { computed } from 'vue'
import { formatMoney, formatDate, originalMoneyLabel } from './format'

const props = defineProps<{
  payments: PaymentRow[]
  currency: string
}>()

// НДС по каждому платежу (planVat/planNet) выделяет бэкенд в dealMoney.get.
// Client-side fallback (calcPlanVat/calcPlanNet/effectiveTaxRate) убран (app2#7):
// раньше при planVat=0 фронт досчитывал сам по taxRate сделки — временный костыль.
// Бэкенд теперь отдаёт planVat/planNet всегда (в т.ч. 0 при ставке 0%), берём напрямую.

const isEmpty = computed(() => props.payments.length === 0)

function typeLabel(type: PaymentRow['type']): string {
  if (type === 'prepay') return 'пред-оплата'
  if (type === 'postpay') return 'пост-оплата'
  return type // неизвестный тип — возвращаем строку как есть
}

function isOverdue(row: PaymentRow): boolean {
  if (!row.dateDue || row.isFullyPaid) return false
  const today = new Date().toISOString().slice(0, 10)
  return row.leftToPay > 0 && row.dateDue < today
}

/**
 * Оригинальная сумма платежа мелким шрифтом (issue #127, ответ Q3 по #119).
 * Логика вынесена в чистый {@link originalMoneyLabel} (покрыта тестами);
 * здесь только прокидываем поля строки и валюту отчёта.
 */
function originalTotal(row: PaymentRow): string | null {
  return originalMoneyLabel(row.planTotalOriginal, row.currencyOriginal, props.currency)
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
          <th class="text-left font-medium py-2 px-2">
            Тип
          </th>
          <th class="text-right font-medium py-2 px-2">
            Сумма
          </th>
          <th class="text-right font-medium py-2 px-2">
            НДС
          </th>
          <th class="text-right font-medium py-2 px-2">
            Всего
          </th>
          <th class="text-right font-medium py-2 px-2">
            К оплате
          </th>
          <th class="text-left font-medium py-2 px-2">
            Срок
          </th>
          <th class="text-left font-medium py-2 px-2">
            Получено
          </th>
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
            {{ formatMoney(row.planNet, currency) }}
          </td>
          <td class="py-2 px-2 text-right tabular-nums">
            {{ formatMoney(row.planVat, currency) }}
          </td>
          <td
            class="py-2 px-2 text-right tabular-nums font-medium"
            :class="row.isFullyPaid ? 'text-(--ui-color-accent-main-success)' : ''"
          >
            {{ formatMoney(row.planTotal, currency) }}
            <div
              v-if="originalTotal(row)"
              class="text-xs font-normal text-(--ui-text-muted)"
              :title="`Оригинал платежа до конвертации в ${currency}`"
            >
              {{ originalTotal(row) }}
            </div>
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
