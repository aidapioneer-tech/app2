import type { DealMode, MoneyTotals } from '~/types'
import { formatMoney, formatPercent } from './format'

/** Одна метрика шапки: подпись + уже отформатированное значение. */
export interface HeaderMetric {
  label: string
  value: string
}

/**
 * НДС присутствует, если выручка с НДС (`incomeGross`) и без НДС (`incomeNet`)
 * различаются. Сравниваем в копейках (`round(× 100)`) — деньги приходят float,
 * прямое `!==` ловило бы артефакты. При `NaN` вернёт `true` (данные невалидны —
 * пусть метрика покажется с `'—'`, а не молча исчезнет).
 */
function hasVat(incomeGross: number, incomeNet: number): boolean {
  return Math.round(incomeGross * 100) !== Math.round(incomeNet * 100)
}

/**
 * Метрики шапки экрана. Все значения — плановые (`totals.plan`).
 * - Клиент (cat 2): Сумма сделки (с НДС) / [Доход (без НДС)] / Маржинальность / Прибыль (без НДС).
 * - Подрядчик (cat 3): Сумма расхода / [Доход (без НДС)] / Маржинальность / Прибыль (без НДС).
 *
 * Третья/последняя метрика — `profit` (`incomeNet − expenseTotal`), а не `incomeNet`:
 * доход без вычета расходов подрядчиков вводит в заблуждение (aida#93 — «из суммы
 * сделки не отнялась сумма по подрядчику»). Прибыль согласуется с «Маржинальностью»
 * (та считается как `profit / incomeNet`).
 *
 * «Доход (без НДС)» (`incomeNet`) — **условная** метрика: показываем только когда НДС
 * реально есть (`incomeNet ≠ incomeGross`, см. `hasVat`). При НДС = 0 доход равен
 * «Сумме сделки», и его дублирование как раз и запутало пользователя в aida#93; при
 * НДС > 0 выручка без НДС снова видна бухгалтеру (aida app2#34). Вёрстка `Header.vue`
 * рисует метрики по массиву через `flex-wrap` — 4-й элемент встаёт без переверстки.
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

  // Первая метрика — «валовая»: у клиента сумма сделки (с НДС), у подряда сумма расхода.
  const gross: HeaderMetric = mode === 'contractor'
    ? { label: 'Сумма расхода', value: formatMoney(plan.expenseTotal, currency) }
    : { label: 'Сумма сделки', value: formatMoney(plan.incomeGross, currency) }

  const metrics: HeaderMetric[] = [gross]

  // Выручку без НДС показываем рядом с валовой суммой — только если НДС есть.
  if (hasVat(plan.incomeGross, plan.incomeNet)) {
    metrics.push({ label: 'Доход (без НДС)', value: formatMoney(plan.incomeNet, currency) })
  }

  metrics.push(margin, profit)
  return metrics
}
