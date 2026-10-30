/**
 * Speech Input Adapter
 * Extracted and decoupled from E-Bot-2026 (index.php lines 3570-3780)
 * Completely separated from DOM manipulation and HTML elements.
 */

export interface SpeechInputOptions {
  language?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string, isFatal: boolean) => void;
  onStateChange?: (isListening: boolean) => void;
}

export class SpeechInputAdapter {
  private recognition: any = null;
  private micShouldBeOn = false;
  private isTemporarilyPaused = false;
  private language = 'en-US';
  private onResult: (transcript: string, isFinal: boolean) => void;
  private onError?: (errorMessage: string, isFatal: boolean) => void;
  private onStateChange?: (isListening: boolean) => void;

  constructor(options: SpeechInputOptions) {
    this.language = options.language || 'en-US';
    this.onResult = options.onResult;
    this.onError = options.onError;
    this.onStateChange = options.onStateChange;
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public setLanguage(langCode: string): void {
    this.language = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  public start(): boolean {
    if (!SpeechInputAdapter.isSupported()) {
      this.onError?.('Speech recognition is not supported in this browser. Please use Chrome.', true);
      return false;
    }

    if (this.recognition) {
      this.stop();
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionConstructor();
    this.recognition.lang = this.language;
    this.recognition.continuous = false; // E-Bot mobile optimization
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript.trim().length > 0) {
        this.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim().length > 0) {
        this.onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      // 'no-speech' is non-fatal in E-Bot
      if (event.error === 'no-speech') {
        return;
      }

      let errorMsg = `Voice recognition error: ${event.error}`;
      let isFatal = false;

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMsg = 'Microphone permission was denied. Please allow microphone access.';
          isFatal = true;
          break;
        case 'audio-capture':
          errorMsg = 'No microphone was found. Please connect a microphone.';
          isFatal = true;
          break;
        case 'network':
          errorMsg = 'Network error interrupted speech recognition.';
          break;
      }

      if (isFatal) {
        this.micShouldBeOn = false;
        this.onStateChange?.(false);
      }
      this.onError?.(errorMsg, isFatal);
    };

    this.recognition.onend = () => {
      // E-Bot continuous listening simulation
      if (this.micShouldBeOn && !this.isTemporarilyPaused) {
        try {
          this.recognition.start();
        } catch {
          // Restart attempt in flight
        }
      } else if (!this.isTemporarilyPaused) {
        this.onStateChange?.(false);
      }
    };

    this.micShouldBeOn = true;
    this.isTemporarilyPaused = false;
    try {
      this.recognition.start();
      this.onStateChange?.(true);
      return true;
    } catch (err: any) {
      this.onError?.(`Failed to start microphone: ${err?.message || err}`, true);
      return false;
    }
  }

  public stop(): void {
    this.micShouldBeOn = false;
    this.isTemporarilyPaused = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this.recognition = null;
    }
    this.onStateChange?.(false);
  }

  /**
   * Temporary pause while AI speaks to suppress acoustic echo (E-Bot core innovation).
   */
  public pauseForPlayback(): void {
    if (!this.micShouldBeOn || !this.recognition) return;
    this.isTemporarilyPaused = true;
    try {
      this.recognition.stop();
    } catch {
      // Ignore
    }
  }

  /**
   * Resumes listening after AI finishes speaking.
   */
  public resumeAfterPlayback(): void {
    if (!this.micShouldBeOn) return;
    this.isTemporarilyPaused = false;
    try {
      this.recognition?.start();
      this.onStateChange?.(true);
    } catch {
      // Start may fail if already listening
    }
  }

  public isListening(): boolean {
    return this.micShouldBeOn && !this.isTemporarilyPaused;
  }
}
