/**
 * OptimizerAgent - Suggests improvements based on historical data and patterns
 * Responsible for continuous improvement, pattern detection, and optimization recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentContext, ReasoningStep } from './BaseAgent';
import { TaskPlan, PlannedTask } from './PlannerAgent';
import { ExecutionResult } from './ExecutorAgent';
import { ReflectionResult, Insight } from './ReflectionAgent';
import { AgentMemory, AgentRun, MemoryStats } from '../memory/AgentMemory';

// ============================================================================
// Types
// ============================================================================

export interface Optimization {
  id: string;
  type: 'workflow' | 'task' | 'timing' | 'resource' | 'process';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number; // 1-10
  basedOn: string; // What data/pattern this is based on
  confidence: number;
}

export interface Pattern {
  id: string;
  type: 'success' | 'failure' | 'efficiency' | 'timing';
  description: string;
  frequency: number;
  significance: number;
  examples: string[];
}

export interface OptimizationResult {
  optimizationId: string;
  runId?: string;
  timestamp: Date;
  optimizations: Optimization[];
  patterns: Pattern[];
  workflowRecommendations: Array<{
    workflow: string;
    score: number;
    reason: string;
  }>;
  taskOptimizations: Array<{
    taskType: string;
    suggestions: string[];
  }>;
  processSuggestions: string[];
  estimatedImprovements: {
    successRate: number; // percentage improvement
    efficiency: number;
    duration: number;
  };
  reasoning: {
    steps: ReasoningStep[];
    summary: string;
    totalConfidence: number;
  };
}

// ============================================================================
// OptimizerAgent Class
// ============================================================================

export class OptimizerAgent extends BaseAgent {
  private memory: AgentMemory;

  constructor(memory: AgentMemory) {
    super('optimizer', 'OptimizerAgent');
    this.memory = memory;
  }

  // --------------------------------------------------------------------------
  // Main Processing
  // --------------------------------------------------------------------------

  async process(context: AgentContext): Promise<OptimizationResult> {
    this.reset();
    this.isActive = true;

    const plan = context.sharedState.get('plan') as TaskPlan | undefined;
    const result = context.sharedState.get('result') as ExecutionResult | undefined;
    const reflection = context.sharedState.get('reflection') as ReflectionResult | undefined;

    this.info('Starting optimization analysis');

    try {
      // Phase 1: Gather historical data
      const historicalData = await this.gatherHistoricalData(context.goal);

      // Phase 2: Analyze patterns
      const patterns = await this.analyzePatterns(historicalData, plan, result);

      // Phase 3: Generate optimizations
      const optimizations = await this.generateOptimizations(
        patterns,
        plan,
        result,
        reflection,
        historicalData
      );

      // Phase 4: Create workflow recommendations
      const workflowRecs = this.generateWorkflowRecommendations(historicalData, result);

      // Phase 5: Create task optimizations
      const taskOpts = this.generateTaskOptimizations(plan, result, historicalData);

      // Phase 6: Generate process suggestions
      const processSuggestions = this.generateProcessSuggestions(patterns, reflection);

      // Phase 7: Estimate improvements
      const estimatedImprovements = this.estimateImprovements(optimizations, patterns);

      // Phase 8: Create result
      const optimizationResult = this.createResult(
        optimizations,
        patterns,
        workflowRecs,
        taskOpts,
        processSuggestions,
        estimatedImprovements
      );

      this.info('Optimization analysis complete', {
        optimizationCount: optimizations.length,
        patternCount: patterns.length,
      });

      return optimizationResult;
    } finally {
      this.isActive = false;
    }
  }

  validateInput(context: AgentContext): { valid: boolean; errors: string[] } {
    // Optimizer can work with minimal context
    return { valid: true, errors: [] };
  }

  // --------------------------------------------------------------------------
  // Analysis Phases
  // --------------------------------------------------------------------------

  private async gatherHistoricalData(currentGoal: string): Promise<{
    stats: MemoryStats;
    similarRuns: AgentRun[];
    recentRuns: AgentRun[];
    recommendations: any;
  }> {
    await this.simulateThinking(50, 100);

    const stats = this.memory.getStats();
    const similarRuns = this.memory.findSimilarRuns(currentGoal, 10);
    const recentRuns = this.memory.getLastRuns(20);
    const recommendations = this.memory.getRecommendations(currentGoal);

    this.observe(`Found ${stats.totalRuns} total runs in memory`, 0.95);
    this.observe(`Identified ${similarRuns.length} similar past runs`, 0.9);

    return { stats, similarRuns, recentRuns, recommendations };
  }

  private async analyzePatterns(
    historicalData: { stats: MemoryStats; similarRuns: AgentRun[]; recentRuns: AgentRun[] },
    plan?: TaskPlan,
    result?: ExecutionResult
  ): Promise<Pattern[]> {
    await this.simulateThinking(100, 200);

    const patterns: Pattern[] = [];

    // Analyze success patterns
    const successfulRuns = historicalData.recentRuns.filter(r => r.result.success);
    if (successfulRuns.length > 0) {
      const successRate = successfulRuns.length / historicalData.recentRuns.length;
      if (successRate >= 0.8) {
        patterns.push({
          id: uuidv4(),
          type: 'success',
          description: 'High success rate maintained across recent runs',
          frequency: successfulRuns.length,
          significance: successRate,
          examples: successfulRuns.slice(0, 3).map(r => r.goal.slice(0, 50)),
        });
        this.think('Detected consistent success pattern', 0.85);
      }
    }

    // Analyze failure patterns
    const failedRuns = historicalData.recentRuns.filter(r => !r.result.success);
    if (failedRuns.length >= 3) {
      // Look for common failure reasons
      const allErrors = failedRuns.flatMap(r => r.result.errors);
      const errorCounts = this.countOccurrences(allErrors);
      
      for (const [error, count] of Object.entries(errorCounts)) {
        if (count >= 2) {
          patterns.push({
            id: uuidv4(),
            type: 'failure',
            description: `Recurring failure: ${error.slice(0, 100)}`,
            frequency: count,
            significance: count / failedRuns.length,
            examples: failedRuns.filter(r => r.result.errors.includes(error)).map(r => r.goal.slice(0, 50)),
          });
          this.analyze(`Identified recurring failure pattern: ${error.slice(0, 50)}`, 0.8);
        }
      }
    }

    // Analyze efficiency patterns
    const runDurations = historicalData.recentRuns.map(r => r.metadata.executionTime);
    const avgDuration = runDurations.reduce((a, b) => a + b, 0) / runDurations.length || 0;
    const recentAvg = runDurations.slice(0, 5).reduce((a, b) => a + b, 0) / 5 || avgDuration;

    if (recentAvg < avgDuration * 0.8) {
      patterns.push({
        id: uuidv4(),
        type: 'efficiency',
        description: 'Execution times improving in recent runs',
        frequency: 5,
        significance: (avgDuration - recentAvg) / avgDuration,
        examples: [],
      });
      this.think('Detected efficiency improvement trend', 0.75);
    } else if (recentAvg > avgDuration * 1.2) {
      patterns.push({
        id: uuidv4(),
        type: 'efficiency',
        description: 'Execution times increasing in recent runs',
        frequency: 5,
        significance: (recentAvg - avgDuration) / avgDuration,
        examples: [],
      });
      this.think('Detected efficiency degradation', 0.75);
    }

    // Analyze current run if available
    if (result) {
      if (result.failedTasks > 0) {
        patterns.push({
          id: uuidv4(),
          type: 'failure',
          description: `Current run had ${result.failedTasks} failed tasks`,
          frequency: 1,
          significance: result.failedTasks / result.taskExecutions.length,
          examples: result.errors.slice(0, 3),
        });
      }
    }

    return patterns;
  }

  private async generateOptimizations(
    patterns: Pattern[],
    plan?: TaskPlan,
    result?: ExecutionResult,
    reflection?: ReflectionResult,
    historicalData?: any
  ): Promise<Optimization[]> {
    await this.simulateThinking(150, 250);

    const optimizations: Optimization[] = [];

    // Optimizations based on patterns
    for (const pattern of patterns) {
      if (pattern.type === 'failure' && pattern.significance > 0.3) {
        optimizations.push({
          id: uuidv4(),
          type: 'process',
          title: 'Address Recurring Failures',
          description: `Implement safeguards for: ${pattern.description}`,
          impact: 'high',
          effort: 'medium',
          priority: 8,
          basedOn: `Pattern detected in ${pattern.frequency} occurrences`,
          confidence: pattern.significance,
        });
        this.decide('Recommending failure mitigation optimization', 0.85);
      }

      if (pattern.type === 'efficiency' && pattern.description.includes('increasing')) {
        optimizations.push({
          id: uuidv4(),
          type: 'timing',
          title: 'Performance Optimization Needed',
          description: 'Recent runs are taking longer. Review task complexity and resource allocation.',
          impact: 'medium',
          effort: 'low',
          priority: 6,
          basedOn: 'Efficiency trend analysis',
          confidence: pattern.significance,
        });
      }
    }

    // Optimizations based on current reflection
    if (reflection) {
      for (const improvement of reflection.improvements) {
        optimizations.push({
          id: uuidv4(),
          type: this.categorizeImprovement(improvement),
          title: 'Reflection-Based Improvement',
          description: improvement,
          impact: 'medium',
          effort: 'low',
          priority: 5,
          basedOn: 'Current run reflection analysis',
          confidence: 0.8,
        });
      }
    }

    // Workflow optimization if confidence was low
    if (result && result.workflowSelection.confidence < 0.7) {
      optimizations.push({
        id: uuidv4(),
        type: 'workflow',
        title: 'Expand Workflow Options',
        description: 'Current workflow selection had low confidence. Consider adding specialized workflows.',
        impact: 'high',
        effort: 'high',
        priority: 7,
        basedOn: `Workflow confidence: ${(result.workflowSelection.confidence * 100).toFixed(0)}%`,
        confidence: 0.75,
      });
    }

    // Task parallelization optimization
    if (plan && plan.tasks.length > 6) {
      const independentTasks = plan.tasks.filter(t => t.dependencies.length === 0);
      if (independentTasks.length > 2) {
        optimizations.push({
          id: uuidv4(),
          type: 'task',
          title: 'Enable Task Parallelization',
          description: `${independentTasks.length} tasks have no dependencies and could run in parallel.`,
          impact: 'high',
          effort: 'medium',
          priority: 7,
          basedOn: 'Task dependency analysis',
          confidence: 0.85,
        });
      }
    }

    // Historical learning optimization
    if (historicalData?.stats.totalRuns >= 10) {
      const topInsights = historicalData.stats.topInsights;
      if (topInsights.length > 0) {
        optimizations.push({
          id: uuidv4(),
          type: 'process',
          title: 'Apply Historical Insights',
          description: `Frequently observed: ${topInsights[0]}`,
          impact: 'medium',
          effort: 'low',
          priority: 6,
          basedOn: `Insight observed across ${historicalData.stats.totalRuns} runs`,
          confidence: 0.8,
        });
      }
    }

    // Sort by priority
    optimizations.sort((a, b) => b.priority - a.priority);

    this.act(`Generated ${optimizations.length} optimization recommendations`, 0.85);

    return optimizations.slice(0, 8); // Limit to top 8
  }

  private generateWorkflowRecommendations(
    historicalData: any,
    result?: ExecutionResult
  ): Array<{ workflow: string; score: number; reason: string }> {
    const recommendations: Array<{ workflow: string; score: number; reason: string }> = [];

    // Recommend based on historical success
    if (historicalData.similarRuns.length > 0) {
      const workflowScores = new Map<string, { total: number; count: number }>();
      
      for (const run of historicalData.similarRuns) {
        const workflow = run.plan.workflowName;
        const score = run.reflection.score;
        const existing = workflowScores.get(workflow) || { total: 0, count: 0 };
        existing.total += score;
        existing.count += 1;
        workflowScores.set(workflow, existing);
      }

      for (const [workflow, scores] of Array.from(workflowScores.entries())) {
        recommendations.push({
          workflow,
          score: Math.round(scores.total / scores.count),
          reason: `Average score of ${Math.round(scores.total / scores.count)}/100 across ${scores.count} similar runs`,
        });
      }
    }

    // Add current workflow if successful
    if (result && result.success) {
      const currentWorkflow = result.workflowSelection.workflow.name;
      if (!recommendations.some(r => r.workflow === currentWorkflow)) {
        recommendations.push({
          workflow: currentWorkflow,
          score: 80,
          reason: 'Successfully used in current run',
        });
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, 5);
  }

  private generateTaskOptimizations(
    plan?: TaskPlan,
    result?: ExecutionResult,
    historicalData?: any
  ): Array<{ taskType: string; suggestions: string[] }> {
    const taskOpts: Array<{ taskType: string; suggestions: string[] }> = [];

    if (!plan) return taskOpts;

    // Group tasks by type
    const tasksByType = new Map<string, PlannedTask[]>();
    for (const task of plan.tasks) {
      const existing = tasksByType.get(task.type) || [];
      existing.push(task);
      tasksByType.set(task.type, existing);
    }

    // Generate suggestions for each type
    for (const [type, tasks] of Array.from(tasksByType.entries())) {
      const suggestions: string[] = [];

      if (tasks.length > 3) {
        suggestions.push('Consider combining similar tasks to reduce overhead');
      }

      const failedTasksOfType = result?.taskExecutions.filter(e => 
        tasks.some(t => t.id === e.taskId) && e.status === 'failed'
      ) || [];

      if (failedTasksOfType.length > 0) {
        suggestions.push('Add retry logic for improved reliability');
        suggestions.push('Implement partial completion handling');
      }

      const criticalTasks = tasks.filter(t => t.priority === 'critical');
      if (criticalTasks.length > 1) {
        suggestions.push('Review critical task designation - consider if all are truly critical');
      }

      if (suggestions.length > 0) {
        taskOpts.push({ taskType: type, suggestions });
      }
    }

    return taskOpts;
  }

  private generateProcessSuggestions(
    patterns: Pattern[],
    reflection?: ReflectionResult
  ): string[] {
    const suggestions: string[] = [];

    // Based on patterns
    const failurePatterns = patterns.filter(p => p.type === 'failure');
    if (failurePatterns.length > 2) {
      suggestions.push('Implement automated health checks before task execution');
    }

    const efficiencyPatterns = patterns.filter(p => p.type === 'efficiency');
    if (efficiencyPatterns.some(p => p.description.includes('increasing'))) {
      suggestions.push('Review resource allocation and consider scaling');
    }

    // Based on reflection
    if (reflection) {
      if (reflection.score < 70) {
        suggestions.push('Consider breaking down complex goals into smaller, focused objectives');
      }
      if (reflection.metrics.successRate < 0.8) {
        suggestions.push('Add pre-execution validation to catch issues early');
      }
    }

    // General best practices
    suggestions.push('Regularly review and update workflow definitions');
    suggestions.push('Document and share learnings across similar goals');

    return Array.from(new Set(suggestions)).slice(0, 5);
  }

  private estimateImprovements(
    optimizations: Optimization[],
    patterns: Pattern[]
  ): { successRate: number; efficiency: number; duration: number } {
    let successRateImprovement = 0;
    let efficiencyImprovement = 0;
    let durationImprovement = 0;

    for (const opt of optimizations) {
      const impactMultiplier = opt.impact === 'high' ? 1.5 : opt.impact === 'medium' ? 1 : 0.5;
      
      switch (opt.type) {
        case 'process':
          successRateImprovement += 3 * impactMultiplier * opt.confidence;
          break;
        case 'workflow':
          successRateImprovement += 2 * impactMultiplier * opt.confidence;
          efficiencyImprovement += 5 * impactMultiplier * opt.confidence;
          break;
        case 'task':
          efficiencyImprovement += 3 * impactMultiplier * opt.confidence;
          durationImprovement += 8 * impactMultiplier * opt.confidence;
          break;
        case 'timing':
          durationImprovement += 10 * impactMultiplier * opt.confidence;
          efficiencyImprovement += 5 * impactMultiplier * opt.confidence;
          break;
      }
    }

    return {
      successRate: Math.min(Math.round(successRateImprovement), 25),
      efficiency: Math.min(Math.round(efficiencyImprovement), 30),
      duration: Math.min(Math.round(durationImprovement), 35),
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private countOccurrences(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return counts;
  }

  private categorizeImprovement(improvement: string): Optimization['type'] {
    const lower = improvement.toLowerCase();
    if (lower.includes('workflow')) return 'workflow';
    if (lower.includes('task') || lower.includes('parallel')) return 'task';
    if (lower.includes('time') || lower.includes('duration') || lower.includes('timeout')) return 'timing';
    if (lower.includes('resource') || lower.includes('memory') || lower.includes('cpu')) return 'resource';
    return 'process';
  }

  private createResult(
    optimizations: Optimization[],
    patterns: Pattern[],
    workflowRecs: Array<{ workflow: string; score: number; reason: string }>,
    taskOpts: Array<{ taskType: string; suggestions: string[] }>,
    processSuggestions: string[],
    estimatedImprovements: { successRate: number; efficiency: number; duration: number }
  ): OptimizationResult {
    return {
      optimizationId: uuidv4(),
      timestamp: new Date(),
      optimizations,
      patterns,
      workflowRecommendations: workflowRecs,
      taskOptimizations: taskOpts,
      processSuggestions,
      estimatedImprovements,
      reasoning: {
        steps: this.getReasoning(),
        summary: `Generated ${optimizations.length} optimizations based on ${patterns.length} detected patterns`,
        totalConfidence: this.calculateConfidence(),
      },
    };
  }
}
