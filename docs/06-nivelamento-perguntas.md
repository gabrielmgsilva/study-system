# Lógica de Nivelamento de Perguntas

## Visão Geral

O AME ONE implementa um sistema de **nivelamento por questão** baseado no histórico de acertos e erros do usuário, persistido localmente via `localStorage`. Cada questão possui um **score de 0 a 5** que reflete o domínio do usuário sobre aquela questão específica.

---

## Score por Questão (0–5)

### Definição

Cada questão tem um score individual armazenado como `QuestionScoreMap`:

```typescript
type QuestionScoreMap = Record<QuestionId, number>; // 0–5
```

| Score | Significado Implícito |
|---|---|
| 0 | Errou consistentemente — precisa estudar muito |
| 1–2 | Dificuldade alta |
| 3 | Neutro / novo (valor padrão) |
| 4 | Domínio médio |
| 5 | Domina a questão |

### Valor Inicial

Questões novas (nunca respondidas) começam com score **3** (neutro):

```typescript
function getQuestionScore(map: QuestionScoreMap, questionId: QuestionId): number {
  return map[questionId] ?? 3; // padrão: 3
}
```

### Atualização por Resposta

A cada resposta do usuário (em **Prática** ou **Teste**):

```typescript
function applyAnswerToScore(
  map: QuestionScoreMap,
  questionId: QuestionId,
  isCorrect: boolean,
): QuestionScoreMap {
  const current = map[questionId] ?? 3;
  const next = isCorrect
    ? Math.min(5, current + 1)  // acerto: +1, max 5
    : Math.max(0, current - 1); // erro:   -1, min 0
  return { ...map, [questionId]: next };
}
```

**Regras:**
- **Acerto** → score + 1 (máximo 5)
- **Erro** → score - 1 (mínimo 0)
- Incrementos lineares simples (não é um algoritmo de spaced repetition completo como SM-2)

---

## Persistência (localStorage)

Os scores são persistidos por módulo em `localStorage`:

```typescript
function getScoreStorageKey(moduleId: string) {
  return `${moduleId}_questionScores_v2`;
}
```

- **Carregamento:** ao iniciar o componente `AdvancedEngine` (`useEffect` de mount)
- **Salvamento:** cada vez que `questionScores` muda (`useEffect` de dependência)
- **Escopo:** por `moduleId` — scores do Powerplant são independentes do Airframe
- **Persistência:** entre sessões do browser (localStorage não expira automaticamente)

```typescript
// Carrega ao montar
useEffect(() => {
  setQuestionScores(loadQuestionScores(moduleId));
}, [moduleId]);

// Salva a cada mudança
useEffect(() => {
  saveQuestionScores(moduleId, questionScores);
}, [moduleId, questionScores]);
```

---

## Uso dos Scores na Interface

### Indicador Visual (QuestionScoreIndicator)

Durante o estudo, é exibido um indicador de nível para a questão atual:

```
Level 3/5
● ● ● ○ ○ ○   (3 bolinhas preenchidas de 6 possíveis, sendo 0 a 5)
```

```typescript
function QuestionScoreIndicator({ score }: { score: number }) {
  const max = 5;
  const levels = Array.from({ length: max + 1 }, (_, i) => i); // [0,1,2,3,4,5]
  return (
    <div>
      <span>Level {score}/5</span>
      <div>
        {levels.map((lvl) => (
          <div key={lvl}
            className={lvl <= score ? 'bg-white/80' : 'bg-transparent'}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Nivelamento por Tópico (Análise de Resultados)

Ao final de um **Teste**, o sistema calcula uma classificação por tópico TC:

### Função `calculateTopicBreakdown`

```typescript
function classifyTopic(percent: number) {
  if (percent >= 80) return 'Strong';     // domínio forte
  if (percent >= 60) return 'Borderline'; // na fronteira
  return 'Needs Study';                    // precisa estudar
}
```

O resultado por tópico inclui:
- `topicCode` e `topicTitle` (código TC, ex: "PP31A")
- `sectionCode` e `sectionTitle`
- `total` questões do tópico no teste
- `correct` acertos
- `percent` de acerto
- `classification`: Strong | Borderline | Needs Study

### Uso pós-teste

Os tópicos classificados como `"Needs Study"` são salvos no histórico do teste:

```typescript
const focusTopics = topicRows
  .filter((r) => r.classification === 'Needs Study')
  .map((r) => r.topicCode);

const entry: TestHistoryEntry = {
  ts: Date.now(),
  total,
  correct,
  percentage,
  passMark: 70,
  pass: percentage >= 70,
  focusTopics, // ← tópicos que precisam de revisão
};
```

Esse histórico é persistido em localStorage com a chave `${moduleId}_testHistory_v1`.

---

## Modo "Praticar Apenas Erros"

Após uma sessão de **Prática**, o usuário pode escolher praticar apenas as questões que errou:

```typescript
const handlePracticeOnlyIncorrect = () => {
  const incorrectIds = userAnswers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);

  const incorrectQuestions = questions.filter((q) =>
    incorrectIds.includes(q.id),
  );

  if (incorrectQuestions.length === 0) {
    handleRestartCurrentMode(); // todos acertaram → reinicia normal
    return;
  }

  // Reinicia sessão apenas com as questões erradas
  setQuestions(incorrectQuestions);
  setCurrentQuestionIndex(0);
  setUserAnswers([]);
  setLockedQuestions({});
  setScreenMode('quiz');
};
```

---

## Fluxo Completo de Nivelamento

```
Usuário responde questão
         ↓
handleAnswerSelect(value)
         ↓
isCorrect = (value === correctAnswer)
         ↓
applyAnswerToScore(questionScores, questionId, isCorrect)
  → score += 1 (acerto) ou score -= 1 (erro)
  → clampado em [0, 5]
         ↓
setQuestionScores(novo mapa) → useEffect → salva em localStorage
         ↓
(visual) QuestionScoreIndicator atualizado na próxima questão
         ↓
(ao final do teste) calculateTopicBreakdown()
  → % por tópico TC
  → Strong / Borderline / Needs Study
         ↓
saveTestHistory() → localStorage
```

---

## Limitações do Sistema Atual

| Limitação | Descrição |
|---|---|
| **Client-only** | Scores ficam apenas no localStorage do browser. Trocar de dispositivo ou limpar o cache apaga o histórico. |
| **Sem spaced repetition** | O algoritmo atual é linear (+1/-1). Não implementa Leitner, SM-2 ou FSRS. Questões com score 5 aparecem com a mesma frequência que questões com score 0. |
| **Sem priorização no deck** | Os scores existem e são exibidos, mas não influenciam a ordem de seleção das questões no deck de flashcard/prática. A seleção é aleatória independentemente do score. |
| **Sem sincronização com servidor** | Todo o nivelamento é local. Não há endpoint para persistir ou consultar scores no banco de dados. |

---

## Potencial de Evolução

Para um sistema de nivelamento mais sofisticado, as melhorias mais impactantes seriam:

1. **Persistir scores no servidor** (endpoint `PATCH /api/me/question-scores`) — permitiria multi-device e analytics.

2. **Priorizar questões de baixo score no deck** — modificar `buildDeckForSections` para dar maior probabilidade a questões com score ≤ 2:
   ```typescript
   // Ideia: weight por score inverso
   const weight = (6 - score); // score 0 → peso 6; score 5 → peso 1
   ```

3. **Implementar SM-2 / FSRS** — algoritmos de espaçamento de repetição que calculam o próximo intervalo de revisão baseado no grau de acerto, tornando o estudo muito mais eficiente.

4. **Deck adaptativo** — substituir seleção puramente aleatória por seleção ponderada pelos scores, focando automaticamente nos pontos fracos do aluno.
