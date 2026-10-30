import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Play,
  Coffee,
  Code2,
  Users,
  BookOpen,
} from 'lucide-react';
import type { Scenario } from '../types';

interface DailyPlanProps {
  scenarios: Scenario[];
  onSelectAndStart: (scenario: Scenario) => void;
}

export const DailyPlan: React.FC<DailyPlanProps> = ({
  scenarios,
  onSelectAndStart,
}) => {
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  const toggleStage = (stageNum: number) => {
    setCompletedStages((prev) =>
      prev.includes(stageNum) ? prev.filter((s) => s !== stageNum) : [...prev, stageNum]
    );
  };

  const planStages = [
    {
      stage: 1,
      title: 'Warm-up & Fluency Activation',
      duration: '5 Minutes',
      scenarioId: 'free_conversation',
      icon: <Coffee className="w-5 h-5 text-emerald-400" />,
      description:
        'Loosen your tongue and get comfortable speaking in English. Talk about your campus week, coding labs, hobbies, or college projects without worrying about perfect grammar.',
      goal: 'Overcome hesitation and speak in continuous sentences.',
    },
    {
      stage: 2,
      title: 'Core Scenario: Technical & Project Articulation',
      duration: '10 Minutes',
      scenarioId: 'tech_interview',
      icon: <Code2 className="w-5 h-5 text-cyan-400" />,
      description:
        'Explain a project you developed or an engineering algorithm. Practice technical vocabulary, architecture trade-offs, and explaining code logic clearly.',
      goal: 'Structure technical explanations logically without translating word-for-word from your native language.',
    },
    {
      stage: 3,
      title: 'High-Stakes Communication: GD or Placement HR',
      duration: '10 Minutes',
      scenarioId: 'job_interview',
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      description:
        'Engage in placement HR rounds or Group Discussion simulations. Answer behavioral STAR questions, defend a viewpoint, or politely disagree with a peer.',
      goal: 'Master professional workplace tone, assertive vocabulary, and confident body of arguments.',
    },
    {
      stage: 4,
      title: 'Review, Vocab Drills & Sentence Repetition',
      duration: '5 Minutes',
      scenarioId: 'daily_english',
      icon: <BookOpen className="w-5 h-5 text-purple-400" />,
      description:
        'Review the turn-by-turn correction cards generated today. Use the "Practise & Repeat" audio feature to repeat corrected sentences with native pronunciation.',
      goal: 'Cement new vocabulary and correct recurring grammatical patterns.',
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Daily Routine Hero */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Calendar className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                Daily English Mastery Protocol
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              30-Minute Daily Practice Routine
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Engineered for B.Tech students preparing for campus placements, international internships, and tech entrepreneurship. Progress from low-pressure conversation to high-impact career drills in just 30 focused minutes a day.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Daily Target</span>
              <span className="text-base font-bold text-white">30 Minutes / Day</span>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Stages Completed: {completedStages.length} of 4
            </span>
          </div>
          <div className="w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedStages.length / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Routine Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planStages.map((stage) => {
          const isDone = completedStages.includes(stage.stage);
          const matchedScenario =
            scenarios.find((s) => s.id === stage.scenarioId) || scenarios[0];

          return (
            <div
              key={stage.stage}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-900/40 border-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {stage.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                          Stage {stage.stage} • {stage.duration}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStage(stage.stage)}
                    title={isDone ? 'Mark as incomplete' : 'Mark stage as completed'}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {stage.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 mb-4">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                    Stage Focus:
                  </span>
                  <p className="text-xs text-slate-400">{stage.goal}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Simulation: <strong className="text-slate-200">{matchedScenario?.title}</strong>
                </span>

                <button
                  onClick={() => onSelectAndStart(matchedScenario)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Drill</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
