# AME ONE — Business Rules Specification

> **Purpose**: Canonical reference for recreating the AME ONE study system's business logic in a new codebase.
> Each section is self-contained, incremental, and designed for a developer who has never seen the original code.

---

## Table of Contents

1. [Domain Glossary](#1-domain-glossary)
2. [License & Module Structure](#2-license--module-structure)
3. [Plan Tiers & Experience Mapping](#3-plan-tiers--experience-mapping)
4. [Usage Caps & Enforcement](#4-usage-caps--enforcement)
5. [Credit System](#5-credit-system)
6. [Question Data Model](#6-question-data-model)
7. [Deck & Section Structure](#7-deck--section-structure)
8. [Study Modes](#8-study-modes)
   - 8.1 Flashcard Mode
   - 8.2 Practice Mode
   - 8.3 Test Mode
9. [Test Exam Builder (TC-style)](#9-test-exam-builder-tc-style)
10. [Scoring & Spaced Repetition](#10-scoring--spaced-repetition)
11. [Test Results & History](#11-test-results--history)
12. [Access Control Hierarchy](#12-access-control-hierarchy)
13. [Module Feature Flags](#13-module-feature-flags)
14. [User Registration & Onboarding](#14-user-registration--onboarding)
15. [Authentication & Sessions](#15-authentication--sessions)
16. [Entitlement Grant (Legacy)](#16-entitlement-grant-legacy)
17. [Question Lookup API](#17-question-lookup-api)
18. [Database Schema (Reference)](#18-database-schema-reference)
19. [AdvancedEngine — Complete Study Engine Logic](#19-advancedengine--complete-study-engine-logic)

---

## 1. Domain Glossary

| Term | Definition |
|---|---|
| **License** | A product sold to the user. Maps to a Transport Canada AME licence type: M, E, S, Balloons, or Regs. |
| **Module** | A study area within a license (e.g. "airframe" within M, "rating-avionics" within E). |
| **Plan Tier** | The subscription level for a given license: `basic`, `standard`, or `premium`. |
| **Entitlement** | A record that a user has access to a specific module (legacy per-module model). |
| **License Entitlement** | A record that a user owns a plan tier for a given license (current model). |
| **Section / DeckSection** | A grouping of questions within a module (e.g. "11 – Basic Aerodynamics"). Each section has a weight for exam balancing. |
| **Credit** | Virtual currency used to start Test mode sessions. |
| **TC** | Transport Canada — the regulatory authority. The study system mirrors TC exam structure. |
| **Experience** | The set of access levels (flashcard, practice, test, logbook) derived from a plan tier. |

---

## 2. License & Module Structure

The system is organized in a **two-level hierarchy**: License → Module.

### Licenses (5 total)

| License ID | Name | Description |
|---|---|---|
| `m` | Mechanical (M) | AME M licence — airframe, powerplant, standard practices |
| `e` | Avionics (E) | AME E licence — avionics systems, standard practices |
| `s` | Structures (S) | AME S licence — structural repairs, standard practices |
| `balloons` | Balloons | Balloon-specific regulations and study |
| `regs` | Regulations | Global regulatory requirements (CARs & Standards) |

### Modules per License

| License | Modules |
|---|---|
| `m` | `hub`, `standard-practices`, `airframe`, `powerplant`, `logbook` |
| `e` | `hub`, `standard-practices`, `rating-avionics`, `logbook` |
| `s` | `hub`, `standard-practices`, `rating-structures`, `logbook` |
| `balloons` | `hub`, `bregs`, `logbook` |
| `regs` | `core`, `cars`, `standards` |

### Module Key Format

Module keys use dotted notation: `{licenseId}.{moduleId}` — e.g. `m.airframe`, `e.rating-avionics`, `regs.core`.

**Normalization rules** (applied everywhere):
- Lowercase
- Underscores → hyphens
- Trim whitespace

### Data Directory Layout

```
data/
  m/
    airframe/          # Questions per section (11.json, 12.json, ...)
    powerplant/        # Questions per section (31.json, 32.json, ...)
    standard_practices/ # Questions per section (1.json, 2.json, ...)
    airframe/metadata.json
  e/
    e-rating/          # Avionics questions (24.json, 25.json, ...)
    standardpractices/ # Standard practices questions
    metadata.json
  s/
    s-rating/          # Structures questions
    standardpractices/ # Standard practices questions
    metadata.json
  regs/
    CARs.json          # All CARs questions in one file
    Standards.json     # All Standards questions in one file
    metadata.json
  balloons/
    ...
```

Each module has a **metadata.json** that defines:
- Module name and description
- List of submodules
- For each submodule: sets (sections) with `id`, `name`, `shortTitle`, `subtitle`, `file`, `weight`, and `topics`

---

## 3. Plan Tiers & Experience Mapping

Each license a user owns has an associated **plan tier** that determines the user's experience (access levels).

### Experience Derivation (central mapping)

```
experienceForPlan(plan) → { flashcards, practice, test, logbook }
```

| Plan | Flashcards | Practice | Test | Logbook |
|---|---|---|---|---|
| **basic** | `daily_limit` | `cooldown` | `weekly_limit` | `false` |
| **standard** | `unlimited` | `unlimited` | `weekly_limit` | `false` |
| **premium** | `unlimited` | `unlimited` | `unlimited` | `true` |

### Numeric Rate Caps

```
planCaps(plan) → { flashcardsPerDay, practicePerDay, testsPerWeek }
```

| Plan | Flashcards/day | Practice/day | Tests/week |
|---|---|---|---|
| **basic** | 20 | 2 | 1 |
| **standard** | ∞ | ∞ | 3 |
| **premium** | ∞ | ∞ | ∞ |

### Key Design Decisions

- The backend stores only the plan tier + access type enums per license.
- Numeric caps are computed **client-side** from the plan tier (no stored counters in database).
- This is an **MVP design**: simple, no race conditions to manage, easily upgradable later.

---

## 4. Usage Caps & Enforcement

Usage tracking is performed **client-side** using `localStorage`.

### Storage Key Format

```
ameone_usage:{licenseId}:{moduleId}:{kind}
```

Where `kind` is `flashcards`, `practice`, or `test`.

### Stored Value Structure

```json
{ "key": "2026-03-24", "count": 5 }
```

- For flashcards and practice: `key` = today's date (`YYYY-MM-DD`). Resets daily.
- For tests: `key` = ISO week (`YYYY-Wnn`). Resets weekly.

### Enforcement Logic (on session start)

1. Read current usage from localStorage.
2. Compare with `planCaps(plan).*` value.
3. If at or over cap → **block** the session with an alert.
4. If under cap → **consume**:
   - Flashcard: consume `min(deckSize, remaining)` (at least 1).
   - Practice: consume 1 session.
   - Test: consume 1 session.
5. Write updated count to localStorage.

### Important: Counter Not Refundable

Once a usage unit is consumed (localStorage written), it is not returned even if the user does not complete the session.

---

## 5. Credit System

Credits are a **virtual currency** for Test mode. This is a **legacy system** retained for compatibility but not the primary access gate.

### Database Model

- **CreditAccount**: One per user. Stores `balance` (integer).
- **CreditLedger**: Append-only audit log. Each row has `delta` (signed int) and `reason`.

### Welcome Credits

On registration, every user receives **10 welcome credits**.

### Usage

- Starting a Test mode session costs **1 credit** (configurable per module via `examCost` prop).
- Practice and Flashcard modes are **always free**.
- Credits are deducted atomically (transaction) from `CreditAccount` + ledger entry.

### Current Implementation Note

In the current MVP, client-side credits are also tracked in `localStorage` per module (separate from the database credits). The module-level localStorage credits have a developer "Add 5 credits" button for testing.

### Grant Flow (API)

```
POST /api/entitlements/grant
Body: { moduleKey: "m.airframe" }
```

1. Verify auth session.
2. Check `CreditAccount.balance >= 1`.
3. Check the module is not already granted.
4. Atomic transaction: create/update Entitlement (granted=true) + decrement balance by 1 + create ledger entry.
5. Return updated credits + entitlements list.

---

## 6. Question Data Model

### RawQuestion (JSON file format)

```typescript
{
  id: string;               // Unique ID, e.g. "REGS-110-001", "AV-241-002"
  ratingCode?: string;       // License code: "M", "E", "S", "GLOBAL"
  examCode?: string;         // Exam identifier: "REGS", "AV", etc.

  // TC exam structure codes (for section/topic-based balancing)
  tcSectionCode?: string;    // e.g. "1.0", "24.0"
  tcSectionTitle?: string;   // e.g. "General Provisions – Interpretation"
  tcTopicCode?: string;      // e.g. "1.1", "24.1"
  tcTopicTitle?: string;     // e.g. "Interpretation and Definitions"

  topicPath?: { code: string; title: string }[];  // Breadcrumb path

  questionType?: "single_choice";  // Currently only single_choice
  stem: string;                     // Question text

  options: { id: "A" | "B" | "C" | "D"; text: string }[];  // Exactly 4 options
  correctOptionId: "A" | "B" | "C" | "D";

  references?: {
    doc?: string;     // Source document
    area?: string;    // Subject area
    topic?: string;   // Reference topic
    locator?: string; // Locator string
    note?: string;    // Additional note
  }[];

  explanation?: {
    correct?: string;  // Why the correct answer is correct
    whyOthersAreWrong?: Partial<Record<"A"|"B"|"C"|"D", string>>;
  };

  difficulty?: number;          // Difficulty level (typically 1–5)
  tags?: string[];              // Optional tags
  status?: "draft" | "validated" | "published";
  version?: number;             // Schema version
}
```

### ID Convention

Question IDs follow the pattern: `{EXAM}-{SECTION}{TOPIC}-{SEQ}` — e.g. `REGS-110-001` = Regs section 1.0, topic 1.0/1.1, question #001.

### Language

Questions may be in English or Portuguese depending on the module.

### Alternate Format (Legacy)

The `question-by-id` API also supports a legacy format with:
- `qid` instead of `id`
- `question` instead of `stem`
- `options` as a flat string array instead of `{ id, text }[]`
- `correctAnswer` as a 0-based or 1-based index

---

## 7. Deck & Section Structure

### DeckSection

```typescript
{
  id: string;             // Unique section ID, e.g. "af11", "r01"
  title: string;          // Full title, e.g. "11 – Basic Aerodynamics"
  shortTitle?: string;    // Abbreviated title, e.g. "11"
  subtitle?: string;      // Description text

  topics?: string[];      // Preview list of topics covered (up to 4 shown in UI)

  weight?: number;        // Section weight for test exam balancing (default: 1)
  questions: RawQuestion[];
}
```

### Metadata Structure

Each module's `metadata.json` defines submodules → sets:

```json
{
  "module": "airframe",
  "moduleTitle": "Airframe – M",
  "moduleDescription": "...",
  "submodules": [
    {
      "id": "airframe_m",
      "name": "Airframe – M",
      "sets": [
        {
          "id": "af11",
          "name": "11 – Basic Aerodynamics",
          "shortTitle": "11",
          "subtitle": "Theory of flight basics...",
          "file": "11.json",
          "weight": 1,
          "topics": ["Fixed-wing aircraft...", "The atmosphere...", "Aerodynamic lift..."]
        }
      ]
    }
  ]
}
```

### Deck Building

1. User selects one or more sections on the home screen.
2. System loads all questions from selected sections.
3. Options within each question are **shuffled** (randomized A/B/C/D positions, correct answer remapped).
4. For Flashcard/Practice: the full deck is used.
5. For Test: a subset is built using the TC-style exam builder (see Section 9).

---

## 8. Study Modes

### 8.1 Flashcard Mode

- **Purpose**: Self-paced review. No grading, no timer.
- **Behavior**:
  - User sees question stem + options.
  - Selects an answer (not locked — can change freely).
  - No immediate feedback on correctness.
  - Can navigate forward/backward freely.
  - At the end of the deck, **wraps around** to question 1 (infinite loop).
  - No results screen.
- **Plan gating**: Subject to `flashcardsPerDay` cap.
- **Credits**: Free (no credit cost).
- **Score tracking**: Does NOT update question scores.

### 8.2 Practice Mode

- **Purpose**: Active learning with immediate feedback.
- **Behavior**:
  - User sees question stem + options.
  - Selects an answer → answer is **locked** immediately.
  - Immediate feedback is shown: correct/incorrect + explanation.
  - Question score is updated per spaced-repetition algorithm (see Section 10).
  - Navigating forward/backward is allowed (but locked questions remain locked).
  - At end of deck → **Practice Results** screen showing score summary.
  - Option to "Practice only incorrect" or restart.
- **Plan gating**: Subject to `practicePerDay` cap (counts sessions, not questions).
- **Credits**: Free.

### 8.3 Test Mode

- **Purpose**: Simulate a timed TC-style exam.
- **Behavior**:
  - Questions are selected using the TC-style exam builder (weighted, balanced).
  - Default question count: **50** (configurable per module via `defaultTestQuestionCount`).
  - **Timer starts automatically**:
    - > 25 questions: **45 minutes** (2700 seconds)
    - ≤ 25 questions: **22 minutes** (1320 seconds)
  - User selects an answer → answer is **locked** immediately.
  - **No immediate feedback** (no correct/incorrect shown during test).
  - Question score is updated on answer selection.
  - Navigation: forward & backward allowed (but locked questions stay locked).
  - **Auto-finalize**: When all questions are answered, test ends automatically.
  - **Timer expiry**: When timer hits 0, test ends automatically.
  - **Unanswered questions count as INCORRECT** in scoring.
  - Results screen shows detailed TC-style topic breakdown.
- **Plan gating**: Subject to `testsPerWeek` cap.
- **Credits**: Costs `examCost` credits (default: 1). Blocked if insufficient credits.

### Mode Selection Order of Checks

When starting any session:

1. Validate sections exist and have questions.
2. Check plan-based usage cap → block if exceeded.
3. (Test only) Check credit balance → block if insufficient.
4. (Test only) Deduct `examCost` credits.
5. Build the question deck.
6. Start the session.

---

## 9. Test Exam Builder (TC-style)

The test builder creates a balanced subset of questions that mirrors Transport Canada's exam weighting.

### Algorithm: `buildTestExamQuestions(allQs, selectedSectionIds, totalQuestions)`

1. **Calculate section weights**:
   - Each selected section has a `weight` (default: 1).
   - `totalWeight = sum of all selected section weights`.

2. **Build pools per section → per topic**:
   - Group all questions by `sectionId`.
   - Within each section, group by `tcTopicCode` (fall back to `SECTION:{sectionId}`).
   - Shuffle questions within each topic pool.

3. **Allocate per section** (weighted):
   - For each section: `target = round((totalQuestions × sectionWeight) / totalWeight)`.
   - Capped by available questions and remaining quota.
   - Use **round-robin pick** across topic pools within each section.

4. **Fill remainder (global round-robin)**:
   - If any quota remains after all sections, collect leftover questions.
   - Group globally by `tcTopicCode`.
   - Round-robin pick to fill remaining quota.

5. **Final shuffle**: The selected set is shuffled to randomize question order.

6. **Cap**: Total never exceeds `min(totalQuestions, allQs.length)`.

### Round-Robin Pick Algorithm

```
Input: pools = { topicKey: Question[] }, count
Output: ordered list of Question[]

1. Shuffle topic keys.
2. Iterate through keys in order, taking 1 question per key per pass.
3. Repeat passes until `count` questions are taken or all pools are exhausted.
```

This ensures **even topic distribution** — no single topic dominates the exam.

---

## 10. Scoring & Spaced Repetition

### Question Score (0–5 scale)

Each question has an associated score stored in `localStorage`.

- **Default score**: 3 (for unseen questions).
- **Correct answer**: `score = min(5, score + 1)`.
- **Incorrect answer**: `score = max(0, score - 1)`.

### Storage

```
localStorage key: {moduleId}_questionScores_v2
Value: JSON object { [questionId]: number }
```

### Score Indicator (UI)

Displayed as a level meter (6 dots, 0–5). Shows current question's score in practice mode.

### Usage

Scores are updated in **Practice** and **Test** modes only. Flashcard mode does not update scores.

---

## 11. Test Results & History

### Score Calculation

```typescript
total     = questions.length
answered  = userAnswers.length
correct   = userAnswers.filter(a => a.isCorrect).length
incorrect = answered - correct
unanswered = total - answered    // count as incorrect
percentage = round((correct / total) * 100)
```

### Pass Mark

- Fixed at **70%**.
- `pass = percentage >= 70`.

### Topic Breakdown (TC-style report)

For each answered question with a `tcTopicCode`:
- Group by topic code.
- Calculate `percent = round((correct / total) × 100)` per topic.
- Classify:
  - ≥ 80%: **"Strong"**
  - ≥ 60%: **"Borderline"**
  - < 60%: **"Needs Study"**
- Sort by: section code → topic code → percentage.

### Test History (localStorage)

```
localStorage key: {moduleId}_testHistory_v1
Value: JSON array of TestHistoryEntry (max 30 entries, newest first)
```

```typescript
type TestHistoryEntry = {
  ts: number;           // Unix timestamp (ms)
  total: number;
  correct: number;
  answered: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  passMark: number;     // Always 70
  pass: boolean;
  focusTopics: string[]; // Topic codes with "Needs Study" classification
};
```

### Post-test Actions

- **Restart**: Start a new test with a fresh weighted question set (costs another credit).
- **Practice only incorrect**: Creates a practice deck with only the incorrectly answered questions.
- **Go home**: Return to module home.

---

## 12. Access Control Hierarchy

Access is checked in a **layered** manner.

### Layer 1: Module Feature Flags

Checked first. If a license or module has status `coming_soon` or `maintenance`, access is **blocked** regardless of user entitlements.

Priority: `maintenance` > `coming_soon` > `active`.

### Layer 2: License Entitlement (Primary Model)

A user can access a module if they **own a plan for the parent license**.

```
canAccessModule(state, "m.airframe"):
  1. Parse: license="m", module="airframe"
  2. Check: state.licenseEntitlements["m"] exists?
  3. YES → access granted (any plan gives access to non-logbook modules)
```

**Exception: Logbook** — requires `logbook: true` in the license experience (only `premium` plan).

### Layer 3: Legacy Module Entitlement (Deprecated)

Individual `Entitlement` records per module key. Checked as fallback but the primary model is license-based.

### Guard Components

| Component | Scope | Description |
|---|---|---|
| `EntitlementGuard` | Page-level | Wraps page content. Checks flags + license access. Shows locked/maintenance UI if denied. |
| `ModuleGate` | Component-level | Similar to EntitlementGuard but at component granularity. |
| `middleware.ts` | Route-level | Server-side middleware for route protection (auth check). |

### Module Key Normalization

All module keys are normalized before comparison:
- `toLowerCase()`
- `replace(/_/g, '-')`
- `trim()`

Example: `"M.Standard_Practices"` → `"m.standard-practices"`.

---

## 13. Module Feature Flags

### Structure

Two-level flags: license-level and module-level.

```typescript
type ModuleStatus = 'active' | 'coming_soon' | 'maintenance';
type Flag = { status: ModuleStatus; message?: string };
```

### Current Flag Configuration

All licenses and modules are currently **active**.

### Resolution Logic

```
getEffectiveFlag(license, module?):
  1. Check license flag.
  2. If not active → return license flag (blocks all modules).
  3. If module specified → return module flag.
  4. If no module → return license flag.
```

### Default

Any unlisted license/module defaults to `{ status: 'coming_soon', message: 'Coming soon.' }`.

---

## 14. User Registration & Onboarding

### Registration Flow

```
POST /api/auth/register
Body: { email, username?, password }
```

1. Normalize email to lowercase + trim.
2. Check for existing user by email → 409 if duplicate.
3. Hash password with bcrypt.
4. Create user + associated records in a single Prisma create:
   - `CreditAccount` with **balance: 10** (welcome credits).
   - `CreditLedger` entry: `+10`, reason: `"Welcome credits"`.
   - `LicenseEntitlement` for ALL 5 licenses with **plan: basic**:
     - `regs`, `m`, `e`, `s`, `balloons` — all basic.
5. Sign a JWT auth token (12h expiry).
6. Set the `ameone_token` httpOnly cookie.

### Key Onboarding Rules

- Every new user starts with **basic plan** for all licenses.
- Every new user gets **10 credits**.
- No email verification required for registration (currently).
- No stripe/payment integration for plan upgrades (future).

---

## 15. Authentication

### Auth Token Model

- **Cookie name**: `ameone_token`
- **Cookie value**: JWT signed with HS256
- **Expiry**: 12 hours from creation
- **Flags**: `httpOnly`, `secure` (production), `sameSite: 'lax'`, `path: '/'`

### Session Verification

1. Extract the JWT from the `ameone_token` cookie.
2. Verify the JWT signature with HS256 using `AUTH_SECRET`.
3. Validate claims such as `sub`, `email`, `role`, and `exp`.
4. Treat the request as authenticated when the token is valid and not expired.
5. Use the token payload directly in guards and middleware without a session table lookup.

### Password Handling

- **Hashing**: bcrypt (via bcryptjs).
- **Legacy migration**: Old passwords hashed with PBKDF2 are transparently re-hashed to bcrypt on successful login.
- **Detection**: `needsRehash(hash)` checks for the legacy `pbkdf2$...` prefix. When present, the password is re-hashed with bcrypt after a successful login.

### Password Reset

1. `POST /api/auth/forgot-password` → generates a random 32-byte hex token, stored in `PasswordResetToken` with 30-minute expiry.
2. Email sent via Resend with reset link.
3. `POST /api/auth/reset-password` → verifies token, updates password hash, marks token as used.

---

## 16. Entitlement Grant (Legacy)

This is the per-module unlock system using credits. Mostly superseded by the license-plan model but still functional.

### API

```
POST /api/entitlements/grant
Body: { moduleKey: "m.airframe" }
```

### Flow

1. Verify the auth token.
2. Normalize module key.
3. Check `CreditAccount.balance >= 1` → 402 if insufficient.
4. Check existing entitlement → 409 if already granted.
5. Atomic transaction:
   - Upsert `Entitlement` (granted: true).
   - Decrement `CreditAccount.balance` by 1.
   - Create `CreditLedger` entry (delta: -1, reason: "Unlock {key}").
6. Return updated credits + entitlements list.

---

## 17. Question Lookup API

### Endpoint

```
GET /api/question-by-id?id={questionId}
```

### Behavior

1. Build index by scanning all JSON files recursively under `data/`.
2. Cache index for 10 minutes.
3. Normalize requested ID (trim + uppercase).
4. Lookup in index → return normalized question or 404.

### Normalized Output

```typescript
{
  qid: string;
  examCode?: string;
  topicCode?: string;
  topicTitle?: string;
  question: string;         // stem text
  options: { A, B, C, D };  // always object form
  correctAnswer: "A"|"B"|"C"|"D";
  reference?: string;
  explanation?: string;
  source?: string;
  category?: string;
}
```

---

## 18. Database Schema (Reference)

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `user`, `admin` |
| `PlanTier` | `basic`, `standard`, `premium` |
| `FlashcardsAccess` | `daily_limit`, `unlimited` |
| `PracticeAccess` | `cooldown`, `unlimited` |
| `TestAccess` | `weekly_limit`, `unlimited` |
| `StudyMode` | `flashcard`, `practice`, `test` |
| `TestStatus` | `in_progress`, `completed`, `canceled`, `expired` |
| `QuestionType` | `single_choice` |
| `QuestionStatus` | `draft`, `review`, `published`, `archived` |
| `ContentLocale` | `en`, `pt` |

### Models Summary

| Model | Purpose | Key Fields |
|---|---|---|
| `User` | User account | email, username, passwordHash, role, lastPasswordChangeAt |
| `PasswordResetToken` | Password reset | userId, token (unique), expiresAt, usedAt |
| `CreditAccount` | User credit balance | userId (unique), balance |
| `CreditLedger` | Credit audit log | userId, delta, reason |
| `Entitlement` | Per-module access (legacy) | userId+moduleKey (unique), granted, grantedAt |
| `LicenseEntitlement` | Per-license plan & experience | userId+licenseId (unique), plan, flashcards, practice, test, logbook |
| `License` | Normalized study license | id, name, displayOrder, isActive |
| `Module` | Normalized module under a license | licenseId, slug, moduleKey, name |
| `Subject` | Subject area inside a module | moduleId, code, name, weight |
| `Topic` | Topic inside a subject | subjectId, code, name |
| `Question` | Normalized question record | externalId, topicId, locale, stem, status |
| `QuestionOption` | Question choice option | questionId, optionKey, text, isCorrect |
| `QuestionExplanation` | Canonical answer explanation | questionId, correctExplanation |
| `QuestionOptionExplanation` | Per-option rationale | questionOptionId, explanation |
| `QuestionReference` | Regulatory/source reference | questionId, document, locator, note |
| `PlanModuleLimit` | Plan limits by license/module | planTier, licenseId, moduleId, flashcardsPerDay |
| `StudyProgress` | Aggregate study stats | userId+moduleKey+mode (unique), questionsTotal/Correct/Incorrect, totalTimeSpentMs |
| `StudySession` | Individual study session log | userId, moduleKey, mode, startedAt, finishedAt, score, details (JSON) |
| `UserStreak` | Gamification streak | userId (unique), currentStreak, longestStreak, lastActiveDate, totalXp |
| `PracticeState` | Resumable practice session | userId+moduleKey (unique), questionIds (JSON), answers (JSON), expiresAt |
| `TestAttempt` | Resumable test session | userId, moduleKey, status, questionIds (JSON), answers (JSON), score, timeSpentMs |

### Notes on Unused/Planned Models

The following models exist in the schema but have **no active API routes** in the current codebase. They are designed for future server-side persistence:

- `StudyProgress` — Planned aggregate counter per user/module/mode.
- `StudySession` — Planned individual session log (currently only localStorage).
- `UserStreak` — Planned gamification (streak + XP).
- `PracticeState` — Planned server-side practice resumption.
- `TestAttempt` — Planned server-side test state persistence.

---

## 19. AdvancedEngine — Complete Study Engine Logic

This section documents the full internal logic of the `AdvancedEngine` component — the single React component that powers all three study modes (flashcard, practice, test) across every module page.

### 19.1 Component Interface

```typescript
interface AdvancedEngineProps {
  moduleId: string;              // Unique module identifier
  moduleTitle: string;           // Display title
  moduleDescription: string;     // Description shown on home screen
  sections: DeckSection[];       // All available sections with questions

  licenseId?: 'm' | 'e' | 's' | 'balloons' | 'regs';  // For plan-based gating
  backHref?: string;             // Custom back navigation URL

  enableCredits?: boolean;       // Enable credit system (default: true)
  examCost?: number;             // Credits per test (default: 1)
  defaultTestQuestionCount?: number;  // Target question count for tests (default: 50)
}
```

### 19.2 Internal Types

```typescript
type OptionKey = 'A' | 'B' | 'C' | 'D';

// Internal question (post-normalization, post-shuffle)
interface Question {
  id: string;
  sectionId: string;
  stem: string;
  options: Record<OptionKey, string>;   // { A: "text", B: "text", ... }
  correctAnswer: OptionKey;              // Remapped after shuffle

  tcSectionCode?: string;
  tcSectionTitle?: string;
  tcTopicCode?: string;
  tcTopicTitle?: string;
  topicPath?: { code: string; title: string }[];

  references?: RawQuestion['references'];
  explanation?: RawQuestion['explanation'];
  difficulty?: number;
  tags?: string[];
}

interface UserAnswer {
  questionId: string;
  selectedAnswer: OptionKey;
  isCorrect: boolean;
  tcSectionCode?: string;
  tcTopicCode?: string;
}

type QuestionScoreMap = Record<string, number>;  // questionId → 0–5
```

### 19.3 Screen Flow (State Machine)

The engine has 5 screen modes:

```
home ──→ quiz ──→ results          (test mode)
home ──→ quiz ──→ practiceResults  (practice mode)
home ──→ quiz ──→ quiz (loop)      (flashcard mode: wraps to index 0)
home ──→ account                   (credit management)
```

| Screen | Description |
|---|---|
| `home` | Section selection + study mode selection |
| `quiz` | Active study session (all modes) |
| `results` | Test mode final results with TC-style breakdown |
| `practiceResults` | Practice mode summary |
| `account` | Credit balance view + dev top-up |

### 19.4 Option Shuffling

Every question's options are **shuffled** when the deck is built (not on re-render).

**Algorithm: `shuffleQuestionOptions(question)`**

1. Extract options as `[OptionKey, text][]` pairs: `[["A","text1"], ["B","text2"], ...]`.
2. Fisher-Yates shuffle the array.
3. Reassign to new fixed keys `['A','B','C','D']` in shuffled order.
4. Update `correctAnswer` to the new key where the original correct text landed.

**Result**: The user never sees options in the same order as the JSON source. The correct answer is transparently remapped.

### 19.5 Deck Building

**`buildDeckForSections(sectionIdList)`**:

1. If no sections selected, use ALL section IDs.
2. For each section, iterate through its `questions[]`.
3. Validate each question: must have `id`, `stem`, and `options[]`.
4. Normalize options from `{ id, text }[]` to `Record<OptionKey, string>`.
5. Set `correctOptionId` default to `'A'` if missing.
6. Shuffle options via `shuffleQuestionOptions()`.
7. Return flat array of all `Question` objects.

### 19.6 Plan-Based Gating (Full Flow)

On component mount:

1. Fetch student state via `getStudentState({ force: false })`.
2. Extract `plan` from `student.licenseEntitlements[licenseId]`.
3. Compute `caps` via `planCaps(plan)`.

On session start (`handleStartQuiz`):

```
if (caps exist):
  if (flashcard mode):
    used = readUsage('flashcards')           // from localStorage, daily key
    remaining = caps.flashcardsPerDay - used
    if remaining <= 0 → BLOCK (alert)
    consume = max(1, min(deckSize, remaining))
    writeUsage('flashcards', used + consume)

  if (practice mode):
    used = readUsage('practice')             // from localStorage, daily key
    if used >= caps.practicePerDay → BLOCK (alert)
    writeUsage('practice', used + 1)

  if (test mode):
    used = readUsage('test')                 // from localStorage, weekly key
    if used >= caps.testsPerWeek → BLOCK (alert)
    writeUsage('test', used + 1)
```

### 19.7 Test Mode Session Lifecycle

```
1. Check usage cap → block if exceeded
2. Check credits (if enableCredits): credits < examCost → block
3. Deduct credits: credits -= examCost (saved to localStorage)
4. Build exam: buildTestExamQuestions(deck, selectedSections, defaultTestQuestionCount)
5. Set timer:
   - questions.length > 25 → 45 min (2700s)
   - questions.length ≤ 25 → 22 min (1320s)
6. Start timer countdown
7. Enter quiz screen

During quiz:
  - User selects answer → locked immediately
  - Score updated via applyAnswerToScore()
  - UserAnswer recorded
  - Can navigate prev/next (locked answers remain)

End conditions (whichever first):
  - All questions answered → auto-finalize via useEffect
  - Timer reaches 0 → auto-finalize
  - User clicks "Finish test" on last question → manual finalize
  - User clicks "Exit" → returns to home (results NOT saved)

On finalize (screenMode → 'results'):
  - Calculate score (unanswered = incorrect)
  - Calculate topic breakdown
  - Save to test history (localStorage, max 30 entries)
  - savedResultRef prevents duplicate saves
```

### 19.8 Practice Mode Session Lifecycle

```
1. Check usage cap → block if exceeded
2. Build full deck from selected sections
3. No timer, no credits
4. Enter quiz screen

During quiz:
  - User selects answer → locked immediately
  - Immediate feedback shown (correct/incorrect + explanation)
  - Score updated via applyAnswerToScore()
  - UserAnswer recorded
  - Can navigate prev/next (locked answers remain, feedback hidden on navigate)

End condition:
  - Last question → screenMode changes to 'practiceResults'
  - User clicks "Exit" → returns to home

On practiceResults screen:
  - Shows percentage, correct/incorrect counts
  - Lists all missed questions with correct answer + reference
  - Actions: "Repeat practice", "Study only wrong", "Back to module"
```

### 19.9 Flashcard Mode Session Lifecycle

```
1. Check usage cap → block if exceeded
2. Build full deck from selected sections
3. No timer, no credits
4. Enter quiz screen

During quiz:
  - Shows correct answer + explanation immediately (no interaction needed)
  - User can navigate prev/next freely
  - Answer selection NOT locked (informational only)
  - Scores are NOT updated
  - At last question → wraps to index 0 (infinite loop)
  - User clicks "Exit" → returns to home

No results screen.
```

### 19.10 Answer Handling Logic

```typescript
handleAnswerSelect(value):
  // Block if already locked
  if (mode === 'practice' || mode === 'test'):
    if lockedQuestions[currentQuestion.id] → return (ignore)

  setSelectedAnswer(value)

  if (mode === 'flashcard'):
    return  // no further processing

  // Grade answer
  correct = (value === currentQuestion.correctAnswer)
  setIsCorrect(correct)

  // Show feedback only in practice
  if (mode === 'practice'):
    setShowFeedback(true)

  // Update question score (both practice + test)
  questionScores = applyAnswerToScore(prev, questionId, correct)

  // Record user answer
  // If question already answered (re-visited), overwrite previous answer
  userAnswers.upsert({ questionId, selectedAnswer, isCorrect, tcSectionCode, tcTopicCode })

  // Lock the question
  lockedQuestions[questionId] = true
```

### 19.11 Navigation Logic

```typescript
handleNextQuestion():
  if (at last question):
    if (test mode)     → finishTest()           // ends test, shows results
    if (practice mode) → screenMode = 'practiceResults'
    if (flashcard mode) → setCurrentQuestionIndex(0)  // wrap around
  else:
    currentQuestionIndex++
    clearSelectedAnswer
    if (practice) → hide feedback

handlePreviousQuestion():
  if (at first question) → do nothing
  else:
    currentQuestionIndex--
    clearSelectedAnswer
    if (practice) → hide feedback
```

### 19.12 Test Exam Builder (Detailed)

```typescript
buildTestExamQuestions(allQs, selectedSectionIds, totalQuestions):

  maxQuestions = min(totalQuestions, allQs.length)
  if maxQuestions <= 0 → return []

  // 1. Calculate weights
  for each section in selectedSections:
    sectionWeight[sid] = section.weight ?? 1
    totalWeight += sectionWeight[sid]

  // 2. Build pools: section → topic → Question[]
  for each section:
    sectionQs = allQs.filter(q => q.sectionId === sid)
    shuffle(sectionQs)
    group by safeTopicKey(q):
      topicKey = q.tcTopicCode || "SECTION:{sectionId}"
      topicPools[topicKey].push(q)

  // 3. Weighted allocation per section
  remaining = maxQuestions
  for each section:
    ideal = round((maxQuestions × sectionWeight[sid]) / totalWeight)
    target = min(ideal, availableCount, remaining)
    picked = roundRobinPick(topicPools[sid], target)
    selected.push(picked)
    remaining -= picked.length
    leftovers.push(remaining questions from this section)

  // 4. Global fill (if remaining > 0)
  if remaining > 0:
    group leftovers globally by topicKey
    selected.push(roundRobinPick(globalPools, remaining))

  // 5. Final shuffle + cap
  return shuffle(selected).slice(0, maxQuestions)
```

### 19.13 Round-Robin Pick (Detailed)

```typescript
roundRobinPick(pools, count):
  keys = shuffledKeys(pools)  // randomize topic order
  out = []
  guard = 0

  while out.length < count AND guard < 100000:
    guard++
    progressed = false

    for key in keys:
      if pools[key].length > 0:
        out.push(pools[key].shift())  // take 1 from this topic
        progressed = true
        if out.length >= count → break

    if not progressed → break  // all pools empty

  return out
```

### 19.14 Scoring Functions

```typescript
// Get score for a question (default 3 for unseen)
getQuestionScore(map, questionId):
  return map[questionId] ?? 3

// Update score after answering
applyAnswerToScore(map, questionId, isCorrect):
  current = map[questionId] ?? 3
  next = isCorrect ? min(5, current + 1) : max(0, current - 1)
  return { ...map, [questionId]: next }
```

### 19.15 Topic Classification

```typescript
classifyTopic(percent):
  if percent >= 80 → "Strong"
  if percent >= 60 → "Borderline"
  else             → "Needs Study"
```

### 19.16 Test History Persistence

```typescript
// On test results screen (runs once via ref guard):
1. Calculate score
2. Calculate topic breakdown
3. Identify focus topics (classification === "Needs Study")
4. Create TestHistoryEntry:
   { ts, total, correct, answered, incorrect, unanswered, percentage,
     passMark: 70, pass, focusTopics }
5. Load existing history (max 30 entries)
6. Prepend new entry
7. Save to localStorage (key: {moduleId}_testHistory_v1)
```

### 19.17 Auto-Finalize Guards

Two ref-based guards prevent duplicate operations:

| Guard | Purpose |
|---|---|
| `autoFinishRef` | Prevents auto-finalize `useEffect` from firing twice when all questions are answered |
| `savedResultRef` | Prevents test history from being saved twice when entering results screen |

Both are reset on:
- Starting a new quiz (`handleStartQuiz`)
- Going home (`handleGoHome`)
- Restarting (`handleRestartCurrentMode`)

### 19.18 Timer Logic

```typescript
// Runs every second via useEffect
if (isTimerRunning AND timeLeft !== null):
  if timeLeft <= 0:
    stop timer
    screenMode = 'results'     // force end
  else:
    timeLeft -= 1              // decrement each second

// Format: "MM:SS" (zero-padded)
formatTime(seconds):
  m = floor(seconds / 60)
  s = seconds % 60
  return padded mm:ss
```

### 19.19 Restart & Practice-Only-Incorrect

**Restart (`handleRestartCurrentMode`)**:
- Test mode: checks credit balance again, deducts, builds NEW exam, resets timer.
- Other modes: rebuilds deck from selected sections, no timer.
- Resets all state: answers, index, locked questions, feedback, guards.

**Practice only incorrect (`handlePracticeOnlyIncorrect`)**:
1. Collect question IDs from `userAnswers` where `isCorrect === false`.
2. Filter the current `questions[]` to only those.
3. If no incorrect → falls back to full restart.
4. Enter quiz screen in practice mode with the filtered deck.
5. Resets all state (answers, index, locked questions).

### 19.20 localStorage Persistence (Full Map)

| What | Key | When Loaded | When Saved |
|---|---|---|---|
| Question scores | `{moduleId}_questionScores_v2` | On mount | On every change (useEffect) |
| Credits | `{moduleId}_examCredits_v1` | On mount | On every change (useEffect) |
| Usage (flashcard) | `ameone_usage:{license}:{module}:flashcards` | On session start | On session start (consume) |
| Usage (practice) | `ameone_usage:{license}:{module}:practice` | On session start | On session start (consume) |
| Usage (test) | `ameone_usage:{license}:{module}:test` | On session start | On session start (consume) |
| Test history | `{moduleId}_testHistory_v1` | On results screen | On results screen (once) |

### 19.21 Date/Week Key Generation

```typescript
// Daily key (for flashcard + practice caps)
todayKey():
  d = new Date()
  return "YYYY-MM-DD"  // zero-padded month and day

// Weekly key (for test caps) — ISO week
weekKey():
  d = new Date()
  // Calculate ISO week number using UTC
  // Returns "YYYY-Wnn" (zero-padded week number)
```

### 19.22 Section Selection (Home Screen)

- Default: first section pre-selected.
- Toggle: clicking a section adds/removes it from selection.
- "Select all": selects all sections.
- UI shows: section title (or shortTitle), subtitle, question count, first 4 topics.
- Footer shows: selected section count + total question count in deck.

### 19.23 Account Screen (Credit Management)

- Shows current credit balance for the module (from localStorage).
- Displays: "1 Test = {examCost} credit".
- Dev button: "Add 5 test credits" (adds 5 to localStorage balance).
- Note: This is per-module localStorage credits, separate from database `CreditAccount`.

---

## Appendix A: Admin Endpoints

### Set Plan

```
POST /api/entitlements/set-plan
Body: { licenseId: "m", plan: "premium", userId?: "..." }
```

- Requires admin role.
- Upserts `LicenseEntitlement` with derived experience from `experienceForPlan(plan)`.
- Allowed licenses: `m`, `e`, `s`, `balloons`, `regs`.
- Allowed plans: `basic`, `standard`, `premium`.
- If `userId` is omitted, defaults to the admin's own account.

---

## Appendix B: localStorage Keys Reference

| Key Pattern | Scope | Reset | Purpose |
|---|---|---|---|
| `ameone_usage:{license}:{module}:flashcards` | Per license+module | Daily | Flashcard session counter |
| `ameone_usage:{license}:{module}:practice` | Per license+module | Daily | Practice session counter |
| `ameone_usage:{license}:{module}:test` | Per license+module | Weekly | Test session counter |
| `{moduleId}_questionScores_v2` | Per module | Never | Question score map (0–5) |
| `{moduleId}_examCredits_v1` | Per module | Never | Client-side credit balance |
| `{moduleId}_testHistory_v1` | Per module | Never | Test result history (max 30) |

---

## Appendix C: UI Navigation Structure

```
/app
  /app/m                    → M license hub
  /app/m/standard-practices → M standard practices study
  /app/m/airframe           → M airframe study
  /app/m/powerplant         → M powerplant study
  /app/m/logbook            → M logbook

  /app/e                    → E license hub
  /app/e/standard-practices → E standard practices study
  /app/e/rating-avionics    → E avionics study

  /app/s                    → S license hub
  /app/s/standard-practices → S standard practices study
  /app/s/rating-structures  → S structures study

  /app/balloons             → Balloons hub
  /app/balloons/bregs       → Balloon regulations study

  /app/regs                 → Regulations core (combined deck)
```
