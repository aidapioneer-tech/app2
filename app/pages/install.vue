<script setup lang="ts">
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { ProgressProps } from '@bitrix24/b24ui-nuxt'
import { ref, onMounted } from 'vue'
import { useB24 } from '~/composables/useB24'
import { sleepAction } from '~/utils'

definePageMeta({ layout: 'clear' })

useHead({ title: 'Установка приложения' })

const toast = useToast()
const confetti = useConfetti()
const b24Instance = useB24()

const stepCaption = ref<string>('Подождите...')
const progressColor = ref<ProgressProps['color']>('air-primary')
const progressValue = ref<null | number>(null)

const PLACEMENT = 'CRM_DEAL_DETAIL_TAB'
const PLACEMENT_TITLE = `[${import.meta.dev ? 'dev' : 'prod'}Sh] Деньги`

async function bindPlacement($b24: B24Frame, appUrl: string): Promise<void> {
  const handler = appUrl.replace(/\/$/, '') + '/'
  await $b24.callBatch([
    {
      method: 'placement.unbind',
      params: {
        PLACEMENT
      }
    },
    {
      method: 'placement.bind',
      params: {
        PLACEMENT,
        HANDLER: handler,
        TITLE: PLACEMENT_TITLE
      }
    }
  ])
}

function getBaseUrl(): string {
  const url = new URL(window.location.href)
  url.pathname = url.pathname.replace(/\/install\/?$/, '/')
  return url.origin + url.pathname
}

onMounted(async () => {
  try {
    const $b24 = b24Instance.get() as B24Frame
    await $b24.parent.setTitle('Установка приложения')

    stepCaption.value = 'Регистрация вкладки в карточке сделки...'
    progressValue.value = 50

    // const config = useRuntimeConfig()
    const appUrl = getBaseUrl()
    await bindPlacement($b24, appUrl)

    stepCaption.value = 'Готово'
    progressColor.value = 'air-primary-success'
    progressValue.value = 100
    confetti.fire()
    await sleepAction(2000)

    await $b24.installFinish()
  } catch (error: unknown) {
    console.error(error)
    toast.add({
      title: 'Ошибка установки',
      description: error instanceof Error ? error.message : String(error),
      color: 'air-primary-alert'
    })
  }
})
</script>

<template>
  <B24DashboardPanel
    id="install"
    :b24ui="{ body: 'p-4 sm:pt-4 items-center justify-center gap-2 scrollbar-transparent' }"
  >
    <template #body>
      <B24Progress
        v-model="progressValue"
        size="xs"
        animation="elastic"
        :color="progressColor"
        class="w-1/2 sm:w-1/3"
      />
      <div class="mt-6 flex flex-col items-center justify-center gap-2">
        <ProseH1 class="text-nowrap mb-0">
          Установка приложения
        </ProseH1>
        <ProseP small accent="less">
          {{ stepCaption }}
        </ProseP>
      </div>
    </template>
  </B24DashboardPanel>
</template>
