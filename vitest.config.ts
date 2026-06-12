import { defineConfig } from 'vitest/config'

// Юнит-тесты чистой логики (форматирование, расчёты) — без окружения Nuxt.
// Осознанное отклонение от эталона aida/docs/ci.md (@nuxt/test-utils +
// happy-dom): для чистых функций окружение 'node' быстрее и достаточно.
// Для тестов composables/компонентов потребуется миграция на @nuxt/test-utils.
//
// globals не включаем — describe/it/expect импортируются в тестах явно
// (дружелюбнее к IDE и tsconfig, не нужен vitest/globals в types).
export default defineConfig({
  test: {
    environment: 'node',
    // Помимо app/ ловим тесты в корневом tests/ — иначе CI молча пропустит их.
    include: ['app/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts']
  }
})
