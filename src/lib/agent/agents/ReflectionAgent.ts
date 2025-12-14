/**
 * ReflectionAgent - Analyzes execution results and generates insights
 * Responsible for performance analysis, pattern recognition, and lessons learned
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentContext, ReasoningStep } from './BaseAgent';
import { TaskPlan } from './PlannerAgent';
import { ExecutionResult } from './ExecutorAgent';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetrics {
  successRate: number;
  averageTaskDuration: number;
  totalDuration: number;
  efficiency: number; // actual vs estimated
  reliability: number;
}

export interface Insight {
  id: string;
  type: 'success' | 'failure' | 'pattern' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  relatedTasks: string[];
}

export interface ReflectionResult {
  reflectionId: string;
  planId: string;
  executionId: string;
  goalAchieved: boolean;
  goalAchievementReason: string;
  metrics: PerformanceMetrics;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  insights: Insight[];
  improvements: string[];
  lessonsLearned: string[];
  recommendations: string[];
  reasoning: {
    steps: ReasoningStep[];
    summary: string;
    totalConfidence: number;
  };
  createdAt: Date;
}

// ============================================================================
// ReflectionAgent Class
// ============================================================================

export class ReflectionAgent extends BaseAgent {
  constructor() {
    super('reflection', 'ReflectionAgent');
  }

  // --------------------------------------------------------------------------
  // Main Processing
  // --------------------------------------------------------------------------

  async process(context: AgentContext): Promise<ReflectionResult> {
    this.reset();
    this.isActive = true;

    // Get plan and result from shared state
    const plan = context.sharedState.get('plan') as TaskPlan;
    const result = context.sharedState.get('result') as ExecutionResult;

    if (!plan || !result) {
      throw new Error('Plan and execution result required for reflection');
    }

    this.info('Starting reflection analysis', { 
      planId: plan.planId, 
      executionId: result.executionId 
    });

    try {
      // Phase 1: Analyze execution
      await this.analyzeExecution(plan, result);

      // Phase 2: Calculate metrics
      const metrics = this.calculateMetrics(plan, result);

      // Phase 3: Determine goal achievement
      const { achieved, reason } = this.evaluateGoalAchievement(plan, result, metrics);

      // Phase 4: Generate insights
      const insights = await this.generateInsights(plan, result, metrics);

      // Phase 5: Derive improvements and lessons
      const improvements = this.deriveImprovements(plan, result, insights);
      const lessons = this.deriveLessonsLearned(plan, result, insights);
      const recommendations = this.generateRecommendations(plan, result, metrics, insights);

      // Phase 6: Calculate score
      const score = this.calculateScore(metrics, achieved, insights);
      const grade = this.calculateGrade(score);

      // Phase 7: Create reflection result
      const reflection = this.createReflectionResult(
        plan,
        result,
        achieved,
        reason,
        metrics,
        score,
        grade,
        insights,
        improvements,
        lessons,
        recommendations
      );

      this.info('Reflection complete', { score, grade, insightCount: insights.length });

      return reflection;
    } finally {
      this.isActive = false;
    }
  }

  validateInput(context: AgentContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!context.sharedState.get('plan')) {
      errors.push('No plan found in shared state');
    }
    if (!context.sharedState.get('result')) {
      errors.push('No execution result found in shared state');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --------------------------------------------------------------------------
  // Analysis Phases
  // --------------------------------------------------------------------------

  private async analyzeExecution(plan: TaskPlan, result: ExecutionResult): Promise<void> {
    await this.simulateThinking(100, 200);

    // Observe key facts
    this.observe(`Plan had ${plan.tasks.length} tasks, ${result.completedTasks} completed`, 0.95);
    this.observe(`Workflow used: ${result.workflowSelection.workflow.name}`, 0.95);
    
    if (result.failedTasks > 0) {
      this.observe(`${result.failedTasks} tasks failed during execution`, 0.95);
    }

    // Think about what happened
    if (result.success) {
      this.think('Execution completed successfully - analyzing efficiency', 0.9);
    } else {
      this.think('Execution had failures - analyzing root causes', 0.85);
    }

    // Analyze timing
    const estimatedDuration = plan.totalEstimatedDuration * 1000; // convert to ms
    const actualDuration = result.totalDuration;
    const efficiency = estimatedDuration > 0 ? actualDuration / estimatedDuration : 1;

    if (efficiency < 0.8) {
      this.analyze('Execution was faster than estimated - good optimization', 0.8);
    } else if (efficiency > 1.5) {
      this.analyze('Execution took longer than estimated - may need optimization', 0.8);
    } else {
      this.analyze('Execution time was within expected range', 0.85);
    }
  }

  private calculateMetrics(plan: TaskPlan, result: ExecutionResult): PerformanceMetrics {
    const totalTasks = result.taskExecutions.length;
    const completedTasks = result.completedTasks;
    const successRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const taskDurations = result.taskExecutions
      .filter(t => t.duration !== undefined)
      .map(t => t.duration!);
    
    const averageTaskDuration = taskDurations.length > 0
      ? taskDurations.reduce((a, b) => a + b, 0) / taskDurations.length
      : 0;

    const estimatedDuration = plan.totalEstimatedDuration * 1000;
    const efficiency = estimatedDuration > 0
      ? Math.min(estimatedDuration / result.totalDuration, 1.5)
      : 1;

    const reliability = result.workflowSelection.workflow.reliability;

    return {
      successRate,
      averageTaskDuration,
      totalDuration: result.totalDuration,
      efficiency,
      reliability,
    };
  }

  private evaluateGoalAchievement(
    plan: TaskPlan,
    result: ExecutionResult,
    metrics: PerformanceMetrics
  ): { achieved: boolean; reason: string } {
    // Goal is considered achieved if:
    // 1. All critical tasks completed
    // 2. Success rate is above threshold
    // 3. No critical errors occurred

    const criticalTasks = plan.tasks.filter(t => t.priority === 'critical');
    const criticalExecutions = result.taskExecutions.filter(e => 
      criticalTasks.some(t => t.id === e.taskId)
    );
    const criticalCompleted = criticalExecutions.filter(e => e.status === 'completed').length;
    const allCriticalDone = criticalCompleted === criticalTasks.length;

    const hasCriticalErrors = result.errors.some(e => 
      e.toLowerCase().includes('critical') || 
      e.toLowerCase().includes('fatal')
    );

    if (allCriticalDone && metrics.successRate >= 0.8 && !hasCriticalErrors) {
      this.decide('Goal achieved - all critical tasks completed with high success rate', 0.9);
      return {
        achieved: true,
        reason: `All ${criticalTasks.length} critical tasks completed successfully with ${(metrics.successRate * 100).toFixed(0)}% overall success rate`,
      };
    }

    if (allCriticalDone && metrics.successRate >= 0.6) {
      this.decide('Goal partially achieved - critical tasks done but with some failures', 0.75);
      return {
        achieved: true,
        reason: `Critical tasks completed but overall success rate was ${(metrics.successRate * 100).toFixed(0)}%`,
      };
    }

    // Goal not fully achieved
    const reasons: string[] = [];
    if (!allCriticalDone) {
      reasons.push(`${criticalTasks.length - criticalCompleted} critical tasks failed`);
    }
    if (metrics.successRate < 0.6) {
      reasons.push(`Low success rate: ${(metrics.successRate * 100).toFixed(0)}%`);
    }
    if (hasCriticalErrors) {
      reasons.push('Critical errors occurred during execution');
    }

    this.decide('Goal not fully achieved due to failures', 0.85);
    return {
      achieved: false,
      reason: reasons.join('; '),
    };
  }

  private async generateInsights(
    plan: TaskPlan,
    result: ExecutionResult,
    metrics: PerformanceMetrics
  ): Promise<Insight[]> {
    await this.simulateThinking(150, 250);

    const insights: Insight[] = [];

    // Success patterns
    if (metrics.successRate >= 0.9) {
      insights.push({
        id: uuidv4(),
        type: 'success',
        title: 'High Success Rate Achieved',
        description: `Execution achieved ${(metrics.successRate * 100).toFixed(0)}% success rate, indicating well-planned tasks and reliable workflow selection.`,
        confidence: 0.9,
        relatedTasks: result.taskExecutions.filter(t => t.status === 'completed').map(t => t.taskId),
      });
    }

    // Efficiency insights
    if (metrics.efficiency > 1.2) {
      insights.push({
        id: uuidv4(),
        type: 'success',
        title: 'Execution Efficiency Above Expected',
        description: 'Tasks completed faster than estimated, suggesting good workflow optimization or conservative initial estimates.',
        confidence: 0.85,
        relatedTasks: [],
      });
    } else if (metrics.efficiency < 0.7) {
      insights.push({
        id: uuidv4(),
        type: 'pattern',
        title: 'Execution Slower Than Expected',
        description: 'Tasks took longer than estimated. Consider reviewing task complexity estimates or workflow performance.',
        confidence: 0.8,
        relatedTasks: [],
      });
    }

    // Failure patterns
    const failedExecutions = result.taskExecutions.filter(t => t.status === 'failed');
    if (failedExecutions.length > 0) {
      // Analyze failure patterns
      const failureReasons = failedExecutions
        .filter(t => t.error)
        .map(t => t.error!.toLowerCase());

      const timeoutFailures = failureReasons.filter(r => r.includes('timeout')).length;
      const connectionFailures = failureReasons.filter(r => r.includes('connection')).length;
      const validationFailures = failureReasons.filter(r => r.includes('validation')).length;

      if (timeoutFailures > 0) {
        insights.push({
          id: uuidv4(),
          type: 'failure',
          title: 'Timeout Issues Detected',
          description: `${timeoutFailures} task(s) failed due to timeouts. Consider increasing timeout limits or optimizing task performance.`,
          confidence: 0.85,
          relatedTasks: failedExecutions.filter(t => t.error?.toLowerCase().includes('timeout')).map(t => t.taskId),
        });
      }

      if (connectionFailures > 0) {
        insights.push({
          id: uuidv4(),
          type: 'failure',
          title: 'Connection Issues Detected',
          description: `${connectionFailures} task(s) failed due to connection errors. Check network stability and service availability.`,
          confidence: 0.8,
          relatedTasks: failedExecutions.filter(t => t.error?.toLowerCase().includes('connection')).map(t => t.taskId),
        });
      }

      if (validationFailures > 0) {
        insights.push({
          id: uuidv4(),
          type: 'failure',
          title: 'Validation Failures',
          description: `${validationFailures} task(s) failed validation. Review input data quality and validation rules.`,
          confidence: 0.85,
          relatedTasks: failedExecutions.filter(t => t.error?.toLowerCase().includes('validation')).map(t => t.taskId),
        });
      }
    }

    // Workflow insight
    if (result.workflowSelection.confidence < 0.7) {
      insights.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Workflow Selection Uncertainty',
        description: 'The selected workflow had lower confidence. Consider expanding workflow options for better task type coverage.',
        confidence: 0.75,
        relatedTasks: [],
      });
    }

    // Task complexity insight
    const complexTasks = plan.tasks.filter(t => t.priority === 'critical');
    if (complexTasks.length > plan.tasks.length * 0.5) {
      insights.push({
        id: uuidv4(),
        type: 'pattern',
        title: 'High Proportion of Critical Tasks',
        description: 'Over 50% of tasks are marked critical. Consider breaking down the goal into smaller, more manageable pieces.',
        confidence: 0.7,
        relatedTasks: complexTasks.map(t => t.id),
      });
    }

    this.act(`Generated ${insights.length} insights from execution analysis`, 0.85);

    return insights;
  }

  private deriveImprovements(
    plan: TaskPlan,
    result: ExecutionResult,
    insights: Insight[]
  ): string[] {
    const improvements: string[] = [];

    // Based on insights
    for (const insight of insights) {
      if (insight.type === 'failure') {
        if (insight.title.includes('Timeout')) {
          improvements.push('Increase task timeout limits for long-running operations');
          improvements.push('Add progress monitoring for better timeout management');
        }
        if (insight.title.includes('Connection')) {
          improvements.push('Implement retry logic with exponential backoff');
          improvements.push('Add connection health checks before task execution');
        }
        if (insight.title.includes('Validation')) {
          improvements.push('Enhance input validation before task execution');
          improvements.push('Add data quality checks in the planning phase');
        }
      }
      if (insight.type === 'opportunity') {
        improvements.push('Expand workflow catalog with more specialized options');
      }
    }

    // Based on metrics
    if (result.failedTasks > 0) {
      improvements.push('Add error recovery mechanisms for failed tasks');
    }

    if (plan.tasks.length > 8) {
      improvements.push('Consider parallelizing independent tasks for faster execution');
    }

    // Remove duplicates and limit
    return Array.from(new Set(improvements)).slice(0, 5);
  }

  private deriveLessonsLearned(
    plan: TaskPlan,
    result: ExecutionResult,
    insights: Insight[]
  ): string[] {
    const lessons: string[] = [];

    // Success lessons
    if (result.success) {
      lessons.push(`The ${result.workflowSelection.workflow.name} workflow is effective for goals like "${plan.goal.slice(0, 50)}..."`);
    }

    // Failure lessons
    if (result.failedTasks > 0) {
      lessons.push(`Tasks of type "${plan.tasks.find(t => 
        result.taskExecutions.some(e => e.taskId === t.id && e.status === 'failed')
      )?.type || 'unknown'}" may need additional attention`);
    }

    // Complexity lessons
    if (plan.complexity === 'complex' && result.success) {
      lessons.push('Complex goals can be successfully handled when properly decomposed');
    }

    // Timing lessons
    const actualVsEstimated = result.totalDuration / (plan.totalEstimatedDuration * 1000);
    if (actualVsEstimated > 1.5) {
      lessons.push('Duration estimates should be increased for similar goals');
    } else if (actualVsEstimated < 0.5) {
      lessons.push('Duration estimates can be reduced for similar goals');
    }

    return lessons.slice(0, 4);
  }

  private generateRecommendations(
    plan: TaskPlan,
    result: ExecutionResult,
    metrics: PerformanceMetrics,
    insights: Insight[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.successRate < 0.8) {
      recommendations.push('Review and refine task definitions for better clarity');
    }

    if (result.workflowSelection.alternatives.length > 0 && !result.success) {
      recommendations.push(`Consider using "${result.workflowSelection.alternatives[0].workflow.name}" as an alternative workflow`);
    }

    if (plan.tasks.length > 5) {
      recommendations.push('Group related tasks into subtasks for better organization');
    }

    if (insights.some(i => i.type === 'failure')) {
      recommendations.push('Implement monitoring and alerting for early failure detection');
    }

    return recommendations.slice(0, 4);
  }

  // --------------------------------------------------------------------------
  // Scoring and Grading
  // --------------------------------------------------------------------------

  private calculateScore(
    metrics: PerformanceMetrics,
    goalAchieved: boolean,
    insights: Insight[]
  ): number {
    let score = 0;

    // Success rate contributes 40%
    score += metrics.successRate * 40;

    // Goal achievement contributes 30%
    score += goalAchieved ? 30 : 10;

    // Efficiency contributes 15%
    score += Math.min(metrics.efficiency, 1) * 15;

    // Low failure insights contribute up to 15%
    const failureInsights = insights.filter(i => i.type === 'failure').length;
    const insightPenalty = Math.min(failureInsights * 5, 15);
    score += 15 - insightPenalty;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // --------------------------------------------------------------------------
  // Result Creation
  // --------------------------------------------------------------------------

  private createReflectionResult(
    plan: TaskPlan,
    result: ExecutionResult,
    goalAchieved: boolean,
    goalReason: string,
    metrics: PerformanceMetrics,
    score: number,
    grade: 'A' | 'B' | 'C' | 'D' | 'F',
    insights: Insight[],
    improvements: string[],
    lessons: string[],
    recommendations: string[]
  ): ReflectionResult {
    const summary = this.generateSummary(plan, result, goalAchieved, score, grade);

    return {
      reflectionId: uuidv4(),
      planId: plan.planId,
      executionId: result.executionId,
      goalAchieved,
      goalAchievementReason: goalReason,
      metrics,
      score,
      grade,
      summary,
      insights: insights.map(i => ({
        ...i,
        title: i.title,
        description: i.description,
      })),
      improvements,
      lessonsLearned: lessons,
      recommendations,
      reasoning: {
        steps: this.getReasoning(),
        summary: `Reflection analysis completed with ${insights.length} insights identified`,
        totalConfidence: this.calculateConfidence(),
      },
      createdAt: new Date(),
    };
  }

  private generateSummary(
    plan: TaskPlan,
    result: ExecutionResult,
    goalAchieved: boolean,
    score: number,
    grade: string
  ): string {
    const status = goalAchieved ? 'achieved' : 'not fully achieved';
    const taskSummary = `${result.completedTasks}/${result.taskExecutions.length} tasks completed`;
    
    return `Goal "${plan.goal.slice(0, 50)}..." was ${status}. ` +
           `${taskSummary} with a performance score of ${score}/100 (Grade: ${grade}). ` +
           `Execution used the ${result.workflowSelection.workflow.name} workflow.`;
  }
}
