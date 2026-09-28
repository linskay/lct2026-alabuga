#!/usr/bin/env bash
# ==============================================================================
# Скрипт синхронизации репозитория в SourceCraft
# Использование:
#   SOURCECRAFT_TOKEN="ваш_токен" ./scripts/sync-to-sourcecraft.sh
# ==============================================================================
set -e

SOURCECRAFT_REPO="https://sourcecraft.dev/lct-hackaton-2026/case-19-negotiation-simulator-team-12.git"
DEFAULT_TOKEN="pv1_SH2v4115o58S2Y4sYxm3ysF94j4tKBub35p191Sl7yhK9uA4zf18R2cm36m2mQYV_1450995143"
TOKEN="${SOURCECRAFT_TOKEN:-${1:-$DEFAULT_TOKEN}}"

if [ -z "$TOKEN" ]; then
  echo "❌ Ошибка: Не указан токен доступа SourceCraft."
  echo "Использование:"
  echo "  SOURCECRAFT_TOKEN=\"your_token\" ./scripts/sync-to-sourcecraft.sh"
  echo "  или: ./scripts/sync-to-sourcecraft.sh <токен>"
  exit 1
fi

AUTH_REPO_URL="https://oauth2:${TOKEN}@sourcecraft.dev/lct-hackaton-2026/case-19-negotiation-simulator-team-12.git"

echo "🔄 Добавление удаленного репозитория sourcecraft..."
git remote remove sourcecraft 2>/dev/null || true
git remote add sourcecraft "$AUTH_REPO_URL"

echo "🚀 Отправка веток в SourceCraft..."
git push sourcecraft main --force

echo "🏷️ Отправка тегов в SourceCraft..."
git push sourcecraft --tags --force

echo "✅ Синхронизация завершена успешно!"
