import { describe, it, expect } from 'vitest'
import { buildHeaderMetrics } from './headerMetrics'
import type { MoneyTotals } from '~/types'

// Данные сделки 147 (aida#93): выручка 14 496, подрядчик 1 385, НДС = 0.
// profit = incomeNet − expenseTotal = 14 496 − 1 385 = 13 111.
// margin = profit / incomeNet × 100 = 90.4%.
function makeTotals(over: Partial<MoneyTotals['plan']> = {}): MoneyTotals {
  const plan = {
    incomeGross: 14496,
    incomeNet: 14496,
    expenseTotal: 1385,
    profit: 13111,
    marginPercent: 90.4,
    ...over
  }
  return {
    plan,
    fact: { incomeGross: 0, incomeNet: 0, expenseTotal: 0, profit: 0, marginPercent: 0 },
    progress: { incomeReceivedPercent: 0, expensePaidPercent: 0 }
  }
}

describe('buildHeaderMetrics', () => {
  it('клиент: третья метрика — Прибыль (profit), а не Доход (incomeNet)', () => {
    const [first, margin, third] = buildHeaderMetrics(makeTotals(), 'BYN', 'client')
    expect(first).toEqual({ label: 'Сумма сделки', value: '14 496,00 BYN' })
    expect(margin).toEqual({ label: 'Маржинальность', value: '90.4%' })
    // Ключ регрессии aida#93: подрядчик (1 385) вычтен из суммы сделки → 13 111.
    expect(third).toEqual({ label: 'Прибыль (без НДС)', value: '13 111,00 BYN' })
  })

  it('подрядчик: Сумма расхода / Маржинальность / Прибыль', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'BYN', 'contractor')
    expect(metrics.map(m => m.label)).toEqual(['Сумма расхода', 'Маржинальность', 'Прибыль (без НДС)'])
    expect(metrics[0]).toEqual({ label: 'Сумма расхода', value: '1 385,00 BYN' })
    expect(metrics[2]?.value).toBe('13 111,00 BYN')
  })

  it('прибыль отличается от выручки-без-НДС при наличии расходов', () => {
    const [, , third] = buildHeaderMetrics(makeTotals(), 'BYN', 'client')
    // incomeNet = 14 496, но в шапке показываем profit = 13 111 — не равны.
    expect(third?.value).not.toBe('14 496,00 BYN')
  })
})
