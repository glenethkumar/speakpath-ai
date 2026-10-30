import { useState, useEffect } from 'react';
import type { UserProgress, PracticeSessionRecord, VocabularyItem } from '../types';

const PROGRESS_KEY = 'speakpath_user_progress_v1';
const HISTORY_KEY = 'speakpath_session_history_v1';
const PRIVACY_KEY = 'speakpath_privacy_settings_v1';

const defaultProgress: UserProgress = {
  totalMinutes: 0,
  completedSessions: 0,
  streakDays: 0,
  lastPracticedDate: null,
  vocabularyBank: [],
  recurringErrors: {
    grammar: 0,
    vocabulary: 0,
    clarity: 0,
    filler_words: 0,
  },
};

export interface PrivacySettings {
  audioStorageConsent: boolean;
  saveTranscripts: boolean;
}

const defaultPrivacy: PrivacySettings = {
  audioStorageConsent: false,
  saveTranscripts: true,
};

export function useProgressStorage() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      return stored ? JSON.parse(stored) : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  const [history, setHistory] = useState<PracticeSessionRecord[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    try {
      const stored = localStorage.getItem(PRIVACY_KEY);
      return stored ? JSON.parse(stored) : defaultPrivacy;
    } catch {
      return defaultPrivacy;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacy));
    } catch (e) {
      console.warn('Failed to save privacy to localStorage', e);
    }
  }, [privacy]);

  const recordSession = (session: PracticeSessionRecord) => {
    const today = new Date().toISOString().split('T')[0];
    let newStreak = progress.streakDays;

    if (progress.lastPracticedDate) {
      const lastDate = new Date(progress.lastPracticedDate);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Accumulate newly discovered vocabulary words without duplicates
    const existingVocabPhrases = new Set(progress.vocabularyBank.map((v) => v.phrase.toLowerCase()));
    const newVocabItems: VocabularyItem[] = [];

    session.summary.newVocabulary.forEach((item) => {
      if (!existingVocabPhrases.has(item.phrase.toLowerCase())) {
        existingVocabPhrases.add(item.phrase.toLowerCase());
        newVocabItems.push({
          phrase: item.phrase,
          meaning: item.meaning,
          example: item.example,
          learnedAt: today,
          scenarioId: session.scenarioId,
        });
      }
    });

    // Update recurring error counts based on mistakes
    const errorCounts = { ...progress.recurringErrors };
    session.summary.mainMistakes.forEach((m) => {
      const text = (m.reason + ' ' + m.mistake).toLowerCase();
      if (text.includes('tense') || text.includes('grammar') || text.includes('subject')) {
        errorCounts.grammar += 1;
      } else if (text.includes('vocab') || text.includes('word') || text.includes('collocation')) {
        errorCounts.vocabulary += 1;
      } else if (text.includes('filler') || text.includes('um') || text.includes('pause')) {
        errorCounts.filler_words += 1;
      } else {
        errorCounts.clarity += 1;
      }
    });

    setProgress((prev) => ({
      ...prev,
      totalMinutes: prev.totalMinutes + Math.max(1, session.durationMinutes),
      completedSessions: prev.completedSessions + 1,
      streakDays: newStreak,
      lastPracticedDate: today,
      vocabularyBank: [...newVocabItems, ...prev.vocabularyBank],
      recurringErrors: errorCounts,
    }));

    if (privacy.saveTranscripts) {
      setHistory((prev) => [session, ...prev]);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    setProgress(defaultProgress);
    setHistory([]);
  };

  return {
    progress,
    history,
    privacy,
    setPrivacy,
    recordSession,
    clearAllData,
  };
}
