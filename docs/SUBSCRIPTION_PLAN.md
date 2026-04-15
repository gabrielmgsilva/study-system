# AME ONE — Planos de Assinatura e Evolução Energy

> Documento focado em planos, preços e transição para sistema de energia.
> Para detalhes técnicos e arquiteturais, ver `docs/PRICING_STRATEGY.md`.
>
> **Escopo:** Lançamento com certificações canadenses (Transport Canada). Expansão futura
> para FAA (EUA), EASA (Europa), ANAC (Brasil) e outras autoridades mundiais.

---

## 1. Planos de Assinatura

### Free (sem cobrança)

| Feature | Acesso |
|---|---|
| Regs (CARs + Standards) | ✅ Ilimitado — sempre gratuito |
| Flashcards | 3 sessões/dia (qualquer licença) |
| Practice | ❌ Bloqueado |
| Tests | ❌ Bloqueado |
| Logbook | ❌ Bloqueado |
| Licenças | 1 para explorar |

**Objetivo:** Funil de aquisição. Todo estudante AME precisa de Regs. Entra grátis, experimenta flashcards, quer mais.

> **Nota global:** Cada jurisdição tem seu módulo regulatório equivalente (FAA: 14 CFR Parts, EASA: Part-66 Module 10, ANAC: RBAC). A estratégia "Regs gratuito" se replica automaticamente em toda nova jurisdição — é o funil universal.

---

### Student — $19.99/mês · $14.99/mês no anual

| Feature | Acesso |
|---|---|
| Regs | ✅ Ilimitado |
| Licenças | 1 (M, E, S ou Balloons) |
| Flashcards | ✅ Ilimitado |
| Practice | ✅ Ilimitado |
| Tests | 3 por semana |
| Logbook | ❌ |

**Objetivo:** O plano essencial. Acesso completo aos modos de estudo com gating apenas em tests (modo de maior valor percebido).

---

### Pro — $29.99/mês · $22.99/mês no anual

| Feature | Acesso |
|---|---|
| Regs | ✅ Ilimitado |
| Licenças | Até 2 (M+E, M+S, etc.) |
| Flashcards | ✅ Ilimitado |
| Practice | ✅ Ilimitado |
| Tests | ✅ Ilimitado |
| Logbook | ✅ Incluído |

**Objetivo:** O plano completo. Cobre o caso mais comum (duas licenças) e inclui logbook como ferramenta profissional que retém o usuário após o exame.

---

### Add-on: Licença Adicional — $7.99/mês

Para quem precisa de 3+ licenças (raro). Funciona cross-jurisdiction: um user Pro pode ter `tc-m` + `faa-airframe` se precisar.

---

## 2. Precificação por Jurisdição (expansão futura)

Os tiers (Free / Student / Pro) são **iguais para todas as jurisdições**. Os preços variam por poder de compra regional (PPP):

| Jurisdição | País/Região | Student | Pro | Moeda |
|---|---|---|---|---|
| **Transport Canada** | Canadá 🇨🇦 | $19.99 | $29.99 | CAD |
| **FAA** | EUA 🇺🇸 | $19.99 | $29.99 | USD |
| **EASA** | Europa 🇪🇺 | €17.99 | €27.99 | EUR |
| **ANAC** | Brasil 🇧🇷 | R$49.90 | R$79.90 | BRL |
| **CASA** | Austrália 🇦🇺 | A$24.99 | A$39.99 | AUD |
| **DGCA** | Índia 🇮🇳 | ₹499 | ₹799 | INR |

**Regras:**
- Cada assinatura cobre **1 jurisdição** por padrão
- `maxLicenses` limita licenças dentro de qualquer jurisdição
- Cross-jurisdiction é possível (raro) e conta no mesmo `maxLicenses`
- Stripe suporta multi-currency nativamente via Prices por currency
- Não faz sentido "assinatura global" — ninguém estuda para duas autoridades simultaneamente

---

## 3. Trial e Conversão

| Etapa | Comportamento |
|---|---|
| Registro | Usuário entra no **Free** |
| Primeiro acesso | Oferta de **7 dias de Pro grátis** |
| Durante trial | Acesso total: tests ilimitados, 2 licenças, logbook |
| Fim do trial sem pagamento | Volta para **Free** automaticamente |
| Conversão | Usuário sente a perda dos tests + logbook → assina |

---

## 4. Tabela Comparativa Visual (para página de pricing)

| | Free | Student | Pro |
|---|---|---|---|
| **Preço** | $0 | $19.99/mês | $29.99/mês |
| **Regulamentos (CARs + Standards)** | ✅ | ✅ | ✅ |
| **Flashcards** | 3/dia | ✅ Ilimitado | ✅ Ilimitado |
| **Practice** | — | ✅ Ilimitado | ✅ Ilimitado |
| **Tests simulados** | — | 3/semana | ✅ Ilimitado |
| **Logbook digital** | — | — | ✅ |
| **Licenças incluídas** | 1 | 1 | 2 |
| **Licença extra** | — | $7.99/mês | $7.99/mês |
| **Desconto anual** | — | 25% | 23% |
| | | | ⭐ Popular |

---

## 5. Evolução: De Sessões para Energia

A transição de session limits para energy system é uma **mudança de UX**, não de arquitetura. Os dados e tabelas não mudam.

### 5.1 Fase atual (MVP — Canadá) — Session Limits

```
Usuário tem 3 flashcards/dia
├── Inicia sessão 1 → OK (restam 2)
├── Inicia sessão 2 → OK (restam 1)
├── Inicia sessão 3 → OK (restam 0)
└── Inicia sessão 4 → BLOQUEADO "Volta amanhã"
```

**Como funciona por baixo:**
- Countamos `StudySession` no período (dia/semana/mês)
- Se `count >= limit` → bloqueia
- Reset implícito pela janela de tempo

### 5.2 Fase 2 — Energy/Hearts

```
Usuário tem 5 ⚡ de energia
├── Inicia sessão → -1⚡ (restam 4)
├── Inicia sessão → -1⚡ (restam 3)
├── ...
├── Energia = 0 → BLOQUEADO "Regenera em 2h"
└── Após 2h → +1⚡ automaticamente
```

**O que muda na UX:**

| Antes (MVP) | Depois (Energy) |
|---|---|
| "3 sessões restantes hoje" | "5 ⚡ de energia" |
| Reset diário às 00:00 | Regeneração contínua (1 a cada 4h) |
| Banner: "Limite atingido" | Banner: "Sem energia — regenera em 2h" |
| Botão desabilitado | Botão desabilitado + opção "Assistir ad" (futuro) |

**O que NÃO muda:**
- Tabela `StudySession` (mesma)
- Backend continua countando sessões
- Fórmula muda de `limit - count` para `maxEnergy - consumed + regenerated`

### 5.3 Fase 3 — Full Gamification (estilo Duolingo)

```
                    Free                     Premium
Conteúdo            100% acessível           100% acessível
Energia             5 hearts                 ∞ hearts
Errou questão       -1 heart                 Sem penalidade
Heart = 0           Espera 4h ou ad          N/A
Streak              Perdeu = reinicia        Streak repair incluso
Mistake review      ❌                        ✅ Revisar erros
Ads                 Sim                      Não
```

### 5.4 Mapeamento de features por fase

| Feature | MVP (Canadá) | Expansão (multi) | Energy (Fase 2) | Full (Fase 3) |
|---|---|---|---|---|
| Session limits | ✅ Ativo | ✅ Mesmo | Renomeado "energy" | Substituído por hearts |
| Regeneração | Reset por período | Reset por período | Contínua (Nh) | Contínua |
| Multi-jurisdição | — | ✅ Jurisdiction selector | ✅ | ✅ |
| Preços regionais (PPP) | — | ✅ Multi-currency | ✅ | ✅ |
| Streak freezes | — | — | Feature premium | Feature premium |
| Mistake review | — | — | — | Feature premium |
| Ads | — | — | — | Free tier |
| Progressive unlock | — | — | — | Skill tree |
| Leaderboards | — | — | — | Por jurisdição + global |

### 5.5 Impacto ao usuário em cada transição

#### MVP (Canadá) → Expansão (multi-jurisdição)

| Aspecto | Impacto |
|---|---|
| Funcionalidade | **Nenhum** para usuários existentes (Canadá não muda) |
| Visual | Aparece selector de jurisdição no onboarding |
| Planos/preços | **Nenhum.** Mesmos tiers, preços por região só afetam novos markets |
| Dados do usuário | **Nenhum.** Licenças existentes ganham `jurisdictionId = "tc"` sem impacto |
| Migração DB | Aditivar campo `jurisdictionId` em `License` (non-breaking) |

#### Expansão → Energy (Fase 2)

| Aspecto | Impacto |
|---|---|
| Funcionalidade | **Nenhum.** Mesmos limites, apresentação diferente |
| Visual | Barra de energia substitui texto "X sessões restantes" |
| Planos/preços | **Nenhum.** Mesmos tiers, mesmos preços |
| Dados do usuário | **Nenhum.** `StudySession` e `StudyProgress` intactos |
| Migração DB | Nenhuma (ou mínima — campos opcionais de energia) |

#### Energy → Full Gamification (Fase 3)

| Aspecto | Impacto |
|---|---|
| Funcionalidade | Conteúdo fica 100% gratuito — upgrade para todos |
| Visual | Skill tree, XP, leagues, streak UI redesenhado |
| Planos/preços | Free ganha acesso a conteúdo; Premium = conforto |
| Dados do usuário | Migração de progresso existente → skill tree |
| Migração DB | `UserSectionProgress` + streak fields + league |

---

## 6. Configuração dos Planos no Sistema

### 6.1 Seed SQL proposto (substitui os 6 planos atuais)

```sql
-- Desativar planos legados
UPDATE "plans" SET "is_active" = false, "updated_at" = CURRENT_TIMESTAMP
WHERE "slug" IN ('regs-trainee','regs-exam-ready','trainee','license-track','exam-ready','logbook-pro')
  AND "deleted_at" IS NULL;

-- Inserir novos planos
INSERT INTO "plans" (slug, name, description, price, max_licenses,
  flashcards_limit, flashcards_unit, practice_limit, practice_unit,
  tests_limit, tests_unit, max_questions_per_session, logbook_access,
  display_order, trial_days, is_active, created_at, updated_at)
VALUES
  ('student', 'Student', 'One certification track with full study access.',
   19.99, 1, -1, 'day', -1, 'day', 3, 'week', NULL, false, 10, 0, true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('pro', 'Pro', 'Two certification tracks, unlimited tests, and logbook.',
   29.99, 2, -1, 'day', -1, 'day', -1, 'week', NULL, true, 20, 7, true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  price = EXCLUDED.price, max_licenses = EXCLUDED.max_licenses,
  flashcards_limit = EXCLUDED.flashcards_limit, flashcards_unit = EXCLUDED.flashcards_unit,
  practice_limit = EXCLUDED.practice_limit, practice_unit = EXCLUDED.practice_unit,
  tests_limit = EXCLUDED.tests_limit, tests_unit = EXCLUDED.tests_unit,
  logbook_access = EXCLUDED.logbook_access, display_order = EXCLUDED.display_order,
  trial_days = EXCLUDED.trial_days, is_active = EXCLUDED.is_active,
  deleted_at = NULL, updated_at = CURRENT_TIMESTAMP;
```

### 6.2 Free tier (sem entrada no banco)

O Free tier não é um `Plan` no banco. É o estado padrão quando `user.planId = null`:

| Modo | Regra |
|---|---|
| Regs | Acesso ilimitado sem enrollment pago |
| Flashcard | 3 sessões/dia (hardcoded ou config) |
| Practice | Bloqueado |
| Test | Bloqueado |

---

## 7. Preços Stripe

| Plan | Product ID | Monthly Price | Annual Price | Trial |
|---|---|---|---|---|
| Student | `prod_student` | $19.99/mo | $179.88/yr ($14.99/mo) | Não |
| Pro | `prod_pro` | $29.99/mo | $275.88/yr ($22.99/mo) | 7 dias |
| Licença extra | `prod_addon` | $7.99/mo | $83.88/yr ($6.99/mo) | Não |

> **Multi-currency:** Quando expandir para outras jurisdições, cada Stripe Price ganha versões em moedas locais
> (USD, EUR, BRL, AUD, INR). Um Product = múltiplos Prices. O sistema detecta a jurisdição do usuário
> e apresenta o Price na moeda correta.

---

## 8. Resumo da Estratégia

```
AGORA (MVP — Canadá)
├── 3 tiers: Free / Student ($20) / Pro ($30)
├── Regs gratuito como funil
├── Session limits para gating
└── Trial de 7 dias no Pro

EXPANSÃO (multi-jurisdição)
├── Mesmos tiers para todas as jurisdições
├── Preços regionalizados (PPP) via Stripe multi-currency
├── Regs de cada jurisdição = free tier local
└── Jurisdiction selector no onboarding

TRAÇÃO (Energy)
├── Mesmos tiers e preços
├── "Sessões" vira "Energia" (UX only)
├── Regeneração contínua substitui reset diário
└── Streak freezes como feature premium

VOLUME (Full Gamification)
├── Free = todo conteúdo + 5 hearts
├── Premium = hearts infinitos + streak repair + sem ads + logbook
├── Progressive unlock (skill tree)
└── Leaderboards por jurisdição + ranking global
```

**Princípio guia:** Cada transição é incremental. Nenhuma destrói dados de usuário, invalida assinaturas existentes, nem exige que usuários de uma jurisdição sejam impactados por mudanças em outra.
