export type CorrectionStyle = 'gentle' | 'balanced' | 'detailed';

export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'connecting'
  | 'listening'
  | 'coach_speaking'
  | 'processing'
  | 'muted'
  | 'error';

export interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  starterPrompt: string;
  targetVocab: string[];
}

export interface TurnFeedback {
  original: string;
  corrected: string;
  professionalAlternative: string;
  explanation: string;
  usefulPhrase: string;
  practiceSentence: string;
  errorCategory: 'grammar' | 'vocabulary' | 'clarity' | 'filler_words' | 'none';
  hasNotableErrors: boolean;
}

export interface TurnRecord {
  id: string;
  timestamp: number;
  userText: string;
  aiText: string;
  feedback?: TurnFeedback;
  isPracticed?: boolean;
}

export interface SessionSummary {
  overallFeedback: string;
  mainMistakes: Array<{ mistake: string; correction: string; reason: string }>;
  newVocabulary: Array<{ phrase: string; meaning: string; example: string }>;
  usefulExpressions: string[];
  fluencyScore: number;
  grammarScore: number;
  confidenceScore: number;
  nextGoal: string;
}

export interface PracticeSessionRecord {
  id: string;
  date: string;
  scenarioId: string;
  scenarioTitle: string;
  durationMinutes: number;
  turnsCount: number;
  summary: SessionSummary;
}

export interface VocabularyItem {
  phrase: string;
  meaning: string;
  example: string;
  learnedAt: string;
  scenarioId: string;
}

export interface UserProgress {
  totalMinutes: number;
  completedSessions: number;
  streakDays: number;
  lastPracticedDate: string | null;
  vocabularyBank: VocabularyItem[];
  recurringErrors: {
    grammar: number;
    vocabulary: number;
    clarity: number;
    filler_words: number;
  };
}

export interface ServiceHealthStatus {
  geminiConfigured: boolean;
  livekitConfigured: boolean;
  port: number;
  activeVoiceMode: 'livekit' | 'direct_gemini_live' | 'not_configured';
}
