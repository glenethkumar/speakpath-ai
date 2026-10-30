import { AccessToken } from 'livekit-server-sdk';
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } from './config.js';

export async function createLiveKitToken(roomName: string, participantName: string) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    throw new Error(
      'LiveKit credentials are not configured in .env (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET are required).'
    );
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName || `student-${Math.floor(Math.random() * 10000)}`,
    name: participantName || 'Engineering Student',
    ttl: '1h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName || 'speakpath-room',
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return {
    token,
    url: LIVEKIT_URL,
    roomName: roomName || 'speakpath-room',
  };
}
