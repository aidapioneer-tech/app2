/**
 * Запас по высоте фрейма, в процентах (+10%). Измеренного `scrollHeight` контента
 * иногда не хватает (хром dashboard-обёртки, бордеры) — и остаётся внутренний скролл.
 *
 * Тюнинг: если после деплоя скролл возвращается — увеличить (12–15);
 * если внизу слишком большой пустой отступ — уменьшить (5).
 */
export const HEIGHT_BUFFER_PERCENT = 10

export interface FrameSize {
  width: number
  height: number
}

/**
 * Рассчитать размер встройки под контент:
 * - ширина: ширина вьюпорта (`viewportWidth`), фолбэк — ширина элемента;
 * - высота: `scrollHeight` + `HEIGHT_BUFFER_PERCENT`%, округление вверх.
 *
 * Процент считаем целочисленно (`× (100 + p) / 100`), а не `× 1.1` — иначе
 * float-артефакт (`100 × 1.1 = 110.00000000000001`) даёт лишний +1px после `ceil`.
 *
 * Возвращает `null`, если размеры невалидны (ещё нет layout) — вызывающий код
 * падает в фолбэк (`fitWindow`). Чистая функция — тестируется без монтирования.
 */
export function computeFrameSize(
  el: Pick<HTMLElement, 'scrollWidth' | 'scrollHeight'>,
  viewportWidth: number
): FrameSize | null {
  const width = viewportWidth > 0 ? viewportWidth : el.scrollWidth
  const height = Math.ceil(el.scrollHeight * (100 + HEIGHT_BUFFER_PERCENT) / 100)
  if (width <= 0 || height <= 0) return null
  return { width, height }
}
