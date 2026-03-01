# docs/ — Navigation Index

> Структура документации starter-kit. Читать в порядке приоритета.

---

## 🟢 Быстрый контекст (читать первым в новой сессии)

| Файл | Содержание |
|------|-----------|
| [`project-status.md`](./project-status.md) | Git-состояние, что реализовано, known issues, tech stack |
| [`database-schema.md`](./database-schema.md) | 5 Prisma-моделей, поля, типы, seed данные |
| [`api-reference.md`](./api-reference.md) | tRPC процедуры + Next.js route handlers + NestJS REST |
| [`ai-agents-reference.md`](./ai-agents-reference.md) | 8 агентов, фазы выполнения, MCP, ценообразование, BullMQ |
| [`frontend-components.md`](./frontend-components.md) | Виджеты, фичи, shared UI, Recharts, i18n |

---

## 🔵 Архитектура (при планировании новых фич)

| Файл | Содержание |
|------|-----------|
| [`architecture.md`](./architecture.md) | FSD, DDD, AI Orchestration — принципы |
| [`starter-kit-implementation.md`](./starter-kit-implementation.md) | Turborepo, workspace пакеты, ESM |
| [`next-steps.md`](./next-steps.md) | Roadmap v5, чеклист запуска |

---

## 🟠 Планы реализации (текущие задачи)

| Файл | Содержание |
|------|-----------|
| [`plans/2026-03-01-v4-autonomous-agent-readiness.md`](./plans/2026-03-01-v4-autonomous-agent-readiness.md) | Анализ готовности v4, P0-P4 roadmap, docs classification |

---

## 🟡 Исследования AI-моделей (при работе с оркестратором)

Находятся в [`research/`](./research/):

| Файл | Модель | Ключевой вывод |
|------|--------|---------------|
| [`research/orchestrator_initialization_report.md`](./research/orchestrator_initialization_report.md) | — | Как запустить v4, решение dependency issues |
| [`research/kimi-2.5/kimi 2.5 thinking analysis.md`](./research/kimi-2.5/) | Kimi 2.5 | **P0: переключить frontend агентов на Gemini** — 3-5× экономия |
| [`research/opus/opus_4.6_review_on_kimi's_analysis.md`](./research/opus/) | Claude Opus 4.6 | Task DAG рекомендация, AutoForge 9/10 |
| [`research/opus/summary on gpt.md`](./research/opus/) | Claude Opus | GPT 5.2 оценил инфраструктуру 8.5/10 |
| [`research/gpt/deep-research-report.md`](./research/gpt/) | GPT | Сравнение моделей, риски Kimi API |
| [`research/gpt/v5_cognitive_agent_platform_report.md`](./research/gpt/) | GPT | V5 cognitive platform концепция |

---

## 🔴 Архив v4-спеки (справка, не актуальна как задача)

Находятся в [`archive/`](./archive/). Спека определяла ~15% реализовано:

| Папка / Файл | Содержание |
|-------------|-----------|
| [`archive/db-schema/execution-logs.md`](./archive/db-schema/) | 46-полей `execution_logs` таблица (не в Prisma) |
| [`archive/interface-metrics/`](./archive/interface-metrics/) | TypeScript интерфейсы: ArchitectMetrics, BackendAPIMetrics, TaskCodeMetrics и др. |
| [`archive/metrics/*.csv`](./archive/metrics/) | KPI таблицы: financial-roi, quality-gates, code-generation |
| `archive/alert-tresholds.csv` | Пороги алертов |
| `archive/dashboard-widgets.csv` | Виджеты дашборда v4 |

---

## Структура папок

```
docs/
├── INDEX.md                          ← этот файл
├── project-status.md                 ← 🟢
├── database-schema.md                ← 🟢
├── api-reference.md                  ← 🟢
├── ai-agents-reference.md            ← 🟢
├── frontend-components.md            ← 🟢
├── architecture.md                   ← 🔵
├── starter-kit-implementation.md     ← 🔵
├── next-steps.md                     ← 🔵
├── plans/                            ← 🟠
│   └── 2026-03-01-v4-autonomous-agent-readiness.md
├── research/                         ← 🟡
│   ├── orchestrator_initialization_report.md
│   ├── gpt/
│   ├── kimi-2.5/
│   └── opus/
└── archive/                          ← 🔴
    ├── db-schema/
    ├── interface-metrics/
    └── metrics/
```
