#!/usr/bin/env bash
# Прогон юнит-тестов проекта (Linux/macOS).
# Цель: одна команда — установить зависимости и выполнить тесты.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> pnpm test"
pnpm test
