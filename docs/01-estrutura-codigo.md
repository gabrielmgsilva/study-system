# Análise da Estrutura do Código — Frontend & Backend

## Visão Geral

O projeto **AME ONE** é uma aplicação **Next.js 15** (App Router) com TypeScript, utilizando o modelo de fullstack integrado: rotas de API no mesmo repositório que o frontend. O banco de dados é acessado via **Prisma ORM** (SQLite em desenvolvimento, configurável para outros providers em produção). A estilização usa **Tailwind CSS v4** com componentes **Radix UI** (shadcn/ui).

---

## Estrutura de Pastas

```
study-system/
├── data/                    # Arquivos JSON com as questões (por licença/módulo)
│   ├── m/                   # Licença M (Airframe, Powerplant, Standard Practices)
│   │   ├── powerplant/
│   │   │   ├── metadata.json
│   │   │   ├── 31.json … 42.json  (conjuntos de questões por seção TC)
│   │   ├── airframe/
│   │   └── standard-practices/
│   ├── e/                   # Licença E (Avionics)
│   ├── s/                   # Licença S (Structures)
│   ├── regs/                # Regulamentos (CARs, Standards)
│   ├── bregs/               # Balloons REGS
│   └── …
├── prisma/
│   └── schema.prisma        # Modelo de dados
├── public/                  # Assets estáticos
└── src/
    ├── app/                 # Next.js App Router
    │   ├── layout.tsx       # Layout raiz
    │   ├── page.tsx         # Landing page pública
    │   ├── api/             # Route Handlers (backend)
    │   │   ├── auth/        # login, register, logout, forgot-password, reset-password
    │   │   ├── entitlements/ # grant (créditos), set-plan
    │   │   ├── me/          # profile, password, student (snapshot do aluno)
    │   │   ├── logbook/     # leitura/escrita do logbook
    │   │   ├── question-by-id/
    │   │   ├── sign/        # assinatura digital de documentos
    │   │   └── signatories/
    │   ├── auth/            # Páginas públicas de autenticação (login, register, etc.)
    │   ├── app/             # Área protegida (/app/*)
    │   │   ├── hub/         # Página inicial do aluno logado
    │   │   ├── student/     # Gerenciamento de licenças e planos
    │   │   ├── account/     # Configurações de conta
    │   │   ├── m/           # Módulos da licença M
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx (menu)
    │   │   │   ├── hub/
    │   │   │   ├── airframe/
    │   │   │   ├── powerplant/
    │   │   │   ├── standard-practices/
    │   │   │   └── logbook/
    │   │   ├── e/           # Módulos da licença E
    │   │   ├── s/           # Módulos da licença S
    │   │   ├── balloons/    # Módulos Balloons
    │   │   └── regs/        # Regulamentos globais
    │   ├── admin/           # Área administrativa
    │   ├── pricing/         # Página de preços (pública)
    │   └── …               # Páginas públicas (about, help, terms, privacy, etc.)
    ├── components/          # Componentes React reutilizáveis
    │   ├── AppShell.tsx     # Layout shell de todas as páginas do app
    │   ├── EntitlementGuard.tsx  # Guard client-side de acesso por licença
    │   ├── ModuleBlocked.tsx
    │   ├── ModuleShortcutCard.tsx
    │   ├── ModuleStatusBadge.tsx
    │   ├── SignaturePad.tsx
    │   ├── TipsTicker.tsx
    │   ├── auth/            # Formulários de autenticação (client components)
    │   ├── study/
    │   │   └── AdvancedEngine.tsx  # Motor de estudo (flashcard / prática / teste)
    │   └── ui/              # Componentes base (shadcn/ui + customizações)
    ├── hooks/
    │   └── use-mobile.ts
    ├── lib/                 # Utilitários e lógica de negócio compartilhada
    │   ├── auth.ts          # Hashing de senha, sign/verify de sessão
    │   ├── adminAuth.ts     # Verificação de e-mail de admin (server-only)
    │   ├── entitlementsClient.ts  # Cache client-side de entitlements
    │   ├── getUserEmailServer.ts  # Resolver email do usuário no servidor
    │   ├── ModuleGate.tsx   # Guard server-side de status de módulo
    │   ├── moduleFlags.ts   # Status de cada módulo (active / coming_soon / maintenance)
    │   ├── modules.ts       # Mapa de módulos CARs (referência)
    │   ├── planEntitlements.ts  # Mapeamento plan → capacidades
    │   ├── prisma.ts        # Singleton do Prisma Client
    │   ├── routes.ts        # Tipagem e constantes de rotas
    │   └── token.ts         # Geração e hash de tokens
    ├── middleware.ts        # Middleware Next.js — proteção de rotas
    └── types/
        └── logbook.ts
```

---

## Frontend

### Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Framework principal |
| React | 19 | Renderização de UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 4 | Estilização |
| Radix UI / shadcn | — | Componentes de UI acessíveis |
| Lucide React | — | Ícones |
| React Hook Form + Zod | — | Formulários com validação |

### Padrões de Componentes

- **Server Components** são usados por padrão no App Router (layouts, páginas de conteúdo estático).
- **Client Components** (`'use client'`) são usados onde há estado, efeitos ou interatividade — exemplos: `EntitlementGuard`, `AdvancedEngine`, `StudentPage`.
- **`AppShell`** é o wrapper visual de todas as páginas autenticadas, fornecendo header e scroll container com fundo de imagem de aviação.
- **`EntitlementGuard`** protege páginas de módulos no client, verificando o snapshot `licenseEntitlements` antes de renderizar o conteúdo.
- **`ModuleGate`** é um Server Component que bloqueia módulos com status `coming_soon` ou `maintenance`, sem precisar de autenticação.

### Roteamento

As rotas seguem estritamente o padrão do App Router:

```
/                          → Landing (pública)
/auth/login                → Login
/auth/register             → Registro
/auth/forgot-password      → Recuperação de senha
/auth/reset-password       → Redefinição de senha
/pricing                   → Preços (pública)
/app                       → Home do aluno (protegida)
/app/hub                   → Hub de licenças
/app/student               → Área de licenças & planos do aluno
/app/m                     → Menu licença M
/app/m/hub                 → Hub M
/app/m/powerplant          → Módulo Powerplant (M)
/app/m/airframe            → Módulo Airframe (M)
/app/m/standard-practices  → Módulo STDP (M)
/app/m/logbook             → Logbook M
/app/e/…                   → Módulos licença E
/app/s/…                   → Módulos licença S
/app/balloons/…            → Módulos Balloons
/app/regs                  → REGS (regulamentos globais)
/admin/…                   → Área administrativa
```

---

## Backend

### Route Handlers (API)

O backend é implementado como **Route Handlers** do Next.js App Router, localizados em `src/app/api/`. Cada rota exporta funções HTTP (GET, POST, etc.) e opera no runtime do Node.js no servidor.

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/auth/register` | POST | Cria usuário, inicia sessão, credita 10 créditos de boas-vindas |
| `/api/auth/login` | POST | Autentica usuário, cria sessão, seta cookie assinado |
| `/api/auth/logout` | POST | Invalida cookie de sessão |
| `/api/auth/forgot-password` | POST | Gera token de reset, envia e-mail via Resend |
| `/api/auth/reset-password` | POST | Valida token, atualiza senha |
| `/api/auth/me` | GET | Retorna dados básicos do usuário autenticado |
| `/api/me/student` | GET | Retorna snapshot completo: créditos + entitlements + licenseEntitlements |
| `/api/me/profile` | PATCH | Atualiza dados de perfil |
| `/api/me/password` | POST | Troca de senha autenticada |
| `/api/entitlements/grant` | POST | Concede acesso a um módulo consumindo 1 crédito |
| `/api/entitlements/set-plan` | POST | Define o plano de uma licença (helper dev / pré-billing) |
| `/api/logbook/*` | GET/POST | Leitura e escrita do logbook de manutenção |
| `/api/question-by-id/*` | GET | Busca questão individual por ID |
| `/api/sign/*` | POST | Assinatura digital de registros |

### Utilitários de Backend

- **`src/lib/auth.ts`** — Funções de hashing (PBKDF2-SHA256) e HMAC de sessão. Marcado com `import "server-only"` implicitamente por uso de módulos Node.js nativos.
- **`src/lib/adminAuth.ts`** — Verificação de admin por lista de e-mails em variável de ambiente. Marcado com `"server-only"` explicitamente.
- **`src/lib/prisma.ts`** — Singleton do Prisma Client com padrão `globalThis` para hot-reload em dev.
- **`src/lib/getUserEmailServer.ts`** — Resolve o e-mail do usuário atual a partir de cookie ou header. Marcado com `"server-only"`.

### Banco de Dados

- **Prisma ORM** com SQLite em desenvolvimento (`dev.db`). Configurável via `DATABASE_URL` para PostgreSQL ou outro em produção.
- Migrations gerenciadas via `npx prisma db push` (modo dev) ou `prisma migrate` (produção recomendada).

---

## Separação de Responsabilidades

```
Dados estáticos (questões) → /data/**/*.json (bundled no build)
         ↓
Página de módulo (page.tsx) → importa JSON, monta DeckSection[]
         ↓
EntitlementGuard (client) → verifica licenseEntitlement via /api/me/student
         ↓
AdvancedEngine (client)   → motor de estudo: flashcard / prática / teste
         ↓
API Routes (servidor)     → auth, entitlements, logbook, student snapshot
         ↓
Prisma ORM                → SQLite / banco de dados
```

---

## Variáveis de Ambiente Relevantes

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL do banco de dados Prisma |
| `AUTH_SECRET` | Secret para assinatura HMAC dos cookies de sessão |
| `ADMIN_EMAILS` | Lista de e-mails de administradores separados por vírgula |
| `ADMIN_DEV_EMAIL` | E-mail de desenvolvedor (fallback apenas em `NODE_ENV=development`) |
| `RESEND_API_KEY` | Chave da API Resend para envio de e-mails |
| `MAIL_FROM` | Endereço de remetente de e-mails |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação (para links em e-mails) |
