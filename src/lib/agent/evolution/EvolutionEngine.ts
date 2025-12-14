/**
 * EvolutionEngine - Self-improvement loop for the agent system
 * Analyzes execution patterns and evolves strategies over time
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentMemory, getAgentMemory, AgentRun } from '../memory/AgentMemory';

// ============================================================================
// Types
// ============================================================================

export interface ExecutionAnalysis {
  runId: string;
  executionTime: number;
  complexity: 'simple' | 'medium' | 'complex';
  taskCount: number;
  successRate: number;
  inefficiencies: Inefficiency[];
  bottlenecks: string[];
}

export interface Inefficiency {
  id: string;
  type: 'redundant-task' | 'slow-execution' | 'high-failure' | 'over-planning' | 'under-planning';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedTasks: string[];
  suggestedFix: string;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'accuracy' | 'efficiency' | 'reliability';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  autoApplicable: boolean;
  applied: boolean;
  appliedAt?: Date;
}

export interface EvolutionStrategy {
  id: string;
  version: number;
  createdAt: Date;
  rules: StrategyRule[];
  learnings: string[];
  metrics: StrategyMetrics;
}

export interface StrategyRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  effectiveness: number;
  timesApplied: number;
}

export interface StrategyMetrics {
  averageSuccessRate: number;
  averageExecutionTime: number;
  improvementRate: number;
  rulesApplied: number;
}

export interface EvolutionReport {
  evolutionId: string;
  timestamp: Date;
  runsAnalyzed: number;
  currentStrategy: EvolutionStrategy;
  analysis: ExecutionAnalysis | null;
  newSuggestions: OptimizationSuggestion[];
  appliedImprovements: string[];
  metrics: {
    beforeImprovement: StrategyMetrics;
    afterImprovement: StrategyMetrics;
    delta: number;
  };
}

// ============================================================================
// EvolutionEngine Class
// ============================================================================

export class EvolutionEngine {
  private memory: AgentMemory;
  private suggestions: OptimizationSuggestion[] = [];
  private currentStrategy: EvolutionStrategy;
  private evolutionHistory: EvolutionReport[] = [];

  constructor() {
    this.memory = getAgentMemory();
    this.currentStrategy = this.createInitialStrategy();
  }

  // --------------------------------------------------------------------------
  // Core Evolution Methods
  // --------------------------------------------------------------------------

  /**
   * Main evolution method - analyzes and improves the strategy
   */
  async evolveStrategy(): Promise<EvolutionReport> {
    const runs = this.memory.getLastRuns(20);
    const beforeMetrics = { ...this.currentStrategy.metrics };
    
    // Analyze recent executions
    const analyses = runs.map(run => this.analyzeExecution(run));
    const latestAnalysis = analyses[0] || null;
    
    // Identify new inefficiencies
    const allInefficiencies = analyses.flatMap(a => a.inefficiencies);
    const patterns = this.identifyPatterns(allInefficiencies);
    
    // Generate optimization suggestions
    const newSuggestions = this.generateSuggestions(patterns, analyses);
    this.suggestions.push(...newSuggestions);
    
    // Apply auto-applicable improvements
    const appliedImprovements = this.applyImprovements(newSuggestions.filter(s => s.autoApplicable));
    
    // Update strategy rules based on learnings
    this.updateStrategyRules(analyses);
    
    // Calculate new metrics
    const afterMetrics = this.calculateMetrics(analyses);
    this.currentStrategy.metrics = afterMetrics;
    this.currentStrategy.version++;

    const report: EvolutionReport = {
      evolutionId: uuidv4(),
      timestamp: new Date(),
      runsAnalyzed: runs.length,
      currentStrategy: this.currentStrategy,
      analysis: latestAnalysis,
      newSuggestions,
      appliedImprovements,
      metrics: {
        beforeImprovement: beforeMetrics,
        afterImprovement: afterMetrics,
        delta: afterMetrics.improvementRate - beforeMetrics.improvementRate,
      },
    };

    this.evolutionHistory.push(report);
    return report;
  }

  // --------------------------------------------------------------------------
  // Analysis Methods
  // --------------------------------------------------------------------------

  private analyzeExecution(run: AgentRun): ExecutionAnalysis {
    const inefficiencies: Inefficiency[] = [];
    const bottlenecks: string[] = [];
    
    // Analyze execution time
    const avgTaskTime = run.result.duration / run.result.totalTasks;
    if (avgTaskTime > 5) {
      inefficiencies.push({
        id: uuidv4(),
        type: 'slow-execution',
        description: `Average task time (${avgTaskTime.toFixed(1)}s) exceeds optimal threshold`,
        severity: avgTaskTime > 10 ? 'high' : 'medium',
        affectedTasks: [],
        suggestedFix: 'Consider parallelizing independent tasks or simplifying complex operations',
      });
      bottlenecks.push('Slow task execution');
    }
    
    // Analyze success rate
    if (run.result.failedTasks > 0) {
      const failureRate = run.result.failedTasks / run.result.totalTasks;
      inefficiencies.push({
        id: uuidv4(),
        type: 'high-failure',
        description: `${(failureRate * 100).toFixed(0)}% task failure rate detected`,
        severity: failureRate > 0.3 ? 'high' : failureRate > 0.15 ? 'medium' : 'low',
        affectedTasks: run.result.errors,
        suggestedFix: 'Add validation steps or implement retry logic for failing tasks',
      });
    }
    
    // Analyze planning efficiency
    const taskEfficiency = run.result.completedTasks / run.plan.tasks.length;
    if (run.plan.tasks.length > 10 && taskEfficiency < 0.8) {
      inefficiencies.push({
        id: uuidv4(),
        type: 'over-planning',
        description: 'Plan generated more tasks than necessary for the goal',
        severity: 'medium',
        affectedTasks: [],
        suggestedFix: 'Consolidate related tasks and remove redundant steps',
      });
      bottlenecks.push('Over-planning');
    }
    
    if (run.plan.tasks.length < 3 && run.reflection.score < 70) {
      inefficiencies.push({
        id: uuidv4(),
        type: 'under-planning',
        description: 'Plan may have missed important steps',
        severity: 'medium',
        affectedTasks: [],
        suggestedFix: 'Expand goal decomposition to include validation and error handling steps',
      });
    }

    // Determine complexity
    let complexity: ExecutionAnalysis['complexity'] = 'simple';
    if (run.plan.tasks.length > 5) complexity = 'medium';
    if (run.plan.tasks.length > 10 || run.result.duration > 30) complexity = 'complex';

    return {
      runId: run.id,
      executionTime: run.result.duration,
      complexity,
      taskCount: run.plan.tasks.length,
      successRate: run.reflection.successRate,
      inefficiencies,
      bottlenecks,
    };
  }

  private identifyPatterns(inefficiencies: Inefficiency[]): Map<string, number> {
    const patterns = new Map<string, number>();
    
    for (const ineff of inefficiencies) {
      const count = patterns.get(ineff.type) || 0;
      patterns.set(ineff.type, count + 1);
    }
    
    return patterns;
  }

  // --------------------------------------------------------------------------
  // Suggestion Generation
  // --------------------------------------------------------------------------

  private generateSuggestions(
    patterns: Map<string, number>,
    analyses: ExecutionAnalysis[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Pattern-based suggestions
    for (const [pattern, count] of Array.from(patterns.entries())) {
      if (count >= 2) {
        suggestions.push(this.createPatternSuggestion(pattern, count));
      }
    }
    
    // Performance-based suggestions
    const avgTime = analyses.reduce((sum, a) => sum + a.executionTime, 0) / analyses.length;
    if (avgTime > 15) {
      suggestions.push({
        id: uuidv4(),
        category: 'performance',
        title: 'Enable Task Parallelization',
        description: `Average execution time (${avgTime.toFixed(1)}s) is high. Enable parallel execution for independent tasks.`,
        impact: 'high',
        confidence: 0.85,
        autoApplicable: true,
        applied: false,
      });
    }
    
    // Accuracy-based suggestions
    const avgSuccess = analyses.reduce((sum, a) => sum + a.successRate, 0) / analyses.length;
    if (avgSuccess < 0.85) {
      suggestions.push({
        id: uuidv4(),
        category: 'accuracy',
        title: 'Add Pre-execution Validation',
        description: 'Success rate is below optimal. Add validation steps before task execution.',
        impact: 'medium',
        confidence: 0.78,
        autoApplicable: true,
        applied: false,
      });
    }
    
    // Efficiency-based suggestions
    const complexRuns = analyses.filter(a => a.complexity === 'complex');
    if (complexRuns.length > analyses.length * 0.5) {
      suggestions.push({
        id: uuidv4(),
        category: 'efficiency',
        title: 'Implement Goal Decomposition',
        description: 'Many runs are complex. Consider breaking large goals into sub-goals.',
        impact: 'high',
        confidence: 0.82,
        autoApplicable: false,
        applied: false,
      });
    }

    return suggestions;
  }

  private createPatternSuggestion(pattern: string, count: number): OptimizationSuggestion {
    const suggestions: Record<string, Partial<OptimizationSuggestion>> = {
      'slow-execution': {
        category: 'performance',
        title: 'Optimize Task Execution Speed',
        description: `Detected slow execution in ${count} runs. Consider caching and batch processing.`,
        impact: 'high',
        autoApplicable: true,
      },
      'high-failure': {
        category: 'reliability',
        title: 'Improve Task Reliability',
        description: `High failure rate detected in ${count} runs. Implement retry logic and better error handling.`,
        impact: 'high',
        autoApplicable: true,
      },
      'over-planning': {
        category: 'efficiency',
        title: 'Streamline Planning Process',
        description: `Over-planning detected in ${count} runs. Reduce unnecessary task generation.`,
        impact: 'medium',
        autoApplicable: true,
      },
      'under-planning': {
        category: 'accuracy',
        title: 'Enhance Planning Completeness',
        description: `Under-planning detected in ${count} runs. Ensure all goal aspects are covered.`,
        impact: 'medium',
        autoApplicable: false,
      },
      'redundant-task': {
        category: 'efficiency',
        title: 'Remove Redundant Tasks',
        description: `Redundant tasks detected in ${count} runs. Consolidate similar operations.`,
        impact: 'low',
        autoApplicable: true,
      },
    };

    const base = suggestions[pattern] || {
      category: 'efficiency',
      title: 'General Optimization',
      description: `Pattern "${pattern}" detected ${count} times.`,
      impact: 'low',
      autoApplicable: false,
    };

    return {
      id: uuidv4(),
      confidence: Math.min(0.95, 0.6 + count * 0.1),
      applied: false,
      ...base,
    } as OptimizationSuggestion;
  }

  // --------------------------------------------------------------------------
  // Improvement Application
  // --------------------------------------------------------------------------

  private applyImprovements(suggestions: OptimizationSuggestion[]): string[] {
    const applied: string[] = [];

    for (const suggestion of suggestions) {
      if (!suggestion.applied && suggestion.autoApplicable) {
        // Apply the improvement to the strategy
        const rule = this.createRuleFromSuggestion(suggestion);
        this.currentStrategy.rules.push(rule);
        
        suggestion.applied = true;
        suggestion.appliedAt = new Date();
        
        applied.push(suggestion.title);
        this.currentStrategy.learnings.push(
          `Applied: ${suggestion.title} - ${suggestion.description}`
        );
      }
    }

    return applied;
  }

  private createRuleFromSuggestion(suggestion: OptimizationSuggestion): StrategyRule {
    const ruleTemplates: Record<string, Partial<StrategyRule>> = {
      'performance': {
        condition: 'execution_time > threshold',
        action: 'enable_parallel_execution',
        priority: 1,
      },
      'accuracy': {
        condition: 'success_rate < 0.85',
        action: 'add_validation_step',
        priority: 2,
      },
      'efficiency': {
        condition: 'task_count > 8',
        action: 'consolidate_tasks',
        priority: 3,
      },
      'reliability': {
        condition: 'failure_rate > 0.15',
        action: 'enable_retry_logic',
        priority: 1,
      },
    };

    const template = ruleTemplates[suggestion.category] || {
      condition: 'always',
      action: 'log_warning',
      priority: 5,
    };

    return {
      id: uuidv4(),
      ...template,
      effectiveness: suggestion.confidence,
      timesApplied: 0,
    } as StrategyRule;
  }

  // --------------------------------------------------------------------------
  // Strategy Management
  // --------------------------------------------------------------------------

  private createInitialStrategy(): EvolutionStrategy {
    return {
      id: uuidv4(),
      version: 1,
      createdAt: new Date(),
      rules: [
        {
          id: uuidv4(),
          condition: 'new_goal',
          action: 'decompose_into_tasks',
          priority: 1,
          effectiveness: 0.9,
          timesApplied: 0,
        },
        {
          id: uuidv4(),
          condition: 'task_ready',
          action: 'execute_sequentially',
          priority: 2,
          effectiveness: 0.85,
          timesApplied: 0,
        },
        {
          id: uuidv4(),
          condition: 'execution_complete',
          action: 'reflect_and_learn',
          priority: 3,
          effectiveness: 0.88,
          timesApplied: 0,
        },
      ],
      learnings: [],
      metrics: {
        averageSuccessRate: 0,
        averageExecutionTime: 0,
        improvementRate: 0,
        rulesApplied: 0,
      },
    };
  }

  private updateStrategyRules(analyses: ExecutionAnalysis[]): void {
    // Update rule effectiveness based on recent results
    const avgSuccess = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.successRate, 0) / analyses.length
      : 0;

    for (const rule of this.currentStrategy.rules) {
      // Adjust effectiveness based on outcomes
      if (avgSuccess > 0.8) {
        rule.effectiveness = Math.min(1, rule.effectiveness + 0.02);
      } else if (avgSuccess < 0.6) {
        rule.effectiveness = Math.max(0.5, rule.effectiveness - 0.05);
      }
      rule.timesApplied++;
    }

    // Sort rules by priority and effectiveness
    this.currentStrategy.rules.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.effectiveness - a.effectiveness;
    });
  }

  private calculateMetrics(analyses: ExecutionAnalysis[]): StrategyMetrics {
    if (analyses.length === 0) {
      return this.currentStrategy.metrics;
    }

    const avgSuccess = analyses.reduce((sum, a) => sum + a.successRate, 0) / analyses.length;
    const avgTime = analyses.reduce((sum, a) => sum + a.executionTime, 0) / analyses.length;
    
    const previousRate = this.currentStrategy.metrics.averageSuccessRate;
    const improvement = previousRate > 0 ? (avgSuccess - previousRate) / previousRate : 0;

    return {
      averageSuccessRate: avgSuccess,
      averageExecutionTime: avgTime,
      improvementRate: improvement,
      rulesApplied: this.currentStrategy.rules.reduce((sum, r) => sum + r.timesApplied, 0),
    };
  }

  // --------------------------------------------------------------------------
  // Public Getters
  // --------------------------------------------------------------------------

  getCurrentStrategy(): EvolutionStrategy {
    return this.currentStrategy;
  }

  getSuggestions(): OptimizationSuggestion[] {
    return this.suggestions;
  }

  getPendingSuggestions(): OptimizationSuggestion[] {
    return this.suggestions.filter(s => !s.applied);
  }

  getEvolutionHistory(): EvolutionReport[] {
    return this.evolutionHistory;
  }

  getLatestReport(): EvolutionReport | null {
    return this.evolutionHistory[this.evolutionHistory.length - 1] || null;
  }

  // --------------------------------------------------------------------------
  // Manual Improvement Application
  // --------------------------------------------------------------------------

  applySuggestion(suggestionId: string): boolean {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (!suggestion || suggestion.applied) return false;

    const rule = this.createRuleFromSuggestion(suggestion);
    this.currentStrategy.rules.push(rule);
    
    suggestion.applied = true;
    suggestion.appliedAt = new Date();
    
    this.currentStrategy.learnings.push(
      `Manually applied: ${suggestion.title}`
    );

    return true;
  }

  dismissSuggestion(suggestionId: string): boolean {
    const idx = this.suggestions.findIndex(s => s.id === suggestionId);
    if (idx === -1) return false;
    
    this.suggestions.splice(idx, 1);
    return true;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let evolutionEngineInstance: EvolutionEngine | null = null;

export function getEvolutionEngine(): EvolutionEngine {
  if (!evolutionEngineInstance) {
    evolutionEngineInstance = new EvolutionEngine();
  }
  return evolutionEngineInstance;
}

export function resetEvolutionEngine(): void {
  evolutionEngineInstance = null;
}
