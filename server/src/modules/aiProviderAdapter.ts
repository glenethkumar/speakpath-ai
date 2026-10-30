import { GoogleGenAI } from '@google/genai';
import { ConfigManager } from './configManager.js';
import type { ConversationTurn } from './conversationStateManager.js';

export interface ProviderCallParams {
  systemPrompt: string;
  userPrompt?: string;
  history?: ConversationTurn[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ProviderCallResponse {
  success: boolean;
  content: string;
  rawJson?: any;
  error?: string;
  provider: 'gemini' | 'openrouter';
}

export class AIProviderAdapter {
  private config = ConfigManager.getInstance().getConfig();
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    if (this.config.hasGeminiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: this.config.geminiApiKey });
    }
  }

  /**
   * Executes an AI model call with automatic retries and fallback handling.
   */
  public async executeCall(params: ProviderCallParams, maxRetries: number = 3): Promise<ProviderCallResponse> {
    const { systemPrompt, userPrompt, history = [], temperature = 0.5, maxTokens = 600, jsonMode = false } = params;

    let attempt = 0;
    let lastError = '';

    while (attempt < maxRetries) {
      attempt++;
      try {
        // 1. Try Gemini if configured
        if (this.geminiClient) {
          const contents: any[] = [];

          // Format previous history
          for (const turn of history) {
            const parts: any[] = [];
            for (const p of turn.parts) {
              if (p.text) parts.push({ text: p.text });
              if (p.image) {
                const matches = p.image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
                if (matches) {
                  parts.push({
                    inlineData: {
                      mimeType: matches[1],
                      data: matches[2],
                    },
                  });
                }
              }
            }
            if (parts.length > 0) {
              contents.push({
                role: turn.role === 'model' ? 'model' : 'user',
                parts,
              });
            }
          }

          // Append current turn if provided
          if (userPrompt && userPrompt.trim().length > 0) {
            contents.push({
              role: 'user',
              parts: [{ text: userPrompt }],
            });
          }

          const response = await this.geminiClient.models.generateContent({
            model: 'gemini-3.5-flash',
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            },
          });

          const text = response.text || '';
          let rawJson: any = null;
          if (jsonMode && text) {
            try {
              rawJson = JSON.parse(text);
            } catch {
              const cleaned = text.replace(/```(?:json)?/gi, '').trim();
              try {
                rawJson = JSON.parse(cleaned);
              } catch {
                const match = cleaned.match(/\{[\s\S]*\}/);
                if (match) {
                  try {
                    rawJson = JSON.parse(match[0]);
                  } catch {}
                }
              }
            }
          }

          return {
            success: true,
            content: text,
            rawJson,
            provider: 'gemini',
          };
        }

        // 2. Fallback to OpenRouter (E-Bot native provider) if configured
        if (this.config.hasOpenRouter && this.config.openRouterApiKey) {
          const openRouterMessages: any[] = [{ role: 'system', content: systemPrompt }];

          for (const turn of history) {
            const role = turn.role === 'model' ? 'assistant' : 'user';
            const textParts: string[] = [];
            let imageUrl: string | null = null;

            for (const p of turn.parts) {
              if (p.text) textParts.push(p.text);
              if (p.image) imageUrl = p.image;
            }

            if (imageUrl) {
              openRouterMessages.push({
                role,
                content: [
                  ...(textParts.length ? [{ type: 'text', text: textParts.join(' ') }] : []),
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              });
            } else {
              openRouterMessages.push({ role, content: textParts.join(' ') });
            }
          }

          if (userPrompt) {
            openRouterMessages.push({ role: 'user', content: userPrompt });
          }

          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.config.openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://speakpath.ai',
              'X-Title': 'SpeakPath AI',
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.7-flash',
              provider: { order: ['alibaba'], allow_fallbacks: false },
              messages: openRouterMessages,
              temperature,
              max_tokens: maxTokens,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
          }

          const data = (await res.json()) as any;
          const replyContent = data.choices?.[0]?.message?.content || '';

          let rawJson: any = null;
          if (jsonMode) {
            try {
              rawJson = JSON.parse(replyContent);
            } catch {
              // Ignore JSON parse failure
            }
          }

          return {
            success: true,
            content: replyContent,
            rawJson,
            provider: 'openrouter',
          };
        }

        throw new Error('No AI provider configured (neither GEMINI_API_KEY nor OPENROUTER_API_KEY available)');
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[AIProviderAdapter] Attempt ${attempt} failed: ${lastError}`);
        // Exponential backoff wait (500ms, 1000ms...)
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }

    return {
      success: false,
      content: '',
      error: `All ${maxRetries} API attempts failed. Error: ${lastError}`,
      provider: this.geminiClient ? 'gemini' : 'openrouter',
    };
  }
}
