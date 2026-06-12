#!/usr/bin/env bash
# Прогон всех проверок проекта одним запуском: lint -> typecheck -> build (+ test, если есть).
# Зеркалит CI (.github/workflows/ci.yml): build = pnpm generate (статическая сборка).
# Не останавливается на первой ошибке: прогоняет всё и печатает сводку в конце.
# Запуск:  bash scripts/check.sh      (из любой директории)
set -u
cd "$(dirname "$0")/.." || exit 1

fail=0
run() {
  echo ""
  echo "=== $1 ==="
  if eval "$2"; then
    echo "[OK] $1"
  else
    echo "[FAIL] $1"
    fail=1
  fi
}

run "lint"      "pnpm lint"
run "typecheck" "pnpm typecheck"
run "build"     "pnpm generate"

# test — только если в package.json объявлен script "test"
if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts.test ? 0 : 1)" 2>/dev/null; then
  run "test" "pnpm test"
fi

echo ""
if [ "$fail" -eq 0 ]; then
  echo "=== ИТОГ: всё зелёное [OK] ==="
else
  echo "=== ИТОГ: есть ошибки [FAIL] ==="
fi
exit $fail
