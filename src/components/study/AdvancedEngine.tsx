'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { getAppDictionary, getAppLocaleFromPathname } from '@/lib/i18n/app';

import { StudyHomeScreen } from './StudyHomeScreen';
import { QuizScreen } from './QuizScreen';
import { PracticeResultsScreen } from './PracticeResultsScreen';
import { TestResultsScreen } from './TestResultsScreen';

// --------------------------------------------------------
// Re-exports for consumer pages (zero breaking changes)
// --------------------------------------------------------
export type { OptionKey, RawQuestion, DeckSection } from '@/lib/study/types';

// --------------------------------------------------------
// Imports from extracted study modules
// --------------------------------------------------------
import type {
  OptionKey,
  Question,
  QuestionId,
  UserAnswer,
  TestHistoryEntry,
  DeckSection,
} from '@/lib/study/types';
import { buildDeckForSections as _buildDeckForSections } from '@/lib/study/deckBuilder';
import { buildTestExamQuestions as _buildTestExamQuestions } from '@/lib/study/examBuilder';
import { calculateTopicBreakdown } from '@/lib/study/topicAnalysis';
import { loadTestHistory, saveTestHistory } from '@/lib/study/storage';
import { useStudyTimer } from '@/hooks/study/useStudyTimer';
import { useQuestionScores } from '@/hooks/study/useQuestionScores';
import { useStudyGating } from '@/hooks/study/useStudyGating';
import { useStudySession } from '@/hooks/study/useStudySession';

interface AdvancedEngineProps {
  moduleId: string;
  moduleKey?: string;
  moduleTitle: string;
  moduleDescription: string;
  sections: DeckSection[];

  // Plan-based experience gating (MVP). If omitted, study modes are unlimited.
  licenseId?: 'm' | 'e' | 's' | 'balloons' | 'regs';
  backHref?: string;

  defaultTestQuestionCount?: number;
}

// --------------------------------------------------------
// Componente principal
// --------------------------------------------------------

function AdvancedEngine({
  moduleId,
  moduleKey,
  moduleTitle,
  moduleDescription,
  sections,
  licenseId,
  backHref,
  defaultTestQuestionCount = 50,
}: AdvancedEngineProps) {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    sectionIds.length > 0 ? [sectionIds[0]] : [],
  );

  const [screenMode, setScreenMode] = useState<
    'home' | 'quiz' | 'results' | 'practiceResults'
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

  // Hooks
  const { timeLeft, isTimerRunning, startTimer, stopTimer, resetTimer, expired } =
    useStudyTimer();

  const finishTest = useCallback(() => {
    setScreenMode('results');
    stopTimer();
  }, [stopTimer]);

  // Auto-trigger results when timer expires
  useEffect(() => {
    if (expired) setScreenMode('results');
  }, [expired]);

  const { questionScores, getScore, recordAnswer } =
    useQuestionScores(moduleId);

  const {
    caps,
    usage,
    modeAvailability,
    isModeExhausted,
    getModeBlockedMessage,
    syncStudentState,
  } = useStudyGating(licenseId, dictionary.study);

  const {
    isStartingSession,
    activeStudySessionId,
    activeSessionStartedAt,
    savedResultRef,
    autoFinishRef,
    beginSession,
    completeSession,
    activateSession,
    resetSessionState,
  } = useStudySession(licenseId, moduleId, moduleKey, syncStudentState);

  const [lockedQuestions, setLockedQuestions] = useState<
    Record<QuestionId, boolean>
  >({});

  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

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
  // Construção do deck (delegates to extracted modules)
  // ----------------------------------------------------

  const buildDeckForSections = (sectionIdList: string[]): Question[] =>
    _buildDeckForSections(sections, sectionIds, sectionIdList);

  // ✅ TEST builder TC-like: balanceia por section weight,
  // mas dentro de cada section faz mix por tcTopicCode (round-robin)
  const buildTestExamQuestions = (
    allQs: Question[],
    selectedSectionIds: string[],
    totalQuestions: number,
  ): Question[] =>
    _buildTestExamQuestions(allQs, sections, sectionIds, selectedSectionIds, totalQuestions);

  const totalQuestionsSelected = useMemo(
    () =>
      selectedSections.reduce(
        (sum, sid) => sum + getSectionQuestionCount(sid),
        0,
      ),
    [selectedSections, sections],
  );

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

  const handleStartQuiz = async (modeToUse: 'flashcard' | 'practice' | 'test') => {
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

    if (isStartingSession || isModeExhausted(modeToUse)) {
      return;
    }

    try {
      const requestedQuestionsTotal =
        modeToUse === 'test'
          ? Math.min(defaultTestQuestionCount, deck.length)
          : Math.max(totalQuestionsSelected || deck.length, 1);

      const session = await beginSession(modeToUse, requestedQuestionsTotal);
      const allowedDeck =
        modeToUse === 'flashcard'
          ? deck.slice(0, Math.max(session.allowedQuestionsTotal, 1))
          : deck;

      savedResultRef.current = false;
      autoFinishRef.current = false;

      if (modeToUse === 'test') {
        const testQuestions = buildTestExamQuestions(
          allowedDeck,
          selectedSections,
          defaultTestQuestionCount,
        );

        setQuestions(testQuestions);
        startTimer(testQuestions.length > 25 ? 45 * 60 : 22 * 60);
      } else {
        setQuestions(allowedDeck);
        resetTimer();
      }

      setAllQuestions(allowedDeck);
      setStudyMode(modeToUse);
      setScreenMode('quiz');
      activateSession(session.sessionId ?? null);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setUserAnswers([]);
      setShowFeedback(false);
      setIsCorrect(false);
      setLockedQuestions({});
      setShowFlashcardAnswer(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to start study mode.');
    }
  };

  const handleGoHome = () => {
    setScreenMode('home');
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setUserAnswers([]);
    setLockedQuestions({});
    resetTimer();
    resetSessionState();
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

    recordAnswer(currentQuestion.id, correct);

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
    setShowFlashcardAnswer(false);
    if (studyMode === 'practice') {
      setShowFeedback(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex === 0) return;
    setCurrentQuestionIndex((prev) => prev - 1);
    setSelectedAnswer('');
    setShowFlashcardAnswer(false);
    if (studyMode === 'practice') {
      setShowFeedback(false);
    }
  };

  const handleRestartCurrentMode = async () => {
    const deck = buildDeckForSections(selectedSections);
    if (deck.length === 0 || isStartingSession) return;

    savedResultRef.current = false;
    autoFinishRef.current = false;

    try {
      const requestedQuestionsTotal =
        studyMode === 'test'
          ? Math.min(defaultTestQuestionCount, deck.length)
          : Math.max(deck.length, 1);

      const session = await beginSession(studyMode, requestedQuestionsTotal);
      const allowedDeck =
        studyMode === 'flashcard'
          ? deck.slice(0, Math.max(session.allowedQuestionsTotal, 1))
          : deck;

      if (studyMode === 'test') {
        const newTestQuestions = buildTestExamQuestions(
          allowedDeck,
          selectedSections,
          defaultTestQuestionCount,
        );

        setQuestions(newTestQuestions);
        startTimer(newTestQuestions.length > 25 ? 45 * 60 : 22 * 60);
      } else {
        setQuestions(allowedDeck);
        resetTimer();
      }

      setAllQuestions(allowedDeck);
      activateSession(session.sessionId ?? null);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setShowFeedback(false);
      setUserAnswers([]);
      setLockedQuestions({});
      setShowFlashcardAnswer(false);
      setScreenMode('quiz');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to restart study mode.');
    }
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
    activateSession(null);
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

  const _calculateTopicBreakdown = () =>
    calculateTopicBreakdown(questions, userAnswers);

  const currentQuestion = questions[currentQuestionIndex];
  const currentScore =
    currentQuestion && questionScores
      ? getScore(currentQuestion.id)
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

    const topicRows = _calculateTopicBreakdown();
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

  useEffect(() => {
    if (screenMode !== 'practiceResults' || studyMode !== 'practice') return;

    const { total, correct, answered, percentage } = calculateScore();
    const timeSpentMs = activeSessionStartedAt
      ? Math.max(Date.now() - activeSessionStartedAt, 0)
      : 0;

    completeSession({
      questionsTotal: total,
      questionsAnswered: answered,
      questionsCorrect: correct,
      score: total > 0 ? percentage / 100 : 0,
      timeSpentMs,
      details: { selectedSections, userAnswers },
    }).catch((error) => {
      console.error('[PRACTICE_SESSION_FINISH]', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenMode, studyMode]);

  useEffect(() => {
    if (screenMode !== 'results' || studyMode !== 'test') return;

    const { total, correct, answered, percentage } = calculateScore();
    const timeSpentMs = activeSessionStartedAt
      ? Math.max(Date.now() - activeSessionStartedAt, 0)
      : 0;

    completeSession({
      questionsTotal: total,
      questionsAnswered: answered,
      questionsCorrect: correct,
      score: total > 0 ? percentage / 100 : 0,
      timeSpentMs,
      details: {
        selectedSections,
        userAnswers,
        topicBreakdown: _calculateTopicBreakdown(),
      },
    }).catch((error) => {
      console.error('[TEST_SESSION_FINISH]', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenMode, studyMode]);

  // ----------------------------------------------------
  // TELAS
  // ----------------------------------------------------

  // 1) Home
  if (screenMode === 'home') {
    return (
      <StudyHomeScreen
        moduleTitle={moduleTitle}
        moduleDescription={moduleDescription}
        sections={sections}
        sectionIds={sectionIds}
        selectedSections={selectedSections}
        totalQuestionsSelected={totalQuestionsSelected}
        deckLabel={deckLabel}
        backHref={backHref}
        isStartingSession={isStartingSession}
        caps={caps}
        usage={usage}
        dictionary={dictionary}
        isModeExhausted={isModeExhausted}
        getModeBlockedMessage={getModeBlockedMessage}
        onToggleSection={handleToggleSection}
        onSelectAllSections={handleSelectAllSections}
        onStartQuiz={handleStartQuiz}
      />
    );
  }

  // 3) Quiz
  if (screenMode === 'quiz' && currentQuestion) {
    return (
      <QuizScreen
        moduleId={moduleId}
        moduleTitle={moduleTitle}
        deckLabel={deckLabel}
        studyMode={studyMode}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        currentQuestion={currentQuestion}
        currentScore={currentScore}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
        isCorrect={isCorrect}
        progress={progress}
        timeLeft={timeLeft}
        isTimerRunning={isTimerRunning}
        showFlashcardAnswer={showFlashcardAnswer}
        dictionary={dictionary}
        onAnswerSelect={handleAnswerSelect}
        onNextQuestion={handleNextQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        onGoHome={handleGoHome}
        onRevealFlashcardAnswer={() => setShowFlashcardAnswer(true)}
      />
    );
  }

  // 4) Practice results
  if (screenMode === 'practiceResults') {
    return (
      <PracticeResultsScreen
        moduleTitle={moduleTitle}
        score={calculateScore()}
        questions={questions}
        userAnswers={userAnswers}
        onRestartCurrentMode={handleRestartCurrentMode}
        onGoHome={handleGoHome}
        onPracticeOnlyIncorrect={handlePracticeOnlyIncorrect}
      />
    );
  }

  // 5) Test results
  if (screenMode === 'results') {
    return (
      <TestResultsScreen
        moduleTitle={moduleTitle}
        score={calculateScore()}
        topicRows={_calculateTopicBreakdown()}
        onRestartCurrentMode={handleRestartCurrentMode}
        onGoHome={handleGoHome}
        onPracticeOnlyIncorrect={handlePracticeOnlyIncorrect}
      />
    );
  }

  return null;
}

export default AdvancedEngine;
