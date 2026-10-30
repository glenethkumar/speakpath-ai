/**
 * Practice Plan and Exercise Engine
 * Preserves the 7-exercise foundation from E-Bot-2026 (index.php lines 3795-3803)
 * and expands with B.Tech engineering career scenarios.
 */

export interface PracticeExercise {
  id: string;
  category: 'General' | 'Career & Interview' | 'Technical & viva' | 'Leadership';
  title: string;
  promptText: string;
  targetFocus: string;
  estimatedMinutes: number;
}

export const PRACTICE_EXERCISES: PracticeExercise[] = [
  // Original 7 prompts from E-Bot-2026
  {
    id: 'ebot_day_1',
    category: 'General',
    title: 'Self & Hometown Introduction',
    promptText: "Let's talk about where I grew up and what my hometown is like.",
    targetFocus: 'Descriptive adjectives, past tense stability',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_2',
    category: 'General',
    title: 'Ordering Food Roleplay',
    promptText: "Let's roleplay — you're a waiter at an Italian restaurant and I'm a customer.",
    targetFocus: 'Polite requests, modal verbs (would like, could I have)',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_3',
    category: 'General',
    title: 'Hobbies & Passions',
    promptText: "Let's talk about a hobby I enjoy and why I like it.",
    targetFocus: 'Expressing enthusiasm, present simple tense',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_4',
    category: 'General',
    title: 'Travel & Vacations',
    promptText: "Let's talk about a memorable trip or holiday I took.",
    targetFocus: 'Narrative storytelling, sequential past tense',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_5',
    category: 'General',
    title: 'A Typical Day',
    promptText: "Let's talk about what a typical day looks like for me as an engineering student.",
    targetFocus: 'Daily routine verbs, adverbs of frequency',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_6',
    category: 'General',
    title: 'Customer Service Roleplay',
    promptText: "Let's roleplay — you're a shop assistant and I'm returning a shirt I bought.",
    targetFocus: 'Assertive phrasing, polite disagreement',
    estimatedMinutes: 5,
  },
  {
    id: 'ebot_day_7',
    category: 'General',
    title: 'Future Goals & Aspirations',
    promptText: "Let's talk about my plans for the future and my career goals.",
    targetFocus: 'Future expressions (going to, plan to, hope to)',
    estimatedMinutes: 5,
  },

  // B.Tech Engineering & Career Additions for SpeakPath AI
  {
    id: 'speakpath_eng_1',
    category: 'Career & Interview',
    title: 'HR "Tell Me About Yourself"',
    promptText: "Let's practice the classic HR interview question: 'Tell me about yourself and your background in engineering.'",
    targetFocus: 'Professional elevator pitch, cohesive transitions',
    estimatedMinutes: 5,
  },
  {
    id: 'speakpath_eng_2',
    category: 'Technical & viva',
    title: 'System Architecture Viva Defense',
    promptText: "Let's roleplay a technical viva: act as a senior professor questioning me on how my latest web project handles caching and database scaling.",
    targetFocus: 'Technical precision, structured trade-off explanations',
    estimatedMinutes: 7,
  },
  {
    id: 'speakpath_eng_3',
    category: 'Career & Interview',
    title: 'Agile Standup & Blocker Communication',
    promptText: "Let's simulate a daily engineering standup: you're the Scrum Master and I am giving my three-bullet update with a blocker.",
    targetFocus: 'Concise executive updates, active voice',
    estimatedMinutes: 4,
  },
  {
    id: 'speakpath_eng_4',
    category: 'Leadership',
    title: 'Startup Pitch & Value Proposition',
    promptText: "Let's practice pitching my startup idea: you're an angel investor and I will explain the problem, our solution, and market traction.",
    targetFocus: 'High-energy persuasion, metric articulation',
    estimatedMinutes: 6,
  },
];

const STORAGE_KEY = 'speakpath_practice_progress';

export function loadPracticeProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePracticeProgress(state: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or private browsing
  }
}
