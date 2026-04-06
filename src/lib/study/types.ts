// --------------------------------------------------------
// Tipos centrais do motor de estudo (AdvancedEngine)
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
  topics?: string[];
  weight?: number;
  questions: RawQuestion[];
}

// --------------------------------------------------------
// Tipos internos (pós-normalização)
// --------------------------------------------------------

export type QuestionId = string;

export interface Question {
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

export interface UserAnswer {
  questionId: QuestionId;
  selectedAnswer: OptionKey;
  isCorrect: boolean;

  tcSectionCode?: string;
  tcTopicCode?: string;
}

export type QuestionScoreMap = Record<QuestionId, number>;

export type StudyMode = 'flashcard' | 'practice' | 'test';

export type ScreenMode = 'home' | 'quiz' | 'results' | 'practiceResults';

export interface TestHistoryEntry {
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
}

export interface TopicBreakdownRow {
  topicCode: string;
  topicTitle: string;
  sectionCode: string;
  sectionTitle: string;
  correct: number;
  total: number;
  percentage: number;
  classification: 'Strong' | 'Borderline' | 'Needs Study';
}
