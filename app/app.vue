<script setup lang="ts">
import type { ToasterProps } from '@bitrix24/b24ui-nuxt'
import { ref, provide, readonly } from 'vue'
import * as locales from '@bitrix24/b24ui-nuxt/locale'
import { sleepAction } from './utils'
import CloudErrorIcon from '@bitrix24/b24icons-vue/main/CloudErrorIcon'

const config = useRuntimeConfig()

const toast = useToast()
const b24Instance = useB24()
const { isBitrixMobile } = useDevice()

const isLoading = ref(true)
const toaster: ToasterProps = { position: isBitrixMobile.value ? 'bottom-center' : 'top-right' }

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: `${config.app.baseURL}favicon.ico?v=2` }
  ],
  htmlAttrs: { lang: 'ru', dir: 'ltr' }
})

const title = 'Деньги по сделке'
useSeoMeta({ title })

provide('isLoading', readonly(isLoading))

onMounted(async () => {
  const result = await b24Instance.init()

  if (result.status === 'error') {
    toast.add({
      title: 'Ошибка',
      description: result.message,
      color: 'air-primary-alert',
      icon: CloudErrorIcon
    })
  } else if (result.status === 'no-frame') {
    // Открыто вне фрейма Bitrix24 — это не сбой, а подсказка где открывать.
    toast.add({
      title: 'Откройте в Битрикс24',
      description: 'Приложение работает внутри портала Битрикс24 — на вкладке «Деньги» в карточке сделки.',
      color: 'air-primary-warning',
      icon: CloudErrorIcon
    })
  }

  await sleepAction(300)
  isLoading.value = false
})
</script>

<template>
  <B24App :toaster="toaster" :locale="locales.ru">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </B24App>
</template>
