import { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { VoiceCoach } from './components/VoiceCoach';
import { FeedbackPanel } from './components/FeedbackPanel';
import { ScenarioSelector } from './components/ScenarioSelector';
import { DailyPlan } from './components/DailyPlan';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { QuickTranslatorModal } from './components/QuickTranslatorModal';
import { PracticePlanModal } from './components/PracticePlanModal';
import { useVoiceSession } from './hooks/useVoiceSession';
import { useProgressStorage } from './hooks/useProgressStorage';
import type { Scenario, CorrectionStyle, ServiceHealthStatus, SessionSummary } from './types';
import { apiUrl } from './utils/apiConfig';

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'free_conversation',
    title: 'Free Conversation & Campus Life',
    category: 'Foundations',
    description: 'Casual, friendly conversation about college life, engineering branch, labs, and weekend plans.',
    starterPrompt: "Hey there! I'm thrilled to chat with you today. How has your week been on campus, and what engineering subjects or projects are keeping you busy?",
    targetVocab: ['academic workload', 'extracurricular', 'pros and cons', 'hands-on experience', 'time management'],
  },
  {
    id: 'daily_english',
    title: 'Daily English & Social Etiquette',
    category: 'Foundations',
    description: 'Everyday conversations, polite requests, navigating social situations, and natural small talk.',
    starterPrompt: "Hello! Imagine you are visiting a tech conference cafeteria with colleagues. Would you like to practice ordering something politely, or striking up a conversation?",
    targetVocab: ['could you clarify', 'by any chance', 'much obliged', 'catch up with', 'grab a bite'],
  },
  {
    id: 'job_interview',
    title: 'Job Interview & HR Questions',
    category: 'Career & Placements',
    description: 'Master placement drive HR rounds, behavioral questions (STAR technique), and self-introductions.',
    starterPrompt: "Good day! Welcome to this mock HR interview session. Could you please walk me through your background, your engineering interests, and what drives you?",
    targetVocab: ['proven track record', 'proactive approach', 'collaborative mindset', 'adaptability', 'deliverables'],
  },
  {
    id: 'tech_interview',
    title: 'Technical Interview & Project Explanation',
    category: 'Career & Placements',
    description: 'Explain your B.Tech projects, system architecture, database choices, and coding logic with clarity.',
    starterPrompt: "Welcome to your technical mock interview! Tell me about the most interesting software, hardware, or engineering project you have built or are currently building.",
    targetVocab: ['architectural trade-off', 'latency bottleneck', 'scalability', 'edge case', 'seamless integration'],
  },
  {
    id: 'presentation_gd',
    title: 'Presentation & Group Discussion (GD)',
    category: 'Communication',
    description: 'Practice initiating, agreeing/disagreeing politely, summarizing viewpoints, and speaking up in group discussions.',
    starterPrompt: "Welcome to GD practice! Today's topic: 'Will Generative AI empower junior developers or reduce entry-level engineering jobs?' Whenever you're ready, share your opening perspective.",
    targetVocab: ['building upon that', 'with all due respect', 'a nuanced perspective', 'substantiate', 'paradigm shift'],
  },
  {
    id: 'client_meetings',
    title: 'Client Meetings & Professional Calls',
    category: 'Workplace Skills',
    description: 'Lead standup updates, communicate project blockers, manage client expectations, and discuss deliverables.',
    starterPrompt: "Hello! Imagine you are in a sprint demo with an international client who noticed a delay in the planned feature release. How would you greet the client, explain the blocker, and propose a solution?",
    targetVocab: ['mitigate the risk', 'status update', 'manage expectations', 'actionable next steps', 'contingency plan'],
  },
  {
    id: 'negotiation_sales',
    title: 'Business Negotiation & Sales',
    category: 'Business & Leadership',
    description: 'Pitch value, defend project pricing, negotiate deadlines or features, and reach win-win agreements.',
    starterPrompt: "Welcome! Imagine you run a freelance development agency and an enterprise customer wants a 40% discount on your project quote. How would you respond without devaluing your work?",
    targetVocab: ['value proposition', 'win-win outcome', 'scope adjustment', 'return on investment', 'non-negotiable'],
  },
  {
    id: 'startup_pitch',
    title: 'Startup Pitch & Entrepreneurship',
    category: 'Business & Leadership',
    description: 'Pitch your college startup idea to angel investors, explain TAM/SAM, monetization, and handle hard Q&A.',
    starterPrompt: "Welcome, founder! You're pitching your venture to an early-stage angel investor. Give me your 60-second elevator pitch: What is the core problem, your user, and your edge?",
    targetVocab: ['customer acquisition cost', 'market traction', 'unfair advantage', 'product-market fit', 'monetization strategy'],
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<'coach' | 'scenarios' | 'daily_plan' | 'dashboard'>('coach');
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(DEFAULT_SCENARIOS[0]);
  const [correctionStyle, setCorrectionStyle] = useState<CorrectionStyle>('balanced');
  const [serviceStatus, setServiceStatus] = useState<ServiceHealthStatus | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [isPracticePlanOpen, setIsPracticePlanOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<SessionSummary | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Session timing
  const sessionStartTimeRef = useRef<number | null>(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(1);

  // Storage and voice hooks
  const { progress, history, privacy, setPrivacy, recordSession, clearAllData } = useProgressStorage();

  const voiceSession = useVoiceSession();

  // Fetch scenarios and service health from server
  const fetchStatusAndScenarios = useCallback(async () => {
    try {
      const healthRes = await fetch(apiUrl('/api/health'));
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setServiceStatus(healthData.status);
      }
    } catch (e) {
      console.warn('Could not reach /api/health:', e);
    }

    try {
      const scenariosRes = await fetch(apiUrl('/api/scenarios'));
      if (scenariosRes.ok) {
        const data = await scenariosRes.json();
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          // Update selected scenario reference
          setSelectedScenario((prev) => data.scenarios.find((s: Scenario) => s.id === prev.id) || data.scenarios[0]);
        }
      }
    } catch (e) {
      console.warn('Using default local scenarios');
    }
  }, []);

  useEffect(() => {
    fetchStatusAndScenarios();
  }, [fetchStatusAndScenarios]);

  // Handle Voice Session Start
  const handleStartVoice = () => {
    sessionStartTimeRef.current = Date.now();
    voiceSession.startSession(selectedScenario.id, correctionStyle);
  };

  // Handle Voice Session End & Summary Generation
  const handleEndSession = async () => {
    const elapsedMs = sessionStartTimeRef.current ? Date.now() - sessionStartTimeRef.current : 60000;
    const durationMins = Math.max(1, Math.round(elapsedMs / 60000));
    setSessionDurationMinutes(durationMins);

    voiceSession.stopSession();

    // Call summary API
    try {
      const res = await fetch(apiUrl('/api/feedback/summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: voiceSession.turns.map((t) => ({
            user: t.userText,
            ai: t.aiText,
            correction: t.feedback,
          })),
          scenario: selectedScenario.id,
          durationMinutes: durationMins,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSummary(data.summary);
        setIsSummaryOpen(true);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    }
  };

  const handleSaveSummaryToProgress = () => {
    if (!currentSummary) return;

    recordSession({
      id: `session-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      scenarioId: selectedScenario.id,
      scenarioTitle: selectedScenario.title,
      durationMinutes: sessionDurationMinutes,
      turnsCount: voiceSession.turns.length,
      summary: currentSummary,
    });
  };

  const handleSelectScenarioAndStart = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setActiveTab('coach');
    sessionStartTimeRef.current = Date.now();
    voiceSession.startSession(scenario.id, correctionStyle);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakDays={progress.streakDays}
        totalMinutes={progress.totalMinutes}
        geminiConfigured={serviceStatus ? serviceStatus.geminiConfigured : true}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Global Status Banner for API Keys & Permissions */}
      <StatusBanner
        status={serviceStatus}
        micPermission={voiceSession.micPermission}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Voice Coach Studio */}
        {activeTab === 'coach' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Voice Coach Studio */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <VoiceCoach
                currentScenario={selectedScenario}
                voiceState={voiceSession.voiceState}
                isMuted={voiceSession.isMuted}
                audioVolume={voiceSession.audioVolume}
                activeUserTranscript={voiceSession.activeUserTranscript}
                activeAiTranscript={voiceSession.activeAiTranscript}
                turns={voiceSession.turns}
                errorMessage={voiceSession.errorMessage}
                onStart={handleStartVoice}
                onToggleMute={voiceSession.toggleMute}
                onInterrupt={voiceSession.interruptCoach}
                onSendText={voiceSession.sendTextMessage}
                onEndSession={handleEndSession}
                onSwitchScenario={() => setActiveTab('scenarios')}
                onOpenTranslator={() => setIsTranslatorOpen(true)}
                onOpenPracticePlan={() => setIsPracticePlanOpen(true)}
                onAttachImage={(dataUrl) => setPendingImage(dataUrl)}
                pendingImage={pendingImage}
                onClearImage={() => setPendingImage(null)}
              />
            </div>

            {/* Right Column: Turn-by-Turn Feedback Panel */}
            <div className="lg:col-span-5 h-full">
              <FeedbackPanel
                turns={voiceSession.turns}
                correctionStyle={correctionStyle}
                onStyleChange={setCorrectionStyle}
              />
            </div>
          </div>
        )}

        {/* Tab 2: 8 Learning Scenarios */}
        {activeTab === 'scenarios' && (
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            onSelectScenario={(s) => setSelectedScenario(s)}
            onStartSession={handleSelectScenarioAndStart}
          />
        )}

        {/* Tab 3: 30-Minute Daily Practice Plan */}
        {activeTab === 'daily_plan' && (
          <DailyPlan
            scenarios={scenarios}
            onSelectAndStart={handleSelectScenarioAndStart}
          />
        )}

        {/* Tab 4: Progress Analytics & Vocabulary Vault */}
        {activeTab === 'dashboard' && (
          <ProgressDashboard
            progress={progress}
            history={history}
            privacy={privacy}
            onUpdatePrivacy={setPrivacy}
            onClearHistory={clearAllData}
          />
        )}
      </main>

      {/* Modals */}
      <SessionSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={currentSummary}
        scenario={selectedScenario}
        durationMinutes={sessionDurationMinutes}
        turnsCount={voiceSession.turns.length}
        onSaveToProgress={handleSaveSummaryToProgress}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={serviceStatus}
        onRefreshStatus={fetchStatusAndScenarios}
        correctionStyle={correctionStyle}
        onStyleChange={setCorrectionStyle}
        privacy={privacy}
        onUpdatePrivacy={setPrivacy}
        onClearHistory={clearAllData}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onGetStarted={() => {
          setActiveTab('coach');
          handleStartVoice();
        }}
      />

      <QuickTranslatorModal
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
      />

      <PracticePlanModal
        isOpen={isPracticePlanOpen}
        onClose={() => setIsPracticePlanOpen(false)}
        onSelectPrompt={(promptText) => {
          setActiveTab('coach');
          if (voiceSession.voiceState === 'idle') {
            handleStartVoice();
          }
          voiceSession.sendTextMessage(promptText);
        }}
      />
    </div>
  );
}

export default App;
