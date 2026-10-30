import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  StopCircle,
  RotateCcw,
  Send,
  AlertTriangle,
  Bot,
  Languages,
  Sparkles,
  ImageIcon,
  X,
  Upload,
} from 'lucide-react';
import type { VoiceState, Scenario, TurnRecord } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { compressImageForUpload } from '../modules/imageCompressor';

interface VoiceCoachProps {
  currentScenario: Scenario;
  voiceState: VoiceState;
  isMuted: boolean;
  audioVolume: number;
  activeUserTranscript: string;
  activeAiTranscript: string;
  turns: TurnRecord[];
  errorMessage: string | null;
  onStart: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onSendText: (text: string) => void;
  onEndSession: () => void;
  onSwitchScenario: () => void;
  onOpenTranslator?: () => void;
  onOpenPracticePlan?: () => void;
  onAttachImage?: (dataUrl: string) => void;
  pendingImage?: string | null;
  onClearImage?: () => void;
}

export const VoiceCoach: React.FC<VoiceCoachProps> = ({
  currentScenario,
  voiceState,
  isMuted,
  audioVolume,
  activeUserTranscript,
  activeAiTranscript,
  turns,
  errorMessage,
  onStart,
  onToggleMute,
  onInterrupt,
  onSendText,
  onEndSession,
  onSwitchScenario,
  onOpenTranslator,
  onOpenPracticePlan,
  onAttachImage,
  pendingImage,
  onClearImage,
}) => {
  const [textInput, setTextInput] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isConnected =
    voiceState === 'listening' ||
    voiceState === 'coach_speaking' ||
    voiceState === 'processing' ||
    voiceState === 'muted';

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendText(textInput);
    setTextInput('');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImage(true);
      const dataUrl = await compressImageForUpload(file, { maxDimension: 1024, quality: 0.7 });
      onAttachImage?.(dataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = () => {
    switch (voiceState) {
      case 'idle':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Ready to Connect
          </span>
        );
      case 'requesting_permission':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Requesting Microphone...
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Establishing Voice Link...
          </span>
        );
      case 'listening':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Listening to You...
          </span>
        );
      case 'coach_speaking':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Alex is Speaking
          </span>
        );
      case 'muted':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <MicOff className="w-3 h-3 text-red-400" />
            Microphone Muted
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Session Paused
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Hidden file input for multimodal image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Top Scenario Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
            B2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentScenario.title}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentScenario.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">{currentScenario.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {turns.length > 0 && (
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {turns.length} {turns.length === 1 ? 'Turn' : 'Turns'}
            </span>
          )}
          {getStatusBadge()}
          <button
            onClick={onSwitchScenario}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            Change Mode
          </button>
        </div>
      </div>

      {/* Main Interactive Studio Body */}
      <div className="p-6 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900/30 via-slate-950/50 to-slate-900/40 min-h-[380px]">
        {/* Ambient background glow */}
        <div
          className={`absolute w-72 h-72 rounded-full filter blur-3xl pointer-events-none transition-all duration-700 ${
            voiceState === 'coach_speaking'
              ? 'bg-purple-600/15 scale-125'
              : voiceState === 'listening'
              ? 'bg-emerald-500/15 scale-110'
              : 'bg-indigo-600/10 scale-90'
          }`}
        />

        {/* Coach Identity */}
        <div className="flex flex-col items-center mb-4 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI English Coach Alex</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            Speaks naturally, listens attentively, and guides your B.Tech fluency step-by-step.
          </p>
        </div>

        {/* Sound Wave Visualizer */}
        <div className="w-full max-w-md z-10">
          <AudioVisualizer voiceState={voiceState} volume={audioVolume} isMuted={isMuted} />
        </div>

        {/* Central Prominent Microphone Control Button */}
        <div className="relative my-4 z-10 flex items-center justify-center">
          {isConnected && !isMuted && (
            <div
              className={`absolute rounded-full transition-transform duration-100 ${
                voiceState === 'coach_speaking'
                  ? 'bg-purple-500/20 animate-ping w-28 h-28'
                  : 'bg-emerald-500/20 w-32 h-32'
              }`}
              style={{
                transform: `scale(${1 + audioVolume * 0.4})`,
              }}
            />
          )}

          <button
            onClick={isConnected ? onToggleMute : onStart}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 group focus:outline-none focus:ring-4 ${
              !isConnected
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30 hover:scale-105 focus:ring-indigo-500/40'
                : isMuted
                ? 'bg-slate-800 text-red-400 border-2 border-red-500/50 hover:bg-slate-700 focus:ring-red-500/30'
                : voiceState === 'coach_speaking'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-purple-500/30 focus:ring-purple-500/40'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 hover:scale-105 focus:ring-emerald-500/40'
            }`}
          >
            {!isConnected ? (
              <>
                <Mic className="w-8 h-8 sm:w-9 sm:h-9 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Start</span>
              </>
            ) : isMuted ? (
              <>
                <MicOff className="w-8 h-8 sm:w-9 sm:h-9 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Unmute</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 sm:w-9 sm:h-9 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {voiceState === 'coach_speaking' ? 'Listening' : 'Mute'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live Subtitle Transcript Bubbles */}
        <div className="w-full max-w-xl min-h-[64px] flex flex-col items-center justify-center px-4 my-2 z-10 text-center">
          {activeAiTranscript ? (
            <div className="bg-purple-950/40 border border-purple-500/30 text-purple-200 px-4 py-2.5 rounded-xl text-sm font-medium animate-fadeIn">
              <span className="text-purple-400 font-bold mr-1.5">Alex:</span>
              "{activeAiTranscript}"
            </div>
          ) : activeUserTranscript ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 rounded-xl text-sm font-medium animate-fadeIn">
              <span className="text-emerald-400 font-bold mr-1.5">You:</span>
              "{activeUserTranscript}"
            </div>
          ) : isConnected ? (
            <p className="text-xs text-slate-400 italic">
              Speak naturally into your microphone... Coach Alex is ready.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Click the microphone button to start your voice practice session.
            </p>
          )}
        </div>

        {/* Pending Multimodal Image Banner */}
        {pendingImage && (
          <div className="my-2 z-10 flex items-center gap-3 px-3 py-1.5 bg-slate-800/90 border border-indigo-500/30 rounded-xl">
            <img
              src={pendingImage}
              alt="Attached preview"
              className="w-8 h-8 object-cover rounded-lg border border-slate-700"
            />
            <span className="text-xs text-indigo-300 font-medium">Image attached for coach</span>
            <button
              onClick={onClearImage}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Controls Bar (LiveKit Agent Starter aesthetic) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 z-10">
          {/* Quick Translator Tool Trigger */}
          <button
            onClick={onOpenTranslator}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm"
            title="Translate word or phrase into British English"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>Translator</span>
          </button>

          {/* Practice Plan Drawer Trigger */}
          <button
            onClick={onOpenPracticePlan}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm"
            title="Choose a ready-made practice exercise"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Practice Plan</span>
          </button>

          {/* Multimodal Image Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressingImage}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Attach a photo or diagram (e.g. system architecture, menu, slide)"
          >
            {isCompressingImage ? (
              <Upload className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isCompressingImage ? 'Processing...' : 'Attach Image'}</span>
          </button>

          {isConnected && (
            <>
              <button
                onClick={onToggleMute}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isMuted
                    ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {voiceState === 'coach_speaking' && (
                <button
                  onClick={onInterrupt}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 transition-all"
                  title="Interrupt AI to speak immediately"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Interrupt</span>
                </button>
              )}

              <button
                onClick={onEndSession}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600/90 hover:bg-red-600 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-all"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Finish Session</span>
              </button>
            </>
          )}
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs max-w-md text-center z-10 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Hybrid Text Input Option */}
      {isConnected && (
        <form
          onSubmit={handleTextSubmit}
          className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a message or response if you prefer typing..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      )}
    </div>
  );
};
