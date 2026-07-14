import type { DealMode, MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

/** Одна метрика шапки: подпись + уже отформатированное значение. */
export interface HeaderMetric {
  label: string
  value: string
}

/**
 * Метрики шапки экрана «Деньги». Все значения — плановые (`totals.plan`).
 * - Клиент (cat 2): Сумма сделки (с НДС) / Маржинальность / Доход (без НДС).
 * - Подрядчик (cat 3): Сумма расхода / Маржинальность / Доход (без НДС).
 *
 * Третья метрика — `profit` (`incomeNet − expenseTotal`), подписана «Доход (без НДС)»
 * (aida#118): в терминологии проекта «доход» — это выручка без НДС за вычетом
 * подрядчиков; показатель согласуется с «Маржинальностью» (та = `profit / incomeNet`).
 *
 * История: aida#93 переименовал этот показатель «Доход» → «Прибыль (без НДС)», а
 * app2#34 добавил рядом отдельный «Доход (без НДС)» (`incomeNet`). Пара показателей
 * оказалась избыточной (aida#118): оставлен один — с итоговой подписью
 * «Доход (без НДС)» и значением `profit`; отдельный `incomeNet` из шапки убран.
 * Полная раскладка (incomeGross / incomeNet / expenseTotal / profit / margin)
 * осталась в детальной таблице `Totals.vue`.
 *
 * В режиме `contractor` (cat 3) `profit` — прибыль самой подрядной сделки: её выручка
 * без НДС минус собственные суб-расходы (`expenseTotal`; если их нет — совпадает с
 * выручкой без НДС).
 *
 * `formatMoney`/`formatPercent` сами приводят невалидные значения (`NaN`/`Infinity`)
 * к `'—'` — здесь дефолты не нужны.
 *
 * Семантика полей фиксирована здесь намеренно — единая точка правды для обоих
 * экранов, чтобы лейблы и источники не расходились между Client.vue/Contractor.vue.
 */
export function buildHeaderMetrics(totals: MoneyTotals, currency: string, mode: DealMode): HeaderMetric[] {
  const plan = totals.plan
  const margin: HeaderMetric = { label: 'Маржинальность', value: formatPercent(plan.marginPercent) }
  // «Доход (без НДС)» = profit (выручка без НДС за вычетом подрядчиков), aida#118.
  const income: HeaderMetric = { label: 'Доход (без НДС)', value: formatMoney(plan.profit, currency) }

  // Первая метрика — «валовая»: у клиента сумма сделки (с НДС), у подряда сумма расхода.
  const gross: HeaderMetric = mode === 'contractor'
    ? { label: 'Сумма расхода', value: formatMoney(plan.expenseTotal, currency) }
    : { label: 'Сумма сделки', value: formatMoney(plan.incomeGross, currency) }

  return [gross, margin, income]
}
