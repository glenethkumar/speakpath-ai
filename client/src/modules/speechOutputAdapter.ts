/**
 * Speech Output Adapter
 * Extracted and decoupled from E-Bot-2026 (index.php lines 2020-2235)
 * Completely separated from DOM manipulation and HTML elements.
 */

export interface SpeechOutputOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class SpeechOutputAdapter {
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStart?: () => void;
  private onEnd?: () => void;
  private onError?: (err: any) => void;

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  constructor(options?: SpeechOutputOptions) {
    this.onStart = options?.onStart;
    this.onEnd = options?.onEnd;
    this.onError = options?.onError;
    SpeechOutputAdapter.initVoices();
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private static initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    SpeechOutputAdapter.cachedVoices = window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        SpeechOutputAdapter.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Finds the best voice based on requested name, E-Bot fallback chain, or language code.
   */
  public static findVoice(
    requestedName: string = 'Google UK English Female',
    langCode: string = 'en-GB'
  ): SpeechSynthesisVoice | null {
    if (!SpeechOutputAdapter.isSupported()) return null;
    const voices = SpeechOutputAdapter.cachedVoices.length
      ? SpeechOutputAdapter.cachedVoices
      : window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) return null;

    // 1. Direct match on requested voice name
    if (requestedName) {
      const match = voices.find((v) => v.name.toLowerCase() === requestedName.toLowerCase());
      if (match) return match;
    }

    // 2. E-Bot English fallback chain (Arthur -> Daniel -> Samantha)
    if (langCode && langCode.toLowerCase().startsWith('en')) {
      const fallbackChain = [
        { name: 'Arthur', lang: 'en-GB' },
        { name: 'Daniel', lang: 'en-GB' },
        { name: 'Samantha', lang: 'en-US' },
        { name: 'Google US English', lang: 'en-US' },
      ];

      for (const candidate of fallbackChain) {
        const match = voices.find(
          (v) =>
            v.name.toLowerCase().includes(candidate.name.toLowerCase()) &&
            v.lang.toLowerCase().startsWith(candidate.lang.toLowerCase().slice(0, 2))
        );
        if (match) return match;
      }
    }

    // 3. Fallback to any voice matching language code
    const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase().slice(0, 2)));
    return langMatch || voices[0] || null;
  }

  /**
   * Speaks text using SpeechSynthesis with Chromium teardown delay protection.
   */
  public speak(
    text: string,
    options?: {
      voiceName?: string;
      langCode?: string;
      rate?: number;
    }
  ): void {
    if (!SpeechOutputAdapter.isSupported() || !text || text.trim().length === 0) {
      return;
    }

    // Cancel any previous utterance (E-Bot quiet_please)
    this.stop();

    const voiceName = options?.voiceName || 'Google UK English Female';
    const langCode = options?.langCode || 'en-GB';
    const rate = options?.rate ?? 1.0;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;

    const selectedVoice = SpeechOutputAdapter.findVoice(voiceName, langCode);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.onEnd?.();
    };

    utterance.onerror = (event: any) => {
      this.currentUtterance = null;
      // 'interrupted' and 'canceled' are standard when canceling mid-speech
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('[SpeechOutputAdapter] TTS error:', event.error);
        this.onError?.(event);
      }
      this.onEnd?.();
    };

    this.currentUtterance = utterance;

    // E-Bot 50ms deferral: fixes Chromium bug where cancel() silently drops immediate speak()
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }

  /**
   * Cancels any ongoing speech synthesis immediately.
   */
  public stop(): void {
    if (SpeechOutputAdapter.isSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}
