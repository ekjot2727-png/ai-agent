'use client';

import { AgentLog } from '@/lib/types';
import { format } from 'date-fns';

interface LogViewerProps {
  logs: AgentLog[];
}

const levelStyles: Record<string, { bg: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⚠️' },
  error: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
  debug: { bg: 'bg-gray-50', text: 'text-gray-600', icon: '🔧' },
};

export function LogViewer({ logs }: LogViewerProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📜</span>
          Agent Logs
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p className="font-mono text-sm">No logs yet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📜</span>
          Agent Logs
        </h2>
        <span className="text-xs text-gray-500 font-mono">
          {logs.length} entries
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-sm">
        {logs.map((log) => {
          const style = levelStyles[log.level];
          const timestamp = format(new Date(log.timestamp), 'HH:mm:ss.SSS');
          
          return (
            <div
              key={log.id}
              className={`p-2 rounded ${style.bg} ${style.text} flex items-start gap-2`}
            >
              <span className="flex-shrink-0">{style.icon}</span>
              <span className="text-gray-500 flex-shrink-0">[{timestamp}]</span>
              <span className="text-gray-400 flex-shrink-0">[{log.phase}]</span>
              <span className="flex-1">{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
