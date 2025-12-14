/**
 * Evolution API Route
 * 
 * GET /api/agent/evolution - Get current evolution state
 * POST /api/agent/evolution - Trigger evolution cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getEvolutionEngine,
  getAgentMemory,
} from '@/lib/agent';

// =============================================================================
// GET Handler - Get Evolution State
// =============================================================================

export async function GET(): Promise<NextResponse> {
  const engine = getEvolutionEngine();
  const memory = getAgentMemory();

  const currentStrategy = engine.getCurrentStrategy();
  const suggestions = engine.getSuggestions();
  const pendingSuggestions = engine.getPendingSuggestions();
  const history = engine.getEvolutionHistory();
  const latestReport = engine.getLatestReport();
  const memoryStats = memory.getStats();

  return NextResponse.json({
    success: true,
    evolution: {
      currentStrategy: {
        id: currentStrategy.id,
        version: currentStrategy.version,
        createdAt: currentStrategy.createdAt.toISOString(),
        rulesCount: currentStrategy.rules.length,
        rules: currentStrategy.rules.map(r => ({
          id: r.id,
          condition: r.condition,
          action: r.action,
          priority: r.priority,
          effectiveness: r.effectiveness,
          timesApplied: r.timesApplied,
        })),
        learnings: currentStrategy.learnings,
        metrics: currentStrategy.metrics,
      },
      suggestions: {
        total: suggestions.length,
        pending: pendingSuggestions.length,
        applied: suggestions.length - pendingSuggestions.length,
        items: suggestions.map(s => ({
          id: s.id,
          category: s.category,
          title: s.title,
          description: s.description,
          impact: s.impact,
          confidence: s.confidence,
          autoApplicable: s.autoApplicable,
          applied: s.applied,
          appliedAt: s.appliedAt?.toISOString(),
        })),
      },
      history: {
        totalEvolutions: history.length,
        reports: history.slice(-5).map(r => ({
          id: r.evolutionId,
          timestamp: r.timestamp.toISOString(),
          runsAnalyzed: r.runsAnalyzed,
          newSuggestions: r.newSuggestions.length,
          appliedImprovements: r.appliedImprovements,
          delta: r.metrics.delta,
        })),
      },
      latestReport: latestReport ? {
        evolutionId: latestReport.evolutionId,
        timestamp: latestReport.timestamp.toISOString(),
        runsAnalyzed: latestReport.runsAnalyzed,
        analysis: latestReport.analysis,
        appliedImprovements: latestReport.appliedImprovements,
        metrics: latestReport.metrics,
      } : null,
    },
    memory: {
      totalRuns: memoryStats.totalRuns,
      averageScore: memoryStats.averageScore,
      successRate: memoryStats.totalRuns > 0 
        ? memoryStats.successfulRuns / memoryStats.totalRuns 
        : 0,
    },
  });
}

// =============================================================================
// POST Handler - Trigger Evolution
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const { applySuggestionId, dismissSuggestionId } = body;

    const engine = getEvolutionEngine();

    // Apply specific suggestion
    if (applySuggestionId) {
      const applied = engine.applySuggestion(applySuggestionId);
      return NextResponse.json({
        success: applied,
        action: 'apply_suggestion',
        suggestionId: applySuggestionId,
        message: applied 
          ? 'Suggestion applied successfully' 
          : 'Suggestion not found or already applied',
      });
    }

    // Dismiss specific suggestion
    if (dismissSuggestionId) {
      const dismissed = engine.dismissSuggestion(dismissSuggestionId);
      return NextResponse.json({
        success: dismissed,
        action: 'dismiss_suggestion',
        suggestionId: dismissSuggestionId,
        message: dismissed 
          ? 'Suggestion dismissed' 
          : 'Suggestion not found',
      });
    }

    // Run evolution cycle
    const report = await engine.evolveStrategy();

    return NextResponse.json({
      success: true,
      action: 'evolve',
      report: {
        evolutionId: report.evolutionId,
        timestamp: report.timestamp.toISOString(),
        runsAnalyzed: report.runsAnalyzed,
        newSuggestions: report.newSuggestions.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category,
          impact: s.impact,
          autoApplicable: s.autoApplicable,
        })),
        appliedImprovements: report.appliedImprovements,
        metrics: report.metrics,
        strategy: {
          version: report.currentStrategy.version,
          rulesCount: report.currentStrategy.rules.length,
        },
      },
    });

  } catch (error) {
    console.error('Evolution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Evolution failed',
      },
      { status: 500 }
    );
  }
}
