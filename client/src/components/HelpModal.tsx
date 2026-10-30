import React from 'react';
import { X, Sparkles, Compass, ArrowRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onGetStarted }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Welcome to SpeakPath AI
              </h2>
              <p className="text-xs text-slate-400">
                Personal Spoken English & Career Coach for B.Tech Engineers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
            <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Not a generic chatbot — a dedicated voice coach
            </h3>
            <p className="text-slate-300">
              SpeakPath AI is tailored to engineering students preparing for campus recruitment, technical vivas, agile standups, and startup pitches. Coach Alex speaks with real audio, asks one question at a time, and never shames you for making mistakes.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2 text-sm">How to get the most out of each session:</h4>
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                <strong>Speak in full sentences:</strong> Avoid one-word answers. Explain <em>why</em> you chose a database, how you debugged an error, or your personal vision.
              </li>
              <li>
                <strong>Stop translating in your head:</strong> Speak thoughts as they come. Coach Alex will not interrupt you mid-sentence.
              </li>
              <li>
                <strong>Review turn-by-turn cards:</strong> After each spoken turn, glance at the feedback panel for natural English alternatives and useful workplace phrases.
              </li>
              <li>
                <strong>Use "Practise & Repeat":</strong> Listen to native model pronunciation and repeat the corrected sentence out loud.
              </li>
              <li>
                <strong>Follow the 30-Minute Plan:</strong> Use the 4-stage daily routine to build steady momentum from warmup to technical defense.
              </li>
            </ol>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-300 block">🎧 Recommended Setup:</span>
            <p className="text-slate-400">
              Use headphones or earphones with a microphone to prevent echo and ensure crisp speech-to-speech audio streaming.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={() => {
              onClose();
              onGetStarted();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Start Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
