<script setup lang="ts">
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { ProgressProps } from '@bitrix24/b24ui-nuxt'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useB24 } from '~/composables/useB24'
import { sleepAction } from '~/utils'
import Market1Icon from '@bitrix24/b24icons-vue/main/Market1Icon'

definePageMeta({ layout: 'clear' })

useHead({ title: 'Установка приложения' })

const router = useRouter()
const toast = useToast()
const confetti = useConfetti()
const b24Instance = useB24()

const isUseB24 = computed<boolean>(() => b24Instance.isInit())

const stepCaption = ref<string>('Подождите...')
const progressColor = ref<ProgressProps['color']>('air-primary')
const progressValue = ref<null | number>(null)

const PLACEMENT = 'CRM_DEAL_DETAIL_TAB'
const PLACEMENT_TITLE = 'Деньги'

async function bindPlacement($b24: B24Frame, appUrl: string): Promise<void> {
  const handler = appUrl.replace(/\/$/, '') + '/'
  const existing = await $b24.callMethod('placement.get', {})
  const list = (existing.getData() as Array<{ placement: string, handler: string }>) || []
  const already = list.some(x => x.placement === PLACEMENT && x.handler === handler)

  if (already) return

  await $b24.callMethod('placement.bind', {
    PLACEMENT,
    HANDLER: handler,
    TITLE: PLACEMENT_TITLE
  })
}

onMounted(async () => {
  try {
    if (!isUseB24.value) {
      toast.add({
        id: 'install-warning-mock',
        title: 'Демо-режим',
        description: 'Откройте установку из карточки приложения Битрикс24.',
        icon: Market1Icon,
        color: 'air-primary-warning',
        duration: 0,
        close: false
      })
      stepCaption.value = 'Демо: пропускаем привязку placement'
      progressColor.value = 'air-primary-warning'
      progressValue.value = 99
      confetti.fire()
      await sleepAction(2000)
      toast.remove('install-warning-mock')
      return router.replace('/')
    }

    const $b24 = b24Instance.get() as B24Frame
    await $b24.parent.setTitle('Установка приложения')

    stepCaption.value = 'Регистрация вкладки в карточке сделки...'
    progressValue.value = 50

    const config = useRuntimeConfig()
    const appUrl = config.public.siteUrl || window.location.origin

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
