'use client';

import { useState, FormEvent } from 'react';

interface GoalInputProps {
  onSubmit: (goal: string, context?: string) => void;
  isLoading: boolean;
}

export function GoalInput({ onSubmit, isLoading }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (goal.trim().length >= 10) {
      onSubmit(goal.trim(), context.trim() || undefined);
    }
  };

  const exampleGoals = [
    'Create a data pipeline for user analytics',
    'Set up a CI/CD workflow for deployment',
    'Analyze customer feedback and generate insights',
    'Build an automated testing framework',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        Define Your Goal
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to accomplish?
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal in detail..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            rows={3}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {goal.length}/10 characters minimum
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowContext(!showContext)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          {showContext ? '−' : '+'} Add additional context
        </button>

        {showContext && (
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (optional)
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any constraints, preferences, or specific requirements..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              rows={2}
              disabled={isLoading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={goal.trim().length < 10 || isLoading}
          className="w-full py-3 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⚙️</span>
              Agent Working...
            </>
          ) : (
            <>
              <span>🚀</span>
              Execute Agent
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleGoals.map((example, index) => (
            <button
              key={index}
              onClick={() => setGoal(example)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
