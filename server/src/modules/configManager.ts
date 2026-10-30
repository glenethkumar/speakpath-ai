import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  geminiApiKey: string;
  hasGeminiKey: boolean;
  livekitApiKey?: string;
  livekitApiSecret?: string;
  livekitUrl?: string;
  hasLivekit: boolean;
  openRouterApiKey?: string;
  hasOpenRouter: boolean;
  maxHistoryPairs: number;
  defaultSpeechVoice: string;
  defaultSpeechLangCode: string;
  translatorMaxChars: number;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const livekitApiKey = process.env.LIVEKIT_API_KEY || '';
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET || '';
    const livekitUrl = process.env.LIVEKIT_URL || '';
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';

    this.config = {
      port: Number(process.env.PORT) || 5000,
      geminiApiKey,
      hasGeminiKey: geminiApiKey.trim().length > 0,
      livekitApiKey,
      livekitApiSecret,
      livekitUrl,
      hasLivekit: livekitApiKey.trim().length > 0 && livekitApiSecret.trim().length > 0 && livekitUrl.trim().length > 0,
      openRouterApiKey,
      hasOpenRouter: openRouterApiKey.trim().length > 0,
      maxHistoryPairs: Number(process.env.MAX_HISTORY_PAIRS) || 20,
      defaultSpeechVoice: process.env.DEFAULT_SPEECH_VOICE || 'Google UK English Female',
      defaultSpeechLangCode: process.env.DEFAULT_SPEECH_LANG || 'en-GB',
      translatorMaxChars: 1000,
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getPublicStatus() {
    return {
      status: 'operational',
      hasGemini: this.config.hasGeminiKey,
      hasLivekit: this.config.hasLivekit,
      hasOpenRouter: this.config.hasOpenRouter,
      defaultVoice: this.config.defaultSpeechVoice,
      defaultLang: this.config.defaultSpeechLangCode,
      maxHistoryPairs: this.config.maxHistoryPairs,
      translatorMaxChars: this.config.translatorMaxChars,
    };
  }
}
