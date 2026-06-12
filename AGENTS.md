# AGENTS.md — aida-app-money

_Last reviewed: 2026-06-12_

Контекст для AI-агентов и разработчиков, продолжающих этот проект. Прочти весь файл прежде чем что-то менять.

## Что это

Облачное Битрикс24-приложение во вкладке карточки сделки (`CRM_DEAL_DETAIL_TAB`). Показывает финансовую сводку: план / факт оплаты, очищенный от НДС доход, расходы по подрядчикам, маржу. Заменяет устаревший UI «Деньги по сделке» из мокапа (Брестский мясокомбинат, 14046.93 / 14046.94 + три подрядчика).

Стек: Nuxt 4 + `@bitrix24/b24jssdk-nuxt` ^1.1.0 + `@bitrix24/b24ui-nuxt` ^2.7.1. Базовый шаблон — [`bitrix24/templates-dashboard`](https://github.com/bitrix24/templates-dashboard).

## Связка двух репозиториев

| Репо | Роль | Что в ветке `claude/money-demo-app-F1BU8` |
|---|---|---|
| **`aidapioneer-tech/aida`** | Битрикс24-коробка, источник данных и REST-action | Новый controller `local/modules/shef.reportbuilder/lib/controllers/dealmoney.php`. Версия `shef.reportbuilder` поднята до 0.0.2. |
| **`aidapioneer-tech/app2`** *(этот репо)* | Cloud Nuxt-app для встройки | Полностью переделан из шаблона: один экран Деньги, два режима (клиент / подрядчик). |

REST-метод-связка: `shef:reportbuilder.api.dealMoney.get(dealId)` → JSON для всего экрана. **Один вызов** на отрисовку — никакой клиентской агрегации.

## Архитектура связей CRM (опорная карта)

```
Сделка клиента (Deal, categoryId=2)
  ├── Order.Payment[]            ← план прихода (datePayBefore, sum, paySystemId)
  │     └── 1044.opportunity      ← факт распределения по этому payment
  │           (filter: ufCrm13PaymentId = paymentId)
  │           └── parentId1036 → 1036 cat 14 (банк-приход)
  │                 └── ufCrm11Date — фактическая дата прихода
  └── UF_CRM_DEAL_CLIENT_WORK ←── Сделка подряда (Deal, categoryId=3, value="D_<clientDealId>")
        ├── Order.Payment[]      ← план расхода
        │     └── 1044.opportunity ← факт выплаты
        │           └── parentId1036 → 1036 cat 16 (банк-расход)
        │                 └── ufCrm11Date
        └── companyId, title
```

Константы (источник: `aida/.../Constants`):
- SP `1036` = «[SH] Оплаты», cat **14** приходы / **16** расходы
- SP `1044` = «[sh] Оплаты — распределения»
- Deal cat **2** — клиент, **3** — подряд
- `paySystemId === 9` ⇒ предоплата, иначе постоплата

## Формулы (реализованы серверно в DealMoney.php)

```
profitPlan  = (Σ clientPlanGross / (1 + tax/100)) − Σ contractorsPlanTotal
profitFact  = (Σ clientFactGross / (1 + tax/100)) − Σ contractorsFactTotal
marginPlan% = profitPlan / planIncomeNet × 100
marginFact% = profitFact / factIncomeNet × 100
```

`tax` — `AData::getTaxProc()` (per-deal, ставка первого товара; fallback 20).

**Главная инвариантная мысль**: распределения 1044 = «деньги фактически пришли/ушли». Без них `factTotal=0`, `dateReceived=null`, маржа факт = 0.

## Контракт REST-ответа

Полный TS-тип в `app/types/index.d.ts → DealMoneyResponse`. Кратко:

```ts
{
  mode: 'client' | 'contractor',
  deal: { id, title, companyTitle, categoryId, currencyId, taxRate, ... },
  parentClientDeal: ParentClientDeal | null,   // только для contractor
  payments: PaymentRow[],                       // план + факт по каждому Order.Payment
  contractors: ContractorBlock[] | null,        // только для client
  totals: {
    plan: { incomeGross, incomeNet, expenseTotal, profit, marginPercent },
    fact: { incomeGross, incomeNet, expenseTotal, profit, marginPercent },
    progress: { incomeReceivedPercent, expensePaidPercent }
  }
}
```

`PaymentRow` хранит план и факт **раздельно**: `planTotal/planNet/planVat` против `factTotal/factNet/factVat`. UI потом раскладывает их по колонкам.

## Структура app2

```
app/
├── app.vue                       — корневой layout, B24 init
├── pages/
│   ├── index.vue                 — entry, по placement+categoryId роутит на Client/Contractor
│   └── install.vue               — placement.bind для CRM_DEAL_DETAIL_TAB
├── layouts/
│   └── clear.vue                 — единственный layout (без сайдбара!)
├── composables/
│   ├── useB24.ts                 — на основе шаблона; init() возвращает InitResult (ready/no-frame/error)
│   └── useDealMoney.ts           — единственный REST-вызов
├── components/Money/
│   ├── Client.vue                — экран клиентской сделки (cat 2)
│   ├── Contractor.vue            — экран сделки подряда (cat 3)
│   ├── Header.vue                — шапка: 3 метрики + кнопка «Обновить» (presentation-only)
│   ├── headerMetrics.ts          — buildHeaderMetrics() + тип HeaderMetric (метрики шапки по mode)
│   ├── refresh.ts                — InjectionKey + тип контракта «обновить данные» (provide/inject)
│   ├── PaymentsTable.vue         — 7-колоночная таблица платежей
│   ├── ContractorBlock.vue       — блок одного подряда (без аккордеона, цветной акцент по статусу)
│   ├── ParentClientCard.vue      — карточка-ссылка на родителя (для contractor view)
│   ├── Totals.vue                — нижний блок ПЛАН / ФАКТ (СКРЫТ из вёрстки, формулы оставлены)
│   └── format.ts                 — formatMoney/formatPercent/formatDate
├── types/index.d.ts              — типы DealMoneyResponse и Co
└── utils/index.ts                — sleepAction
i18n/
├── i18n.ts                       — только { ru }
└── locales/ru.json               — единственная локаль
```

## Колонки таблицы платежей (`PaymentsTable.vue`)

| # | Колонка | Источник | План/факт | Заметки |
|---|---|---|---|---|
| 1 | Тип | `type` | план | `prepay` / `postpay` через `paySystemId === 9` |
| 2 | Сумма | `calcPlanNet(row)` | **план** | без НДС; если `planNet > 0` — берём из бэкенда, иначе вычисляем client-side |
| 3 | НДС | `calcPlanVat(row)` | **план** | НДС; если `planVat > 0` — берём из бэкенда, иначе вычисляем client-side. Если `taxRate = 0` — 0 |
| 4 | Всего | `planTotal` | план | с НДС; зелёный когда `isFullyPaid` |
| 5 | К оплате | `leftToPay` | производное | красный когда просрочено |
| 6 | Срок | `dateDue` | план | `Order.Payment.datePayBefore` |
| 7 | Получено | `dateReceived` | **факт** | max(`1036.UF_CRM_11_DATE`); зелёный |

**Колонка «По документам» из старого мокапа удалена** — данных per-payment нет.

## Что зафиксировано в архитектурных решениях

| Вопрос | Решение |
|---|---|
| Где считаем | Серверно, `shef.reportbuilder` (фасад над `shef.aidapioneerby`) |
| НДС | `AData::getTaxProc()` — первый товар сделки, fallback 20 |
| НДС fallback на фронте | `calcPlanVat/calcPlanNet` в `PaymentsTable.vue`: если бэкенд не вернул `planVat`/`planNet` (> 0), считаем client-side. Временно до [Issue #7](https://github.com/aidapioneer-tech/app2/issues/7). |
| НДС = 0 → не выдумывать | Бизнес-правило клиента: если `taxRate = 0` или не передан — НДС = 0, не пересчитываем. |
| taxRate цепочка | `DealHeader.taxRate` → `Client.vue` / `Contractor.vue` → `PaymentsTable`; `ContractorBlock.taxRate` → `ContractorBlock.vue` → `PaymentsTable` |
| Навигация к подряду | `ContractorBlock.vue → openDeal()` → `$b24.slider.openPath($b24.slider.getUrl("/crm/deal/details/{id}/"))` |
| Шапка (Header) | Presentation-only: получает `title/subtitle/metrics[]`. Метрики формирует `headerMetrics.ts → buildHeaderMetrics(totals, currency, mode)` (единая точка правды). Клиент: Сумма сделки (с НДС) / Маржинальность / Доход (без НДС). Подрядчик: Сумма расхода / Маржинальность / Доход (без НДС). Всё `totals.plan`. Без разделения план/факт, без прогресс-бара. |
| Кнопка «Обновить» | Контракт через provide/inject (`refresh.ts → moneyRefreshKey`). `index.vue` отдаёт `reloadAll` + `busy` (обёртка над `loading`); `Header.vue` инжектит и рисует `B24Button` (`:loading`+`:disabled` от busy). Повторный запрос не сбрасывает экран в скелетон (`v-if="loading && !data"` в `index.vue`). |
| Высота встройки | `index.vue → fitFrame()` меряет реальный контент-элемент (`contentEl` — div **без паддингов** внутри `B24DashboardPanel#body`, который тоже `p-0 sm:p-0`). Размер считает чистая функция `utils/frameSize.ts → computeFrameSize(el, viewportWidth)`: ширина = `documentElement.clientWidth` (фолбэк `scrollWidth`), высота = `ceil(scrollHeight × (100 + HEIGHT_BUFFER_PERCENT) / 100)`, `HEIGHT_BUFFER_PERCENT = 10` (+10% — иначе из-за хрома обёртки остаётся скролл; тюнится одним числом; целочисленно, чтобы не ловить float-артефакт `× 1.1`). Ставит явно `$b24.parent.resizeWindow(width, height)`; повтор теми же размерами пропускается (терминирует петлю ResizeObserver). **Почему не `fitWindow()`:** контент внутри dashboard-обёртки во весь вьюпорт с внутренним скроллом → `fitWindow()` (меряет документ) видит вьюпорт, а не контент; остаётся фолбэком. Вызов после `nextTick` + кадра, на initial/refresh и через `ResizeObserver` (debounce). `computeFrameSize` покрыта юнит-тестами. |
| Итоговый блок План/Факт | `Totals.vue` скрыт из `Client.vue`/`Contractor.vue` по решению владельца. Файл и формулы оставлены. Доработка формул трекается отдельным Issue. |
| Подрядчики (UI) | Без аккордеона — платежи всегда видны. Левый бордер-акцент по статусу (один computed `status` в `ContractorBlock.vue`: текст бейджа + цвет + accentClass). Токены: `--ui-color-accent-main-success` (оплачено) / `--ui-color-accent-main-warning` (частично) / `--ui-border` (не начато). В шапке блока: название подрядчика + ссылка на сделку (`block.title`) + бейдж. |
| Тип платежа | `paySystemId === 9` ⇒ предоплата (повторяет `Constants::isPrePaySystem`) |
| Подряд-вкладка | Зеркальный экран + карточка клиентской сделки |
| Колонки дат | Две: «Срок» (план) и «Получено» (факт) |
| UF-миграции | НЕТ. `UF_CRM_13_DOC_DATE` и подобные — отменены |
| i18n | Только русский, переключателя нет |
| Layout | Только `clear` (`default.vue` удалён) |

## Что было удалено из шаблона `templates-dashboard`

- `app/layouts/default.vue` (левое меню)
- `app/pages/{customers,inbox,settings}.vue`, `app/pages/settings/`
- `app/components/{customers,inbox,settings,icons}/` и `home/*` кроме `home/HomeLoader.vue` (loader оставлен — используется в `clear.vue`)
- `app/components/{NotificationsSlideover,UserMenu,AppLogo,AppTitle}.vue`
- `app/composables/{useDashboard.ts,useDealStats/}`
- `server/api/*` (4 mock-эндпоинта)
- `tools/translate.ui.ts`
- `.github/workflows/*` из шаблона (template-specific, релизят на bitrix24.github.io) — заменены своими `ci.yml` и `deploy.yml`
- 18 локалей кроме `ru.json`
- Зависимости: `openai`, `tsx`, `luxon`, `@types/luxon`, `zod`, `@tanstack/*`, `@unovis/*` (последние два — TODO проверить, что не нужны для b24ui)

## Конфигурация окружения (.env)

Файл `.env.example` — образец. Реальный `.env` в git не коммитится. Заполнять так:

```
NUXT_PUBLIC_SITE_URL=https://app.aidapioneer.by
NUXT_APP_BASE_URL=/money-info-a4f7
```

`siteUrl` собирается в `nuxt.config.ts` как `${NUXT_PUBLIC_SITE_URL}${NUXT_APP_BASE_URL}/` — это публичный URL приложения, под который раскатан билд.

### Правило формирования `NUXT_APP_BASE_URL` (для всех app-проектов)

Путь должен быть `/<purpose-slug>-<entropy>`, где:
- `purpose-slug` — короткое описание назначения (1-3 слова, через `-`): `money-info`, `upload-doc`, `deal-stats`, `payments-sync`.
- `entropy` — 3-5 случайных hex-символов чтобы избежать коллизий между приложениями на одном хостинге и не дать угадать пути сторонним.

Примеры: `/money-info-a4f7`, `/upload-doc-9f3d`, `/payments-sync-x7k2`.

Использовать одно и то же значение в `.env`, в URL установки приложения Битрикс24 и в URL раскатки на CDN.

## Требуемые scope-ы Битрикс24

При регистрации локального приложения в портале (раздел «Разработчикам»):

| Scope | Зачем |
|---|---|
| `placement` | Регистрация вкладки `CRM_DEAL_DETAIL_TAB` через `placement.bind` / `placement.unbind` (в `install.vue`). |
| `shef.reportbuilder` | Вызов кастомного REST-метода `shef:reportbuilder.api.dealMoney.get` (модуль `shef.reportbuilder` в репо `aida`). |

`crm`, `user_brief` в коробке не обязательны — все данные приходят через серверный action, который сам ходит в `\Bitrix\Crm\*` под правами текущего юзера.

## Текущее состояние

✅ Backend controller написан, версия модуля бампнута, PR смержен в `aida/main`.
✅ Frontend bootstrap + чистка + все компоненты Money/* созданы.
✅ REST-метод протестирован на портале: `BX.ajax.runAction('shef:reportbuilder.api.dealMoney.get', { data: { dealId: 129 } })` возвращает корректный JSON, числа сходятся.
✅ Frontend запускается локально (`pnpm dev`) — пользователь подтвердил.
✅ CI/CD deploy workflow добавлен (`.github/workflows/deploy.yml`) — pnpm + rsync, lint/typecheck, backup, smoke test.
✅ CI workflow добавлен (`.github/workflows/ci.yml`) — lint/typecheck/test/build на каждый PR в `main`. Чтобы CI блокировал мерж, в Settings репозитория включить защиту ветки `main` (Required status checks: `Lint & Typecheck`, `Tests`, `Build`).

❌ Числа из исходного мокапа (Брестский мясокомбинат: 23411.56 / 15361.25 / 10007.50) ещё не сверены на полном UI.
❌ Cat 3 (подрядчик-вью) не проверена end-to-end.
❌ Permission-фильтр в DealMoney.php — TODO.
❌ Деплой не активен: нужно создать ветку `main` и настроить GitHub Secrets/Variables + сервер (см. `.github/workflows/deploy.yml` — чек-лист в заголовке файла).

## Известные дыры в коде

1. **Permissions не проверяются** в DealMoney.php — `$factory->getItem($dealId)` тянет сделку без фильтра по правам пользователя. Заменить на `getItemsFilteredByPermissions(['filter'=>['=ID'=>$dealId]])` или использовать `getUserPermissions()->canRead()`.
2. **SP 1044 / 1036 без права-фильтра** — если у юзера нет доступа к SmartProcess, упадёт.
3. **Permission-фильтр на подрядчиках** — `ClientData::getPodradDealDataList()` уже фильтрует через `getItemsFilteredByPermissions`, но проверить что fallback на отсутствующие сделки корректный.
4. ~~**`useDealMoney.ts` обработка errors**~~ — ✅ закрыто (PR #29): миграция на `actions.v2.call.make` + проверка `response.isSuccess` + `getErrorMessages()`; `getData()?.result` с guard на пустой результат. Покрыто тестами `useDealMoney.test.ts`.
5. **`isOverdue` в PaymentsTable.vue** считает `today.toISOString()` в локальной зоне — для пограничных случаев в timezone ≠ UTC может ошибаться на день.
6. **Currency mismatch** — клиент BYN, подрядчик в USD/EUR/RUB? Сейчас totals считаются арифметически без конверсии. `AData::getPaymentsSum` имеет конверсию через `CCurrencyRates::ConvertCurrency`, но `buildPaymentRows` в новом controller — нет. Проверить и при необходимости добавить.
7. **НДС fallback** — `calcPlanVat`/`calcPlanNet` в `PaymentsTable.vue` считают client-side пока бэкенд не возвращает `planVat`/`planNet`. Убрать client-side логику после закрытия [Issue #7](https://github.com/aidapioneer-tech/app2/issues/7).

## Конвенции проекта

### Код

- **PHP**: `declare(strict_types=1)`, namespace `\Shef\ReportBuilder\Controllers`, наследоваться от `\Bitrix\Main\Engine\Controller`. Action назван `getAction()` чтобы REST-метод был `dealMoney.get`.
- **TS/Vue**: Composition API, `<script setup lang="ts">`. Без emoji в UI. Числа форматировать через `formatMoney` (split + space-separator). Без `replace('белорусских рублей', 'бел. руб')` костыля.
- **REST-вызовы**: `b24.actions.v2.call.make<T>({ method, params })` (restApi:v2) — актуальный API. `b24.callMethod()` помечен `@deprecated`, удаляется в 2.0.0. Проверять `response.isSuccess`, данные брать из `response.getData()?.result`.
- **Импорты типов** (из b24ui): `import type { X }` — отдельной строкой от рантайм-импортов. Так уже написаны компоненты Money/*.
- **Дефолты пропсов** (из b24ui): для опциональных пропсов с рантайм-значением — `withDefaults()`; для документации значения — JSDoc `@defaultValue`. (Прим.: `effectiveTaxRate` сейчас нормализует `taxRate?` вручную — при рефакторе можно перейти на `withDefaults`.)
- **Конвенциональные коммиты** (из b24ui): `type(Scope): описание` — `feat(money): …`, `fix(Header): …`, `refactor(backend): …`. Скоуп — модуль/компонент.
- **Доступность (a11y)**: интерактив — на нативных элементах (`<button type="button">`, не клики на `<div>`); сохранять видимый фокус. Образцы — кнопка «Обновить» в `Header.vue`, ссылка на сделку в `ContractorBlock.vue`.
- **i18n**: только `ru`. Все тексты в шаблонах захардкожены — i18n-ключи можно не использовать.
- **Стили**: tailwind utility classes + `@bitrix24/b24ui-nuxt` компоненты (`B24Card`, `B24Badge`, `B24Progress`, `B24Skeleton`, `B24Alert`). CSS-переменные дизайн-системы — `text-(--ui-text-muted)`, `bg-(--ui-bg-elevated)`, `text-(--ui-color-accent-main-success/alert)`. _Прим.:_ b24ui рекомендует семантические утилити-классы (`text-default`, `bg-elevated`) — если появятся в апгрейде пакета, предпочитать их синтаксису `*-(--ui-*)`.
- **Цветовой код**: только зелёный (получено / оплачено), красный (просрочено), серый (ожидание / muted). Без других акцентов. **Исключение**: левый бордер блока подрядчика для статуса «Частично» — оранжевый (`--ui-color-accent-main-warning`), как статус-индикатор (не декоративный акцент).

### Тестирование

- **Vitest** — модульные тесты для чистой логики: `format.ts`, `headerMetrics.ts`, и подобные извлечённые функции (например, маппинг статуса подрядчика). Чистую логику выносить из `.vue` в `.ts` — так она тестируется без монтирования.
- **Компоненты** — `@vue/test-utils`: рендер по props/inject и ключевое поведение (напр. кнопка «Обновить» дёргает inject; `ContractorBlock` рендерит платежи без аккордеона). Где уместно — snapshot- и a11y-проверки (из b24ui).
- **Запуск**: `pnpm test` (разовый) / `pnpm test:watch`; полный прогон — `scripts/check.sh` (Linux) и `scripts/check.ps1` (Windows). Цель скриптов — один запуск отдаёт результат, без ручного набора команд.

### Зависимости

- Версии `@bitrix24/b24ui-nuxt`, `@bitrix24/b24jssdk`, `@bitrix24/b24jssdk-nuxt`, `@bitrix24/b24icons-vue` — **всегда актуальные**. Не пинить.
- При апгрейде b24-пакетов проверять имена иконок: в b24icons 2.7 организация изменилась — для интерактивных стрелок использовать `actions/*`, для контурных — `outline/*`. Постфикс `L` (`ChevronRightLIcon`) — large-вариант.
- Тяжёлые b24-зависимости попадают в `vite.optimizeDeps.include` (`nuxt.config.ts`) — иначе dev-старт долгий. Текущий список: `b24icons-vue/main/CloudErrorIcon`, `b24jssdk`. При добавлении новых b24-импортов с медленным первым resolve — расширять.

### URL и base path

- Билд приложения **переносим между окружениями** — не должен зависеть от хардкоженных URL. Развёртывание управляется двумя env-переменными (см. секцию «Конфигурация окружения»):
  - `NUXT_PUBLIC_SITE_URL` — хост.
  - `NUXT_APP_BASE_URL` — sub-path (`/<purpose-slug>-<entropy>`).
- В рантайме базовый URL определяется из `window.location`, не из `runtimeConfig.public.siteUrl`. Так живут и dev (ngrok-тоннель с непредсказуемым хостом), и prod без пересборки. Хелпер `getBaseUrl()` в `install.vue` — образец.

### Установка / placement

- Установка приложения **идемпотентна**: `callBatch([placement.unbind, placement.bind])` всегда переустанавливает. Не проверяем «есть ли уже». Если URL или title изменились — всё равно подхватим.
- **Mock-режим в install.vue не делаем** — приложение всегда работает только во встройке Битрикс24. Если фрейм недоступен, страница ошибки, а не имитация. Тестируем через dev-портал.
- `PLACEMENT_TITLE` всегда содержит маркер `[devSh]` / `[prodSh]` через `import.meta.dev` — чтобы dev- и prod-вкладки сосуществовали на одном портале без путаницы. `Sh` = Shef (вендорный префикс, согласован с серверной частью: `shef.aidapioneerby`, `[sh] Оплаты`, и т.п.). Использовать во всех app-ах вендора.

### UX / lifecycle

- B24 init не моментальный. Корневой layout (`app/layouts/clear.vue`) **обязан показывать loader** пока `isLoading === true`. Канал — `provide('isLoading')` в `app/app.vue` → `inject('isLoading')` в layout. Loader — `app/components/home/HomeLoader.vue` (центрованный `LoaderClockIcon` на `h-screen`).
- Пустой экран до инициализации = баг.

## Как локально разрабатывать

```bash
# в app2
pnpm install
pnpm dev               # http://localhost:3000

# проверки
pnpm lint
pnpm typecheck
pnpm build
```

REST-метод можно дёрнуть из консоли битрикс-портала где установлен модуль:
```js
BX24.callMethod('shef:reportbuilder.api.dealMoney.get', { dealId: 12345 }, r => console.log(r))
```

## Что НЕ делать

- Не добавлять UF в SP 1044 (`UF_CRM_13_DOC_DATE` и подобные) — было отменено пользователем.
- Не возвращать колонку «По документам» — это рудимент старого мокапа.
- Не возвращать левое меню / сайдбар.
- Не делать переключатель языка / dark-mode / settings — экран одностраничный.
- Не дублировать формулы **прибыли** в TS — всё считает сервер. (Исключение: НДС-fallback в `PaymentsTable.vue` — временная мера, убрать после Issue #7.)
- Не выдумывать НДС: если `taxRate = 0` или не передан — НДС = 0. Бизнес-правило клиента, подтверждено в issue #1.
- Не звать `crm.item.payment.list` / `crm.item.list(1044)` напрямую с фронта — есть один эндпоинт.
- Не возвращать mock/демо-режим в `install.vue` (конвенция вендора).
- Не использовать `runtimeConfig.public.siteUrl` для определения собственного URL в рантайме — брать из `window.location`.
- Не оптимизировать `placement.bind` через предварительную проверку существования — всегда unbind+bind.

## Ссылки на исходники документации

- Архитектурный анализ: `aida/bitrix/modules/shef.aidapioneerby/docs/ui-deal-money.md`
- Сводка по облачным приложениям: `aida/bitrix/modules/shef.aidapioneerby/docs/apps-overview.md`
- Опорные классы: `aida/bitrix/modules/shef.aidapioneerby/lib/integration/shef/deal/{adata,clientdata,podraddata}.php`
- Константы: `aida/bitrix/modules/shef.aidapioneerby/lib/main/constants.php`
