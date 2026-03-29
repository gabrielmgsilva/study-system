# AME ONE — Contexto do Projeto

> Documento de referência para qualquer agente de IA. Contém visão geral, stack tecnológica, arquitetura, estado atual e convenções do projeto.

---

## 1. Visão Geral

**AME ONE** é uma plataforma SaaS de estudo para profissionais de manutenção aeronáutica baseada nos padrões da **Transport Canada (TC)**. O sistema oferece preparação para exames de licenciamento (AME — Aircraft Maintenance Engineer) com flashcards, prática e testes simulados.

**Empresa:** Cerberus Tecnologia  
**Domínio:** `ameone.app`  
**Repositório:** `study-system`  
**Status:** Em desenvolvimento ativo (MVP funcional)

---

## 2. Stack Tecnológica

| Camada         | Tecnologia                   | Versão    |
| -------------- | ---------------------------- | --------- |
| Framework      | Next.js (App Router)         | 15.5.x    |
| Linguagem      | TypeScript                   | 5.x       |
| UI Library     | React                        | 19.x      |
| Estilização    | Tailwind CSS                 | 4.x       |
| Componentes    | shadcn/ui (new-york style)   | —         |
| Ícones         | Lucide React                 | 0.509.x   |
| Formulários    | React Hook Form + Zod        | 7.x / 3.x |
| ORM            | Prisma                       | 6.19.x    |
| Banco de Dados | PostgreSQL                   | —         |
| Autenticação   | JWT stateless (jose, HS256)  | —         |
| Pagamentos     | Stripe (checkout + webhooks) | 17.x      |
| Email          | Resend                       | 6.x       |
| Gráficos       | Recharts                     | 2.x       |
| Temas          | next-themes (dark/light)     | —         |

### Dependências Notáveis

- `bcryptjs` — hashing de senhas (com fallback de migração PBKDF2 → bcrypt)
- `class-variance-authority` + `clsx` + `tailwind-merge` — utilitários de classes CSS
- `cmdk` — command palette
- `embla-carousel-react` — carrosséis
- `vaul` — drawer mobile
- `sonner` — toasts/notificações
- `@elevenlabs/react` — integração TTS (text-to-speech)

---

## 3. Arquitetura

### 3.1 Estrutura de Diretórios

```
study-system/
├── data/                    # Bancos de questões (JSON estáticos)
│   ├── m/                   # Licença M (Mechanical)
│   │   ├── airframe/        # Questões de Airframe (11.json–30.json)
│   │   ├── powerplant/      # Questões de Powerplant (31.json–42.json)
│   │   └── standard_practices/
│   ├── e/                   # Licença E (Avionics)
│   │   ├── e-rating/
│   │   └── standardpractices/
│   ├── s/                   # Licença S (Structures)
│   │   ├── s-rating/
│   │   └── standardpractices/
│   ├── regs/                # Regulamentos (CARs + Standards)
│   └── bregs/               # Balloon Regulations
├── docs/                    # Documentação de arquitetura
├── prisma/
│   └── schema.prisma        # Schema do banco (PostgreSQL)
├── public/                  # Assets estáticos
├── src/
│   ├── app/                 # App Router (pages + API routes)
│   │   ├── page.tsx         # Landing page (redireciona para locale)
│   │   ├── [locale]/        # Páginas públicas localizadas (en/pt)
│   │   ├── auth/            # Login, registro, reset de senha
│   │   ├── admin/           # Painel administrativo
│   │   ├── app/             # Área do estudante (protegida)
│   │   │   ├── hub/         # Dashboard principal
│   │   │   ├── m/           # Estudo Licença M
│   │   │   ├── e/           # Estudo Licença E
│   │   │   ├── s/           # Estudo Licença S
│   │   │   ├── balloons/    # Estudo Balloons
│   │   │   ├── regs/        # Estudo Regulamentos
│   │   │   ├── account/     # Perfil do usuário
│   │   │   ├── onboarding/  # Fluxo de onboarding
│   │   │   └── student/     # Painel do estudante
│   │   └── api/             # API Routes (51+ endpoints)
│   ├── components/
│   │   ├── admin/           # AdminDialog, AdminShell, AdminTopBar
│   │   ├── app/             # LoggedAppShell, AppHomePage
│   │   ├── auth/            # Login, Register, Onboarding pages
│   │   ├── landing/         # PublicLandingPage, LandingPricingSection
│   │   ├── study/           # AdvancedEngine (motor de estudo)
│   │   └── ui/              # 50+ componentes shadcn/ui
│   ├── contexts/            # AuthContext
│   ├── hooks/               # use-mobile
│   ├── lib/                 # Lógica de negócio e utilitários
│   │   ├── i18n/            # Internacionalização (en/pt)
│   │   ├── auth.ts          # Hash de senhas
│   │   ├── authz.ts         # Autorização por role
│   │   ├── jwt.ts           # Signing/verificação JWT
│   │   ├── guards.ts        # requireAuth(), requireAdmin()
│   │   ├── routes.ts        # Constantes de rotas tipadas
│   │   ├── stripe.ts        # Cliente Stripe
│   │   ├── prisma.ts        # Singleton Prisma
│   │   ├── planEntitlements.ts  # Mapeamento plano → limites
│   │   ├── studyAccess.ts   # Tipos de acesso por modo de estudo
│   │   └── modules.ts       # Definição de módulos por licença
│   └── types/               # Tipos TypeScript compartilhados
└── package.json
```

### 3.2 Modelo de Autenticação

- **JWT stateless** armazenado em cookie httpOnly (`ameone_token`)
- Algoritmo: HS256 via `jose`
- TTL: 12 horas
- Payload: `{ sub: userId, email, role: 'user' | 'admin' }`
- Middleware Next.js protege rotas `/app/*` e `/admin/*`
- Administradores acessam apenas `/admin/*`, usuários apenas `/app/*`

### 3.3 Modelo de Autorização

- **2 roles**: `user` (estudante) e `admin`
- Middleware redireciona baseado em role + estado de autenticação
- Guards server-side: `requireAuth()` e `requireAdmin()` em API routes
- Entitlements controlam acesso a módulos específicos

---

## 4. Modelo de Negócio

### 4.1 Licenças (Produtos)

O sistema é organizado por **licenças de manutenção aeronáutica** baseadas na Transport Canada:

| ID         | Licença            | Módulos                                           |
| ---------- | ------------------ | ------------------------------------------------- |
| `m`        | **Mechanical (M)** | Standard Practices, Airframe, Powerplant, Logbook |
| `e`        | **Avionics (E)**   | Standard Practices, Rating Avionics, Logbook      |
| `s`        | **Structures (S)** | Standard Practices, Rating Structures, Logbook    |
| `balloons` | **Balloons**       | BRegs, Logbook                                    |
| `regs`     | **Regulations**    | CARs, Standards (global, todas as licenças)       |

### 4.2 Planos de Assinatura

3 tiers com limites de uso por período:

| Feature         | Basic     | Standard  | Premium   |
| --------------- | --------- | --------- | --------- |
| Flashcards      | ~20/dia   | Ilimitado | Ilimitado |
| Practice        | ~2/dia    | Ilimitado | Ilimitado |
| Tests           | ~1/semana | ~3/semana | Ilimitado |
| Logbook         | ❌        | ❌        | ✅        |
| Questões/sessão | Limitado  | Limitado  | Ilimitado |

- Os limites são configuráveis por plano no banco de dados (tabela `plans`)
- Stripe gerencia billing (monthly/annual) com checkout sessions e webhooks
- Cupons de desconto suportados (tabela `coupons`, integração Stripe)
- Tracking de uso é local (localStorage) no MVP, com migração futura para server-side

### 4.3 Modos de Estudo

1. **Flashcard** — Questão com resposta correta destacada
2. **Practice** — Feedback imediato após cada resposta
3. **Test** — Simulado com N questões aleatórias, resultado ao final

### 4.4 Formato das Questões (JSON)

```json
{
  "qid": "AF-0012",
  "examCode": "AF",
  "topicCode": "13.1",
  "topicTitle": "Mechanical/servo powered flight controls",
  "question": "Which statement best describes a servo-powered flight control system?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correctAnswer": "B",
  "reference": "TP 14038-E AF 13.1",
  "explanation": "..."
}
```

---

## 5. Banco de Dados (Prisma/PostgreSQL)

### 5.1 Modelos Principais

| Modelo                           | Propósito                                                          |
| -------------------------------- | ------------------------------------------------------------------ |
| `User`                           | Usuários (estudantes e admins)                                     |
| `Session`                        | Sessões de auth                                                    |
| `PasswordResetToken`             | Tokens de reset de senha                                           |
| `Plan`                           | Planos de assinatura (configura limites)                           |
| `Entitlement`                    | Acesso por módulo (legado)                                         |
| `LicenseEntitlement`             | Acesso por licença (modelo atual)                                  |
| `CreditAccount` / `CreditLedger` | Sistema de créditos virtuais                                       |
| `StudyProgress`                  | Progresso por módulo/modo                                          |
| `StudySession`                   | Sessões de estudo individuais                                      |
| `UserStreak`                     | Streaks de estudo + XP                                             |
| `PracticeState`                  | Estado persistido de prática em andamento                          |
| `TestAttempt`                    | Tentativas de teste (em andamento, concluído, cancelado, expirado) |
| `License`                        | Licenças (M, E, S, Balloons, Regs)                                 |
| `Module`                         | Módulos por licença                                                |
| `Subject`                        | Assuntos por módulo                                                |
| `Topic`                          | Tópicos por assunto                                                |
| `Question`                       | Questões com locale, dificuldade, status, tags                     |
| `QuestionOption`                 | Alternativas por questão                                           |
| `QuestionExplanation`            | Explicação da resposta correta                                     |
| `QuestionOptionExplanation`      | Explicação por alternativa                                         |
| `QuestionReference`              | Referências bibliográficas                                         |
| `Logbook`                        | Logbooks digitais                                                  |
| `Signatory`                      | Signatários de logbook                                             |
| `SignatoryVerificationRequest`   | Verificação de signatários                                         |
| `TaskSignatureRequest`           | Solicitação de assinatura                                          |
| `AuditEvent`                     | Eventos de auditoria                                               |
| `Coupon`                         | Cupons de desconto (integração Stripe)                             |
| `SubscriptionEvent`              | Eventos de assinatura Stripe                                       |

### 5.2 Enums

- `UserRole`: `user`, `admin`
- `LimitUnit`: `day`, `week`, `month`
- `StudyMode`: `flashcard`, `practice`, `test`
- `TestStatus`: `in_progress`, `completed`, `canceled`, `expired`
- `QuestionType`: `single_choice`
- `QuestionStatus`: `draft`, `review`, `published`, `archived`
- `ContentLocale`: `en`, `pt`
- `SignatoryStatus`: `draft`, `pending`, `verified`, `needs_reverify`

---

## 6. API Routes

### 6.1 Auth (`/api/auth`)

| Método | Endpoint                    | Descrição                       |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/api/auth/register`        | Registro de usuário             |
| POST   | `/api/auth/login`           | Login (retorna JWT no cookie)   |
| POST   | `/api/auth/logout`          | Logout (limpa cookie)           |
| GET    | `/api/auth/me`              | Retorna dados do usuário logado |
| POST   | `/api/auth/forgot-password` | Solicitar reset de senha        |
| POST   | `/api/auth/reset-password`  | Resetar senha com token         |
| POST   | `/api/auth/verify`          | Verificação de email            |

### 6.2 Usuário (`/api/me`)

| Método   | Endpoint                 | Descrição                                    |
| -------- | ------------------------ | -------------------------------------------- |
| GET/POST | `/api/me/profile`        | Perfil do usuário                            |
| POST     | `/api/me/password`       | Alterar senha                                |
| GET      | `/api/me/student`        | Estado do estudante (entitlements, créditos) |
| POST     | `/api/me/onboarding`     | Completar onboarding                         |
| GET      | `/api/me/billing-portal` | Link para portal de billing Stripe           |

### 6.3 Estudo (`/api/study`)

| Método | Endpoint                    | Descrição                  |
| ------ | --------------------------- | -------------------------- |
| POST   | `/api/study/session/start`  | Iniciar sessão de estudo   |
| POST   | `/api/study/session/finish` | Finalizar sessão de estudo |
| GET    | `/api/question-by-id`       | Buscar questão por ID      |

### 6.4 Pagamentos (`/api/checkout`, `/api/webhooks`)

| Método | Endpoint               | Descrição                       |
| ------ | ---------------------- | ------------------------------- |
| POST   | `/api/checkout`        | Criar sessão de checkout Stripe |
| POST   | `/api/webhooks/stripe` | Webhook handler do Stripe       |
| GET    | `/api/plans`           | Listar planos públicos          |

### 6.5 Logbook & Assinaturas (`/api/logbook`, `/api/sign*`, `/api/signatory`)

Endpoints para criar logbook, gerenciar signatários, enviar/verificar assinaturas e confirmar solicitações de assinatura.

### 6.6 Admin (`/api/admin`)

CRUD completo para: `users`, `plans`, `modules`, `licenses`, `subjects`, `topics`, `coupons`, `content` (questões com importação em massa).

### 6.7 Entitlements (`/api/entitlements`)

| Método | Endpoint                           | Descrição                       |
| ------ | ---------------------------------- | ------------------------------- |
| POST   | `/api/entitlements/grant`          | Conceder entitlements           |
| POST   | `/api/entitlements/set-plan`       | Definir plano por licença (dev) |
| POST   | `/api/entitlements/enroll-license` | Matricular em uma licença       |

---

## 7. Internacionalização (i18n)

- **Idiomas suportados:** `en` (inglês) e `pt` (português)
- **Abordagem:** Dicionários estáticos por contexto (landing, app, auth)
- **Locale detection:** Via pathname prefix (`/en/...`, `/pt/...`)
- **Cookie:** `ameone_locale` persiste a preferência
- **Middleware:** Reescreve URLs com prefixo de locale para rotas privadas
- **Arquivos:**
  - `src/lib/i18n/landing.ts` — Dicionários da landing page
  - `src/lib/i18n/app.ts` — Dicionários da área logada
  - `src/lib/i18n/appServer.ts` — Resolução server-side de locale
  - `src/lib/i18n/auth.ts` — Dicionários de autenticação

---

## 8. Variáveis de Ambiente

```env
# Obrigatórias
AUTH_SECRET=           # Segredo para assinatura JWT
DATABASE_URL=          # URL PostgreSQL (ex: postgresql://user:pass@host:5432/ameone)
STRIPE_SECRET_KEY=     # Chave secreta Stripe

# Opcionais
STRIPE_WEBHOOK_SECRET= # Assinatura de webhooks Stripe
RESEND_API_KEY=        # API key do Resend (emails)
RESEND_FROM=           # Remetente padrão (default: "AME ONE <onboarding@resend.dev>")
MAIL_FROM=             # Remetente alternativo
NEXT_PUBLIC_APP_URL=   # URL pública da app (default: http://localhost:3000)
PRISMA_SCHEMA_PATH=    # Caminho do schema Prisma (default: prisma/schema.prisma)
```

---

## 9. Convenções do Projeto

### 9.1 Código

- **Componentes**: React Server Components por padrão, `"use client"` quando necessário
- **Estilização**: Tailwind CSS com `cn()` utility (clsx + tailwind-merge)
- **Componentes UI**: shadcn/ui (new-york variant) com Radix UI primitives
- **Formulários**: React Hook Form + Zod para validação
- **Imports**: Alias `@/` aponta para `src/`
- **API Routes**: Handlers em `route.ts` usando `NextRequest/NextResponse`
- **Guards**: `requireAuth()` e `requireAdmin()` no início de API routes protegidas
- **Prisma**: Todas as tabelas usam `@@map("snake_case")`, campos com `@map("snake_case")`
- **Soft delete**: Todos os modelos possuem `deletedAt` (soft delete padrão)

### 9.2 Admin Dialogs

Padrão de dialogs admin com wrapper reutilizável em `src/components/admin/AdminDialog.tsx`:

- `AdminDialogContent` — Container com variantes de tamanho (`compact`, `narrow`, `form`, `formWide`, `formWider`, `wide`, `content`, `questions`) e altura (`default`, `tall`)
- `AdminDialogHeader` — Header fixo com borda inferior
- `AdminDialogBody` — Corpo scrollável (`overflow-y-auto`, `min-h-0`)
- `AdminDialogFooter` — Footer fixo com borda superior
- Usa CSS Grid (`grid-rows-[auto_minmax(0,1fr)_auto]`) para header/body/footer

### 9.3 Naming

- Rotas: kebab-case (`standard-practices`, `rating-avionics`)
- Componentes: PascalCase (`AdvancedEngine.tsx`, `AdminDialog.tsx`)
- Lib files: camelCase (`planEntitlements.ts`, `studyAccess.ts`)
- DB tables: snake_case via `@@map`

---

## 10. Estado Atual e Issues Conhecidas

### 10.1 O Que Funciona

- ✅ Autenticação completa (registro, login, logout, reset de senha)
- ✅ Middleware de proteção de rotas por role
- ✅ Landing page bilíngue (en/pt) com toggle de billing mensal/anual
- ✅ Painel administrativo (CRUD: users, plans, modules, licenses, subjects, topics, questions, coupons)
- ✅ Engine de estudo com 3 modos (flashcard, practice, test)
- ✅ Sistema de entitlements por licença
- ✅ Integração Stripe (checkout, webhooks, billing portal)
- ✅ Sistema de cupons de desconto
- ✅ Onboarding flow
- ✅ Sistema de logbook digital com assinaturas
- ✅ Progresso e streaks de estudo
- ✅ Persistência de estado de prática e testes

### 10.2 Issues Conhecidas / Pendências

- 🟡 Tracking de uso (limites de plano) ainda usa localStorage — migração para server-side pendente
- 🟡 Modelo legado `Entitlement` coexiste com o novo `LicenseEntitlement` — unificação pendente
- 🟡 Sem rate limiting em API routes (vulnerabilidade a brute force)
- 🟡 Sem blacklist/revogação de JWT
- 🟡 Algumas páginas de licenças ainda contêm visuais de "legacy unlock"
- 🟡 Assets placeholder ainda precisam ser substituídos por finais

### 10.3 Próximos Passos Planejados

- Migrar tracking de uso para backend (Prisma)
- Expor status do plano + fluxo de upgrade na UI do estudante
- Bloquear Logbook baseado no plano na UI
- Unificar modelos de Entitlement
- Adicionar rate limiting
- Finalizar assets visuais

---

## 11. Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build && npm start

# Sincronizar schema Prisma com o banco
npx prisma db push

# Type checking
npx tsc --noEmit

# Gerar Prisma Client
npx prisma generate
```

---

## 12. Referência Rápida de Arquivos Importantes

| Arquivo                                        | Propósito                                      |
| ---------------------------------------------- | ---------------------------------------------- |
| `src/middleware.ts`                            | Proteção de rotas, locale detection, redirects |
| `src/lib/jwt.ts`                               | Assinatura/verificação JWT                     |
| `src/lib/guards.ts`                            | Guards de autenticação para API routes         |
| `src/lib/authz.ts`                             | Autorização por role (admin vs user)           |
| `src/lib/routes.ts`                            | Constantes de rotas tipadas                    |
| `src/lib/planEntitlements.ts`                  | Mapeamento plano → limites de uso              |
| `src/lib/stripe.ts`                            | Cliente Stripe                                 |
| `src/lib/prisma.ts`                            | Singleton Prisma Client                        |
| `src/lib/i18n/landing.ts`                      | Dicionários i18n da landing                    |
| `src/lib/i18n/app.ts`                          | Dicionários i18n da área logada                |
| `src/components/study/AdvancedEngine.tsx`      | Motor principal de estudo                      |
| `src/components/admin/AdminDialog.tsx`         | Wrapper de dialogs admin                       |
| `src/components/app/LoggedAppShell.tsx`        | Layout da área logada                          |
| `src/components/landing/PublicLandingPage.tsx` | Landing page                                   |
| `prisma/schema.prisma`                         | Schema completo do banco                       |
| `data/*/metadata.json`                         | Metadados dos bancos de questões               |
