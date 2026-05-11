<script setup lang="ts">
const isLoading = inject<Ref<boolean>>('isLoading', ref(false))
</script>

<template>
  <HomeLoader v-if="isLoading" />
  <B24DashboardGroup v-else unit="px" storage="local">
    <slot />
  </B24DashboardGroup>
</template>
