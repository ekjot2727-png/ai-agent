/**
 * ConfidenceScorer - Confidence Scoring for Agent Plans
 * 
 * Calculates confidence based on:
 * - Goal clarity
 * - Past success rate
 * - Task complexity
 * 
 * Uses confidence to influence execution behavior.
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export interface GoalClarityScore {
  specificity: number;        // How specific is the goal (0-1)
  actionability: number;      // Can it be acted upon (0-1)
  measurability: number;      // Can success be measured (0-1)
  contextRichness: number;    // Quality of context provided (0-1)
  overall: number;            // Weighted overall (0-1)
}

export interface HistoricalScore {
  similarGoalSuccessRate: number;  // Success rate for similar goals (0-1)
  workflowSuccessRate: number;     // Success rate for selected workflow (0-1)
  recentTrend: number;             // Recent performance trend (0-1)
  dataPoints: number;              // Number of historical data points
  overall: number;                 // Weighted overall (0-1)
}

export interface ComplexityScore {
  taskCount: number;          // Number of tasks (raw)
  estimatedDuration: number;  // Total estimated minutes
  priorityMix: number;        // Balance of priorities (0-1)
  dependencyDepth: number;    // Task dependencies (0-1)
  riskLevel: number;          // Assessed risk (0-1)
  overall: number;            // Complexity-adjusted confidence (0-1)
}

export interface ConfidenceAssessment {
  id: string;
  timestamp: Date;
  goal: string;
  goalClarity: GoalClarityScore;
  historical: HistoricalScore;
  complexity: ComplexityScore;
  overallConfidence: number;
  confidenceLevel: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  executionRecommendation: ExecutionRecommendation;
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ExecutionRecommendation {
  proceedWithExecution: boolean;
  cautionLevel: 'none' | 'low' | 'medium' | 'high';
  suggestedApproach: string;
  additionalValidation: string[];
  riskMitigation: string[];
}

export interface ConfidenceConfig {
  clarityWeight: number;
  historicalWeight: number;
  complexityWeight: number;
  minConfidenceThreshold: number;
  cautionThreshold: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: ConfidenceConfig = {
  clarityWeight: 0.35,
  historicalWeight: 0.35,
  complexityWeight: 0.30,
  minConfidenceThreshold: 0.4,
  cautionThreshold: 0.6,
};

// =============================================================================
// Keyword Patterns for Analysis
// =============================================================================

const ACTION_VERBS = [
  'create', 'build', 'deploy', 'setup', 'configure', 'implement',
  'migrate', 'update', 'fix', 'optimize', 'test', 'monitor',
  'install', 'run', 'execute', 'develop', 'design', 'integrate'
];

const SPECIFIC_TECHNOLOGIES = [
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
  'jenkins', 'github', 'gitlab', 'react', 'node', 'python',
  'java', 'postgres', 'mysql', 'mongodb', 'redis', 'nginx'
];

const MEASURABLE_INDICATORS = [
  'performance', 'latency', 'throughput', 'availability', 'uptime',
  'coverage', 'errors', 'logs', 'metrics', 'alerts', 'monitoring',
  'scale', 'capacity', 'concurrent', 'response time', 'sla'
];

const AMBIGUOUS_PATTERNS = [
  'make it better', 'improve things', 'fix stuff', 'do something',
  'work on it', 'handle it', 'take care of', 'sort out'
];

// =============================================================================
// ConfidenceScorer Class
// =============================================================================

export class ConfidenceScorer {
  private config: ConfidenceConfig;
  private assessments: Map<string, ConfidenceAssessment> = new Map();
  private historicalData: Map<string, number[]> = new Map(); // pattern -> success rates

  constructor(config: Partial<ConfidenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Main Confidence Assessment
  // ---------------------------------------------------------------------------

  assessConfidence(
    goal: string,
    context?: string,
    plan?: {
      tasks: Array<{ priority: string; estimatedDuration: number }>;
      workflow?: { id: string; name: string };
      estimatedTotalDuration?: number;
    },
    historicalRuns?: Array<{ goal: string; success: boolean; score: number }>
  ): ConfidenceAssessment {
    // Calculate individual scores
    const goalClarity = this.assessGoalClarity(goal, context);
    const historical = this.assessHistoricalPerformance(goal, historicalRuns);
    const complexity = this.assessComplexity(plan);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      goalClarity,
      historical,
      complexity
    );

    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(overallConfidence);

    // Generate factors
    const factors = this.identifyFactors(goalClarity, historical, complexity);

    // Generate execution recommendation
    const executionRecommendation = this.generateExecutionRecommendation(
      overallConfidence,
      confidenceLevel,
      factors
    );

    const assessment: ConfidenceAssessment = {
      id: uuidv4(),
      timestamp: new Date(),
      goal,
      goalClarity,
      historical,
      complexity,
      overallConfidence,
      confidenceLevel,
      executionRecommendation,
      factors,
    };

    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  // ---------------------------------------------------------------------------
  // Goal Clarity Assessment
  // ---------------------------------------------------------------------------

  private assessGoalClarity(goal: string, context?: string): GoalClarityScore {
    const goalLower = goal.toLowerCase();
    const fullText = `${goal} ${context || ''}`.toLowerCase();

    // Specificity: presence of specific technologies, numbers, or details
    let specificity = 0;
    if (SPECIFIC_TECHNOLOGIES.some(tech => fullText.includes(tech))) specificity += 0.3;
    if (/\d+/.test(goal)) specificity += 0.2; // Contains numbers
    if (goal.length > 50) specificity += 0.2;
    if (goal.length > 100) specificity += 0.15;
    if (context && context.length > 30) specificity += 0.15;
    specificity = Math.min(1, specificity);

    // Actionability: presence of action verbs
    let actionability = 0;
    const actionVerbCount = ACTION_VERBS.filter(v => goalLower.includes(v)).length;
    actionability = Math.min(1, actionVerbCount * 0.25 + 0.3);
    
    // Penalize for ambiguous patterns
    if (AMBIGUOUS_PATTERNS.some(p => goalLower.includes(p))) {
      actionability -= 0.4;
    }
    actionability = Math.max(0, actionability);

    // Measurability: presence of measurable outcomes
    let measurability = 0.3; // Base score
    const measurableCount = MEASURABLE_INDICATORS.filter(m => fullText.includes(m)).length;
    measurability = Math.min(1, measurability + measurableCount * 0.15);

    // Context richness
    let contextRichness = 0.2; // Base score
    if (context) {
      if (context.length > 20) contextRichness += 0.2;
      if (context.length > 50) contextRichness += 0.2;
      if (context.length > 100) contextRichness += 0.2;
      if (SPECIFIC_TECHNOLOGIES.some(tech => context.toLowerCase().includes(tech))) {
        contextRichness += 0.2;
      }
    }
    contextRichness = Math.min(1, contextRichness);

    const overall = (
      specificity * 0.3 +
      actionability * 0.35 +
      measurability * 0.2 +
      contextRichness * 0.15
    );

    return {
      specificity: Math.round(specificity * 100) / 100,
      actionability: Math.round(actionability * 100) / 100,
      measurability: Math.round(measurability * 100) / 100,
      contextRichness: Math.round(contextRichness * 100) / 100,
      overall: Math.round(overall * 100) / 100,
    };
  }

  // ---------------------------------------------------------------------------
  // Historical Performance Assessment
  // ---------------------------------------------------------------------------

  private assessHistoricalPerformance(
    goal: string,
    historicalRuns?: Array<{ goal: string; success: boolean; score: number }>
  ): HistoricalScore {
    if (!historicalRuns || historicalRuns.length === 0) {
      return {
        similarGoalSuccessRate: 0.7, // Default assumption
        workflowSuccessRate: 0.7,
        recentTrend: 0.5, // Neutral
        dataPoints: 0,
        overall: 0.6, // Moderate confidence without history
      };
    }

    const goalKeywords = this.extractKeywords(goal);
    
    // Find similar goals
    const similarRuns = historicalRuns.filter(run => {
      const runKeywords = this.extractKeywords(run.goal);
      const overlap = goalKeywords.filter(k => runKeywords.includes(k)).length;
      return overlap >= 1;
    });

    // Calculate similar goal success rate
    const similarGoalSuccessRate = similarRuns.length > 0
      ? similarRuns.filter(r => r.success).length / similarRuns.length
      : 0.7;

    // Overall success rate as workflow proxy
    const workflowSuccessRate = historicalRuns.filter(r => r.success).length / historicalRuns.length;

    // Recent trend (last 5 vs previous)
    const recent = historicalRuns.slice(-5);
    const older = historicalRuns.slice(-10, -5);
    const recentAvg = recent.length > 0
      ? recent.reduce((sum, r) => sum + (r.score / 100), 0) / recent.length
      : 0.5;
    const olderAvg = older.length > 0
      ? older.reduce((sum, r) => sum + (r.score / 100), 0) / older.length
      : recentAvg;
    const recentTrend = Math.min(1, Math.max(0, 0.5 + (recentAvg - olderAvg)));

    const overall = (
      similarGoalSuccessRate * 0.4 +
      workflowSuccessRate * 0.35 +
      recentTrend * 0.25
    );

    return {
      similarGoalSuccessRate: Math.round(similarGoalSuccessRate * 100) / 100,
      workflowSuccessRate: Math.round(workflowSuccessRate * 100) / 100,
      recentTrend: Math.round(recentTrend * 100) / 100,
      dataPoints: historicalRuns.length,
      overall: Math.round(overall * 100) / 100,
    };
  }

  private extractKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    return Array.from(new Set([
      ...words.filter(w => ACTION_VERBS.includes(w)),
      ...words.filter(w => SPECIFIC_TECHNOLOGIES.includes(w)),
    ]));
  }

  // ---------------------------------------------------------------------------
  // Complexity Assessment
  // ---------------------------------------------------------------------------

  private assessComplexity(plan?: {
    tasks: Array<{ priority: string; estimatedDuration: number }>;
    workflow?: { id: string; name: string };
    estimatedTotalDuration?: number;
  }): ComplexityScore {
    if (!plan || !plan.tasks) {
      return {
        taskCount: 0,
        estimatedDuration: 0,
        priorityMix: 0.5,
        dependencyDepth: 0.3,
        riskLevel: 0.5,
        overall: 0.7, // Moderate confidence without plan
      };
    }

    const taskCount = plan.tasks.length;
    const estimatedDuration = plan.estimatedTotalDuration || 
      plan.tasks.reduce((sum, t) => sum + (t.estimatedDuration || 10), 0);

    // Priority mix (good plans have varied priorities)
    const priorities = plan.tasks.map(t => t.priority?.toLowerCase() || 'medium');
    const uniquePriorities = new Set(priorities).size;
    const priorityMix = Math.min(1, uniquePriorities / 3);

    // Dependency depth (estimated based on task count)
    const dependencyDepth = Math.min(1, taskCount / 10);

    // Risk level (higher for more tasks and longer duration)
    let riskLevel = 0.3;
    if (taskCount > 5) riskLevel += 0.2;
    if (taskCount > 8) riskLevel += 0.2;
    if (estimatedDuration > 60) riskLevel += 0.15;
    if (estimatedDuration > 120) riskLevel += 0.15;
    riskLevel = Math.min(1, riskLevel);

    // Overall: inverse relationship - higher complexity = lower confidence
    const complexityFactor = (
      (taskCount / 10) * 0.3 +
      (Math.min(estimatedDuration, 180) / 180) * 0.3 +
      dependencyDepth * 0.2 +
      riskLevel * 0.2
    );
    const overall = Math.max(0.3, 1 - complexityFactor * 0.5);

    return {
      taskCount,
      estimatedDuration,
      priorityMix: Math.round(priorityMix * 100) / 100,
      dependencyDepth: Math.round(dependencyDepth * 100) / 100,
      riskLevel: Math.round(riskLevel * 100) / 100,
      overall: Math.round(overall * 100) / 100,
    };
  }

  // ---------------------------------------------------------------------------
  // Overall Confidence Calculation
  // ---------------------------------------------------------------------------

  private calculateOverallConfidence(
    clarity: GoalClarityScore,
    historical: HistoricalScore,
    complexity: ComplexityScore
  ): number {
    const weighted = (
      clarity.overall * this.config.clarityWeight +
      historical.overall * this.config.historicalWeight +
      complexity.overall * this.config.complexityWeight
    );

    return Math.round(weighted * 100) / 100;
  }

  private determineConfidenceLevel(confidence: number): ConfidenceAssessment['confidenceLevel'] {
    if (confidence >= 0.85) return 'very-high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.35) return 'low';
    return 'very-low';
  }

  // ---------------------------------------------------------------------------
  // Factor Identification
  // ---------------------------------------------------------------------------

  private identifyFactors(
    clarity: GoalClarityScore,
    historical: HistoricalScore,
    complexity: ComplexityScore
  ): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = [];

    // Clarity factors
    if (clarity.specificity >= 0.7) {
      factors.push({
        name: 'High Goal Specificity',
        value: clarity.specificity,
        weight: 0.15,
        impact: 'positive',
        description: 'Goal contains specific technologies and details',
      });
    } else if (clarity.specificity < 0.4) {
      factors.push({
        name: 'Low Goal Specificity',
        value: clarity.specificity,
        weight: 0.15,
        impact: 'negative',
        description: 'Goal lacks specific details and technologies',
      });
    }

    if (clarity.actionability >= 0.7) {
      factors.push({
        name: 'Clear Action Items',
        value: clarity.actionability,
        weight: 0.15,
        impact: 'positive',
        description: 'Goal contains clear, actionable instructions',
      });
    } else if (clarity.actionability < 0.4) {
      factors.push({
        name: 'Ambiguous Instructions',
        value: clarity.actionability,
        weight: 0.15,
        impact: 'negative',
        description: 'Goal lacks clear action items',
      });
    }

    // Historical factors
    if (historical.dataPoints > 5 && historical.similarGoalSuccessRate >= 0.8) {
      factors.push({
        name: 'Strong Historical Success',
        value: historical.similarGoalSuccessRate,
        weight: 0.2,
        impact: 'positive',
        description: 'Similar goals have high success rate',
      });
    } else if (historical.dataPoints > 3 && historical.similarGoalSuccessRate < 0.5) {
      factors.push({
        name: 'Low Historical Success',
        value: historical.similarGoalSuccessRate,
        weight: 0.2,
        impact: 'negative',
        description: 'Similar goals have struggled in the past',
      });
    }

    if (historical.recentTrend >= 0.7) {
      factors.push({
        name: 'Improving Trend',
        value: historical.recentTrend,
        weight: 0.1,
        impact: 'positive',
        description: 'Recent performance shows improvement',
      });
    } else if (historical.recentTrend < 0.4) {
      factors.push({
        name: 'Declining Trend',
        value: historical.recentTrend,
        weight: 0.1,
        impact: 'negative',
        description: 'Recent performance shows decline',
      });
    }

    // Complexity factors
    if (complexity.taskCount > 8) {
      factors.push({
        name: 'High Task Count',
        value: complexity.taskCount,
        weight: 0.15,
        impact: 'negative',
        description: 'Many tasks increase execution complexity',
      });
    }

    if (complexity.riskLevel >= 0.7) {
      factors.push({
        name: 'Elevated Risk Level',
        value: complexity.riskLevel,
        weight: 0.15,
        impact: 'negative',
        description: 'Plan has elevated risk factors',
      });
    } else if (complexity.riskLevel < 0.4) {
      factors.push({
        name: 'Low Risk Level',
        value: complexity.riskLevel,
        weight: 0.1,
        impact: 'positive',
        description: 'Plan has minimal risk factors',
      });
    }

    return factors;
  }

  // ---------------------------------------------------------------------------
  // Execution Recommendation
  // ---------------------------------------------------------------------------

  private generateExecutionRecommendation(
    confidence: number,
    level: ConfidenceAssessment['confidenceLevel'],
    factors: ConfidenceFactor[]
  ): ExecutionRecommendation {
    const negativeFactors = factors.filter(f => f.impact === 'negative');
    const proceedWithExecution = confidence >= this.config.minConfidenceThreshold;

    let cautionLevel: ExecutionRecommendation['cautionLevel'] = 'none';
    if (confidence < this.config.minConfidenceThreshold) cautionLevel = 'high';
    else if (confidence < this.config.cautionThreshold) cautionLevel = 'medium';
    else if (negativeFactors.length > 2) cautionLevel = 'low';

    let suggestedApproach = 'Standard execution with normal monitoring';
    if (level === 'very-high') {
      suggestedApproach = 'Full autonomous execution recommended';
    } else if (level === 'high') {
      suggestedApproach = 'Execute with standard oversight';
    } else if (level === 'medium') {
      suggestedApproach = 'Execute with enhanced monitoring and checkpoints';
    } else if (level === 'low') {
      suggestedApproach = 'Execute cautiously with manual validation steps';
    } else {
      suggestedApproach = 'Request clarification before proceeding';
    }

    const additionalValidation: string[] = [];
    const riskMitigation: string[] = [];

    for (const factor of negativeFactors) {
      if (factor.name.includes('Specificity') || factor.name.includes('Ambiguous')) {
        additionalValidation.push('Request additional context or clarification');
        riskMitigation.push('Break down into smaller, more specific goals');
      }
      if (factor.name.includes('Historical')) {
        additionalValidation.push('Review past failures for similar goals');
        riskMitigation.push('Apply learnings from previous attempts');
      }
      if (factor.name.includes('Task Count') || factor.name.includes('Risk')) {
        additionalValidation.push('Validate task dependencies');
        riskMitigation.push('Implement incremental execution with checkpoints');
      }
    }

    return {
      proceedWithExecution,
      cautionLevel,
      suggestedApproach,
      additionalValidation: Array.from(new Set(additionalValidation)),
      riskMitigation: Array.from(new Set(riskMitigation)),
    };
  }

  // ---------------------------------------------------------------------------
  // Assessment Access
  // ---------------------------------------------------------------------------

  getAssessment(id: string): ConfidenceAssessment | undefined {
    return this.assessments.get(id);
  }

  getAllAssessments(): ConfidenceAssessment[] {
    return Array.from(this.assessments.values());
  }

  getRecentAssessments(limit: number = 10): ConfidenceAssessment[] {
    return this.getAllAssessments()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAverageConfidence(): number {
    const assessments = this.getAllAssessments();
    if (assessments.length === 0) return 0;
    return assessments.reduce((sum, a) => sum + a.overallConfidence, 0) / assessments.length;
  }

  reset(): void {
    this.assessments.clear();
    this.historicalData.clear();
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let confidenceScorerInstance: ConfidenceScorer | null = null;

export function getConfidenceScorer(): ConfidenceScorer {
  if (!confidenceScorerInstance) {
    confidenceScorerInstance = new ConfidenceScorer();
  }
  return confidenceScorerInstance;
}

export function resetConfidenceScorer(): void {
  confidenceScorerInstance = null;
}
