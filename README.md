# SpeakPath AI — Personal Voice-Based English Coach

> A functional, responsive web application designed for a B.Tech second-year engineering student to master spoken English, technical articulation, campus placement interviews, client communication, and tech entrepreneurship pitching.

---

## 🌟 Key Features

1. **Real-Time Voice Conversation Studio**:
   - Live bidirectional microphone streaming and voice responses powered by **Gemini Live API** (`gemini-2.5-flash` / `gemini-3.1-flash-live-preview`).
   - Natural, conversational coach persona (*Alex*) tailored for engineering undergraduates: asks one question at a time, listens patiently, and maintains full conversational context without interrupting for minor grammar slips.
   - Prominent reactive microphone orb, dynamic audio waveform visualizer (reflects real-time microphone volume and coach speaking frequencies), mute/unmute, and instant interrupt controls.

2. **Turn-by-Turn English Feedback Panel**:
   - For every completed user turn:
     - **Original Transcript**: Word-for-word record of what you said.
     - **Corrected English**: Grammatically sound phrasing with quick-copy support.
     - **Natural & Professional Alternative**: How a senior engineer or native speaker would express the thought.
     - **Grammar & Vocabulary Explanation**: Clear, encouraging explanation of the rule or preposition.
     - **Key Workplace Phrase / Idiom**: Actionable engineering phrase to build your vocabulary.
     - **Practise & Repeat Drill**: Native model voice pronunciation via Web Speech Synthesis, plus an interactive speech repetition evaluator to practice aloud.

3. **8 Tailored B.Tech Learning Scenarios**:
   - **Free Conversation & Campus Life**: Low-pressure warm-up, engineering labs, college fests, hobbies, and aspirations.
   - **Daily English & Social Etiquette**: Coffee shops, polite requests, small talk, and networking.
   - **Job Interview & HR Questions**: Behavioral questions, "Tell me about yourself", and STAR technique for campus placements.
   - **Technical Interview & Project Explanation**: System architecture trade-offs, database selection, debugging blockers, and algorithms.
   - **Presentation & Group Discussion (GD)**: Initiating arguments, diplomatic disagreement, agreeing with nuances, and slide talks.
   - **Client Meetings & Professional Calls**: Agile standup updates, communicating sprint delays, and managing client expectations.
   - **Business Negotiation & Sales**: Defending project quote values, handling discount objections, and win-win scope adjustments.
   - **Startup Pitch & Entrepreneurship**: 60-second elevator pitch, TAM/SAM, monetization models, and angel investor Q&A.

4. **Adjustable Correction Styles**:
   - **Gentle**: Encouragement-first; flags only major errors that impede comprehension.
   - **Balanced** *(Default)*: Natural conversational flow with 1–2 actionable improvements per turn.
   - **Detailed**: In-depth grammatical nuances, vocabulary upgrades, and formal workplace polish.

5. **30-Minute Daily Practice Plan**:
   - Interactive 4-stage daily routine adapting from casual warm-up to technical defense:
     - **Stage 1 (5 min)**: Warm-up & Fluency Activation
     - **Stage 2 (10 min)**: Core Scenario (Tech Viva / Project Explanation)
     - **Stage 3 (10 min)**: High-Stakes Communication (Placement HR / GD / Client Meeting)
     - **Stage 4 (5 min)**: Review, Vocabulary Drill & Sentence Repetition
   - Built-in stage completion tracker.

6. **Session Summary Diagnostic Reports**:
   - Generated at the end of each session:
     - Diagnostic scores: **Fluency** (50–100), **Grammar** (50–100), and **Confidence** (50–100).
     - Top 3 recurring mistake patterns with grammatical rationale.
     - Newly unlocked professional vocabulary words with definitions and realistic example sentences.
     - Tomorrow's actionable practice goal.
     - One-click report copy for personal notes.

7. **Progress Analytics & Vocabulary Vault**:
   - Tracks total practice minutes, completed sessions, and daily streak.
   - Recurring error distribution breakdown (Grammar, Vocabulary, Clarity, Filler words).
   - Searchable **Vocabulary Vault** cataloging all idiomatic expressions unlocked across sessions with audio pronunciation.
   - Privacy controls: Strict local-only data retention, opt-in audio consent, and a one-click **"Clear All Learning History"** safeguard.

---

## 🏛️ E-Bot-2026 Functional Extraction & Architecture

SpeakPath AI reuses the underlying business logic, AI workflows, and multi-agent educational concepts from [E-Bot-2026](https://github.com/vbookshelf/E-Bot-2026) (v3.5) **without copying its UI/UX, CSS styling, HTML layout, or retro visual elements**.

Instead, the presentation foundation adopts the modern, glassmorphic design and WebRTC streaming architecture of [LiveKit Agent Starter React](https://github.com/livekit-examples/agent-starter-react).

> 📖 **Deep Architectural Audit**: See the complete [Functional Architecture Document](docs/EBOT_FUNCTIONAL_ARCHITECTURE.md) for detailed analysis of the 10 core subsystems.  
> 📜 **Open Source Licensing**: See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for preserved MIT license notices for both `vbookshelf` and `LiveKit, Inc.`.

### Module Inventory & Separation

| Functional Module | Origin / Underlying Mechanics | SpeakPath AI Implementation | Presentation Separation |
|---|---|---|---|
| **English Proofreader Service** | E-Bot `main.php` (Proofreader Agent): `###` delimiters, common learner mistake checklist, `---` flawless flag | `server/src/modules/proofreaderService.ts` | Decoupled; outputs structured JSON with explanation & categories. |
| **Trailing Question Limiter** | E-Bot `main.php` (`limit_trailing_questions`): regex trimming trailing double questions | `server/src/modules/tutorBehavior.ts` | Clean regex utility function with zero DOM dependency. |
| **FIFO Conversation Manager** | E-Bot `main.php` (`max_history_pairs = 20`): dual-turn popping preserving user+model pairs | `server/src/modules/conversationStateManager.ts` | In-memory session manager with multimodal vision support. |
| **86-Language Translation Service** | E-Bot `supported-languages-ebot.json` + one-shot translation agent | `server/src/modules/translationService.ts` | Exposes `/api/translate` and `/api/languages` endpoints. |
| **Stateless Quick Translator Tool** | E-Bot `main.php` (Translator overlay): <1000 char word/phrase lookup | `client/src/components/QuickTranslatorModal.tsx` | Modern dark glassmorphic modal with instant audio playback. |
| **Speech Input Adapter** | E-Bot `index.php` (Web Speech API lifecycle, mobile optimization, continuous restart) | `client/src/modules/speechInputAdapter.ts` | Decoupled class emitting typed callbacks; zero HTML/DOM coupling. |
| **Speech Output Adapter** | E-Bot `index.php` (SpeechSynthesis, Arthur/Daniel/Samantha fallback, Chromium 50ms fix) | `client/src/modules/speechOutputAdapter.ts` | Standalone audio player with voice fallback priority chain. |
| **Image Vision Compressor** | E-Bot `index.php` (`compressImageForUpload`): Canvas downscaling (1024px, 0.7 JPEG) | `client/src/modules/imageCompressor.ts` | Reusable Promise-based client utility emitting base64 data URLs. |
| **Practice Plan Engine** | E-Bot `index.php` (`PLAN_PROMPTS` 7 prompts) + B.Tech career simulations | `client/src/modules/practicePlan.ts` & `PracticePlanModal.tsx` | Interactive checklist with progress bar and one-click voice coach start. |
| **LiveKit Voice Studio** | LiveKit Agent Starter React foundation (`agent-session-view`, visualizers, control bar) | `client/src/components/VoiceCoach.tsx` & `AudioVisualizer.tsx` | High-fidelity dark mode with reactive waveforms and control pills. |
| **Gemini Live Stream** | Newly created SpeakPath AI real-time audio pipeline | `server/src/geminiLive.ts` & `useVoiceSession.ts` | 16kHz PCM bidirectional WebSockets streaming to Gemini Live. |

---

## 🏗️ Architecture

```
English learning app/
├── client/                     # Frontend (React 19, TypeScript, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Header with tabs, streak pill, settings trigger
│   │   │   ├── StatusBanner.tsx       # Live status & API key setup prompt
│   │   │   ├── VoiceCoach.tsx         # Central voice studio with reactive mic controls
│   │   │   ├── AudioVisualizer.tsx    # Real-time Web Audio canvas waveform visualizer
│   │   │   ├── FeedbackPanel.tsx      # Turn-by-turn cards & Practise/Repeat drills
│   │   │   ├── ScenarioSelector.tsx   # 8 learning modes with category filtering
│   │   │   ├── DailyPlan.tsx          # 30-min structured daily practice protocol
│   │   │   ├── ProgressDashboard.tsx  # Metrics, error breakdown & Vocab Vault
│   │   │   ├── SessionSummaryModal.tsx# Post-session diagnostic evaluation modal
│   │   │   ├── SettingsModal.tsx      # Correction style, API test & privacy settings
│   │   │   └── HelpModal.tsx          # Orientation & engineering speaking tips
│   │   ├── hooks/
│   │   │   ├── useVoiceSession.ts     # Web Audio PCM 16kHz capture & 24kHz playback
│   │   │   └── useProgressStorage.ts  # LocalStorage persistence & privacy controls
│   │   ├── utils/
│   │   │   └── audioUtils.ts          # PCM downsampler, Base64 encoder & PCMPlayer
│   │   ├── types/                     # Shared TypeScript data models
│   │   ├── App.tsx                    # Main responsive layout container
│   │   └── index.css                  # Tailwind styles and custom dark theme
│   ├── package.json
│   └── vite.config.ts                 # Proxies /api and /api/live/ws to backend
├── server/                     # Backend (Node.js, Express, WebSockets, TypeScript)
│   ├── src/
│   │   ├── index.ts                   # Express API routes & WebSocket upgrade
│   │   ├── config.ts                  # Safe env variable resolution & health check
│   │   ├── prompts.ts                 # 8 scenarios, B.Tech coach personas & prompts
│   │   ├── feedbackService.ts         # Structured turn & summary evaluation (Gemini Flash)
│   │   ├── livekitService.ts          # LiveKit JWT room access token generator
│   │   └── geminiLive.ts              # Gemini Live speech-to-speech WebSocket gateway
│   ├── agent/
│   │   ├── agent.py                   # Python LiveKit Agents worker script
│   │   └── requirements.txt
│   ├── package.json
│   └── tsconfig.json
├── .env.example                # Sample environment configuration
├── package.json                # Root scripts (concurrently dev runner)
└── README.md
```

---

## 🔒 Security & Privacy

- **No Exposed Credentials**: API keys (`GEMINI_API_KEY`, `LIVEKIT_*`) are strictly read by the backend server from environment variables. The browser client never has access to secret keys.
- **Server-Side Token Generation**: Voice connections use secure server-side tokens and authenticated WebSocket gateways.
- **Client-Side Privacy**: All progress scores, streak counts, and transcripts are stored exclusively in your browser's local `localStorage`.
- **Explicit Consent**: Microphone audio streams directly in memory for speech recognition; audio is never stored on disk or transferred to third-party tracking services.
- **One-Click Data Deletion**: Clear all saved sessions and vocabulary at any time from the Progress dashboard or Settings modal.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18 or later (tested on v24)
- **npm**: v9 or later
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Install Dependencies

From the project root directory:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

cd ..
```

*(Or simply run `npm run install:all` from the root directory).*

---

### Step 2: Configure Environment Variables

Create your `.env` file in the root directory (or in `server/`):

```bash
cp .env.example .env
```

Open `.env` in any editor and add your **Google Gemini API Key**:

```env
# Required for real-time speech-to-speech voice agent and turn corrections
GEMINI_API_KEY=AIzaSyYourActualKeyHere

# Optional: Only needed if running LiveKit Agents mode
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key_here
LIVEKIT_API_SECRET=your_livekit_secret_here

# Backend port (default: 5000)
PORT=5000
```

> **Note on Free-Tier Limits**: If you do not yet have an API key entered, SpeakPath AI still launches cleanly in offline diagnostic mode. You can inspect all 8 scenarios, explore the 30-minute daily plan, test repeat audio pronunciation, and review the interface without errors.

---

### Step 3: Run the Application

You can launch both the frontend and backend servers together with a single command from the root directory:

```bash
npm run dev
```

This starts:
- **Backend API & Voice Gateway**: `http://localhost:5000`
- **Frontend Web Studio**: `http://localhost:5173`

Open **[http://localhost:5173](http://localhost:5173)** in your browser (Google Chrome or Microsoft Edge recommended for best Web Audio and Speech Synthesis support).

---

## 🎙️ How to Practice with Coach Alex

1. **Select a Scenario**:
   - Go to the **Scenarios** tab and pick any simulation (e.g., *Job Interview & HR Questions* or *Technical Interview & Project Explanation*).
2. **Start the Voice Session**:
   - Click the central **Microphone** button.
   - When prompted by your browser, click **"Allow"** for microphone access.
3. **Speak Naturally**:
   - Coach Alex will greet you and ask your first interview question.
   - Answer out loud. Watch the green soundwave react to your voice.
   - Coach Alex will listen until you finish, respond verbally, and ask a relevant follow-up question.
4. **Review Feedback**:
   - Check the **Turn-by-Turn Feedback** panel on the right. Notice grammar corrections, natural alternatives, and target phrases.
   - Click **"Practise & Repeat"** to hear native model pronunciation and practice repeating sentences out loud.
5. **End Session & Save Progress**:
   - Click **"End Session & Get Summary"** to view your comprehensive diagnostic report, scores out of 100, and unlocked vocabulary.
   - Click **"Save to My Dashboard"** to keep your streak and stats updated.

---

## 🧪 Testing & Verification

1. **Backend Health & Modules Status Check**:
   ```bash
   curl http://localhost:5000/api/health
   ```
2. **86 Supported Languages Check (E-Bot extraction)**:
   ```bash
   curl http://localhost:5000/api/languages
   ```
3. **Quick Phrase Translation Test (Stateless Tool)**:
   ```bash
   curl -X POST http://localhost:5000/api/translate \
     -H "Content-Type: application/json" \
     -d '{"text": "नमस्ते, क्या आप मेरी मदद कर सकते हैं?", "userLanguage": "Hindi"}'
   ```
4. **Multi-Agent Conversation Turn Test (Proofreader -> Chat -> Question Limiter)**:
   ```bash
   curl -X POST http://localhost:5000/api/conversation/turn \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "test-session", "scenarioId": "tech_interview", "userMessage": "I fine thx, I builded a web project yesterday."}'
   ```
5. **Turn Pedagogical Feedback Test**:
   ```bash
   curl -X POST http://localhost:5000/api/feedback/turn \
     -H "Content-Type: application/json" \
     -d '{"text": "Yesterday I go to the coding lab and my code was not worked.", "scenario": "tech_interview", "style": "balanced"}'
   ```
6. **Scenarios List Check**:
   ```bash
   curl http://localhost:5000/api/scenarios
   ```

---

## 🌐 Production Deployment (Vercel + Render / Railway)

SpeakPath AI is architected for decoupled deployment:
- **Frontend**: Deploy on [Vercel](https://vercel.com) using the included `vercel.json` (or set root directory to `client`).
- **Backend & WebSockets**: Deploy on [Render](https://render.com) using the included `render.yaml` (or [Railway](https://railway.app)).
- **Container**: Deploy all-in-one using the multi-stage `Dockerfile`.

> 📖 See the step-by-step [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for full instructions and screenshots.

---

## 🛠️ Troubleshooting

- **Microphone Permission Blocked**: Click the lock/settings icon next to the URL in your browser address bar, set *Microphone* to *Allow*, and refresh the page.
- **Audio Echo**: Use headphones/earphones while practicing so Coach Alex's audio output doesn't feed back into your microphone.
- **Missing API Key Notice**: Click the gear icon in the navbar, select *Test Link*, and ensure `GEMINI_API_KEY` is saved in your root `.env` file without trailing spaces or quotes.

