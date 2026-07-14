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

// Поиск метрики по лейблу — устойчив к смене порядка метрик.
function value(metrics: HeaderMetric[], label: string): string | undefined {
  return metrics.find(m => m.label === label)?.value
}

describe('buildHeaderMetrics', () => {
  it('клиент: Сумма сделки / Маржинальность / Доход (без НДС)', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'BYN', 'client')
    expect(metrics.map(m => m.label)).toEqual(['Сумма сделки', 'Маржинальность', 'Доход (без НДС)'])
    expect(value(metrics, 'Сумма сделки')).toBe('14 496,00 BYN')
    expect(value(metrics, 'Маржинальность')).toBe('90.4%')
    // aida#118: «Доход (без НДС)» = profit (подрядчик 1 385 вычтен) → 13 111, а не 14 496.
    expect(value(metrics, 'Доход (без НДС)')).toBe('13 111,00 BYN')
  })

  it('подрядчик: Сумма расхода / Маржинальность / Доход (без НДС)', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'BYN', 'contractor')
    expect(metrics.map(m => m.label)).toEqual(['Сумма расхода', 'Маржинальность', 'Доход (без НДС)'])
    expect(value(metrics, 'Сумма расхода')).toBe('1 385,00 BYN')
    expect(value(metrics, 'Доход (без НДС)')).toBe('13 111,00 BYN')
  })

  it('всегда ровно 3 метрики (нет отдельного incomeNet), НДС = 0', () => {
    expect(buildHeaderMetrics(makeTotals(), 'BYN', 'client')).toHaveLength(3)
    expect(buildHeaderMetrics(makeTotals(), 'BYN', 'contractor')).toHaveLength(3)
  })

  it('НДС > 0: по-прежнему 3 метрики; «Доход (без НДС)» = profit, а НЕ incomeNet (aida#118)', () => {
    // incomeGross 17 395 (с НДС 20%), incomeNet 14 496 (без НДС), подрядчик 1 385 → profit 13 111.
    const totals = makeTotals({ incomeGross: 17395, incomeNet: 14496, expenseTotal: 1385, profit: 13111 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(metrics.map(m => m.label)).toEqual(['Сумма сделки', 'Маржинальность', 'Доход (без НДС)'])
    expect(value(metrics, 'Сумма сделки')).toBe('17 395,00 BYN')
    // Ключ aida#118: показываем profit (13 111), отдельного incomeNet (14 496) в шапке нет.
    expect(value(metrics, 'Доход (без НДС)')).toBe('13 111,00 BYN')
  })

  it('убыток: подрядчик съел больше выручки → «Доход (без НДС)» и маржа отрицательные', () => {
    const totals = makeTotals({ incomeNet: 14496, expenseTotal: 14770, profit: -274, marginPercent: -1.9 })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(value(metrics, 'Маржинальность')).toBe('-1.9%')
    expect(value(metrics, 'Доход (без НДС)')).toBe('-274,00 BYN')
  })

  it('profit = 0 (подрядчик съел ровно всю выручку)', () => {
    const metrics = buildHeaderMetrics(makeTotals({ profit: 0, marginPercent: 0 }), 'BYN', 'contractor')
    expect(value(metrics, 'Доход (без НДС)')).toBe('0,00 BYN')
  })

  it('невалидные profit/marginPercent с бэкенда → «—» (NaN / Infinity)', () => {
    // «Доход (без НДС)» читает только profit; NaN у incomeNet/incomeGross на неё
    // больше не влияет (условная ветка hasVat, читавшая incomeNet, удалена, aida#118).
    const totals = makeTotals({ profit: Number.NaN, marginPercent: Number.POSITIVE_INFINITY })
    const metrics = buildHeaderMetrics(totals, 'BYN', 'client')
    expect(value(metrics, 'Маржинальность')).toBe('—')
    expect(value(metrics, 'Доход (без НДС)')).toBe('—')
  })

  it('прокидывает произвольную валюту в значения', () => {
    const metrics = buildHeaderMetrics(makeTotals(), 'USD', 'client')
    expect(value(metrics, 'Сумма сделки')).toBe('14 496,00 USD')
    expect(value(metrics, 'Доход (без НДС)')).toBe('13 111,00 USD')
  })
})
