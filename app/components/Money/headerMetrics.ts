import type { DealMode, MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

/** Одна метрика шапки: подпись + уже отформатированное значение. */
export interface HeaderMetric {
  label: string
  value: string
}

/**
 * Метрики шапки экрана. Все значения — плановые (`totals.plan`).
 * - Клиент (cat 2): Сумма сделки (с НДС) / Маржинальность / Доход (без НДС).
 * - Подрядчик (cat 3): Сумма расхода / Маржинальность / Доход (без НДС).
 *
 * Семантика полей фиксирована здесь намеренно — единая точка правды для обоих
 * экранов, чтобы лейблы и источники не расходились между Client.vue/Contractor.vue.
 */
export function buildHeaderMetrics(totals: MoneyTotals, currency: string, mode: DealMode): HeaderMetric[] {
  const plan = totals.plan
  const margin: HeaderMetric = { label: 'Маржинальность', value: formatPercent(plan.marginPercent) }
  const incomeNet: HeaderMetric = { label: 'Доход (без НДС)', value: formatMoney(plan.incomeNet, currency) }

  if (mode === 'contractor') {
    return [
      { label: 'Сумма расхода', value: formatMoney(plan.expenseTotal, currency) },
      margin,
      incomeNet
    ]
  }

  return [
    { label: 'Сумма сделки', value: formatMoney(plan.incomeGross, currency) },
    margin,
    incomeNet
  ]
}
