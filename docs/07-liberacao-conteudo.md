# Lógica de Liberação de Conteúdo por Assinatura

## Visão Geral

O AME ONE usa um modelo de acesso **por licença + plano**, inspirado diretamente na estrutura de certificações do Transport Canada (TC). O conteúdo não é liberado de forma monolítica — cada licença (M, E, S, Balloons, REGS) é um produto independente com três níveis de plano.

---

## Arquitetura do Controle de Acesso

```
                    ┌─────────────────────────────┐
                    │     LicenseEntitlement       │
                    │  userId + licenseId + plan   │
                    │  flashcards / practice /     │
                    │  test / logbook              │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
     [Acesso ao módulo]   [Limites de uso]   [Acesso ao Logbook]
     (tem ou não tem)     (daily/weekly)     (boolean flag)
```

Há dois tipos de controle:
1. **Acesso ao módulo** — o usuário tem ou não tem a licença
2. **Experiência dentro do módulo** — tipo e limites de uso (flashcards, prática, testes)

---

## Modelo de Dados (LicenseEntitlement)

```prisma
model LicenseEntitlement {
  userId    String
  licenseId String           // "m" | "e" | "s" | "balloons" | "regs"
  plan      PlanTier         // basic | standard | premium
  flashcards FlashcardsAccess // daily_limit | unlimited
  practice  PracticeAccess   // cooldown | unlimited
  test      TestAccess       // weekly_limit | unlimited
  logbook   Boolean          // false | true (apenas premium)
}
```

Se o usuário **não possui** um `LicenseEntitlement` para uma licença, ele simplesmente não tem acesso.

---

## Planos e Capacidades

Definido em `src/lib/planEntitlements.ts`:

### Basic (~USD 10/licença)
```
flashcards: daily_limit   → 20 flashcards por dia
practice:   cooldown      → 2 sessões de prática por dia
test:       weekly_limit  → 1 teste por semana
logbook:    false
```

### Standard (~USD 20/licença)
```
flashcards: unlimited     → sem limite
practice:   unlimited     → sem limite
test:       weekly_limit  → 3 testes por semana
logbook:    false
```

### Premium (~USD 30/licença)
```
flashcards: unlimited     → sem limite
practice:   unlimited     → sem limite
test:       unlimited     → sem limite
logbook:    true          → acesso ao logbook de manutenção
```

---

## Licenças Disponíveis

| licenseId | Nome | Conteúdo |
|---|---|---|
| `regs` | REGS (Global) | CARs + Standards — compartilhado entre todas as licenças |
| `m` | M — Airplane & Helicopter | STDP, Airframe, Powerplant, Logbook |
| `e` | E — Avionics | STDP, Rating-Avionics, Logbook |
| `s` | S — Structures | STDP, Rating-Structures, Logbook |
| `balloons` | Balloons | BREGS, Logbook |

**REGS** é especial: desbloqueado uma vez, o conteúdo de regulamentos (CARs + Standards) é acessível independentemente das outras licenças.

---

## Fluxo de Liberação de Conteúdo

### 1. Registro do usuário

Ao registrar, são criados `LicenseEntitlement` com `plan: 'basic'` para **todas** as licenças. Porém, esses registros com `basic` não concedem acesso — são apenas registros placeholders:

```typescript
// src/app/api/auth/register/route.ts
licenseEntitlements: {
  createMany: {
    data: [
      { licenseId: 'regs', plan: 'basic' },
      { licenseId: 'm',    plan: 'basic' },
      { licenseId: 'e',    plan: 'basic' },
      { licenseId: 's',    plan: 'basic' },
      { licenseId: 'balloons', plan: 'basic' },
    ],
  },
},
```

**Atenção:** O comentário no código diz explicitamente:
> "Default plan experience (does NOT unlock any modules by itself)"

O acesso real é concedido apenas quando o usuário confirma um plano na área do estudante.

### 2. Seleção de plano pelo usuário

Na página `/app/student`, o usuário escolhe um plano para cada licença e chama:

```
POST /api/entitlements/set-plan
Body: { licenseId: "m", plan: "standard" }
```

O endpoint:
```typescript
const exp = defaultLicenseExperience(tier); // mapeia plan → access flags
await prisma.licenseEntitlement.upsert({
  where: { userId_licenseId: { userId, licenseId } },
  update: { plan, flashcards, practice, test, logbook },
  create: { userId, licenseId, plan, flashcards, practice, test, logbook },
});
```

**Estado atual (MVP):** Não há integração de pagamento (Stripe/etc.). O usuário pode selecionar qualquer plano sem pagar. As dependências do Stripe (`@stripe/stripe-js`, `stripe`) estão no `package.json` mas não implementadas.

### 3. Verificação de acesso (client-side)

O snapshot do estudante é carregado via:

```
GET /api/me/student
→ { credits, entitlements[], licenseEntitlements: { "m": {...}, "regs": {...} } }
```

O `entitlementsClient.ts` mantém esse snapshot em cache na sessão do browser.

---

## Verificação de Acesso por Módulo

### Função `canAccessModuleFromState`

```typescript
// src/lib/entitlementsClient.ts
export function canAccessModuleFromState(state: StudentState | null, moduleKey: string): boolean {
  if (!state) return false;

  const key = normalizeModuleKey(moduleKey); // ex: "m.powerplant"
  const [licenseId, moduleId] = key.split('.');

  const exp = state.licenseEntitlements?.[licenseId];
  if (!exp) return false; // usuário não tem a licença → bloqueado

  // Logbook exige flag específica (apenas premium)
  if (moduleId === 'logbook') return !!exp.logbook;

  // Qualquer outro módulo → basta ter a licença
  return true;
}
```

**Lógica:**
- Se não há `licenseEntitlement` para a licença → **bloqueado**
- Se é módulo `logbook` → verifica `exp.logbook` (true apenas no premium)
- Qualquer outro módulo → **liberado** ao ter a licença (qualquer plano)

### Componente `EntitlementGuard`

Envolve o conteúdo de cada página de módulo. Funciona em duas camadas:

**Camada 1 — Status do módulo (flags):**
```typescript
const flagInfo = getEffectiveFlag(licenseId, moduleId);
if (flagInfo.status === 'coming_soon') → exibe "Coming soon"
if (flagInfo.status === 'maintenance') → exibe "Under maintenance"
```

**Camada 2 — Acesso por entitlement:**
```typescript
const unlocked = keys.some((k) => canAccessModuleFromState(student, k));
if (!unlocked) → exibe "This module is locked for your current plan."
               → botão "Open Student Area" para upgrade
```

---

## Controle de Limites de Uso (Dentro do Módulo)

Implementado no `AdvancedEngine.tsx` com **localStorage** como contador:

### Chave de armazenamento
```typescript
function storageKey(kind: 'flashcards' | 'practice' | 'test') {
  return `ameone_usage:${licenseId}:${moduleId}:${kind}`;
}
```

### Lógica por modo

**Flashcards (basic: 20/dia):**
```typescript
const used = readUsage('flashcards');
const remaining = caps.flashcardsPerDay - used;
if (remaining <= 0) {
  alert('Flashcards limit reached for today. Upgrade your plan…');
  return;
}
writeUsage('flashcards', used + consumo);
```

**Prática (basic: 2/dia):**
```typescript
const used = readUsage('practice');
if (used >= caps.practicePerDay) {
  alert('Practice limit reached for today. Upgrade your plan…');
  return;
}
writeUsage('practice', used + 1);
```

**Teste (basic: 1/semana, standard: 3/semana):**
```typescript
const used = readUsage('test');
if (used >= caps.testsPerWeek) {
  alert('Test limit reached for this week. Upgrade your plan…');
  return;
}
writeUsage('test', used + 1);
```

### Janelas de tempo

- **Flashcards e Prática:** resetam diariamente (chave = `YYYY-MM-DD`)
- **Testes:** resetam semanalmente (chave = `YYYY-WWW` no formato ISO week)

```typescript
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${…}`;
}

function weekKey() {
  // Cálculo de semana ISO (começa na segunda-feira)
  return `${year}-W${weekNo}`;
}
```

---

## Fonte de Verdade: LicenseEntitlement vs Entitlement

O sistema tem dois mecanismos paralelos:

| Mecanismo | Modelo | Granularidade | Uso atual |
|---|---|---|---|
| `LicenseEntitlement` | BD | Por licença + plano | **Principal** — acesso por licença |
| `Entitlement` | BD | Por módulo específico | **Legado** — desbloqueio por créditos |

O `canAccessModuleFromState` usa exclusivamente `licenseEntitlements`. O `Entitlement` é consultado em `/api/me/student` e retornado como `entitlements[]`, mas não é usado na verificação de acesso principal (apenas legacy).

---

## Diagrama do Fluxo de Acesso

```
Usuário acessa /app/m/powerplant
         ↓
Layout /app/m/layout.tsx (Server Component)
  ModuleGate → verifica licenseFlags["m"]["powerplant"].status
  Se coming_soon ou maintenance → bloqueia com mensagem
         ↓
EntitlementGuard (Client Component)
  getStudentState() → GET /api/me/student
         ↓
  /api/me/student verifica sessão → busca licenseEntitlements no BD
         ↓
  canAccessModuleFromState(state, "m.powerplant")
    → tem licenseEntitlements["m"]? → liberado / bloqueado
         ↓
  Se bloqueado → "This module is locked for your current plan."
  Se liberado → renderiza AdvancedEngine
         ↓
AdvancedEngine
  getStudentState() → usa planCaps(plan)
  handleStartQuiz(mode) → verifica localStorage (uso diário/semanal)
  Se limite atingido → alerta e bloqueia início da sessão
```

---

## Limitações Atuais (MVP)

| Limitação | Descrição |
|---|---|
| **Sem billing** | Qualquer usuário pode definir qualquer plano sem pagar |
| **Limites client-side** | Contadores de uso ficam no localStorage — podem ser apagados ou manipulados pelo usuário |
| **Sem webhook de pagamento** | Stripe está como dependência mas não integrado |
| **Logbook flag não verificada no servidor** | A verificação de `exp.logbook` é feita no client; o servidor retorna o dado mas não enforce |

---

## Caminho para Produção

Para tornar o controle de acesso real e seguro:

1. **Integrar Stripe Webhooks** → ao receber `checkout.session.completed`, chamar internamente `set-plan` com o plano correto.

2. **Mover contadores de uso para o servidor** → endpoints `POST /api/me/usage/increment` com validação no banco, eliminando dependência do localStorage.

3. **Validar logbook no servidor** → endpoints do logbook devem verificar `exp.logbook` diretamente no banco antes de servir/salvar dados.

4. **Rate limiting** → aplicar nas rotas de início de sessão de estudo para evitar burla dos limites.
