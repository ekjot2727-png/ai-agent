'use client';

import { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
  currentTaskId?: string;
}

const statusIcons: Record<string, string> = {
  pending: '⏳',
  'in-progress': '🔄',
  completed: '✅',
  failed: '❌',
  skipped: '⏭️',
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-amber-100 text-amber-700 animate-pulse',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
};

const priorityBadge: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export function TaskList({ tasks, currentTaskId }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Tasks
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🤖</p>
          <p>No tasks yet. Enter a goal to get started!</p>
        </div>
      </div>
    );
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = (completed / tasks.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Tasks
        </h2>
        <span className="text-sm text-gray-600">
          {completed}/{tasks.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`p-4 rounded-lg border transition-all ${
              task.id === currentTaskId
                ? 'border-primary-400 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-xl">{statusIcons[task.status]}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <div className={`w-2 h-2 rounded-full ${priorityBadge[task.priority]}`} title={`${task.priority} priority`} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-800 truncate">{task.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Est: {task.estimatedDuration}s</span>
                  {task.actualDuration && (
                    <span>Actual: {task.actualDuration}s</span>
                  )}
                </div>
                
                {task.result && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    task.result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {task.result.output || task.result.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
