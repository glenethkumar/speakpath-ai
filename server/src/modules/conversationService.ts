import { AIProviderAdapter } from './aiProviderAdapter.js';
import { ConversationStateManager } from './conversationStateManager.js';
import { ProofreaderService, type ProofreaderResult } from './proofreaderService.js';
import { TranslationService } from './translationService.js';
import { limitTrailingQuestions, removeEmojis, CORE_TUTOR_GUIDELINES } from './tutorBehavior.js';
import { ConfigManager } from './configManager.js';
import { SCENARIOS } from '../prompts.js';

export interface ConversationTurnRequest {
  sessionId: string;
  scenarioId: string;
  userMessage: string;
  imageDataUrl?: string;
  nativeLanguage?: string;
  requestCorrection?: boolean;
  requestTranslation?: boolean;
}

export interface ConversationTurnResponse {
  success: boolean;
  sessionId: string;
  scenarioId: string;
  userMessage: string;
  chatReply: string;
  proofreader: ProofreaderResult;
  translatedReply?: string;
  speechSettings: {
    voice: string;
    lang: string;
    rate: number;
  };
  error?: string;
}

export class ConversationService {
  private adapter: AIProviderAdapter;
  private stateManager: ConversationStateManager;
  private proofreader: ProofreaderService;
  private translation: TranslationService;
  private config = ConfigManager.getInstance().getConfig();

  constructor(
    adapter: AIProviderAdapter,
    stateManager: ConversationStateManager,
    proofreader: ProofreaderService,
    translation: TranslationService
  ) {
    this.adapter = adapter;
    this.stateManager = stateManager;
    this.proofreader = proofreader;
    this.translation = translation;
  }

  /**
   * Processes a turn in the conversation following E-Bot's multi-agent workflow:
   * 1. Proofreader checks user message for grammar/spelling issues.
   * 2. Corrected text is fed to Chat Agent to prevent hallucinated errors.
   * 3. Question limiter trims trailing double-questions.
   * 4. Optional Translation Agent translates reply to user's native language.
   * 5. Turn pair is added to FIFO history.
   */
  public async processTurn(req: ConversationTurnRequest): Promise<ConversationTurnResponse> {
    const {
      sessionId,
      scenarioId = 'daily_conversation',
      userMessage,
      imageDataUrl,
      nativeLanguage,
      requestCorrection = true,
      requestTranslation = false,
    } = req;

    try {
      // 1. Proofreader Phase (E-Bot core innovation)
      let proofResult: ProofreaderResult = {
        hasErrors: false,
        originalText: userMessage,
        correctedText: userMessage,
        rawCorrection: '---',
      };

      if (requestCorrection && userMessage && userMessage.trim().length > 0) {
        proofResult = await this.proofreader.proofread(userMessage);
      }

      // Input to chat agent: if corrected, use corrected version so LLM doesn't hallucinate
      const textForChat = proofResult.hasErrors ? proofResult.correctedText : userMessage;

      // 2. Add user turn to conversation state
      this.stateManager.addUserTurn(sessionId, textForChat, imageDataUrl);

      // 3. Chat Agent Phase
      const scenario = SCENARIOS[scenarioId] || SCENARIOS['free_conversation'] || Object.values(SCENARIOS)[0];
      const session = this.stateManager.getOrCreateSession(sessionId, scenarioId);

      const systemPrompt = `You are SpeakPath AI, a friendly, encouraging personal English speaking coach with a ${session.mood} personality.
Your learner is an ambitious engineering student/professional seeking natural fluency, confident expression, and interview mastery.
Current Scenario: "${scenario.title}".
Context / Goal: ${scenario.description}

Key coaching guidelines:
${CORE_TUTOR_GUIDELINES}
- Incorporate vocabulary naturally where appropriate: ${scenario.targetVocab.slice(0, 5).join(', ')}.
- Never lecture or break character. Continue the interactive conversation naturally.
- When an image is provided, comment naturally on what you observe.`;

      const history = this.stateManager.getHistory(sessionId);

      const chatRes = await this.adapter.executeCall({
        systemPrompt,
        history,
        temperature: 0.5,
        maxTokens: 600,
      });

      if (!chatRes.success) {
        throw new Error(chatRes.error || 'Chat generation failed');
      }

      // 4. Backstop: Trailing question limiter from E-Bot
      let replyText = limitTrailingQuestions(chatRes.content.trim());
      replyText = removeEmojis(replyText);

      // 5. Add model turn to conversation state (enforces 20-pair FIFO)
      this.stateManager.addModelTurn(sessionId, replyText);

      // 6. Translation Phase (if requested and native language is set)
      let translatedReply: string | undefined;
      if (requestTranslation && nativeLanguage && nativeLanguage.toLowerCase() !== 'english') {
        translatedReply = await this.translation.translateResponse(replyText, nativeLanguage);
      }

      return {
        success: true,
        sessionId,
        scenarioId,
        userMessage,
        chatReply: replyText,
        proofreader: proofResult,
        translatedReply,
        speechSettings: {
          voice: this.config.defaultSpeechVoice,
          lang: this.config.defaultSpeechLangCode,
          rate: 1.0,
        },
      };
    } catch (err: any) {
      console.error('[ConversationService] Turn failed:', err);
      return {
        success: false,
        sessionId,
        scenarioId,
        userMessage,
        chatReply: "I'm sorry, I encountered a temporary connection issue. Could you please repeat that?",
        proofreader: {
          hasErrors: false,
          originalText: userMessage,
          correctedText: userMessage,
          rawCorrection: '---',
        },
        speechSettings: {
          voice: this.config.defaultSpeechVoice,
          lang: this.config.defaultSpeechLangCode,
          rate: 1.0,
        },
        error: err?.message || String(err),
      };
    }
  }
}
