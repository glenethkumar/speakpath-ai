import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

export function getServiceStatus() {
  const isPlaceholderKey = (key: string) =>
    !key || key.includes('your_') || key.includes('placeholder') || key.trim() === '';

  const geminiReady = !isPlaceholderKey(GEMINI_API_KEY);
  const livekitReady =
    !isPlaceholderKey(LIVEKIT_URL) &&
    !isPlaceholderKey(LIVEKIT_API_KEY) &&
    !isPlaceholderKey(LIVEKIT_API_SECRET);

  return {
    geminiConfigured: geminiReady,
    livekitConfigured: livekitReady,
    port: PORT,
    activeVoiceMode: livekitReady ? 'livekit' : geminiReady ? 'direct_gemini_live' : 'not_configured',
  };
}
