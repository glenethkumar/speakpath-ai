import React from 'react';
import { Sparkles, Flame, Calendar, BarChart3, Settings, Mic2, HelpCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'coach' | 'scenarios' | 'daily_plan' | 'dashboard';
  setActiveTab: (tab: 'coach' | 'scenarios' | 'daily_plan' | 'dashboard') => void;
  streakDays: number;
  totalMinutes: number;
  geminiConfigured: boolean;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  totalMinutes,
  geminiConfigured,
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('coach')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                SpeakPath<span className="text-indigo-400">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                B.Tech Coach
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Spoken English & Career Fluency Studio
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'coach'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            <span className="hidden md:inline">Voice Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'scenarios'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Scenarios</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_plan')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'daily_plan'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">30-Min Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Progress</span>
          </button>
        </nav>

        {/* Right Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            <span>{streakDays} {streakDays === 1 ? 'day' : 'days'}</span>
          </div>

          {/* Practice time */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
            <span>{totalMinutes} min practiced</span>
          </div>

          {/* Quick Help Guide */}
          <button
            onClick={onOpenHelp}
            title="App Guide & Tips"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Settings & API Key"
            className={`p-2 rounded-lg transition-colors relative ${
              geminiConfigured
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Settings className="w-5 h-5" />
            {!geminiConfigured && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
