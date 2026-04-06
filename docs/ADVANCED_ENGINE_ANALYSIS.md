# AdvancedEngine — Análise Completa

> **Arquivo**: `src/components/study/AdvancedEngine.tsx` (~2.258 linhas)  
> **Tipo**: Componente React client-side (`'use client'`)  
> **Papel**: Motor único de estudo que alimenta todas as páginas de módulo do sistema

---

## 1. Visão Geral

O `AdvancedEngine` é o **coração funcional do sistema de estudo**. É um componente monolítico que implementa os três modos de estudo (Flashcard, Practice, Test) em uma única unidade, consumido por **8 páginas de módulo** no sistema.

Ele é responsável por:

- Renderizar a tela inicial de seleção de seções e modo de estudo
- Construir e embaralhar o deck de questões
- Gerenciar o ciclo de vida completo de cada sessão (início → quiz → resultado)
- Aplicar limites de uso baseados em plano (gating)
- Persistir progresso e histórico (localStorage + API)
- Calcular scores, breakdowns por tópico e classificações

---

## 2. Interface Pública (Props)

```typescript
interface AdvancedEngineProps {
  moduleId: string; // Ex: "airframe", "powerplant"
  moduleTitle: string; // Título visível ao usuário
  moduleDescription: string; // Descrição na home screen
  sections: DeckSection[]; // Seções com questões (vindas do JSON)
  licenseId?: "m" | "e" | "s" | "balloons" | "regs";
  backHref?: string; // URL de voltar customizada
  defaultTestQuestionCount?: number; // Questões por simulado (default: 50)
}
```

### Tipos Exportados

| Tipo          | Uso                                              |
| ------------- | ------------------------------------------------ |
| `OptionKey`   | `'A' \| 'B' \| 'C' \| 'D'`                       |
| `RawQuestion` | Formato bruto das questões nos JSONs             |
| `DeckSection` | Seção com `id`, `title`, `weight`, `questions[]` |

---

## 3. Máquina de Estados (Telas)

```
                          ┌─────────────────────────────────────┐
                          │              HOME                    │
                          │  Selecionar seções + modo de estudo  │
                          └────────────┬────────────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               ▼                       ▼                       ▼
         ┌──────────┐          ┌──────────────┐         ┌──────────┐
         │ FLASHCARD│          │   PRACTICE   │         │   TEST   │
         │  (quiz)  │          │    (quiz)    │         │  (quiz)  │
         └────┬─────┘          └──────┬───────┘         └────┬─────┘
              │                       │                      │
              │ loop (volta           │                      │
              │ ao índice 0)          ▼                      ▼
              └──────────┐    ┌────────────────┐    ┌──────────────┐
                         │    │practiceResults │    │   results    │
                         │    │ (resumo)       │    │ (TC-style)   │
                         └────┴────────────────┘    └──────────────┘
```

---

## 4. Regras de Negócio por Modo

### 4.1 Flashcard

| Regra           | Detalhe                                                       |
| --------------- | ------------------------------------------------------------- |
| Interação       | Nenhuma — exibe resposta correta + explicação automaticamente |
| Navegação       | Livre (prev/next), loop infinito no final                     |
| Scoring         | Não atualiza scores de questão                                |
| Timer           | Não tem                                                       |
| Persistência DB | **Não persiste** (apenas uso rastreado p/ limites)            |
| Resultado       | Sem tela de resultado — retorna à home manualmente            |

### 4.2 Practice

| Regra               | Detalhe                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Interação           | Usuário seleciona resposta (RadioGroup)                             |
| Lock                | Resposta trancada após seleção (irreversível)                       |
| Feedback            | Imediato (✓ verde / ✗ vermelho + explicação)                        |
| Scoring             | Atualiza `questionScores` (±1, range 0–5)                           |
| Timer               | Não tem                                                             |
| Resultado           | Tela `practiceResults` com % + lista de erros                       |
| Ações pós-resultado | "Repetir", "Estudar apenas erros", "Voltar"                         |
| Persistência DB     | `POST /api/study/session/finish` → `StudySession` + `StudyProgress` |

### 4.3 Test (Simulado)

| Regra            | Detalhe                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Interação        | Usuário seleciona resposta (RadioGroup)                                          |
| Lock             | Resposta trancada imediatamente                                                  |
| Feedback         | **Nenhum** durante o teste — só no resultado final                               |
| Scoring          | Atualiza `questionScores` (±1, range 0–5)                                        |
| Timer            | ≤25 questões → 22 min; >25 questões → 45 min                                     |
| Auto-finalizar   | Quando: todas respondidas OU timer = 0 OU clique em "Finalizar"                  |
| Nota de corte    | **70%** (pass/fail)                                                              |
| Não respondidas  | Contam como **incorretas**                                                       |
| Resultado        | Tela `results` com: percentual, breakdown por tópico, classificação, focus areas |
| Persistência DB  | `POST /api/study/session/finish` → `StudySession` + `StudyProgress`              |
| Histórico local  | Salvo em localStorage (max 30 entradas por módulo)                               |
| Saída antecipada | Se o usuário sair antes de finalizar, **nada é salvo**                           |

---

## 5. Algoritmos Internos

### 5.1 Embaralhamento de Opções (Fisher-Yates)

Cada questão tem suas opções embaralhadas no momento da construção do deck. O `correctAnswer` é remapeado para refletir a nova posição. Isso garante que a ordem das alternativas nunca corresponde ao JSON fonte.

### 5.2 Construção do Deck (`buildDeckForSections`)

1. Filtra seções selecionadas pelo usuário
2. Para cada questão: valida (id, stem, options), normaliza opções, embaralha
3. Retorna array plano de `Question[]`

### 5.3 Construtor de Simulado (`buildTestExamQuestions`)

Algoritmo balanceado por peso de seção e diversidade de tópicos:

1. **Pesos**: cada seção tem `weight` (default 1)
2. **Pools**: agrupa questões por `seção → tcTopicCode → Question[]`
3. **Alocação proporcional**: `ideal = (N × pesoSeção) / pesoTotal`
4. **Round-robin pick**: dentro de cada seção, pega 1 questão de cada tópico em rodízio
5. **Preenchimento global**: sobras de todas as seções preenchem vagas restantes
6. **Shuffle final** + cap em N questões

### 5.4 Round-Robin Pick

Garante distribuição equilibrada entre tópicos:

- Embaralha ordem dos tópicos
- Loop: tira 1 questão de cada tópico por vez
- Para quando atingir o count ou todos os pools estiverem vazios

### 5.5 Scoring de Questão

```
Score padrão: 3 (questão nunca vista)
Acerto: score = min(5, score + 1)
Erro:   score = max(0, score - 1)
```

### 5.6 Classificação de Tópico (Resultado do Test)

| Percentual | Classificação                     |
| ---------- | --------------------------------- |
| ≥ 80%      | **Strong** (Forte)                |
| 60–79%     | **Borderline** (Limítrofe)        |
| < 60%      | **Needs Study** (Precisa Estudar) |

Tópicos "Needs Study" são extraídos como **Focus Topics** — exibidos ao aluno como áreas prioritárias.

---

## 6. Gating por Plano (Limites de Uso)

### Fluxo no Mount

1. `getStudentState()` → fetch `/api/me/student`
2. Extrai `licenseEntitlements[licenseId]`
3. Computa caps via `planCaps(plan)`
4. Exibe limites na home screen

### Verificação no Início da Sessão

```
POST /api/study/session/start
→ Valida autenticação
→ Valida subscription (não expirada)
→ Valida entitlement (licença ativa)
→ Verifica uso no período (flashcards/dia, practice/dia, test/semana)
→ Cria StudySession no banco
→ Retorna { sessionId, allowedQuestionsTotal }
```

### Tabela de Limites por Plano

| Plano    | Flashcards/dia | Práticas/dia | Testes/semana | Logbook |
| -------- | -------------- | ------------ | ------------- | ------- |
| Basic    | 20             | 2            | 1             | ❌      |
| Standard | ∞              | ∞            | 3             | ❌      |
| Premium  | ∞              | ∞            | ∞             | ✅      |

---

## 7. Persistência de Dados

### 7.1 Backend (API)

| Endpoint                         | Momento          | Dados                                            |
| -------------------------------- | ---------------- | ------------------------------------------------ |
| `POST /api/study/session/start`  | Início de sessão | Cria `StudySession`                              |
| `POST /api/study/session/finish` | Fim de sessão    | Atualiza `StudySession` + upsert `StudyProgress` |

O `StudyProgress` é **cumulativo** (soma incremental a cada sessão):

- `questionsTotal`, `questionsCorrect`, `questionsIncorrect`
- `totalTimeSpentMs`, `lastStudiedAt`

### 7.2 localStorage

| Chave                                    | Escopo             | Reset        | Conteúdo                        |
| ---------------------------------------- | ------------------ | ------------ | ------------------------------- |
| `{moduleId}_questionScores_v2`           | Por módulo         | Nunca        | Score 0–5 por questionId        |
| `{moduleId}_testHistory_v1`              | Por módulo         | Nunca        | Histórico de simulados (max 30) |
| `{moduleId}_examCredits_v1`              | Por módulo         | Nunca        | Saldo de créditos (legado)      |
| `ameone_usage:{license}:{module}:{mode}` | Por licença+módulo | Daily/Weekly | Contador de sessões             |

---

## 8. Integração com Banco de Dados (Prisma)

### Models Relacionados

| Model                | Papel                                                               |
| -------------------- | ------------------------------------------------------------------- |
| `StudySession`       | Registro individual de cada sessão (score, tempo, questões)         |
| `StudyProgress`      | Progresso cumulativo por `userId + moduleKey + mode`                |
| `LicenseEntitlement` | Vínculo do usuário com cada licença                                 |
| `Plan`               | Definição de limites por tier (flashcards, practice, test, logbook) |

---

## 9. Páginas que Consomem o AdvancedEngine (8 instâncias)

| Rota                        | Módulo                         | LicenseId |
| --------------------------- | ------------------------------ | --------- |
| `/app/m/airframe`           | M – Airframe                   | `m`       |
| `/app/m/powerplant`         | M – Powerplant                 | `m`       |
| `/app/m/standard-practices` | M – Standard Practices         | `m`       |
| `/app/e/rating-avionics`    | E – Rating Avionics            | `e`       |
| `/app/e/standard-practices` | E – Standard Practices         | `e`       |
| `/app/s/rating-structures`  | S – Rating Structures          | `s`       |
| `/app/s/standard-practices` | S – Standard Practices         | `s`       |
| `/app/regs`                 | Regulations (CARs + Standards) | `regs`    |

**Padrão de uso em todas as páginas:**

```tsx
import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from "@/components/study/AdvancedEngine";
import metadata from "@data/.../metadata.json";
import q11 from "@data/.../11.json";

const sections = metadata.submodules[0].sets.map((set) => ({
  id: set.id,
  title: set.name,
  weight: set.weight ?? 1,
  questions: fileMap[set.file],
}));

<EntitlementGuard moduleKey="m.airframe">
  <AdvancedEngine
    licenseId="m"
    moduleId="airframe"
    moduleTitle="Airframe"
    sections={sections}
    defaultTestQuestionCount={50}
  />
</EntitlementGuard>;
```

---

## 10. Libs de Suporte

| Arquivo                                     | Responsabilidade                                                      |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/entitlementsClient.ts`             | Cache client-side de estado do aluno + verificação de acesso          |
| `src/lib/planEntitlements.ts`               | `planCaps()`, `experienceForPlan()` — traduz plano em limites         |
| `src/lib/studyAccess.ts`                    | `getSingleLicenseEntitlementSnapshot()` — contagem server-side de uso |
| `src/app/api/study/session/start/route.ts`  | Início de sessão (validação + criação)                                |
| `src/app/api/study/session/finish/route.ts` | Finalização de sessão (persist + progress upsert)                     |

---

## 11. Problemas Atuais e Dívida Técnica

| Problema                         | Severidade | Descrição                                                                           |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Componente monolítico            | Alta       | 2.258 linhas em um único arquivo — difícil de manter, testar e modificar            |
| Mix de lógica e UI               | Alta       | Algoritmos de deck-building, scoring, gating e renderização estão acoplados         |
| localStorage legado              | Média      | `questionScores` e `testHistory` ficam no client — podem ser perdidos ou burlados   |
| Sem testes                       | Alta       | Nenhum teste unitário ou de integração para os algoritmos críticos                  |
| State machine implícita          | Média      | O fluxo de telas é gerido por strings (`screenMode`) sem proteção de tipo/transição |
| Sem salvamento de estado parcial | Média      | Se o usuário fechar o browser durante um teste, a sessão é perdida                  |
| Créditos client-side             | Baixa      | Sistema de créditos legado em localStorage (já parcialmente migrado para DB)        |

---

## 12. Estratégia de Reaproveitamento pós-Refatoração

O AdvancedEngine contém **toda a lógica de domínio validada e funcional** do sistema de estudo. O objetivo da refatoração deve ser **preservar 100% das regras de negócio** enquanto reorganiza a arquitetura.

### 12.1 Decomposição Proposta

```
src/
  lib/
    study/
      types.ts              ← Tipos: Question, UserAnswer, DeckSection, etc.
      optionShuffle.ts      ← shuffleQuestionOptions() (Fisher-Yates)
      deckBuilder.ts        ← buildDeckForSections()
      examBuilder.ts        ← buildTestExamQuestions() + roundRobinPick()
      scoring.ts            ← applyAnswerToScore(), getQuestionScore()
      topicAnalysis.ts      ← calculateTopicBreakdown(), classifyTopic()
      timerLogic.ts         ← Lógica de timer (calcular duração, decremento)
      sessionManager.ts     ← Start/finish session (chamadas à API)
      usageTracker.ts       ← Tracking de uso (server-side via API)
      historyStorage.ts     ← Persistência de histórico de testes (localStorage)
      scoreStorage.ts       ← Persistência de questionScores (localStorage eventual → DB)

  hooks/
    study/
      useStudySession.ts    ← Hook: estado da sessão, answers, lock logic
      useStudyTimer.ts      ← Hook: countdown, auto-finalize
      useStudyGating.ts     ← Hook: verificar limites, entitlements
      useDeckBuilder.ts     ← Hook: construção do deck na seleção

  components/
    study/
      AdvancedEngine.tsx        ← Orquestrador (slim) — compõe hooks + sub-componentes
      StudyHomeScreen.tsx       ← Seleção de seções + modo
      QuizScreen.tsx            ← Renderização do quiz (compartilhado entre modos)
      FlashcardView.tsx         ← View de flashcard (sem interação)
      PracticeView.tsx          ← View de prática (com feedback imediato)
      TestView.tsx              ← View de teste (sem feedback, com timer)
      TestResultsScreen.tsx     ← Resultados do simulado (breakdown, chart)
      PracticeResultsScreen.tsx ← Resultados da prática (erros, ações)
      TopicBreakdownTable.tsx   ← Tabela de breakdown por tópico TC
      QuestionCard.tsx          ← Card de questão reutilizável
      TimerDisplay.tsx          ← Display do timer
```

### 12.2 Passos de Migração Recomendados

| Passo | Ação                                                                                  | Risco                                      |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1     | **Extrair tipos** para `lib/study/types.ts`                                           | Zero — sem mudança de comportamento        |
| 2     | **Extrair funções puras** (shuffle, deckBuilder, examBuilder, scoring, topicAnalysis) | Baixo — são funções sem side-effects       |
| 3     | **Escrever testes** para as funções extraídas                                         | Zero — garante paridade funcional          |
| 4     | **Extrair hooks** (useStudySession, useStudyTimer, useStudyGating)                    | Médio — refactor de state management       |
| 5     | **Quebrar UI em sub-componentes** (HomeScreen, QuizScreen, Results)                   | Médio — precisa manter fluxo de props      |
| 6     | **Reduzir AdvancedEngine a orquestrador** (~200–300 linhas)                           | Resultado: componente fino que compõe tudo |
| 7     | **Migrar questionScores e testHistory para backend** (opcional)                       | Alto — requer novas APIs + migration       |

### 12.3 Regras para Preservar (Contrato de Paridade)

Ao refatorar, estas regras **NÃO podem mudar**:

1. **Fisher-Yates shuffle** nas opções — a ordem nunca é previsível
2. **Round-robin pick** no exam builder — diversidade de tópicos garantida
3. **Timer**: ≤25q = 22min, >25q = 45min
4. **Pass mark**: 70%
5. **Classificação**: Strong ≥80%, Borderline 60–79%, Needs Study <60%
6. **Lock de resposta**: irreversível em practice e test
7. **Não respondidas** contam como incorretas no test
8. **autoFinishRef + savedResultRef**: guards contra duplicação
9. **Sessão perdida se sair** durante teste sem finalizar
10. **Flashcard não persiste** no backend
11. **questionScores**: incremento/decremento com clamp [0, 5], default 3
12. **Test history**: max 30 entradas, prepend (mais recente primeiro)
13. **Practice only incorrect**: filtra deck para questões erradas, re-entra em practice

### 12.4 Props Interface Preservada

A interface `AdvancedEngineProps` deve permanecer estável para as 8 páginas consumidoras. Após a refatoração, as pages importam o mesmo componente com as mesmas props — a decomposição é **transparente** para os consumidores.

```tsx
// Antes e depois — mesma interface:
<AdvancedEngine
  licenseId="m"
  moduleId="airframe"
  moduleTitle="Airframe"
  sections={sections}
  defaultTestQuestionCount={50}
/>
```

---

## 13. Diagrama de Dependências

```
                    ┌─────────────────────────┐
                    │   Page (ex: /app/m/...)  │
                    │  importa metadata.json   │
                    │  + question JSONs         │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   <EntitlementGuard>      │
                    │   Verifica acesso         │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   <AdvancedEngine>        │
                    │   Motor de estudo         │
                    └───┬───────┬──────┬───────┘
                        │       │      │
      ┌─────────────────┤       │      └─────────────────┐
      ▼                 ▼       ▼                        ▼
┌───────────┐   ┌───────────┐ ┌──────────────┐   ┌──────────────┐
│entitlements│  │planEntitle│ │/api/study/   │   │ localStorage │
│Client.ts   │  │ments.ts   │ │session/*     │   │ scores/hist  │
└─────┬──────┘  └───────────┘ └──────┬───────┘   └──────────────┘
      │                              │
      ▼                              ▼
┌───────────┐              ┌──────────────────┐
│/api/me/   │              │ Prisma           │
│student    │              │ StudySession     │
└───────────┘              │ StudyProgress    │
                           │ LicenseEntitle.  │
                           │ Plan             │
                           └──────────────────┘
```

---

## 14. Resumo Executivo

O **AdvancedEngine** é a peça mais crítica e complexa do sistema. Ele:

- **Encapsula toda a experiência de estudo** — os 3 modos, seleção de seções, sessão completa, resultados
- **É reutilizado por 8 páginas** sem nenhuma customização de lógica (apenas dados diferentes)
- **Contém algoritmos validados** de embaralhamento, amostragem balanceada e scoring
- **Já integra com backend** para gating, sessões e progresso cumulativo

A refatoração ideal **extrairá a lógica de domínio para módulos testáveis** e **quebrará a UI em sub-componentes**, mantendo o AdvancedEngine como orquestrador fino. A interface pública (props) permanece **idêntica**, garantindo que nenhuma page consumidora precise mudar.
