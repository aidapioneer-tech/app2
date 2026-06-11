# Прогон юнит-тестов проекта (Windows, PowerShell).
# Цель: одна команда — установить зависимости и выполнить тесты.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host '==> pnpm install'
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '==> pnpm test'
pnpm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
