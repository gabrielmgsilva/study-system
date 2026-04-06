# AME One — Módulo do Aluno (Next.js Mobile-First) — Prompt para Claude Code

## Contexto do Projeto

O AME One é uma plataforma de aprendizado de aviação estilo Duolingo, focada em certificações do Transport Canada (AME - Aircraft Maintenance Engineer). Já existe um admin Next.js com Prisma/PostgreSQL que gerencia conteúdos, planos e usuários.

Este prompt guia a construção do **módulo do aluno** — interface mobile-first para estudo em qualquer hora e lugar. O aluno vai usar primariamente pelo celular, estudando no intervalo do trabalho, no transporte, antes de dormir. Toda decisão de UX deve priorizar telas pequenas, interações com polegar, e sessões curtas.

## Stack Existente
- Next.js 14+ (App Router)
- Prisma ORM + PostgreSQL
- Autenticação existente (email/password com session)
- Tailwind CSS + Shadcn/UI
- Deploy target: GCP

## Princípio MOBILE-FIRST — Regras de Ouro

Estas regras se aplicam a TODAS as fases. Quebrar qualquer uma delas é um bug.

```
1. DESIGN: Criar para 375px primeiro, expandir para desktop depois.
   Nunca o contrário. Se algo não funciona em 375px, redesenhar.

2. NAVEGAÇÃO: Bottom tab bar no mobile (não sidebar). Sidebar aparece
   apenas em telas >= 1024px como complemento. O polegar alcança o bottom,
   não o topo.

3. TOUCH TARGETS: Mínimo 44x44px para qualquer elemento clicável.
   Opções de questão, botões, links — tudo 44px+. Dedos não são cursores.

4. CONTEÚDO: Uma coluna no mobile. Sem grids lado a lado em telas < 640px.
   Cards empilham verticalmente. Dashboard é scroll vertical.

5. SESSÕES DE ESTUDO: Fullscreen no mobile. Esconder navigation bars
   durante estudo para maximizar área útil. Apenas progress bar + questão.

6. GESTOS: Swipe para navegar entre questões (além de botões).
   Swipe left = próxima, swipe right = anterior. Pull-to-refresh no dashboard.

7. FEEDBACK: Haptic feedback (vibração) ao responder. Verde/vermelho
   instantâneo. Sem modais complexos — usar bottom sheets e toasts.

8. PERFORMANCE: Prefetch da próxima questão enquanto o aluno lê a atual.
   Skeleton loaders enquanto carrega. Nenhuma tela em branco.

9. OFFLINE-READY: Salvar estado da sessão no localStorage.
   Se perder conexão durante estudo, não perder respostas.
   Sync quando reconectar.

10. TIPOGRAFIA: Mínimo 16px para body text (evita zoom no iOS).
    Stems de questão em 18px. Opções em 16px. Tudo legível sem zoom.
```

## Convenções do Projeto
- Páginas do aluno: `app/(student)/...`
- Mobile-first CSS: usar `min-width` media queries (sm:, md:, lg:), NUNCA max-width
- Componentes de estudo: `components/student/` com prefixo do contexto
- Server Components por padrão, Client Components para interatividade
- Server Actions para mutations
- API Routes apenas para webhooks (Stripe)
- Breakpoints: mobile (default), sm (640px), md (768px), lg (1024px)

---

## ALTERAÇÕES NO BANCO DE DADOS (executar antes de iniciar as fases)

### Novas tabelas

```prisma
// Adicionar ao schema.prisma existente

model StudyEngine {
  id                Int       @id @default(autoincrement()) @map("id")
  userId            Int       @map("user_id")
  licenseId         String    @map("license_id")
  moduleKey         String    @map("module_key")
  
  currentDifficulty Int       @default(3) @map("current_difficulty")  // 1-5
  difficultyTrend   String    @default("stable") @map("difficulty_trend") // "up"|"down"|"stable"
  recentScores      String    @default("[]") @map("recent_scores") // JSON: [85, 72, 90]
  windowSize        Int       @default(5) @map("window_size")
  upperThreshold    Int       @default(80) @map("upper_threshold")
  lowerThreshold    Int       @default(50) @map("lower_threshold")
  totalSessions     Int       @default(0) @map("total_sessions")
  avgScore          Float     @default(0) @map("avg_score")
  
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, moduleKey])
  @@index([userId, licenseId])
  @@map("study_engines")
}

model WeakTopicTracker {
  id                  Int       @id @default(autoincrement()) @map("id")
  userId              Int       @map("user_id")
  moduleKey           String    @map("module_key")
  topicCode           String    @map("topic_code")
  errorCount          Int       @default(0) @map("error_count")
  totalAttempts       Int       @default(0) @map("total_attempts")
  errorRate           Float     @default(0) @map("error_rate")
  lastErrorAt         DateTime? @map("last_error_at")
  priority            Float     @default(0) @map("priority")
  nextReviewDate      DateTime? @map("next_review_date") // spaced repetition
  consecutiveCorrect  Int       @default(0) @map("consecutive_correct")
  
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @default(now()) @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, moduleKey, topicCode])
  @@index([userId, moduleKey, priority(sort: Desc)])
  @@map("weak_topic_trackers")
}

model UsageCounter {
  id          Int       @id @default(autoincrement()) @map("id")
  userId      Int       @map("user_id")
  mode        StudyMode @map("mode")
  periodKey   String    @map("period_key") // "2026-04-06"|"2026-W14"|"2026-04"
  count       Int       @default(0) @map("count")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, mode, periodKey])
  @@index([userId, mode])
  @@map("usage_counters")
}

model StudyGoal {
  id          Int       @id @default(autoincrement()) @map("id")
  userId      Int       @map("user_id")
  title       String    @map("title")
  description String?   @map("description")
  targetType  String    @map("target_type") // "module_completion"|"avg_score"|"streak"|"custom"
  targetValue Float     @map("target_value")
  currentValue Float    @default(0) @map("current_value")
  targetDate  DateTime? @map("target_date")
  isCompleted Boolean   @default(false) @map("is_completed")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, isCompleted])
  @@map("study_goals")
}
```

### Adicionar na StudySession existente
```prisma
  // Adicionar campo
  isQuickReview  Boolean  @default(false) @map("is_quick_review")
```

### Índices de performance

```sql
CREATE INDEX idx_study_progress_user_module ON study_progress(user_id, module_key, mode);
CREATE INDEX idx_session_answers_session ON session_answers(session_id, question_external_id);
CREATE INDEX idx_question_scores_user_module ON question_scores(user_id, module_key, score);
CREATE INDEX idx_weak_topics_priority ON weak_topic_trackers(user_id, module_key, priority DESC);
CREATE INDEX idx_weak_topics_review ON weak_topic_trackers(user_id, next_review_date) WHERE priority > 0;
CREATE INDEX idx_questions_published ON questions(topic_id, status, difficulty) 
  WHERE status = 'published' AND deleted_at IS NULL;
```

### Relações no User (adicionar)
```prisma
  studyEngines      StudyEngine[]
  weakTopicTrackers WeakTopicTracker[]
  usageCounters     UsageCounter[]
  studyGoals        StudyGoal[]
```

### View materializada para dashboard
```sql
CREATE MATERIALIZED VIEW user_dashboard_stats AS
SELECT u.id as user_id,
  COUNT(DISTINCT sp.module_key) FILTER (WHERE sp.questions_total > 0) as modules_started,
  SUM(ss.time_spent_ms) FILTER (WHERE ss.started_at > NOW() - INTERVAL '7 days') as weekly_study_ms,
  AVG(ta.score) FILTER (WHERE ta.status = 'completed') as avg_test_score,
  us.current_streak, us.total_xp
FROM users u
LEFT JOIN study_progress sp ON sp.user_id = u.id AND sp.deleted_at IS NULL
LEFT JOIN study_sessions ss ON ss.user_id = u.id AND ss.deleted_at IS NULL
LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.deleted_at IS NULL
LEFT JOIN user_streaks us ON us.user_id = u.id AND us.deleted_at IS NULL
GROUP BY u.id, us.current_streak, us.total_xp;
```

---

## FASE 1 — Stripe, Cadastro com Plano e Trial

**Objetivo**: Cadastro → escolhe plano → Stripe → trial ativado. Todo o fluxo mobile-friendly.

### 1.1 — Stripe Backend

```
lib/stripe.ts — Instância Stripe SDK.
  createCheckoutSession(userId, planId, interval): Stripe Checkout Session
  createPortalSession(customerId): Stripe Portal URL

app/api/webhooks/stripe/route.ts — POST webhook handler.
  Validar signature com STRIPE_WEBHOOK_SECRET.
  
  checkout.session.completed:
    Extrair metadata { userId, planId }. Atualizar user:
    stripe_customer_id, plan_id, subscription_status="trialing",
    subscription_expires_at = now + plan.trialDays. Criar SubscriptionEvent.

  customer.subscription.updated:
    Mapear status Stripe → interno. Atualizar user.

  customer.subscription.deleted:
    subscription_status = "expired"

  invoice.payment_succeeded:
    Trial → "active". Atualizar expires_at.

  invoice.payment_failed:
    subscription_status = "past_due"

  Retornar 200 sempre.
```

### 1.2 — Fluxo de Cadastro (mobile-first)

```
app/(auth)/register/page.tsx
  Tela cheia, centralizado verticalmente, padding 16px lateral.
  Inputs full-width, height 48px (touch-friendly).
  Botão "Create Account" sticky no bottom com safe-area padding.
  Link "Already have an account? Sign in" abaixo.
  Ao submeter → redirect /plans.

app/(auth)/plans/page.tsx
  MOBILE (default):
  - Toggle mensal/anual sticky no topo com background blur
  - Cards empilhados 1 coluna, full-width, padding 16px
  - Card recomendado: borda primária + badge "Most Popular" no topo
  - Cada card:
    - Nome do plano (18px bold)
    - Preço grande (24px): "$9.99/mo" ou "$89.99/yr"
    - Se anual: badge "Save 25%"
    - Features como lista checkmark (16px, 44px line-height)
    - Licenses: "Up to {max_licenses} certifications"
    - Trial: chip "7 days free"
    - Botão full-width "Start Free Trial" (48px height)
  
  DESKTOP (lg:): 3 colunas lado a lado.
  
  Ao clicar → Server Action cria Stripe Checkout → redirect.
  success_url: /onboarding/licenses
  cancel_url: /plans

app/(auth)/plans/success/page.tsx
  Centered spinner + "Setting up your account..."
  Poll até subscription confirmada → redirect /onboarding/licenses.
```

### 1.3 — Seleção de Licenças (Onboarding mobile)

```
app/(auth)/onboarding/licenses/page.tsx
  MOBILE:
  - Stepper no topo: ① Plan ✓ → ② Certifications → ③ Start
    (compact: dots ou mini steps, max 32px height)
  - Counter: "1 of 1 selected" (trial) com chip de cor
  - Se trial: card info "Trial includes 1 certification. Upgrade for more."
  - Cards de license empilhados full-width:
    - Cada card 80px min-height: ícone + nome + módulos count + switch toggle
    - Switch toggle à direita (44x24px, não checkbox)
    - Selecionada: background tint + check icon
    - Disabled (max atingido): opacity 0.5, switch disabled
  - Botão "Start Learning" sticky bottom, full-width, 48px
    (disabled se 0 selecionadas, label muda para "Select a certification")

  REGRAS:
  - Trial → max 1 switch ativo
  - Active → max plan.max_licenses
  - Criar LicenseEntitlement, setar onboarding_completed_at, primary_license_id
  - Redirect /dashboard

MIDDLEWARE (lib/auth-guard.ts):
  Rotas /dashboard/*, /study/*, /stats/*, /profile/*:
  - subscription_status == null → /plans
  - onboarding_completed_at == null → /onboarding/licenses
  - 0 entitlements ativos → /onboarding/licenses
```

### Critérios de validação:
- Todo o fluxo funciona em 375px sem scroll horizontal
- Inputs e botões >= 44px height
- Stepper dots visíveis em tela pequena
- Trial limita a 1 license

---

## FASE 2 — Navegação Mobile-First e Dashboard

**Objetivo**: Bottom tab bar, dashboard scrollável, sidebar apenas desktop.

### 2.1 — Sistema de Navegação

```
app/(student)/layout.tsx

  MOBILE (default, < 1024px):
  ┌──────────────────────────┐
  │ Header (56px, sticky)    │
  │ Logo  | Streak | Avatar  │
  ├──────────────────────────┤
  │                          │
  │    {children}            │
  │    (scroll vertical)     │
  │                          │
  ├──────────────────────────┤
  │ Bottom Tab Bar (64px)    │
  │ + safe area padding      │
  │ 🏠  📚  ⚡  📊  👤      │
  │ Home Study Quick Stats Me│
  └──────────────────────────┘

  DESKTOP (>= 1024px):
  ┌────────┬─────────────────┐
  │Sidebar │ Header + Content│
  │(260px) │                 │
  │        │ {children}      │
  │ Dash   │                 │
  │ PPL    │                 │
  │  >Cards│                 │
  │  >Pract│                 │
  │  >Test │                 │
  │ CPL    │                 │
  │ Results│                 │
  │ Goals  │                 │
  │ Settings                 │
  └────────┴─────────────────┘

  BOTTOM TABS (5):
  1. Home (dashboard) — /dashboard — ícone: house
  2. Study (hub de estudo) — /study — ícone: book
  3. Quick Review (FAB central, destaque) — /quick-review — ícone: lightning
  4. Stats (progresso) — /stats — ícone: chart
  5. Me (perfil) — /profile — ícone: person

  Tab "Quick Review" é o botão central:
  - Visualmente maior/elevado (estilo FAB)
  - Cor primária de fundo (contraste com as outras)
  - É O atalho principal — 1 tap para estudar

  Tab ativa: ícone preenchido + label + cor primária
  Tabs inativas: ícone outline + label muted
  Badge no Stats: weak topics pendentes (número)
  Badge no Home: review due (dot)

  IMPORTANTE: Esconder bottom tab bar durante sessão de estudo (fullscreen).
  Salvar scroll position do dashboard ao sair e restaurar ao voltar.

components/student/bottom-tabs.tsx         — 5 tabs, hidden em lg:
components/student/desktop-sidebar.tsx     — hidden em < lg:
components/student/mobile-header.tsx       — compacto, 56px
```

### 2.2 — Dashboard Mobile-First

```
app/(student)/dashboard/page.tsx

  Scroll vertical contínuo. Cada seção é autocontida.

  SEÇÃO 1 — Header Contextual
    "Hey {firstName}!" (só primeiro nome — espaço é precioso)
    Linha 2: 🔥 "{N} day streak" • "⚡ {totalXp} XP"
    Se trial: chip compacto "Trial: {N} days left" (warning color)

  SEÇÃO 2 — Upgrade Banner (condicional)
    SOMENTE se trial ou limites atingidos.
    Card compacto 56px: ícone + 1 linha texto + botão "Upgrade" small
    Swipeable para dismiss (temporário).
    NO MOBILE, banner grande é inimigo do conteúdo. Manter mínimo.

  SEÇÃO 3 — Quick Actions (scroll horizontal)
    Container overflow-x-auto com snap:
    [ 🔥 Quick Review ] [ 📖 Continue Module M ] [ 📝 Take Test ] [ 📊 Scores ]
    Cada pill: 44px height, padding horizontal, ícone + label
    "Quick Review" sempre primeiro, cor destaque.
    Snap scroll para não parar no meio de um pill.

  SEÇÃO 4 — Continue Learning (card full-width)
    Background com gradiente sutil (como referência do design).
    "RECOMMENDED" badge pequeno
    "Continue {moduleName}" — bold 18px
    "{subjectName} – {completion}%" — 14px muted
    Progress bar
    Botão "Continue →" (44px height)
    Se nunca estudou: "Start your first lesson"

  SEÇÃO 5 — Progress (grid 2x2)
    ┌──────────┬──────────┐
    │ Modules  │ Study    │
    │ 12/18    │ 24h      │
    ├──────────┼──────────┤
    │ Avg Score│ Streak   │
    │ 85% ↑5% │ 7 days   │
    └──────────┴──────────┘
    Cards com background secondary, radius lg.
    Ícone pequeno (20px) no canto, valor grande (20px bold), label (13px muted).
    lg: 4 colunas.

  SEÇÃO 6 — Course Progress (cards empilhados)
    "Course Progress" + filter pills (All | In Progress | Done)
    Pills em scroll horizontal.
    Module cards full-width:
    - Ícone + "Module M – Airframe" + "53%" (right-aligned)
    - "15 topics • 8 completed" (14px muted)
    - Progress bar
    - Bottom: "12h left" | "78% avg" | "Continue" link
    Locked modules: opacity 50%, cadeado, "Upgrade to Unlock"
    lg: grid 2 colunas.

  SEÇÃO 7 — Topics to Review
    "Review needed" + "See all" link
    Max 3 cards no mobile. Card compacto:
    - Borda left colorida (red/yellow/blue)
    - Topic name + "Module M • 62%" + botão "Practice" (ghost, small)
    44px min height por card.

  SEÇÃO 8 — Goals (condicional)
    Só se tem goals ativos.
    Scroll horizontal de mini-cards (similar Quick Actions).
    Cada: título curto, mini progress bar, "5 days"
    Se sem goals: CTA compacto "Set a study goal →"

  SERVICE:
  lib/services/dashboard.ts
    getDashboardData(userId): Promise.all para buscar tudo em paralelo.
    Incluir refresh da materialized view se última sessão foi recente.
```

### Critérios de validação:
- Bottom tabs tocáveis em 375px (5 tabs, cada ~75px de width, 64px height)
- Tab Quick Review visualmente destacada (FAB-like)
- Dashboard scroll fluido sem janks
- Quick Actions scroll horizontal com snap
- Cards empilham em 1 coluna no mobile
- lg: sidebar aparece, bottom tabs somem

---

## FASE 3 — Motor Inteligente de Estudo

**Objetivo**: Adapta dificuldade e seleção de questões baseado no desempenho.

### 3.1 — Motor de Seleção

```
lib/services/study-engine.ts

selectQuestions(userId, moduleKey, mode, count):

  1. Buscar/criar StudyEngine para (userId, moduleKey)
  2. Buscar WeakTopicTrackers do user para esse module

  3. Distribuição por modo:

     FLASHCARD (default 10 questões — sessão curta para mobile):
       60% tópicos fracos (priority > 0 DESC)
       20% dificuldade atual
       20% aleatórias (descoberta)
       Excluir respondidas corretamente nas últimas 24h

     PRACTICE (default 15 questões):
       40% tópicos fracos
       40% dificuldade atual ±1
       20% aleatórias

     TEST (admin define ou 40 default):
       Proporcional ao weight dos subjects (simula exame TC)
       Dificuldade: currentDifficulty ±1
       100% aleatório nos critérios (sem viés de weak topics)
       Nunca repetir do último test do user nesse module

     QUICK REVIEW (5 questões — botão central do bottom tab):
       100% WeakTopicTrackers CROSS-MODULE (qualquer module enrolled)
       Prioriza: priority DESC, nextReviewDate <= now
       Se insuficientes: aleatórias de qualquer module

  4. Query: status='published', difficulty range, ORDER BY priority + RANDOM()
  5. Questões insuficientes no range → expandir (±2, depois sem filtro)
  6. Shuffle Fisher-Yates resultado + shuffle opções cada questão


updateAfterSession(userId, moduleKey, sessionId):

  1. Buscar SessionAnswers
  2. Score = (correct / total) * 100

  3. StudyEngine:
     Push score em recentScores (FIFO, max windowSize)
     Média janela >= 80% → currentDifficulty++ (max 5), trend="up"
     Média janela <= 50% → currentDifficulty-- (min 1), trend="down"
     Senão → trend="stable"
     totalSessions++, avgScore recalculada

  4. WeakTopicTrackers (para cada answer):
     totalAttempts++
     Se incorrect: errorCount++, lastErrorAt=now, consecutiveCorrect=0
     Se correct: consecutiveCorrect++
     errorRate = errorCount / totalAttempts
     priority = errorRate × recency_weight × frequency_weight
     Se errorRate < 0.2 e totalAttempts >= 10 → priority = 0 (dominado)
     Spaced repetition: se correct e priority > 0:
       nextReviewDate = now + 2^consecutiveCorrect dias (1d, 2d, 4d, 8d...)
       Max: 30 dias

  5. QuestionScore: correct → min(5, +1), incorrect → max(0, -1)
```

### 3.2 — Verificação de Limites

```
lib/services/usage-limiter.ts

checkAndIncrementUsage(userId, mode):
  1. Buscar plan
  2. Se null → defaults (5/day flashcard, 3/day practice, 1/week test)
  3. Obter limit e unit para mode
  
  >>> SE limit == -1 → RETORNAR { allowed: true, remaining: -1 } <<<
  >>> IMEDIATAMENTE. SEM NENHUMA OUTRA VERIFICAÇÃO. <<<
  >>> NUNCA fazer count >= -1. Isso SEMPRE é true e BLOQUEIA. <<<
  
  4. periodKey: "2026-04-06"|"2026-W14"|"2026-04"
  5. Buscar/criar UsageCounter
  6. Se count >= limit → { allowed: false, remaining: 0, resetsAt }
  7. count++ → { allowed: true, remaining: limit - count, resetsAt }

  Quick Review: NÃO consome counter (é incentivo, não limitação).
  Exceção: expired users → max 1 quick review por dia.
```

---

## FASE 4 — Modos de Estudo (Mobile-First, Touch-Optimized)

**Objetivo**: 3 experiências de estudo + Quick Review, otimizadas para polegar e sessões curtas.

### 4.1 — Hub de Estudo (tab Study)

```
app/(student)/study/page.tsx

  MOBILE:
  Se múltiplas licenses: tabs horizontais no topo (scrollable).
  Lista de modules da license selecionada:
  Cada module card full-width:
  - Nome, progress bar, completion %
  - 3 botões modo inline (44px height cada):
    [ 📖 Cards ] [ ✏️ Practice ] [ 📝 Test ]
  - Abaixo de cada botão: "3/10" ou "∞"
  
  Tap em modo → /study/[licenseId]/[mode]?module={moduleKey}
```

### 4.2 — Shell Fullscreen de Estudo

```
components/student/study-session-shell.tsx

  Wrapper reutilizável por TODOS os modos de estudo.
  Ao entrar em sessão de estudo:
  - Esconder bottom tab bar (CSS: display none)
  - Esconder header do layout
  - Full viewport height (100dvh — dynamic viewport height para iOS Safari)
  - Safe area padding (env(safe-area-inset-*))

  Layout:
  ┌──────────────────────────┐
  │ ✕      ●●●○○○○    3/10  │ ← Mini header: close, dots/bar, counter
  ├──────────────────────────┤
  │                          │
  │     [Conteúdo do modo]   │ ← Área principal (flex-1)
  │                          │
  ├──────────────────────────┤
  │     [Ação principal]     │ ← Bottom action area (safe-area)
  └──────────────────────────┘

  ✕ (close): confirma "Save and exit?" → salva estado → volta ao study hub
  Progress: dots para <=15 questões, barra para >15
  
  Estado salvo em localStorage a cada resposta (offline-ready):
  - sessionId, currentIndex, answers[], startedAt
  - Se perder conexão: continua respondendo, sync ao reconectar
  - Se fechar app: ao reabrir, bottom sheet "Resume session?"

  Prefetch: ao renderizar questão N, buscar questão N+1 em background.
```

### 4.3 — Flashcard Mode

```
app/(student)/study/[licenseId]/flashcard/page.tsx

  Dentro do study-session-shell:

  CARD CENTRAL (80% da tela):
  ┌────────────────────┐
  │                    │
  │   What is the      │  ← Frente: stem da questão
  │   minimum flight   │     Font 18px, centralizado
  │   visibility for   │
  │   VFR in Class C?  │     TAP para virar
  │                    │     ou SWIPE UP
  │   ── tap to flip ──│
  └────────────────────┘
  
  Após flip (CSS 3D transform, 300ms):
  ┌────────────────────┐
  │ ✓ 3 statute miles  │  ← Resposta correta (verde, bold)
  │                    │
  │ Per CAR 602.114,   │  ← Explicação (14px)
  │ VFR in controlled  │
  │ airspace requires  │
  │ 3 SM visibility.   │
  │                    │
  │ 📖 CAR 602.114     │  ← Referência TC (link-style)
  └────────────────────┘

  BOTTOM ACTIONS (zona do polegar):
  ┌──────────────┬──────────────┐
  │  ✗ Didn't    │  ✓ Knew it   │  ← 2 botões, 50% width cada
  │    know      │              │     64px height (extra touch)
  │  (vermelho)  │   (verde)    │     Haptic ao pressionar
  └──────────────┴──────────────┘

  GESTOS ALTERNATIVOS (após flip):
  - Swipe LEFT → "Knew it"
  - Swipe RIGHT → "Didn't know"
  - Transição: card atual desliza para fora, próximo desliza para dentro

  RESULTADO (bottom sheet, slide-up):
  - Score ring animado (ex: 7/10)
  - "+15 XP!" com counter animation
  - "🔥 8 day streak!"
  - Se difficulty mudou: "Difficulty: ↑ Level 4"
  - Lista colapsada dos errados (tap para expandir cada)
  - [ Review Mistakes ] [ Done ] — botões full-width empilhados
  
  updateAfterSession em background (não bloqueia UI do resultado)
```

### 4.4 — Practice Mode

```
app/(student)/study/[licenseId]/practice/page.tsx

  Dentro do study-session-shell:

  QUESTÃO (área principal):
  Scroll se stem é longo. Padding 16px.
  Stem em 18px, line-height 1.5.

  OPÇÕES (cards tocáveis):
  Cada opção: card full-width, min 52px height (44px + 8px padding)
  - Default: borda subtle, background white
  - Selecionada: borda primária, background tint
  - Correta (após submit): borda verde, background verde claro, ✓ icon
  - Errada (após submit): borda vermelha, background vermelho claro, ✗ icon

  BOTTOM ACTION:
  Antes de selecionar: botão disabled "Select an answer"
  Após selecionar: "Check Answer" (enabled, primary)
  Após check: "Next Question →" (animação de slide)

  FEEDBACK INLINE (após check):
  Card expandível abaixo das opções:
  - Se correto: "✓ Correct!" em verde
  - Se errado: "✗ The answer is {option}" em vermelho
  - Explicação (max 3 linhas, "Show more" se longo)
  - Referência TC como chip (ex: "CAR 602.114")

  HAPTIC: vibração curta ao responder (correct = 1 pulse, wrong = 2 pulses)

  PAUSE/RESUME:
  ✕ → "Save and exit?" → salva PracticeState (currentIndex, answers)
  Ao reabrir /practice com module que tem PracticeState:
  Bottom sheet: "Resume from Q8/15? [Resume] [Start New]"
  PracticeState expira em 24h (soft delete se expirado)

  RESULTADO: mesmo bottom sheet do flashcard + topic breakdown compacto:
  Cada topic: nome + accuracy pill (ex: "Hydraulics 62%" em vermelho)
```

### 4.5 — Test Mode

```
app/(student)/study/[licenseId]/test/page.tsx

  TELA INICIAL (pre-test):
  Card com aviso: "Simulates a TC exam. No feedback until the end."
  Specs: "40 questions • 60 min • Pass: 70%"
  Botão "Start Test" full-width (com confirmação modal)

  TELA DE TESTE (fullscreen, dentro do shell):

  HEADER MINIMAL:
  ✕ | Q12/40 | ⏱ 47:32
  Timer: cor normal até 10min restantes → warning (amber) → danger (red, pulsa)

  QUESTÃO: mesmo layout do practice MAS sem feedback.
  Ao selecionar opção → opção fica com borda primária (marcada).
  Botão bottom: "Next" (não "Check Answer").
  Nenhuma indicação de correto/incorreto.

  NAVEGAÇÃO:
  ┌────────────┬──────────┬────────────┐
  │  ← Prev    │  🚩 Flag │   Next →   │  ← 3 botões, zona do polegar
  └────────────┴──────────┴────────────┘
  
  Flag: marca questão (ícone muda de cor). Questões flagged aparecem no grid.

  QUESTION GRID (bottom sheet ao tap em "Q12/40"):
  Grid 8x5 de números (1-40):
  - Cinza claro: não respondida
  - Azul: respondida
  - Amber: flagged
  - Ring/borda: questão atual
  Tap em número → pula para essa questão. Dismiss sheet.

  FINALIZAR:
  Botão "Finish Test" aparece após última questão.
  Confirmação: "You have {N} unanswered questions. Finish?"
  Timer expira → auto-finish.
  ✕ → "Continue Test" | "Finish Now"

  RESULTADO (page dedicada, não bottom sheet):

  app/(student)/study/[licenseId]/test/result/[testId]/page.tsx

  Seção 1 — Score Heroico:
  Score grande centralizado com ring animation (ex: 85%)
  "PASSED ✓" verde ou "Keep going! ↗" amarelo (NUNCA "FAILED")
  Subtitle: "You need 70% to pass"

  Seção 2 — Resumo:
  Cards inline: tempo, corretas/total, comparação com anterior ("↑12%!")

  Seção 3 — Topic Breakdown (empilhado):
  Cada topic: nome + accuracy bar + correct/total
  Ordenado: piores primeiro. Red/amber/green coding.

  Seção 4 — Question Review (accordion):
  Cada questão: "Q1 ✓" ou "Q1 ✗" (colapsada)
  Tap: expande com stem, sua resposta, correta, explicação, ref TC
  Toggle "Show only incorrect" (filtro)

  Bottom sticky: [ Retake Test ] [ Dashboard ]
```

### 4.6 — Quick Review (botão central FAB do bottom tab)

```
app/(student)/quick-review/page.tsx

  CONCEITO: Sessão ultra-rápida. 5 questões, ~2 min, cross-module.
  É o principal driver de engagement e retenção.

  Ao abrir:
  - Motor seleciona 5 questões (QUICK REVIEW mode)
  - NÃO consome usage counter (é incentivo, não limitação)
  - Cria StudySession com isQuickReview=true
  - Entra direto na sessão (sem tela de seleção)

  UX: mesmo do practice (feedback imediato)
  Resultado: bottom sheet compacto (score, XP, streak)

  SUBSCRIPTION EXPIRADA:
  - Quick Review AINDA funciona (hook de engagement)
  - Limite: 1 por dia para expired users
  - Após resultado: CTA suave "Want more? Reactivate your plan."
  - NUNCA bloquear totalmente — manter o aluno engajado
```

### Critérios de validação:
- Flashcard: swipe + tap + flip 3D suaves em 375px
- Practice: opções 52px+, feedback inline, resume via bottom sheet
- Test: sem feedback, timer, grid via bottom sheet, resultado page
- Quick Review: 1 tap para estudar, cross-module, sem contar uso
- TODOS: fullscreen (sem tabs/header), estado em localStorage
- Limite -1: nenhuma verificação, botão Start funciona sempre
- Touch targets: nada menor que 44px em toda a experiência de estudo

---

## FASE 5 — Stats e Histórico (tab Stats)

```
app/(student)/stats/page.tsx

  Tabs pill no topo (scroll horizontal se necessário):
  Overview | History | Topics

  TAB OVERVIEW:
    Metrics 2x2 (igual dashboard)
    Score Evolution: line chart (horizontal scroll mobile, Recharts responsive)
    Study Time: bar chart semanal compact
    Difficulty pills por module

  TAB HISTORY:
    Cards empilhados, infinite scroll (não paginação — scroll é mais natural no mobile).
    Card: data, module, mode icon, score badge, tempo.
    Tap → /stats/session/[id] com detalhes
    Filtros via bottom sheet (não inline — economiza espaço)

  TAB TOPICS:
    Cards: topic name, module, accuracy bar, trend arrow, botão "Practice"
    Ordenar: piores primeiro
```

---

## FASE 6 — Goals e Gamificação

```
Acessível via tab "Me" > Goals, e via dashboard.

app/(student)/goals/page.tsx
  Cards de goals empilhados, cada um com progress ring + title + deadline
  FAB "+" para criar (abre bottom sheet de criação)
  
  Goals automáticos em momentos chave:
  - Inscrição: "Complete all modules of {license}"
  - Primeiro module: "Maintain 7-day streak"
  - Score baixo: "Reach 70% in {module}"
  
  GAMIFICAÇÃO:
  - Daily Challenge: card especial no dashboard, 1 questão hard, +50 XP
  - Streak Freeze: compra com 100 XP no profile, congela 1 dia
  - Milestones: celebration fullscreen (confetti) ao atingir 25/50/75/100%
  - Toasts de XP: "+10 XP!" toast discreto após cada sessão
```

---

## FASE 7 — Profile, Assinatura e Access Guard

```
app/(student)/profile/page.tsx — Tab "Me"

  MOBILE:
  Avatar circle + nome + plano badge
  Stats resumo: XP | Streak | Sessions

  Menu list (items 52px height, chevron right):
  - My Plan → /profile/plan
  - Certifications → /profile/licenses
  - Study Goals → /goals
  - Settings → /profile/settings (dark mode, notifications)
  - Help & Support
  - Sign Out

app/(student)/profile/plan/page.tsx
  Plano atual, status, trial countdown, uso do período
  "Change Plan" → Stripe Checkout
  "Manage Billing" → Stripe Portal

app/(student)/profile/licenses/page.tsx
  Enrolled: cards com toggle off para remover
  Available: cards com toggle on para adicionar (respeita max)

ACCESS GUARD (lib/services/subscription-guard.ts):

  assertAccess(user):
    null|"expired"|"unpaid" → redirect /plans (ou throw em Server Actions)
    "trialing"|"active"|"canceled" → check expires_at
    "past_due" → 3 dias de graça

  Expirado PODE ver: dashboard (read-only), stats, profile, quick review (1/dia)
  NÃO PODE: iniciar sessões, testes, salvar prática

  WORDING NA UI (nunca punitivo):
  - "Your plan is paused" (não "expired")
  - "Reactivate to continue studying" (não "blocked")
  - "Your progress is saved" (reassurance)
```

---

## SUGESTÕES ADICIONAIS

### PWA (Progressive Web App)
```
1. next.config.js: integrar next-pwa
2. manifest.json: name "AME One", standalone display, theme-color
3. Service Worker: cache assets + content API responses
4. Meta tags: apple-mobile-web-app-capable, viewport, theme-color
5. Splash screens para iOS (apple-touch-startup-image)
6. Resultado: "Add to Home Screen" funciona como app nativo
```

### Performance Mobile
```
1. 100dvh ao invés de 100vh (fix iOS Safari address bar)
2. -webkit-overflow-scrolling: touch para scroll lists
3. will-change: transform nos cards de flip
4. Intersection Observer para lazy load de seções do dashboard
5. Skeleton screens (não spinners) durante loading
6. Preconnect para CDN fonts/assets
7. Image optimization via next/image com priority nas hero images
```

### Motor de Estudo — Melhorias
```
1. Smart session length: se completion rate < 70%, sugerir sessões mais curtas
   (8 ao invés de 15). Adaptar baseado em dados.

2. Confidence Rating: após responder, 3 emojis rápidos 😟😐😊
   High confidence + correct → intervalo maior no spaced repetition
   Low confidence + correct → manter na revisão (acertou por sorte)

3. Session preloading: prefetch questão N+1 enquanto aluno lê N.

4. Time-of-day optimization: se aluno estuda mais à noite,
   sugerir "Evening review: 5 questions before bed?" via push
```

### Engagement Mobile
```
1. Haptic patterns: 1 vibração curta = correto, 2 curtas = errado, 
   longa = streak incrementado, pattern especial = milestone

2. Micro-animations: card slide-in, score counter roll, 
   streak flame pulse, XP float-up (+10 text animado)

3. Sound effects OPCIONAIS (toggle em settings):
   "ding" ao acertar, "womp" suave ao errar, "ta-da" no milestone

4. Dark mode: toggle em settings, respeitar prefers-color-scheme do OS,
   ESSENCIAL para estudo noturno

5. Landscape lock: forçar portrait durante sessões de estudo
   (evita rotação acidental ao deitar no sofá)

6. Weekly push notification: "You studied 3h this week! 
   Your weak spot: Hydraulics. Quick review?"
```
