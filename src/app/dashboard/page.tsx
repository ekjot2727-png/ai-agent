'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

interface TaskPlan {
  planId: string;
  goalId: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    estimatedDuration: number;
    reasoning: string;
  }>;
  workflow: {
    id: string;
    name: string;
    reason: string;
    confidence: number;
  };
  reasoning: {
    steps: Array<{
      type: string;
      content: string;
      confidence: number;
    }>;
    summary: string;
    totalConfidence: number;
  };
  estimatedTotalDuration: number;
}

interface ExecutionStatus {
  planId: string;
  executionId: string;
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
  duration: number;
  errors: string[];
  taskTimeline: Array<{
    taskId: string;
    taskTitle: string;
    status: string;
    duration?: number;
  }>;
}

interface Reflection {
  goalAchieved: boolean;
  goalAchievementReason: string;
  successRate: number;
  score: number;
  grade: string;
  summary: string;
  insights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  improvements: string[];
  lessonsLearned: string[];
  recommendations: string[];
}

interface Optimization {
  optimizations: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
    priority: number;
  }>;
  patterns: Array<{
    type: string;
    description: string;
    frequency: number;
  }>;
  workflowRecommendations: Array<{
    workflow: string;
    score: number;
    reason: string;
  }>;
  estimatedImprovements: {
    successRate: number;
    efficiency: number;
    duration: number;
  };
}

interface AgentPhase {
  name: string;
  status: string;
  duration?: number;
}

// NEW: Failure Analysis Types
interface FailureAnalysis {
  totalFailures: number;
  failuresByType: Record<string, number>;
  rootCauses: string[];
  recommendations: string[];
}

interface RecoveryPlan {
  id: string;
  strategy: string;
  estimatedTime: number;
  confidence: number;
  steps: Array<{
    order: number;
    action: string;
    description: string;
    automated: boolean;
  }>;
  alternativeTasks: string[];
}

// NEW: CodeRabbit Review Types
interface CodeReview {
  overallScore: number;
  grade: string;
  summary: string;
  insights: Array<{
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
  securityConsiderations: Array<{
    type: string;
    risk: string;
    title: string;
    mitigation: string;
  }>;
  performanceRecommendations: Array<{
    type: string;
    impact: string;
    title: string;
    expectedImprovement: string;
  }>;
  agentNarrative: string;
}

// NEW: Agent Narrative Types
interface AgentNarrative {
  context: string;
  tone: string;
  message: string;
  confidence: number;
}

interface AgentDecision {
  phase: string;
  decision: string;
  reasoning: string;
  selectedBecause: string;
  confidence: number;
}

interface AgentResponse {
  success: boolean;
  goal: string;
  runId: string;
  timestamp: string;
  phases: AgentPhase[];
  taskPlan?: TaskPlan;
  executionStatus?: ExecutionStatus;
  reflection?: Reflection;
  optimization?: Optimization;
  // NEW enhanced fields
  failureAnalysis?: FailureAnalysis;
  recoveryPlans?: RecoveryPlan[];
  codeReview?: CodeReview;
  narratives?: AgentNarrative[];
  agentDecisions?: AgentDecision[];
  summary: string;
  totalDuration: number;
  logs?: Array<{
    timestamp: string;
    level: string;
    agent: string;
    message: string;
  }>;
  error?: string;
}

interface EvolutionData {
  currentStrategy: {
    id: string;
    version: number;
    rulesCount: number;
    rules: Array<{
      id: string;
      condition: string;
      action: string;
      priority: number;
      effectiveness: number;
      timesApplied: number;
    }>;
    learnings: string[];
    metrics: {
      averageSuccessRate: number;
      averageExecutionTime: number;
      improvementRate: number;
      rulesApplied: number;
    };
  };
  suggestions: {
    total: number;
    pending: number;
    applied: number;
    items: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      impact: string;
      confidence: number;
      autoApplicable: boolean;
      applied: boolean;
    }>;
  };
  history: {
    totalEvolutions: number;
    reports: Array<{
      id: string;
      timestamp: string;
      runsAnalyzed: number;
      newSuggestions: number;
      appliedImprovements: string[];
      delta: number;
    }>;
  };
}

interface MemoryData {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageScore: number;
  topInsights: string[];
  topImprovements: string[];
  recentRuns: Array<{
    id: string;
    goal: string;
    success: boolean;
    score: number;
    timestamp: string;
  }>;
}

type MainTab = 'overview' | 'reasoning' | 'memory' | 'evolution' | 'coderabbit' | 'failures' | 'evaluation' | 'timeline' | 'skills' | 'testing';
type AgentStatus = 'idle' | 'planning' | 'executing' | 'reflecting' | 'optimizing' | 'complete' | 'error';

// =============================================================================
// Workflow Steps (Kestra-style)
// =============================================================================

const WORKFLOW_STEPS = [
  { id: 'init', name: 'Initialize', icon: '🚀' },
  { id: 'plan', name: 'Plan Tasks', icon: '📋' },
  { id: 'validate', name: 'Validate', icon: '✓' },
  { id: 'execute', name: 'Execute', icon: '⚡' },
  { id: 'reflect', name: 'Reflect', icon: '🔍' },
  { id: 'optimize', name: 'Optimize', icon: '📈' },
  { id: 'complete', name: 'Complete', icon: '✅' },
];

// =============================================================================
// Dashboard Component
// =============================================================================

export default function Dashboard() {
  // State
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [autonomyMode, setAutonomyMode] = useState(false);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);
  const [timeline, setTimeline] = useState<Array<{ time: string; agent: string; action: string; status: string }>>([]);

  // =============================================================================
  // Effects
  // =============================================================================

  useEffect(() => {
    fetchEvolutionData();
    fetchMemoryData();
    const saved = sessionStorage.getItem('autonomyMode');
    if (saved) setAutonomyMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('autonomyMode', JSON.stringify(autonomyMode));
  }, [autonomyMode]);

  // =============================================================================
  // API Functions
  // =============================================================================

  const fetchEvolutionData = async () => {
    try {
      const res = await fetch('/api/agent/evolution');
      const data = await res.json();
      if (data.success) {
        setEvolutionData(data.evolution);
      }
    } catch (err) {
      console.error('Failed to fetch evolution data:', err);
    }
  };

  const fetchMemoryData = async () => {
    try {
      const res = await fetch('/api/agent/goal');
      const data = await res.json();
      setMemoryData({
        totalRuns: data.memoryStats?.totalRuns || 0,
        successfulRuns: data.memoryStats?.successfulRuns || 0,
        failedRuns: data.memoryStats?.failedRuns || 0,
        averageScore: data.memoryStats?.averageScore || 0,
        topInsights: data.memoryStats?.topInsights || [],
        topImprovements: data.memoryStats?.topImprovements || [],
        recentRuns: data.recentRuns || [],
      });
    } catch (err) {
      console.error('Failed to fetch memory data:', err);
    }
  };

  const runAgent = async () => {
    if (!goal.trim() || goal.trim().length < 10) {
      setError('Please enter a goal with at least 10 characters');
      return;
    }

    setError(null);
    setResponse(null);
    setTimeline([]);
    setCurrentWorkflowStep(0);

    const simulateStep = (stepIndex: number, statusUpdate: AgentStatus) => {
      setCurrentWorkflowStep(stepIndex);
      setStatus(statusUpdate);
      setTimeline(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        agent: WORKFLOW_STEPS[stepIndex].name,
        action: `${WORKFLOW_STEPS[stepIndex].icon} ${WORKFLOW_STEPS[stepIndex].name}`,
        status: 'running'
      }]);
    };

    try {
      simulateStep(0, 'planning');
      await new Promise(r => setTimeout(r, 300));
      
      simulateStep(1, 'planning');
      await new Promise(r => setTimeout(r, 300));

      simulateStep(2, 'executing');
      
      const res = await fetch('/api/agent/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goal: goal.trim(),
          options: { 
            verboseLogging: true,
            enableOptimization: autonomyMode
          }
        }),
      });

      const data: AgentResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process goal');
      }

      simulateStep(3, 'executing');
      await new Promise(r => setTimeout(r, 200));

      simulateStep(4, 'reflecting');
      await new Promise(r => setTimeout(r, 200));

      if (autonomyMode) {
        simulateStep(5, 'optimizing');
        await fetch('/api/agent/evolution', { method: 'POST' });
        await fetchEvolutionData();
      }

      simulateStep(6, 'complete');
      setResponse(data);
      setStatus(data.success ? 'complete' : 'error');

      await Promise.all([fetchEvolutionData(), fetchMemoryData()]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  const evolveStrategy = async () => {
    try {
      const res = await fetch('/api/agent/evolution', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchEvolutionData();
      }
    } catch (err) {
      console.error('Evolution failed:', err);
    }
  };

  const applySuggestion = async (suggestionId: string) => {
    try {
      await fetch('/api/agent/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applySuggestionId: suggestionId }),
      });
      await fetchEvolutionData();
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
    }
  };

  const resetAgent = () => {
    setGoal('');
    setStatus('idle');
    setResponse(null);
    setError(null);
    setTimeline([]);
    setCurrentWorkflowStep(0);
    setMainTab('overview');
  };

  // =============================================================================
  // Render
  // =============================================================================

  const agentBadges = [
    { name: 'Planner', active: status === 'planning', done: !!response?.taskPlan },
    { name: 'Executor', active: status === 'executing', done: !!response?.executionStatus },
    { name: 'Reflector', active: status === 'reflecting', done: !!response?.reflection },
    { name: 'Optimizer', active: status === 'optimizing', done: !!response?.optimization },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">AutoOps AI</h1>
                <p className="text-xs text-slate-400">Autonomous Agent Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Agent Status Badges */}
              <div className="hidden md:flex items-center gap-2">
                {agentBadges.map(badge => (
                  <div 
                    key={badge.name}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      badge.active 
                        ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50' 
                        : badge.done
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span className={badge.active ? 'animate-pulse' : ''}>{badge.name}</span>
                  </div>
                ))}
              </div>

              {/* Autonomy Mode Toggle */}
              <button
                onClick={() => setAutonomyMode(!autonomyMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  autonomyMode 
                    ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${autonomyMode ? 'bg-violet-500' : 'bg-slate-600'}`}>
                  <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all ${autonomyMode ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span>Autonomy</span>
              </button>

              {/* Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                status === 'idle' ? 'bg-slate-500/20' :
                status === 'complete' ? 'bg-emerald-500/20' :
                status === 'error' ? 'bg-red-500/20' :
                'bg-violet-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  status === 'idle' ? 'bg-slate-500' :
                  status === 'complete' ? 'bg-emerald-500' :
                  status === 'error' ? 'bg-red-500' :
                  'bg-violet-500 animate-pulse'
                }`} />
                <span className="text-sm font-medium capitalize">{status}</span>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex gap-1 mt-4 -mb-px overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'reasoning', label: 'Reasoning', icon: '🧠' },
              { id: 'memory', label: 'Memory', icon: '💾' },
              { id: 'evolution', label: 'Evolution', icon: '🧬' },
              { id: 'coderabbit', label: 'CodeRabbit', icon: '🐰' },
              { id: 'failures', label: 'Failures', icon: '🔧' },
              { id: 'evaluation', label: 'Evaluation', icon: '📈' },
              { id: 'timeline', label: 'Timeline', icon: '⏱️' },
              { id: 'skills', label: 'Skills', icon: '🎯' },
              { id: 'testing', label: 'Testing', icon: '🧪' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id as MainTab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  mainTab === tab.id
                    ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Autonomy Mode Banner */}
        {autonomyMode && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-violet-300">Autonomy Mode Active</h3>
                <p className="text-sm text-slate-400">Auto-optimization enabled • Proactive suggestions • No confirmations required</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {mainTab === 'overview' && (
          <OverviewTab 
            goal={goal}
            setGoal={setGoal}
            status={status}
            response={response}
            error={error}
            runAgent={runAgent}
            resetAgent={resetAgent}
            currentWorkflowStep={currentWorkflowStep}
            timeline={timeline}
            autonomyMode={autonomyMode}
          />
        )}

        {mainTab === 'reasoning' && (
          <ReasoningTab response={response} timeline={timeline} />
        )}

        {mainTab === 'memory' && (
          <MemoryTab memoryData={memoryData} />
        )}

        {mainTab === 'evolution' && (
          <EvolutionTab 
            evolutionData={evolutionData} 
            evolveStrategy={evolveStrategy}
            applySuggestion={applySuggestion}
            autonomyMode={autonomyMode}
          />
        )}

        {mainTab === 'coderabbit' && (
          <CodeRabbitTab response={response} />
        )}

        {mainTab === 'failures' && (
          <FailuresTab response={response} />
        )}

        {mainTab === 'evaluation' && (
          <EvaluationTab response={response} />
        )}

        {mainTab === 'timeline' && (
          <TimelineTab response={response} />
        )}

        {mainTab === 'skills' && (
          <SkillsTab />
        )}

        {mainTab === 'testing' && (
          <TestingTab />
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Overview Tab Component
// =============================================================================

function OverviewTab({ 
  goal, setGoal, status, response, error, runAgent, resetAgent, 
  currentWorkflowStep, timeline, autonomyMode 
}: {
  goal: string;
  setGoal: (g: string) => void;
  status: AgentStatus;
  response: AgentResponse | null;
  error: string | null;
  runAgent: () => void;
  resetAgent: () => void;
  currentWorkflowStep: number;
  timeline: Array<{ time: string; agent: string; action: string; status: string }>;
  autonomyMode: boolean;
}) {
  const isRunning = status !== 'idle' && status !== 'complete' && status !== 'error';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls */}
      <div className="space-y-6">
        {/* Goal Input Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>🎯</span> Mission Control
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Define Your Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Create a data pipeline for user analytics..."
                className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
                disabled={isRunning}
              />
              <p className="text-xs text-slate-500 mt-2">{goal.length}/10 characters minimum</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runAgent}
                disabled={isRunning}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    {autonomyMode ? 'Auto-Run Agent' : 'Run Agent'}
                  </>
                )}
              </button>
              
              {(status === 'complete' || status === 'error') && (
                <button onClick={resetAgent} className="py-3 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 transition-all">
                  🔄
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Visual Workflow Display */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>⚡</span> Workflow Pipeline
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isComplete = idx < currentWorkflowStep;
                const isCurrent = idx === currentWorkflowStep && status !== 'idle';
                
                return (
                  <div key={step.id} className="relative">
                    {/* Connector */}
                    {idx > 0 && (
                      <div className={`absolute -top-3 left-4 w-0.5 h-3 transition-colors ${isComplete ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    )}
                    
                    {/* Step */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                      isComplete 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : isCurrent
                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-500'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        isComplete ? 'bg-emerald-500/20' : isCurrent ? 'bg-violet-500/20' : 'bg-slate-700'
                      }`}>
                        {isComplete ? '✓' : step.icon}
                      </div>
                      <span className="font-medium flex-1">{step.name}</span>
                      {isCurrent && <span className="text-xs animate-pulse">Running...</span>}
                      {idx < WORKFLOW_STEPS.length - 1 && (
                        <span className={`text-lg ${isComplete ? 'text-emerald-500' : 'text-slate-700'}`}>→</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden h-full min-h-[600px]">
          {!response ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Active Mission</h3>
              <p className="text-sm text-center max-w-sm">
                Enter a goal and click &quot;Run Agent&quot; to start autonomous task execution
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Run ID: {response.runId.slice(0, 8)}...</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    response.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {response.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <p className="text-slate-300">{response.summary}</p>
                <p className="text-xs text-slate-500 mt-2">Duration: {response.totalDuration}ms</p>
              </div>

              {/* Tasks */}
              {response.taskPlan && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                    Generated Tasks ({response.taskPlan.tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {response.taskPlan.tasks.map((task, idx) => {
                      const execution = response.executionStatus?.taskTimeline.find(t => t.taskId === task.id);
                      return (
                        <div key={task.id} className={`p-3 rounded-lg border transition-all ${
                          execution?.status === 'completed' 
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : execution?.status === 'failed'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-slate-500">{task.type} • {task.priority}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              execution?.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              execution?.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {execution?.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reflection Score */}
              {response.reflection && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Performance Score</p>
                      <p className="text-3xl font-bold">
                        <span className={
                          response.reflection.score >= 80 ? 'text-emerald-400' :
                          response.reflection.score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }>{response.reflection.score}</span>
                        <span className="text-lg text-slate-500">/100</span>
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full ${
                      response.reflection.goalAchieved 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {response.reflection.goalAchieved ? '🎯 Goal Achieved' : '⚠️ Partial'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Reasoning Tab Component
// =============================================================================

function ReasoningTab({ response, timeline }: { 
  response: AgentResponse | null;
  timeline: Array<{ time: string; agent: string; action: string; status: string }>;
}) {
  if (!response) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
        <span className="text-4xl mb-4 block">🧠</span>
        <h3 className="text-lg font-medium text-slate-400">No Reasoning Data</h3>
        <p className="text-sm text-slate-500 mt-2">Run the agent to see detailed reasoning traces</p>
      </div>
    );
  }

  const reasoningSteps = response.taskPlan?.reasoning.steps || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeline View */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>📜</span> Action Timeline
          </h2>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
            <div className="space-y-4">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{event.action}</span>
                      <span className="text-xs text-slate-500">{event.time}</span>
                    </div>
                    <span className="text-xs text-slate-400">{event.agent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning Chain */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>💭</span> Reasoning Chain
          </h2>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-3">
            {reasoningSteps.map((step, idx) => {
              const colorMap: Record<string, string> = {
                observation: 'blue',
                thought: 'purple',
                analysis: 'amber',
                decision: 'emerald',
                action: 'fuchsia'
              };
              const color = colorMap[step.type] || 'slate';
              
              return (
                <div key={idx} className={`p-3 rounded-lg border bg-${color}-500/10 border-${color}-500/20`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase bg-${color}-500/20 text-${color}-400`}>
                      {step.type}
                    </span>
                    <span className="text-xs text-slate-500">{(step.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                  <p className="text-sm text-slate-300">{step.content}</p>
                </div>
              );
            })}
          </div>

          {/* Workflow Selection Reasoning */}
          {response.taskPlan?.workflow && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <h4 className="font-semibold text-violet-300 mb-2">Why This Workflow?</h4>
              <p className="text-sm text-slate-300 mb-2">{response.taskPlan.workflow.reason}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Confidence:</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${response.taskPlan.workflow.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-violet-400">
                  {(response.taskPlan.workflow.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Insights */}
          {response.reflection?.insights && response.reflection.insights.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-slate-300 mb-3">Key Insights</h4>
              <div className="space-y-2">
                {response.reflection.insights.map((insight, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="font-medium text-sm text-slate-300">{insight.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Memory Tab Component
// =============================================================================

function MemoryTab({ memoryData }: { memoryData: MemoryData | null }) {
  if (!memoryData) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
        <span className="text-4xl mb-4 block">💾</span>
        <h3 className="text-lg font-medium text-slate-400">Loading Memory...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Runs</p>
          <p className="text-3xl font-bold text-violet-400 mt-1">{memoryData.totalRuns}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Successful</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{memoryData.successfulRuns}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Failed</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{memoryData.failedRuns}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Score</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{memoryData.averageScore.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Runs */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>📋</span> Recent Runs
            </h2>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {memoryData.recentRuns.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No runs recorded yet</p>
            ) : (
              <div className="space-y-3">
                {memoryData.recentRuns.map(run => (
                  <div key={run.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        run.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {run.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                      <span className="text-xs text-slate-500">Score: {run.score}</span>
                    </div>
                    <p className="text-sm text-slate-300">{run.goal}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(run.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Learnings */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>💡</span> Accumulated Learnings
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Top Insights</h4>
              {memoryData.topInsights.length === 0 ? (
                <p className="text-xs text-slate-500">No insights recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {memoryData.topInsights.slice(0, 3).map((insight, idx) => (
                    <div key={idx} className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Suggested Improvements</h4>
              {memoryData.topImprovements.length === 0 ? (
                <p className="text-xs text-slate-500">No improvements recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {memoryData.topImprovements.slice(0, 3).map((improvement, idx) => (
                    <div key={idx} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      {improvement}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Evolution Tab Component
// =============================================================================

function EvolutionTab({ 
  evolutionData, 
  evolveStrategy, 
  applySuggestion,
  autonomyMode 
}: { 
  evolutionData: EvolutionData | null;
  evolveStrategy: () => void;
  applySuggestion: (id: string) => void;
  autonomyMode: boolean;
}) {
  if (!evolutionData) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
        <span className="text-4xl mb-4 block">🧬</span>
        <h3 className="text-lg font-medium text-slate-400">Loading Evolution Data...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <span>🧬</span> Current Strategy
            <span className="text-xs text-slate-500">v{evolutionData.currentStrategy.version}</span>
          </h2>
          <button
            onClick={evolveStrategy}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-sm font-medium transition-all"
          >
            🚀 Evolve Strategy
          </button>
        </div>
        <div className="p-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-xs text-slate-400">Success Rate</p>
              <p className="text-xl font-bold text-emerald-400">
                {(evolutionData.currentStrategy.metrics.averageSuccessRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-xs text-slate-400">Avg Time</p>
              <p className="text-xl font-bold text-blue-400">
                {evolutionData.currentStrategy.metrics.averageExecutionTime.toFixed(1)}s
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-xs text-slate-400">Improvement</p>
              <p className="text-xl font-bold text-violet-400">
                {(evolutionData.currentStrategy.metrics.improvementRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-xs text-slate-400">Rules Applied</p>
              <p className="text-xl font-bold text-amber-400">
                {evolutionData.currentStrategy.metrics.rulesApplied}
              </p>
            </div>
          </div>

          {/* Active Rules */}
          <h4 className="text-sm font-medium text-slate-400 mb-3">Active Strategy Rules</h4>
          <div className="space-y-2">
            {evolutionData.currentStrategy.rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">
                  P{rule.priority}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <span className="text-slate-400">If</span> {rule.condition} <span className="text-slate-400">→</span> {rule.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    Effectiveness: {(rule.effectiveness * 100).toFixed(0)}% • Applied {rule.timesApplied}x
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>💡</span> Optimization Suggestions
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {evolutionData.suggestions.pending} pending
            </span>
          </h2>
        </div>
        <div className="p-4">
          {evolutionData.suggestions.items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No suggestions yet. Run the agent to generate optimization suggestions.</p>
          ) : (
            <div className="space-y-3">
              {evolutionData.suggestions.items.filter(s => !s.applied).map(suggestion => (
                <div key={suggestion.id} className={`p-4 rounded-lg border transition-all ${
                  suggestion.impact === 'high' 
                    ? 'bg-violet-500/10 border-violet-500/20' 
                    : suggestion.impact === 'medium'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          suggestion.category === 'performance' ? 'bg-blue-500/20 text-blue-400' :
                          suggestion.category === 'accuracy' ? 'bg-emerald-500/20 text-emerald-400' :
                          suggestion.category === 'efficiency' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {suggestion.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          suggestion.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                          suggestion.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {suggestion.impact} impact
                        </span>
                      </div>
                      <h4 className="font-medium text-slate-200">{suggestion.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{suggestion.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                        {suggestion.autoApplicable && ' • Auto-applicable'}
                      </p>
                    </div>
                    {!autonomyMode && (
                      <button
                        onClick={() => applySuggestion(suggestion.id)}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-all whitespace-nowrap"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evolution History */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>📈</span> Evolution History
          </h2>
        </div>
        <div className="p-4">
          {evolutionData.history.reports.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No evolution history yet</p>
          ) : (
            <div className="space-y-2">
              {evolutionData.history.reports.map(report => (
                <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                  <div className="text-2xl">🧬</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Evolution Cycle</p>
                    <p className="text-xs text-slate-500">
                      Analyzed {report.runsAnalyzed} runs • {report.newSuggestions} new suggestions
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    report.delta > 0 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : report.delta < 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {report.delta > 0 ? '+' : ''}{(report.delta * 100).toFixed(1)}%
                  </div>
                  <span className="text-xs text-slate-500">{new Date(report.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learnings */}
      {evolutionData.currentStrategy.learnings.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>📚</span> Strategy Learnings
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {evolutionData.currentStrategy.learnings.slice(-5).map((learning, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-800/50 text-sm text-slate-300">
                  {learning}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CodeRabbit Tab Component (AI Code Review)
// =============================================================================

function CodeRabbitTab({ response }: { response: AgentResponse | null }) {
  if (!response?.codeReview) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
        <div className="text-6xl mb-4">🐰</div>
        <h2 className="text-xl font-semibold text-slate-300 mb-2">CodeRabbit AI Review</h2>
        <p className="text-slate-500">Run a workflow to generate AI-powered code review insights</p>
      </div>
    );
  }

  const review = response.codeReview;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'from-emerald-500 to-green-500';
      case 'B': return 'from-blue-500 to-cyan-500';
      case 'C': return 'from-amber-500 to-yellow-500';
      case 'D': return 'from-orange-500 to-amber-500';
      default: return 'from-red-500 to-pink-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'suggestion': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Score Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Score Circle */}
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getGradeColor(review.grade)} p-1`}>
              <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{review.grade}</span>
                <span className="text-xs text-slate-400">{review.overallScore}/100</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🐰</span>
                <h2 className="text-xl font-bold">CodeRabbit Review</h2>
              </div>
              <p className="text-slate-400">{review.summary}</p>
            </div>
          </div>
        </div>
        
        {/* Agent Narrative */}
        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-violet-300 mb-1">AI Agent Analysis</p>
                <p className="text-sm text-slate-300">{review.agentNarrative}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Insights */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold flex items-center gap-2">
              <span>💡</span> Code Insights
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {review.insights.map((insight, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50">
                    {insight.category}
                  </span>
                  <span className="text-xs uppercase opacity-75">{insight.severity}</span>
                </div>
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                <p className="text-xs mt-2 italic text-slate-500">💡 {insight.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Considerations */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold flex items-center gap-2">
              <span>🔒</span> Security Considerations
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {review.securityConsiderations.map((security, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(security.risk)}`}>
                    {security.risk} risk
                  </span>
                  <span className="text-xs text-slate-500">{security.type}</span>
                </div>
                <h4 className="font-medium text-sm text-slate-200">{security.title}</h4>
                <p className="text-xs text-slate-400 mt-2">
                  <span className="text-emerald-400">Mitigation:</span> {security.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold flex items-center gap-2">
            <span>⚡</span> Performance Recommendations
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {review.performanceRecommendations.map((perf, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    perf.impact === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                    perf.impact === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {perf.impact} impact
                  </span>
                  <span className="text-xs text-slate-500">{perf.type}</span>
                </div>
                <h4 className="font-medium text-sm text-slate-200">{perf.title}</h4>
                <p className="text-xs text-emerald-400 mt-2">Expected: {perf.expectedImprovement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Failures Tab Component (Failure Handling & Recovery)
// =============================================================================

function FailuresTab({ response }: { response: AgentResponse | null }) {
  const hasFailures = response?.failureAnalysis && response.failureAnalysis.totalFailures > 0;
  const hasRecovery = response?.recoveryPlans && response.recoveryPlans.length > 0;

  if (!hasFailures && !hasRecovery) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-emerald-400 mb-2">No Failures Detected</h2>
        <p className="text-slate-500">Your workflow executed successfully without any failures</p>
        {!response && (
          <p className="text-slate-600 mt-2 text-sm">Run a workflow to see failure analysis</p>
        )}
      </div>
    );
  }

  const analysis = response?.failureAnalysis;
  const plans = response?.recoveryPlans || [];

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'retry': return '🔄';
      case 'skip': return '⏭️';
      case 'fallback': return '🔀';
      case 'partial-completion': return '📊';
      case 'manual-intervention': return '👤';
      case 'rollback': return '⏪';
      default: return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      {/* Failure Analysis Overview */}
      {analysis && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-red-500/5">
            <h2 className="font-semibold flex items-center gap-2 text-red-400">
              <span>⚠️</span> Failure Analysis
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-3xl font-bold text-red-400">{analysis.totalFailures}</div>
                <div className="text-xs text-slate-400 mt-1">Total Failures</div>
              </div>
              {Object.entries(analysis.failuresByType).slice(0, 3).map(([type, count]) => (
                <div key={type} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-amber-400">{count}</div>
                  <div className="text-xs text-slate-400 mt-1 capitalize">{type}</div>
                </div>
              ))}
            </div>

            {/* Root Causes */}
            {analysis.rootCauses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Root Causes Identified</h3>
                <div className="space-y-2">
                  {analysis.rootCauses.map((cause, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-red-400">•</span>
                      <span className="text-sm text-slate-300">{cause}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-400">💡</span>
                      <span className="text-sm text-emerald-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recovery Plans */}
      {plans.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-violet-500/5">
            <h2 className="font-semibold flex items-center gap-2 text-violet-400">
              <span>🔧</span> Recovery Plans
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {plans.map((plan, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStrategyIcon(plan.strategy)}</span>
                    <div>
                      <h4 className="font-medium text-slate-200 capitalize">
                        {plan.strategy.replace('-', ' ')} Strategy
                      </h4>
                      <p className="text-xs text-slate-500">
                        Confidence: {(plan.confidence * 100).toFixed(0)}% • Est. Duration: {plan.estimatedTime}ms
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                    {plan.steps.length} steps
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-700/30">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-300">{step.action}</p>
                        <p className="text-xs text-slate-500">{step.description}</p>
                      </div>
                      <span className="text-xs text-slate-500">{step.automated ? '🤖 Auto' : '👤 Manual'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Narratives */}
      {response?.narratives && response.narratives.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>🎙️</span> Agent Narrations
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {response.narratives.map((narrative, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  narrative.tone === 'confident' ? 'bg-emerald-500/20 text-emerald-400' :
                  narrative.tone === 'analytical' ? 'bg-blue-500/20 text-blue-400' :
                  narrative.tone === 'cautious' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {narrative.context}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{narrative.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Confidence: {(narrative.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Decisions */}
      {response?.agentDecisions && response.agentDecisions.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>🧠</span> Decision Log
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {response.agentDecisions.map((decision, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-400 capitalize">
                    {decision.phase}
                  </span>
                  <span className="text-xs text-slate-500">
                    {(decision.confidence * 100).toFixed(0)}% confident
                  </span>
                </div>
                <h4 className="font-medium text-slate-200">{decision.decision}</h4>
                <p className="text-sm text-slate-400 mt-1">{decision.reasoning}</p>
                <p className="text-xs text-emerald-400 mt-2 italic">
                  → Selected because: {decision.selectedBecause}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Evaluation Tab Component - Agent Scoring & Test Scenarios
// =============================================================================

function EvaluationTab({ response }: { response: AgentResponse | null }) {
  const [activeSubTab, setActiveSubTab] = useState<'scorecard' | 'scenarios' | 'comparison'>('scorecard');
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<Array<{
    id: string;
    name: string;
    category: string;
    passed: boolean;
    score: number;
    duration: number;
  }>>([]);

  // Mock scoring data based on response
  const scorecard = {
    overall: {
      grade: response ? 'A-' : 'N/A',
      score: response ? 87 : 0,
      trend: '+5%'
    },
    planning: {
      grade: response ? 'A' : 'N/A',
      score: response ? 92 : 0,
      metrics: {
        goalAlignment: 95,
        taskBreakdown: 88,
        dependencyMapping: 93,
        completeness: 90
      }
    },
    execution: {
      grade: response ? 'B+' : 'N/A',
      score: response ? 85 : 0,
      metrics: {
        taskCompletion: 88,
        errorRate: 12,
        recoverySuccess: 80,
        efficiency: 82
      }
    },
    optimization: {
      grade: response ? 'A-' : 'N/A',
      score: response ? 88 : 0,
      metrics: {
        improvementRate: 90,
        suggestionQuality: 85,
        iterativeGains: 88,
        convergence: 90
      }
    }
  };

  const scenarios = [
    { id: 'simple-crud', name: 'Simple CRUD Operations', category: 'basic', difficulty: 1 },
    { id: 'api-integration', name: 'API Integration', category: 'integration', difficulty: 2 },
    { id: 'error-recovery', name: 'Error Recovery Test', category: 'resilience', difficulty: 3 },
    { id: 'multi-agent', name: 'Multi-Agent Coordination', category: 'advanced', difficulty: 4 },
    { id: 'stress-test', name: 'High Load Stress Test', category: 'performance', difficulty: 5 },
    { id: 'edge-cases', name: 'Edge Case Handling', category: 'resilience', difficulty: 4 },
  ];

  const runAllScenarios = async () => {
    setIsRunningScenario(true);
    setScenarioResults([]);
    
    for (const scenario of scenarios) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setScenarioResults(prev => [...prev, {
        id: scenario.id,
        name: scenario.name,
        category: scenario.category,
        passed: Math.random() > 0.2,
        score: Math.floor(70 + Math.random() * 30),
        duration: Math.floor(500 + Math.random() * 2000)
      }]);
    }
    setIsRunningScenario(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit">
        {[
          { id: 'scorecard', label: 'Scorecard', icon: '📊' },
          { id: 'scenarios', label: 'Test Scenarios', icon: '🧪' },
          { id: 'comparison', label: 'Plan Comparison', icon: '⚖️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeSubTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scorecard View */}
      {activeSubTab === 'scorecard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Score */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold flex items-center gap-2">
                <span>🏆</span> Overall Performance Score
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {scorecard.overall.grade}
                  </div>
                  <div className="text-slate-400 mt-2">Grade</div>
                </div>
                <div className="h-20 w-px bg-slate-700" />
                <div className="text-center">
                  <div className="text-6xl font-bold text-white">{scorecard.overall.score}</div>
                  <div className="text-slate-400 mt-2">Score</div>
                </div>
                <div className="h-20 w-px bg-slate-700" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">{scorecard.overall.trend}</div>
                  <div className="text-slate-400 mt-2">vs Last Run</div>
                </div>
              </div>
            </div>
          </div>

          {/* Planning Score */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold flex items-center gap-2">
                <span>📋</span> Planning Quality
                <span className="ml-auto text-2xl font-bold text-emerald-400">{scorecard.planning.grade}</span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(scorecard.planning.metrics).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-white font-medium">{value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Score */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold flex items-center gap-2">
                <span>⚡</span> Execution Reliability
                <span className="ml-auto text-2xl font-bold text-blue-400">{scorecard.execution.grade}</span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(scorecard.execution.metrics).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-white font-medium">{key === 'errorRate' ? `${value}%` : `${value}%`}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        key === 'errorRate' 
                          ? 'bg-gradient-to-r from-red-500 to-amber-500' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Score */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold flex items-center gap-2">
                <span>📈</span> Optimization Effectiveness
                <span className="ml-auto text-2xl font-bold text-amber-400">{scorecard.optimization.grade}</span>
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(scorecard.optimization.metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-3xl font-bold text-white">{value}%</div>
                    <div className="text-sm text-slate-400 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Scenarios View */}
      {activeSubTab === 'scenarios' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Automated Test Scenarios</h2>
              <p className="text-slate-400 text-sm mt-1">Run predefined scenarios to evaluate agent capabilities</p>
            </div>
            <button
              onClick={runAllScenarios}
              disabled={isRunningScenario}
              className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isRunningScenario ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Run All Scenarios
                </>
              )}
            </button>
          </div>

          <div className="grid gap-4">
            {scenarios.map(scenario => {
              const result = scenarioResults.find(r => r.id === scenario.id);
              const isRunning = isRunningScenario && !result && scenarioResults.length > 0 && 
                scenarios.indexOf(scenario) === scenarioResults.length;

              return (
                <div 
                  key={scenario.id}
                  className={`p-4 rounded-xl border transition-all ${
                    result?.passed 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : result && !result.passed
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      result?.passed 
                        ? 'bg-emerald-500/20' 
                        : result && !result.passed
                          ? 'bg-red-500/20'
                          : isRunning
                            ? 'bg-violet-500/20'
                            : 'bg-slate-800'
                    }`}>
                      {result?.passed ? '✓' : result && !result.passed ? '✗' : isRunning ? (
                        <svg className="w-5 h-5 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{scenario.name}</h3>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 capitalize">
                          {scenario.category}
                        </span>
                        <div className="flex gap-0.5">
                          {Array(5).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-full ${
                                i < scenario.difficulty ? 'bg-amber-500' : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {result && (
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-slate-400">Score: <span className="text-white font-medium">{result.score}%</span></span>
                          <span className="text-slate-400">Duration: <span className="text-white font-medium">{result.duration}ms</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Comparison View */}
      {activeSubTab === 'comparison' && response && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Original vs Optimized Plan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>📋</span> Original Plan
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {response.taskPlan?.tasks?.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 text-sm">{idx + 1}.</span>
                      <div>
                        <p className="text-sm text-slate-200">{task.description || task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-slate-500">Priority: {task.priority || 'medium'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized Plan */}
            <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 overflow-hidden">
              <div className="p-4 border-b border-emerald-500/30 bg-emerald-500/10">
                <h3 className="font-semibold flex items-center gap-2 text-emerald-400">
                  <span>✨</span> Optimization Suggestions
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-emerald-500/20">
                    +{response.optimization?.estimatedImprovements?.efficiency || 15}% efficient
                  </span>
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {response.optimization?.optimizations?.slice(0, 5).map((opt, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 text-sm">{idx + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{opt.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            Impact: {opt.impact}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            Effort: {opt.effort}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-slate-400 text-sm">Optimization suggestions will appear after execution</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!response && activeSubTab === 'comparison' && (
        <div className="text-center py-12 text-slate-400">
          <p>Run an agent to see plan comparison</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Timeline Tab Component - Agent Decision Playback
// =============================================================================

function TimelineTab({ response }: { response: AgentResponse | null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Generate timeline events from response
  const timelineEvents = response ? [
    { time: '0:00', phase: 'initialization', agent: 'Orchestrator', action: 'Goal received', reasoning: 'Parsing user goal and initializing agent pipeline', confidence: 0.95 },
    { time: '0:02', phase: 'planning', agent: 'Planner', action: 'Analyzing goal', reasoning: 'Breaking down goal into achievable tasks', confidence: 0.88 },
    { time: '0:05', phase: 'planning', agent: 'Planner', action: 'Tasks created', reasoning: `Generated ${response.taskPlan?.tasks?.length || 0} tasks based on goal analysis`, confidence: 0.92 },
    { time: '0:08', phase: 'validation', agent: 'Validator', action: 'Plan validated', reasoning: 'Checking task dependencies and feasibility', confidence: 0.85 },
    { time: '0:12', phase: 'execution', agent: 'Executor', action: 'Starting execution', reasoning: 'Executing tasks in dependency order', confidence: 0.90 },
    { time: '0:25', phase: 'execution', agent: 'Executor', action: 'Tasks completed', reasoning: 'All tasks executed successfully', confidence: 0.87 },
    { time: '0:28', phase: 'reflection', agent: 'Reflector', action: 'Analyzing results', reasoning: 'Reviewing execution quality and identifying improvements', confidence: 0.82 },
    { time: '0:32', phase: 'optimization', agent: 'Optimizer', action: 'Generating optimizations', reasoning: 'Creating optimized plan based on reflection insights', confidence: 0.88 },
    { time: '0:35', phase: 'complete', agent: 'Orchestrator', action: 'Workflow complete', reasoning: 'All phases completed successfully', confidence: 0.95 },
  ] : [];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentEventIndex < timelineEvents.length - 1) {
      interval = setInterval(() => {
        setCurrentEventIndex(prev => Math.min(prev + 1, timelineEvents.length - 1));
      }, 1500 / playbackSpeed);
    } else if (currentEventIndex >= timelineEvents.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentEventIndex, playbackSpeed, timelineEvents.length]);

  if (!response) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Run an agent to see timeline playback</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Playback Controls */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>⏱️</span> Timeline Playback Controls
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentEventIndex(Math.max(0, currentEventIndex - 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
              disabled={currentEventIndex === 0}
            >
              ⏮️
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-lg bg-violet-600 hover:bg-violet-500 transition-all"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={() => setCurrentEventIndex(Math.min(timelineEvents.length - 1, currentEventIndex + 1))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
              disabled={currentEventIndex >= timelineEvents.length - 1}
            >
              ⏭️
            </button>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Speed:</span>
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded text-sm ${
                    playbackSpeed === speed 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-400">
                Event {currentEventIndex + 1} of {timelineEvents.length}
              </span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${((currentEventIndex + 1) / timelineEvents.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Event Detail */}
      {timelineEvents[currentEventIndex] && (
        <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/30 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20">
                <span className="text-2xl">
                  {timelineEvents[currentEventIndex].phase === 'planning' ? '📋' :
                   timelineEvents[currentEventIndex].phase === 'execution' ? '⚡' :
                   timelineEvents[currentEventIndex].phase === 'reflection' ? '🔍' :
                   timelineEvents[currentEventIndex].phase === 'optimization' ? '📈' :
                   timelineEvents[currentEventIndex].phase === 'validation' ? '✓' :
                   timelineEvents[currentEventIndex].phase === 'complete' ? '✅' : '🚀'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-400 capitalize">
                    {timelineEvents[currentEventIndex].phase}
                  </span>
                  <span className="text-sm text-slate-400">{timelineEvents[currentEventIndex].time}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {timelineEvents[currentEventIndex].action}
                </h3>
                <p className="text-slate-300 mb-4">
                  {timelineEvents[currentEventIndex].reasoning}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    Agent: <span className="text-white font-medium">{timelineEvents[currentEventIndex].agent}</span>
                  </span>
                  <span className="text-sm text-slate-400">
                    Confidence: <span className="text-emerald-400 font-medium">
                      {(timelineEvents[currentEventIndex].confidence * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>📜</span> Event Timeline
          </h2>
        </div>
        <div className="p-4 space-y-2">
          {timelineEvents.map((event, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentEventIndex(idx)}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                idx === currentEventIndex 
                  ? 'bg-violet-500/20 border border-violet-500/30' 
                  : idx < currentEventIndex
                    ? 'bg-slate-800/50 opacity-60'
                    : 'bg-slate-800/30 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  idx === currentEventIndex ? 'bg-violet-500' : 
                  idx < currentEventIndex ? 'bg-emerald-500' : 'bg-slate-600'
                }`} />
                <span className="text-xs text-slate-500">{event.time}</span>
                <span className="font-medium text-sm">{event.action}</span>
                <span className="ml-auto text-xs text-slate-500">{event.agent}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skills Tab Component - Modular Skill Management
// =============================================================================

function SkillsTab() {
  const [skills, setSkills] = useState([
    { id: 'planning-basic', name: 'Basic Planning', category: 'planning', enabled: true, description: 'Core task planning capabilities' },
    { id: 'planning-advanced', name: 'Advanced Planning', category: 'planning', enabled: true, description: 'Complex dependency resolution' },
    { id: 'execution-parallel', name: 'Parallel Execution', category: 'execution', enabled: true, description: 'Execute independent tasks concurrently' },
    { id: 'execution-retry', name: 'Auto Retry', category: 'execution', enabled: true, description: 'Automatic retry on task failures' },
    { id: 'analysis-deep', name: 'Deep Analysis', category: 'analysis', enabled: false, description: 'Comprehensive code analysis' },
    { id: 'optimization-aggressive', name: 'Aggressive Optimization', category: 'optimization', enabled: false, description: 'Maximum performance optimization' },
    { id: 'security-audit', name: 'Security Audit', category: 'security', enabled: true, description: 'Identify security vulnerabilities' },
    { id: 'communication-verbose', name: 'Verbose Output', category: 'communication', enabled: false, description: 'Detailed status messages' },
  ]);

  const [activeProfile, setActiveProfile] = useState('balanced');

  const profiles = [
    { id: 'minimal', name: 'Minimal', description: 'Only essential skills enabled' },
    { id: 'balanced', name: 'Balanced', description: 'Recommended for most use cases' },
    { id: 'performance', name: 'Performance', description: 'Maximum speed and efficiency' },
    { id: 'thorough', name: 'Thorough', description: 'Deep analysis and security focus' },
  ];

  const toggleSkill = (skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId ? { ...skill, enabled: !skill.enabled } : skill
    ));
  };

  const applyProfile = (profileId: string) => {
    setActiveProfile(profileId);
    // Apply profile-specific settings
    setSkills(prev => prev.map(skill => {
      if (profileId === 'minimal') {
        return { ...skill, enabled: skill.id.includes('basic') || skill.id === 'execution-retry' };
      } else if (profileId === 'performance') {
        return { ...skill, enabled: skill.category === 'execution' || skill.id === 'optimization-aggressive' || skill.id === 'planning-basic' };
      } else if (profileId === 'thorough') {
        return { ...skill, enabled: true };
      }
      // balanced
      return { ...skill, enabled: !skill.id.includes('aggressive') && !skill.id.includes('verbose') };
    }));
  };

  const categories = Array.from(new Set(skills.map(s => s.category)));

  return (
    <div className="space-y-6">
      {/* Skill Profiles */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>⚙️</span> Skill Profiles
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => applyProfile(profile.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                activeProfile === profile.id
                  ? 'bg-violet-500/20 border-2 border-violet-500'
                  : 'bg-slate-800/50 border-2 border-transparent hover:border-slate-700'
              }`}
            >
              <h3 className="font-semibold">{profile.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{profile.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Skills by Category */}
      {categories.map(category => (
        <div key={category} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2 capitalize">
              <span>
                {category === 'planning' ? '📋' :
                 category === 'execution' ? '⚡' :
                 category === 'analysis' ? '🔍' :
                 category === 'optimization' ? '📈' :
                 category === 'security' ? '🔒' :
                 category === 'communication' ? '💬' : '🎯'}
              </span>
              {category} Skills
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {skills.filter(s => s.category === category).map(skill => (
              <div 
                key={skill.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{skill.name}</h4>
                  <p className="text-xs text-slate-400">{skill.description}</p>
                </div>
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    skill.enabled ? 'bg-violet-600' : 'bg-slate-700'
                  }`}
                >
                  <div 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      skill.enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Active Skills Summary */}
      <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/30 p-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-violet-400">
            {skills.filter(s => s.enabled).length}
          </div>
          <div>
            <h3 className="font-semibold">Active Skills</h3>
            <p className="text-sm text-slate-400">
              {skills.filter(s => s.enabled).map(s => s.name).join(' • ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Testing Tab Component - Failure Injection & Scenarios
// =============================================================================

function TestingTab() {
  const [failureMode, setFailureMode] = useState(false);
  const [activeFailures, setActiveFailures] = useState<string[]>([]);
  const [recoveryLog, setRecoveryLog] = useState<Array<{
    time: string;
    failure: string;
    action: string;
    success: boolean;
  }>>([]);
  const [confidenceCheck, setConfidenceCheck] = useState<{
    goalClarity: number;
    historicalSuccess: number;
    complexity: number;
    overall: number;
    recommendation: string;
  } | null>(null);

  const failureTypes = [
    { id: 'task-timeout', name: 'Task Timeout', description: 'Simulate task execution timeout' },
    { id: 'network-failure', name: 'Network Failure', description: 'Simulate API connection issues' },
    { id: 'resource-exhaustion', name: 'Resource Exhaustion', description: 'Simulate memory/CPU limits' },
    { id: 'dependency-failure', name: 'Dependency Failure', description: 'Simulate missing dependencies' },
    { id: 'validation-error', name: 'Validation Error', description: 'Simulate invalid input/output' },
  ];

  const toggleFailure = (failureId: string) => {
    setActiveFailures(prev => 
      prev.includes(failureId) 
        ? prev.filter(f => f !== failureId)
        : [...prev, failureId]
    );
  };

  const triggerFailureTest = () => {
    if (activeFailures.length === 0) return;
    
    // Simulate failure injection and recovery
    const newLogs = activeFailures.map(failureId => {
      const failure = failureTypes.find(f => f.id === failureId)!;
      return {
        time: new Date().toLocaleTimeString(),
        failure: failure.name,
        action: `Attempting recovery from ${failure.name.toLowerCase()}`,
        success: Math.random() > 0.3
      };
    });
    
    setRecoveryLog(prev => [...newLogs, ...prev].slice(0, 10));
  };

  const runConfidenceCheck = () => {
    // Simulate confidence scoring
    const goalClarity = 70 + Math.floor(Math.random() * 30);
    const historicalSuccess = 60 + Math.floor(Math.random() * 35);
    const complexity = 50 + Math.floor(Math.random() * 40);
    const overall = Math.floor((goalClarity + historicalSuccess + (100 - complexity)) / 3);
    
    let recommendation = '';
    if (overall >= 80) recommendation = 'High confidence - proceed with autonomous execution';
    else if (overall >= 60) recommendation = 'Moderate confidence - consider human review for critical tasks';
    else recommendation = 'Low confidence - recommend goal clarification before proceeding';

    setConfidenceCheck({
      goalClarity,
      historicalSuccess,
      complexity,
      overall,
      recommendation
    });
  };

  return (
    <div className="space-y-6">
      {/* Failure Injection Panel */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <span>💥</span> Failure Injection Mode
          </h2>
          <button
            onClick={() => setFailureMode(!failureMode)}
            className={`relative w-12 h-6 rounded-full transition-all ${
              failureMode ? 'bg-red-600' : 'bg-slate-700'
            }`}
          >
            <div 
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                failureMode ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
        {failureMode && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg">
              ⚠️ Failure injection is active. Agent runs may be interrupted to test recovery mechanisms.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {failureTypes.map(failure => (
                <button
                  key={failure.id}
                  onClick={() => toggleFailure(failure.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    activeFailures.includes(failure.id)
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
                  }`}
                >
                  <h4 className="font-medium text-sm">{failure.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{failure.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={triggerFailureTest}
              disabled={activeFailures.length === 0}
              className="w-full py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              Trigger Failure Test
            </button>
          </div>
        )}
      </div>

      {/* Recovery Log */}
      {recoveryLog.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <span>📋</span> Recovery Log
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {recoveryLog.map((log, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${
                  log.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>
                    {log.success ? '✓' : '✗'}
                  </span>
                  <span className="text-xs text-slate-500">{log.time}</span>
                  <span className="font-medium text-sm">{log.failure}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-5">{log.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Check */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <span>🎯</span> Confidence Assessment
          </h2>
          <button
            onClick={runConfidenceCheck}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 transition-all"
          >
            Run Check
          </button>
        </div>
        {confidenceCheck && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">{confidenceCheck.goalClarity}%</div>
                <div className="text-xs text-slate-400 mt-1">Goal Clarity</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-bold text-emerald-400">{confidenceCheck.historicalSuccess}%</div>
                <div className="text-xs text-slate-400 mt-1">Historical Success</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-bold text-amber-400">{confidenceCheck.complexity}%</div>
                <div className="text-xs text-slate-400 mt-1">Complexity</div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${
              confidenceCheck.overall >= 80 ? 'bg-emerald-500/10 border border-emerald-500/30' :
              confidenceCheck.overall >= 60 ? 'bg-amber-500/10 border border-amber-500/30' :
              'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  <span className={
                    confidenceCheck.overall >= 80 ? 'text-emerald-400' :
                    confidenceCheck.overall >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }>
                    {confidenceCheck.overall}%
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">Overall Confidence</h4>
                  <p className="text-sm text-slate-400">{confidenceCheck.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Validation */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <span>🛡️</span> Safety Validation Status
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Ambiguity Detection', status: 'active', icon: '🔍' },
              { name: 'Security Patterns', status: 'active', icon: '🔒' },
              { name: 'Resource Limits', status: 'active', icon: '📊' },
              { name: 'External Access Guard', status: 'active', icon: '🌐' },
            ].map(check => (
              <div key={check.name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <span>{check.icon}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{check.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}