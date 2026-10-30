import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceState, CorrectionStyle, TurnRecord, TurnFeedback } from '../types';
import { float32ToInt16PCM, arrayBufferToBase64, resampleAudio, PCMPlayer } from '../utils/audioUtils';
import { getWebSocketUrl } from '../utils/apiConfig';

export interface UseVoiceSessionProps {
  onTurnCompleted?: (turn: TurnRecord) => void;
  onTurnFeedbackReceived?: (feedback: TurnFeedback) => void;
}

export function useVoiceSession(props: UseVoiceSessionProps = {}) {
  const { onTurnCompleted, onTurnFeedbackReceived } = props;

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeUserTranscript, setActiveUserTranscript] = useState('');
  const [activeAiTranscript, setActiveAiTranscript] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [turns, setTurns] = useState<TurnRecord[]>([]);

  // Refs for audio pipeline and sockets
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  // Initialize PCM Player
  useEffect(() => {
    pcmPlayerRef.current = new PCMPlayer(24000);
    return () => {
      pcmPlayerRef.current?.close();
    };
  }, []);

  // Audio level monitoring loop
  const startVolumeMeter = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Normalize to 0 - 1
      const normalized = Math.min(1, avg / 128);
      setAudioVolume(normalized);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const stopVolumeMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioVolume(0);
  };

  // Stop recording hardware
  const stopMicrophone = useCallback(() => {
    stopVolumeMeter();
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup session
  const stopSession = useCallback(() => {
    stopMicrophone();
    pcmPlayerRef.current?.stop();

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    setVoiceState('idle');
    setActiveUserTranscript('');
    setActiveAiTranscript('');
  }, [stopMicrophone]);

  // Start microphone and real-time streaming
  const startSession = useCallback(
    async (scenarioId: string = 'free_conversation', style: CorrectionStyle = 'balanced') => {
      stopSession();
      setErrorMessage(null);
      setVoiceState('requesting_permission');

      // 1. Request microphone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        setMicPermission('granted');
      } catch (err: any) {
        console.error('Microphone access denied or failed:', err);
        setMicPermission('denied');
        setVoiceState('error');
        setErrorMessage(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Microphone permission was denied. Please allow microphone access in your browser settings to practice speaking.'
            : 'Could not access your microphone. Please check your audio input device.'
        );
        return;
      }

      setVoiceState('connecting');

      // 2. Connect WebSocket (supports local dev, unified origin, or decoupled host)
      const wsUrl = getWebSocketUrl('/api/live/ws');

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
      } catch (err: any) {
        console.error('WebSocket connection error:', err);
        setVoiceState('error');
        setErrorMessage('Failed to connect to voice server. Make sure the backend server is running.');
        stopMicrophone();
        return;
      }

      ws.onopen = () => {
        console.log('[useVoiceSession] WebSocket connected. Sending setup...');
        ws.send(
          JSON.stringify({
            type: 'setup',
            scenario: scenarioId,
            style,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'ready':
              setVoiceState('listening');
              break;

            case 'audio':
              // Coach is speaking! Play audio
              setVoiceState('coach_speaking');
              if (pcmPlayerRef.current) {
                pcmPlayerRef.current.playChunk(msg.data);
              }
              break;

            case 'user_transcript':
              setActiveUserTranscript(msg.fullText || msg.text || '');
              if (!isMutedRef.current) {
                setVoiceState('listening');
              }
              break;

            case 'ai_transcript':
              setActiveAiTranscript(msg.fullText || msg.text || '');
              setVoiceState('coach_speaking');
              break;

            case 'interrupted':
              pcmPlayerRef.current?.stop();
              setActiveAiTranscript('');
              setVoiceState('listening');
              break;

            case 'turn_complete':
              setVoiceState('listening');
              const newTurn: TurnRecord = {
                id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                timestamp: Date.now(),
                userText: msg.userText || activeUserTranscript,
                aiText: msg.aiText || activeAiTranscript,
              };

              setTurns((prev) => [...prev, newTurn]);
              onTurnCompleted?.(newTurn);

              setActiveUserTranscript('');
              setActiveAiTranscript('');
              break;

            case 'feedback':
              if (msg.feedback) {
                const feedback: TurnFeedback = msg.feedback;
                setTurns((prev) => {
                  if (prev.length === 0) return prev;
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    feedback,
                  };
                  return updated;
                });
                onTurnFeedbackReceived?.(feedback);
              }
              break;

            case 'error':
              console.error('Server error received:', msg);
              setVoiceState('error');
              setErrorMessage(msg.message || 'An error occurred during the voice session.');
              break;

            case 'closed':
            case 'session_ended':
              setVoiceState('idle');
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('Voice WebSocket encountered error:', err);
        setVoiceState('error');
        setErrorMessage('Voice connection encountered an unexpected network error.');
      };

      ws.onclose = () => {
        console.log('Voice WebSocket closed.');
      };

      // 3. Setup Web Audio pipeline to capture and resample PCM
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        startVolumeMeter(analyser);

        // ScriptProcessorNode for real-time PCM extraction
        const bufferSize = 2048;
        const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) {
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);

          // Resample from context sample rate (e.g. 48kHz or 44.1kHz) to 16kHz
          const resampled = resampleAudio(inputData, audioCtx.sampleRate, 16000);
          const pcmBuffer = float32ToInt16PCM(resampled);
          const base64Audio = arrayBufferToBase64(pcmBuffer);

          ws.send(
            JSON.stringify({
              type: 'audio',
              data: base64Audio,
            })
          );
        };

        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(audioCtx.destination);
      } catch (audioErr: any) {
        console.error('Web Audio capture setup error:', audioErr);
        setVoiceState('error');
        setErrorMessage('Failed to initialize audio processor. Please refresh the page and try again.');
      }
    },
    [stopSession, stopMicrophone, activeUserTranscript, activeAiTranscript, onTurnCompleted, onTurnFeedbackReceived]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (next) {
          wsRef.current.send(JSON.stringify({ type: 'audio_stream_end' }));
          setVoiceState('muted');
        } else {
          setVoiceState('listening');
        }
      }
      return next;
    });
  }, []);

  const interruptCoach = useCallback(() => {
    pcmPlayerRef.current?.stop();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio_stream_end' }));
    }
    setVoiceState('listening');
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && text.trim()) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text: text.trim(),
        })
      );
    }
  }, []);

  return {
    voiceState,
    micPermission,
    isMuted,
    errorMessage,
    activeUserTranscript,
    activeAiTranscript,
    audioVolume,
    turns,
    startSession,
    stopSession,
    toggleMute,
    interruptCoach,
    sendTextMessage,
    clearTurns: () => setTurns([]),
  };
}
