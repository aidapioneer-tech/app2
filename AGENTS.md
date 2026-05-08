# AGENTS.md — aida-money-demo

Контекст для AI-агентов и разработчиков, продолжающих этот проект. Прочти весь файл прежде чем что-то менять.

## Что это

Облачное Битрикс24-приложение во вкладке карточки сделки (`CRM_DEAL_DETAIL_TAB`). Показывает финансовую сводку: план / факт оплаты, очищенный от НДС доход, расходы по подрядчикам, маржу. Заменяет устаревший UI «Деньги по сделке» из мокапа (Брестский мясокомбинат, 14046.93 / 14046.94 + три подрядчика).

Стек: Nuxt 4 + `@bitrix24/b24jssdk-nuxt` + `@bitrix24/b24ui-nuxt`. Базовый шаблон — [`bitrix24/templates-dashboard`](https://github.com/bitrix24/templates-dashboard).

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
│   ├── useB24.ts                 — оригинал из шаблона, не трогали
│   └── useDealMoney.ts           — единственный REST-вызов
├── components/Money/
│   ├── Client.vue                — экран клиентской сделки (cat 2)
│   ├── Contractor.vue            — экран сделки подряда (cat 3)
│   ├── Header.vue                — шапка с числами + прогресс-бар
│   ├── PaymentsTable.vue         — 7-колоночная таблица платежей
│   ├── ContractorBlock.vue       — раскрывающийся блок одного подряда
│   ├── ParentClientCard.vue      — карточка-ссылка на родителя (для contractor view)
│   ├── Totals.vue                — нижний блок ПЛАН / ФАКТ
│   └── format.ts                 — formatMoney/formatPercent/formatDate
├── types/index.d.ts              — типы DealMoneyResponse и Co
└── utils/index.ts                — sleepAction
i18n/
├── i18n.ts                       — только { ru }
└── locales/ru.json               — единственная локаль
```

## Колонки таблицы платежей (`PaymentsTable.vue`)

| # | Колонка | Поле | План/факт | Заметки |
|---|---|---|---|---|
| 1 | Тип | `type` | план | `prepay` / `postpay` через `paySystemId === 9` |
| 2 | Сумма | `factNet` | **факт** | без НДС, из распределений 1044 |
| 3 | НДС | `factVat` | **факт** | НДС от факт-распределённого |
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
| Тип платежа | `paySystemId === 9` ⇒ предоплата (повторяет `Constants::isPrePaySystem`) |
| Подряд-вкладка | Зеркальный экран + карточка клиентской сделки |
| Колонки дат | Две: «Срок» (план) и «Получено» (факт) |
| UF-миграции | НЕТ. `UF_CRM_13_DOC_DATE` и подобные — отменены |
| i18n | Только русский, переключателя нет |
| Layout | Только `clear` (`default.vue` удалён) |

## Что было удалено из шаблона `templates-dashboard`

- `app/layouts/default.vue` (левое меню)
- `app/pages/{customers,inbox,settings}.vue`, `app/pages/settings/`
- `app/components/{customers,inbox,home,settings,icons}/`
- `app/components/{NotificationsSlideover,UserMenu,AppLogo,AppTitle}.vue`
- `app/composables/{useDashboard.ts,useDealStats/}`
- `server/api/*` (4 mock-эндпоинта)
- `tools/translate.ui.ts`
- `.github/workflows/{ci,deploy}.yml` (template-specific, релизят на bitrix24.github.io)
- 18 локалей кроме `ru.json`
- Зависимости: `openai`, `tsx`, `luxon`, `@types/luxon`, `zod`, `@tanstack/*`, `@unovis/*` (последние два — TODO проверить, что не нужны для b24ui)

## Текущее состояние

✅ Backend controller написан, версия модуля бампнута.
✅ Frontend bootstrap + чистка завершены.
✅ Все компоненты Money/* созданы.
✅ Обе ветки запушены: `claude/money-demo-app-F1BU8` в обоих репо.

❌ **`pnpm install` / `pnpm build` НЕ запускались** — синтаксис Vue/TS не проверен. Возможны typo, неверные импорты компонентов из `@bitrix24/b24ui-nuxt`.
❌ REST-метод не тестировался — формулы и серверная логика не проверены на реальных данных.
❌ Числа из мокапа (Брестский мясокомбинат: 23411.56 / 15361.25 / 10007.50) не сверены.

## Известные дыры в коде

1. **Permissions не проверяются** в DealMoney.php — `$factory->getItem($dealId)` тянет сделку без фильтра по правам пользователя. Заменить на `getItemsFilteredByPermissions(['filter'=>['=ID'=>$dealId]])` или использовать `getUserPermissions()->canRead()`.
2. **SP 1044 / 1036 без права-фильтра** — если у юзера нет доступа к SmartProcess, упадёт.
3. **Permission-фильтр на подрядчиках** — `ClientData::getPodradDealDataList()` уже фильтрует через `getItemsFilteredByPermissions`, но проверить что fallback на отсутствующие сделки корректный.
4. **`useDealMoney.ts` обработка errors** — REST `B24Frame.callMethod` возвращает `AjaxResult`. У него есть `.getErrorByCode()` или подобное; сейчас errors попадут в `data` как-есть, и парсинг через `result?.result` может молча отдать undefined. Проверить.
5. **`isOverdue` в PaymentsTable.vue** считает `today.toISOString()` в локальной зоне — для пограничных случаев в timezone ≠ UTC может ошибаться на день.
6. **Currency mismatch** — клиент BYN, подрядчик в USD/EUR/RUB? Сейчас totals считаются арифметически без конверсии. `AData::getPaymentsSum` имеет конверсию через `CCurrencyRates::ConvertCurrency`, но `buildPaymentRows` в новом controller — нет. Проверить и при необходимости добавить.

## Конвенции кода

- **PHP**: declare(strict_types=1), namespace `\Shef\ReportBuilder\Controllers`, наследоваться от `\Bitrix\Main\Engine\Controller`. Action назван `getAction()` чтобы REST-метод был `dealMoney.get`.
- **TS/Vue**: Composition API, `<script setup lang="ts">`. Без emoji в UI. Числа форматировать через `formatMoney` (split + space-separator). Без `replace('белорусских рублей', 'бел. руб')` костыля.
- **i18n**: только `ru`. Все тексты в шаблонах захардкожены — i18n-ключи можно не использовать.
- **Стили**: tailwind utility classes + `@bitrix24/b24ui-nuxt` компоненты (`B24Card`, `B24Badge`, `B24Progress`, `B24Skeleton`, `B24Alert`). CSS-переменные дизайн-системы — `var(--ui-text-muted)`, `var(--ui-bg-elevated)`, `var(--ui-color-accent-main-success/alert)`.
- **Цветовой код**: только зелёный (получено / оплачено), красный (просрочено), серый (ожидание / muted). Без других акцентов.

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
- Не дублировать формулы прибыли в TS — всё считает сервер.
- Не звать `crm.item.payment.list` / `crm.item.list(1044)` напрямую с фронта — есть один эндпоинт.

## Ссылки на исходники документации

- Архитектурный анализ: `aida/bitrix/modules/shef.aidapioneerby/docs/ui-deal-money.md`
- Сводка по облачным приложениям: `aida/bitrix/modules/shef.aidapioneerby/docs/apps-overview.md`
- Опорные классы: `aida/bitrix/modules/shef.aidapioneerby/lib/integration/shef/deal/{adata,clientdata,podraddata}.php`
- Константы: `aida/bitrix/modules/shef.aidapioneerby/lib/main/constants.php`
