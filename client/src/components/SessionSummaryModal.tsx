import React, { useState } from 'react';
import {
  Trophy,
  AlertCircle,
  BookOpen,
  Volume2,
  Copy,
  Check,
  X,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { SessionSummary, Scenario } from '../types';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SessionSummary | null;
  scenario: Scenario;
  durationMinutes: number;
  turnsCount: number;
  onSaveToProgress: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  scenario,
  durationMinutes,
  turnsCount,
  onSaveToProgress,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summary) return null;

  const playWordAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyReport = () => {
    const reportText = `=== SpeakPath AI Session Summary ===
Scenario: ${scenario.title}
Duration: ${durationMinutes} minutes | Spoken Turns: ${turnsCount}
Scores: Fluency: ${summary.fluencyScore}/100 | Grammar: ${summary.grammarScore}/100 | Confidence: ${summary.confidenceScore}/100

Overall Feedback:
${summary.overallFeedback}

Main Mistakes & Corrections:
${summary.mainMistakes.map((m, i) => `${i + 1}. Mistake: ${m.mistake}\n   Correction: ${m.correction}\n   Rationale: ${m.reason}`).join('\n')}

New Vocabulary Unlocked:
${summary.newVocabulary.map((v) => `• ${v.phrase}: ${v.meaning} (Example: "${v.example}")`).join('\n')}

Next Practice Goal:
${summary.nextGoal}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Session Completed!</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  {scenario.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'} practiced • {turnsCount} conversational turns analyzed
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Diagnostic Scores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-medium block mb-1">Fluency & Flow</span>
              <span className="text-2xl font-black text-indigo-400">{summary.fluencyScore}</span>
              <span className="text-xs text-slate-500 block">/100</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-medium block mb-1">Grammar & Syntax</span>
              <span className="text-2xl font-black text-emerald-400">{summary.grammarScore}</span>
              <span className="text-xs text-slate-500 block">/100</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-medium block mb-1">Confidence & Pace</span>
              <span className="text-2xl font-black text-purple-400">{summary.confidenceScore}</span>
              <span className="text-xs text-slate-500 block">/100</span>
            </div>
          </div>

          {/* Coach's Overall Feedback */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Coach Alex's Evaluation</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {summary.overallFeedback}
            </p>
          </div>

          {/* Main Mistakes & Explanations */}
          {summary.mainMistakes && summary.mainMistakes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Key Grammar & Phrasing Corrections
              </h3>
              <div className="space-y-2.5">
                {summary.mainMistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">✕</span>
                      <span className="text-xs text-red-300 line-through">{m.mistake}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span className="text-xs font-semibold text-emerald-300">{m.correction}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-4">{m.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Vocabulary Unlocked */}
          {summary.newVocabulary && summary.newVocabulary.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                New Professional Vocabulary Unlocked
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {summary.newVocabulary.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{v.phrase}</span>
                        <button
                          onClick={() => playWordAudio(v.phrase)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 mb-1">{v.meaning}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{v.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Practice Goal */}
          {summary.nextGoal && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
              <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider block mb-1">
                  Tomorrow's Actionable Goal
                </span>
                <p className="text-sm text-slate-200">{summary.nextGoal}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={copyReport}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Report Copied!' : 'Copy Summary Report'}</span>
          </button>

          <button
            onClick={() => {
              onSaveToProgress();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-colors"
          >
            <span>Save to My Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
