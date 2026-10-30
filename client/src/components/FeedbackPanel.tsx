import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Volume2,
  Mic,
  Copy,
  Check,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TurnRecord, TurnFeedback } from '../types';

interface FeedbackPanelProps {
  turns: TurnRecord[];
  correctionStyle: 'gentle' | 'balanced' | 'detailed';
  onStyleChange: (style: 'gentle' | 'balanced' | 'detailed') => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  turns,
  correctionStyle,
  onStyleChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [practicingSentence, setPracticingSentence] = useState<string | null>(null);
  const [practiceTranscript, setPracticeTranscript] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});

  // Audio Pronunciation via Web Speech Synthesis
  const playNativeAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clear learning
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a good English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      );
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Practice & Repeat Speech Recognition
  const startPracticeRecognition = (targetSentence: string) => {
    setPracticingSentence(targetSentence);
    setPracticeTranscript('');
    setPracticeScore(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can still listen and practice aloud!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecognizing(true);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setPracticeTranscript(speechResult);

      // Simple similarity score
      const cleanTarget = targetSentence.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
      const cleanResult = speechResult.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);

      let matches = 0;
      cleanResult.forEach((word: string) => {
        if (cleanTarget.includes(word)) matches++;
      });

      const score = Math.round((matches / Math.max(cleanTarget.length, cleanResult.length)) * 100);
      setPracticeScore(score);
      setIsRecognizing(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Practice speech recognition error:', event.error);
      setIsRecognizing(false);
    };

    recognition.onend = () => {
      setIsRecognizing(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsRecognizing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTurns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const turnsWithFeedback = turns.filter((t) => t.feedback && t.userText.trim().length > 0);

  return (
    <div className="w-full flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base">Turn-by-Turn English Feedback</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {turnsWithFeedback.length} {turnsWithFeedback.length === 1 ? 'Turn' : 'Turns'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time grammar analysis, vocabulary enhancements, and practice drills.
          </p>
        </div>

        {/* Correction Style Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
          {(['gentle', 'balanced', 'detailed'] as const).map((style) => (
            <button
              key={style}
              onClick={() => onStyleChange(style)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                correctionStyle === style
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[620px] custom-scrollbar">
        {turnsWithFeedback.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">No Spoken Turns Analyzed Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Start speaking with Coach Alex. After you finish each answer, structured grammar corrections, natural phrasing, and idiomatic vocabulary will appear here in real time.
            </p>
          </div>
        ) : (
          turnsWithFeedback
            .slice()
            .reverse()
            .map((turn, index) => {
              const fb = turn.feedback as TurnFeedback;
              const isExpanded = expandedTurns[turn.id] !== false; // Default expanded

              return (
                <div
                  key={turn.id}
                  className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 transition-all hover:border-slate-700 shadow-md"
                >
                  {/* Turn Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Turn #{turnsWithFeedback.length - index}
                      </span>
                      {fb.errorCategory !== 'none' && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            fb.errorCategory === 'grammar'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : fb.errorCategory === 'vocabulary'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : fb.errorCategory === 'filler_words'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {fb.errorCategory}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(turn.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Original Transcript */}
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      You Spoke:
                    </span>
                    <p className="text-sm text-slate-200 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      "{fb.original}"
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 pt-1">
                      {/* Corrected English */}
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Corrected English
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => playNativeAudio(fb.corrected)}
                              title="Listen to native model pronunciation"
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(fb.corrected, `corr-${turn.id}`)}
                              title="Copy corrected sentence"
                              className="p-1 text-slate-400 hover:text-emerald-300 rounded transition-colors"
                            >
                              {copiedId === `corr-${turn.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-emerald-200">
                          {fb.corrected}
                        </p>
                      </div>

                      {/* Professional / Natural Alternative */}
                      {fb.professionalAlternative && fb.professionalAlternative !== fb.corrected && (
                        <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              Natural / Professional Alternative
                            </span>
                            <button
                              onClick={() => playNativeAudio(fb.professionalAlternative)}
                              title="Listen to alternative"
                              className="p-1 text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-indigo-200">
                            {fb.professionalAlternative}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      {fb.explanation && (
                        <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{fb.explanation}</span>
                        </div>
                      )}

                      {/* Useful Phrase & Practice Drills */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                        {fb.usefulPhrase && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Key Phrase:</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {fb.usefulPhrase}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => startPracticeRecognition(fb.practiceSentence || fb.corrected)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Mic className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Practise & Repeat</span>
                        </button>
                      </div>

                      {/* Interactive Repeat Practice Box */}
                      {practicingSentence === (fb.practiceSentence || fb.corrected) && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-indigo-500/40 animate-fadeIn">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                              {isRecognizing ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                  Listening to your repetition...
                                </>
                              ) : (
                                'Repetition Evaluation'
                              )}
                            </span>
                            <button
                              onClick={() => setPracticingSentence(null)}
                              className="text-xs text-slate-400 hover:text-slate-200"
                            >
                              Close
                            </button>
                          </div>

                          <p className="text-xs text-slate-400 mb-1">Target sentence:</p>
                          <p className="text-xs text-white font-medium bg-slate-950 p-2 rounded border border-slate-800 mb-2">
                            "{practicingSentence}"
                          </p>

                          {practiceTranscript && (
                            <div className="text-xs mb-2">
                              <span className="text-slate-400">You repeated: </span>
                              <span className="text-slate-200">"{practiceTranscript}"</span>
                            </div>
                          )}

                          {practiceScore !== null && (
                            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                              <span className="text-xs text-slate-300 font-medium">Repetition Accuracy:</span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  practiceScore >= 80
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : practiceScore >= 60
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {practiceScore}% Match
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
