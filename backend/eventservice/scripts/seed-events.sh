#!/usr/bin/env bash
# Заполняет БД EventService тестовыми ивентами (как во фронтовых моках).
# Запуск из backend/eventservice:
#   ./scripts/seed-events.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/seed-events.mjs
