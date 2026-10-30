import React, { useState } from 'react';
import {
  X,
  Settings,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import type { ServiceHealthStatus, CorrectionStyle } from '../types';
import type { PrivacySettings } from '../hooks/useProgressStorage';
import { apiUrl } from '../utils/apiConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceHealthStatus | null;
  onRefreshStatus: () => void;
  correctionStyle: CorrectionStyle;
  onStyleChange: (style: CorrectionStyle) => void;
  privacy: PrivacySettings;
  onUpdatePrivacy: (settings: PrivacySettings) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
  correctionStyle,
  onStyleChange,
  privacy,
  onUpdatePrivacy,
  onClearHistory,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(apiUrl('/api/health'));
      const data = await res.json();
      onRefreshStatus();
      if (data.status?.geminiConfigured) {
        setTestResult('Success: Gemini Live & Flash models are connected and ready!');
      } else {
        setTestResult(
          'API Key Missing: GEMINI_API_KEY was not found in .env. Please add it and restart the server.'
        );
      }
    } catch (err: any) {
      setTestResult('Connection Error: Could not reach the backend server. Please verify the backend is online and running.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Coach Settings & Status</h2>
              <p className="text-xs text-slate-400">Configure AI feedback depth, voice mode, and keys.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Correction Style */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Correction Style</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Adjust how strictly Coach Alex analyzes and highlights your spoken answers.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    id: 'gentle',
                    title: 'Gentle',
                    desc: 'Encouraging flow, flags only major errors that impede clarity.',
                  },
                  {
                    id: 'balanced',
                    title: 'Balanced',
                    desc: 'Default mode. Clear 1-2 core improvements after each answer.',
                  },
                  {
                    id: 'detailed',
                    title: 'Detailed',
                    desc: 'In-depth grammar rules, vocabulary upgrades, and formal polish.',
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onStyleChange(mode.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    correctionStyle === mode.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">{mode.title}</span>
                    <p className="text-[11px] text-slate-400 leading-tight">{mode.desc}</p>
                  </div>
                  {correctionStyle === mode.id && (
                    <span className="text-[10px] font-bold text-indigo-400 mt-2">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Service & API Key Health */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">API Credentials & Voice Engine</h3>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test Link</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Google Gemini Live & Flash</span>
                {status?.geminiConfigured ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured & Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Key Required in .env
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">LiveKit Agents Room Engine</span>
                {status?.livekitConfigured ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Optional (Using Direct Gemini Live)
                  </span>
                )}
              </div>
            </div>

            {testResult && (
              <p
                className={`text-xs p-2.5 rounded-lg border ${
                  testResult.startsWith('Success')
                    ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-950/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {testResult}
              </p>
            )}

            {!status?.geminiConfigured && (
              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <p>
                  <strong>How to add your API Key:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>
                    Get a free API key at{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    Open or create <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">.env</code> in the project root.
                  </li>
                  <li>
                    Add: <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300">GEMINI_API_KEY=your_key_here</code>
                  </li>
                  <li>Restart the server or click "Test Link" above.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Privacy & Data Settings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Privacy Controls</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Your data stays in your browser. Audio streams directly in memory for speech recognition.
            </p>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <span>Save Conversation Transcripts for Review</span>
                <input
                  type="checkbox"
                  checked={privacy.saveTranscripts}
                  onChange={(e) =>
                    onUpdatePrivacy({ ...privacy, saveTranscripts: e.target.checked })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <span>Opt-in Audio Recording Storage (Default: False)</span>
                <input
                  type="checkbox"
                  checked={privacy.audioStorageConsent}
                  onChange={(e) =>
                    onUpdatePrivacy({ ...privacy, audioStorageConsent: e.target.checked })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
              </label>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all learning history and progress from this browser?')) {
                      onClearHistory();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All Learning History</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
