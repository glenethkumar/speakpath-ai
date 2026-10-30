import { AIProviderAdapter } from './aiProviderAdapter.js';
import { removeEmojis, sanitizeUserInput } from './tutorBehavior.js';

export interface ProofreaderResult {
  hasErrors: boolean;
  originalText: string;
  correctedText: string;
  rawCorrection: string;
  explanation?: string;
  errorCategories?: string[];
  suggestedPhrasing?: string;
}

export class ProofreaderService {
  private adapter: AIProviderAdapter;

  constructor(adapter: AIProviderAdapter) {
    this.adapter = adapter;
  }

  /**
   * Proofreads a user's spoken sentence using the E-Bot-2026 prompt checklist
   * adapted into structured output with educational diagnostics.
   */
  public async proofread(userMessage: string): Promise<ProofreaderResult> {
    const cleanedInput = sanitizeUserInput(userMessage);

    if (!cleanedInput || cleanedInput.trim().length === 0) {
      return {
        hasErrors: false,
        originalText: userMessage,
        correctedText: userMessage,
        rawCorrection: '---',
      };
    }

    const proofreaderSystemPrompt = `You are a highly skilled British English language proofreader and coach.
You will be given English text delimited by triple hash tags (###).
Your task is to correct EVERY spelling, punctuation, and grammar error in the text.
Use British English spelling conventions (e.g. "colour" not "color", "organise" not "organize").

Check specifically for these common learner mistakes:
- Missing or wrong forms of "to be" (e.g. "I fine" -> "I'm fine", "he happy" -> "he's happy")
- Missing or wrong auxiliary/helping verbs (e.g. "I go there yesterday" -> "I went there yesterday")
- Subject-verb agreement (e.g. "she like" -> "she likes")
- Missing articles ("a", "an", "the") where one is needed
- Wrong or missing prepositions
- Verb tense errors
- Expanding informal abbreviations to standard words (e.g. "thx" -> "thanks", "u" -> "you")
- Common Indian English transfers (e.g. "prepone", "passed out of college", "doing the needful")

If the original text does not contain any errors at all, set "correction" to "---".
Otherwise, provide the fully corrected sentence and an actionable, friendly 1-sentence tip.

Output JSON with the following schema:
{
  "correction": "<Your corrected version of the user_message or --->",
  "hasErrors": <true/false>,
  "explanation": "<Brief explanation of what was corrected, or empty if none>",
  "categories": ["grammar" | "spelling" | "preposition" | "tense" | "article" | "vocabulary"]
}`;

    const promptText = `###${cleanedInput}###`;

    const res = await this.adapter.executeCall({
      systemPrompt: proofreaderSystemPrompt,
      userPrompt: promptText,
      temperature: 0.2, // Low temperature for high precision
      jsonMode: true,
      maxTokens: 800,
    });

    let rawCorrection = '---';
    let explanation = '';
    let categories: string[] = [];

    if (res.success && res.rawJson) {
      rawCorrection = res.rawJson.correction || '---';
      explanation = res.rawJson.explanation || '';
      categories = res.rawJson.categories || [];
    } else if (res.success && res.content) {
      // Fallback text parsing if JSON was malformed
      rawCorrection = res.content.trim();
    }

    // Clean delimiters and emojis from correction
    let cleanedCorrection = removeEmojis(rawCorrection.replace(/###/g, '').trim());

    // E-Bot backstop logic:
    // 1. If output is '---' or '--', no errors found
    // 2. If model returned text identical to original input, treat as '---'
    const isFlawless =
      cleanedCorrection === '---' ||
      cleanedCorrection === '--' ||
      cleanedCorrection.toLowerCase() === cleanedInput.toLowerCase();

    if (isFlawless) {
      return {
        hasErrors: false,
        originalText: cleanedInput,
        correctedText: cleanedInput,
        rawCorrection: '---',
        explanation: 'Excellent! Your sentence was natural and grammatically flawless.',
      };
    }

    return {
      hasErrors: true,
      originalText: cleanedInput,
      correctedText: cleanedCorrection,
      rawCorrection: cleanedCorrection,
      explanation,
      errorCategories: categories,
      suggestedPhrasing: cleanedCorrection,
    };
  }
}
