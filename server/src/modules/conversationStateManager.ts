/**
 * Conversation State Manager
 * Extracted and adapted from E-Bot-2026 (main.php lines 270-296, 552-588, 760-798)
 */

export interface MessagePart {
  text?: string;
  image?: string; // base64 Data URL (data:image/jpeg;base64,...)
}

export interface ConversationTurn {
  role: 'user' | 'model';
  parts: MessagePart[];
  timestamp?: number;
}

export interface SessionState {
  sessionId: string;
  scenarioId: string;
  mood: 'bubbly' | 'contemplative' | 'cheerful';
  history: ConversationTurn[];
  createdAt: number;
  lastActive: number;
}

export class ConversationStateManager {
  private sessions: Map<string, SessionState> = new Map();
  private maxHistoryPairs: number;

  constructor(maxHistoryPairs: number = 20) {
    this.maxHistoryPairs = maxHistoryPairs;
  }

  /**
   * Retrieves or initializes a session with randomized mood.
   */
  public getOrCreateSession(sessionId: string, scenarioId: string = 'daily_conversation'): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const moods: Array<'bubbly' | 'contemplative' | 'cheerful'> = ['bubbly', 'contemplative', 'cheerful'];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];

      session = {
        sessionId,
        scenarioId,
        mood: randomMood,
        history: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
      this.sessions.set(sessionId, session);
    }
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Adds a user turn to the session history.
   */
  public addUserTurn(sessionId: string, text: string, imageDataUrl?: string): void {
    const session = this.getOrCreateSession(sessionId);
    const parts: MessagePart[] = [];

    if (text && text.trim().length > 0) {
      parts.push({ text: text.trim() });
    }
    if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
      parts.push({ image: imageDataUrl });
    }

    session.history.push({
      role: 'user',
      parts,
      timestamp: Date.now(),
    });
    session.lastActive = Date.now();
  }

  /**
   * Adds a model turn and enforces FIFO pair pruning (dropping oldest user+model pair).
   */
  public addModelTurn(sessionId: string, replyText: string): void {
    const session = this.getOrCreateSession(sessionId);
    session.history.push({
      role: 'model',
      parts: [{ text: replyText.trim() }],
      timestamp: Date.now(),
    });

    // Enforce FIFO pair-wise pruning (from E-Bot max_history_pairs * 2)
    while (session.history.length > this.maxHistoryPairs * 2) {
      session.history.shift(); // Drop oldest user turn
      session.history.shift(); // Drop matching oldest model turn
    }
    session.lastActive = Date.now();
  }

  /**
   * Gets conversation history formatted for model providers.
   */
  public getHistory(sessionId: string): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.history] : [];
  }

  /**
   * Clears a conversation session.
   */
  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Cleans up stale sessions older than 2 hours.
   */
  public cleanupStaleSessions(maxAgeMs: number = 7200000): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActive > maxAgeMs) {
        this.sessions.delete(id);
      }
    }
  }
}
