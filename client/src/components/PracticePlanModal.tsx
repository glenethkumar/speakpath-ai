import { useState } from 'react';
import { X, CheckCircle2, Circle, Sparkles, Clock, Target } from 'lucide-react';
import {
  PRACTICE_EXERCISES,
  loadPracticeProgress,
  savePracticeProgress,
  type PracticeExercise,
} from '../modules/practicePlan';

interface PracticePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const PracticePlanModal: React.FC<PracticePlanModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [progress, setProgress] = useState<Record<string, boolean>>(() => loadPracticeProgress());

  if (!isOpen) return null;

  const totalExercises = PRACTICE_EXERCISES.length;
  const completedCount = Object.values(progress).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / totalExercises) * 100);

  const toggleExercise = (id: string) => {
    const updated = { ...progress, [id]: !progress[id] };
    setProgress(updated);
    savePracticeProgress(updated);
  };

  const handleStartExercise = (exercise: PracticeExercise) => {
    onSelectPrompt(exercise.promptText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily English & Career Practice Plan</h2>
              <p className="text-xs text-slate-400">
                Foundational prompts from E-Bot-2026 + B.Tech engineering interview practice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Header */}
        <div className="px-6 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">Overall Progress</span>
            <span className="text-xs font-bold text-purple-400">
              {completedCount} / {totalExercises} Completed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* List of Exercises */}
        <div className="p-6 overflow-y-auto space-y-3">
          {PRACTICE_EXERCISES.map((ex, index) => {
            const isDone = !!progress[ex.id];

            return (
              <div
                key={ex.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-900/40 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleExercise(ex.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                    title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-400">Exercise {index + 1}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
                        {ex.category}
                      </span>
                    </div>
                    <h3 className={`text-sm font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {ex.title}
                    </h3>
                    <p className="text-xs text-slate-400 italic">"{ex.promptText}"</p>
                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-400" />
                        {ex.targetFocus}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {ex.estimatedMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartExercise(ex)}
                  className="self-end sm:self-center shrink-0 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow"
                >
                  Start Practice
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
