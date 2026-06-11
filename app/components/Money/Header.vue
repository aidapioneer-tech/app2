<script setup lang="ts">
import { computed, inject } from 'vue'
import Refresh1Icon from '@bitrix24/b24icons-vue/actions/Refresh1Icon'
import { moneyRefreshKey } from './refresh'

interface HeaderMetric {
  label: string
  value: string
}

defineProps<{
  title: string
  subtitle: string
  /** Ключевые цифры шапки. Каждый блок — подпись + значение. */
  metrics: HeaderMetric[]
}>()

const refreshApi = inject(moneyRefreshKey, null)
const busy = computed(() => refreshApi?.busy.value ?? false)

function onRefresh(): void {
  refreshApi?.refresh()
}
</script>

<template>
  <B24Card :b24ui="{ body: 'p-5 flex flex-col gap-4' }">
    <template #default>
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-col gap-1 min-w-0">
          <span class="text-xs text-(--ui-text-muted) uppercase tracking-wide">{{ subtitle }}</span>
          <span class="text-lg font-medium truncate">{{ title }}</span>
        </div>

        <B24Button
          v-if="refreshApi"
          :icon="Refresh1Icon"
          color="air-secondary"
          size="sm"
          :loading="busy"
          class="shrink-0"
          @click="onRefresh"
        >
          Обновить
        </B24Button>
      </div>

      <div class="flex flex-wrap items-baseline gap-x-10 gap-y-3">
        <div v-for="m in metrics" :key="m.label" class="flex flex-col">
          <span class="text-xs text-(--ui-text-muted)">{{ m.label }}</span>
          <span class="text-2xl font-semibold tabular-nums">{{ m.value }}</span>
        </div>
      </div>
    </template>
  </B24Card>
</template>
