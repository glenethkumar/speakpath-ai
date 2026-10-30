/**
 * Tutor Behavior and Text Processing Module
 * Extracted and adapted from E-Bot-2026 (main.php lines 318-340, 525-541, 1138-1160)
 */

/**
 * Backstop for the "LLM always ends with two questions" habit.
 * If the reply's last two sentences both end in "?", drops the final
 * question so the reply ends on its second-to-last sentence instead.
 * Preserves questions earlier in the message.
 */
export function limitTrailingQuestions(text: string): string {
  if (!text || text.trim() === '') return text;

  // Split into sentences, keeping terminal punctuation attached
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)/gu);
  if (!matches || matches.length < 2) {
    return text;
  }

  const sentences = [...matches];
  const last = sentences[sentences.length - 1].trim();
  const secondToLast = sentences[sentences.length - 2].trim();

  const lastIsQuestion = last.endsWith('?');
  const secondIsQuestion = secondToLast.endsWith('?');

  if (lastIsQuestion && secondIsQuestion) {
    // Drop the final question
    sentences.pop();
    return sentences.join('').trim();
  }

  return text;
}

/**
 * Removes emojis and decorative pictographs from text to ensure
 * clean TTS synthesis and distraction-free learning displays.
 * Extracted from E-Bot removeEmojis()
 */
export function removeEmojis(text: string): string {
  if (!text) return '';
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;
  return text.replace(emojiRegex, '').trim();
}

/**
 * Cleans user text by stripping slashes, HTML tags, and trailing whitespace.
 * Extracted from E-Bot test_input()
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/\\/g, '')        // Strip slashes
    .trim();
}

/**
 * Core tutor coaching system guidelines (British English, 1 question max, concise).
 */
export const CORE_TUTOR_GUIDELINES = `
- Speak in warm, natural, professional British/neutral English.
- Use standard British spelling and vocabulary (e.g., "colour", "organise", "programme").
- Avoid casual Americanisms (e.g., "chilling", "buddy", "gotta").
- Avoid confusing idioms and phrasal slang that confuse non-native speakers.
- Keep responses concise (2 to 4 sentences).
- Ask at most ONE question per reply, and only when it naturally deepens the practice.
- Never stack multiple questions in the same reply.
`;
