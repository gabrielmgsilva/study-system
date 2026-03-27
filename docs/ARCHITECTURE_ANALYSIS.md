# AME One — Análise de Arquitetura e Estrutura de Dados

> **Data:** 2026-03-24  
> **Versão:** 1.0  
> **Escopo:** Avaliação do estado atual da aplicação para planejamento do MVP

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.x |
| Linguagem | TypeScript | 5.x |
| Runtime | React | 19.x |
| ORM | Prisma | 6.19.x |
| Banco de Dados | SQLite | — |
| CSS | Tailwind CSS | 4.x |
| UI Library | Shadcn/ui (Radix UI) | — |
| Email | Resend | 6.x |
| Pagamento | Stripe (dependência instalada, não integrado) | 17.x |
| Validação | Zod | 3.x |
| Formulários | React Hook Form | 7.x |

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
│       ├── auth.ts             # Hashing de senha e migração transparente PBKDF2 -> bcrypt
│       ├── authz.ts            # Separação de acesso por role entre /app e /admin
│       ├── jwt.ts              # JWT stateless + cookie httpOnly
│       ├── prisma.ts           # Singleton Prisma Client
│       ├── routes.ts           # Definições type-safe de rotas
│       ├── planEntitlements.ts # Mapeamento plano → experiência
│       └── entitlementsClient.ts # Estado client-side de entitlements
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── data/                       # Dados de estudo em JSON (questões, flashcards)
│   ├── m/                      # Questões de Maintenance
│   ├── e/                      # Questões de Avionics
│   ├── s/                      # Questões de Structures
│   ├── regs/                   # Questões de Regulamentos
│   └── bregs/                  # Questões de Balloons
└── dev.db                      # Banco SQLite (desenvolvimento)
```

---

## 2. Análise do Banco de Dados

### 2.1 Modelos Existentes

#### User
```
id            String    PK, CUID
email         String    UNIQUE
username      String?   Opcional
passwordHash  String    Hash PBKDF2-SHA256
createdAt     DateTime  Auto
```

**Problemas identificados:**
- ❌ Campo `lastPasswordChangeAt` é referenciado no código (`reset-password/route.ts`) mas **não existe no schema**
- ✅ O campo `role` passou a ser a fonte única de verdade para separar admin e estudante.
- ⚠️ Não há campos de perfil (nome completo, avatar, país, etc.)
- ⚠️ Sem soft delete (`deletedAt`)
- ⚠️ Convenção de nomes usa camelCase em vez de snake_case

#### Authentication

- Autenticação agora é stateless, baseada em JWT assinado com HS256 via `jose`.
- O token é armazenado no cookie httpOnly `ameone_token` com expiração de 12 horas.
- Middleware e guards usam o payload do token diretamente, sem tabela `Session`.
- A separação entre área administrativa e área do estudante é feita pelo `User.role` persistido no banco.

#### CreditAccount
```
id        String    PK, CUID
userId    String    UNIQUE, FK → User
balance   Int       Saldo de créditos
createdAt DateTime  Auto
updatedAt DateTime  Auto
```

#### CreditLedger
```
id        String    PK, CUID
userId    String    FK → User
delta     Int       Variação (±)
reason    String    Motivo
createdAt DateTime  Auto
```

#### Entitlement (Legacy — acesso por módulo)
```
id        String    PK, CUID
userId    String    FK → User
moduleKey String    Ex: "regs.core", "m.powerplant"
granted   Boolean   Default: true
grantedAt DateTime  Auto
UNIQUE(userId, moduleKey)
```

#### LicenseEntitlement (Atual — acesso por licença)
```
id         String             PK, CUID
userId     String             FK → User
licenseId  String             "m"|"e"|"s"|"balloons"|"regs"
plan       PlanTier           basic|standard|premium
flashcards FlashcardsAccess   daily_limit|unlimited
practice   PracticeAccess     cooldown|unlimited
test       TestAccess         weekly_limit|unlimited
logbook    Boolean            Default: false
grantedAt  DateTime           Auto
UNIQUE(userId, licenseId)
```

#### PasswordResetToken (AUSENTE NO SCHEMA)
```
⚠️ Modelo referenciado no código (forgot-password, reset-password)
   mas NÃO existe no schema Prisma atual.
   Campos esperados: id, userId, token, expiresAt, usedAt
```

### 2.2 Problemas Críticos do Schema

| # | Severidade | Descrição |
|---|---|---|
| 1 | 🔴 Crítico | `PasswordResetToken` ausente no schema — funcionalidades de reset de senha quebradas |
| 2 | 🔴 Crítico | `lastPasswordChangeAt` ausente no modelo `User` — referenciado no reset-password |
| 3 | 🟡 Médio | SQLite inadequado para produção (sem concorrência, sem tipos avançados) |
| 4 | 🟡 Médio | Convenção de nomes misturada (camelCase no schema, mas o padrão SQL é snake_case) |
| 5 | 🟡 Médio | Modelo `Entitlement` (legacy) coexiste com `LicenseEntitlement` — redundância |
| 6 | 🟡 Médio | Sem modelos para progresso de estudo, estado de prática, resultados de teste |
| 7 | 🟡 Médio | Sem modelo de Subscription/Plan para gestão de assinaturas |
| 8 | 🟡 Médio | Sem modelo de admin panel (conteúdos, gestão de questões) |
| 9 | 🟢 Baixo | Sem `updatedAt` na maioria dos modelos |
| 10 | 🟢 Baixo | Sem índices compostos para consultas frequentes |

---

## 3. Análise de Segurança

### 3.1 Autenticação

| Aspecto | Estado Atual | Avaliação |
|---|---|---|
| Hashing de senhas | bcrypt 12 rounds, com fallback legado PBKDF2 | ✅ Adequado |
| Sessões | JWT stateless em cookie `httpOnly` | ✅ Seguro |
| Cookie `httpOnly` | Sim | ✅ |
| Cookie `secure` | Apenas em produção | ✅ |
| Cookie `sameSite` | `lax` | ✅ |
| Verificação de assinatura | HS256 via `jose` no middleware e servidor | ✅ |
| Expiração de sessão | 12h, verificada no JWT | ✅ |
| Proteção contra enumeração | Sim, no forgot-password | ✅ |

### 3.2 Autorização

| Aspecto | Estado Atual | Avaliação |
|---|---|---|
| Middleware de rotas | Protege `/app/*` e `/admin/*` | ✅ Funcional |
| Guard de admin | Baseado em `User.role` no JWT | ✅ Alinhado ao banco |
| Guard de API | `requireAuth()` e `requireAdmin()` centralizados | ✅ Melhorado |
| Validação de roles | Separação entre `/app` e `/admin` | ✅ Implementada |
| Rate limiting | Inexistente | ❌ Vulnerável a brute force |
| CSRF protection | Apenas `sameSite: lax` | ⚠️ Mínimo |

### 3.3 Vulnerabilidades Identificadas

1. **Sem rate limiting** em login/register — vulnerável a ataques de força bruta
2. **Sem revogação central de JWT** — logout invalida o cookie atual, mas não existe blacklist de tokens
3. **Proteção de API ainda depende de adoção consistente dos guards** em rotas novas
4. **Endpoint `set-plan` sem proteção real** — marcado como "dev-only" mas acessível em produção
5. **`AUTH_SECRET` hardcoded** no `.env.local` de desenvolvimento com valor previsível
6. **Schema incompleto** — `PasswordResetToken` referenciado no código mas ausente do schema, causando erros em runtime

---

## 4. Análise da Lógica de Negócio

### 4.1 Modelo de Licenças e Planos

O sistema implementa um modelo "License-first":
- **5 licenças:** M (Maintenance), E (Avionics), S (Structures), Balloons, Regs
- **3 tiers:** Basic, Standard, Premium
- **Acessos gateados por tier:** flashcards/dia, práticas/dia, testes/semana

| Tier | Flashcards/dia | Práticas/dia | Testes/semana | Logbook |
|---|---|---|---|---|
| Basic | 20 | 2 | 1 | ❌ |
| Standard | ∞ | ∞ | 3 | ❌ |
| Premium | ∞ | ∞ | ∞ | ✅ |

**Problemas:**
- ⚠️ Limites de uso são rastreados apenas no `localStorage` — podem ser burlados
- ⚠️ Sem modelo de Subscription para integração com Stripe
- ⚠️ Sem controle de validade temporal das assinaturas

### 4.2 Motor de Estudo (AdvancedEngine)

O componente `AdvancedEngine` (~2000 linhas) implementa 3 modos:
- **Flashcard:** Exibe questão + resposta correta destacada
- **Practice:** Feedback imediato após cada resposta
- **Test:** Simulado com N questões aleatórias, resultado no final

**Problemas:**
- ❌ Sem persistência de progresso de estudo no backend
- ❌ Sem salvamento de estado da prova de prática (se sair, perde tudo)
- ❌ Sem cancelamento controlado do modo teste (se sair da tela, prova é perdida)
- ❌ Sem histórico de resultados de testes anteriores
- ⚠️ Dados de questões carregados de arquivos JSON estáticos — sem admin para gerenciar

### 4.3 Sistema de Créditos

- Usuários recebem 10 créditos no registro
- Créditos podem ser gastos para desbloquear módulos
- Ledger registra todas as transações (auditoria)
- ✅ Operações atômicas via `prisma.$transaction`

### 4.4 Painel Administrativo

- ❌ Praticamente inexistente — apenas `/admin/modules` com verificação básica de email
- ❌ Sem CRUD de questões, flashcards, ou conteúdos de estudo
- ❌ Sem gestão de usuários
- ❌ Sem gestão de planos/assinaturas

---

## 5. Análise da Infraestrutura

### 5.1 Build e Deploy

| Aspecto | Estado | Avaliação |
|---|---|---|
| TypeScript strict | Habilitado no tsconfig | ✅ |
| ESLint | Configurado mas ignorado no build (`ignoreDuringBuilds: true`) | ⚠️ |
| TypeScript build errors | Ignorados (`ignoreBuildErrors: true`) | ❌ Perigoso |
| Testes | Inexistentes — sem test runner configurado | ❌ |
| CI/CD | Não configurado | ⚠️ |

### 5.2 Dependências Relevantes

- **Stripe** (`stripe`, `@stripe/stripe-js`): Instalado mas **não integrado**
- **Supabase** (`@supabase/supabase-js`): Instalado mas **não utilizado** no código atual
- **ElevenLabs** (`@elevenlabs/react`): Instalado, uso não identificado
- **Resend**: Configurado para envio de emails de reset de senha

### 5.3 Armazenamento de Dados de Estudo

- Questões armazenadas em arquivos JSON no diretório `data/`
- Carregadas no client-side pelo `AdvancedEngine`
- Sem mecanismo de versionamento ou atualização dinâmica
- Sem interface admin para CRUD de questões

---

## 6. Resumo de Riscos para o MVP

| Prioridade | Risco | Impacto |
|---|---|---|
| P0 | Schema incompleto (PasswordResetToken, lastPasswordChangeAt) | Funcionalidades de reset de senha não funcionam |
| P0 | Sem rate limiting | Vulnerável a ataques de força bruta |
| P0 | SQLite em produção | Inadequado para múltiplos usuários simultâneos |
| P1 | Sem persistência de progresso de estudo | Experiência de usuário ruim; sem gamificação possível |
| P1 | Sem guard centralizado de API | Segurança frágil; rotas podem ser acessadas indevidamente |
| P1 | Limites de uso no localStorage | Facilmente burlados pelo usuário |
| P2 | Sem admin panel funcional | Equipe não consegue gerenciar conteúdo |
| P2 | Sem integração Stripe | Sem monetização |
| P2 | Sem testes automatizados | Regressões não detectadas |
| P3 | TypeScript/ESLint ignorados no build | Bugs silenciosos |

---

## 7. Conclusão

O AME One possui uma **base sólida** com boas práticas em várias áreas (cookie security, timing-safe comparisons, atomic transactions). Porém, há **lacunas críticas** que impedem o lançamento como MVP:

1. **Schema incompleto** com modelos referenciados no código mas ausentes do Prisma
2. **Segurança insuficiente** para produção (sem rate limiting, admin guard frágil)
3. **Sem persistência de progresso** — funcionalidade central para engajamento tipo Duolingo
4. **Sem infraestrutura de gestão** (admin panel, CRUD de conteúdo)
5. **Banco inadequado** para produção (SQLite → PostgreSQL)

O documento `IMPROVEMENT_PLAN.md` detalha o planejamento incremental para resolver esses problemas em fases evolutivas.
