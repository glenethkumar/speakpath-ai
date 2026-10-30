import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_API_KEY } from './config.js';
import { SCENARIOS } from './prompts.js';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add your key to .env');
    }
    genAIClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAIClient;
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

export async function analyzeTurn(params: {
  originalText: string;
  scenarioId?: string;
  style?: 'gentle' | 'balanced' | 'detailed';
  previousDialogue?: string;
}): Promise<TurnFeedback> {
  const { originalText, scenarioId = 'free_conversation', style = 'balanced' } = params;
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.free_conversation;

  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
    return {
      original: originalText,
      corrected: originalText,
      professionalAlternative: originalText,
      explanation: 'API key not configured. Add GEMINI_API_KEY to .env to unlock real-time AI feedback.',
      usefulPhrase: 'Practice makes perfect',
      practiceSentence: originalText,
      errorCategory: 'none',
      hasNotableErrors: false,
    };
  }

  const ai = getGenAI();

  const prompt = `You are a warm, expert English Communication Coach analyzing a spoken answer from a B.Tech second-year engineering student.
Scenario: ${scenario.title} (${scenario.description})
Correction Style Requested: ${style.toUpperCase()}

Student's Spoken Utterance:
"${originalText}"

Guidelines for Analysis:
1. Distinguish genuine grammar/syntactic errors (tense shifts, subject-verb disagreement, incorrect prepositions) from acceptable informal spoken English.
2. In 'gentle' mode, only flag errors that impede clarity. In 'balanced' mode, point out 1-2 core improvements while keeping encouragement high. In 'detailed' mode, provide nuanced professional polish.
3. Never shame the student. Provide an empowering, concise explanation.
4. Give a "professionalAlternative" that sounds like a native speaker or senior software engineer.
5. Provide a "usefulPhrase" (idiom or workplace collocation) relevant to this topic.
6. Provide a "practiceSentence" for the student to practice speaking out loud.

Return strictly JSON matching this structure:
{
  "original": "${originalText.replace(/"/g, '\\"')}",
  "corrected": "Grammatically corrected version",
  "professionalAlternative": "More natural or corporate workplace version",
  "explanation": "Clear 1-2 sentence explanation of why the correction improves fluency",
  "usefulPhrase": "A relevant phrase or idiom",
  "practiceSentence": "Sentence for the student to repeat",
  "errorCategory": "grammar" | "vocabulary" | "clarity" | "filler_words" | "none",
  "hasNotableErrors": boolean
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            corrected: { type: Type.STRING },
            professionalAlternative: { type: Type.STRING },
            explanation: { type: Type.STRING },
            usefulPhrase: { type: Type.STRING },
            practiceSentence: { type: Type.STRING },
            errorCategory: {
              type: Type.STRING,
              enum: ['grammar', 'vocabulary', 'clarity', 'filler_words', 'none'],
            },
            hasNotableErrors: { type: Type.BOOLEAN },
          },
          required: [
            'original',
            'corrected',
            'professionalAlternative',
            'explanation',
            'usefulPhrase',
            'practiceSentence',
            'errorCategory',
            'hasNotableErrors',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      original: parsed.original || originalText,
      corrected: parsed.corrected || originalText,
      professionalAlternative: parsed.professionalAlternative || parsed.corrected || originalText,
      explanation: parsed.explanation || 'Good job expressing your thoughts clearly.',
      usefulPhrase: parsed.usefulPhrase || 'Building on that thought',
      practiceSentence: parsed.practiceSentence || parsed.corrected || originalText,
      errorCategory: parsed.errorCategory || 'none',
      hasNotableErrors: Boolean(parsed.hasNotableErrors),
    };
  } catch (err: any) {
    console.error('Error in analyzeTurn:', err);
    return {
      original: originalText,
      corrected: originalText,
      professionalAlternative: originalText,
      explanation: `Analysis note: ${err?.message || 'Could not parse response'}`,
      usefulPhrase: 'Keep up the good work',
      practiceSentence: originalText,
      errorCategory: 'none',
      hasNotableErrors: false,
    };
  }
}

export async function generateSessionSummary(params: {
  turns: Array<{ user: string; ai: string; correction?: TurnFeedback }>;
  scenarioId?: string;
  durationMinutes?: number;
}): Promise<SessionSummary> {
  const { turns, scenarioId = 'free_conversation', durationMinutes = 5 } = params;
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.free_conversation;

  if (!turns || turns.length === 0) {
    return {
      overallFeedback: "You started a practice session! Keep showing up every day to build lasting spoken English confidence.",
      mainMistakes: [],
      newVocabulary: [],
      usefulExpressions: ["Ready to begin", "Step by step"],
      fluencyScore: 70,
      grammarScore: 75,
      confidenceScore: 70,
      nextGoal: "Complete at least 3 active conversational turns in your next session.",
    };
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
    return {
      overallFeedback: `Great session practicing ${scenario.title}! Connect your Gemini API Key in .env to receive AI-powered diagnostic scores and custom mistake patterns.`,
      mainMistakes: [
        {
          mistake: "Tense consistency across sentences",
          correction: "Maintain past tense when narrating completed events.",
          reason: "Common pitfall during live spoken storytelling.",
        },
      ],
      newVocabulary: scenario.targetVocab.slice(0, 3).map((v) => ({
        phrase: v,
        meaning: "Key phrase for " + scenario.title,
        example: `I would like to highlight the ${v}.`,
      })),
      usefulExpressions: scenario.targetVocab.slice(0, 4),
      fluencyScore: 78,
      grammarScore: 80,
      confidenceScore: 82,
      nextGoal: "Practice explaining a recent technical blocker using the STAR framework.",
    };
  }

  const ai = getGenAI();

  const conversationTranscript = turns
    .map((t, idx) => `Turn ${idx + 1}:\nStudent: ${t.user}\nCoach: ${t.ai}`)
    .join('\n\n');

  const prompt = `You are a Master English Speech & Interview Evaluator reviewing a completed spoken conversation session for a B.Tech second-year student.
Scenario: ${scenario.title}
Estimated Duration: ${durationMinutes} minutes.

Full Session Transcript:
${conversationTranscript}

Provide a comprehensive, highly constructive evaluation:
1. overallFeedback: 2-3 encouraging, realistic sentences summarizing their strengths and progress.
2. mainMistakes: Up to 3 most important recurring mistakes made by the student (with exact correction and grammatical rationale).
3. newVocabulary: 3-4 impactful vocabulary words or professional expressions tailored to this engineering / business domain, with definitions and realistic example sentences.
4. usefulExpressions: 3-5 useful phrases they should keep handy for similar conversations.
5. Scores:
   - fluencyScore (integer 50-100 reflecting flow, sentence variety, and smoothness)
   - grammarScore (integer 50-100 reflecting grammatical correctness)
   - confidenceScore (integer 50-100 reflecting assertiveness and willingness to elaborate)
6. nextGoal: One specific, actionable goal to practice during the next 30-minute daily session.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallFeedback: { type: Type.STRING },
            mainMistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mistake: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['mistake', 'correction', 'reason'],
              },
            },
            newVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  example: { type: Type.STRING },
                },
                required: ['phrase', 'meaning', 'example'],
              },
            },
            usefulExpressions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            fluencyScore: { type: Type.INTEGER },
            grammarScore: { type: Type.INTEGER },
            confidenceScore: { type: Type.INTEGER },
            nextGoal: { type: Type.STRING },
          },
          required: [
            'overallFeedback',
            'mainMistakes',
            'newVocabulary',
            'usefulExpressions',
            'fluencyScore',
            'grammarScore',
            'confidenceScore',
            'nextGoal',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      overallFeedback: parsed.overallFeedback || 'Great work completing your spoken English practice session!',
      mainMistakes: parsed.mainMistakes || [],
      newVocabulary: parsed.newVocabulary || [],
      usefulExpressions: parsed.usefulExpressions || scenario.targetVocab,
      fluencyScore: parsed.fluencyScore || 80,
      grammarScore: parsed.grammarScore || 82,
      confidenceScore: parsed.confidenceScore || 85,
      nextGoal: parsed.nextGoal || 'Practice answering with fewer pauses and clearer topic sentences.',
    };
  } catch (err: any) {
    console.error('Error in generateSessionSummary:', err);
    return {
      overallFeedback: 'Session completed successfully! Continue practicing daily to build muscle memory.',
      mainMistakes: [],
      newVocabulary: scenario.targetVocab.slice(0, 3).map((v) => ({
        phrase: v,
        meaning: 'Target term for ' + scenario.title,
        example: `Let us address this ${v}.`,
      })),
      usefulExpressions: scenario.targetVocab,
      fluencyScore: 80,
      grammarScore: 82,
      confidenceScore: 80,
      nextGoal: 'Practice answering 3 questions without pauses tomorrow.',
    };
  }
}
