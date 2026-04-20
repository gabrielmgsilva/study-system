# Estrutura de Dados — Schema Prisma

## Visão Geral

O banco de dados do AME ONE é modelado com **Prisma ORM** e usa **SQLite** em desenvolvimento (arquivo `prisma/dev.db`). O schema define as entidades de usuário, sessão, créditos, entitlements por módulo e entitlements por licença/plano.

Arquivo: `prisma/schema.prisma`

---

## Modelos

### `User`

Entidade central do sistema. Representa um usuário cadastrado.

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String?
  passwordHash  String
  createdAt     DateTime       @default(now())

  sessions            Session[]
  creditAccount       CreditAccount?
  creditLedger        CreditLedger[]
  entitlements        Entitlement[]
  licenseEntitlements LicenseEntitlement[]
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (cuid) | Identificador único |
| `email` | String | E-mail único, normalizado (lowercase) |
| `username` | String? | Nome de usuário opcional |
| `passwordHash` | String | Hash PBKDF2-SHA256 (formato: `pbkdf2$sha256$120000$salt$hash`) |
| `createdAt` | DateTime | Data de criação |

**Relações:** Um usuário tem uma sessão ativa, uma conta de créditos, um ledger de créditos, múltiplos entitlements de módulo e múltiplos entitlements de licença.

---

### `Session`

Registra sessões de autenticação ativas.

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  expiresAt DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (cuid) | ID da sessão (usado no cookie assinado) |
| `userId` | String | FK para `User` |
| `expiresAt` | DateTime | Expiração da sessão (padrão: +12h do login) |

**Notas:** Sessões são criadas no login/registro e expiradas por data. Não há invalidação ativa no logout — o cookie é apagado, mas a linha permanece no banco até expirar.

---

### `CreditAccount`

Saldo de créditos de cada usuário (um-para-um com `User`).

```prisma
model CreditAccount {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `balance` | Int | Saldo atual de créditos |

**Uso:** Créditos são concedidos no registro (+10 "Welcome credits") e consumidos ao desbloquear módulos individuais (`/api/entitlements/grant`).

---

### `CreditLedger`

Histórico imutável de todas as movimentações de crédito.

```prisma
model CreditLedger {
  id        String   @id @default(cuid())
  userId    String
  delta     Int
  reason    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `delta` | Int | Variação (positivo = crédito, negativo = débito) |
| `reason` | String | Descrição da operação (ex: "Welcome credits", "Unlock m.powerplant") |

---

### `Entitlement`

Acesso do usuário a **módulos específicos** (granularidade fina, ex: `m.powerplant`).

```prisma
model Entitlement {
  id        String   @id @default(cuid())
  userId    String
  moduleKey String   // ex: "regs.core", "m.powerplant"
  granted   Boolean  @default(true)
  grantedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleKey])
  @@index([userId])
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `moduleKey` | String | Chave no formato `licenseId.moduleId` (ex: `m.airframe`) |
| `granted` | Boolean | Indica se o acesso está ativo |

**Formato das chaves:** `<licenseId>.<moduleId>` — normalizado para lowercase com hífens (`regs.core`, `m.standard-practices`, `m.logbook`, etc.)

**Uso atual:** O sistema migrou para `LicenseEntitlement` como fonte primária de acesso. `Entitlement` é mantido por compatibilidade e para concessões granulares por créditos individuais.

---

### `LicenseEntitlement`

Acesso do usuário a uma **licença completa** com nível de plano.

```prisma
model LicenseEntitlement {
  id        String           @id @default(cuid())
  userId    String
  licenseId String           // "m" | "e" | "s" | "balloons" | "regs"

  plan       PlanTier         @default(basic)
  flashcards FlashcardsAccess @default(daily_limit)
  practice   PracticeAccess   @default(cooldown)
  test       TestAccess       @default(weekly_limit)
  logbook    Boolean          @default(false)

  grantedAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, licenseId])
  @@index([userId])
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `licenseId` | String | Identificador da licença TC (`m`, `e`, `s`, `balloons`, `regs`) |
| `plan` | PlanTier | Nível do plano (`basic`, `standard`, `premium`) |
| `flashcards` | FlashcardsAccess | Modo de acesso a flashcards |
| `practice` | PracticeAccess | Modo de acesso a prática |
| `test` | TestAccess | Modo de acesso a testes |
| `logbook` | Boolean | Acesso ao logbook (apenas `premium`) |

**Fonte de verdade:** É o modelo principal para controle de acesso no sistema atual. Se o usuário não possui um registro para uma licença, não tem acesso a ela.

---

## Enums

### `PlanTier`
```prisma
enum PlanTier {
  basic      // Plano base (limitações de uso)
  standard   // Plano intermediário
  premium    // Plano completo (inclui logbook)
}
```

### `FlashcardsAccess`
```prisma
enum FlashcardsAccess {
  daily_limit  // Limite diário de flashcards (basic: 20/dia)
  unlimited    // Sem limite (standard e premium)
}
```

### `PracticeAccess`
```prisma
enum PracticeAccess {
  cooldown    // Cooldown entre sessões (basic: 2/dia)
  unlimited   // Sem limite (standard e premium)
}
```

### `TestAccess`
```prisma
enum TestAccess {
  weekly_limit  // Limite semanal de testes (basic: 1/semana, standard: 3/semana)
  unlimited     // Sem limite (premium)
}
```

---

## Diagrama Entidade-Relacionamento

```
User (1) ──── (0..1) CreditAccount
  |
  ├──── (0..*) Session
  |
  ├──── (0..*) CreditLedger
  |
  ├──── (0..*) Entitlement
  |              moduleKey: "licenseId.moduleId"
  |
  └──── (0..*) LicenseEntitlement
                 licenseId: "m" | "e" | "s" | "balloons" | "regs"
                 plan: basic | standard | premium
                 flashcards, practice, test, logbook
```

---

## Mapeamento Plan → Capacidades

Definido em `src/lib/planEntitlements.ts`:

| Plano | Flashcards | Prática | Testes | Logbook |
|---|---|---|---|---|
| `basic` | `daily_limit` (20/dia) | `cooldown` (2/dia) | `weekly_limit` (1/semana) | ❌ |
| `standard` | `unlimited` | `unlimited` | `weekly_limit` (3/semana) | ❌ |
| `premium` | `unlimited` | `unlimited` | `unlimited` | ✅ |

---

## Fluxo de Criação de Dados no Registro

Quando um novo usuário se registra (`POST /api/auth/register`), as seguintes entidades são criadas atomicamente:

```
User
  ├── CreditAccount { balance: 10 }
  ├── CreditLedger  { delta: +10, reason: "Welcome credits" }
  └── LicenseEntitlement (×5) — uma para cada licença com plan: "basic"
        regs / m / e / s / balloons
```

**Importante:** A criação dos `LicenseEntitlement` com `plan: basic` **não concede acesso automaticamente** ao conteúdo. O acesso só é efetivado quando o usuário seleciona e confirma um plano em `/app/student`, que chama `POST /api/entitlements/set-plan`.

---

## Notas sobre Evolução do Schema

- O schema atual usa **SQLite** para desenvolvimento. Para produção com múltiplos usuários simultâneos, recomenda-se migrar para **PostgreSQL**.
- Os enums do Prisma (`PlanTier`, `FlashcardsAccess`, etc.) são suportados nativamente no PostgreSQL mas emulados como strings no SQLite.
- `PasswordResetToken` é referenciado nas rotas de reset mas **não está visível no schema atual** — pode estar em uma migration pendente ou em um schema mais recente não commitado.
