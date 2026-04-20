# Isolamento do Código Backend

## Contexto

O AME ONE é uma aplicação **Next.js fullstack** — frontend e backend coexistem no mesmo repositório e processo. Isso traz praticidade, mas exige atenção para garantir que código sensível (segredos, lógica de autorização, acesso ao banco) nunca chegue ao bundle do cliente.

---

## Situação Atual

### O que já está isolado

#### 1. `"server-only"` explícito

Alguns módulos já usam a diretiva `import "server-only"`, que faz o build do Next.js lançar um erro se o arquivo for importado por um Client Component:

```typescript
// src/lib/adminAuth.ts
import "server-only";

export function isAdminEmail(email: string | null | undefined) { … }
```

```typescript
// src/lib/getUserEmailServer.ts
import "server-only";

export async function getUserEmailServer(): Promise<string | null> { … }
```

#### 2. Route Handlers (isolamento físico)

Todos os endpoints em `src/app/api/**` são Route Handlers do Next.js e só executam no servidor. Não há risco de bundling no cliente por natureza do App Router.

#### 3. `src/lib/auth.ts` — módulo Node.js nativo

O `auth.ts` usa `crypto` do Node.js (não disponível no browser), o que o torna incompatível com o bundle do cliente por padrão. Porém, sem a diretiva `"server-only"`, o build não emitirá erro imediato se importado incorretamente em outros contextos.

#### 4. `src/lib/prisma.ts`

O Prisma Client (`@prisma/client`) usa drivers Node.js e não pode ser importado no client. No entanto, também não possui `"server-only"` explícito.

---

## Possibilidades de Isolamento

### Opção 1 — `"server-only"` em todos os módulos sensíveis (Recomendado imediato)

Adicionar `import "server-only"` nos seguintes arquivos que ainda não o possuem:

| Arquivo | Motivo |
|---|---|
| `src/lib/auth.ts` | Contém hashing de senha e segredos |
| `src/lib/prisma.ts` | Acesso direto ao banco de dados |
| `src/lib/token.ts` | Geração de tokens criptográficos |
| `src/lib/planEntitlements.ts` | Lógica de planos que não deve ser exposta ao cliente |

**Como funciona:** O pacote `server-only` (incluído no Next.js) instrui o bundler a lançar erro de build se qualquer Client Component tentar importar o módulo. É a forma mais simples e eficaz de prevenir vazamento acidental.

```typescript
// src/lib/prisma.ts (após a melhoria)
import "server-only";
import { PrismaClient } from '@prisma/client';
// …
```

---

### Opção 2 — Separação física em pasta dedicada `src/server/`

Reorganizar o código backend em uma pasta explicitamente separada:

```
src/
├── server/           # Tudo aqui só executa no servidor
│   ├── auth/
│   │   ├── session.ts   (criar/validar sessões)
│   │   ├── password.ts  (hashing)
│   │   └── admin.ts     (autorização de admin)
│   ├── db/
│   │   └── prisma.ts
│   ├── entitlements/
│   │   └── service.ts   (lógica de entitlements)
│   └── email/
│       └── resend.ts
├── shared/           # Tipos e utilitários usados por cliente e servidor
│   ├── routes.ts
│   └── planEntitlements.ts (apenas tipos e constantes, sem acesso a DB)
└── client/           # Código exclusivamente client-side
    └── entitlementsClient.ts
```

Essa convenção é documentada na equipe e aplicada por code review. Pode ser reforçada com `"server-only"` em todos os arquivos em `src/server/`.

---

### Opção 3 — Next.js Route Handlers como única interface (API isolation)

Mover toda lógica de negócio para dentro dos Route Handlers ou para services chamados apenas por eles, sem expor helpers de banco em `src/lib/` que poderiam ser importados acidentalmente por páginas client.

**Estrutura sugerida:**

```
src/app/api/
├── auth/
│   ├── _service.ts      # Lógica de negócio (server-only implícito por estar em /api/)
│   └── login/route.ts   # Delega para _service.ts
├── entitlements/
│   ├── _service.ts
│   └── grant/route.ts
```

**Vantagem:** Arquivos dentro de `src/app/api/` nunca são importados pelo bundler do cliente (convenção do Next.js App Router). A lógica fica fisicamente inacessível ao frontend.

---

### Opção 4 — Extração do backend como serviço separado (Microservices / BFF)

Para projetos maiores ou com necessidade de escalar independentemente:

#### 4a. Backend separado (Node.js / Express / Fastify)

```
study-system/         # Frontend Next.js (apenas UI + API thin client)
study-system-api/     # Backend Node.js puro
  ├── src/
  │   ├── auth/
  │   ├── entitlements/
  │   ├── questions/
  │   └── db/
  └── prisma/
```

O Next.js atuaria apenas como BFF (Backend for Frontend), fazendo chamadas HTTP para a API separada.

**Vantagens:** Isolamento total, deploy independente, possibilidade de usar outro runtime.  
**Desvantagens:** Overhead de infra, latência adicional, complexidade de deploy.

#### 4b. Next.js como BFF + tRPC

Usar **tRPC** para definir contratos de API type-safe entre o Next.js e o banco:

```
src/
├── server/trpc/
│   ├── router/
│   │   ├── auth.ts
│   │   ├── entitlements.ts
│   │   └── student.ts
│   └── index.ts
└── app/api/trpc/[trpc]/route.ts
```

O client tRPC substitui `fetch('/api/...')` por chamadas type-safe com inferência automática.

---

### Opção 5 — Middleware de autenticação centralizado

Atualmente, cada Route Handler repete a lógica de verificação de sessão:

```typescript
// Padrão repetido em TODOS os handlers protegidos:
const cookie = (await cookies()).get('ameone_session')?.value;
const sessionId = verifySignedSession(cookie);
if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const session = await prisma.session.findUnique(…);
if (!session || session.expiresAt < new Date()) return …
```

Uma melhoria seria criar um helper de autenticação reutilizável:

```typescript
// src/lib/withAuth.ts (server-only)
import "server-only";

export async function requireSession(req?: NextRequest) {
  const cookie = (await cookies()).get('ameone_session')?.value;
  const sessionId = verifySignedSession(cookie);
  if (!sessionId) throw new AuthError('Unauthorized');
  
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) throw new AuthError('Session expired');
  
  return session;
}
```

Isso centraliza a lógica de auth e facilita mudanças futuras (ex: adicionar refresh de sessão).

---

## Recomendações Priorizadas

| Prioridade | Ação | Impacto |
|---|---|---|
| 🔴 Alta | Adicionar `"server-only"` em `prisma.ts`, `auth.ts`, `token.ts` | Evita vazamento acidental de código sensível no bundle do cliente |
| 🟡 Média | Criar helper `requireSession()` centralizado | Reduz duplicação e facilita manutenção |
| 🟡 Média | Separar logicamente `src/server/` vs `src/shared/` vs `src/client/` | Clareza arquitetural sem custo de infra |
| 🟢 Baixa | Considerar tRPC ou API routes como único ponto de entrada | Type safety de ponta a ponta |
| 🟢 Baixa | Extrair backend separado | Apenas se houver necessidade de escalar ou múltiplos clientes |

---

## Riscos Atuais

1. **`src/lib/auth.ts` sem `"server-only"`** — se importado por acidente em um Client Component, o build falhará em runtime (Node.js nativo), mas não em build time, o que pode causar erros tardios.

2. **`src/lib/planEntitlements.ts` exposto ao cliente** — o arquivo contém tanto constantes de UI (labels, caps de exibição) quanto lógica de mapeamento `plan → access flags`. A parte de `planCaps()` (usada pelo `AdvancedEngine`) é segura no cliente. A parte de `defaultLicenseExperience()` e `experienceForPlan()` (usadas em `/api/entitlements/set-plan`) deveriam estar em um módulo server-only. Recomendação: separar em dois arquivos — `planCaps.client.ts` (constantes de UI, seguro para o cliente) e `planEntitlements.server.ts` (lógica de mapeamento plan→access, marcado com `"server-only"`).

3. **Segredos de ambiente** — o uso correto de `process.env.*` (sem prefixo `NEXT_PUBLIC_`) garante que segredos não sejam expostos ao bundle. Isso está correto no projeto atual.
