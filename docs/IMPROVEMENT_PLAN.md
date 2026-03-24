# AME One — Planejamento Incremental de Melhorias

> **Data:** 2026-03-24  
> **Versão:** 1.0  
> **Pré-requisito:** Leitura do documento `ARCHITECTURE_ANALYSIS.md`

---

## Visão Geral das Fases

```
Fase 1 — Fundação & Correções Críticas (Pré-requisito para todas)
   ↓
Fase 2 — Segurança & Autenticação
   ↓
Fase 3 — Evolução do Banco de Dados & Progresso de Estudo
   ↓
Fase 4 — Gestão de Estado de Estudo (Prática & Teste)
   ↓
Fase 5 — Painel Administrativo & Gestão de Conteúdo
   ↓
Fase 6 — Cache, Performance & Banco Não-Relacional
```

> ⚠️ **Cada fase depende das anteriores estarem concluídas.** Não avançar para a próxima fase sem validação da fase atual.

---

## Fase 1 — Fundação & Correções Críticas

**Objetivo:** Corrigir problemas que impedem o funcionamento correto do sistema atual.

**Duração estimada:** 1-2 dias

### 1.1 Correção do Schema Prisma

**Problema:** O código referencia modelos e campos que não existem no schema.

**Ações:**

```prisma
// Adicionar ao schema.prisma:

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_reset_tokens")
}

// Adicionar ao modelo User:
// - lastPasswordChangeAt DateTime?
// - relation para PasswordResetToken
```

### 1.2 Normalização do Banco de Dados com snake_case

**Problema:** Tabelas e colunas usam camelCase, fora do padrão SQL.

**Ação:** Adicionar `@@map` e `@map` em todos os modelos e campos para que o banco use snake_case enquanto o código TypeScript mantém camelCase.

**Exemplo:**
```prisma
model User {
  id                     String    @id @default(cuid())
  email                  String    @unique
  username               String?
  passwordHash           String    @map("password_hash")
  lastPasswordChangeAt   DateTime? @map("last_password_change_at")
  createdAt              DateTime  @default(now()) @map("created_at")

  @@map("users")
}
```

> Aplicar `@@map` e `@map` em TODOS os modelos: User, Session, CreditAccount, CreditLedger, Entitlement, LicenseEntitlement, PasswordResetToken.

### 1.3 Migração de SQLite para PostgreSQL (Preparação)

**Problema:** SQLite não suporta concorrência e tipos avançados necessários para produção.

**Ação para esta fase:**
- Alterar `datasource db` no schema para `postgresql`
- Manter SQLite como opção de desenvolvimento via variável de ambiente
- Garantir compatibilidade do schema com PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.4 Adição de `updatedAt` nos modelos existentes

Adicionar `updatedAt DateTime @updatedAt @map("updated_at")` em: User, Session, Entitlement, LicenseEntitlement.

**Critério de conclusão da Fase 1:**
- [ ] Schema Prisma compila sem erros
- [ ] Todos os modelos usam `@@map`/`@map` para snake_case
- [ ] `PasswordResetToken` e `lastPasswordChangeAt` existem no schema
- [ ] Build do Next.js passa sem erros

---

## Fase 2 — Segurança & Autenticação

**Objetivo:** Implementar autenticação robusta com bcrypt, JWT e guards centralizados.

**Duração estimada:** 3-5 dias  
**Dependência:** Fase 1 concluída

### 2.1 Migração de PBKDF2 para bcrypt

**Problema:** PBKDF2 é funcional, porém bcrypt é o padrão da indústria para hashing de senhas, com proteção nativa contra ataques de GPU.

**Ações:**

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```typescript
// src/lib/auth.ts — Atualizar funções:

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Suporte a senhas legadas (PBKDF2)
  if (stored.startsWith('pbkdf2$')) {
    return verifyPbkdf2Password(password, stored);
  }
  // Novas senhas (bcrypt)
  return bcrypt.compare(password, stored);
}
```

> **Importante:** Manter compatibilidade com senhas PBKDF2 existentes. Ao fazer login com sucesso usando senha PBKDF2, re-hash automaticamente com bcrypt (migração transparente).

### 2.2 Implementação de JWT com Cookies httpOnly

**Problema:** O sistema atual usa sessões no banco com HMAC-signed cookies. Para o MVP, manter o padrão de cookie httpOnly mas adicionar JWT como alternativa para APIs externas.

**Ações:**

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

```typescript
// src/lib/jwt.ts — Novo arquivo

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const JWT_EXPIRY = '12h';

export interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRY });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}
```

**Fluxo de autenticação atualizado:**
1. Login → cria sessão no DB + gera JWT → define cookie `ameone_session` (httpOnly, secure, sameSite)
2. Middleware verifica JWT do cookie → autoriza ou redireciona
3. Sessão no DB serve como fonte de verdade para revogação

### 2.3 Guard de Segurança no Backend

**Problema:** Cada rota API implementa sua própria verificação de autenticação, sem padronização.

**Ação:** Criar utility functions de guard centralizadas.

```typescript
// src/lib/guards.ts — Novo arquivo

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export type AuthContext = {
  userId: string;
  email: string;
  role: 'user' | 'admin';
};

/**
 * Guard de autenticação — retorna contexto ou resposta 401.
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ameone_session')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
  }

  return { userId: payload.sub, email: payload.email, role: payload.role };
}

/**
 * Guard de admin — retorna contexto de admin ou resposta 403.
 */
export async function requireAdmin(): Promise<AuthContext | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (result.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return result;
}

// Helper para uso em rotas
export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
```

**Uso em rotas:**
```typescript
// Antes:
async function getUserIdOrNull() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('ameone_session')?.value;
  const sessionId = verifySignedSession(raw);
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.userId;
}

// Depois:
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  // auth.userId, auth.email, auth.role disponíveis
}
```

### 2.4 Role de Usuário no Banco de Dados

**Ação:** Adicionar campo `role` ao modelo `User`:

```prisma
enum UserRole {
  user
  admin
}

model User {
  // ... campos existentes
  role UserRole @default(user) @map("role")
}
```

### 2.5 Rate Limiting

**Ação:** Implementar rate limiting em rotas críticas (login, register, forgot-password).

```typescript
// src/lib/rateLimit.ts — Usando Map em memória (MVP)
// Em produção, substituir por Redis (Fase 6)

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
    return true; // permitido
  }

  if (entry.count >= maxAttempts) return false; // bloqueado
  entry.count++;
  return true;
}
```

**Critério de conclusão da Fase 2:**
- [ ] Senhas hasheadas com bcrypt (12 rounds)
- [ ] Senhas PBKDF2 legadas são aceitas e re-hasheadas automaticamente
- [ ] JWT implementado e armazenado em cookie httpOnly
- [ ] Guards `requireAuth()` e `requireAdmin()` funcionando
- [ ] Campo `role` no modelo User
- [ ] Rate limiting em login/register/forgot-password
- [ ] Testes manuais de fluxo de login/register/logout

---

## Fase 3 — Evolução do Banco de Dados & Progresso de Estudo

**Objetivo:** Adicionar modelos necessários para rastreamento de progresso, engajamento (estilo Duolingo), e gestão de assinaturas.

**Duração estimada:** 5-7 dias  
**Dependência:** Fase 2 concluída

### 3.1 Modelo de Progresso de Estudo

```prisma
model StudyProgress {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  licenseId  String   @map("license_id")   // "m", "e", "s", etc.
  moduleKey  String   @map("module_key")    // "m.airframe", "regs.cars"
  mode       StudyMode @map("mode")          // flashcard, practice, test

  questionsTotal     Int @default(0) @map("questions_total")
  questionsCorrect   Int @default(0) @map("questions_correct")
  questionsIncorrect Int @default(0) @map("questions_incorrect")

  streak          Int  @default(0)           // Dias consecutivos de estudo
  lastStudiedAt   DateTime? @map("last_studied_at")
  totalTimeSpentMs Int  @default(0) @map("total_time_spent_ms")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleKey, mode])
  @@index([userId])
  @@index([userId, licenseId])
  @@map("study_progress")
}

enum StudyMode {
  flashcard
  practice
  test
}
```

### 3.2 Modelo de Histórico de Sessões de Estudo

```prisma
model StudySession {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  licenseId  String    @map("license_id")
  moduleKey  String    @map("module_key")
  mode       StudyMode @map("mode")

  startedAt  DateTime  @default(now()) @map("started_at")
  finishedAt DateTime? @map("finished_at")

  questionsAnswered  Int @default(0) @map("questions_answered")
  questionsCorrect   Int @default(0) @map("questions_correct")
  score              Float? // Porcentagem de acerto (0.0 - 1.0)
  timeSpentMs        Int @default(0) @map("time_spent_ms")

  // JSON com detalhes (respostas individuais)
  details    String?  // JSON stringified

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, moduleKey])
  @@map("study_sessions")
}
```

### 3.3 Modelo de Streak e Gamificação

```prisma
model UserStreak {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  currentStreak Int      @default(0) @map("current_streak")
  longestStreak Int      @default(0) @map("longest_streak")
  lastActiveDate String  @map("last_active_date") // "2026-03-24" (date only, timezone-safe)
  totalXp       Int      @default(0) @map("total_xp")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_streaks")
}
```

### 3.4 Modelo de Subscription (Preparação para Stripe)

```prisma
model Subscription {
  id                 String   @id @default(cuid())
  userId             String   @map("user_id")
  licenseId          String   @map("license_id")

  plan               PlanTier @default(basic)
  status             SubscriptionStatus @default(active)

  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  stripeCustomerId     String? @map("stripe_customer_id")

  currentPeriodStart DateTime @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")
  canceledAt         DateTime? @map("canceled_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, licenseId])
  @@index([userId])
  @@index([stripeSubscriptionId])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  active
  canceled
  past_due
  trialing
}
```

### 3.5 API de Progresso de Estudo

Novas rotas:
- `POST /api/study/progress` — Salvar progresso após responder questão
- `GET /api/study/progress/:moduleKey` — Obter progresso de um módulo
- `GET /api/study/history` — Listar histórico de sessões
- `GET /api/study/streak` — Obter streak e XP do usuário

### 3.6 Rastreamento de Limites de Uso no Backend

**Problema atual:** Limites de flashcards/dia, práticas/dia, testes/semana são rastreados no `localStorage` e podem ser burlados.

**Ação:** Mover contadores para o backend usando `StudySession`.

```typescript
// src/lib/usageLimits.ts

export async function checkUsageLimit(
  userId: string,
  licenseId: string,
  mode: StudyMode,
  plan: PlanTier
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const caps = planCaps(plan);
  const now = new Date();

  // Contar sessões no período
  if (mode === 'flashcard') {
    const todayStart = startOfDay(now);
    const count = await prisma.studySession.count({
      where: { userId, licenseId, mode: 'flashcard', startedAt: { gte: todayStart } }
    });
    return {
      allowed: count < caps.flashcardsPerDay,
      remaining: Math.max(0, caps.flashcardsPerDay - count),
      resetAt: endOfDay(now)
    };
  }
  // ... similar para practice e test
}
```

**Critério de conclusão da Fase 3:**
- [ ] Modelos `StudyProgress`, `StudySession`, `UserStreak`, `Subscription` no schema
- [ ] API de progresso de estudo funcional
- [ ] Limites de uso validados no backend (não mais no localStorage)
- [ ] Streak calculado corretamente
- [ ] Migração de dados existentes (se aplicável)

---

## Fase 4 — Gestão de Estado de Estudo (Prática & Teste)

**Objetivo:** Implementar persistência de estado para práticas e testes, incluindo cancelamento controlado.

**Duração estimada:** 3-5 dias  
**Dependência:** Fase 3 concluída

### 4.1 Modelo de Estado da Prova de Prática

```prisma
model PracticeState {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  moduleKey  String   @map("module_key")

  // Estado serializado da prática
  currentIndex    Int    @default(0) @map("current_index")
  questionIds     String @map("question_ids")     // JSON: ["q1", "q2", ...]
  answers         String @default("{}") @map("answers") // JSON: {"q1": "A", "q2": "C"}
  correctCount    Int    @default(0) @map("correct_count")
  incorrectCount  Int    @default(0) @map("incorrect_count")

  startedAt  DateTime @default(now()) @map("started_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  expiresAt  DateTime @map("expires_at")  // Auto-expirar após 24h

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleKey])
  @@index([userId])
  @@map("practice_states")
}
```

### 4.2 APIs de Estado da Prática

- `POST /api/study/practice/save` — Salvar estado atual (auto-save a cada N questões)
- `GET /api/study/practice/resume` — Recuperar estado salvo
- `DELETE /api/study/practice/discard` — Descartar estado (reiniciar)

**Fluxo:**
1. Ao iniciar prática → criar `PracticeState`
2. A cada resposta → atualizar `PracticeState` (debounced, 5s)
3. Ao finalizar → deletar `PracticeState`, criar `StudySession`
4. Ao reabrir módulo → verificar se existe `PracticeState` → oferecer "Continuar" ou "Reiniciar"

### 4.3 Cancelamento da Prova Modo Teste

**Problema:** Se o usuário sair da tela durante o modo teste, a prova é perdida sem registro.

**Ações:**

```prisma
model TestAttempt {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  moduleKey  String   @map("module_key")

  status     TestStatus @default(in_progress) @map("status")

  questionIds     String @map("question_ids")     // JSON
  answers         String @default("{}") @map("answers") // JSON
  currentIndex    Int    @default(0) @map("current_index")

  startedAt  DateTime @default(now()) @map("started_at")
  finishedAt DateTime? @map("finished_at")
  canceledAt DateTime? @map("canceled_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Resultado (preenchido ao finalizar)
  score            Float?   // 0.0 - 1.0
  questionsCorrect Int?     @map("questions_correct")
  questionsTotal   Int?     @map("questions_total")
  timeSpentMs      Int?     @map("time_spent_ms")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, moduleKey, status])
  @@map("test_attempts")
}

enum TestStatus {
  in_progress
  completed
  canceled
  expired
}
```

**Lógica de cancelamento:**

```typescript
// No frontend (AdvancedEngine):

// 1. Detectar saída da tela
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (mode === 'test' && status === 'in_progress') {
      e.preventDefault();
      e.returnValue = 'You have an exam in progress. Leaving will cancel it.';
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden && mode === 'test' && status === 'in_progress') {
      // Auto-save estado atual
      saveTestState();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [mode, status]);

// 2. Cancelar prova se sair (Router change)
useEffect(() => {
  const handleRouteChange = () => {
    if (mode === 'test' && status === 'in_progress') {
      cancelTest(testAttemptId);
    }
  };
  // Interceptar navegação do Next.js router
}, []);
```

**APIs de teste:**
- `POST /api/study/test/start` — Iniciar tentativa de teste
- `POST /api/study/test/answer` — Registrar resposta (auto-save)
- `POST /api/study/test/submit` — Finalizar teste
- `POST /api/study/test/cancel` — Cancelar teste (saída da tela)
- `GET /api/study/test/resume` — Verificar teste em andamento

### 4.4 Expiração Automática de Testes

Testes em andamento (`in_progress`) há mais de 2 horas devem ser automaticamente marcados como `expired`:

```typescript
// Cron job ou verificação na abertura do módulo:
await prisma.testAttempt.updateMany({
  where: {
    status: 'in_progress',
    startedAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
  },
  data: { status: 'expired', canceledAt: new Date() }
});
```

**Critério de conclusão da Fase 4:**
- [ ] `PracticeState` funcional com save/resume/discard
- [ ] `TestAttempt` com start/answer/submit/cancel
- [ ] Cancelamento automático ao sair da tela no modo teste
- [ ] Confirmação de saída (modal/beforeunload) no modo teste
- [ ] Expiração automática de testes antigos
- [ ] Testes manuais de todos os fluxos

---

## Fase 5 — Painel Administrativo & Gestão de Conteúdo

**Objetivo:** Criar interface administrativa para gestão de usuários, conteúdos e assinaturas.

**Duração estimada:** 7-10 dias  
**Dependência:** Fase 4 concluída

### 5.1 Modelo de Conteúdo no Banco de Dados

Migrar questões dos arquivos JSON para o banco:

```prisma
model Question {
  id              String   @id @default(cuid())
  licenseId       String   @map("license_id")
  moduleKey       String   @map("module_key")

  ratingCode      String?  @map("rating_code")
  examCode        String?  @map("exam_code")
  sectionCode     String?  @map("section_code")
  sectionTitle    String?  @map("section_title")

  stem            String   // Enunciado da questão
  questionType    String   @default("single_choice") @map("question_type")

  // Opções e resposta correta (JSON)
  options         String   // JSON: [{"id": "A", "text": "..."}]
  correctOptionId String   @map("correct_option_id")

  explanation     String?  // JSON: {"correct": "...", "whyOthersAreWrong": {...}}
  references      String?  // JSON: [{"doc": "...", "area": "..."}]

  difficulty      Int      @default(1) // 1-5
  tags            String?  // JSON: ["tag1", "tag2"]
  status          QuestionStatus @default(draft)
  version         Int      @default(1)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  createdBy String?  @map("created_by")

  @@index([licenseId, moduleKey])
  @@index([status])
  @@map("questions")
}

enum QuestionStatus {
  draft
  validated
  published
  archived
}

model Flashcard {
  id         String   @id @default(cuid())
  questionId String   @map("question_id")
  licenseId  String   @map("license_id")
  moduleKey  String   @map("module_key")

  front      String   // Pergunta
  back       String   // Resposta

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([licenseId, moduleKey])
  @@map("flashcards")
}
```

### 5.2 Rotas do Admin Panel

- `GET /api/admin/users` — Listar usuários (paginado, filtros)
- `GET /api/admin/users/:id` — Detalhes do usuário
- `PATCH /api/admin/users/:id` — Editar usuário (role, plan, status)
- `GET /api/admin/questions` — Listar questões (paginado, filtros por módulo/status)
- `POST /api/admin/questions` — Criar questão
- `PATCH /api/admin/questions/:id` — Editar questão
- `DELETE /api/admin/questions/:id` — Arquivar questão
- `POST /api/admin/questions/import` — Importar questões em lote (JSON)
- `GET /api/admin/subscriptions` — Listar assinaturas
- `PATCH /api/admin/subscriptions/:id` — Gerenciar assinatura
- `GET /api/admin/dashboard` — Métricas (usuários ativos, perguntas respondidas, receita)

### 5.3 Páginas do Admin

- `/admin/dashboard` — Visão geral com métricas
- `/admin/users` — Gestão de usuários
- `/admin/questions` — Gestão de questões e flashcards
- `/admin/subscriptions` — Gestão de assinaturas
- `/admin/content` — Importação/exportação de conteúdo

**Critério de conclusão da Fase 5:**
- [ ] CRUD completo de questões via admin
- [ ] Importação de questões em lote (migração de JSON para DB)
- [ ] Gestão de usuários (listar, editar role/plan, desativar)
- [ ] Dashboard com métricas básicas
- [ ] Todas as rotas admin protegidas por `requireAdmin()`

---

## Fase 6 — Cache, Performance & Banco Não-Relacional

**Objetivo:** Otimizar performance com cache e considerar uso de banco não-relacional para dados específicos.

**Duração estimada:** 5-7 dias  
**Dependência:** Fase 5 concluída

### 6.1 Redis para Cache e Rate Limiting

**Quando usar Redis:**
- Cache de sessões de usuário (reduzir queries ao DB)
- Rate limiting distribuído (substituir Map em memória)
- Cache de questões por módulo (dados que não mudam frequentemente)
- Contadores de uso em tempo real (flashcards/dia, testes/semana)
- Fila de jobs assíncronos (emails, processamento de dados)

```bash
npm install ioredis
```

```typescript
// src/lib/redis.ts

import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache com TTL automático
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

// Rate limiting distribuído
export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.pexpire(key, windowMs);
  }
  return current <= maxAttempts;
}
```

### 6.2 Estratégias de Cache

| Dado | TTL | Estratégia |
|---|---|---|
| Questões por módulo | 1h | Cache-aside (invalidar no CRUD admin) |
| Perfil do usuário | 5min | Cache-aside |
| Entitlements do usuário | 5min | Cache-aside (invalidar na mudança de plano) |
| Contadores de uso (flashcards/dia) | Até meia-noite | TTL exato até reset |
| Sessões | 12h | Write-through |

### 6.3 Banco Não-Relacional (MongoDB) — Opcional

**Avaliação:** Para o MVP, **não recomendado** introduzir MongoDB. O PostgreSQL com JSONB atende todas as necessidades:

| Necessidade | Solução Recomendada |
|---|---|
| Armazenar respostas de teste (JSON variável) | PostgreSQL JSONB |
| Logs de atividade do usuário | PostgreSQL com particionamento |
| Dados de sessão de estudo | PostgreSQL + Redis cache |
| Analytics de uso | PostgreSQL views materializadas |

**Quando considerar MongoDB (pós-MVP):**
- Volume > 10M de registros de sessões de estudo
- Necessidade de schemas flexíveis para tipos de questão variados
- Analytics em tempo real com aggregation pipeline
- Dados de telemetria/eventos com schema variável

### 6.4 Otimizações de Query

```typescript
// Queries que devem ser otimizadas com índices e cache:

// 1. Dashboard do aluno (mais frequente)
// → Cache Redis com TTL 5min, invalidado no estudo
const studentDashboard = await cacheGet(`student:${userId}:dashboard`);

// 2. Questões de um módulo (carregadas no AdvancedEngine)
// → Cache Redis com TTL 1h, invalidado no admin
const questions = await cacheGet(`questions:${moduleKey}`);

// 3. Verificação de limites de uso
// → Counter Redis com TTL até meia-noite
const usage = await redis.get(`usage:${userId}:${mode}:${today}`);
```

**Critério de conclusão da Fase 6:**
- [ ] Redis configurado e funcional
- [ ] Cache implementado para questões e perfil
- [ ] Rate limiting migrado para Redis
- [ ] Contadores de uso em Redis
- [ ] Performance medida antes e depois (target: <200ms para APIs principais)

---

## Resumo das Fases

| Fase | Objetivo | Duração | Dependência |
|---|---|---|---|
| 1 | Fundação & Correções | 1-2 dias | — |
| 2 | Segurança & Auth | 3-5 dias | Fase 1 |
| 3 | DB Evolution & Progresso | 5-7 dias | Fase 2 |
| 4 | Estado de Estudo | 3-5 dias | Fase 3 |
| 5 | Admin Panel | 7-10 dias | Fase 4 |
| 6 | Cache & Performance | 5-7 dias | Fase 5 |
| **Total estimado** | | **24-36 dias** | |

---

## Apêndice: Checklist de Segurança para Produção

- [ ] `AUTH_SECRET` com valor forte (mínimo 64 caracteres, aleatório)
- [ ] `JWT_SECRET` separado do `AUTH_SECRET`
- [ ] Variáveis de ambiente via secret manager (não `.env` em repositório)
- [ ] HTTPS obrigatório
- [ ] Headers de segurança (CSP, HSTS, X-Frame-Options)
- [ ] CORS configurado para domínios específicos
- [ ] Logs de auditoria para ações administrativas
- [ ] Backups automáticos do PostgreSQL
- [ ] Monitoramento de erros (Sentry ou similar)
- [ ] Revisão de dependências (npm audit)
