import { describe, it, expect } from 'vitest'
import { formatMoney, formatPercent, formatDate } from './format'

describe('formatMoney', () => {
  it('форматирует дробную сумму с разделителями', () => {
    expect(formatMoney(1234.56)).toBe('1 234,56 BYN')
  })

  it('разделяет тысячи пробелами', () => {
    expect(formatMoney(1000000)).toBe('1 000 000,00 BYN')
  })

  it('добавляет два знака для целого числа', () => {
    expect(formatMoney(100)).toBe('100,00 BYN')
  })

  it('форматирует ноль', () => {
    expect(formatMoney(0)).toBe('0,00 BYN')
  })

  it('форматирует отрицательную сумму и принимает валюту', () => {
    expect(formatMoney(-500.5, 'USD')).toBe('-500,50 USD')
  })

  it('корректно расставляет разделители в отрицательной сумме с тысячами', () => {
    expect(formatMoney(-1234567.89)).toBe('-1 234 567,89 BYN')
  })

  it('использует BYN по умолчанию', () => {
    expect(formatMoney(42)).toBe('42,00 BYN')
  })

  it('округляет до двух знаков (с учётом плавающей точки)', () => {
    // 1.005 * 100 = 100.4999… → Math.round → 100 → 1,00
    expect(formatMoney(1.005)).toBe('1,00 BYN')
    // 2.675 * 100 = 267.5000…0006 → Math.round → 268 → 2,68
    expect(formatMoney(2.675)).toBe('2,68 BYN')
    expect(formatMoney(0.001)).toBe('0,00 BYN')
  })

  it('возвращает «—» для нечисловых значений', () => {
    expect(formatMoney(Number.NaN)).toBe('—')
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('—')
    expect(formatMoney(Number.NEGATIVE_INFINITY)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('форматирует с одним знаком после запятой', () => {
    expect(formatPercent(20)).toBe('20.0%')
    expect(formatPercent(100)).toBe('100.0%')
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('округляет до одного знака', () => {
    expect(formatPercent(33.333)).toBe('33.3%')
    expect(formatPercent(33.36)).toBe('33.4%')
  })

  it('форматирует отрицательный процент', () => {
    expect(formatPercent(-5)).toBe('-5.0%')
    expect(formatPercent(-33.36)).toBe('-33.4%')
  })

  it('возвращает «—» для нечисловых значений', () => {
    expect(formatPercent(Number.NaN)).toBe('—')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—')
    expect(formatPercent(Number.NEGATIVE_INFINITY)).toBe('—')
  })
})

describe('formatDate', () => {
  it('форматирует ISO-дату в ДД.ММ.ГГГГ', () => {
    expect(formatDate('2024-01-15')).toBe('15.01.2024')
  })

  it('игнорирует время', () => {
    expect(formatDate('2024-01-15T10:30:00')).toBe('15.01.2024')
  })

  it('возвращает «—» для null и пустой строки', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('возвращает исходную строку для нераспознанного формата', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('не валидирует диапазоны (документируем текущее поведение)', () => {
    // Регэксп не проверяет корректность месяца/дня — переставляет как есть
    expect(formatDate('2024-13-45')).toBe('45.13.2024')
  })

  it('возвращает строку как есть, если числа однозначные', () => {
    // Требуются ровно две цифры — '2024-1-5' не матчится
    expect(formatDate('2024-1-5')).toBe('2024-1-5')
  })
})
