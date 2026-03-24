# AME One — Planejamento Incremental de Melhorias

> **Data:** 2026-03-24  
> **Versão:** 2.0 (atualizado — schema limpo, apenas tabelas em uso)  
> **Pré-requisito:** Leitura do documento `ARCHITECTURE_ANALYSIS.md`

---

## Princípio: Schema Enxuto

> **Regra:** Novos modelos/tabelas só são adicionados ao schema quando há API e frontend consumindo-os. Não criar tabelas "para o futuro".

O schema atual contém **7 modelos**, todos ativamente utilizados no código:

| Modelo | Tabela | Propósito |
|---|---|---|
| User | `users` | Conta do usuário com role e bcrypt |
| Session | `sessions` | Sessão autenticada (cookie HMAC) |
| PasswordResetToken | `password_reset_tokens` | Tokens de reset de senha |
| CreditAccount | `credit_accounts` | Saldo de créditos do usuário |
| CreditLedger | `credit_ledger` | Auditoria de movimentação de créditos |
| Entitlement | `entitlements` | Acesso por módulo (legacy, ainda usado) |
| LicenseEntitlement | `license_entitlements` | Acesso por licença/plano |

---

## Visão Geral das Fases

```
Fase 1 — Fundação & Correções Críticas ✅ CONCLUÍDA
   ↓
Fase 2 — Segurança Reforçada
   ↓
Fase 3 — Progresso de Estudo & Engajamento (+ novos modelos)
   ↓
Fase 4 — Gestão de Estado de Prática & Teste (+ novos modelos)
   ↓
Fase 5 — Painel Administrativo & Gestão de Conteúdo (+ novos modelos)
   ↓
Fase 6 — Cache, Performance & Otimizações
```

> ⚠️ **Cada fase depende das anteriores.** Novos modelos de banco são adicionados apenas na fase que os consome.

---

## Fase 1 — Fundação & Correções Críticas ✅ CONCLUÍDA

**O que foi feito:**

- [x] `PasswordResetToken` adicionado ao schema (corrige forgot/reset-password)
- [x] `lastPasswordChangeAt` adicionado ao modelo User
- [x] Normalização snake_case com `@@map`/`@map` em todos os modelos
- [x] Senhas migradas de PBKDF2 para bcrypt (12 rounds) com fallback transparente
- [x] Campo `role` (UserRole: user/admin) adicionado ao User
- [x] Guards centralizados: `requireAuth()` e `requireAdmin()` em `src/lib/guards.ts`
- [x] Endpoint `set-plan` protegido com `requireAdmin()`
- [x] `updatedAt` adicionado nos modelos User e LicenseEntitlement
- [x] `.env` e `.env.local` removidos do git; `.env.example` criado
- [x] Remoção de 5 tabelas não utilizadas (StudyProgress, StudySession, UserStreak, PracticeState, TestAttempt)
- [x] Remoção de 2 enums não utilizados (StudyMode, TestStatus)

---

## Fase 2 — Segurança Reforçada

**Objetivo:** Rate limiting e endurecimento para produção.

**Duração estimada:** 2-3 dias  
**Dependência:** Fase 1 ✅

### 2.1 Rate Limiting

**Problema:** Sem proteção contra brute force em login/register/forgot-password.

**Ação:** Rate limiting em memória (Map) para o MVP; Redis na Fase 6.

```typescript
// src/lib/rateLimit.ts

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}
```

**Aplicar em:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`

### 2.2 Headers de Segurança

Adicionar via `next.config.ts`:

```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
],
```

### 2.3 Validação de Input com Zod

Padronizar validação de entrada em todas as rotas API com Zod (já instalado):

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().transform(s => s.trim().toLowerCase()),
  password: z.string().min(1),
});
```

**Critério de conclusão da Fase 2:**
- [ ] Rate limiting em login/register/forgot-password
- [ ] Headers de segurança configurados
- [ ] Validação Zod nas rotas de autenticação
- [ ] Testes manuais de bloqueio após tentativas excessivas

---

## Fase 3 — Progresso de Estudo & Engajamento

**Objetivo:** Rastrear progresso de estudo no backend para gamificação estilo Duolingo.

**Duração estimada:** 5-7 dias  
**Dependência:** Fase 2 concluída

### 3.1 Novos Modelos (adicionar nesta fase)

Adicionar ao `prisma/schema.prisma` apenas quando as APIs forem implementadas:

```prisma
enum StudyMode {
  flashcard
  practice
  test
}

model StudyProgress {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  licenseId  String    @map("license_id")
  moduleKey  String    @map("module_key")
  mode       StudyMode

  questionsTotal     Int @default(0) @map("questions_total")
  questionsCorrect   Int @default(0) @map("questions_correct")
  questionsIncorrect Int @default(0) @map("questions_incorrect")

  lastStudiedAt    DateTime? @map("last_studied_at")
  totalTimeSpentMs Int       @default(0) @map("total_time_spent_ms")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleKey, mode])
  @@index([userId])
  @@index([userId, licenseId])
  @@map("study_progress")
}

model StudySession {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  licenseId  String    @map("license_id")
  moduleKey  String    @map("module_key")
  mode       StudyMode

  startedAt  DateTime  @default(now()) @map("started_at")
  finishedAt DateTime? @map("finished_at")

  questionsAnswered Int   @default(0) @map("questions_answered")
  questionsCorrect  Int   @default(0) @map("questions_correct")
  score             Float?
  timeSpentMs       Int   @default(0) @map("time_spent_ms")

  details String? // JSON stringified

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, moduleKey])
  @@map("study_sessions")
}

model UserStreak {
  id             String @id @default(cuid())
  userId         String @unique @map("user_id")
  currentStreak  Int    @default(0) @map("current_streak")
  longestStreak  Int    @default(0) @map("longest_streak")
  lastActiveDate String @map("last_active_date") // "2026-03-24"
  totalXp        Int    @default(0) @map("total_xp")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_streaks")
}
```

### 3.2 Novas APIs

- `POST /api/study/progress` — Salvar progresso após responder questão
- `GET /api/study/progress/:moduleKey` — Obter progresso de um módulo
- `GET /api/study/history` — Listar histórico de sessões
- `GET /api/study/streak` — Obter streak e XP do usuário

### 3.3 Rastreamento de Limites no Backend

**Problema atual:** Limites de flashcards/dia, práticas/dia, testes/semana rastreados no localStorage (burlável).

**Ação:** Usar `StudySession` para contar uso real no backend:

```typescript
// src/lib/usageLimits.ts
export async function checkUsageLimit(userId, licenseId, mode, plan) {
  const caps = planCaps(plan);
  const todayStart = startOfDay(new Date());

  const count = await prisma.studySession.count({
    where: { userId, licenseId, mode, startedAt: { gte: todayStart } }
  });

  return { allowed: count < caps[mode], remaining: caps[mode] - count };
}
```

### 3.4 Integração com AdvancedEngine

Modificar `AdvancedEngine` para:
1. Chamar API ao iniciar sessão de estudo
2. Atualizar progresso ao responder questões
3. Finalizar sessão ao sair do modo de estudo
4. Exibir streak no dashboard

**Critério de conclusão da Fase 3:**
- [ ] Modelos `StudyProgress`, `StudySession`, `UserStreak` no schema
- [ ] APIs de progresso funcional
- [ ] Limites validados no backend
- [ ] AdvancedEngine integrado com APIs
- [ ] Streak exibido no dashboard

---

## Fase 4 — Gestão de Estado de Prática & Teste

**Objetivo:** Persistência de estado para práticas e testes, com cancelamento controlado.

**Duração estimada:** 3-5 dias  
**Dependência:** Fase 3 concluída

### 4.1 Novos Modelos (adicionar nesta fase)

```prisma
enum TestStatus {
  in_progress
  completed
  canceled
  expired
}

model PracticeState {
  id             String @id @default(cuid())
  userId         String @map("user_id")
  moduleKey      String @map("module_key")

  currentIndex   Int    @default(0) @map("current_index")
  questionIds    String @map("question_ids")    // JSON
  answers        String @default("{}") @map("answers") // JSON
  correctCount   Int    @default(0) @map("correct_count")
  incorrectCount Int    @default(0) @map("incorrect_count")

  startedAt DateTime @default(now()) @map("started_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  expiresAt DateTime @map("expires_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleKey])
  @@index([userId])
  @@map("practice_states")
}

model TestAttempt {
  id         String     @id @default(cuid())
  userId     String     @map("user_id")
  moduleKey  String     @map("module_key")

  status     TestStatus @default(in_progress)

  questionIds  String @map("question_ids")    // JSON
  answers      String @default("{}") @map("answers") // JSON
  currentIndex Int    @default(0) @map("current_index")

  startedAt  DateTime  @default(now()) @map("started_at")
  finishedAt DateTime? @map("finished_at")
  canceledAt DateTime? @map("canceled_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  score            Float?
  questionsCorrect Int? @map("questions_correct")
  questionsTotal   Int? @map("questions_total")
  timeSpentMs      Int? @map("time_spent_ms")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, moduleKey, status])
  @@map("test_attempts")
}
```

### 4.2 APIs de Prática

- `POST /api/study/practice/save` — Salvar estado (auto-save a cada N questões)
- `GET /api/study/practice/resume` — Recuperar estado salvo
- `DELETE /api/study/practice/discard` — Descartar estado (reiniciar)

### 4.3 APIs de Teste

- `POST /api/study/test/start` — Iniciar tentativa
- `POST /api/study/test/answer` — Registrar resposta (auto-save)
- `POST /api/study/test/submit` — Finalizar teste
- `POST /api/study/test/cancel` — Cancelar (saída da tela)
- `GET /api/study/test/resume` — Verificar teste em andamento

### 4.4 Cancelamento Automático no Frontend

```typescript
// AdvancedEngine — detectar saída no modo teste
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (mode === 'test' && status === 'in_progress') {
      e.preventDefault();
      e.returnValue = 'You have an exam in progress. Leaving will cancel it.';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [mode, status]);
```

### 4.5 Expiração Automática

Testes `in_progress` há mais de 2 horas → marcar como `expired` (verificar na abertura do módulo).

**Critério de conclusão da Fase 4:**
- [ ] PracticeState funcional (save/resume/discard)
- [ ] TestAttempt funcional (start/answer/submit/cancel)
- [ ] Cancelamento ao sair da tela no modo teste
- [ ] Expiração automática de testes antigos

---

## Fase 5 — Painel Administrativo & Gestão de Conteúdo

**Objetivo:** Interface admin para gestão de usuários, questões e assinaturas.

**Duração estimada:** 7-10 dias  
**Dependência:** Fase 4 concluída

### 5.1 Novos Modelos (adicionar nesta fase)

```prisma
enum QuestionStatus {
  draft
  validated
  published
  archived
}

model Question {
  id              String         @id @default(cuid())
  licenseId       String         @map("license_id")
  moduleKey       String         @map("module_key")
  stem            String
  questionType    String         @default("single_choice") @map("question_type")
  options         String         // JSON: [{"id":"A","text":"..."}]
  correctOptionId String         @map("correct_option_id")
  explanation     String?        // JSON
  references      String?        // JSON
  difficulty      Int            @default(1)
  tags            String?        // JSON
  status          QuestionStatus @default(draft)
  version         Int            @default(1)
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  createdBy       String?        @map("created_by")

  @@index([licenseId, moduleKey])
  @@index([status])
  @@map("questions")
}

enum SubscriptionStatus {
  active
  canceled
  past_due
  trialing
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @map("user_id")
  licenseId            String             @map("license_id")
  plan                 PlanTier           @default(basic)
  status               SubscriptionStatus @default(active)
  stripeSubscriptionId String?            @unique @map("stripe_subscription_id")
  stripeCustomerId     String?            @map("stripe_customer_id")
  currentPeriodStart   DateTime           @map("current_period_start")
  currentPeriodEnd     DateTime           @map("current_period_end")
  canceledAt           DateTime?          @map("canceled_at")
  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, licenseId])
  @@index([userId])
  @@map("subscriptions")
}
```

### 5.2 Rotas Admin

- `GET/PATCH /api/admin/users` — Listar e editar usuários
- `GET/POST/PATCH/DELETE /api/admin/questions` — CRUD de questões
- `POST /api/admin/questions/import` — Importação em lote (migrar JSON → DB)
- `GET/PATCH /api/admin/subscriptions` — Gestão de assinaturas
- `GET /api/admin/dashboard` — Métricas

### 5.3 Páginas Admin

- `/admin/dashboard` — Métricas
- `/admin/users` — Gestão de usuários
- `/admin/questions` — CRUD de questões
- `/admin/subscriptions` — Gestão de assinaturas

Todas protegidas por `requireAdmin()`.

**Critério de conclusão da Fase 5:**
- [ ] CRUD de questões via admin
- [ ] Importação de questões em lote
- [ ] Gestão de usuários
- [ ] Dashboard com métricas básicas
- [ ] Modelo Subscription para Stripe

---

## Fase 6 — Cache, Performance & Otimizações

**Objetivo:** Redis para cache/rate limiting, migração para PostgreSQL.

**Duração estimada:** 5-7 dias  
**Dependência:** Fase 5 concluída

### 6.1 Migração para PostgreSQL

Alterar `datasource db` no schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 6.2 Redis

```bash
npm install ioredis
```

Uso:
- Cache de questões por módulo (TTL 1h)
- Rate limiting distribuído (substituir Map em memória)
- Contadores de uso em tempo real
- Cache de perfil/entitlements (TTL 5min)

### 6.3 Quando Considerar MongoDB (Pós-MVP)

Não recomendado para o MVP. PostgreSQL com JSONB atende todas as necessidades. Reavaliar se:
- Volume > 10M registros de sessões de estudo
- Necessidade de schemas flexíveis para tipos de questão variados
- Analytics em tempo real com aggregation pipeline

**Critério de conclusão da Fase 6:**
- [ ] PostgreSQL em produção
- [ ] Redis configurado para cache e rate limiting
- [ ] Performance < 200ms nas APIs principais

---

## Resumo das Fases

| Fase | Objetivo | Duração | Novos Modelos | Status |
|---|---|---|---|---|
| 1 | Fundação & Correções | 1-2 dias | — (limpou 5 modelos não usados) | ✅ Concluída |
| 2 | Segurança | 2-3 dias | — | Pendente |
| 3 | Progresso & Engajamento | 5-7 dias | StudyProgress, StudySession, UserStreak | Pendente |
| 4 | Estado de Prática & Teste | 3-5 dias | PracticeState, TestAttempt | Pendente |
| 5 | Admin Panel | 7-10 dias | Question, Subscription | Pendente |
| 6 | Cache & Performance | 5-7 dias | — | Pendente |
| **Total estimado** | | **23-34 dias** | | |

---

## Apêndice: Checklist de Segurança para Produção

- [ ] `AUTH_SECRET` com valor forte (mínimo 64 caracteres, aleatório)
- [ ] Variáveis de ambiente via secret manager (não `.env` em repositório)
- [ ] HTTPS obrigatório
- [ ] Headers de segurança (CSP, HSTS, X-Frame-Options)
- [ ] CORS configurado para domínios específicos
- [ ] Logs de auditoria para ações administrativas
- [ ] Backups automáticos do PostgreSQL
- [ ] Monitoramento de erros (Sentry ou similar)
- [ ] Revisão de dependências (npm audit)
