import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import { PORT, getServiceStatus } from './config.js';
import { SCENARIOS } from './prompts.js';
import { analyzeTurn, generateSessionSummary } from './feedbackService.js';
import { createLiveKitToken } from './livekitService.js';
import { handleGeminiLiveWebSocket, createLiveEphemeralToken } from './geminiLive.js';

// Extracted Functional Modules
import { ConfigManager } from './modules/configManager.js';
import { AIProviderAdapter } from './modules/aiProviderAdapter.js';
import { ConversationStateManager } from './modules/conversationStateManager.js';
import { ProofreaderService } from './modules/proofreaderService.js';
import { TranslationService } from './modules/translationService.js';
import { ConversationService } from './modules/conversationService.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Initialize Module Layer
const aiAdapter = new AIProviderAdapter();
const stateManager = new ConversationStateManager(20);
const proofreaderService = new ProofreaderService(aiAdapter);
const translationService = new TranslationService(aiAdapter);
const conversationService = new ConversationService(
  aiAdapter,
  stateManager,
  proofreaderService,
  translationService
);

// 1. Health & Config status
app.get('/api/health', (req, res) => {
  const status = getServiceStatus();
  const moduleStatus = ConfigManager.getInstance().getPublicStatus();
  res.json({
    ok: true,
    status,
    modules: moduleStatus,
    timestamp: new Date().toISOString(),
  });
});

// 2. Learning Scenarios (8 engineering career scenarios)
app.get('/api/scenarios', (req, res) => {
  res.json({
    scenarios: Object.values(SCENARIOS),
  });
});

// 3. Supported Languages (86 languages from E-Bot)
app.get('/api/languages', (req, res) => {
  res.json({
    languages: translationService.getSupportedLanguages(),
  });
});

// 4. Extracted Multi-Agent Conversation Turn
// (Proofreader -> Chat Agent -> Trailing Question Limiter -> Translation)
app.post('/api/conversation/turn', async (req, res) => {
  try {
    const {
      sessionId = 'default-session',
      scenarioId = 'daily_conversation',
      userMessage,
      imageDataUrl,
      nativeLanguage,
      requestCorrection = true,
      requestTranslation = false,
    } = req.body;

    if (!userMessage && !imageDataUrl) {
      return res.status(400).json({ error: 'Either userMessage or imageDataUrl must be provided.' });
    }

    const response = await conversationService.processTurn({
      sessionId,
      scenarioId,
      userMessage: userMessage || '',
      imageDataUrl,
      nativeLanguage,
      requestCorrection,
      requestTranslation,
    });

    res.json(response);
  } catch (err: any) {
    console.error('Conversation turn error:', err);
    res.status(500).json({ error: err?.message || 'Failed to process conversation turn' });
  }
});

// 5. Extracted Stateless Quick Phrase Translator (Native Language -> British English)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, userLanguage } = req.body;
    if (!text || !userLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Both "text" and "userLanguage" are required.',
      });
    }

    const result = await translationService.translateQuickPhrase(text, userLanguage);
    res.json(result);
  } catch (err: any) {
    console.error('Quick translation error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Translation service failed',
    });
  }
});

// 6. Structured Turn Feedback (Detailed Pedagogical Analysis)
app.post('/api/feedback/turn', async (req, res) => {
  try {
    const { text, scenario, style, context } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text field is required for feedback analysis.' });
    }
    const feedback = await analyzeTurn({
      originalText: text,
      scenarioId: scenario,
      style,
      previousDialogue: context,
    });
    res.json({ feedback });
  } catch (err: any) {
    console.error('Turn feedback error:', err);
    res.status(500).json({ error: err?.message || 'Failed to analyze turn feedback' });
  }
});

// 7. Session Summary Report
app.post('/api/feedback/summary', async (req, res) => {
  try {
    const { turns, scenario, durationMinutes } = req.body;
    const summary = await generateSessionSummary({
      turns: turns || [],
      scenarioId: scenario,
      durationMinutes: durationMinutes || 5,
    });
    res.json({ summary });
  } catch (err: any) {
    console.error('Session summary error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate session summary' });
  }
});

// 8. LiveKit Room Access Token
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    const result = await createLiveKitToken(roomName, participantName);
    res.json(result);
  } catch (err: any) {
    console.error('LiveKit token error:', err);
    res.status(503).json({
      error: err?.message || 'Failed to generate LiveKit token. Check LIVEKIT_* credentials.',
    });
  }
});

// 9. Gemini Live Ephemeral Token
app.get('/api/live/token', async (req, res) => {
  try {
    const scenario = (req.query.scenario as string) || 'daily_conversation';
    const token = await createLiveEphemeralToken(scenario);
    res.json({ token: token.name, expireTime: token.expireTime });
  } catch (err: any) {
    console.error('Gemini ephemeral token error:', err);
    res.status(503).json({
      error: err?.message || 'Failed to generate Gemini ephemeral token. Check GEMINI_API_KEY in .env.',
    });
  }
});

// 10. Clear Session History (Privacy & State Management)
app.delete('/api/history', (req, res) => {
  const sessionId = (req.query.sessionId as string) || 'default-session';
  stateManager.clearSession(sessionId);
  res.json({ ok: true, message: `Session ${sessionId} cleared successfully.` });
});

// 11. Optional Static Asset Serving (Unified Production Fallback)
const clientDistPath = fs.existsSync(path.resolve(__dirname, '../../client/dist'))
  ? path.resolve(__dirname, '../../client/dist')
  : path.resolve(process.cwd(), 'client/dist');

if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend bundle from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected to /api/live/ws');
  handleGeminiLiveWebSocket(ws);
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url?.split('?')[0];
  if (pathname === '/api/live/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SpeakPath AI Backend running at http://localhost:${PORT}`);
  console.log(` LiveKit endpoint: http://localhost:${PORT}/api/livekit/token`);
  console.log(` Multi-agent Turn: http://localhost:${PORT}/api/conversation/turn`);
  console.log(` Quick Translator: http://localhost:${PORT}/api/translate`);
  console.log(` Gemini Live WS:   ws://localhost:${PORT}/api/live/ws`);
  console.log(` Modules:          Proofreader, StateManager, Translation (86 langs)`);
  console.log(`====================================================`);
});
