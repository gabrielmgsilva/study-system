# Lógica de Seleção de Perguntas

## Visão Geral

A seleção de perguntas no AME ONE é feita inteiramente no **cliente** (browser), dentro do componente `AdvancedEngine.tsx`. As questões são carregadas como **arquivos JSON estáticos** (`data/**/*.json`), importados estaticamente no build pelo Next.js, e a seleção/embaralhamento ocorre em memória a cada sessão de estudo.

---

## Origem dos Dados

### Estrutura dos Arquivos JSON

Cada módulo de estudo (ex: Powerplant, Airframe) possui:

```
data/m/powerplant/
├── metadata.json       # Estrutura do módulo: submodules → sets
├── 31.json             # Questões do set 31 (Seção TC correspondente)
├── 32.json
├── …
└── 42.json
```

**Exemplo de questão (`RawQuestion`):**
```json
{
  "id": "pp-31-001",
  "tcSectionCode": "PP31",
  "tcSectionTitle": "Reciprocating Engine Theory",
  "tcTopicCode": "PP31A",
  "tcTopicTitle": "Engine operating principles",
  "stem": "What is the correct firing order…",
  "options": [
    { "id": "A", "text": "1-3-4-2" },
    { "id": "B", "text": "1-2-3-4" },
    { "id": "C", "text": "1-4-2-3" },
    { "id": "D", "text": "1-3-2-4" }
  ],
  "correctOptionId": "A",
  "difficulty": 2,
  "explanation": { "correct": "…", "whyOthersAreWrong": {…} },
  "references": [{ "doc": "CAR 571", "area": "Engine Maintenance" }]
}
```

### Metadados do Módulo

O `metadata.json` mapeia as seções (`sets`) com seus pesos relativos e arquivos de questões:

```json
{
  "module": "m.powerplant",
  "moduleTitle": "Powerplant — M1/M2",
  "submodules": [{
    "id": "powerplant",
    "sets": [
      { "id": "PP31", "name": "Reciprocating Engine Theory", "file": "31.json", "weight": 3 },
      { "id": "PP32", "name": "Superchargers & Turbochargers", "file": "32.json", "weight": 2 },
      …
    ]
  }]
}
```

---

## Construção do Deck (Flashcard e Prática)

Função: `buildDeckForSections(sectionIdList)`

```
1. Para cada seção selecionada pelo usuário:
   a. Obtém o array de RawQuestion da seção
   b. Valida campos obrigatórios (id, stem, options)
   c. Converte options de array para Record<OptionKey, string>
   d. Aplica shuffleQuestionOptions() → embaralha A/B/C/D e ajusta a resposta correta
   e. Adiciona ao deck final

2. Retorna todas as questões concatenadas das seções selecionadas
```

**Embaralhamento de opções (`shuffleQuestionOptions`):**
- Cada questão tem suas opções embaralhadas aleatoriamente a cada deck construído.
- A `correctAnswer` é atualizada para refletir a nova posição da resposta correta.
- Isso garante que o usuário não memorize posição, apenas conteúdo.

---

## Construção do Deck de Teste (`buildTestExamQuestions`)

Para o modo **Teste**, a seleção segue um algoritmo mais sofisticado inspirado no formato do Transport Canada:

### Algoritmo (passo a passo)

```
Entrada: allQuestions[], selectedSectionIds[], totalQuestions (padrão: 50)

1. Calcular peso de cada seção selecionada
   sectionWeight[sid] = section.weight ?? 1
   totalWeight = soma de todos os pesos

2. Para cada seção, organizar questões em pools por tcTopicCode:
   perSectionTopicPools[sid][topicCode] = [questões deste tópico]
   (questões embaralhadas antes de entrar no pool)

3. Para cada seção, calcular target proporcional ao peso:
   target_s = round(totalQuestions × weight_s / totalWeight)
   
   Selecionar questões usando roundRobinPick(topicPools, target):
     → Itera pelos tópicos em ordem aleatória
     → Pega 1 questão de cada tópico por vez (round-robin)
     → Garante cobertura balanceada de todos os tópicos da seção

4. Se remaining > 0 (por arredondamento):
   → Agrega sobras de todas as seções em globalTopicPools
   → Aplica roundRobinPick para completar o total

5. Embaralha o resultado final
6. Retorna slice(0, maxQuestions)
```

### Função `roundRobinPick`

```typescript
function roundRobinPick<T>(pools: Record<string, T[]>, count: number): T[] {
  const keys = shuffleArray(Object.keys(pools)); // ordem aleatória de tópicos
  const out: T[] = [];
  
  while (out.length < count) {
    let progressed = false;
    for (const k of keys) {
      if (pool[k].length > 0) {
        out.push(pool[k].shift()); // remove e retorna o primeiro
        progressed = true;
        if (out.length >= count) break;
      }
    }
    if (!progressed) break; // sem mais questões
  }
  
  return out;
}
```

**Resultado:** Um teste de 50 questões com:
- Proporção de questões por seção respeitando os pesos definidos no `metadata.json`
- Dentro de cada seção, cobertura balanceada de todos os tópicos TC (por código `tcTopicCode`)
- Seleção aleatória dentro de cada tópico

---

## Seleção de Seções pelo Usuário

O usuário pode filtrar quais seções (sets) quer incluir no deck:

- Seleção múltipla via toggles na tela inicial do módulo
- Por padrão, a primeira seção é pré-selecionada
- Botão "Select All" seleciona todas as seções disponíveis
- O deck é construído apenas com as seções selecionadas

---

## Modos de Estudo e Seleção

| Modo | Construção do Deck | Total de Questões |
|---|---|---|
| **Flashcard** | `buildDeckForSections` | Todas as questões das seções selecionadas |
| **Prática** | `buildDeckForSections` | Todas as questões das seções selecionadas |
| **Teste** | `buildTestExamQuestions` | `defaultTestQuestionCount` (padrão: 50) |

No modo **Flashcard**, ao chegar na última questão, o deck recomeça do início (loop contínuo).

No modo **Prática**, ao terminar, o usuário vê a tela de resultados e pode optar por:
- Refazer todas as questões
- Praticar apenas as erradas (`handlePracticeOnlyIncorrect`)

No modo **Teste**, há um timer:
- ≤ 25 questões → 22 minutos
- > 25 questões → 45 minutos

---

## Timer e Auto-finalização

```typescript
// Auto-finaliza quando timer chega a zero
useEffect(() => {
  if (timeLeft <= 0) {
    setIsTimerRunning(false);
    setScreenMode('results');
  }
  // …
}, [isTimerRunning, timeLeft]);

// Auto-finaliza quando todas as questões foram respondidas (modo teste)
useEffect(() => {
  if (studyMode !== 'test') return;
  if (userAnswers.length < questions.length) return;
  if (autoFinishRef.current) return;
  autoFinishRef.current = true;
  finishTest();
}, [userAnswers.length, questions.length]);
```

O `autoFinishRef` e `savedResultRef` são refs (não estado) para garantir que a auto-finalização e o salvamento do histórico ocorram exatamente uma vez, sem problemas de stale state.

---

## Onde as Questões são Carregadas

As questões são **importadas estaticamente** nas páginas de módulo:

```typescript
// src/app/app/m/powerplant/page.tsx
import q31 from '../../../../../data/m/powerplant/31.json';
import q32 from '../../../../../data/m/powerplant/32.json';
// …

const fileMap: Record<string, RawQuestion[]> = {
  '31.json': q31 as RawQuestion[],
  // …
};
```

Isso significa que:
- Todas as questões são **bundled no JavaScript** do cliente no build
- Não há chamada de API para buscar questões em tempo de execução
- A seleção e shuffling são 100% client-side
- O servidor **não tem controle** sobre quais questões individuais são exibidas

**Recomendação sobre proteção das questões:** Para o modelo de negócio atual (plataforma de preparação para exames de mecânico de aeronaves), há duas abordagens viáveis:

**Abordagem A — Manter questões no bundle (status quo):**
- Aceitável se as questões são criadas pelo próprio produto e não reproduzem banco oficial de exames do TC.
- Vantagem: zero latência, funciona offline, simples de manter.
- O acesso ao conteúdo é protegido pela autenticação + entitlement — um usuário sem plano não vê as páginas.
- Desvantagem: usuário determinado com acesso pode extrair todas as questões.

**Abordagem B — Servir questões via API autenticada (recomendada para proteção máxima):**
- Remover os imports estáticos de JSON.
- Criar endpoint `GET /api/modules/[licenseId]/[moduleId]/questions` com verificação de entitlement no servidor.
- O servidor só entrega as questões se o usuário tiver a licença ativa.
- Desvantagem: latência adicional, sem suporte a offline, maior complexidade.

**Decisão:** Se o conteúdo das questões representar a principal propriedade intelectual do produto (e houver risco de cópia competitiva), migrar para a Abordagem B é recomendado. Caso contrário, a Abordagem A é suficiente dado que o valor do produto está na experiência de estudo (nivelamento, testes, logbook), não apenas nas questões brutas.
