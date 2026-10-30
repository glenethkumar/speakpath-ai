import React, { useState } from 'react';
import {
  Flame,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  Trash2,
  Volume2,
  Calendar,
  Search,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { UserProgress, PracticeSessionRecord } from '../types';
import type { PrivacySettings } from '../hooks/useProgressStorage';

interface ProgressDashboardProps {
  progress: UserProgress;
  history: PracticeSessionRecord[];
  privacy: PrivacySettings;
  onUpdatePrivacy: (settings: PrivacySettings) => void;
  onClearHistory: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  history,
  privacy,
  onUpdatePrivacy,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const playWord = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredVocab = progress.vocabularyBank.filter(
    (v) =>
      v.phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalErrors =
    progress.recurringErrors.grammar +
    progress.recurringErrors.vocabulary +
    progress.recurringErrors.clarity +
    progress.recurringErrors.filler_words;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Spoken Practice</span>
            <span className="text-2xl font-black text-white">{progress.totalMinutes}</span>
            <span className="text-xs text-slate-500 ml-1">minutes</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="w-6 h-6 fill-orange-500/20" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Current Streak</span>
            <span className="text-2xl font-black text-white">{progress.streakDays}</span>
            <span className="text-xs text-slate-500 ml-1">{progress.streakDays === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Sessions Finished</span>
            <span className="text-2xl font-black text-white">{progress.completedSessions}</span>
            <span className="text-xs text-slate-500 ml-1">sessions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Vocabulary Vault</span>
            <span className="text-2xl font-black text-white">{progress.vocabularyBank.length}</span>
            <span className="text-xs text-slate-500 ml-1">expressions</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recurring Errors & Vocabulary Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recurring Mistakes Tracker */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Recurring Errors Breakdown</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Target areas identified across your completed conversation turns.
          </p>

          {totalErrors === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No recurring errors recorded yet. Practice more turns to build insights.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Grammar & Tenses</span>
                  <span className="text-red-400">{progress.recurringErrors.grammar} detected</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (progress.recurringErrors.grammar / totalErrors) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Vocabulary & Word Choice</span>
                  <span className="text-purple-400">{progress.recurringErrors.vocabulary} detected</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (progress.recurringErrors.vocabulary / totalErrors) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Clarity & Sentence Flow</span>
                  <span className="text-blue-400">{progress.recurringErrors.clarity} detected</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (progress.recurringErrors.clarity / totalErrors) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Filler Words & Pauses</span>
                  <span className="text-amber-400">{progress.recurringErrors.filler_words} detected</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (progress.recurringErrors.filler_words / totalErrors) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary Vault */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Your Professional Vocabulary Vault</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Collocations, idioms, and engineering terminology saved from your sessions.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vault..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {filteredVocab.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">
                  {searchTerm ? 'No vocabulary matches found.' : 'Your vault is empty. Complete a simulation to unlock phrases!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {filteredVocab.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{item.phrase}</span>
                        <button
                          onClick={() => playWord(item.phrase)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-1.5">{item.meaning}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">"{item.example}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Session History */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Recent Completed Sessions</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Review your previous practice transcripts, mistake reports, and diagnostics.
        </p>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-xs">No previous practice sessions recorded on this device yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{session.scenarioTitle}</span>
                    <span className="text-[10px] text-slate-400">{session.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 italic line-clamp-1">
                    "{session.summary.overallFeedback}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400">
                      Fluency: {session.summary.fluencyScore}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {session.durationMinutes} min • {session.turnsCount} turns
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy, Storage & Consent Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Privacy & Learning Data Controls</h3>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl mb-4">
          SpeakPath AI stores your learning history strictly in your browser's private localStorage. Raw microphone audio is processed in real time and is never stored on disk or shared.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.saveTranscripts}
                onChange={(e) =>
                  onUpdatePrivacy({ ...privacy, saveTranscripts: e.target.checked })
                }
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span>Save Session Transcripts Locally for Review</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.audioStorageConsent}
                onChange={(e) =>
                  onUpdatePrivacy({ ...privacy, audioStorageConsent: e.target.checked })
                }
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span>Opt-in Audio Caching (Default: Disabled)</span>
            </label>
          </div>

          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All My Learning History</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                >
                  Yes, Delete All
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
