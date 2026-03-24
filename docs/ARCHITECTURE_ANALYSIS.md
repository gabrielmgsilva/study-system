# AME One — Análise de Arquitetura e Estrutura de Dados

> **Data:** 2026-03-24  
> **Versão:** 2.0 (atualizado após limpeza do schema para MVP)  
> **Escopo:** Estado atual da aplicação após correções da Fase 1

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.x |
| Linguagem | TypeScript | 5.x |
| Runtime | React | 19.x |
| ORM | Prisma | 6.19.x |
| Banco de Dados | SQLite (dev) | — |
| CSS | Tailwind CSS | 4.x |
| UI Library | Shadcn/ui (Radix UI) | — |
| Email | Resend | 6.x |
| Pagamento | Stripe (dependência instalada, não integrado) | 17.x |
| Validação | Zod | 3.x |
| Formulários | React Hook Form | 7.x |
| Hashing | bcryptjs (12 rounds) | 3.x |

### 1.2 Estrutura de Diretórios

```
study-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (server-side)
│   │   │   ├── auth/           # Autenticação (login, register, logout, forgot/reset-password)
│   │   │   ├── me/             # Dados do usuário logado (student, profile, password)
│   │   │   ├── entitlements/   # Gerenciamento de acesso (grant, set-plan)
│   │   │   ├── logbook/        # Logbook de estudos
│   │   │   ├── signatories/    # Funcionalidades de assinatura digital
│   │   │   └── question-by-id/ # Consulta de questões
│   │   ├── app/                # Páginas protegidas (requer autenticação)
│   │   │   ├── hub/            # Dashboard principal
│   │   │   ├── m/              # Licença Mecânico (Maintenance)
│   │   │   ├── e/              # Licença Avionics
│   │   │   ├── s/              # Licença Structures
│   │   │   ├── balloons/       # Licença Balloons
│   │   │   └── regs/           # Regulamentos (CARs/Standards)
│   │   └── auth/               # Páginas públicas de autenticação
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── study/              # Motor de estudo (AdvancedEngine)
│   │   └── ui/                 # Shadcn/ui (50+ componentes)
│   └── lib/                    # Utilitários e lógica de negócios
│       ├── auth.ts             # Hashing bcrypt + PBKDF2 legado, assinatura de sessão (HMAC)
│       ├── guards.ts           # Guards centralizados (requireAuth, requireAdmin)
│       ├── adminAuth.ts        # Verificação de email admin (legado)
│       ├── prisma.ts           # Singleton Prisma Client
│       ├── routes.ts           # Definições type-safe de rotas
│       ├── planEntitlements.ts # Mapeamento plano → experiência
│       └── entitlementsClient.ts # Estado client-side de entitlements
├── prisma/
│   └── schema.prisma           # Schema do banco de dados (7 modelos)
├── data/                       # Dados de estudo em JSON (questões, flashcards)
│   ├── m/                      # Questões de Maintenance
│   ├── e/                      # Questões de Avionics
│   ├── s/                      # Questões de Structures
│   ├── regs/                   # Questões de Regulamentos
│   └── bregs/                  # Questões de Balloons
└── .env.example                # Template de variáveis de ambiente
```

---

## 2. Banco de Dados — Estado Atual (MVP)

### 2.1 Princípio: Apenas modelos em uso

O schema contém **apenas 7 modelos** — todos ativamente utilizados no código. Modelos futuros (progresso, streaks, test state) serão adicionados apenas quando houver API e frontend consumindo-os.

### 2.2 Modelos Ativos

#### User (tabela: `users`)
```
id                     String    PK, CUID
email                  String    UNIQUE
username               String?   Opcional
password_hash          String    bcrypt (12 rounds), com suporte legado PBKDF2
role                   UserRole  user | admin (default: user)
last_password_change_at DateTime? Rastreamento de mudança de senha
created_at             DateTime  Auto
updated_at             DateTime  Auto (@updatedAt)
```

#### Session (tabela: `sessions`)
```
id          String    PK, CUID
user_id     String    FK → users, CASCADE
created_at  DateTime  Auto
expires_at  DateTime  12h de vida
```

#### PasswordResetToken (tabela: `password_reset_tokens`)
```
id          String    PK, CUID
user_id     String    FK → users, CASCADE
token       String    UNIQUE (crypto.randomBytes 32)
expires_at  DateTime  30 min de vida
used_at     DateTime? Marca token como consumido
created_at  DateTime  Auto
```

#### CreditAccount (tabela: `credit_accounts`)
```
id          String    PK, CUID
user_id     String    UNIQUE, FK → users, CASCADE
balance     Int       Saldo de créditos (default: 0)
created_at  DateTime  Auto
updated_at  DateTime  Auto (@updatedAt)
```

#### CreditLedger (tabela: `credit_ledger`)
```
id          String    PK, CUID
user_id     String    FK → users, CASCADE
delta       Int       Variação (±)
reason      String    Motivo ("Welcome credits", "Unlock m.airframe")
created_at  DateTime  Auto
```

#### Entitlement (tabela: `entitlements`)
```
id          String    PK, CUID
user_id     String    FK → users, CASCADE
module_key  String    Ex: "regs.core", "m.powerplant"
granted     Boolean   Default: true
granted_at  DateTime  Auto
UNIQUE(user_id, module_key)
```

#### LicenseEntitlement (tabela: `license_entitlements`)
```
id          String             PK, CUID
user_id     String             FK → users, CASCADE
license_id  String             "m"|"e"|"s"|"balloons"|"regs"
plan        PlanTier           basic|standard|premium
flashcards  FlashcardsAccess   daily_limit|unlimited
practice    PracticeAccess     cooldown|unlimited
test        TestAccess         weekly_limit|unlimited
logbook     Boolean            Default: false
granted_at  DateTime           Auto
updated_at  DateTime           Auto (@updatedAt)
UNIQUE(user_id, license_id)
```

### 2.3 Enums

| Enum | Valores | Uso |
|---|---|---|
| `UserRole` | `user`, `admin` | Campo `role` no User |
| `PlanTier` | `basic`, `standard`, `premium` | Campo `plan` no LicenseEntitlement |
| `FlashcardsAccess` | `daily_limit`, `unlimited` | Campo `flashcards` no LicenseEntitlement |
| `PracticeAccess` | `cooldown`, `unlimited` | Campo `practice` no LicenseEntitlement |
| `TestAccess` | `weekly_limit`, `unlimited` | Campo `test` no LicenseEntitlement |

### 2.4 Convenções

- ✅ Todas as tabelas usam `@@map("snake_case")` para nomes no banco
- ✅ Todos os campos usam `@map("snake_case")` quando o nome Prisma difere
- ✅ IDs são CUID (collision-resistant)
- ✅ Cascade delete em todas as relações para User
- ✅ Índices em `userId` para todas as tabelas de relação

---

## 3. Segurança — Estado Atual

### 3.1 Autenticação

| Aspecto | Estado Atual | Avaliação |
|---|---|---|
| Hashing de senhas | bcrypt 12 rounds (com fallback PBKDF2 legado) | ✅ Padrão da indústria |
| Auto-rehash | Senhas PBKDF2 migradas para bcrypt no login | ✅ Migração transparente |
| Sessões | Cookie HMAC-SHA256 com sessão no DB | ✅ Seguro |
| Cookie `httpOnly` | Sim | ✅ |
| Cookie `secure` | Apenas em produção | ✅ |
| Cookie `sameSite` | `lax` | ✅ |
| Timing-safe comparison | Sim, `crypto.timingSafeEqual` | ✅ |
| Expiração de sessão | 12h, verificada no middleware | ✅ |
| Proteção contra enumeração | Sim, no forgot-password | ✅ |

### 3.2 Autorização

| Aspecto | Estado Atual | Avaliação |
|---|---|---|
| Middleware de rotas | Protege `/app/*` e `/admin/*` | ✅ Funcional |
| Guard centralizado | `requireAuth()` e `requireAdmin()` em `src/lib/guards.ts` | ✅ Implementado |
| Role no banco | Campo `role` (user/admin) no modelo User | ✅ Implementado |
| Endpoint `set-plan` | Protegido por `requireAdmin()` | ✅ Corrigido |
| Rate limiting | Inexistente | ❌ Pendente |
| CSRF protection | Apenas `sameSite: lax` | ⚠️ Mínimo |

### 3.3 Itens Pendentes de Segurança

1. **Rate limiting** em login/register/forgot-password — vulnerável a brute force
2. **Variáveis de ambiente** — `.env` e `.env.local` removidos do git ✅, mas `AUTH_SECRET` precisa ser forte em produção
3. **Headers de segurança** (CSP, HSTS) — não configurados

---

## 4. Lógica de Negócio

### 4.1 Modelo de Licenças e Planos

| Tier | Flashcards/dia | Práticas/dia | Testes/semana | Logbook |
|---|---|---|---|---|
| Basic | 20 | 2 | 1 | ❌ |
| Standard | ∞ | ∞ | 3 | ❌ |
| Premium | ∞ | ∞ | ∞ | ✅ |

**Status:** ⚠️ Limites de uso rastreados apenas no `localStorage` — podem ser burlados.

### 4.2 Motor de Estudo (AdvancedEngine)

3 modos funcionais: Flashcard, Practice, Test.

**Pendências:**
- Sem persistência de progresso no backend
- Sem salvamento de estado da prova de prática
- Sem cancelamento controlado do modo teste
- Sem histórico de resultados

### 4.3 Sistema de Créditos — ✅ Funcional

- 10 créditos ao registrar, gastos para desbloquear módulos
- Ledger com auditoria completa
- Operações atômicas via `prisma.$transaction`

---

## 5. Resumo de Riscos Restantes para o MVP

| Prioridade | Risco | Status |
|---|---|---|
| ~~P0~~ | ~~Schema incompleto~~ | ✅ Corrigido |
| P0 | Sem rate limiting | ❌ Pendente |
| P0 | SQLite em produção | ❌ Pendente (migrar para PostgreSQL) |
| P1 | Sem persistência de progresso de estudo | ❌ Pendente |
| ~~P1~~ | ~~Sem guard centralizado~~ | ✅ Corrigido |
| P1 | Limites de uso no localStorage | ❌ Pendente |
| P2 | Sem admin panel funcional | ❌ Pendente |
| P2 | Sem integração Stripe | ❌ Pendente |
| P3 | Sem testes automatizados | ❌ Pendente |

---

## 6. Conclusão

Após as correções da Fase 1, o AME One possui:

**✅ Implementado:**
- Schema completo e consistente (7 modelos, todos em uso)
- Senhas com bcrypt (migração transparente de PBKDF2)
- Guards centralizados de autenticação e autorização
- Role de admin no banco de dados
- Convenção snake_case no banco
- Variáveis de ambiente fora do repositório

**❌ Pendente para MVP:**
- Rate limiting
- Migração para PostgreSQL
- Persistência de progresso de estudo (novos modelos quando necessário)
- Admin panel
- Integração de pagamentos

O documento `IMPROVEMENT_PLAN.md` detalha as fases restantes.
