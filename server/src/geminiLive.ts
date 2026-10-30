import { WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from './config.js';
import { SCENARIOS } from './prompts.js';
import { analyzeTurn } from './feedbackService.js';

export async function createLiveEphemeralToken(scenarioId: string = 'free_conversation') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: expireTime,
      newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    },
  });

  return token;
}

export function handleGeminiLiveWebSocket(clientWs: WebSocket) {
  let session: any = null;
  let scenarioId = 'free_conversation';
  let style: 'gentle' | 'balanced' | 'detailed' = 'balanced';
  let currentUserText = '';
  let currentAiText = '';
  let isConnecting = false;

  const safeSend = (payload: any) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to send payload to client:', err);
      }
    }
  };

  const initSession = async (reqScenario: string, reqStyle: 'gentle' | 'balanced' | 'detailed') => {
    if (isConnecting) return;
    isConnecting = true;
    scenarioId = reqScenario || 'free_conversation';
    style = reqStyle || 'balanced';

    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
      safeSend({
        type: 'error',
        code: 'API_KEY_MISSING',
        message: 'Google Gemini API Key is missing. Please add GEMINI_API_KEY to your server .env file.',
      });
      isConnecting = false;
      return;
    }

    const scenario = SCENARIOS[scenarioId] || SCENARIOS.free_conversation;

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      safeSend({ type: 'status', status: 'connecting', message: 'Connecting to Gemini Live Coach...' });

      // Connect to Gemini Live API
      // Model priority: gemini-2.5-flash or gemini-3.1-flash-live-preview
      const liveModel = 'gemini-3.1-flash-live-preview';

      session = await ai.live.connect({
        model: liveModel,
        config: {
          responseModalities: ['AUDIO' as any],
          systemInstruction: {
            parts: [{ text: scenario.systemPrompt }],
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log(`[GeminiLive] Connected for scenario: ${scenario.title}`);
            safeSend({
              type: 'ready',
              scenario: scenario.id,
              scenarioTitle: scenario.title,
              starterPrompt: scenario.starterPrompt,
            });

            // Prompt Gemini Coach to begin the conversation with the scenario starter
            try {
              session.sendRealtimeInput({
                text: `You are starting this mock session now. Greet the engineering student warmly and ask: "${scenario.starterPrompt}"`,
              });
            } catch (err) {
              console.error('Error sending initial coach prompt:', err);
            }
          },
          onmessage: async (serverMsg: any) => {
            const content = serverMsg?.serverContent;
            if (!content) return;

            // 1. Audio stream from model turn
            if (content.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                if (part.inlineData?.data) {
                  safeSend({
                    type: 'audio',
                    data: part.inlineData.data, // base64 24kHz PCM
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                  });
                }
              }
            }

            // 2. Transcriptions
            if (content.inputTranscription?.text) {
              const text = content.inputTranscription.text;
              currentUserText += (currentUserText ? ' ' : '') + text;
              safeSend({
                type: 'user_transcript',
                text,
                fullText: currentUserText,
                isInterim: false,
              });
            }

            if (content.interimInputTranscription?.text) {
              safeSend({
                type: 'user_transcript',
                text: content.interimInputTranscription.text,
                fullText: currentUserText + ' ' + content.interimInputTranscription.text,
                isInterim: true,
              });
            }

            if (content.outputTranscription?.text) {
              const text = content.outputTranscription.text;
              currentAiText += (currentAiText ? ' ' : '') + text;
              safeSend({
                type: 'ai_transcript',
                text,
                fullText: currentAiText,
              });
            }

            // 3. User interruption
            if (content.interrupted) {
              safeSend({ type: 'interrupted' });
              currentAiText = '';
            }

            // 4. Turn completion: trigger feedback analysis for user's turn
            if (content.turnComplete) {
              safeSend({
                type: 'turn_complete',
                userText: currentUserText,
                aiText: currentAiText,
              });

              if (currentUserText.trim().length > 3) {
                const turnToAnalyze = currentUserText;
                currentUserText = '';
                currentAiText = '';

                // Asynchronously generate English feedback for this turn
                try {
                  const feedback = await analyzeTurn({
                    originalText: turnToAnalyze,
                    scenarioId,
                    style,
                  });
                  safeSend({
                    type: 'feedback',
                    feedback,
                  });
                } catch (fbErr: any) {
                  console.error('Error generating turn feedback:', fbErr);
                }
              } else {
                currentUserText = '';
                currentAiText = '';
              }
            }
          },
          onerror: (err: any) => {
            console.error('[GeminiLive] Session error:', err);
            safeSend({
              type: 'error',
              code: 'GEMINI_ERROR',
              message: err?.message || 'Gemini Live encountered an error.',
            });
          },
          onclose: (closeEvent: any) => {
            console.log('[GeminiLive] Connection closed:', closeEvent?.reason || '');
            safeSend({
              type: 'closed',
              reason: closeEvent?.reason || 'Session ended',
            });
          },
        },
      });
    } catch (err: any) {
      console.error('[GeminiLive] Init failed:', err);
      safeSend({
        type: 'error',
        code: 'CONNECTION_FAILED',
        message: err?.message || 'Failed to establish Gemini Live connection.',
      });
    } finally {
      isConnecting = false;
    }
  };

  clientWs.on('message', async (data: any) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'setup':
        case 'start':
          await initSession(msg.scenario, msg.style);
          break;

        case 'audio':
          if (session && msg.data) {
            session.sendRealtimeInput({
              audio: {
                data: msg.data, // base64 16kHz PCM
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
          break;

        case 'audio_stream_end':
          if (session) {
            session.sendRealtimeInput({
              audioStreamEnd: true,
            });
          }
          break;

        case 'text':
          if (session && msg.text) {
            currentUserText += (currentUserText ? ' ' : '') + msg.text;
            safeSend({
              type: 'user_transcript',
              text: msg.text,
              fullText: currentUserText,
              isInterim: false,
            });
            session.sendRealtimeInput({
              text: msg.text,
            });
          }
          break;

        case 'stop':
        case 'end_session':
          if (session) {
            try {
              session.close();
            } catch (err) {}
            session = null;
          }
          safeSend({ type: 'session_ended' });
          break;

        default:
          console.warn('Unknown client message type:', msg.type);
      }
    } catch (parseErr) {
      console.error('Failed to parse incoming WebSocket message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    if (session) {
      try {
        session.close();
      } catch (err) {}
      session = null;
    }
  });

  clientWs.on('error', (wsErr) => {
    console.error('Client WebSocket error:', wsErr);
    if (session) {
      try {
        session.close();
      } catch (err) {}
      session = null;
    }
  });
}
