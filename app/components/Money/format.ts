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
  // Округляем до копеек через Math.round(x*100)/100 (а не сразу toFixed),
  // чтобы округление не зависело от реализации toFixed. Всегда 2 знака —
  // приложение работает с BYN/USD/EUR (валюты без копеек тут не нужны).
  const fixed = (Math.round(value * 100) / 100).toFixed(2)
  const [int, dec] = fixed.split('.')
  const intSpaced = (int ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${intSpaced},${dec} ${currency}`
}

/**
 * Форматирует число как процент с одним знаком после запятой.
 *
 * @param value - значение В ПРОЦЕНТАХ (не доля): передавать `33.3`, а не `0.333`;
 *   нечисловые значения дают `'—'`. Отрицательные допустимы (`-5` → `'-5.0%'`)
 * @returns строка вида `'20.0%'` (разделитель — точка), либо `'—'` для невалидного значения
 *
 * @example
 * formatPercent(33.333) // '33.3%'
 * formatPercent(-5) // '-5.0%'
 * formatPercent(Infinity) // '—'
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${(Math.round(value * 10) / 10).toFixed(1)}%`
}

/**
 * Форматирует ISO-дату в `ДД.ММ.ГГГГ`. Берёт только дату, время игнорируется.
 *
 * @param iso - дата в формате `YYYY-MM-DD` (возможно с временем), `null` или пустая строка
 * @returns `ДД.ММ.ГГГГ`; `'—'` для `null`/пустой строки; исходную строку,
 *   если формат не распознан. Диапазоны НЕ валидируются: `'2024-13-45'` →
 *   `'45.13.2024'` (ожидается корректная ISO-дата с бэкенда)
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
