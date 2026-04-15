# AME ONE — Estratégia de Precificação, Conteúdo e Evolução

> Documento técnico completo. Cobre modelo de negócio, arquitetura de planos, gestão de conteúdo,
> evolução gamificada e decisões de schema/código para cada fase.
>
> **Escopo de expansão:** O MVP lança com certificações canadenses (Transport Canada — AME M/E/S/Balloons).
> Futuramente, a plataforma se expandirá para certificações mundiais (FAA, EASA, ANAC, CASA, etc.).
> Todas as decisões arquiteturais devem considerar esse horizonte.

---

## 1. Diagnóstico do Modelo Atual

### 1.1 Planos existentes (seed migration 000009)

| Slug | Nome | Preço | maxLicenses | Flash | Practice | Tests | Logbook |
|---|---|---|---|---|---|---|---|
| `regs-trainee` | REGs - Trainee | $11.99 | 0 | 5/dia | 2/dia | 2/sem | Não |
| `regs-exam-ready` | REGs - Exam Ready | $16.99 | 0 | ∞ | ∞ | ∞ | Não |
| `trainee` | Trainee | $19.99 | 1 | 5/dia | 2/dia | 2/sem | Não |
| `license-track` | License Track | $26.99 | 1 | ∞ | ∞ | 3/sem | Não |
| `exam-ready` | Exam Ready | $34.99 | 1 | ∞ | ∞ | ∞ | Sim |
| `logbook-pro` | Logbook - Professional | $9.99 | 1 | 0 | 0 | 0 | Sim |

### 1.2 Problemas identificados

1. **6 planos é excessivo** para um nicho estreito (estudantes AME canadenses). Causa decision fatigue.
2. **Separação REGs vs Licenças é artificial.** Todo estudante AME precisa de Regs — vendê-lo separado força duas assinaturas.
3. **Logbook isolado em extremos.** Só no Exam Ready ($34.99) ou Logbook Pro ($9.99 sem estudo).
4. **Sem tier gratuito.** O campo `trialDays: 7` existe mas não há forma do aluno experimentar antes de pagar.
5. **`maxLicenses = 1` não escala.** Quem estuda M + E (comum) não tem opção intermediária.
6. **Limites em flashcards/practice** geram perceção negativa — são os modos de menor valor percebido.
7. **Modelo não prevê multi-jurisdição.** License IDs são hardcoded (`m`, `e`, `s`, `balloons`, `regs`) sem noção de autoridade reguladora. Quando expandir para FAA/EASA, o mesmo conceito "M" existirá com conteúdo diferente.

### 1.3 Visão de expansão global

O mercado de manutenção aeronáutica tem certificações por autoridade reguladora:

| Autoridade | País/Região | Licenças equivalentes | Mercado estimado |
|---|---|---|---|
| **Transport Canada (TC)** | Canadá | AME M, E, S | MVP — lançamento |
| **FAA** | EUA | A&P (Airframe & Powerplant) | Maior mercado mundial |
| **EASA** | Europa (32 países) | Part-66 B1, B2, B3 | 2º maior mercado |
| **ANAC** | Brasil | CMA, CME | Mercado lusófono natural |
| **CASA** | Austrália | LAME Cat A, B1, B2 | Mercado anglófono |
| **DGCA** | Índia | AME Cat A, B1, B2 | Maior volume de estudantes |

**Implicações para arquitetura:**
- Cada jurisdição tem seu framework regulatório ("Regs" equivalente)
- Licenças têm nomes diferentes mas estrutura similar (teoria + prática + logbook)
- Questões são completamente diferentes por jurisdição
- Preços devem variar por poder de compra regional (PPP)

**Princípio:** Construir o MVP com Canada hardcoded, mas com abstrações que permitam adicionar jurisdições sem refatorar o core.

---

## 2. Modelo de Precificação Proposto

### 2.1 Princípio central

> **No MVP, vender acesso ao conteúdo (simples). Na versão gamificada, dar o conteúdo e vender conforto (mais lucrativo).**

A transição funciona porque session limits → energy é uma mudança de UX, não de arquitetura.

### 2.2 Tiers propostos (MVP)

#### Tier 0 — Free (sem plano / `planId = null`)

| Feature | Limite |
|---|---|
| Regs (CARs + Standards) | Acesso total, sempre gratuito |
| Flashcard (qualquer licença) | 3 sessões/dia |
| Practice | Bloqueado |
| Test | Bloqueado |
| Logbook | Bloqueado |
| Licenças | Pode explorar 1 |

**Racional:** Regs é conteúdo universal — dá-lo de graça é o melhor funil de aquisição. O estudante entra, estuda Regs, vê flashcards das licenças, e quer mais. Custo marginal zero (conteúdo JSON estático).

#### Tier 1 — Student ($19.99/mês · $14.99/mês anual)

| Feature | Limite |
|---|---|
| Licenças incluídas | 1 (M, E, S ou Balloons) |
| Regs | Ilimitado (sempre incluído) |
| Flashcard | Ilimitado |
| Practice | Ilimitado |
| Test | 3/semana |
| Logbook | Não |
| Questões/sessão | Sem limite |

**Racional:** Unifica trainee + license-track. Remove limites em flash/practice (baixo valor percebido). Mantém gating apenas em tests (alto valor percebido).

#### Tier 2 — Pro ($29.99/mês · $22.99/mês anual)

| Feature | Limite |
|---|---|
| Licenças incluídas | Até 2 |
| Regs | Ilimitado |
| Flashcard | Ilimitado |
| Practice | Ilimitado |
| Test | Ilimitado |
| Logbook | Incluído |
| Questões/sessão | Sem limite |

**Racional:** Cobre o caso M + E ou M + S. Logbook é o diferencial que retém o usuário *depois* do exame — vira ferramenta profissional.

#### Add-on — Licença Adicional ($7.99/mês)

Para os raros usuários com 3+ licenças. Implementável como Stripe subscription item com quantity.

### 2.3 Desconto anual

| Plano | Mensal | Anual (por mês) | Economia |
|---|---|---|---|
| Student | $19.99 | $14.99 | 25% |
| Pro | $29.99 | $22.99 | 23% |

Desconto agressivo (25-30%) porque o ciclo de estudo AME é de 6-12 meses. Anual reduz churn e aumenta LTV.

### 2.5 Precificação multi-jurisdição (expansão futura)

Quando expandir para outras autoridades, a precificação deve considerar:

**Opção recomendada: Mesmos tiers, preços regionalizados (PPP)**

| Jurisdição | Student | Pro | Moeda | Justificativa |
|---|---|---|---|---|
| TC (Canadá) | $19.99 | $29.99 | CAD | Mercado de lançamento |
| FAA (EUA) | $19.99 | $29.99 | USD | Poder de compra similar |
| EASA (Europa) | €17.99 | €27.99 | EUR | Paridade ~1:1 com USD |
| ANAC (Brasil) | R$49.90 | R$79.90 | BRL | PPP: ~60% do preço USD |
| CASA (Austrália) | A$24.99 | A$39.99 | AUD | Paridade ~1.3:1 |
| DGCA (Índia) | ₹499 | ₹799 | INR | PPP: ~25% do preço USD |

**Modelo de assinatura por jurisdição:**
- Cada assinatura cobre **1 jurisdição** (ex: TC Canada)
- Dentro da jurisdição, funciona igual: Student = 1 licença, Pro = 2 licenças
- Não faz sentido cross-jurisdiction (quem estuda FAA não precisa de TC)
- Stripe suporta multi-currency nativamente via Prices por currency

**Alternativa descartada:** Assinatura global (todas as jurisdições) — não faz sentido porque ninguém estuda para duas autoridades simultaneamente. Um piloto/mecânico se certifica em UM país.

### 2.5 Trial

- **7 dias de Pro** para todo novo registro (campo `trialDays` já existe no schema).
- Após trial, downgrade automático para Free se não converter.
- Experiência: usuário conhece tests ilimitados + logbook → sente a perda → converte.

---

## 3. Gestão de Conteúdo

### 3.1 Inventário atual (TC — Canadá)

| Licença | Módulos | Seções (arquivos JSON) |
|---|---|---|
| M (Mechanical) | Standard Practices, Airframe, Powerplant | 10 + 20 + 12 = 42 |
| E (Avionics) | Standard Practices, Rating Avionics | ~15 |
| S (Structures) | Standard Practices, Rating Structures | ~15 |
| Balloons | BRegs | ~5 |
| Regs | CARs, Standards | 2 arquivos bulk |

### 3.2 Estrutura de conteúdo multi-jurisdição (futuro)

Quando expandir, o conteúdo se organiza em **3 níveis**: Jurisdição → Licença → Módulo.

```
data/
  tc/                          # Transport Canada (MVP — atual)
  │ ├── m/                     # Licença M (Mechanical)
  │ ├── e/                     # Licença E (Avionics)
  │ ├── s/                     # Licença S (Structures)
  │ ├── balloons/              # Balloons
  │ └── regs/                  # CARs + Standards
  faa/                         # FAA (futuro)
  │ ├── airframe/              # A&P Airframe
  │ ├── powerplant/            # A&P Powerplant
  │ ├── general/               # A&P General
  │ └── regs/                  # 14 CFR Part 43, 65, 147
  easa/                        # EASA (futuro)
  │ ├── b1/                    # Part-66 B1 (Mechanical)
  │ ├── b2/                    # Part-66 B2 (Avionics)
  │ └── regs/                  # Part-145, Part-66 regs
  anac/                        # ANAC Brasil (futuro)
  │ ├── cma/                   # Célula e Motor (Airframe)
  │ ├── cme/                   # Aviônicos
  │ └── regs/                  # RBAC 43, 65, 145
```

**Impacto no MVP:** Nenhum. A estrutura atual `data/m/`, `data/e/` é implicitamente `data/tc/m/`. A reorganização em diretórios por jurisdição pode ser feita quando a segunda jurisdição for adicionada, sem impacto nos dados existentes.

**Na tabela `License`:** Adicionar campo `jurisdiction` (ver seção 5.8).

### 3.3 Conteúdo regulatório como funil universal

Em TODA jurisdição, existe um módulo de regulamentos (Regs). A estratégia "Regs gratuito" escala globalmente:

| Jurisdição | Regs equivalente | Gate |
|---|---|---|
| TC (Canadá) | CARs + Standards | Gratuito |
| FAA (EUA) | 14 CFR Parts 43/65/147 | Gratuito |
| EASA (Europa) | Part-66 Module 10 (Aviation Legislation) | Gratuito |
| ANAC (Brasil) | RBAC 43 + RBAC 65 | Gratuito |

Cada jurisdição nova ganha seu funil de aquisição gratuito imediatamente.

### 3.4 Modelo de acesso por fase

| Fase | Gate de conteúdo | Gate de uso | Escopo geográfico |
|---|---|---|---|
| **MVP** | Por licença (enrollment) | Sessions/período | Canadá (TC) |
| **Expansão** | Por licença + jurisdição | Sessions/período | +FAA, +EASA |
| **Gamificado** | Progressive unlock (skill tree) | Energy/hearts | Multi-jurisdição |
| **Maduro** | 100% gratuito | Premium = conforto | Global |

### 3.5 Separar "disponível" de "desbloqueado"

Hoje todas as questões de uma licença são acessíveis de uma vez. Para progressive unlock no futuro:

**O que já existe e ajuda:**
- `StudyProgress` por `moduleKey` + `mode`
- `QuestionScore` com confiança por questão
- `TopicPerformance` por tópico
- `Subject` com `displayOrder` (base para skill tree)
- `metadata.json` por módulo com seções ordenadas e pesos

**O que será necessário na Fase 2 (NÃO construir agora):**
- Model `UserSectionUnlock` (userId, subjectId, unlockedAt)
- Lógica "completou 80% da seção X → desbloqueia seção Y"

**Ação MVP:** Nenhuma. Mas **não eliminar Subject/Topic** do schema — eles viram nós do skill tree.

---

## 4. Evolução para Gamificação (Energy System)

### 4.1 Fases de evolução

```
Fase 1 (MVP)          →  Fase 2 (Energy)        →  Fase 3 (Full Gamification)
Session limits            Hearts/Energy              Freemium Duolingo-style
"5 sessões/dia"           "5 ⚡ que regeneram"        "Conteúdo free, premium = conforto"
```

### 4.2 De session limits para energy

| Conceito MVP | Conceito Energy | Mudança real |
|---|---|---|
| `sessionsUsed` no período | `energyConsumed` | Rename |
| Reset por dia/semana/mês | Regeneração contínua (1 a cada Nh) | Fórmula no `studyAccess.ts` |
| `remaining <= 0` → bloqueado | `energy <= 0` → espera ou assiste ad | Mesma lógica, UX diferente |
| `StudySession.count()` | `StudySession.count()` | **Sem mudança** no model |

A tabela `StudySession` não muda. Só muda a fórmula de cálculo.

### 4.3 Monetização por fase

| Fase | Free dá | Premium vende |
|---|---|---|
| MVP | Regs + flash limitado | Acesso a modos + licenças |
| Energy | Todo conteúdo + 5 hearts | Hearts ilimitados + logbook |
| Full | Tudo + hearts + ads | Sem ads + streak repair + review + logbook |

### 4.4 Referência Duolingo

| Dimensão | Duolingo Free | Duolingo Super |
|---|---|---|
| Conteúdo | 100% acessível | 100% acessível |
| Energia | 5 hearts — erra = perde 1 | Ilimitado |
| Streak | Congela? Perdeu. | Streak repair incluso |
| Mistake review | Não | Sim |
| Ads | Sim | Não |

**O insight:** Duolingo não vende conteúdo. Vende conforto. O caminho do AME ONE é chegar lá incrementalmente.

---

## 5. Decisões Arquiteturais

### 5.1 Schema do Plan (atual ✅)

```prisma
model Plan {
  flashcardsLimit    Int       // -1 = unlimited, 0 = blocked, N = limit
  flashcardsUnit     LimitUnit // day | week | month
  practiceLimit      Int
  practiceUnit       LimitUnit
  testsLimit         Int
  testsUnit          LimitUnit
  maxQuestionsPerSession Int?
  logbookAccess      Boolean
  maxLicenses        Int
  trialDays          Int       @default(7)
  stripePriceMonthly String?
  stripePriceAnnual  String?
}
```

**Suficiente para MVP.** Cada feature nova (streak repair, ad-free) exigiria coluna extra.

### 5.2 Feature flags (evolução futura)

Quando o modelo de colunas ficar apertado, migrar para key-value:

```prisma
model PlanFeature {
  id         Int    @id @default(autoincrement())
  planId     Int
  featureKey String // "energy_limit", "streak_repair", "ad_free", "logbook"
  valueJson  String // "5", "true", "null" (unlimited)
  plan       Plan   @relation(fields: [planId], references: [id])
  @@unique([planId, featureKey])
}
```

Os valores atuais viram os primeiros `featureKey`s. O `planEntitlements.ts` já abstrai o acesso via `experienceForPlan(plan)` — o resto do código não toca colunas diretamente.

**Ação MVP:** Não implementar. Manter colunas.

### 5.3 Usage tracking (atual ✅)

```typescript
// studyAccess.ts — já implementado server-side
const count = await db.studySession.count({
  where: { userId, licenseId, mode, createdAt: { gte: rangeStart(unit) } }
});
const remaining = limit === -1 ? Infinity : limit - count;
```

**Evolução para energy:**

```typescript
// Pseudocódigo — Fase 2
const consumed = await db.studySession.count({ ... últimas 24h ... });
const regenerated = Math.floor(hoursSinceOldest / REGEN_HOURS);
const energy = Math.min(MAX_ENERGY, MAX_ENERGY - consumed + regenerated);
```

Mesma tabela `StudySession`, fórmula diferente.

### 5.4 Streaks e XP (existente ✅)

```prisma
model UserStreak {
  currentStreak  Int
  longestStreak  Int
  totalXp        Int
}
```

**Evolução para gamificação (adicionar):**
- `streakFreezes Int @default(0)` — feature premium
- `xpToday Int @default(0)` — daily goals
- `league String?` — leaderboards (bronze/silver/gold)

Não precisa agora. O schema atual não atrapalha.

### 5.5 Progressive unlock (futuro)

**Quando implementar skill tree:**

```prisma
model UserSectionProgress {
  id         Int      @id @default(autoincrement())
  userId     Int
  subjectId  Int
  mastery    Float    @default(0) // 0.0 → 1.0
  unlockedAt DateTime?
  @@unique([userId, subjectId])
}
```

Depende do Subject/Topic hierarchy que já existe no schema. A ordem de desbloqueio vem do `displayOrder` dos Subjects.

### 5.6 Multi-jurisdição — impacto no schema

O model `License` atual não tem noção de jurisdição:

```prisma
// Atual
model License {
  id           String  @id  // "m", "e", "s", "balloons", "regs"
  name         String
  description  String?
  ...
}
```

**Evolução necessária (ao adicionar 2ª jurisdição):**

```prisma
model Jurisdiction {
  id          String   @id  // "tc", "faa", "easa", "anac"
  name        String        // "Transport Canada", "FAA", etc.
  country     String        // "CA", "US", "EU", "BR"
  currency    String        // "CAD", "USD", "EUR", "BRL"
  isActive    Boolean  @default(false)
  licenses    License[]
}

model License {
  id             String  @id  // "tc-m", "faa-airframe", "easa-b1"
  jurisdictionId String       // "tc", "faa", "easa"
  name           String
  ...
  jurisdiction   Jurisdiction @relation(fields: [jurisdictionId], references: [id])
}
```

**Impacto no código:**

| Componente | Mudança |
|---|---|
| `LicenseEntitlement` | Já tem `licenseId` — se o ID mudar de `"m"` para `"tc-m"`, basta migrar |
| `StudySession` | Já tem `licenseId` — mesma migração |
| `studyAccess.ts` | Nenhuma — query por `licenseId` continua igual |
| `modules.ts` | Adicionar mapeamento por jurisdição |
| Sidebar/navigation | Agrupar licenças por jurisdição |
| Landing/pricing | Selector de jurisdição antes de ver planos |
| `data/` directory | Reorganizar em `data/{jurisdiction}/` |

**Ação MVP:** Nenhuma. Manter `License.id` como `"m"`, `"e"`, etc. Quando adicionar FAA, as IDs novas serão `"faa-airframe"`, `"faa-powerplant"` e as canadenses podem ser migradas para `"tc-m"`, `"tc-e"` ou mantidas como estão com um campo `jurisdictionId` adicionado.

**Estratégia de migração com zero downtime:**
1. Adicionar campo `jurisdictionId` com default `"tc"` (nullable no início)
2. Backfill todas as Licenses existentes com `jurisdictionId = "tc"`
3. Tornar campo obrigatório
4. Adicionar novas Licenses com IDs prefixados (`faa-*`)

### 5.7 Planos e jurisdição — relação

O `Plan` é **agnóstico de jurisdição**. Os tiers Free/Student/Pro funcionam igual para qualquer autoridade.

- O `User` tem um `planId` (Student ou Pro) — isso define seus limites
- O `LicenseEntitlement` define quais licenças (de qual jurisdição) ele matriculou
- O `maxLicenses` do Plan limita quantas licenças o user pode ter, independente da jurisdição

Exemplo: Um user Pro (`maxLicenses = 2`) pode ter:
- `tc-m` + `tc-e` (duas licenças canadenses), ou
- `faa-airframe` + `faa-powerplant` (duas licenças FAA), ou
- `tc-m` + `faa-airframe` (cross-jurisdiction — raro mas possível)

Não é necessário criar planos diferentes por jurisdição. Os preços regionalizados são tratados via Stripe multi-currency Prices no mesmo Product.

### 5.8 Tier gratuito — impacto no código

Hoje o sistema assume que `user.planId != null` para dar acesso. Para o Free tier:

| Arquivo | Mudança necessária |
|---|---|
| `studyAccess.ts` | Se `planId == null`: Regs = unlimited; flash = 3/day; rest = blocked |
| `session/start/route.ts` | Aceitar usuário sem plano para Regs e flashcards |
| `EntitlementGuard.tsx` | Permitir acesso a Regs sem enrollment pago |
| `AdvancedEngine.tsx` | Nenhuma (já lê `modeAvailability` que vem do backend) |

### 5.9 Stripe — estrutura proposta

| Plan slug | Stripe Product | Monthly Price | Annual Price |
|---|---|---|---|
| `student` | prod_student | $19.99/mo | $179.88/yr ($14.99/mo) |
| `pro` | prod_pro | $29.99/mo | $275.88/yr ($22.99/mo) |
| `license-addon` | prod_addon | $7.99/mo | $83.88/yr ($6.99/mo) |

- Free não tem produto Stripe (sem cobrança).
- `trialDays: 7` no Pro — Stripe gerencia trial automaticamente.
- Upgrade Student → Pro via `subscription.update()` com proration.
- Downgrade Pro → Student no final do período (`cancel_at_period_end` + resubscribe).

---

## 6. Roadmap de Implementação

### Fase 1 — MVP Canadá (atual → próximas semanas)

- [x] Session limits server-side (`StudySession.count()`)
- [x] Blocking UI com badges Available/Blocked
- [x] i18n EN/PT para study engine
- [ ] Simplificar para 3 planos (Free / Student / Pro)
- [ ] Implementar Free tier (acesso sem `planId`)
- [ ] Criar Stripe Products/Prices para Student e Pro
- [ ] Trial de 7 dias no Pro
- [ ] Regs sempre gratuito sem enrollment pago

### Fase 1.5 — Expansão para 2ª jurisdição (quando validar no Canadá)

- [ ] Adicionar model `Jurisdiction` ao schema (ou campo `jurisdictionId` em `License`)
- [ ] Migrar Licenses existentes com `jurisdictionId = "tc"`
- [ ] Criar Licenses da nova jurisdição (ex: `faa-airframe`, `faa-powerplant`, `faa-general`)
- [ ] Reorganizar `data/` em subdiretórios por jurisdição
- [ ] Adicionar Stripe Prices em nova moeda (se aplicável)
- [ ] Selector de jurisdição no onboarding e landing page
- [ ] Conteúdo regulatório da nova jurisdição como free tier
- [ ] i18n: adicionar idiomas conforme necessário (ex: espanhol para LATAM)

### Fase 2 — Energy System (quando houver tração multi-jurisdição)

- [ ] Trocar "sessões restantes" por "energia" (visual)
- [ ] Regeneração contínua em vez de reset por período
- [ ] Barra de energia na UI
- [ ] Migrar Plan para `PlanFeature` key-value (se necessário)
- [ ] Streak freezes como feature premium

### Fase 3 — Full Gamification (quando houver volume global)

- [ ] Progressive unlock (skill tree por Subject)
- [ ] Leaderboards e leagues (por jurisdição + global)
- [ ] Daily goals e XP diário
- [ ] Abrir todo conteúdo como gratuito
- [ ] Monetizar conveniência (hearts ilimitados, streak repair, mistake review, sem ads)
- [ ] Ads para tier gratuito (se viável no nicho)
- [ ] Leaderboards cross-jurisdiction ("ranking global de aviação")

---

## 7. Métricas-Chave por Fase

| Fase | North Star Metric | Secundárias |
|---|---|---|
| MVP (Canadá) | Free → Student conversion rate | Trial start rate, 7-day retention |
| Expansão (multi-jurisdição) | Registros por jurisdição nova | Time-to-first-session, conteúdo coverage % |
| Energy | DAU/MAU ratio | Sessions/user/day, energy depletion rate |
| Full (global) | Monthly recurring revenue (MRR) | Premium conversion, churn by jurisdiction, streak length |

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Free tier canibaliza pagantes | Média | Flashcard-only é insuficiente para passar no exame — users precisam de practice + test |
| Nicho pequeno demais para freemium | Média | Monitorar CAC vs LTV; pivotar para B2B (escolas AME) se necessário |
| Migração de 6→3 planos irrita early adopters | Baixa | Grandfather: manter planos legados para usuários existentes, `isActive = false` para novos |
| Energy system confunde público profissional | Baixa | Testar com cohort antes de rollout total |
| Conteúdo de nova jurisdição insuficiente no lançamento | Alta | Lançar nova jurisdição só quando tiver ≥60% do conteúdo; usar flag `isActive` no Jurisdiction |
| Regulamentações diferentes inviabilizam modelo único | Baixa | A estrutura License → Module → Subject é genérica o suficiente; cada jurisdição popula seus próprios dados |
| Precificação PPP gera arbitragem (VPN) | Baixa | Stripe valida país do cartão; não é problema prático em nicho profissional |
| Complexidade de i18n explode com jurisdições | Média | Cada jurisdição precisa de 1 idioma principal; EN já cobre TC/FAA/CASA; PT cobre ANAC |
| Partição de leaderboards fragmenta comunidade | Média | Leaderboards por jurisdição + ranking global cross-jurisdiction |
