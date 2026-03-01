# V4 Autonomous Agent — Readiness Analysis & Implementation Plan

> Date: 2026-03-01
> Branch: main (post-merge)
> Analyzed by: Claude Sonnet 4.6 + 3 parallel explore agents

---

## TL;DR

**Текущая зрелость: 6.5/10 — "Работает, но не автономен"**

Система умеет запускать 5-фазный пайплайн, трекать расходы и отправлять Telegram-уведомления.
Но она **генерирует код как текст** и не применяет его в репо. Агенты не могут использовать MCP-инструменты (нет tool-use loop). Две очереди (Prisma + BullMQ) не координируются.

**С P0-фиксами (model routing) → экономия 3-5× в стоимости за месяц.**
**С P1-фиксами (tool-use loop) → система становится действительно автономной.**

---

## Что Реально Работает

### Полностью реализовано

```
orchestrator_v4.ts (1274 строки)
  ├── Phase 0:   Spec generation   → Gemini 2.5 Pro
  ├── Phase 1:   Architect review  → Claude Opus (extended thinking, 16k budget)
  ├── Phase 1.5: Context manager   → Dynamic skill briefing
  ├── Phase 2:   Parallel agents   → frontend-ui, frontend-bizlogic, backend-api, backend-database
  └── Phase 3:   QA testing        → Playwright + Vitest

Инфраструктура:
  ✅ Circuit breaker (5 отказов → 30s пауза)
  ✅ Retry с exponential backoff
  ✅ Budget tracking (Redis, monthly TTL)
  ✅ Dynamic model downgrade (>90% budget → sonnet, >95% → haiku)
  ✅ ChromaDB vector checkpoints
  ✅ Telegram notifications с rate limiting
  ✅ Git branching per feature
  ✅ MCP framework с lazy loading
```

### Реальные точки входа

**Entry 1:** `packages/ai-agents/src/main.ts` → `orchestrator.runLoop()` → поллит **Prisma FeatureQueue**

**Entry 2:** `packages/ai-agents/src/queue-main.ts` → BullMQ Worker → слушает **Redis queue**

> ⚠️ Они не знают друг о друге. Риск двойной обработки одной задачи.

---

## Критические Блокеры Автономии

### ❌ Блокер 1: Нет Tool-Use Loop

Claude может вернуть `{"type": "tool_use", "name": "write_file", ...}`.
Но в `dispatchAgent()` нет обработки tool_use ответов.

**Следствие:** Агенты не могут физически писать файлы, читать схему БД или запускать тесты через MCP. Это фундаментальный разрыв — система спроектирована под MCP, но MCP-вызовы не исполняются.

**Где фиксить:** `packages/ai-agents/src/orchestrator_v4.ts` → `dispatchAgent()`

```typescript
// Нужно добавить:
while (response.stop_reason === 'tool_use') {
  const toolUses = response.content.filter(b => b.type === 'tool_use');
  const toolResults = await Promise.all(
    toolUses.map(tu => mcpClient.callTool(tu.name, tu.input))
  );
  response = await anthropic.messages.create({
    ...params,
    messages: [...messages, { role: 'assistant', content: response.content },
               { role: 'user', content: toolResults }]
  });
}
```

---

### ❌ Блокер 2: Код Генерируется но Не Применяется

Агенты возвращают TSX/SQL/test-code как markdown-текст.
Оркестратор сохраняет это в `FeatureQueue.resultData` (String).
Никто не пишет файлы на диск.

**Что нужно:** После Phase 2 — парсить `resultData` по агентам, применять через filesystem MCP:
```
architect output  → skip (только review)
frontend-ui       → apps/web/src/...
frontend-bizlogic → apps/web/src/...
backend-api       → apps/api/src/...
backend-database  → packages/database/prisma/...
qa-testing        → apps/web/tests/... или packages/ai-agents/tests/
```

---

### ❌ Блокер 3: Две Очереди Без Координации

| | Prisma runLoop | BullMQ Worker |
|--|--|--|
| Источник задач | `db.featureQueue` WHERE status=PENDING | Redis `feature-processing` queue |
| Кто добавляет | `seed-feature.ts`, UI `/admin/new` | `FeatureQueue.addJob()` |
| Проблема | Не знает о BullMQ задачах | Не обновляет Prisma статус |

**Решение:** Единая точка входа. Рекомендуется **BullMQ как master queue** + Prisma только для UI/reporting.

---

## Проблема Стоимости (P0 — Критично)

### Текущий model routing

| Агент | Текущая модель | Рекомендуемая | Экономия |
|-------|---------------|---------------|---------|
| frontend-ui | Claude Sonnet (default) | Gemini Pro | ~4× |
| frontend-bizlogic | Claude Sonnet | Gemini Pro | ~4× |
| backend-api | Claude Gemini-Pro ✅ | Уже OK | — |
| backend-database | Claude Gemini-Pro ✅ | Уже OK | — |
| qa-testing | Gemini Flash ✅ | Уже OK | — |
| architect | Claude Opus ✅ | Нужен Opus | — |
| context-manager | Claude Sonnet | Gemini Flash | ~10× |

> По данным `docs/ai/kimi 2.5/kimi 2.5 thinking analysis.md`: $0.13/feature при неоптимальном routing.
> С Gemini для frontend агентов: ~$0.04-0.07/feature.

---

## Состояние DB Схемы vs Спеки

Спека v4 (`docs/v4/db-schema/execution-logs.md`) описывает 46-полей таблицу.
Реализовано ~8 полей (15-20% покрытие).

### Что Missing в Prisma

| Категория | Spec fields | Статус |
|-----------|------------|--------|
| Timing (started_at, duration_ms) | 3 поля | ❌ Нет |
| Code metrics (files_created, lines_added) | 8 полей | ❌ Нет |
| Quality (type_errors_before/after, security_flags) | 6 полей | ❌ Нет |
| Architect approval tracking | 3 поля | ❌ Нет |
| Per-agent metrics (agent_execution_metrics table) | отдельная таблица | ❌ Нет |
| Role-specific metrics (ArchitectMetrics, BackendAPIMetrics) | JSON interfaces | ❌ Нет |

> Полный анализ: `docs/v4/interface metrics/`

---

## Рекомендуемый Приоритет Работ

### P0 — 2-4 часа (немедленная экономия денег)

```
□ Переключить frontend-ui: gemini-flash (simple), gemini-pro (medium), sonnet (complex)
□ Переключить context-manager: haiku → gemini-flash
  Файл: packages/ai-agents/src/sub_agents_config.ts
  Экономия: 3-5× на feature cost
```

### P1 — 1-2 дня (делает систему реально автономной)

```
□ Реализовать tool-use execution loop в dispatchAgent()
  Файл: packages/ai-agents/src/orchestrator_v4.ts

□ Добавить code application после Phase 2
  Новый файл: packages/ai-agents/src/code_applicator.ts
  Парсит resultData по агентам → пишет файлы через filesystem MCP
```

### P2 — 2-3 дня (унификация + наблюдаемость)

```
□ Объединить две очереди в одну BullMQ-based систему
  Убрать Prisma runLoop, BullMQ worker как единственный процессинг

□ Добавить auth RBAC (текущий feat-6)
  NestJS Guard для role-based access
  Фикс: auth.login больше не присваивает всем ADMIN
```

### P3 — 3-5 дней (когнитивная автономия)

```
□ Реализовать Task Graph (динамический DAG)
  Не запускать backend-database если feature чисто фронтовая
  Файл: packages/ai-agents/src/task_graph.ts

□ Failure Memory в ChromaDB
  Отдельная коллекция: "failure-patterns"
  При ошибке → semantic search → контекст для retry

□ Tier-based QA: MVP (unit only) / Beta (unit+e2e) / Production (full)
```

### P4 — 1+ неделя (масштабирование)

```
□ Extended ExecutionLog (46 полей по спеке)
  Новая Prisma модель ExecutionLog с timing, code metrics, security

□ Self-repair loop
  execute → test → fail → analyze → patch → re-test

□ Concurrency scale-up (concurrency: 1 → 3-5)
```

---

## Файлы для Следующей Сессии

При работе с автономным агентом открывать в порядке:

1. `docs/project-status.md` — текущее состояние, known issues
2. `docs/ai-agents-reference.md` — 8 агентов, фазы, pricing
3. `packages/ai-agents/src/orchestrator_v4.ts` — основной оркестратор
4. `packages/ai-agents/src/sub_agents_config.ts` — конфиг агентов
5. `packages/ai-agents/src/types.ts` — типы и MODEL_PRICING
6. `docs/plans/2026-03-01-v4-autonomous-agent-readiness.md` — этот документ

---

## Docs Classification Map

```
docs/
├── 🟢 БЫСТРЫЙ КОНТЕКСТ (читать первым в новой сессии)
│   ├── project-status.md             ← git, готово, bugs, стек
│   ├── database-schema.md            ← 5 моделей Prisma
│   ├── api-reference.md              ← tRPC + REST
│   ├── ai-agents-reference.md        ← 8 агентов, фазы, BullMQ
│   └── frontend-components.md        ← UI виджеты, shared
│
├── 🔵 АРХИТЕКТУРА (при планировании новых фич)
│   ├── architecture.md               ← FSD, DDD принципы
│   ├── starter-kit-implementation.md ← Turborepo workspace
│   └── next-steps.md                 ← roadmap v5
│
├── 🟡 AI ИССЛЕДОВАНИЯ (при работе с агентами/оркестратором)
│   └── ai/
│       ├── orchestrator_initialization_report.md  ← boot инструкции
│       ├── kimi 2.5/kimi 2.5 thinking analysis.md ← P0 model routing
│       ├── opus/opus_4.6_review_on_kimi's.md      ← Task DAG план
│       ├── opus/summary on gpt.md                 ← GPT 5.2 оценка 8.5/10
│       ├── gpt/deep-research-report.md             ← сравнение моделей
│       └── gpt/v5_cognitive_agent_platform_report.md
│
├── 🟠 ПЛАНЫ РЕАЛИЗАЦИИ
│   └── plans/
│       └── 2026-03-01-v4-autonomous-agent-readiness.md  ← ЭТОТ ФАЙЛ
│
└── 🔴 АРХИВ V4 СПЕКИ (справка, не актуальна как задача)
    └── v4/
        ├── db-schema/execution-logs.md     ← 46-полей таблица (не реализована)
        ├── interface metrics/              ← TypeScript интерфейсы агентов
        ├── metrics/*.csv                  ← KPI таблицы
        └── ai/                            ← дубли /docs/ai/ (игнорировать)
```

---

## Итоговая Оценка

| Критерий | Оценка | Обоснование |
|---------|--------|-------------|
| Инфраструктура запуска | 9/10 | Daemon, Redis, ChromaDB, BullMQ — всё работает |
| Pipeline execution | 7/10 | 5 фаз реализованы, но code не применяется |
| Cost efficiency | 4/10 | Все агенты на дорогом Claude, Gemini недоиспользован |
| Tool execution | 2/10 | Нет tool-use loop — MCP интеграция декоративная |
| Observability | 3/10 | 15% от spec'd метрик в БД |
| Autonomy | 4/10 | Требует человека для apply кода |
| **Overall** | **6.5/10** | **Хорошая база, критические дыры в автономии** |

**Вывод:** Система НЕ готова к автономной работе без P1-фиксов (tool-use loop + code application).
С P0 (model routing) — экономия $30-60/месяц при среднем использовании.
С P1 — настоящая автономия, минимум ручного труда.
