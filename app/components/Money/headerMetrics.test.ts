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

  it('НДС = 0: ровно 3 метрики, «Доход (без НДС)» скрыт (не дублирует Сумму сделки)', () => {
    // incomeGross == incomeNet (14 496) → доход без НДС не показываем (aida#93).
    const client = buildHeaderMetrics(makeTotals(), 'BYN', 'client')
    const contractor = buildHeaderMetrics(makeTotals(), 'BYN', 'contractor')
    expect(client).toHaveLength(3)
    expect(contractor).toHaveLength(3)
    expect(client.map(m => m.label)).not.toContain('Доход (без НДС)')
    expect(contractor.map(m => m.label)).not.toContain('Доход (без НДС)')
  })

  it('НДС > 0: появляется 4-я метрика «Доход (без НДС)» рядом с суммой сделки (app2#34)', () => {
    // incomeGross 17 395 (с НДС 20%), incomeNet 14 496 (без НДС), подрядчик 1 385 → profit 13 111.
    const totals = makeTotals({ incomeGross: 17395, incomeNet: 14496, expenseTotal: 1385, profit: 13111 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(metrics.map(m => m.label)).toEqual([
      'Сумма сделки', 'Доход (без НДС)', 'Маржинальность', 'Прибыль (без НДС)'
    ])
    expect(metrics[0]).toEqual({ label: 'Сумма сделки', value: '17 395,00 BYN' })
    expect(metrics[1]).toEqual({ label: 'Доход (без НДС)', value: '14 496,00 BYN' })
    expect(metrics[3]).toEqual({ label: 'Прибыль (без НДС)', value: '13 111,00 BYN' })
  })

  it('НДС > 0 в режиме contractor: тоже 4 метрики с «Доходом (без НДС)»', () => {
    const totals = makeTotals({ incomeGross: 17395, incomeNet: 14496, expenseTotal: 1385, profit: 13111 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'contractor')
    expect(metrics.map(m => m.label)).toEqual([
      'Сумма расхода', 'Доход (без НДС)', 'Маржинальность', 'Прибыль (без НДС)'
    ])
    expect(metrics[1]?.value).toBe('14 496,00 BYN')
  })

  it('убыток: подрядчик съел больше выручки → profit и маржа отрицательные', () => {
    const totals = makeTotals({ incomeNet: 14496, expenseTotal: 14770, profit: -274, marginPercent: -1.9 })
    const [, margin, third] = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(margin).toEqual({ label: 'Маржинальность', value: '-1.9%' })
    expect(third).toEqual({ label: 'Прибыль (без НДС)', value: '-274,00 BYN' })
  })

  it('profit = 0 (подрядчик съел ровно всю выручку)', () => {
    const [, , third] = buildHeaderMetrics(makeTotals({ profit: 0, marginPercent: 0 }), 'BYN', 'contractor')
    expect(third).toEqual({ label: 'Прибыль (без НДС)', value: '0,00 BYN' })
  })

  it('невалидные данные с бэкенда → «—» (profit = NaN, marginPercent = Infinity)', () => {
    const totals = makeTotals({ profit: Number.NaN, marginPercent: Number.POSITIVE_INFINITY })
    const [, margin, third] = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(margin?.value).toBe('—')
    expect(third?.value).toBe('—')
  })

  it('прокидывает произвольную валюту в значения', () => {
    const [, , third] = buildHeaderMetrics(makeTotals(), 'USD', 'client')
    expect(third).toEqual({ label: 'Прибыль (без НДС)', value: '13 111,00 USD' })
  })
})
