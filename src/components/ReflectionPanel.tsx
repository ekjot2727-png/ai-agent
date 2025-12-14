'use client';

import { Reflection } from '@/lib/types';

interface ReflectionPanelProps {
  reflection: Reflection | undefined;
}

export function ReflectionPanel({ reflection }: ReflectionPanelProps) {
  if (!reflection) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Reflection & Insights
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">💭</p>
          <p>Reflection will appear after execution completes</p>
        </div>
      </div>
    );
  }

  const scoreColor = reflection.overallScore >= 80
    ? 'text-green-600'
    : reflection.overallScore >= 60
    ? 'text-amber-600'
    : 'text-red-600';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        Reflection & Insights
      </h2>

      {/* Score */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Overall Score</p>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {reflection.overallScore}/100
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-gray-800">
            {(reflection.successRate * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{reflection.summary}</p>
      </div>

      {/* Insights */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <span>💡</span> Insights
        </h3>
        <ul className="space-y-2">
          {reflection.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-primary-500 mt-0.5">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <span>🚀</span> Recommended Improvements
        </h3>
        <ul className="space-y-2">
          {reflection.improvements.map((improvement, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">→</span>
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      {/* Lessons Learned */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <span>📚</span> Lessons Learned
        </h3>
        <ul className="space-y-2">
          {reflection.lessonsLearned.map((lesson, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-blue-500 mt-0.5">✦</span>
              {lesson}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
