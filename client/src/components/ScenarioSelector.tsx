import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Coffee,
  Briefcase,
  Code2,
  Users,
  Building2,
  TrendingUp,
  Rocket,
  ArrowRight,
  Target,
} from 'lucide-react';
import type { Scenario } from '../types';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  onStartSession: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  onStartSession,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = [
    'All',
    'Foundations',
    'Career & Placements',
    'Communication',
    'Workplace Skills',
    'Business & Leadership',
  ];

  const filteredScenarios =
    filterCategory === 'All'
      ? scenarios
      : scenarios.filter((s) => s.category === filterCategory);

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'free_conversation':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'daily_english':
        return <Coffee className="w-5 h-5 text-emerald-400" />;
      case 'job_interview':
        return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'tech_interview':
        return <Code2 className="w-5 h-5 text-cyan-400" />;
      case 'presentation_gd':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'client_meetings':
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case 'negotiation_sales':
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      case 'startup_pitch':
        return <Rocket className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              B.Tech Spoken Practice Scenarios
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Choose a tailored simulation designed specifically for engineering undergraduates: from campus placements and technical vivas to startup pitch decks and international client calls.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredScenarios.map((scenario) => {
          const isSelected = selectedScenario.id === scenario.id;

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getScenarioIcon(scenario.id)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {scenario.category}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {scenario.title}
                      </h3>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {scenario.description}
                </p>

                {/* Target Vocabulary */}
                <div className="mb-4">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Target Engineering & Professional Vocabulary:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {scenario.targetVocab.slice(0, 4).map((vocab, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-slate-750 font-medium"
                      >
                        {vocab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[240px]">
                  "{scenario.starterPrompt.slice(0, 50)}..."
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScenario(scenario);
                    onStartSession(scenario);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isSelected
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white'
                  }`}
                >
                  <span>Start Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
