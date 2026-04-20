# Autenticação Implementada

## Visão Geral

O AME ONE utiliza **autenticação customizada** baseada em **cookies assinados com HMAC-SHA256** e **sessões armazenadas no banco de dados** via Prisma. Não há integração com NextAuth, Clerk ou outro provedor externo — todo o fluxo é implementado manualmente no projeto.

---

## Fluxo Completo de Autenticação

### 1. Registro (`POST /api/auth/register`)

```
Cliente envia: { email, username, password }
         ↓
Normaliza e-mail (trim + lowercase)
         ↓
Verifica duplicidade no banco
         ↓
Hash da senha com PBKDF2 (120.000 iterações, SHA-256, 32 bytes)
         ↓
Cria User + CreditAccount (10 créditos) + CreditLedger + LicenseEntitlements (basic para todas as licenças)
         ↓
Cria Session { userId, expiresAt: agora + 12h }
         ↓
Assina sessionId com HMAC-SHA256 → "sessionId.sigHex"
         ↓
Seta cookie httpOnly "ameone_session" (12h)
         ↓
Retorna { ok: true }
```

### 2. Login (`POST /api/auth/login`)

```
Cliente envia: { email, password }
         ↓
Busca User pelo e-mail normalizado
         ↓
Verifica senha com timingSafeEqual (timing-attack safe)
         ↓
Cria nova Session { userId, expiresAt: agora + 12h }
         ↓
Assina sessionId → cookie "ameone_session"
         ↓
Retorna { ok: true }
```

**Segurança:** O endpoint retorna sempre `"Invalid credentials."` tanto para e-mail inexistente quanto para senha errada, evitando enumeração de contas.

### 3. Logout (`POST /api/auth/logout`)

```
Seta cookie "ameone_session" com expires = epoch 0 (apaga o cookie)
         ↓
Redireciona para "/"
```

**Nota:** A sessão no banco de dados **não é deletada** no logout atual — apenas o cookie é invalidado. A sessão ficará ativa no banco até o prazo de expiração ou até uma limpeza manual.

### 4. Recuperação de Senha (`POST /api/auth/forgot-password`)

```
Cliente envia: { email }
         ↓
Busca User (sem revelar se existe ou não — sempre retorna { ok: true })
         ↓
Gera token aleatório (32 bytes hex)
         ↓
Salva PasswordResetToken { userId, token, expiresAt: agora + 30min }
         ↓
Se RESEND_API_KEY configurado: envia e-mail com link de reset
Se não configurado (dev): retorna { ok: true, resetUrl: "..." } na resposta JSON
```

### 5. Redefinição de Senha (`POST /api/auth/reset-password`)

```
Cliente envia: { token, newPassword }
         ↓
Valida token no banco (não expirado, não usado)
         ↓
Hash da nova senha com PBKDF2
         ↓
Transação atômica:
  - Atualiza passwordHash do usuário + lastPasswordChangeAt
  - Marca token como usedAt (não reutilizável)
         ↓
Retorna { ok: true }
```

---

## Hashing de Senha

Arquivo: `src/lib/auth.ts`

```
Algoritmo: PBKDF2
Digest:    SHA-256
Iterações: 120.000
Key length: 32 bytes
Salt:       16 bytes aleatórios (hex)
```

Formato armazenado no banco:
```
pbkdf2$sha256$120000$<saltHex>$<hashHex>
```

A comparação usa `crypto.timingSafeEqual()` para evitar ataques de timing.

---

## Sessões

### Estrutura do Cookie

```
Nome:     ameone_session
Valor:    <sessionId>.<hmacHex>
Flags:    httpOnly, sameSite=lax, path=/
Secure:   true em produção
Expiração: 12 horas
```

### Assinatura (HMAC)

O `sessionId` (cuid gerado pelo Prisma) é assinado com HMAC-SHA256 usando o `AUTH_SECRET`:

```typescript
// src/lib/auth.ts
export function signSessionId(sessionId: string): string {
  const secret = requireAuthSecret();
  const sig = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}
```

### Verificação no Middleware

O middleware (`src/middleware.ts`) verifica o cookie em **cada requisição** usando a Web Crypto API (disponível no Edge Runtime):

```
1. Lê cookie "ameone_session"
2. Separa sessionId e sigHex
3. Recalcula HMAC esperado
4. Compara com sigHex (comparação direta de strings hex — sem timingSafeEqual no edge)
5. Se válido → libera a requisição
6. Se inválido → redireciona para /auth/login
```

**Observação:** A verificação no middleware não consulta o banco — apenas valida a assinatura criptográfica. A verificação completa (incluindo expiração) ocorre nos Route Handlers individualmente.

### Verificação nos Route Handlers

```typescript
// src/lib/auth.ts
export function verifySignedSession(cookieValue: string | undefined | null): string | null {
  // retorna sessionId ou null
  // usa timingSafeEqual para comparar buffers
}
```

Cada Route Handler protegido:
1. Chama `verifySignedSession(cookie)` → obtém `sessionId`
2. Busca a sessão no banco: `prisma.session.findUnique({ where: { id: sessionId } })`
3. Verifica `session.expiresAt > Date.now()`
4. Usa `session.userId` para operações autorizadas

---

## Proteção de Rotas (Middleware)

Arquivo: `src/middleware.ts`

```
Rotas privadas: /app/* e /admin/*
  → Se sem sessão válida: redireciona para /auth/login?next=<rota original>

Rotas de auth: /auth/*
  → Se com sessão válida: redireciona para /app (evita loop)

Rota raiz "/":
  → Sempre acessível (landing pública)
```

O matcher exclui assets estáticos (`_next/static`, `_next/image`, `favicon.ico`).

---

## Verificação de Admin

Arquivo: `src/lib/adminAuth.ts` (marcado com `"server-only"`)

Admins são definidos via variável de ambiente `ADMIN_EMAILS` (lista separada por vírgula). Não há tabela de roles no banco — o controle é por allow-list de e-mails.

```typescript
export function isAdminEmail(email: string | null | undefined): boolean {
  const allow = parseAdminEmails(process.env.ADMIN_EMAILS);
  return allow.includes(email?.toLowerCase());
}
```

---

## Diagrama de Sequência (Login)

```
Browser          API Route           Banco de Dados
  |                  |                      |
  |-- POST /login -->|                      |
  |                  |-- findUnique(email)->|
  |                  |<-- User -------------|
  |                  |                      |
  |                  | verifyPassword()     |
  |                  |                      |
  |                  |-- session.create() ->|
  |                  |<-- Session id -------|
  |                  |                      |
  |                  | signSessionId()      |
  |                  | Set-Cookie: ameone_session=<id>.<sig>
  |<-- { ok: true }--|
  |                  |
  (próximas requisições)
  |                  |
  |-- GET /app/* --->| (middleware verifica HMAC)
  |                  |-- session.findUnique() ->|
  |                  |<-- Session válida --------|
  |<-- 200 ----------|
```

---

## Pontos de Melhoria (Observados no Código)

1. **Logout não invalida sessão no banco** — uma sessão roubada antes do logout permanece válida até expirar (12h).
2. **Middleware usa comparação de string** para HMAC (sem timing-safe no Edge) — baixo risco em prática, mas seria ideal usar `crypto.subtle.timingSafeEqual` quando disponível.
3. **`getUserEmailServer.ts`** ainda usa cookie `ameone_email` e header `x-ameone-email` como fallbacks legados — esses mecanismos são vestigiais de uma versão anterior e devem ser removidos.
4. **Sem rate limiting** nas rotas de login/registro — recomendado adicionar para produção.
5. **Sessões não são limpas automaticamente** — é necessário job de cleanup para remover sessões expiradas do banco.
