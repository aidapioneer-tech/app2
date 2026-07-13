import type { DealMode, MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

/** Одна метрика шапки: подпись + уже отформатированное значение. */
export interface HeaderMetric {
  label: string
  value: string
}

/**
 * Метрики шапки экрана. Все значения — плановые (`totals.plan`).
 * - Клиент (cat 2): Сумма сделки (с НДС) / Маржинальность / Прибыль (без НДС).
 * - Подрядчик (cat 3): Сумма расхода / Маржинальность / Прибыль (без НДС).
 *
 * Третья метрика — `profit` (`incomeNet − expenseTotal`), а не `incomeNet`: доход
 * без вычета расходов подрядчиков вводит в заблуждение (aida#93 — «из суммы сделки
 * не отнялась сумма по подрядчику») и дублирует «Сумму сделки» при НДС = 0. Прибыль
 * согласуется с «Маржинальностью» (та считается как `profit / incomeNet`).
 *
 * В режиме `contractor` (cat 3) `profit` — прибыль самой подрядной сделки: её выручка
 * без НДС минус её собственные суб-расходы (`expenseTotal`). Если у подряда нет своих
 * суб-подрядчиков, `expenseTotal = 0` и `profit` совпадает с выручкой без НДС — это норма.
 *
 * `formatMoney`/`formatPercent` сами приводят невалидные значения (`NaN`/`Infinity`,
 * например при делении на ноль в марже) к `'—'` — здесь дефолты не нужны.
 *
 * Семантика полей фиксирована здесь намеренно — единая точка правды для обоих
 * экранов, чтобы лейблы и источники не расходились между Client.vue/Contractor.vue.
 */
export function buildHeaderMetrics(totals: MoneyTotals, currency: string, mode: DealMode): HeaderMetric[] {
  const plan = totals.plan
  const margin: HeaderMetric = { label: 'Маржинальность', value: formatPercent(plan.marginPercent) }
  const profit: HeaderMetric = { label: 'Прибыль (без НДС)', value: formatMoney(plan.profit, currency) }

  if (mode === 'contractor') {
    return [
      { label: 'Сумма расхода', value: formatMoney(plan.expenseTotal, currency) },
      margin,
      profit
    ]
  }

  return [
    { label: 'Сумма сделки', value: formatMoney(plan.incomeGross, currency) },
    margin,
    profit
  ]
}
