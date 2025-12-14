'use client';

import { AgentState } from '@/lib/types';

interface AgentStatusProps {
  state: AgentState | null;
}

const phaseInfo: Record<string, { icon: string; label: string; color: string }> = {
  idle: { icon: '💤', label: 'Idle', color: 'text-gray-500' },
  planning: { icon: '🧠', label: 'Planning', color: 'text-purple-600' },
  executing: { icon: '⚡', label: 'Executing', color: 'text-amber-600' },
  reflecting: { icon: '🔍', label: 'Reflecting', color: 'text-blue-600' },
  complete: { icon: '✅', label: 'Complete', color: 'text-green-600' },
  error: { icon: '❌', label: 'Error', color: 'text-red-600' },
};

export function AgentStatus({ state }: AgentStatusProps) {
  const phase = state?.phase || 'idle';
  const info = phaseInfo[phase];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        Agent Status
      </h2>

      <div className="flex items-center gap-4 mb-6">
        <div className={`text-4xl ${phase === 'executing' ? 'animate-bounce' : ''}`}>
          {info.icon}
        </div>
        <div>
          <div className={`text-lg font-semibold ${info.color}`}>
            {info.label}
          </div>
          {state && (
            <div className="text-sm text-gray-500">
              Session: {state.id.slice(0, 8)}
            </div>
          )}
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center justify-between mb-6">
        {['planning', 'executing', 'reflecting', 'complete'].map((p, index) => {
          const pInfo = phaseInfo[p];
          const isActive = phase === p;
          const isPast = getPhaseIndex(phase) > index;
          
          return (
            <div key={p} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  isActive
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : isPast
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}
              >
                {isPast ? '✓' : pInfo.icon}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-medium text-primary-600' : 'text-gray-500'}`}>
                {pInfo.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      {state && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {state.tasks.length}
            </div>
            <div className="text-xs text-gray-500">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {state.tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {state.totalDuration || '—'}
            </div>
            <div className="text-xs text-gray-500">Seconds</div>
          </div>
        </div>
      )}

      {!state && (
        <div className="text-center py-4 text-gray-500">
          <p>Waiting for a goal to execute...</p>
        </div>
      )}
    </div>
  );
}

function getPhaseIndex(phase: string): number {
  const phases = ['planning', 'executing', 'reflecting', 'complete'];
  return phases.indexOf(phase);
}
