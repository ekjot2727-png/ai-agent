/**
 * AgentEvaluator - Agent Run Evaluation Module
 * 
 * Scores agent runs on:
 * - Planning quality
 * - Execution reliability
 * - Optimization effectiveness
 * 
 * Returns structured scorecards and stores results in memory.
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export interface PlanningScore {
  taskDecomposition: number;     // How well goal was broken into tasks (0-100)
  taskClarity: number;           // Clarity of task descriptions (0-100)
  prioritization: number;        // Quality of task prioritization (0-100)
  workflowSelection: number;     // Appropriateness of workflow choice (0-100)
  reasoningQuality: number;      // Quality of reasoning steps (0-100)
  estimationAccuracy: number;    // Accuracy of duration estimates (0-100)
  overall: number;               // Weighted overall score (0-100)
}

export interface ExecutionScore {
  completionRate: number;        // Percentage of tasks completed (0-100)
  errorHandling: number;         // How well errors were handled (0-100)
  timeEfficiency: number;        // Actual vs estimated time (0-100)
  resourceUtilization: number;   // Efficiency of resource use (0-100)
  recoverySuccess: number;       // Success of recovery attempts (0-100)
  overall: number;               // Weighted overall score (0-100)
}

export interface OptimizationScore {
  insightRelevance: number;      // Relevance of generated insights (0-100)
  suggestionQuality: number;     // Quality of improvement suggestions (0-100)
  patternDetection: number;      // Accuracy of pattern detection (0-100)
  impactEstimation: number;      // Accuracy of impact estimates (0-100)
  learningIntegration: number;   // Integration with past learnings (0-100)
  overall: number;               // Weighted overall score (0-100)
}

export interface AgentScorecard {
  id: string;
  runId: string;
  timestamp: Date;
  goal: string;
  planning: PlanningScore;
  execution: ExecutionScore;
  optimization: OptimizationScore;
  overallScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EvaluationConfig {
  planningWeight: number;        // Weight for planning score (default: 0.35)
  executionWeight: number;       // Weight for execution score (default: 0.45)
  optimizationWeight: number;    // Weight for optimization score (default: 0.20)
  minTasksForFullScore: number;  // Min tasks needed for full task score
  idealEstimationVariance: number; // Acceptable variance in time estimates
}

export interface AgentRunData {
  runId: string;
  goal: string;
  plan?: {
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      priority: string;
      estimatedDuration: number;
      reasoning?: string;
    }>;
    workflow?: {
      id: string;
      name: string;
      reason: string;
      confidence: number;
    };
    reasoning?: {
      steps: Array<{ type: string; content: string; confidence: number }>;
      summary?: string;
      totalConfidence?: number;
    };
    estimatedTotalDuration?: number;
  };
  execution?: {
    success: boolean;
    completedTasks: number;
    failedTasks: number;
    totalTasks: number;
    duration: number;
    errors: string[];
    taskTimeline?: Array<{
      taskId: string;
      taskTitle: string;
      status: string;
      duration?: number;
    }>;
  };
  reflection?: {
    score: number;
    insights: Array<{ type: string; title: string; description: string }>;
    improvements: string[];
    lessonsLearned: string[];
  };
  optimization?: {
    optimizations: Array<{
      type: string;
      title: string;
      description: string;
      impact: string;
      priority: number;
    }>;
    patterns: Array<{ type: string; description: string; frequency: number }>;
    estimatedImprovements?: {
      successRate: number;
      efficiency: number;
    };
  };
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: EvaluationConfig = {
  planningWeight: 0.35,
  executionWeight: 0.45,
  optimizationWeight: 0.20,
  minTasksForFullScore: 3,
  idealEstimationVariance: 0.15, // 15% variance acceptable
};

// =============================================================================
// AgentEvaluator Class
// =============================================================================

export class AgentEvaluator {
  private config: EvaluationConfig;
  private scorecards: Map<string, AgentScorecard> = new Map();
  private historicalScores: number[] = [];

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Main Evaluation Method
  // ---------------------------------------------------------------------------

  evaluate(runData: AgentRunData): AgentScorecard {
    const planningScore = this.evaluatePlanning(runData);
    const executionScore = this.evaluateExecution(runData);
    const optimizationScore = this.evaluateOptimization(runData);

    const overallScore = this.calculateOverallScore(
      planningScore,
      executionScore,
      optimizationScore
    );

    const grade = this.determineGrade(overallScore);
    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(
      planningScore,
      executionScore,
      optimizationScore
    );
    const recommendations = this.generateRecommendations(
      planningScore,
      executionScore,
      optimizationScore
    );

    const scorecard: AgentScorecard = {
      id: uuidv4(),
      runId: runData.runId,
      timestamp: new Date(),
      goal: runData.goal,
      planning: planningScore,
      execution: executionScore,
      optimization: optimizationScore,
      overallScore: Math.round(overallScore),
      grade,
      summary: this.generateSummary(overallScore, grade, strengths, weaknesses),
      strengths,
      weaknesses,
      recommendations,
    };

    // Store scorecard
    this.scorecards.set(scorecard.id, scorecard);
    this.historicalScores.push(overallScore);

    return scorecard;
  }

  // ---------------------------------------------------------------------------
  // Planning Evaluation
  // ---------------------------------------------------------------------------

  private evaluatePlanning(runData: AgentRunData): PlanningScore {
    const plan = runData.plan;
    if (!plan) {
      return this.createEmptyPlanningScore();
    }

    // Task decomposition score
    const taskCount = plan.tasks?.length || 0;
    const taskDecomposition = Math.min(100, (taskCount / this.config.minTasksForFullScore) * 100);

    // Task clarity score
    const taskClarity = this.evaluateTaskClarity(plan.tasks || []);

    // Prioritization score
    const prioritization = this.evaluatePrioritization(plan.tasks || []);

    // Workflow selection score
    const workflowSelection = plan.workflow ? 
      Math.min(100, (plan.workflow.confidence || 0.5) * 100 + 30) : 50;

    // Reasoning quality score
    const reasoningQuality = this.evaluateReasoningQuality(plan.reasoning);

    // Estimation accuracy (compared against actual if available)
    const estimationAccuracy = runData.execution ? 
      this.evaluateEstimationAccuracy(plan, runData.execution) : 70;

    const overall = (
      taskDecomposition * 0.2 +
      taskClarity * 0.2 +
      prioritization * 0.15 +
      workflowSelection * 0.15 +
      reasoningQuality * 0.2 +
      estimationAccuracy * 0.1
    );

    return {
      taskDecomposition: Math.round(taskDecomposition),
      taskClarity: Math.round(taskClarity),
      prioritization: Math.round(prioritization),
      workflowSelection: Math.round(workflowSelection),
      reasoningQuality: Math.round(reasoningQuality),
      estimationAccuracy: Math.round(estimationAccuracy),
      overall: Math.round(overall),
    };
  }

  private evaluateTaskClarity(tasks: Array<{ title: string; description: string }>): number {
    if (tasks.length === 0) return 0;

    let totalScore = 0;
    for (const task of tasks) {
      let taskScore = 0;
      
      // Title quality
      if (task.title && task.title.length >= 5) taskScore += 25;
      if (task.title && task.title.length >= 15) taskScore += 15;
      
      // Description quality
      if (task.description && task.description.length >= 20) taskScore += 30;
      if (task.description && task.description.length >= 50) taskScore += 20;
      
      // Contains action verb
      const actionVerbs = ['create', 'setup', 'configure', 'deploy', 'build', 'test', 'validate', 'implement', 'run', 'execute'];
      if (actionVerbs.some(v => task.title?.toLowerCase().includes(v) || task.description?.toLowerCase().includes(v))) {
        taskScore += 10;
      }

      totalScore += Math.min(100, taskScore);
    }

    return totalScore / tasks.length;
  }

  private evaluatePrioritization(tasks: Array<{ priority: string }>): number {
    if (tasks.length === 0) return 0;

    const priorities = tasks.map(t => t.priority?.toLowerCase());
    const hasHighPriority = priorities.some(p => p === 'high' || p === 'critical');
    const hasLowPriority = priorities.some(p => p === 'low' || p === 'optional');
    const hasMediumPriority = priorities.some(p => p === 'medium' || p === 'normal');

    let score = 50; // Base score
    if (hasHighPriority) score += 20;
    if (hasMediumPriority) score += 15;
    if (hasLowPriority) score += 10;
    
    // Check for variety (good prioritization has mixed priorities)
    const uniquePriorities = new Set(priorities).size;
    if (uniquePriorities >= 2) score += 5;

    return Math.min(100, score);
  }

  private evaluateReasoningQuality(reasoning?: { steps: Array<{ type: string; content: string; confidence: number }>; summary?: string; totalConfidence?: number }): number {
    if (!reasoning) return 40;

    let score = 50;
    
    // Steps count
    const stepCount = reasoning.steps?.length || 0;
    if (stepCount >= 3) score += 15;
    if (stepCount >= 5) score += 10;
    
    // Average confidence
    if (reasoning.totalConfidence) {
      score += reasoning.totalConfidence * 15;
    } else if (reasoning.steps && reasoning.steps.length > 0) {
      const avgConfidence = reasoning.steps.reduce((sum, s) => sum + (s.confidence || 0), 0) / reasoning.steps.length;
      score += avgConfidence * 15;
    }
    
    // Has summary
    if (reasoning.summary && reasoning.summary.length > 20) score += 10;

    return Math.min(100, score);
  }

  private evaluateEstimationAccuracy(plan: AgentRunData['plan'], execution: AgentRunData['execution']): number {
    if (!plan?.estimatedTotalDuration || !execution?.duration) return 70;

    const estimated = plan.estimatedTotalDuration;
    const actual = execution.duration;
    const variance = Math.abs(estimated - actual) / Math.max(estimated, 1);

    if (variance <= this.config.idealEstimationVariance) return 100;
    if (variance <= 0.3) return 85;
    if (variance <= 0.5) return 70;
    if (variance <= 0.75) return 55;
    return 40;
  }

  private createEmptyPlanningScore(): PlanningScore {
    return {
      taskDecomposition: 0,
      taskClarity: 0,
      prioritization: 0,
      workflowSelection: 0,
      reasoningQuality: 0,
      estimationAccuracy: 0,
      overall: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Execution Evaluation
  // ---------------------------------------------------------------------------

  private evaluateExecution(runData: AgentRunData): ExecutionScore {
    const execution = runData.execution;
    if (!execution) {
      return this.createEmptyExecutionScore();
    }

    // Completion rate
    const completionRate = execution.totalTasks > 0 ?
      (execution.completedTasks / execution.totalTasks) * 100 : 0;

    // Error handling score
    const errorHandling = this.evaluateErrorHandling(execution);

    // Time efficiency
    const timeEfficiency = this.evaluateTimeEfficiency(runData);

    // Resource utilization (simulated based on success rate)
    const resourceUtilization = execution.success ? 85 : 60;

    // Recovery success
    const recoverySuccess = this.evaluateRecoverySuccess(execution);

    const overall = (
      completionRate * 0.35 +
      errorHandling * 0.2 +
      timeEfficiency * 0.2 +
      resourceUtilization * 0.1 +
      recoverySuccess * 0.15
    );

    return {
      completionRate: Math.round(completionRate),
      errorHandling: Math.round(errorHandling),
      timeEfficiency: Math.round(timeEfficiency),
      resourceUtilization: Math.round(resourceUtilization),
      recoverySuccess: Math.round(recoverySuccess),
      overall: Math.round(overall),
    };
  }

  private evaluateErrorHandling(execution: AgentRunData['execution']): number {
    if (!execution) return 0;

    const errorCount = execution.errors?.length || 0;
    const failedTasks = execution.failedTasks || 0;

    if (errorCount === 0 && failedTasks === 0) return 100;
    if (errorCount <= 1 && failedTasks <= 1) return 85;
    if (errorCount <= 3 && failedTasks <= 2) return 70;
    if (execution.success) return 60; // Still succeeded despite errors
    return 40;
  }

  private evaluateTimeEfficiency(runData: AgentRunData): number {
    const estimated = runData.plan?.estimatedTotalDuration;
    const actual = runData.execution?.duration;

    if (!estimated || !actual) return 70;

    const ratio = actual / estimated;
    if (ratio <= 1.0) return 100; // Faster than estimated
    if (ratio <= 1.2) return 90;
    if (ratio <= 1.5) return 75;
    if (ratio <= 2.0) return 60;
    return 45;
  }

  private evaluateRecoverySuccess(execution: AgentRunData['execution']): number {
    if (!execution) return 0;

    const hadErrors = (execution.errors?.length || 0) > 0 || execution.failedTasks > 0;
    
    if (!hadErrors) return 100; // No recovery needed

    // If there were failures but still succeeded overall
    if (execution.success && hadErrors) return 90;
    
    // Partial success with failures
    if (execution.completedTasks > 0 && execution.failedTasks > 0) return 60;

    return 30;
  }

  private createEmptyExecutionScore(): ExecutionScore {
    return {
      completionRate: 0,
      errorHandling: 0,
      timeEfficiency: 0,
      resourceUtilization: 0,
      recoverySuccess: 0,
      overall: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Optimization Evaluation
  // ---------------------------------------------------------------------------

  private evaluateOptimization(runData: AgentRunData): OptimizationScore {
    const reflection = runData.reflection;
    const optimization = runData.optimization;

    if (!reflection && !optimization) {
      return this.createEmptyOptimizationScore();
    }

    // Insight relevance
    const insightRelevance = this.evaluateInsightRelevance(reflection);

    // Suggestion quality
    const suggestionQuality = this.evaluateSuggestionQuality(optimization);

    // Pattern detection
    const patternDetection = this.evaluatePatternDetection(optimization);

    // Impact estimation
    const impactEstimation = this.evaluateImpactEstimation(optimization);

    // Learning integration
    const learningIntegration = this.evaluateLearningIntegration(reflection);

    const overall = (
      insightRelevance * 0.25 +
      suggestionQuality * 0.25 +
      patternDetection * 0.2 +
      impactEstimation * 0.15 +
      learningIntegration * 0.15
    );

    return {
      insightRelevance: Math.round(insightRelevance),
      suggestionQuality: Math.round(suggestionQuality),
      patternDetection: Math.round(patternDetection),
      impactEstimation: Math.round(impactEstimation),
      learningIntegration: Math.round(learningIntegration),
      overall: Math.round(overall),
    };
  }

  private evaluateInsightRelevance(reflection?: AgentRunData['reflection']): number {
    if (!reflection) return 40;

    const insightCount = reflection.insights?.length || 0;
    let score = 40;

    if (insightCount >= 1) score += 20;
    if (insightCount >= 3) score += 15;
    if (insightCount >= 5) score += 10;
    
    // Check insight quality
    const insights = reflection.insights || [];
    for (const insight of insights) {
      if (insight.description && insight.description.length > 30) score += 3;
    }

    return Math.min(100, score);
  }

  private evaluateSuggestionQuality(optimization?: AgentRunData['optimization']): number {
    if (!optimization) return 40;

    const suggestionCount = optimization.optimizations?.length || 0;
    let score = 40;

    if (suggestionCount >= 1) score += 20;
    if (suggestionCount >= 3) score += 15;
    
    // Check for high-impact suggestions
    const highImpact = optimization.optimizations?.filter(o => 
      o.impact?.toLowerCase() === 'high' || o.priority >= 8
    ).length || 0;
    score += highImpact * 5;

    return Math.min(100, score);
  }

  private evaluatePatternDetection(optimization?: AgentRunData['optimization']): number {
    if (!optimization) return 40;

    const patternCount = optimization.patterns?.length || 0;
    let score = 40;

    if (patternCount >= 1) score += 25;
    if (patternCount >= 3) score += 20;
    
    // High frequency patterns are more valuable
    const highFreqPatterns = optimization.patterns?.filter(p => (p.frequency || 0) >= 3).length || 0;
    score += highFreqPatterns * 5;

    return Math.min(100, score);
  }

  private evaluateImpactEstimation(optimization?: AgentRunData['optimization']): number {
    if (!optimization?.estimatedImprovements) return 50;

    const improvements = optimization.estimatedImprovements;
    let score = 50;

    if (improvements.successRate > 0) score += 20;
    if (improvements.efficiency > 0) score += 20;
    if (improvements.successRate > 10) score += 10;

    return Math.min(100, score);
  }

  private evaluateLearningIntegration(reflection?: AgentRunData['reflection']): number {
    if (!reflection) return 40;

    let score = 40;
    
    const lessonsCount = reflection.lessonsLearned?.length || 0;
    const improvementsCount = reflection.improvements?.length || 0;

    if (lessonsCount >= 1) score += 20;
    if (lessonsCount >= 3) score += 15;
    if (improvementsCount >= 1) score += 15;
    if (improvementsCount >= 3) score += 10;

    return Math.min(100, score);
  }

  private createEmptyOptimizationScore(): OptimizationScore {
    return {
      insightRelevance: 0,
      suggestionQuality: 0,
      patternDetection: 0,
      impactEstimation: 0,
      learningIntegration: 0,
      overall: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Overall Score & Grade
  // ---------------------------------------------------------------------------

  private calculateOverallScore(
    planning: PlanningScore,
    execution: ExecutionScore,
    optimization: OptimizationScore
  ): number {
    return (
      planning.overall * this.config.planningWeight +
      execution.overall * this.config.executionWeight +
      optimization.overall * this.config.optimizationWeight
    );
  }

  private determineGrade(score: number): AgentScorecard['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private identifyStrengthsWeaknesses(
    planning: PlanningScore,
    execution: ExecutionScore,
    optimization: OptimizationScore
  ): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Planning analysis
    if (planning.taskDecomposition >= 80) strengths.push('Excellent task decomposition');
    else if (planning.taskDecomposition < 50) weaknesses.push('Improve task breakdown');

    if (planning.reasoningQuality >= 80) strengths.push('Strong reasoning quality');
    else if (planning.reasoningQuality < 50) weaknesses.push('Enhance reasoning documentation');

    // Execution analysis
    if (execution.completionRate >= 90) strengths.push('High task completion rate');
    else if (execution.completionRate < 70) weaknesses.push('Improve task completion');

    if (execution.errorHandling >= 80) strengths.push('Robust error handling');
    else if (execution.errorHandling < 50) weaknesses.push('Strengthen error handling');

    if (execution.timeEfficiency >= 85) strengths.push('Efficient execution time');
    else if (execution.timeEfficiency < 60) weaknesses.push('Optimize execution speed');

    // Optimization analysis
    if (optimization.insightRelevance >= 80) strengths.push('Relevant insights generated');
    else if (optimization.insightRelevance < 50) weaknesses.push('Improve insight generation');

    if (optimization.patternDetection >= 80) strengths.push('Good pattern recognition');
    else if (optimization.patternDetection < 50) weaknesses.push('Enhance pattern detection');

    return { strengths, weaknesses };
  }

  private generateRecommendations(
    planning: PlanningScore,
    execution: ExecutionScore,
    optimization: OptimizationScore
  ): string[] {
    const recommendations: string[] = [];

    if (planning.taskDecomposition < 70) {
      recommendations.push('Break down goals into more granular tasks for better tracking');
    }

    if (planning.estimationAccuracy < 70) {
      recommendations.push('Improve time estimation by analyzing historical execution data');
    }

    if (execution.errorHandling < 70) {
      recommendations.push('Implement more comprehensive error handling strategies');
    }

    if (execution.recoverySuccess < 70) {
      recommendations.push('Develop better recovery mechanisms for failed tasks');
    }

    if (optimization.learningIntegration < 70) {
      recommendations.push('Better integrate lessons learned into future planning');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current practices - performance is excellent');
    }

    return recommendations;
  }

  private generateSummary(
    score: number,
    grade: string,
    strengths: string[],
    weaknesses: string[]
  ): string {
    const performance = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement';
    const strengthCount = strengths.length;
    const weaknessCount = weaknesses.length;

    return `Agent run achieved ${performance} performance with grade ${grade} (${Math.round(score)}/100). ` +
      `Identified ${strengthCount} strength${strengthCount !== 1 ? 's' : ''} and ` +
      `${weaknessCount} area${weaknessCount !== 1 ? 's' : ''} for improvement.`;
  }

  // ---------------------------------------------------------------------------
  // Scorecard Management
  // ---------------------------------------------------------------------------

  getScorecard(id: string): AgentScorecard | undefined {
    return this.scorecards.get(id);
  }

  getScorecardByRunId(runId: string): AgentScorecard | undefined {
    for (const scorecard of Array.from(this.scorecards.values())) {
      if (scorecard.runId === runId) return scorecard;
    }
    return undefined;
  }

  getAllScorecards(): AgentScorecard[] {
    return Array.from(this.scorecards.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentScorecards(limit: number = 10): AgentScorecard[] {
    return this.getAllScorecards().slice(0, limit);
  }

  getAverageScore(): number {
    if (this.historicalScores.length === 0) return 0;
    return this.historicalScores.reduce((a, b) => a + b, 0) / this.historicalScores.length;
  }

  getScoreTrend(): 'improving' | 'stable' | 'declining' {
    if (this.historicalScores.length < 3) return 'stable';
    
    const recent = this.historicalScores.slice(-5);
    const older = this.historicalScores.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  getStatistics(): {
    totalEvaluations: number;
    averageScore: number;
    trend: string;
    gradeDistribution: Record<string, number>;
  } {
    const scorecards = this.getAllScorecards();
    const gradeDistribution: Record<string, number> = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0
    };

    for (const sc of scorecards) {
      gradeDistribution[sc.grade]++;
    }

    return {
      totalEvaluations: scorecards.length,
      averageScore: Math.round(this.getAverageScore()),
      trend: this.getScoreTrend(),
      gradeDistribution,
    };
  }

  reset(): void {
    this.scorecards.clear();
    this.historicalScores = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let evaluatorInstance: AgentEvaluator | null = null;

export function getAgentEvaluator(): AgentEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new AgentEvaluator();
  }
  return evaluatorInstance;
}

export function resetAgentEvaluator(): void {
  evaluatorInstance = null;
}
