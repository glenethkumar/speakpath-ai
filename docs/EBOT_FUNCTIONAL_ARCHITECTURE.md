# Functional Architecture Document: E-Bot-2026 Audit & Extraction for SpeakPath AI

> **Source Repository**: [https://github.com/vbookshelf/E-Bot-2026](https://github.com/vbookshelf/E-Bot-2026)  
> **Source Version Audited**: `E-Bot-OpenRouter-v3.5` (Released 12-October-2026)  
> **Target Project**: SpeakPath AI (Voice-First English Coach for B.Tech Engineers & Professionals)  
> **Target Interface Base**: [https://github.com/livekit-examples/agent-starter-react](https://github.com/livekit-examples/agent-starter-react)  
> **Constraint**: Zero UI/UX, styling, HTML layout, or retro visual copying. Reusable functional logic only.

---

## Executive Summary

E-Bot-2026 is an open-source, web-based conversational English practice application built using PHP, client-side JavaScript, the browser Web Speech API, and OpenRouter (specifically Alibaba Qwen 3.5 Flash and Qwen 3.7 Flash models). 

The application architecture decouples language tutoring into three sequential LLM agents:
1. **Proofreader Agent**: Identifies and corrects grammatical, prepositional, article, tense, and spelling errors in the user's spoken sentence.
2. **Chat Agent**: Generates a natural, spoken-style conversation response based on the *corrected* message to avoid error-propagation and hallucination.
3. **Translation Agent**: Translates the tutor's English reply into the user's native language (86 supported languages) for comprehension assistance.
4. **Stateless Translator Tool**: A standalone quick-lookup tool translating short phrases from native language to British English.

This document analyses the underlying mechanics of E-Bot-2026, extracts the reusable business logic, details how each capability works, and outlines the integration plan for SpeakPath AI's LiveKit and Gemini-powered real-time architecture.

---

## 1. Deep Functional Architecture Analysis

### 1.1 How a User's Voice Becomes Text (Speech Input Adapter)
In E-Bot-2026 (`index.php` lines 3570–3780):
- **API Mechanism**: Utilizes the standard W3C Web Speech API via `window.SpeechRecognition || window.webkitSpeechRecognition`.
- **Initialization & Configuration**:
  - `recognition.lang = lang_code` (e.g. `'en-US'`, `'en-GB'`).
  - `recognition.continuous = false` (in mobile-optimized mode to prevent Android Chrome audio engine freezes).
  - `recognition.interimResults = false` (explicitly disabled on mobile/Android to prevent premature text emission).
- **Continuous Listening Simulation**:
  - Because `SpeechRecognition` lacks a true persistent always-listening mode across all browsers, E-Bot uses an event handler on the `end` event:
    ```javascript
    function handleEnd() {
        if (micShouldBeOn) {
            try { window.recognition.start(); } catch (err) { ... }
        }
    }
    ```
- **Error Handling & State Flags**:
  - Distinguishes benign errors (`no-speech`) from fatal permission errors (`not-allowed`, `service-not-allowed`, `audio-capture`, `network`).
  - Implements `micShouldBeOn` flag tracking user intent separately from transient pauses.
- **Echo Suppression / Audio Loop Prevention**:
  - When the bot begins speaking (TTS), the input recognition listener is removed and recognition is stopped (`recognition.removeEventListener('end', handleEnd); recognition.stop();`).
  - After TTS finishes (`utterance.onend` or `quiet_please()`), the recognition engine is restarted if `micShouldBeOn` is true.

### 1.2 How the AI Conversation Works (Conversation Service)
In E-Bot-2026 (`main.php` lines 410–590):
- **Sequential Multi-Agent Pipeline**:
  ```
  User Spoken Transcript
          │
          ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Proofreader Agent (qwen/qwen3.7-flash)                │
  │    - Validates grammar, tense, articles, prepositions     │
  │    - Returns corrected string OR '---' if flawless       │
  └──────────────────────────┬───────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │ [If '---' or error]             │ [If corrected]
            ▼                                 ▼
      Use Original                      Use Corrected
            │                                 │
            └────────────────┬────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 2. Chat Agent (qwen3.5-flash-02-23)                      │
  │    - Speaks with British English, warm coaching tone     │
  │    - Avoids idioms & regional Americanisms               │
  │    - Limits output to at most ONE question per turn      │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 3. Question Limiter Post-Processing                      │
  │    - Regex detects and trims trailing double-questions   │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 4. Optional Translation Agent (qwen/qwen3.7-flash)       │
  │    - Translates reply into learner's native language     │
  └──────────────────────────────────────────────────────────┘
  ```
- **Why Corrected Text is Sent to Chat**: If broken, fragmented English is passed directly to conversational LLMs, the LLM often misinterprets intent, adopts broken grammar, or hallucinates corrections in the chat body. Feeding the cleaned text ensures high-quality, contextual dialogue.

### 1.3 How Conversation Context is Maintained (Conversation State Manager)
In E-Bot-2026 (`main.php` lines 94–100, 570–590, 748–799):
- **Data Structure**: Array of turns:
  ```json
  [
    { "role": "user", "parts": [{ "text": "..." }, { "image": "data:image/jpeg;base64,..." }] },
    { "role": "model", "parts": [{ "text": "..." }] }
  ]
  ```
- **Session Persistence**: Stored in PHP `$_SESSION['message_history']`.
- **FIFO Pair-Wise Pruning (`max_history_pairs = 20`)**:
  - Rather than pruning individual turns (which causes dangling user turns without bot answers or orphaned bot replies), E-Bot prunes in synchronized pairs:
    ```php
    while (count($message_history) > $max_history_pairs * 2) {
        array_shift($message_history); // drops oldest user turn
        array_shift($message_history); // drops matching model turn
    }
    ```
- **System Message Separation**: The system prompt is never stored in `$_SESSION['message_history']`. Instead, it is prepended dynamically upon building the OpenAI API payload (`build_openrouter_messages`), preventing prompt duplication.
- **Multimodal Turns**: If an image is present, the turn structure switches from string to an array of content blocks: `[{"type": "text", "text": "..."}, {"type": "image_url", "image_url": {"url": "..."}}]`.

### 1.4 How the Application Generates Spoken Responses (Speech Output Adapter)
In E-Bot-2026 (`index.php` lines 2060–2235):
- **API Mechanism**: Browser `window.speechSynthesis` and `SpeechSynthesisUtterance`.
- **Voice Selection & Fallback Chain**:
  - Default: `"Google UK English Female"` (`en-GB`).
  - Fallback priority list for cross-platform support:
    1. Requested voice name (or user override from settings).
    2. Fallback chain: `Arthur` (`en-GB`) -> `Daniel` (`en-GB`) -> `Samantha` (`en-US`).
    3. Browser default voice for language code.
- **Chromium Teardown Bug Workaround**:
  - Calling `speechSynthesis.speak()` immediately after `speechSynthesis.cancel()` drops the audio silently in Chromium browsers.
  - Solution: E-Bot defers playback by 50ms (`setTimeout(() => speechSynthesis.speak(utterance), 50)`).
- **Playback Controls**:
  - Global `quiet_please()` cancels playback, resets visualizer indicators, and restarts recognition.

### 1.5 How Grammar and Spelling Correction Works (Proofreader Service)
In E-Bot-2026 (`main.php` lines 420–488):
- **Delimiter Isolation**: Input text is wrapped in triple hash tags: `###" . $user_message . "###`.
- **Specific Checklist in System Prompt**:
  - Missing or wrong forms of "to be" (*"I fine"* -> *"I'm fine"*).
  - Missing or wrong auxiliary verbs (*"I go there yesterday"* -> *"I went there yesterday"*).
  - Subject-verb agreement (*"she like"* -> *"she likes"*).
  - Missing articles (*a*, *an*, *the*).
  - Preposition errors and verb tense consistency.
  - Expanding informal slang (*"thx"* -> *"thanks"*, *"u"* -> *"you"*).
- **Flawless Marker (`---`)**: If no error exists, model returns `---`.
- **Identity Check Backstop**: If model returns the user's sentence unchanged instead of `---`, the code programmatically detects `trim($corrected) === trim($original)` and coerces it to `---`.
- **Output Sanitization (`replaceItemsInString`)**: Strips markdown JSON fences, tags, and emojis.

### 1.6 How Translation Functionality Works (Translation Service)
In E-Bot-2026 (`main.php` lines 147–265, 596–643):
- **86 Supported Languages**: Loaded from `supported-languages-ebot.json`.
- **Two Independent Translation Modes**:
  1. **Inline Chat Translation**: Translates E-Bot's English reply into the user's chosen language via JSON schema `{"translation": "..."}`.
  2. **Stateless Vocabulary Translator Tool**: A dedicated tool for quick phrase lookup (up to 1,000 characters). Enforces strict rules:
     - Output only the translation without quotes or conversational commentary.
     - Pick the single most common British English dictionary meaning.
     - Low temperature (`0.2`) for determinism.

### 1.7 AI Provider Configuration & Communication
In E-Bot-2026 (`main.php` lines 34–78, 802–906):
- **Provider**: OpenRouter OpenAI-compatible endpoint `https://openrouter.ai/api/v1/chat/completions`.
- **Provider Pinning**: Employs `provider: { order: ["alibaba"], allow_fallbacks: false }` to prevent unpredictable routing or unexpected cost escalation.
- **Reasoning Effort**: Set to `effort: "none"` for lowest latency.
- **Config Security**: External `ebot_config.ini` outside root path.

### 1.8 Error Handling & Failed Request Resiliency
- **Backend Retries**: 3-attempt loop in `make_api_call`.
- **Fallback on Proofreader Failure**: If the proofreader agent times out or errors, the chat pipeline does not crash; it smoothly falls back to the uncorrected user message.
- **Frontend Timeout**: 30-second `AbortController` timeout for translator requests.

### 1.9 Image & Multimodal Handling
In E-Bot-2026 (`index.php` lines 3050–3145):
- Client-side Canvas downscaling: `compressImageForUpload(file, maxDim=1024, quality=0.7)`.
- Emits JPEG Data URL (`data:image/jpeg;base64,...`).
- Multi-generation counter prevents race conditions when switching files quickly.

---

## 2. Module Inventory & Dependency Map

| E-Bot Module / File | Underlying Responsibility | Status in SpeakPath AI | Reason / Adaptation |
|---|---|---|---|
| `main.php` (Proofreader Agent) | Grammar, spelling, tense correction with `###` delimiters | **Extracted & Reused** | Ported to TypeScript `ProofreaderService` with B.Tech/interview extensions. |
| `main.php` (Chat Agent System Prompt) | Conversational English persona, British/neutral style, 1 question max | **Extracted & Reused** | Integrated into `ConversationService` and `prompts.ts`. |
| `main.php` (`limit_trailing_questions`) | Regex preventing double question stacking | **Extracted & Reused** | Implemented as standalone utility `limitTrailingQuestions()`. |
| `main.php` (`max_history_pairs = 20`) | FIFO pair-wise history manager | **Extracted & Reused** | Implemented in `ConversationStateManager`. |
| `main.php` (Translation Agent) | Translates English response into 86 languages | **Extracted & Reused** | Ported to `TranslationService`. |
| `main.php` (Stateless Translator Tool) | Word/phrase lookup to British English (<1000 chars) | **Extracted & Reused** | Integrated as `/api/translate` endpoint and overlay tool. |
| `supported-languages-ebot.json` | 86 ISO/Common language list | **Extracted & Reused** | Directly imported as `supportedLanguages.json`. |
| `index.php` (`compressImageForUpload`) | HTML5 Canvas image resize (1024px, 0.7 JPEG) | **Extracted & Reused** | Implemented in `client/src/utils/imageCompressor.ts`. |
| `index.php` (`PLAN_PROMPTS` list) | 7-day conversation starter prompts | **Extracted & Reused** | Preserved in `practicePlan.ts` with engineering extensions. |
| `index.php` (Echo-free Web Speech lifecycle) | Stop mic during TTS, restart on `onend` | **Adapted** | Web Speech fallback adapter when LiveKit WebRTC is inactive. |
| `index.php` (TTS voice fallback chain) | Google UK Female -> Arthur -> Daniel -> Samantha | **Extracted & Reused** | Integrated into `SpeechOutputAdapter.ts`. |
| `index.php` (HTML/CSS, w3.css, Robot UI) | Retro visual presentation | **DISCARDED** | Strictly prohibited. Replaced with LiveKit Agent Starter React UI. |
| `ebot_config.ini.txt` | File-based API key storage | **Modernized** | Replaced with strict environment variable management (`.env`). |

---

## 3. SpeakPath AI Target Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SpeakPath AI Web Client                         │
│       (LiveKit Agent Starter React Foundation + Tailwind CSS v4)       │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ LiveKit Voice Session │  │ Audio Visualizer│  │ Agent Control Bar│  │
│  │ (WebRTC Real-time PCM)│  │ (Wave/Aura/Bar) │  │ (Mute, Disc, Cam)│  │
│  └───────────┬───────────┘  └─────────────────┘  └──────────────────┘  │
│              │                                                         │
│  ┌───────────▼───────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  LiveKit Room Audio   │  │ Feedback Panel  │  │ Quick Translator │  │
│  │  (Bi-directional Stream) │ (Turn Corrections)│ │ (86 Languages)   │  │
│  └───────────┬───────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────┼─────────────────────────────────────────────────────────┘
               │ WebRTC Audio & Data Channels
               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SpeakPath AI Backend Functional Layer                │
│                         (Node.js / TypeScript)                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. AI Provider Adapter (Gemini Flash / Gemini Live / OpenRouter) │  │
│  │    - Exponential backoff, timeout protection, provider pinning   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 2. Conversation Service & FIFO State Manager                     │  │
│  │    - 20-pair turn management, multimodal vision handling         │  │
│  │    - Trailing question limiter, scenario-specific system prompts  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 3. English Correction & Proofreader Service                      │  │
│  │    - Delimited text parsing, learner error taxonomy              │  │
│  │    - Word choice, phoneme pronunciation hints, repeated practice │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 4. Translation Service (86 Languages)                            │  │
│  │    - Response translation & standalone vocabulary lookup         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Distinction: Reused vs Newly Implemented Modules

### Reused & Extracted Modules (from E-Bot-2026):
1. **Proofreader Core System Prompt & Rules**: Targeted learner mistake checklist, `###` delimiter isolation, and `---` no-error flag.
2. **Trailing Question Limiter**: Exact programmatic regex preventing repetitive multi-question bot replies.
3. **FIFO Turn History (20 Pairs)**: Dual-turn pop logic preserving conversation integrity.
4. **86 Supported Languages**: JSON dataset and multilingual translation prompts.
5. **Stateless Translator Tool**: 1,000-character vocabulary lookup with dictionary-style British English outputs.
6. **Client-side Image Canvas Compressor**: Max dimension downscaling (1024px, 0.7 JPEG) to keep vision payloads minimal.
7. **Echo Suppression Mechanism**: Coordinated speech/mic muting for browser-based speech fallbacks.

### Newly Implemented Modules (SpeakPath AI Additions):
1. **LiveKit Agent Starter React Interface**: Full visualizer suite (Aura, Wave, Bar), modern control bar, and dark-mode glassmorphic styling.
2. **Gemini Live Bidirectional PCM Streaming**: Real-time 16kHz speech-to-speech interaction via WebSockets.
3. **8 Targeted B.Tech Engineering Scenarios**: Specialized vocabularies and interview coaches (Technical Viva, Campus HR, Standups, Startup Pitch).
4. **Pronunciation & Fluency Diagnostics**: Phoneme breakdown for Indian English learners (e.g., /v/ vs /w/, /θ/ vs /t/).
5. **Repeat & Shadow Practice Mode**: Client-side audio replay allowing learners to speak the corrected sentence aloud.
6. **Vocabulary Vault & Progress Tracking**: LocalStorage analytics tracking recurring errors, vocabulary mastery, and fluency scores.
