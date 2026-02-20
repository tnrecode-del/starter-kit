# V4 PRODUCTION OVERHAUL — Решения и обоснования

**Дата:** 2026-02-19
**Автор:** Claude Opus 4.6 analysis + production rewrite

---

## 📊 Что изменилось: сводка

| Файл                         | Статус       | Ключевое изменение                                    |
| ---------------------------- | ------------ | ----------------------------------------------------- |
| `package.json`               | 🔄 Rewritten | +8 новых зависимостей, удалены устаревшие             |
| `types.ts`                   | 🆕 New       | Единый source of truth для всех типов                 |
| `sub_agents_config.ts`       | 🔄 Rewritten | Раздельное pricing, model routing, thinking budgets   |
| `orchestrator_v4.ts`         | 🔄 Rewritten | Gemini routing, retry, caching, 24/7, circuit breaker |
| `mcp_framework_v4.ts`        | 🔄 Rewritten | Real MCP SDK вместо stubs                             |
| `vector_store.ts`            | 🆕 New       | ChromaDB для persistent context                       |
| `task_queue.ts`              | 🆕 New       | BullMQ для 24/7 autonomous processing                 |
| `telegram_bot_handler.ts`    | 🔄 Fixed     | MarkdownV2, max retry, escaping                       |
| `regression_testing_v4.ts`   | 🔄 Fixed     | Real pixelmatch, proper Playwright API                |
| `IMPLEMENTATION_GUIDE_V3.md` | 🗑 Delete    | Заменён на 00_START_HERE.txt v4                       |
| `AGENT_COST_OPTIMIZER.md`    | 🗑 Delete    | Стратегия встроена в sub_agents_config.ts             |
| `orchestrator_v3.ts`         | 🗑 Delete    | Заменён на orchestrator_v4.ts                         |
| `mcp_framework_v3.ts`        | 🗑 Delete    | Заменён на mcp_framework_v4.ts                        |
| `regression_testing_v3.ts`   | 🗑 Delete    | Заменён на regression_testing_v4.ts                   |

---

## 🔬 Детальные обоснования решений

### 1. TYPES.TS — Единый источник типов

**Проблема v3:** Типы были разбросаны по файлам и дублировались. `FeatureRequest` определялся в orchestrator, `SubAgentConfig` в sub_agents_config, а `MCPTool` в mcp_framework. Нет единого pricing model.

**Решение v4:** Один файл `types.ts` экспортирует все интерфейсы. Включает:

- `MODEL_PRICING` — точные цены Anthropic на февраль 2026 (input/output/cache раздельно)
- `loadConfig()` — типобезопасная загрузка env переменных
- Все типы для агентов, MCP, Vector Store, Queue, Telegram

**Почему:** В 2026 TypeScript best practice — strict mode с единым types barrel file. Это предотвращает drift между модулями и делает рефакторинг безопасным.

---

### 2. PRICING — Раздельный input/output вместо flat rate

**Проблема v3:**

```typescript
// v3 — неправильно:
tokenPricePerMillion: 3.0; // $3 per 1M tokens — это цена ТОЛЬКО input Sonnet
```

Реальные цены Sonnet: $3/MTok input, $15/MTok output. Output в 5x дороже input. v3 занижала реальные расходы в 2-3 раза.

**Решение v4:**

```typescript
export const MODEL_PRICING = {
  haiku: { input: 0.25, output: 1.25, cacheRead: 0.025 },
  sonnet: { input: 3.0, output: 15.0, cacheRead: 0.3 },
  opus: { input: 15.0, output: 75.0, cacheRead: 1.5 },
};
```

Функция `calculateCost()` считает input, output, cache read, и thinking tokens раздельно.

**Почему:** Без точного pricing невозможно предсказать бюджет. При 20 features/month ошибка в 2x означает $40 вместо $20.

---

### 3. MODEL ROUTING — Haiku для простых, Opus только для Architect

**Проблема v3:** Все агенты кроме Architect использовали Sonnet. Frontend UI для простой формы и Backend API для complex payment system получали одну модель.

**Решение v4:** Каждый агент имеет `modelByComplexity`:

```typescript
// Frontend UI:
modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" }

// Architect:
modelByComplexity: { simple: "sonnet", medium: "opus", complex: "opus" }
```

Плюс **динамический downgrade** при давлении бюджета:

- При 90% бюджета: opus → sonnet
- При 95% бюджета: sonnet → haiku

**Почему:** Haiku стоит в 12x дешевле Sonnet для input и в 12x для output. Для простой login формы Haiku даёт адекватное качество при радикальной экономии. Это тренд 2026 — "model routing" вместо "one model fits all".

---

### 4. PROMPT CACHING — 90% экономия на system prompts

**Проблема v3:** Каждый вызов агента отправлял полный system prompt как новый input. При 7 агентах × 20 features = 140 вызовов с одинаковыми system prompts.

**Решение v4:**

```typescript
const systemBlocks = [
  {
    type: "text",
    text: agentConfig.systemPrompt,
    cache_control: { type: "ephemeral" },
  },
];
```

Anthropic prompt caching (стабильно с 2025): первый вызов стоит полную цену, все последующие читают из cache за 10% стоимости input.

**Экономия:** При 140 вызовах в месяц и ~500 token system prompt per agent:

- Без кэша: 140 × 500 × $3/MTok = $0.21 только на system prompts
- С кэшем: 7 × 500 × $3.75/MTok + 133 × 500 × $0.30/MTok = $0.033
- **Экономия: 84%** на system prompt costs

---

### 5. EXTENDED THINKING — Budget Caps вместо unlimited

**Проблема v3:** `useSequentialThinking: true` без лимита. Extended thinking может генерировать 50K+ thinking tokens, каждый billing по output rate.

**Решение v4:**

```typescript
// Architect — максимум 16K thinking tokens:
thinkingBudgetTokens: 16_000;

// Backend API — максимум 8K:
thinkingBudgetTokens: 8_000;

// Frontend UI — 0 (отключено):
thinkingBudgetTokens: 0;
```

**Почему:** 16K thinking tokens на Opus = $1.20. Без cap один вызов Architect мог стоить $3-5. С cap — предсказуемый максимум.

---

### 6. MCP FRAMEWORK — Real SDK вместо stubs

**Проблема v3:** 13 "MCP серверов" были TypeScript объектами с описаниями. `callTool()` возвращал `{ success: true }`. Это не MCP.

**Решение v4:** Используется `@modelcontextprotocol/sdk` с реальными транспортами:

```typescript
// Stdio transport для локальных инструментов:
new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
});

// HTTP transport для удалённых сервисов:
new StreamableHTTPClientTransport(new URL("http://localhost:5432"));
```

4 реальных MCP сервера вместо 13 stubs:

- **filesystem-mcp-server** — чтение/запись файлов (заменяет 6 stubs)
- **postgres-mcp-server** — SQL запросы к PostgreSQL
- **git-mcp-server** — git operations
- **playwright-mcp-server** — browser automation для тестов

**Lazy loading с connection pooling:** Сервер подключается при первом запросе и переиспользуется. Нет 50KB context waste от загрузки всех tools upfront.

**Tool definitions передаются в Claude API:** `getToolDefinitions()` возвращает массив tool schemas, который идёт прямо в параметр `tools` при вызове `messages.create()`.

---

### 7. VECTOR STORE — ChromaDB для persistent context

**Проблема v3:** Vector DB упоминался в документации но отсутствовал в коде. Без него невозможно:

- Сохранить контекст между сессиями
- Найти похожие паттерны для экономии
- Восстановить state после crash/restart

**Решение v4:** ChromaDB (open-source vector database):

```typescript
// Сохранение checkpoint:
await vectorStore.saveCheckpoint({
  featureId: "FEAT-001",
  agentId: "backend-api",
  content: generatedCode,
  metadata: { title: "User Auth", complexity: "medium" },
});

// Поиск похожих паттернов:
const similar = await vectorStore.findSimilarPatterns(
  "backend-api",
  "JWT authentication with refresh tokens",
  3, // top-3 results
  0.7, // min similarity
);
```

**Три коллекции на агента + sessions + features:**

- Агентские коллекции хранят code checkpoints для pattern reuse
- Sessions хранят state для crash recovery
- Features хранят историю для batch learning

**Почему ChromaDB:** Open-source, simple API, embedded mode для dev + client/server для prod. Не требует managed service. В 2026 это де-факто стандарт для lightweight vector storage.

---

### 8. TASK QUEUE — BullMQ для 24/7

**Проблема v3:** `main()` обрабатывал одну фичу и завершался. Нет queue, нет scheduler, нет persistence.

**Решение v4:** BullMQ (Redis-backed job queue):

```typescript
// Добавить фичу в очередь:
await queue.addFeature(feature, { priority: "high" });

// Запланировать batch на ночь (Anthropic Batch API = 50% скидка):
await queue.scheduleForOffPeak(features);

// Worker обрабатывает по одной фиче (контроль затрат):
concurrency: 1,
limiter: { max: 5, duration: 3_600_000 }, // max 5 features/hour
```

**Features:**

- Priority-based processing (critical первыми)
- Auto retry с exponential backoff
- Job persistence — Redis переживает restarts
- Batch grouping для similar features
- Rate limiting — max 5 features/hour
- Queue monitoring через `getStats()`

---

### 9. RETRY + CIRCUIT BREAKER

**Проблема v3:** Один `try/catch` без retry. API errors (rate limit, timeout) = сразу failed.

**Решение v4:**

- **3 retry attempts** с exponential backoff (1s, 2s, 4s)
- **Circuit breaker** при 5 consecutive failures — останавливает все вызовы на 30 секунд
- **Budget guard** — отказ от фичи если monthly budget исчерпан
- **Graceful shutdown** — SIGINT/SIGTERM сохраняют state в Vector DB

---

### 10. GEMINI ROUTING — Orchestrator через Gemini

**Проблема v3:** `GoogleGenerativeAI` импортировался но никогда не вызывался. Все 7 агентов шли через Claude.

**Решение v4:** Orchestrator tasks → Gemini 2.0 Flash:

```typescript
if (task.agent === "orchestrator") {
  return await this.dispatchToGemini(task, startTime);
}
```

**Почему Gemini для orchestrator:**

- 1M token context window (vs 200K Claude) — видит всю картину
- Значительно дешевле для task decomposition
- Orchestrator не генерирует код — ему не нужна Sonnet code quality
- Google AI Studio free tier / бонус покрывает orchestrator costs

---

### 11. TELEGRAM — MarkdownV2 + Max Retry

**Проблема v3:**

1. `parse_mode: "Markdown"` — deprecated, ломает форматирование с special characters
2. Retry добавлял failed message обратно в queue без max attempts → infinite loop
3. Нет escaping для MarkdownV2 special characters

**Решение v4:**

- `parse_mode: "MarkdownV2"` с proper escaping функцией
- Max 3 retries per message, потом drop
- Rate limit: 100ms между сообщениями (safe margin для Telegram 30/sec limit)
- HTTP 429 handling с `Retry-After` header

---

### 12. REGRESSION TESTING — Real Visual Diff

**Проблема v3:**

1. `detectVisualRegression()` всегда возвращал `{ detected: false }`
2. `createBrowserContext()` — deprecated Playwright API
3. Нет baseline storage, нет pixel comparison

**Решение v4:**

- **pixelmatch** — pixel-level screenshot comparison
- Baseline screenshots хранятся в `.regression-baselines/`
- Первый run = создаёт baseline, последующие = сравнивают
- Diff images сохраняются для visual inspection
- Severity classification: >5% = high, >1% = medium, <1% = low
- Параллельное выполнение тестов (chunks по 2)
- `browser.newContext()` вместо deprecated API

---

## 🗑 Файлы для удаления

Следующие файлы из v3 заменены и должны быть удалены:

1. `IMPLEMENTATION_GUIDE_V3.md` → заменён на `00_START_HERE.txt` (v4)
2. `AGENT_COST_OPTIMIZER.md` → стратегия встроена в `sub_agents_config.ts` + `types.ts`
3. `orchestrator_v3.ts` → заменён на `orchestrator_v4.ts`
4. `mcp_framework_v3.ts` → заменён на `mcp_framework_v4.ts`
5. `regression_testing_v3.ts` → заменён на `regression_testing_v4.ts`
6. Старый `sub_agents_config.ts` → заменён на новый
7. Старый `telegram_bot_handler.ts` → заменён на новый
8. Старый `package.json` → заменён на новый

---

## 📈 Ожидаемый Impact

| Метрика                 | v3                | v4                             | Улучшение            |
| ----------------------- | ----------------- | ------------------------------ | -------------------- |
| Cost accuracy           | ±200%             | ±15%                           | Предсказуемый бюджет |
| Cost per simple feature | $0.14 (estimated) | $0.02-0.05 (Haiku + cache)     | 3-7x дешевле         |
| Cost per medium feature | $0.45 (estimated) | $0.15-0.25 (cached Sonnet)     | 2-3x дешевле         |
| MCP integration         | Stubs             | Real SDK                       | Functional           |
| Context persistence     | None              | ChromaDB                       | ∞ session survival   |
| 24/7 operation          | Single run        | BullMQ queue                   | Autonomous           |
| Error handling          | Crash on fail     | 3 retries + circuit breaker    | Resilient            |
| Visual regression       | Placeholder       | pixelmatch                     | Real detection       |
| Model routing           | Static            | Dynamic by complexity + budget | Cost-optimal         |
