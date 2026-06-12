#!/usr/bin/env bash
# Прогон юнит-тестов проекта (Linux/macOS).
# Цель: одна команда — установить зависимости и выполнить тесты.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v pnpm >/dev/null 2>&1 || { echo "pnpm не найден в PATH. Установите: https://pnpm.io/installation"; exit 1; }

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> pnpm test"
pnpm test
