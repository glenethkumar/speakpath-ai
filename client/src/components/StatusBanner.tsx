import React from 'react';
import { Key, MicOff } from 'lucide-react';
import type { ServiceHealthStatus } from '../types';

interface StatusBannerProps {
  status: ServiceHealthStatus | null;
  micPermission: 'prompt' | 'granted' | 'denied';
  onOpenSettings: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  micPermission,
  onOpenSettings,
}) => {
  if (micPermission === 'denied') {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-xs sm:text-sm text-red-300 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-4xl">
          <MicOff className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>Microphone Access Denied:</strong> Your browser has blocked microphone access. Click the site settings lock icon in your address bar to allow microphone permissions so you can practice speaking.
          </span>
        </div>
      </div>
    );
  }

  if (status && !status.geminiConfigured) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs sm:text-sm text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-4xl">
          <Key className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong>API Key Setup Required:</strong> To enable real-time voice speech and AI feedback, add your Google Gemini API Key to your server <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-200">.env</code> file.
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="ml-4 shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold border border-amber-500/30 transition-colors"
        >
          Setup Key
        </button>
      </div>
    );
  }

  return null;
};
