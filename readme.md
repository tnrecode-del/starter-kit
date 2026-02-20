# Fullstack SaaS AI Starter Kit — Экспертная документация

> **Версия**: 1.0 | **Дата**: Февраль 2026 | **Автор**: Senior Full-Stack Engineer
>
> Документ ориентирован на разработчиков, использующих этот стартер для создания **AI-powered SaaS продуктов**.

---

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Монорепозиторий: структура и логика](#2-монорепозиторий-структура-и-логика)
3. [Технологический стек — почему именно эти инструменты](#3-технологический-стек--почему-именно-эти-инструменты)
4. [Поток данных (Data Flow)](#4-поток-данных-data-flow)
5. [Система аутентификации](#5-система-аутентификации)
6. [База данных и работа с данными](#6-база-данных-и-работа-с-данными)
7. [Разработка: локальная среда](#7-разработка-локальная-среда)
8. [Архитектура tRPC + NestJS](#8-архитектура-trpc--nestjs)
9. [Что уже реализовано](#9-что-уже-реализовано)
10. [Что нужно добавить для SaaS](#10-что-нужно-добавить-для-saas)
11. [Интеграция ИИ: дорожная карта](#11-интеграция-ии-дорожная-карта)
12. [Масштабирование и производительность](#12-масштабирование-и-производительность)
13. [Безопасность](#13-безопасность)
14. [Конвенции и качество кода](#14-конвенции-и-качество-кода)
15. [Деплой](#15-деплой)

---

## 1. Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│   Next.js 16 (App Router) · React 19 · TanStack Query · tRPC       │
│   Port: 3000                                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ tRPC over HTTP (httpBatchLink)
                             │ + httpOnly Cookie (JWT)
┌────────────────────────────▼────────────────────────────────────────┐
│                          API LAYER                                  │
│   NestJS 11 · Express 5 · tRPC Server · Passport-JWT               │
│   Port: 4000                                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Prisma ORM (pg adapter)
┌────────────────────────────▼────────────────────────────────────────┐
│                        DATABASE LAYER                               │
│   PostgreSQL 16 · Prisma 7 · Connection Pool via pg                 │
│   Port: 5432                                                        │
└─────────────────────────────────────────────────────────────────────┘

SHARED PACKAGES:
  @core/shared    — Zod схемы, TypeScript типы, утилиты, константы
  @core/trpc      — tRPC роутер (бизнес-логика API)
  @core/database  — Prisma клиент, сервис подключения
```

**Ключевые архитектурные решения:**

| Решение              | Обоснование                                                        |
| -------------------- | ------------------------------------------------------------------ |
| Монорепо (Turborepo) | Единый контроль типов, переиспользование кода, атомарные коммиты   |
| tRPC поверх REST     | E2E type safety без кодогенерации, RPC-семантика для SaaS операций |
| NestJS как хост      | Dependency Injection для AI-сервисов, модульная расширяемость      |
| Zod схемы в shared   | Единый источник истины для валидации на клиенте и сервере          |
| httpOnly JWT cookies | Безопасность от XSS-атак, прозрачная работа с tRPC                 |

---

## 2. Монорепозиторий: структура и логика

```
starter-kit/
├── apps/
│   ├── api/          ← NestJS API приложение (хост tRPC middleware)
│   └── web/          ← Next.js фронтенд
│
├── packages/
│   ├── trpc/         ← Роутеры, процедуры, контекст (БИЗНЕС-ЛОГИКА)
│   ├── database/     ← Prisma схема, клиент, сервис
│   ├── shared/       ← Zod схемы, типы, утилиты, константы
│   ├── config-eslint/← Единый ESLint конфиг
│   └── config-tailwind/← Единый Tailwind тема
│
├── brainstorming/    ← Экспериментальные идеи (MCP, Vector Store, etc.)
├── docker-compose.yml
├── turbo.json        ← Граф задач и кеширование
└── pnpm-workspace.yaml
```

### Почему такое разделение?

**`@core/trpc`** содержит роутеры и бизнес-логику — это сделано намеренно. Роутеры **не принадлежат** NestJS приложению, потому что:

- В будущем можно запустить tRPC на edge runtime (Cloudflare Workers)
- Тесты на бизнес-логику не требуют поднятия всего NestJS
- Можно переиспользовать роутеры в других приложениях монорепо

**`@core/shared`** имеет явные exports:

```json
"exports": {
  ".":        "./src/index.ts",
  "./types":  "./src/types/index.ts",
  "./schemas":"./src/schemas/index.ts",
  "./utils":  "./src/utils/index.ts",
  "./constants":"./src/constants/index.ts"
}
```

Это позволяет делать точечные импорты для tree-shaking, что критично когда shared вырастет до десятков файлов.

### Turborepo граф задач

```
db:generate ──► build ──► (deploy)
     │
     └──► dev (persistent)

lint ──────────────────────────────► (CI gate)
type-check ────────────────────────► (CI gate)
```

Turbo кеширует результаты задач. Если `schema.prisma` не изменился — `db:generate` берётся из кеша. Это ускоряет CI на 60-80%.

---

## 3. Технологический стек — почему именно эти инструменты

### Frontend

| Инструмент     | Версия  | Роль                                                    |
| -------------- | ------- | ------------------------------------------------------- |
| Next.js        | 16.1.1  | App Router, SSR/RSC, file-based routing                 |
| React          | 19.2.3  | UI, Concurrent Mode, Server Components                  |
| Tailwind CSS   | 4.1.18  | Utility-first CSS с CSS variables (v4 синтаксис)        |
| TanStack Query | 5.90.16 | Серверное состояние, кеширование, фоновая синхронизация |
| tRPC Client    | 11.0.0  | Type-safe RPC вызовы                                    |

> **Важно для AI SaaS**: TanStack Query идеально подходит для polling статуса AI задач, streaming результатов, отображения прогресса генерации.

### Backend

| Инструмент   | Версия  | Роль                                  |
| ------------ | ------- | ------------------------------------- |
| NestJS       | 11.1.11 | DI контейнер, модули, lifecycle hooks |
| tRPC Server  | 11.8.1  | Type-safe API процедуры               |
| Express      | 5.2.1   | HTTP адаптер для tRPC middleware      |
| Passport-JWT | 4.0.1   | JWT стратегия аутентификации          |
| Zod          | 3.24.1  | Runtime валидация входных данных      |

> **Важно для AI SaaS**: NestJS с DI позволяет легко инжектировать AI-сервисы (OpenAI, Anthropic, векторные базы) в любой роутер через стандартный `@Injectable()` паттерн.

### Database

| Инструмент         | Версия | Роль                           |
| ------------------ | ------ | ------------------------------ |
| Prisma             | 7.2.0  | ORM, миграции, генерация типов |
| PostgreSQL         | 16     | Основное хранилище             |
| pg (node-postgres) | 8.16.3 | Нативный PG драйвер            |
| @prisma/adapter-pg | 7.2.0  | Prisma адаптер для pg          |

> **Важно для AI SaaS**: PostgreSQL поддерживает `pgvector` для хранения embeddings. Это ключевой инструмент для RAG (Retrieval-Augmented Generation) приложений.

---

## 4. Поток данных (Data Flow)

### Стандартный запрос (read)

```
[Browser] → useQuery(trpc.users.getUsers)
    → tRPC httpBatchLink → POST /trpc/users.getUsers
    → [NestJS] Express middleware → createTRPCContext()
        → JWT из cookie → verify → prisma.user.findUnique()
        → контекст: { user: {...} }
    → [tRPC] usersRouter.getUsers.query()
        → prisma.user.findMany()
    → JSON ответ → TanStack Query cache
    → React ре-рендер
```

### Мутация (write)

```
[Browser] → useMutation(trpc.auth.login)
    → { email: "user@example.com" }
    → LoginInputSchema.parse() (Zod клиент)
    → POST /trpc/auth.login
    → [NestJS] createTRPCContext() (без авторизации, publicProcedure)
    → [tRPC] authRouter.login.mutation()
        → LoginInputSchema.parse() (Zod сервер, двойная валидация)
        → prisma.user.upsert()
        → jwt.sign({ userId, email })
        → res.cookie("token", jwt, httpOnlyOptions)
    → { success: true, user: {...} }
    → queryClient.setQueryData() (обновление кеша)
    → Header отображает email
```

---

## 5. Система аутентификации

### Текущая реализация

```
apps/api/src/
├── auth/
│   ├── auth.module.ts        ← Регистрирует JwtModule, JwtStrategy
│   └── jwt.strategy.ts       ← Passport стратегия (validate payload)
└── trpc/
    └── trpc.service.ts       ← Монтирует tRPC middleware на /trpc

packages/trpc/src/
├── context.ts                ← createTRPCContext: извлекает + верифицирует JWT
├── trpc.ts                   ← publicProcedure + protectedProcedure
└── router/
    └── auth.router.ts        ← login, me, logout процедуры
```

### Схема безопасности

```
Cookie: httpOnly=true, secure=(production), sameSite="lax", maxAge=24h
JWT: expires=7d, payload={ userId, email }
```

> **Внимание**: maxAge cookie (24h) и JWT expiry (7d) **не совпадают**. Рекомендуется привести к единому значению или реализовать refresh token логику.

### Что нужно добавить для production SaaS

```typescript
// 1. Refresh tokens (для длительных сессий)
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// 2. OAuth провайдеры (Google, GitHub)
// → рекомендуется Better-Auth или Auth.js v5

// 3. Email верификация (VerificationToken уже в схеме!)
// → таблица VerificationToken готова к использованию

// 4. Rate limiting на auth эндпоинты
// → @nestjs/throttler + Redis

// 5. Audit log (кто, когда, откуда зашёл)
```

---

## 6. База данных и работа с данными

### Текущая схема

```prisma
model User {
  id        String   @id @default(cuid())  // cuid2 безопаснее UUID
  email     String   @unique
  name      String?
  role      ROLE?    @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

enum ROLE {
  ADMIN
  USER
}
```

### Необходимые расширения для SaaS

```prisma
// Организации / Тенанты (multi-tenancy)
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      PLAN     @default(FREE)
  members   OrganizationMember[]
  createdAt DateTime @default(now())
}

model OrganizationMember {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           ORG_ROLE     @default(MEMBER)
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@unique([userId, organizationId])
}

// Подписки / Биллинг
model Subscription {
  id                   String   @id @default(cuid())
  organizationId       String   @unique
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  plan                 PLAN     @default(FREE)
  status               SUB_STATUS
  currentPeriodEnd     DateTime?
  organization         Organization @relation(fields: [organizationId], references: [id])
}

// AI Usage tracking (критично для cost management)
model AIUsageRecord {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  model          String   // "gpt-4o", "claude-3-5-sonnet"
  inputTokens    Int
  outputTokens   Int
  cost           Float    // в USD
  feature        String   // "chat", "document-analysis", etc.
  createdAt      DateTime @default(now())
}

enum PLAN { FREE STARTER PRO ENTERPRISE }
enum ORG_ROLE { OWNER ADMIN MEMBER }
enum SUB_STATUS { ACTIVE PAST_DUE CANCELED TRIALING }
```

### Работа с DatabaseService

```typescript
// packages/database/src/database.service.ts
// Текущая реализация использует глобальный singleton Prisma клиент
// Это правильно — избегает создания множественных connection pools

// Для AI SaaS добавьте:
// 1. Read replica для тяжёлых аналитических запросов
// 2. Connection pooling через PgBouncer или Prisma Accelerate
// 3. Soft deletes (deletedAt DateTime?) вместо hard delete
```

---

## 7. Разработка: локальная среда

### Быстрый старт

```bash
# 1. Клонировать и установить зависимости
git clone <repo>
cd starter-kit
pnpm install

# 2. Поднять PostgreSQL
docker-compose up -d

# 3. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env:
# DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
# JWT_SECRET="your-super-secret-key-min-32-chars"
# NODE_ENV="development"

# 4. Инициализировать базу данных
pnpm db:push        # Применить схему
pnpm db:generate    # Сгенерировать Prisma клиент

# 5. Заполнить тестовыми данными (seed)
# Создаёт admin@starter.kit / Admin User
cd packages/database && npx prisma db seed

# 6. Запустить всё в dev режиме
pnpm dev
# API:  http://localhost:4000
# Web:  http://localhost:3000
```

### Полезные команды разработки

```bash
# Просмотр базы данных в браузере
pnpm db:studio

# Проверка типов всего монорепо
pnpm type-check

# Линтинг
pnpm lint

# Форматирование
pnpm format

# Создать новый пакет в монорепо
mkdir -p packages/ai-service/src
# Добавить package.json по образцу существующих пакетов
```

---

## 8. Архитектура tRPC + NestJS

### Как tRPC монтируется в NestJS

```
NestJS Bootstrap (main.ts)
    ↓
AppModule
    ├── DatabaseModule (global)   → DatabaseService
    └── AuthModule                → JwtModule, JwtStrategy

TrpcService.applyMiddleware(app):
    app.use("/trpc", trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: createTRPCContext,
    }))

AppController:
    @Get("users") → REST endpoint (дублирует getUsers)
    → Рекомендуется убрать, использовать только tRPC
```

### Добавление нового роутера

```typescript
// 1. Создать packages/trpc/src/router/ai.router.ts
import { z } from "zod"
import { router, protectedProcedure } from "../trpc.js"

export const aiRouter = router({
  generateText: protectedProcedure
    .input(z.object({ prompt: z.string().min(1).max(4000) }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user доступен благодаря protectedProcedure
      // Вызов AI API
      const result = await openai.chat.completions.create({...})
      return { text: result.choices[0].message.content }
    }),

  streamText: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .subscription(async function* ({ input, ctx }) {
      // tRPC subscriptions для streaming
      for await (const chunk of openaiStream) {
        yield { chunk: chunk.choices[0].delta.content }
      }
    }),
})

// 2. Добавить в packages/trpc/src/router/index.ts
export const appRouter = router({
  auth: authRouter,
  users: userRouter,
  ai: aiRouter,   // ← добавить
})

// 3. Использовать на фронтенде — типы приходят автоматически!
const { mutate } = trpc.ai.generateText.useMutation()
```

### Контекст tRPC (createTRPCContext)

```typescript
// packages/trpc/src/context.ts
// Текущий контекст содержит:
// { req, res, prisma, user? }
//
// Для AI SaaS расширьте:
export type TRPCContext = {
  req: Request;
  res: Response;
  prisma: PrismaClient;
  user?: User; // текущий пользователь
  organization?: Organization; // текущая организация
  subscription?: Subscription; // план подписки
  aiUsageTracker: AIUsageTracker; // трекинг расхода токенов
};
```

---

## 9. Что уже реализовано

| Функциональность    | Статус      | Файлы                                      |
| ------------------- | ----------- | ------------------------------------------ |
| Монорепо структура  | ✅ Готово   | `turbo.json`, `pnpm-workspace.yaml`        |
| PostgreSQL + Prisma | ✅ Готово   | `packages/database/`                       |
| NestJS API сервер   | ✅ Готово   | `apps/api/`                                |
| Next.js фронтенд    | ✅ Готово   | `apps/web/`                                |
| tRPC соединение     | ✅ Готово   | `packages/trpc/`                           |
| JWT аутентификация  | ✅ Готово   | `apps/api/src/auth/`                       |
| httpOnly cookies    | ✅ Готово   | `packages/trpc/src/router/auth.router.ts`  |
| Shared Zod схемы    | ✅ Готово   | `packages/shared/`                         |
| ESLint + Prettier   | ✅ Готово   | `packages/config-eslint/`                  |
| Tailwind CSS v4     | ✅ Готово   | `packages/config-tailwind/`                |
| Git hooks (Husky)   | ✅ Готово   | `.husky/pre-commit`                        |
| Commit lint         | ✅ Готово   | `commitlint.config.cjs`                    |
| Docker (PostgreSQL) | ✅ Готово   | `docker-compose.yml`                       |
| Seed данные         | ✅ Готово   | `packages/database/prisma/seed.ts`         |
| User CRUD           | ✅ Частично | `packages/trpc/src/router/users.router.ts` |
| Роли (ADMIN/USER)   | ✅ В схеме  | `packages/database/prisma/schema.prisma`   |

---

## 10. Что нужно добавить для SaaS

### Приоритет 1: Критически важно (MVP)

```
□ Полноценная регистрация с паролем (bcrypt) или OAuth
□ Email верификация (VerificationToken уже в схеме)
□ Organizations / Teams (multi-tenancy)
□ Billing (Stripe) — subscriptions, webhooks
□ Usage limits per plan
□ Error tracking (Sentry)
□ Structured logging (Pino / Winston)
```

### Приоритет 2: Важно для роста

```
□ Redis (кеширование, rate limiting, sessions, job queue)
□ Background jobs (BullMQ + Redis)
□ File uploads (S3 / R2)
□ Email отправка (Resend / Postmark)
□ Analytics (Posthog / Mixpanel)
□ Feature flags (OpenFeature + Flipt)
□ Admin панель
```

### Приоритет 3: AI-специфика

```
□ OpenAI / Anthropic интеграция
□ Streaming responses (tRPC subscriptions или SSE)
□ Token usage tracking и биллинг per-usage
□ Vector database (pgvector или Pinecone)
□ RAG pipeline (LangChain.js / LlamaIndex.ts / Vercel AI SDK)
□ Prompt management и versioning
□ AI response кеширование (semantic cache)
□ Content moderation для user inputs
```

---

## 11. Интеграция ИИ: дорожная карта

### Архитектура AI модуля для NestJS

```typescript
// apps/api/src/ai/
├── ai.module.ts
├── ai.service.ts          ← Основной AI сервис (OpenAI, Anthropic)
├── embedding.service.ts   ← Генерация векторных представлений
├── rag.service.ts         ← Retrieval-Augmented Generation
├── usage.service.ts       ← Трекинг расхода токенов / стоимости
└── moderation.service.ts  ← Проверка контента

// Пример ai.service.ts
@Injectable()
export class AIService {
  private openai: OpenAI
  private anthropic: Anthropic

  constructor(
    private prisma: DatabaseService,
    private usage: UsageService,
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async generateCompletion(
    userId: string,
    orgId: string,
    prompt: string,
    model: "gpt-4o" | "claude-3-5-sonnet-20241022" = "claude-3-5-sonnet-20241022"
  ) {
    // 1. Проверить лимиты подписки
    await this.usage.checkLimits(orgId)

    // 2. Вызов AI
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    // 3. Записать usage
    await this.usage.record({
      userId,
      orgId,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    })

    return response.content[0].text
  }
}
```

### Vercel AI SDK (рекомендуется для streaming)

```typescript
// Альтернатива: Vercel AI SDK даёт удобный streaming из box
// npm install ai @ai-sdk/anthropic

import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// packages/trpc/src/router/ai.router.ts
generateStream: protectedProcedure
  .input(z.object({ prompt: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const result = streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: input.prompt,
    });

    // Передать stream в response
    return result.toDataStreamResponse();
  });
```

### pgvector для RAG

```sql
-- Добавить расширение PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;
```

```prisma
// В schema.prisma добавить
model Document {
  id             String   @id @default(cuid())
  organizationId String
  content        String
  embedding      Unsupported("vector(1536)")?  // OpenAI ada-002 dimensions
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([organizationId])
}
```

```typescript
// Semantic search
async searchSimilar(embedding: number[], orgId: string, limit = 5) {
  const results = await this.prisma.$queryRaw<Document[]>`
    SELECT id, content, metadata,
           1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM "Document"
    WHERE "organizationId" = ${orgId}
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${limit}
  `
  return results
}
```

### AI Usage Billing Pattern

```typescript
// Стоимость токенов (на 1M токенов, февраль 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-3-5-sonnet-20241022": { input: 3.0,  output: 15.0 },
  "claude-3-haiku-20241022":    { input: 0.25, output: 1.25 },
  "gpt-4o":                     { input: 2.5,  output: 10.0 },
  "gpt-4o-mini":                { input: 0.15, output: 0.60 },
}

async recordAndCharge(params: {
  orgId: string
  model: string
  inputTokens: number
  outputTokens: number
}) {
  const pricing = MODEL_PRICING[params.model]
  const cost =
    (params.inputTokens  / 1_000_000) * pricing.input +
    (params.outputTokens / 1_000_000) * pricing.output

  await this.prisma.aIUsageRecord.create({
    data: { ...params, cost, feature: "chat" },
  })

  // Обновить счётчик в организации
  await this.prisma.organization.update({
    where: { id: params.orgId },
    data: { monthlySpend: { increment: cost } },
  })
}
```

---

## 12. Масштабирование и производительность

### Текущие ограничения и решения

| Проблема               | Решение                            |
| ---------------------- | ---------------------------------- |
| Один инстанс API       | Horizontal scaling + load balancer |
| Нет кеширования        | Redis (ioredis) + кеш tRPC ответов |
| Синхронные AI вызовы   | BullMQ job queue для тяжёлых задач |
| Нет connection pooling | PgBouncer или Prisma Accelerate    |
| Нет CDN                | Cloudflare / Vercel Edge           |

### Redis интеграция

```typescript
// apps/api/src/cache/cache.module.ts
@Module({
  imports: [
    BullModule.forRoot({ connection: { host: "localhost", port: 6379 } }),
    BullModule.registerQueue({ name: "ai-tasks" }),
  ],
  providers: [CacheService, AIQueueProcessor],
})
export class CacheModule {}

// Processor для долгих AI задач
@Processor("ai-tasks")
export class AIQueueProcessor {
  @Process("generate-report")
  async handleReport(job: Job<{ orgId: string; prompt: string }>) {
    const result = await this.aiService.generateCompletion(...)
    // Уведомить клиента через WebSocket или polling
  }
}
```

### Turborepo Remote Caching (для CI/CD)

```bash
# Подключить Vercel Remote Cache
npx turbo login
npx turbo link

# В CI/CD добавить:
# TURBO_TOKEN и TURBO_TEAM
# Это ускорит CI на 50-90%
```

---

## 13. Безопасность

### Текущее состояние

| Механизм             | Статус                          |
| -------------------- | ------------------------------- |
| httpOnly cookies     | ✅ Реализовано                  |
| JWT верификация      | ✅ Реализовано                  |
| sameSite cookie      | ✅ "lax"                        |
| Zod input validation | ✅ Реализовано                  |
| CORS настройка       | ⚠️ Проверить в main.ts          |
| Rate limiting        | ❌ Нет                          |
| Helmet.js            | ❌ Нет                          |
| SQL injection        | ✅ Prisma параметризует запросы |

### Необходимые меры для production

```typescript
// apps/api/src/main.ts — добавить:

import helmet from "@fastify/helmet" // или helmet для express
import { ThrottlerModule } from "@nestjs/throttler"

// 1. Security headers
app.use(helmet())

// 2. CORS (ограничить origins)
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "http://localhost:3000",
  credentials: true,
})

// 3. Rate limiting
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 запросов в минуту
    }]),
  ],
})

// 4. Для AI эндпоинтов — более жёсткие лимиты
@Throttle({ default: { ttl: 60000, limit: 10 } })
generateText: protectedProcedure...

// 5. Input sanitization для AI промптов
import DOMPurify from "isomorphic-dompurify"
const sanitizedPrompt = DOMPurify.sanitize(input.prompt)
```

### Переменные окружения для production

```bash
# .env.production
DATABASE_URL=               # Connection pooler URL (PgBouncer)
DIRECT_URL=                 # Direct DB URL (для миграций)
JWT_SECRET=                 # Min 64 chars, случайные байты
JWT_REFRESH_SECRET=         # Отдельный секрет для refresh
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
REDIS_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SENTRY_DSN=
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

---

## 14. Конвенции и качество кода

### Commit Message Format

```
<type>(<scope>): <description>

Types:   feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
Scopes:  root | api | web | shared | db | deps | config

Примеры:
feat(ai): add streaming text generation endpoint
fix(auth): correct JWT expiry mismatch between cookie and token
chore(db): add pgvector extension support
feat(billing): integrate Stripe subscription webhooks
```

### Naming Conventions

```typescript
// Файлы — kebab-case
auth.router.ts
database.service.ts
use-auth.ts

// Переменные/функции — camelCase
const userRouter = router({...})
const createTRPCContext = async () => {...}

// Типы/Интерфейсы — PascalCase
type User = z.infer<typeof UserSchema>
interface TRPCContext {...}

// Zod схемы — PascalCase + Schema суффикс
const LoginInputSchema = z.object({...})
const UserSchema = z.object({...})

// Константы — SCREAMING_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET
const MAX_TOKENS = 4096
```

### ESLint ключевые правила

```javascript
// packages/config-eslint/src/base.js
"no-console": ["warn", { allow: ["warn", "error"] }]  // ← используйте logger
"@typescript-eslint/no-explicit-any": "warn"           // ← избегайте any
"prefer-const": "error"                                 // ← всегда const
"@typescript-eslint/no-unused-vars": ["warn", {
  "argsIgnorePattern": "^_"                            // ← префикс _ для unused
}]
```

---

## 15. Деплой

### Рекомендуемая инфраструктура для SaaS

```
┌──────────────────────────────────────────────────────┐
│                    PRODUCTION                        │
│                                                      │
│  Vercel (Web)          Railway / Fly.io (API)        │
│  └── Next.js App       └── NestJS Docker             │
│      └── Edge Config       └── Auto-scaling          │
│                                                      │
│  Neon / Supabase (DB)  Upstash (Redis)               │
│  └── PostgreSQL        └── Serverless Redis          │
│      └── pgvector          └── Rate limiting         │
│      └── Branching         └── Job queues            │
│                                                      │
│  Cloudflare (CDN)      Sentry (Monitoring)           │
└──────────────────────────────────────────────────────┘
```

### Docker Compose для production-like локальная среда

```yaml
# docker-compose.full.yml — расширенная версия
services:
  postgres:
    image: pgvector/pgvector:pg16 # pgvector вместо базового postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm build
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }} # Remote caching
      TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

---

## Быстрый справочник: ключевые файлы

| Что изменить                | Файл                                     |
| --------------------------- | ---------------------------------------- |
| Добавить новый API endpoint | `packages/trpc/src/router/`              |
| Добавить поле в БД          | `packages/database/prisma/schema.prisma` |
| Добавить общий тип/схему    | `packages/shared/src/schemas/`           |
| Изменить тему UI            | `packages/config-tailwind/src/theme.css` |
| Настроить CORS/middleware   | `apps/api/src/main.ts`                   |
| Добавить NestJS модуль      | `apps/api/src/`                          |
| Добавить страницу           | `apps/web/src/app/`                      |
| Настроить tRPC контекст     | `packages/trpc/src/context.ts`           |
| Настроить auth              | `apps/api/src/auth/`                     |

---

## Следующие шаги (рекомендуемый порядок)

```
Неделя 1: Фундамент
  □ Добавить Organizations + multi-tenancy в схему
  □ Реализовать регистрацию с паролем (bcrypt)
  □ Настроить Helmet + CORS + Rate limiting
  □ Подключить Sentry для error tracking

Неделя 2: Монетизация
  □ Stripe биллинг (subscriptions + webhooks)
  □ Usage-based billing для AI фич
  □ Планы подписки (FREE/PRO/ENTERPRISE)

Неделя 3: AI интеграция
  □ Anthropic/OpenAI SDK через NestJS AIModule
  □ Streaming через Vercel AI SDK
  □ Token usage tracking
  □ pgvector для embeddings

Неделя 4: Production-ready
  □ Redis (кеш + rate limit + jobs)
  □ BullMQ для async AI задач
  □ CI/CD с Turborepo remote cache
  □ Мониторинг и алерты
```

---

_Документация создана на основе анализа кодовой базы. Актуальна для версии стартера с коммитом `10e7556`._
