import { defineConfig } from 'vitest/config'

// Юнит-тесты чистой логики (форматирование, расчёты) — без окружения Nuxt.
// Для тестов composables/компонентов позже можно добавить @nuxt/test-utils.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['app/**/*.{test,spec}.ts'],
    globals: true
  }
})
