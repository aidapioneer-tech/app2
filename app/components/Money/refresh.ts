import type { InjectionKey, Ref } from 'vue'

/**
 * Контракт «обновить данные», который страница (`pages/index.vue`) прокидывает
 * вниз по дереву через provide/inject. Кнопка обновления живёт в шапке
 * (`Header.vue`), а сам перезапрос и подгонка высоты фрейма — на странице.
 */
export interface MoneyRefresh {
  /** Перезапросить данные с сервера и перерисовать экран. */
  refresh: () => Promise<void>
  /** Идёт ли сейчас запрос — для состояния кнопки (loader/disabled). */
  busy: Ref<boolean>
}

export const moneyRefreshKey: InjectionKey<MoneyRefresh> = Symbol('moneyRefresh')
