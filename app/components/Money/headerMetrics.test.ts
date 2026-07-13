import { describe, it, expect } from 'vitest'
import { buildHeaderMetrics } from './headerMetrics'
import type { HeaderMetric } from './headerMetrics'
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

// Поиск метрики по лейблу — устойчив к смене числа/порядка метрик (в отличие от
// позиционной деструктуризации, которая верна лишь пока дефолт makeTotals = НДС 0).
function value(metrics: HeaderMetric[], label: string): string | undefined {
  return metrics.find(m => m.label === label)?.value
}

describe('buildHeaderMetrics', () => {
  it('клиент: последняя метрика — Прибыль (profit), а не Доход (incomeNet)', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'BYN', 'client')
    expect(value(metrics, 'Сумма сделки')).toBe('14 496,00 BYN')
    expect(value(metrics, 'Маржинальность')).toBe('90.4%')
    // Ключ регрессии aida#93: подрядчик (1 385) вычтен из суммы сделки → 13 111.
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('13 111,00 BYN')
  })

  it('подрядчик: Сумма расхода / Маржинальность / Прибыль', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'BYN', 'contractor')
    expect(metrics.map(m => m.label)).toEqual(['Сумма расхода', 'Маржинальность', 'Прибыль (без НДС)'])
    expect(value(metrics, 'Сумма расхода')).toBe('1 385,00 BYN')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('13 111,00 BYN')
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
    expect(value(metrics, 'Сумма сделки')).toBe('17 395,00 BYN')
    expect(value(metrics, 'Доход (без НДС)')).toBe('14 496,00 BYN')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('13 111,00 BYN')
  })

  it('НДС > 0 в режиме contractor: тоже 4 метрики с «Доходом (без НДС)»', () => {
    const totals = makeTotals({ incomeGross: 17395, incomeNet: 14496, expenseTotal: 1385, profit: 13111 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'contractor')
    expect(metrics.map(m => m.label)).toEqual([
      'Сумма расхода', 'Доход (без НДС)', 'Маржинальность', 'Прибыль (без НДС)'
    ])
    expect(value(metrics, 'Доход (без НДС)')).toBe('14 496,00 BYN')
  })

  it('hasVat: разница в доли копейки (float-артефакт) НЕ считается НДС → 3 метрики', () => {
    // round(100 × 100) === round(100.001 × 100) === 10000 → доход не показываем.
    const metrics = buildHeaderMetrics(makeTotals({ incomeGross: 100, incomeNet: 100.001 }), 'BYN', 'client')
    expect(metrics).toHaveLength(3)
    expect(metrics.map(m => m.label)).not.toContain('Доход (без НДС)')
  })

  it('hasVat: разница ровно в 1 копейку — уже НДС → 4 метрики', () => {
    // round(100.01 × 100)=10001 ≠ round(100 × 100)=10000 → доход показываем.
    const metrics = buildHeaderMetrics(makeTotals({ incomeGross: 100.01, incomeNet: 100 }), 'BYN', 'client')
    expect(metrics).toHaveLength(4)
    expect(value(metrics, 'Доход (без НДС)')).toBe('100,00 BYN')
  })

  it('hasVat: incomeNet = NaN → метрика показывается с «—», не скрывается молча', () => {
    const metrics = buildHeaderMetrics(makeTotals({ incomeNet: Number.NaN }), 'BYN', 'client')
    expect(metrics).toHaveLength(4)
    expect(value(metrics, 'Доход (без НДС)')).toBe('—')
  })

  it('hasVat: incomeGross = NaN → метрика тоже показывается (симметрично)', () => {
    const metrics = buildHeaderMetrics(makeTotals({ incomeGross: Number.NaN }), 'BYN', 'client')
    expect(metrics).toHaveLength(4)
    expect(value(metrics, 'Доход (без НДС)')).toBe('14 496,00 BYN')
  })

  it('отрицательные суммы (сторно/возврат): НДС определяется, знак сохраняется', () => {
    const totals = makeTotals({ incomeGross: -17395, incomeNet: -14496, profit: -13111 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(metrics).toHaveLength(4)
    expect(value(metrics, 'Доход (без НДС)')).toBe('-14 496,00 BYN')
  })

  it('убыток: подрядчик съел больше выручки → profit и маржа отрицательные', () => {
    const totals = makeTotals({ incomeNet: 14496, expenseTotal: 14770, profit: -274, marginPercent: -1.9 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(value(metrics, 'Маржинальность')).toBe('-1.9%')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('-274,00 BYN')
  })

  it('profit = 0 (подрядчик съел ровно всю выручку)', () => {
    const metrics = buildHeaderMetrics(makeTotals({ profit: 0, marginPercent: 0 }), 'BYN', 'contractor')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('0,00 BYN')
  })

  it('невалидные profit/marginPercent с бэкенда → «—» (NaN / Infinity)', () => {
    const totals = makeTotals({ profit: Number.NaN, marginPercent: Number.POSITIVE_INFINITY })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(value(metrics, 'Маржинальность')).toBe('—')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('—')
  })

  it('прокидывает произвольную валюту в значения', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'USD', 'client')
    expect(value(metrics, 'Прибыль (без НДС)')).toBe('13 111,00 USD')
  })
})
