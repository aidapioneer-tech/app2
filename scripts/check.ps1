# Прогон всех проверок проекта одним запуском: lint -> typecheck -> build (+ test, если есть).
# Не останавливается на первой ошибке: прогоняет всё и печатает сводку в конце.
# Запуск:  powershell -ExecutionPolicy Bypass -File scripts\check.ps1
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")

$script:fail = 0
function Run-Step($name, [scriptblock]$cmd) {
  Write-Host ""
  Write-Host "=== $name ==="
  & $cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] $name"
    $script:fail = 1
  } else {
    Write-Host "[OK] $name"
  }
}

Run-Step "lint"      { pnpm lint }
Run-Step "typecheck" { pnpm typecheck }
Run-Step "build"     { pnpm build }

# test — только если в package.json объявлен script "test" (Vitest появится по Issue #9)
$pkg = Get-Content -Raw package.json | ConvertFrom-Json
if ($pkg.scripts.test) {
  Run-Step "test" { pnpm test }
}

Write-Host ""
if ($script:fail -eq 0) {
  Write-Host "=== ИТОГ: всё зелёное [OK] ==="
} else {
  Write-Host "=== ИТОГ: есть ошибки [FAIL] ==="
  exit 1
}
