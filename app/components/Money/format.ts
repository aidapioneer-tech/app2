export function formatMoney(value: number, currency = 'BYN'): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2)
  const [int, dec] = fixed.split('.')
  const intSpaced = (int ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${intSpaced},${dec} ${currency}`
}

export function formatPercent(value: number): string {
  return `${(Math.round(value * 10) / 10).toFixed(1)}%`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}
