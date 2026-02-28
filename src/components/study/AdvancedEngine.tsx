'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';
import { getStudentState, type StudentState } from '@/lib/entitlementsClient';
import { planCaps } from '@/lib/planEntitlements';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  Coins,
  RefreshCw,
  Trophy,
  User,
  X,
} from 'lucide-react';

// --------------------------------------------------------
// Tipos exportados para as páginas de módulo usarem
// --------------------------------------------------------

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface RawQuestion {
  id: string;
  ratingCode?: string;
  examCode?: string;

  tcSectionCode?: string;
  tcSectionTitle?: string;
  tcTopicCode?: string;
  tcTopicTitle?: string;

  topicPath?: { code: string; title: string }[];

  questionType?: 'single_choice';
  stem: string;

  options: { id: OptionKey; text: string }[];
  correctOptionId: OptionKey;

  references?: {
    doc?: string;
    area?: string;
    topic?: string;
    locator?: string;
    note?: string;
  }[];

  explanation?: {
    correct?: string;
    whyOthersAreWrong?: Partial<Record<OptionKey, string>>;
  };

  difficulty?: number;
  tags?: string[];
  status?: 'draft' | 'validated' | 'published';
  version?: number;
}

export interface DeckSection {
  id: string;
  title: string;
  shortTitle?: string;
  subtitle?: string;

  // ✅ Etapa 2: “preview do conteúdo” (TC guide)
  topics?: string[];

  weight?: number;
  questions: RawQuestion[];
}

// --------------------------------------------------------
// Tipos internos
// --------------------------------------------------------

type QuestionId = string;

interface Question {
  id: QuestionId;
  sectionId: string;
  stem: string;

  options: Record<OptionKey, string>;
  correctAnswer: OptionKey;

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
  questionId: QuestionId;
  selectedAnswer: OptionKey;
  isCorrect: boolean;

  tcSectionCode?: string;
  tcTopicCode?: string;
}

type QuestionScoreMap = Record<QuestionId, number>; // 0–5

interface AdvancedEngineProps {
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
  sections: DeckSection[];

  // Plan-based experience gating (MVP). If omitted, study modes are unlimited.
  licenseId?: 'm' | 'e' | 's' | 'balloons' | 'regs';
  backHref?: string;

  // Legacy (kept for compatibility; should remain false in AME ONE pages)
  enableCredits?: boolean;
  examCost?: number;

  defaultTestQuestionCount?: number;
}

// --------------------------------------------------------
// Utils
// --------------------------------------------------------

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeOptionsToRecord(
  opts: { id: OptionKey; text: string }[],
): Record<OptionKey, string> {
  const record: Record<OptionKey, string> = { A: '', B: '', C: '', D: '' };
  for (const o of opts) {
    if (o && o.id && typeof o.text === 'string') record[o.id] = o.text;
  }
  return record;
}

function shuffleQuestionOptions(question: Question): Question {
  const entries = Object.entries(question.options) as [OptionKey, string][];
  const shuffled = shuffleArray(entries);

  const newOptions: Record<OptionKey, string> = { A: '', B: '', C: '', D: '' };
  const newKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

  let newCorrect: OptionKey = 'A';

  shuffled.forEach(([oldKey, text], idx) => {
    const newKey = newKeys[idx];
    newOptions[newKey] = text;
    if (oldKey === question.correctAnswer) {
      newCorrect = newKey;
    }
  });

  return {
    ...question,
    options: newOptions,
    correctAnswer: newCorrect,
  };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function safeTopicKey(q: Question) {
  // ✅ chave TC-like (preferência: tcTopicCode)
  // fallback: sectionId (pra não quebrar se tcTopicCode vier vazio)
  return q.tcTopicCode || `SECTION:${q.sectionId}`;
}

function roundRobinPick<T>(pools: Record<string, T[]>, count: number): T[] {
  const keys = Object.keys(pools).filter((k) => (pools[k]?.length ?? 0) > 0);
  if (keys.length === 0 || count <= 0) return [];

  const order = shuffleArray(keys);
  const out: T[] = [];

  let guard = 0;
  while (out.length < count && guard < 100000) {
    guard++;
    let progressed = false;

    for (const k of order) {
      const pool = pools[k];
      if (pool && pool.length > 0) {
        out.push(pool.shift() as T);
        progressed = true;
        if (out.length >= count) break;
      }
    }

    if (!progressed) break; // nada mais pra pegar
  }

  return out;
}

// --------------------------------------------------------
// Glass helpers (visual only)
// --------------------------------------------------------

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={[
        'relative overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md',
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />
      <div className="relative">{children}</div>
    </Card>
  );
}

const outlineBtn =
  'border border-white/15 bg-white/10 text-white hover:bg-white/15';
const primaryBtn =
  'border border-white/15 bg-black/70 text-white hover:bg-black/60';

function QuestionScoreIndicator({ score }: { score: number }) {
  const max = 5;
  const levels = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col items-end gap-1 text-xs text-white/70">
      <span className="font-medium text-white/80">Level {score}/5</span>
      <div className="flex gap-1">
        {levels.map((lvl) => (
          <div
            key={lvl}
            className={[
              'h-2 w-2 rounded-full border border-white/35',
              lvl <= score ? 'bg-white/80' : 'bg-transparent',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------
// LocalStorage helpers (por módulo)
// --------------------------------------------------------

function getScoreStorageKey(moduleId: string) {
  return `${moduleId}_questionScores_v2`;
}

function getCreditsStorageKey(moduleId: string) {
  return `${moduleId}_examCredits_v1`;
}

// ✅ novo: histórico local de testes
function getTestHistoryStorageKey(moduleId: string) {
  return `${moduleId}_testHistory_v1`;
}

type TestHistoryEntry = {
  ts: number;
  total: number;
  correct: number;
  answered: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  passMark: number;
  pass: boolean;
  focusTopics: string[];
};

function loadTestHistory(moduleId: string): TestHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getTestHistoryStorageKey(moduleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TestHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveTestHistory(moduleId: string, entries: TestHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getTestHistoryStorageKey(moduleId),
      JSON.stringify(entries),
    );
  } catch {
    // ignore
  }
}

function loadQuestionScores(moduleId: string): QuestionScoreMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getScoreStorageKey(moduleId));
    if (!raw) return {};
    return JSON.parse(raw) as QuestionScoreMap;
  } catch {
    return {};
  }
}

function saveQuestionScores(moduleId: string, map: QuestionScoreMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getScoreStorageKey(moduleId),
      JSON.stringify(map),
    );
  } catch {
    // ignore
  }
}

function getQuestionScore(map: QuestionScoreMap, questionId: QuestionId): number {
  return map[questionId] ?? 3;
}

function applyAnswerToScore(
  map: QuestionScoreMap,
  questionId: QuestionId,
  isCorrect: boolean,
): QuestionScoreMap {
  const current = map[questionId] ?? 3;
  const next = isCorrect ? Math.min(5, current + 1) : Math.max(0, current - 1);
  return { ...map, [questionId]: next };
}

function loadCredits(moduleId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(getCreditsStorageKey(moduleId));
    if (!raw) return 0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
}

function saveCredits(moduleId: string, value: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getCreditsStorageKey(moduleId), String(value));
  } catch {
    // ignore
  }
}

function classifyTopic(percent: number) {
  if (percent >= 80) return 'Strong';
  if (percent >= 60) return 'Borderline';
  return 'Needs Study';
}

// --------------------------------------------------------
// Componente principal
// --------------------------------------------------------

function AdvancedEngine({
  moduleId,
  moduleTitle,
  moduleDescription,
  sections,
  licenseId,
  backHref,
  enableCredits = true,
  examCost = 1,
  defaultTestQuestionCount = 50,
}: AdvancedEngineProps) {
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    sectionIds.length > 0 ? [sectionIds[0]] : [],
  );

  const [screenMode, setScreenMode] = useState<
    'home' | 'quiz' | 'results' | 'practiceResults' | 'account'
  >('home');

  const [studyMode, setStudyMode] = useState<'flashcard' | 'practice' | 'test'>(
    'flashcard',
  );

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [questionScores, setQuestionScores] = useState<QuestionScoreMap>({});
  const [credits, setCredits] = useState<number>(0);

  // ----------------------------------------------------
  // Plan-based gating (license plans)
  // ----------------------------------------------------
  const [student, setStudent] = useState<StudentState | null>(null);
  const plan = student?.licenseEntitlements?.[licenseId ?? '']?.plan;
  const caps = useMemo(() => (plan ? planCaps(plan) : null), [plan]);

  useEffect(() => {
    if (!licenseId) return;
    let alive = true;
    (async () => {
      const s = await getStudentState({ force: false });
      if (!alive) return;
      setStudent(s);
    })();
    return () => { alive = false; };
  }, [licenseId]);

  function storageKey(kind: 'flashcards' | 'practice' | 'test') {
    return `ameone_usage:${licenseId ?? 'unknown'}:${moduleId}:${kind}`;
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function weekKey() {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  function readUsage(kind: 'flashcards' | 'practice' | 'test') {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = window.localStorage.getItem(storageKey(kind));
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const key = kind === 'test' ? weekKey() : todayKey();
      if (data?.key !== key) return 0;
      const n = Number(data?.count ?? 0);
      return Number.isFinite(n) ? n : 0;
    } catch { return 0; }
  }

  function writeUsage(kind: 'flashcards' | 'practice' | 'test', next: number) {
    if (typeof window === 'undefined') return;
    try {
      const key = kind === 'test' ? weekKey() : todayKey();
      window.localStorage.setItem(storageKey(kind), JSON.stringify({ key, count: next }));
    } catch { /* ignore */ }
  }

  const [lockedQuestions, setLockedQuestions] = useState<
    Record<QuestionId, boolean>
  >({});

  // ✅ para evitar salvar histórico 2x ao entrar em results
  const savedResultRef = useRef(false);

  // ✅ para evitar auto-finalize rodar 2x
  const autoFinishRef = useRef(false);

  // ----------------------------------------------------
  // Helpers sections
  // ----------------------------------------------------

  const getSectionById = (id: string) => sections.find((s) => s.id === id);

  const getSectionQuestionCount = (id: string): number => {
    const section = getSectionById(id);
    return section?.questions?.length ?? 0;
  };

  const deckLabel = useMemo(() => {
    if (selectedSections.length === 0)
      return `${moduleTitle} – No section selected`;
    if (selectedSections.length === sectionIds.length) {
      return `${moduleTitle} – All sections`;
    }
    const names = selectedSections
      .map((id) => getSectionById(id))
      .filter(Boolean)
      .map((s) => s!.shortTitle || s!.title);
    return `${moduleTitle} – ${names.join(', ')}`;
  }, [moduleTitle, selectedSections, sectionIds.length, sections]);

  // ----------------------------------------------------
  // Construção do deck
  // ----------------------------------------------------

  const buildDeckForSections = (sectionIdList: string[]): Question[] => {
    const activeIds = sectionIdList.length > 0 ? sectionIdList : sectionIds;

    const result: Question[] = [];

    activeIds.forEach((sid) => {
      const section = getSectionById(sid);
      if (!section) return;

      (section.questions || []).forEach((q) => {
        if (!q || !q.id || !q.stem || !Array.isArray(q.options)) return;

        const baseCorrect = (q.correctOptionId ?? 'A') as OptionKey;

        const baseQuestion: Question = {
          id: String(q.id),
          sectionId: sid,
          stem: q.stem,
          options: normalizeOptionsToRecord(q.options),
          correctAnswer: baseCorrect,

          tcSectionCode: q.tcSectionCode,
          tcSectionTitle: q.tcSectionTitle,
          tcTopicCode: q.tcTopicCode,
          tcTopicTitle: q.tcTopicTitle,
          topicPath: q.topicPath,

          references: q.references,
          explanation: q.explanation,

          difficulty: q.difficulty,
          tags: q.tags,
        };

        result.push(shuffleQuestionOptions(baseQuestion));
      });
    });

    return result;
  };

  // ✅ TEST builder TC-like: balanceia por section weight,
  // mas dentro de cada section faz mix por tcTopicCode (round-robin)
  const buildTestExamQuestions = (
    allQs: Question[],
    selectedSectionIds: string[],
    totalQuestions: number,
  ): Question[] => {
    const activeIds =
      selectedSectionIds.length > 0 ? selectedSectionIds : sectionIds;

    const maxQuestions = Math.min(totalQuestions, allQs.length);
    if (maxQuestions <= 0) return [];

    // 1) calcula pesos por section
    const sectionWeight: Record<string, number> = {};
    let totalWeight = 0;

    activeIds.forEach((sid) => {
      const w = getSectionById(sid)?.weight ?? 1;
      sectionWeight[sid] = w;
      totalWeight += w;
    });

    // 2) monta pools por section -> topicKey -> questions[]
    const perSectionTopicPools: Record<string, Record<string, Question[]>> = {};

    activeIds.forEach((sid) => {
      const sectionQs = allQs.filter((q) => q.sectionId === sid);
      const topicPools: Record<string, Question[]> = {};

      shuffleArray(sectionQs).forEach((q) => {
        const key = safeTopicKey(q);
        if (!topicPools[key]) topicPools[key] = [];
        topicPools[key].push(q);
      });

      perSectionTopicPools[sid] = topicPools;
    });

    // 3) pega "target" por section (peso), usando round-robin topic
    const selected: Question[] = [];
    const leftovers: Question[] = [];

    let remaining = maxQuestions;

    activeIds.forEach((sid) => {
      if (remaining <= 0) return;

      const topicPools = perSectionTopicPools[sid] ?? {};
      const availableCount = Object.values(topicPools).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      if (availableCount <= 0) return;

      const ideal = Math.round((maxQuestions * sectionWeight[sid]) / totalWeight);
      const target = Math.min(ideal, availableCount, remaining);

      const picked = roundRobinPick(topicPools, target);
      selected.push(...picked);
      remaining -= picked.length;

      // sobras dessa section (pra fill)
      const rest = Object.values(topicPools).flat();
      leftovers.push(...rest);
    });

    // 4) fill geral (também misturado por topicKey)
    if (remaining > 0 && leftovers.length > 0) {
      const globalTopicPools: Record<string, Question[]> = {};
      shuffleArray(leftovers).forEach((q) => {
        const key = safeTopicKey(q);
        if (!globalTopicPools[key]) globalTopicPools[key] = [];
        globalTopicPools[key].push(q);
      });

      selected.push(...roundRobinPick(globalTopicPools, remaining));
    }

    // 5) embaralha final (mantém mix)
    return shuffleArray(selected).slice(0, maxQuestions);
  };

  const totalQuestionsSelected = useMemo(
    () =>
      selectedSections.reduce(
        (sum, sid) => sum + getSectionQuestionCount(sid),
        0,
      ),
    [selectedSections, sections],
  );

  // ----------------------------------------------------
  // Efeitos: carregar scores / créditos
  // ----------------------------------------------------

  useEffect(() => {
    setQuestionScores(loadQuestionScores(moduleId));
    setCredits(loadCredits(moduleId));
  }, [moduleId]);

  useEffect(() => {
    saveQuestionScores(moduleId, questionScores);
  }, [moduleId, questionScores]);

  useEffect(() => {
    saveCredits(moduleId, credits);
  }, [moduleId, credits]);

  // timer
  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      setTimeLeft(0);
      setScreenMode('results');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // ----------------------------------------------------
  // Handlers gerais
  // ----------------------------------------------------

  const handleToggleSection = (sid: string) => {
    setSelectedSections((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid],
    );
  };

  const handleSelectAllSections = () => {
    setSelectedSections(sectionIds);
  };

  const finishTest = useCallback(() => {
    setScreenMode('results');
    setIsTimerRunning(false);
  }, []);

  const handleStartQuiz = (modeToUse: 'flashcard' | 'practice' | 'test') => {
    if (sections.length === 0) {
      alert('This module has no sections configured yet.');
      return;
    }

    const deck = buildDeckForSections(selectedSections);
    if (deck.length === 0) {
      alert(
        'There are no questions in the selected sections. Please add questions to the JSON files.',
      );
      return;
    }

    // reset guards
    savedResultRef.current = false;
    autoFinishRef.current = false;

    // ----------------------------------------------------
    // Experience gating (MVP) — based on license plan
    // ----------------------------------------------------
    if (caps) {
      if (modeToUse === 'flashcard') {
        const used = readUsage('flashcards');
        const remaining = caps.flashcardsPerDay - used;
        if (!Number.isFinite(remaining) || remaining <= 0) {
          alert('Flashcards limit reached for today. Upgrade your plan to study unlimited.');
          return;
        }
        // Consume by deck size (perceived experience)
        const consume = Math.max(1, Math.min(totalQuestionsSelected || deck.length, remaining));
        writeUsage('flashcards', used + consume);
      }
      if (modeToUse === 'practice') {
        const used = readUsage('practice');
        if (used >= caps.practicePerDay) {
          alert('Practice limit reached for today. Upgrade your plan for unlimited practice.');
          return;
        }
        writeUsage('practice', used + 1);
      }
      if (modeToUse === 'test') {
        const used = readUsage('test');
        if (used >= caps.testsPerWeek) {
          alert('Test limit reached for this week. Upgrade your plan for more tests.');
          return;
        }
        writeUsage('test', used + 1);
      }
    }

    if (modeToUse === 'test') {
      if (enableCredits && credits < examCost) {
        alert(
          `You do not have enough exam credits to start a test. Required: ${examCost}.`,
        );
        return;
      }

      if (enableCredits) {
        setCredits((prev) => Math.max(prev - examCost, 0));
      }

      const testQuestions = buildTestExamQuestions(
        deck,
        selectedSections,
        defaultTestQuestionCount,
      );

      setQuestions(testQuestions);
      setTimeLeft(testQuestions.length > 25 ? 45 * 60 : 22 * 60);
      setIsTimerRunning(true);
    } else {
      setQuestions(deck);
      setTimeLeft(null);
      setIsTimerRunning(false);
    }

    setAllQuestions(deck);
    setStudyMode(modeToUse);
    setScreenMode('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setUserAnswers([]);
    setShowFeedback(false);
    setIsCorrect(false);
    setLockedQuestions({});
  };

  const handleGoHome = () => {
    setScreenMode('home');
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setUserAnswers([]);
    setLockedQuestions({});
    setTimeLeft(null);
    setIsTimerRunning(false);

    // reset guards (pra não carregar “state velho” num novo test)
    savedResultRef.current = false;
    autoFinishRef.current = false;
  };

  const handleAnswerSelect = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (
      (studyMode === 'practice' || studyMode === 'test') &&
      lockedQuestions[currentQuestion.id]
    ) {
      return;
    }

    setSelectedAnswer(value);

    if (studyMode === 'flashcard') return;

    const correct = value === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(studyMode === 'practice');

    setQuestionScores((prev) =>
      applyAnswerToScore(prev, currentQuestion.id, correct),
    );

    setUserAnswers((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.questionId === currentQuestion.id,
      );
      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedAnswer: value as OptionKey,
        isCorrect: correct,
        tcSectionCode: currentQuestion.tcSectionCode,
        tcTopicCode: currentQuestion.tcTopicCode,
      };

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = answer;
        return copy;
      }
      return [...prev, answer];
    });

    if (studyMode === 'practice' || studyMode === 'test') {
      setLockedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }

    // ✅ REMOVIDO: auto-finalize antigo (stale state)
    // Agora é garantido via useEffect (abaixo).
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      if (studyMode === 'test') {
        finishTest();
      } else if (studyMode === 'practice') {
        setScreenMode('practiceResults');
      } else {
        setCurrentQuestionIndex(0);
      }
      setSelectedAnswer('');
      setShowFeedback(false);
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer('');
    if (studyMode === 'practice') {
      setShowFeedback(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex === 0) return;
    setCurrentQuestionIndex((prev) => prev - 1);
    setSelectedAnswer('');
    if (studyMode === 'practice') {
      setShowFeedback(false);
    }
  };

  const handleRestartCurrentMode = () => {
    if (questions.length === 0) return;

    savedResultRef.current = false;
    autoFinishRef.current = false;

    if (studyMode === 'test') {
      if (enableCredits && credits < examCost) {
        alert(
          'You do not have enough exam credits to start a new test. Add more credits in My account.',
        );
        return;
      }
      if (enableCredits) {
        setCredits((prev) => Math.max(prev - examCost, 0));
      }

      const newTestQuestions = buildTestExamQuestions(
        allQuestions,
        selectedSections,
        defaultTestQuestionCount,
      );

      setQuestions(newTestQuestions);
      setTimeLeft(newTestQuestions.length > 25 ? 45 * 60 : 22 * 60);
      setIsTimerRunning(true);
    } else {
      const deck = buildDeckForSections(selectedSections);
      setQuestions(deck);
      setTimeLeft(null);
      setIsTimerRunning(false);
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setUserAnswers([]);
    setLockedQuestions({});
    setScreenMode('quiz');
  };

  const handlePracticeOnlyIncorrect = () => {
    const incorrectIds = userAnswers
      .filter((a) => !a.isCorrect)
      .map((a) => a.questionId);

    const incorrectQuestions = questions.filter((q) =>
      incorrectIds.includes(q.id),
    );

    if (incorrectQuestions.length === 0) {
      handleRestartCurrentMode();
      return;
    }

    setQuestions(incorrectQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setUserAnswers([]);
    setLockedQuestions({});
    setScreenMode('quiz');
  };

  const calculateScore = () => {
    const total = questions.length;
    const correct = userAnswers.filter((a) => a.isCorrect).length;
    const answered = userAnswers.length;
    const incorrect = Math.max(answered - correct, 0);
    const unanswered = Math.max(total - answered, 0);
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, answered, incorrect, unanswered, percentage };
  };

  // relatório estilo TC (por tópico)
  const calculateTopicBreakdown = () => {
    const topicTitleByCode: Record<string, string> = {};
    const sectionTitleByCode: Record<string, string> = {};

    for (const q of questions) {
      if (q.tcTopicCode && q.tcTopicTitle)
        topicTitleByCode[q.tcTopicCode] = q.tcTopicTitle;
      if (q.tcSectionCode && q.tcSectionTitle)
        sectionTitleByCode[q.tcSectionCode] = q.tcSectionTitle;
    }

    const stats: Record<
      string,
      { total: number; correct: number; sectionCode?: string }
    > = {};

    for (const ans of userAnswers) {
      if (!ans.tcTopicCode) continue;
      if (!stats[ans.tcTopicCode]) {
        stats[ans.tcTopicCode] = {
          total: 0,
          correct: 0,
          sectionCode: ans.tcSectionCode,
        };
      }
      stats[ans.tcTopicCode].total += 1;
      if (ans.isCorrect) stats[ans.tcTopicCode].correct += 1;
    }

    const rows = Object.entries(stats)
      .map(([topicCode, v]) => {
        const percent =
          v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
        return {
          topicCode,
          topicTitle: topicTitleByCode[topicCode] ?? '',
          sectionCode: v.sectionCode ?? '',
          sectionTitle: v.sectionCode
            ? sectionTitleByCode[v.sectionCode] ?? ''
            : '',
          total: v.total,
          correct: v.correct,
          percent,
          classification: classifyTopic(percent),
        };
      })
      .sort((a, b) => {
        const sc = a.sectionCode.localeCompare(b.sectionCode);
        if (sc !== 0) return sc;
        const tc = a.topicCode.localeCompare(b.topicCode);
        if (tc !== 0) return tc;
        return a.percent - b.percent;
      });

    return rows;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentScore =
    currentQuestion && questionScores
      ? getQuestionScore(questionScores, currentQuestion.id)
      : 3;

  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  // ----------------------------------------------------
  // ✅ FIX 1: Auto-finalize confiável (sem stale state)
  // ----------------------------------------------------
  useEffect(() => {
    if (studyMode !== 'test') return;
    if (screenMode !== 'quiz') return;
    if (!questions || questions.length === 0) return;

    if (userAnswers.length < questions.length) return;
    if (autoFinishRef.current) return;

    autoFinishRef.current = true;
    finishTest();
  }, [studyMode, screenMode, userAnswers.length, questions.length, finishTest]);

  // ----------------------------------------------------
  // ✅ FIX 2: Salvar histórico 1x (hook top-level)
  // ----------------------------------------------------
  useEffect(() => {
    if (studyMode !== 'test') return;
    if (screenMode !== 'results') return;
    if (savedResultRef.current) return;

    const { total, correct, answered, incorrect, unanswered, percentage } =
      calculateScore();

    const passMark = 70;
    const pass = percentage >= passMark;

    const topicRows = calculateTopicBreakdown();
    const focusTopics = topicRows
      .filter((r) => r.classification === 'Needs Study')
      .map((r) => r.topicCode);

    const entry: TestHistoryEntry = {
      ts: Date.now(),
      total,
      correct,
      answered,
      incorrect,
      unanswered,
      percentage,
      passMark,
      pass,
      focusTopics,
    };

    const prev = loadTestHistory(moduleId);
    const next = [entry, ...prev].slice(0, 30);
    saveTestHistory(moduleId, next);

    savedResultRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, studyMode, screenMode]);

  // ----------------------------------------------------
  // TELAS
  // ----------------------------------------------------

  // 1) Minha conta
  if (screenMode === 'account') {
    return (
      <div className="space-y-6 text-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white border border-white/15 backdrop-blur-md">
                <User className="h-3 w-3" />
                <span>My account – {moduleTitle}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Exam credits
              </h1>
              <p className="text-sm text-white/70">
                Credits for Test mode sessions in this module.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGoHome}
              className={outlineBtn}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <GlassCard>
            <CardHeader>
              <CardTitle className="text-white">Available credits</CardTitle>
              <CardDescription className="text-white/70">
                Test mode consumes credits; Practice and Flashcards are free.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-white/90">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Credits for this module
                  </span>
                </div>
                <span className="font-mono text-lg text-white">{credits}</span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-white/70">
                <span>• 1 Test = {examCost} credit</span>
                <span>• Practice and Flashcards are always free</span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-white/60">
                In the future, credits will be recharged via payment methods.
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCredits((prev) => prev + 5)}
                className={outlineBtn}
              >
                Add 5 test credits (dev)
              </Button>
            </CardFooter>
          </GlassCard>
        </div>
      </div>
    );
  }

  // 2) Home
  if (screenMode === 'home') {
    return (
      <div className="space-y-6 text-white">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                {moduleTitle}
              </h1>
              <p className="text-sm text-white/70">{moduleDescription}</p>
            </div>

            {enableCredits && (
              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs backdrop-blur-md">
                  <Coins className="h-3 w-3" />
                  <span className="font-medium text-white/90">
                    Credits:{' '}
                    <span className="font-mono text-white">{credits}</span>
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScreenMode('account')}
                  className={outlineBtn}
                >
                  <User className="mr-2 h-4 w-4" />
                  My account
                </Button>
              </div>
            )}
          </div>

          <GlassCard>
            <CardHeader>
              <CardTitle className="text-white">Sections</CardTitle>
              <CardDescription className="text-white/70">
                Select one or more sections to build the study deck.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {sections.length === 0 ? (
                <p className="text-sm text-white/70">
                  No sections configured for this module yet.
                </p>
              ) : (
                <>
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-white/60">
                      Click to toggle each section. You can combine multiple
                      sections in one session.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSections}
                      className={outlineBtn}
                    >
                      Select all
                    </Button>
                  </div>

                  <ul className="space-y-2">
                    {sections.map((section) => {
                      const isActive = selectedSections.includes(section.id);
                      const count = section.questions?.length ?? 0;
                      const subtitle =
                        section.subtitle ||
                        `${count} question${count === 1 ? '' : 's'}`;

                      return (
                        <li key={section.id}>
                          <button
                            type="button"
                            onClick={() => handleToggleSection(section.id)}
                            className={[
                              'w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                              isActive
                                ? 'bg-white/15 text-white border-white/20'
                                : 'bg-white/5 text-white/85 border-white/15 hover:bg-white/10',
                            ].join(' ')}
                          >
                            <div>
  <div className="text-sm font-semibold">
    {section.shortTitle || section.title}
  </div>

  <div
    className={
      isActive
        ? 'text-xs text-white/75 whitespace-pre-line'
        : 'text-xs text-white/60 whitespace-pre-line'
    }
  >
    {subtitle}
  </div>

  {section.topics && section.topics.length > 0 ? (
    <ul
      className={
        isActive
          ? 'mt-2 space-y-1 text-xs text-white/70'
          : 'mt-2 space-y-1 text-xs text-white/60'
      }
    >
      {section.topics.slice(0, 4).map((t, idx) => (
        <li key={idx}>• {t}</li>
      ))}

      {section.topics.length > 4 ? (
        <li>• +{section.topics.length - 4} more…</li>
      ) : null}
    </ul>
  ) : null}
</div>

                            <span
                              className={[
                                'text-xs px-2 py-1 rounded-full border',
                                isActive
                                  ? 'bg-white/10 text-white border-white/20'
                                  : 'bg-white/5 text-white/70 border-white/15',
                              ].join(' ')}
                            >
                              {count} questions
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="text-xs text-white/70">
                    Selected sections:{' '}
                    <span className="font-semibold text-white">
                      {selectedSections.length}
                    </span>{' '}
                    · Total questions in deck:{' '}
                    <span className="font-semibold text-white">
                      {totalQuestionsSelected}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader>
              <CardTitle className="text-white">Study modes</CardTitle>
              <CardDescription className="text-white/70">
                Choose how you want to study this deck.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">Flashcard mode</p>
                  <p className="text-xs text-white/70">
                    Shows the correct answer and explanation immediately.
                  </p>
                </div>
                <Button
                  disabled={totalQuestionsSelected === 0}
                  onClick={() => handleStartQuiz('flashcard')}
                  className={primaryBtn}
                >
                  Start
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">Practice mode</p>
                  <p className="text-xs text-white/70">
                    Multiple choice with instant feedback. Free, unlimited.
                  </p>
                </div>
                <Button
                  disabled={totalQuestionsSelected === 0}
                  onClick={() => handleStartQuiz('practice')}
                  className={primaryBtn}
                >
                  Start
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">Test mode</p>
                  <p className="text-xs text-white/70">
                    Timed exam. Unanswered questions count as incorrect.
                    {enableCredits && (
                      <>
                        {' '}
                        Costs{' '}
                        <span className="font-semibold text-white">
                          {examCost} credit{examCost !== 1 && 's'}
                        </span>{' '}
                        per test.
                      </>
                    )}
                  </p>
                </div>
                <Button
                  disabled={totalQuestionsSelected === 0}
                  onClick={() => handleStartQuiz('test')}
                  className={primaryBtn}
                >
                  Start
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          <div className="flex justify-between items-center gap-3 text-xs text-white/70">
            <Button asChild variant="outline" size="sm" className={outlineBtn}>
              <Link href={backHref ?? ROUTES.appHub} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="truncate">{deckLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // 3) Quiz
  if (screenMode === 'quiz' && currentQuestion) {
    const isFlashcard = studyMode === 'flashcard';
    const isTest = studyMode === 'test';

    const primaryRef =
      currentQuestion.references && currentQuestion.references.length > 0
        ? currentQuestion.references[0]
        : undefined;

    const topicBadge =
      currentQuestion.tcTopicCode && currentQuestion.tcTopicTitle
        ? `${currentQuestion.tcTopicCode} – ${currentQuestion.tcTopicTitle}`
        : currentQuestion.tcTopicCode
        ? currentQuestion.tcTopicCode
        : null;

    return (
      <div className="space-y-6 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-medium mb-1 backdrop-blur-md">
                {isFlashcard ? (
                  <>
                    <BookOpen className="w-3 h-3" />
                    <span>Flashcard mode</span>
                  </>
                ) : studyMode === 'practice' ? (
                  <>
                    <Brain className="w-3 h-3" />
                    <span>Practice mode</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-3 h-3" />
                    <span>Test mode</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {moduleTitle}
              </h1>
              <p className="text-sm text-white/70">{deckLabel}</p>
              {topicBadge && (
                <p className="text-xs text-white/60">Topic: {topicBadge}</p>
              )}
            </div>

            <div className="flex flex-col items-end space-y-2">
              {isTest && timeLeft !== null && (
                <span className="font-mono text-sm px-2 py-1 rounded border border-white/15 bg-white/10 text-white">
                  Time left: {formatTime(timeLeft)}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleGoHome}
                className={outlineBtn}
              >
                <X className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% completed</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-white/70 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <GlassCard className="border-white/15">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg md:text-xl text-white">
                  {currentQuestion.stem}
                </CardTitle>
                {!isFlashcard && <QuestionScoreIndicator score={currentScore} />}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isFlashcard ? (
                <>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-sm">
                    <p className="font-semibold mb-1 text-white">
                      Correct answer
                    </p>
                    <p className="text-white/90">
                      {currentQuestion.correctAnswer}.{' '}
                      {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>

                  {(currentQuestion.explanation?.correct ||
                    currentQuestion.explanation?.whyOthersAreWrong) && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-sm space-y-2">
                      <p className="font-semibold mb-1 text-white">
                        Explanation
                      </p>

                      {currentQuestion.explanation?.correct && (
                        <p className="text-white/80 whitespace-pre-wrap">
  {currentQuestion.explanation.correct}
</p>
                      )}

                      {currentQuestion.explanation?.whyOthersAreWrong && (
  <div className="text-white/75 text-xs space-y-1">
    <p className="font-semibold text-white/85">
      Why the other options are incorrect
    </p>

    {(['A', 'B', 'C', 'D'] as const)
      .filter((k) => k !== currentQuestion.correctAnswer)
      .map((k) => {
        const txt = currentQuestion.explanation?.whyOthersAreWrong?.[k];

        return (
          <p key={k} className="whitespace-pre-wrap">
            <span className="font-semibold text-white/85">{k}:</span>{' '}
            {txt && txt.trim().length > 0 ? txt : '—'}
          </p>
        );
      })}
  </div>
)}
                    </div>
                  )}

                  <div className="grid gap-2 text-xs text-white/70 md:grid-cols-2">
                    {primaryRef?.locator && (
                      <p>
                        <span className="font-semibold text-white/90">
                          Reference:{' '}
                        </span>
                        {primaryRef.locator}
                      </p>
                    )}
                    {currentQuestion.tcTopicCode && (
                      <p>
                        <span className="font-semibold text-white/90">
                          TC Topic:{' '}
                        </span>
                        {currentQuestion.tcTopicCode}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={handleAnswerSelect}
                    className="grid gap-3"
                  >
                    {(['A', 'B', 'C', 'D'] as const).map((optionKey) => (
                      <Label
                        key={optionKey}
                        className={[
                          'flex items-center space-x-3 p-3 border rounded-2xl cursor-pointer transition-all',
                          selectedAnswer === optionKey
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10',
                        ].join(' ')}
                      >
                        <RadioGroupItem
                          value={optionKey}
                          id={`${moduleId}-${currentQuestion.id}-${optionKey}`}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-white">
                            {optionKey}. {currentQuestion.options[optionKey]}
                          </span>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>

                  {studyMode === 'practice' && showFeedback && (
                    <div
                      className={[
                        'mt-4 p-3 rounded-2xl text-sm flex items-start space-x-2 border',
                        isCorrect
                          ? 'bg-emerald-500/15 text-emerald-50 border-emerald-400/20'
                          : 'bg-red-500/15 text-red-50 border-red-400/20',
                      ].join(' ')}
                    >
                      <div className="mt-0.5">
                        {isCorrect ? (
                          <Check className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <X className="w-4 h-4 text-red-300" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {isCorrect ? 'Correct!' : 'Incorrect.'}
                        </p>

                        {!isCorrect && (
                          <>
                            <p className="mt-1">
                              Correct answer:{' '}
                              <span className="font-semibold">
                                {currentQuestion.correctAnswer}.{' '}
                                {
                                  currentQuestion.options[
                                    currentQuestion.correctAnswer
                                  ]
                                }
                              </span>
                            </p>

                            {currentQuestion.explanation?.correct && (
                              <p className="mt-2 text-xs text-white/80">
                                {currentQuestion.explanation.correct}
                              </p>
                            )}

                            {primaryRef?.locator && (
                              <p className="mt-2 text-xs text-white/80">
                                <span className="font-semibold">
                                  Reference:{' '}
                                </span>
                                {primaryRef.locator}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                disabled={currentQuestionIndex === 0}
                onClick={handlePreviousQuestion}
                className={outlineBtn}
              >
                Previous
              </Button>

              <Button onClick={handleNextQuestion} className={primaryBtn}>
                {currentQuestionIndex === questions.length - 1
                  ? isTest
                    ? 'Finish test'
                    : 'Finish'
                  : 'Next'}
              </Button>
            </CardFooter>
          </GlassCard>
        </div>
      </div>
    );
  }

  // 4) Practice results
  if (screenMode === 'practiceResults') {
    const { total, correct, incorrect, answered, unanswered, percentage } =
      calculateScore();

    const incorrectDetails = userAnswers
      .filter((a) => !a.isCorrect)
      .map((ans, idx) => {
        const q = questions.find((qq) => qq.id === ans.questionId);
        return q
          ? {
              idx,
              question: q,
              answer: ans,
            }
          : null;
      })
      .filter(Boolean) as {
      idx: number;
      question: Question;
      answer: UserAnswer;
    }[];

    return (
      <div className="space-y-6 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard className="border-white/15">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/15">
                <Brain className="w-9 h-9 text-white" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Practice Summary – {moduleTitle}
                </CardTitle>
                <CardDescription className="text-sm text-white/70">
                  Use this to attack your weak questions.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight text-white">
                    {percentage}%{' '}
                    <span className="text-sm font-normal text-white/70">
                      correct in this practice
                    </span>
                  </p>
                  <ul className="space-y-1 text-sm text-white/70">
                    <li>
                      • Total questions in deck:{' '}
                      <span className="font-medium text-white">{total}</span>
                    </li>
                    <li>
                      • Answered:{' '}
                      <span className="font-medium text-white">{answered}</span>
                    </li>
                    <li>
                      • Unanswered:{' '}
                      <span className="font-medium text-white">{unanswered}</span>
                    </li>
                    <li>
                      • Correct:{' '}
                      <span className="font-medium text-white">{correct}</span>
                    </li>
                    <li>
                      • Incorrect:{' '}
                      <span className="font-medium text-white">{incorrect}</span>
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-64">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-white/10 border border-white/10" />
                    <div
                      className="absolute inset-2 rounded-full border-[8px] border-white/70"
                      style={{
                        background: `conic-gradient(rgba(255,255,255,0.85) ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
                      }}
                    />
                    <div className="absolute inset-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Questions you missed
                </h3>
                {incorrectDetails.length === 0 ? (
                  <p className="text-xs text-white/70">
                    You didn&apos;t miss any question in this practice. Great
                    job!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-auto pr-1">
                    {incorrectDetails.map(({ idx, question, answer }) => {
                      const primaryRef =
                        question.references && question.references.length > 0
                          ? question.references[0]
                          : undefined;

                      return (
                        <div
                          key={`${question.id}-${idx}`}
                          className="border border-white/10 rounded-2xl p-3 bg-white/5 text-xs"
                        >
                          <p className="font-semibold mb-1 text-white">
                            Q{idx + 1}. {question.stem}
                          </p>
                          <p className="mb-1 text-white/80">
                            Your answer:{' '}
                            <span className="font-semibold text-white">
                              {answer.selectedAnswer}.{' '}
                              {question.options[answer.selectedAnswer]}
                            </span>
                          </p>
                          <p className="mb-1 text-white/80">
                            Correct answer:{' '}
                            <span className="font-semibold text-white">
                              {question.correctAnswer}.{' '}
                              {question.options[question.correctAnswer]}
                            </span>
                          </p>
                          {primaryRef?.locator && (
                            <p className="text-[11px] text-white/60">
                              Reference: {primaryRef.locator}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col md:flex-row md:justify-between gap-3">
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button
                  className={primaryBtn + ' w-full md:w-auto'}
                  size="sm"
                  onClick={handleRestartCurrentMode}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Repeat practice with same configuration
                </Button>

                <Button
                  className={'w-full md:w-auto ' + outlineBtn}
                  size="sm"
                  variant="outline"
                  disabled={userAnswers.filter((a) => !a.isCorrect).length === 0}
                  onClick={handlePracticeOnlyIncorrect}
                >
                  Study only the questions I got wrong
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className={'w-full sm:w-auto ' + outlineBtn}
                  size="sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Back to module home
                </Button>
              </div>
            </CardFooter>
          </GlassCard>
        </div>
      </div>
    );
  }

  // 5) Test results (✅ PASS/FAIL + Focus topics + Save history)
  if (screenMode === 'results') {
    const { total, correct, incorrect, answered, unanswered, percentage } =
      calculateScore();

    const passMark = 70; // ✅ TC-like
    const pass = percentage >= passMark;

    const topicRows = calculateTopicBreakdown();
    const hasTopicBreakdown = topicRows.length > 0;

    const focusTopics = topicRows
      .filter((r) => r.classification === 'Needs Study')
      .map((r) => r.topicCode);

    const focusText =
      focusTopics.length > 0
        ? `You should focus on: ${focusTopics.join(', ')}`
        : 'No weak topics detected in this test (keep practicing to confirm).';

    const handleCopyFocus = async () => {
      try {
        await navigator.clipboard.writeText(focusText);
      } catch {
        // ignore
      }
    };

    return (
      <div className="space-y-6 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard className="border-white/15">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/15">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold text-white">
                  Test Results – {moduleTitle}
                </CardTitle>
                <CardDescription className="text-base text-white/70">
                  Unofficial TC-style feedback (for study only).
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-4xl font-bold tracking-tight text-white">
                    {percentage}%{' '}
                    <span className="text-base font-normal text-white/70">
                      score
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border',
                        pass
                          ? 'bg-emerald-500/15 text-emerald-50 border-emerald-400/20'
                          : 'bg-red-500/15 text-red-50 border-red-400/20',
                      ].join(' ')}
                    >
                      {pass ? 'PASS' : 'FAIL'} (pass mark {passMark}%)
                    </span>
                    <span className="text-xs text-white/60">
                      Unanswered count as incorrect
                    </span>
                  </div>

                  <p className="text-sm text-white/70">
                    {correct} of {total} questions correct
                  </p>
                  <ul className="space-y-1 text-sm text-white/70">
                    <li>
                      • Answered:{' '}
                      <span className="font-medium text-white">{answered}</span>
                    </li>
                    <li>
                      • Unanswered:{' '}
                      <span className="font-medium text-white">
                        {unanswered}
                      </span>
                    </li>
                    <li>
                      • Incorrect:{' '}
                      <span className="font-medium text-white">{incorrect}</span>
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-64">
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-white/10 border border-white/10" />
                    <div
                      className="absolute inset-3 rounded-full border-[10px] border-white/70"
                      style={{
                        background: `conic-gradient(rgba(255,255,255,0.85) ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
                      }}
                    />
                    <div className="absolute inset-7 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Focus topics (copy) */}
              {hasTopicBreakdown && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Study focus
                      </p>
                      <p className="text-xs text-white/70 mt-1">{focusText}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={outlineBtn}
                      onClick={handleCopyFocus}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {hasTopicBreakdown && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">
                    Topic breakdown (TC-style feedback)
                  </h3>
                  <p className="text-xs text-white/70">
                    This helps you see which TC topics need more study.
                  </p>

                  <div className="space-y-2 max-h-80 overflow-auto pr-1">
                    {topicRows.map((r) => (
                      <div
                        key={r.topicCode}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">
                              {r.topicCode}
                              {r.topicTitle ? ` – ${r.topicTitle}` : ''}
                            </p>
                            {r.sectionCode && (
                              <p className="text-xs text-white/60">
                                Section {r.sectionCode}
                                {r.sectionTitle ? ` – ${r.sectionTitle}` : ''}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              {r.correct}/{r.total} · {r.percent}%
                            </p>
                            <p className="text-xs text-white/70">
                              {r.classification}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col md:flex-row md:justify-between gap-3">
              <Button
                onClick={handleRestartCurrentMode}
                className={primaryBtn + ' w-full md:w-auto'}
                size="lg"
              >
                <Brain className="w-4 h-4 mr-2" />
                Take another test
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className={'w-full sm:w-auto ' + outlineBtn}
                  size="lg"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Back to module home
                </Button>

                <Button
                  onClick={handlePracticeOnlyIncorrect}
                  variant="outline"
                  className={outlineBtn}
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Practice only incorrect questions
                </Button>
              </div>
            </CardFooter>
          </GlassCard>
        </div>
      </div>
    );
  }

  return null;
}

export default AdvancedEngine;