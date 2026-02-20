# Project Architecture & AI Infrastructure

Welcome to the central architectural source of truth for the project. This document outlines the AI orchestration mechanics, the Frontend Client architecture (FSD), and the Backend Server architecture (DDD).

**All agents MUST strictly adhere to these boundaries.**

---

## 1. AI Orchestration Framework

This project relies on an automated, multi-agent AI pipeline driven by the `@modelcontextprotocol/sdk` (MCP).

- **Core Orchestrator**: Uses high-context models (e.g., Gemini Flash) to decompose User Feature Requests into atomic tasks for sub-agents.
- **Sub-Agents**: Specialized roles (`frontend-ui`, `frontend-bizlogic`, `backend-api`, `backend-database`, `qa-testing`) execute tasks in parallel using the `Claude` family of models (Haiku / Sonnet).
- **Context Manager**: A dedicated Agent (Phase 1.5) that scans `.agents/skills/` and explicitly injects the strictly necessary context into the Phase 2 execution prompts.
- **Quality Gates**: The `architect` agent serves as Phase 1, reviewing requests for security, N+1 query risks, and system design violations. The pipeline aborts if the architect blocks the request.
- **Persistence & Queues**: ChromaDB is used to save vector checkpoints, allowing for session recovery and pattern reuse across features. BullMQ coordinates autonomous 24/7 task execution.

---

## 2. Frontend Architecture (React / Next.js): Feature-Sliced Design (FSD)

The Client application (`apps/web`) is structured according to the **Feature-Sliced Design (FSD)** methodology. This ensures structural predictability, high cohesion, and low coupling.

### FSD Layers:

1. **app/**: Application setup, global providers, global routing logic, and global styles.
2. **pages/**: Route components mapping to specific URLs (e.g., `/login`, `/dashboard`). Pages should contain almost no logic, merely composing widgets together.
3. **widgets/**: Independent, reusable UI blocks that compose features and entities together (e.g., `Header`, `ProductListBoard`).
4. **features/**: User scenarios and business value slices (e.g., `AddToCartButton`, `AuthLoginForm`).
5. **entities/**: Core business domain models, their UI representations, state, and specific API hooks (e.g., `User`, `Product`, `Order`).
6. **shared/**: Domain-agnostic, purely technical and highly reusable generic code (e.g., UI kit components like `Button`, `Input`, generic API clients, and constants).

### Strict FSD Constraints:

- **Unidirectional Dependencies**: A layer can only import from layers strictly _below_ it. (e.g., `features` can import from `entities` and `shared`, but `features` MUST NEVER import from `widgets` or `pages`).
- **No Cross-Slice Imports**: Modules within the same layer are entirely isolated. For example, `features/Auth` CANNOT import anything from `features/Cart`.
- **Public API Rule**: Cross-layer interaction happens exclusively through `index.ts` files representing public APIs. Deep relative imports (e.g., `import { X } from '@/entities/User/ui/Profile/Card'`) are completely forbidden.

---

## 3. Backend Architecture (NestJS / Prisma): Domain-Driven Design (DDD)

The Server application (`apps/api`) and its shared packages are structured according to **Domain-Driven Design (DDD)** and Clean Architecture layered principles.

### DDD Layers:

1. **Domain Layer**: The heart of the software. Contains business rules, core entities, value objects, and repository _interfaces_.
   - _Constraint_: Must possess absolutely zero technical dependencies. No imports of framework-specific logic, HTTP modules, Prisma ORM, etc.
2. **Application Layer**: Contains Application Services and Use Cases serving as orchestrators. Fetches domain entities, executes domain logic behavior, and persists changes.
   - _Constraint_: Only interacts with the Domain Layer and definitions of Infrastructure via interfaces.
3. **Infrastructure Layer**: Technical implementations. Implements repository interfaces using `Prisma`, manages external API integration (e.g., Stripe, SendGrid), and implements caching strategies (Redis).
   - _Constraint_: Depended upon exclusively by the IoC (Inversion of Control) container for injection.
4. **Presentation/Interface Layer**: NestJS Controllers or GraphQL Resolvers handling incoming requests. Validates inputs via strict DTOs (`class-validator`), invokes Application Use Cases, and formats the output.

### Strict DDD Constraints:

- **The Dependency Rule**: Source code dependencies must exclusively point inwards, toward higher-level policies (the Domain).
- **Data Transfer Objects (DTOs)**: Information crossing the Presentation boundary into the Application layer must be encapsulated in strictly typed DTOs.
- **Repository Interface Segregation**: Infrastructure persistence logic is completely abstracted behind interfaces defined within the Domain/Application layers, allowing the underlying database (Prisma) to be entirely swapped with minimal friction.
