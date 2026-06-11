/**
 * Форматирует денежную сумму: разделитель тысяч — пробел, дробная часть —
 * запятая, всегда два знака после запятой, в конце код валюты.
 *
 * @param value - сумма; нечисловые значения (`NaN`, `Infinity`) дают `'—'`
 * @param currency - код валюты, по умолчанию `'BYN'`
 * @returns строка вида `'1 234,56 BYN'`, либо `'—'` для невалидного значения
 *
 * @example
 * formatMoney(1234.56) // '1 234,56 BYN'
 * formatMoney(-500.5, 'USD') // '-500,50 USD'
 * formatMoney(NaN) // '—'
 */
export function formatMoney(value: number, currency = 'BYN'): string {
  if (!Number.isFinite(value)) return '—'
  const fixed = (Math.round(value * 100) / 100).toFixed(2)
  const [int, dec] = fixed.split('.')
  const intSpaced = (int ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${intSpaced},${dec} ${currency}`
}

/**
 * Форматирует число как процент с одним знаком после запятой.
 *
 * @param value - значение процента; нечисловые значения дают `'—'`
 * @returns строка вида `'20.0%'`, либо `'—'` для невалидного значения
 *
 * @example
 * formatPercent(33.333) // '33.3%'
 * formatPercent(Infinity) // '—'
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${(Math.round(value * 10) / 10).toFixed(1)}%`
}

/**
 * Форматирует ISO-дату в `ДД.ММ.ГГГГ`. Берёт только дату, время игнорируется.
 *
 * @param iso - дата в формате `YYYY-MM-DD` (возможно с временем) или `null`
 * @returns `ДД.ММ.ГГГГ`; `'—'` для `null`/пустой строки; исходную строку,
 *   если формат не распознан
 *
 * @example
 * formatDate('2024-01-15T10:30:00') // '15.01.2024'
 * formatDate(null) // '—'
 */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}
