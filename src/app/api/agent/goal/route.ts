/**
 * Multi-Agent Goal Processing API Route
 * 
 * POST /api/agent/goal
 * 
 * Accepts a user goal, processes it through the multi-agent system:
 * - PlannerAgent: Breaks down goal into tasks
 * - ExecutorAgent: Selects workflow and executes tasks
 * - ReflectionAgent: Analyzes results and generates insights
 * - OptimizerAgent: Suggests improvements based on history
 * 
 * Returns comprehensive results including:
 * - Task plan with reasoning
 * - Execution status and timeline
 * - Reflection with insights and score
 * - Optimization suggestions
 * - Failure analysis & recovery plans
 * - CodeRabbit AI review
 * - Agent narratives & decisions
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrchestrator,
  MultiAgentResult,
  OrchestratorConfig,
  getAgentMemory,
  RecoveryPlan,
  FailureAnalysis,
  CodeRabbitReview,
  CodeReviewInsight,
  SecurityConsideration,
  PerformanceRecommendation,
  NarrativeEntry,
  AgentDecision,
  AgentPhase,
  AgentLog,
} from '@/lib/agent';

// =============================================================================
// Request/Response Types
// =============================================================================

export interface GoalRequest {
  goal: string;
  context?: string;
  options?: {
    skipExecution?: boolean;
    skipReflection?: boolean;
    enableOptimization?: boolean;
    verboseLogging?: boolean;
  };
}

export interface TaskPlanResponse {
  planId: string;
  goalId: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    estimatedDuration: number;
    reasoning: string;
  }>;
  workflow: {
    id: string;
    name: string;
    reason: string;
    confidence: number;
  };
  reasoning: {
    steps: Array<{
      type: string;
      content: string;
      confidence: number;
    }>;
    summary: string;
    totalConfidence: number;
  };
  estimatedTotalDuration: number;
}

export interface ExecutionStatusResponse {
  planId: string;
  executionId: string;
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
  duration: number;
  errors: string[];
  taskTimeline: Array<{
    taskId: string;
    taskTitle: string;
    status: string;
    duration?: number;
  }>;
}

export interface ReflectionResponse {
  goalAchieved: boolean;
  goalAchievementReason: string;
  successRate: number;
  score: number;
  grade: string;
  summary: string;
  insights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  improvements: string[];
  lessonsLearned: string[];
  recommendations: string[];
}

export interface OptimizationResponse {
  optimizations: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
    priority: number;
  }>;
  patterns: Array<{
    type: string;
    description: string;
    frequency: number;
  }>;
  workflowRecommendations: Array<{
    workflow: string;
    score: number;
    reason: string;
  }>;
  estimatedImprovements: {
    successRate: number;
    efficiency: number;
    duration: number;
  };
}

export interface GoalResponse {
  success: boolean;
  goal: string;
  runId: string;
  timestamp: string;
  
  // Phases information
  phases: Array<{
    name: string;
    status: string;
    duration?: number;
  }>;
  
  // Task Plan
  taskPlan?: TaskPlanResponse;
  
  // Execution Status
  executionStatus?: ExecutionStatusResponse;
  
  // Reflection
  reflection?: ReflectionResponse;
  
  // Optimization (if enabled)
  optimization?: OptimizationResponse;
  
  // NEW: Failure Analysis
  failureAnalysis?: {
    totalFailures: number;
    failuresByType: Record<string, number>;
    rootCauses: string[];
    recommendations: string[];
  };
  
  // NEW: Recovery Plans
  recoveryPlans?: Array<{
    id: string;
    strategy: string;
    estimatedTime: number;
    confidence: number;
    steps: Array<{
      order: number;
      action: string;
      description: string;
      automated: boolean;
    }>;
    alternativeTasks: string[];
  }>;
  
  // NEW: CodeRabbit Review
  codeReview?: {
    overallScore: number;
    grade: string;
    summary: string;
    insights: Array<{
      category: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    }>;
    securityConsiderations: Array<{
      type: string;
      risk: string;
      title: string;
      mitigation: string;
    }>;
    performanceRecommendations: Array<{
      type: string;
      impact: string;
      title: string;
      expectedImprovement: string;
    }>;
    agentNarrative: string;
  };
  
  // NEW: Agent Narratives
  narratives?: Array<{
    context: string;
    tone: string;
    message: string;
    confidence: number;
  }>;
  
  // NEW: Agent Decisions
  agentDecisions?: Array<{
    phase: string;
    decision: string;
    reasoning: string;
    selectedBecause: string;
    confidence: number;
  }>;
  
  // Summary
  summary: string;
  totalDuration: number;
  
  // Detailed logs (if verbose)
  logs?: Array<{
    timestamp: string;
    level: string;
    agent: string;
    message: string;
  }>;
  
  // Error info
  error?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function transformPlan(result: MultiAgentResult): TaskPlanResponse | undefined {
  if (!result.plan) return undefined;

  const execution = result.execution;
  
  return {
    planId: result.plan.planId,
    goalId: result.plan.goalId,
    tasks: result.plan.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      reasoning: task.reasoning,
    })),
    workflow: execution ? {
      id: execution.workflowSelection.workflow.id,
      name: execution.workflowSelection.workflow.name,
      reason: execution.workflowSelection.reason,
      confidence: execution.workflowSelection.confidence,
    } : {
      id: 'pending',
      name: 'Pending Selection',
      reason: 'Workflow not yet selected',
      confidence: 0,
    },
    reasoning: {
      steps: result.plan.reasoning.steps.map(step => ({
        type: step.type,
        content: step.content,
        confidence: step.confidence,
      })),
      summary: result.plan.reasoning.summary,
      totalConfidence: result.plan.reasoning.totalConfidence,
    },
    estimatedTotalDuration: result.plan.totalEstimatedDuration,
  };
}

function transformExecution(result: MultiAgentResult): ExecutionStatusResponse | undefined {
  if (!result.execution || !result.plan) return undefined;

  return {
    planId: result.plan.planId,
    executionId: result.execution.executionId,
    success: result.execution.success,
    completedTasks: result.execution.completedTasks,
    failedTasks: result.execution.failedTasks,
    totalTasks: result.execution.taskExecutions.length,
    duration: result.execution.totalDuration,
    errors: result.execution.errors,
    taskTimeline: result.execution.taskExecutions.map(exec => ({
      taskId: exec.taskId,
      taskTitle: exec.taskTitle,
      status: exec.status,
      duration: exec.duration,
    })),
  };
}

function transformReflection(result: MultiAgentResult): ReflectionResponse | undefined {
  if (!result.reflection) return undefined;

  return {
    goalAchieved: result.reflection.goalAchieved,
    goalAchievementReason: result.reflection.goalAchievementReason,
    successRate: result.reflection.metrics.successRate,
    score: result.reflection.score,
    grade: result.reflection.grade,
    summary: result.reflection.summary,
    insights: result.reflection.insights.map(insight => ({
      type: insight.type,
      title: insight.title,
      description: insight.description,
    })),
    improvements: result.reflection.improvements,
    lessonsLearned: result.reflection.lessonsLearned,
    recommendations: result.reflection.recommendations,
  };
}

function transformOptimization(result: MultiAgentResult): OptimizationResponse | undefined {
  if (!result.optimization) return undefined;

  return {
    optimizations: result.optimization.optimizations.map(opt => ({
      type: opt.type,
      title: opt.title,
      description: opt.description,
      impact: opt.impact,
      effort: opt.effort,
      priority: opt.priority,
    })),
    patterns: result.optimization.patterns.map(p => ({
      type: p.type,
      description: p.description,
      frequency: p.frequency,
    })),
    workflowRecommendations: result.optimization.workflowRecommendations,
    estimatedImprovements: result.optimization.estimatedImprovements,
  };
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<GoalResponse>> {
  const startTime = Date.now();

  try {
    const body: GoalRequest = await request.json();
    const { goal, context, options = {} } = body;

    // Validate request
    if (!goal || typeof goal !== 'string') {
      return NextResponse.json(
        {
          success: false,
          goal: '',
          runId: '',
          timestamp: new Date().toISOString(),
          phases: [],
          summary: 'Invalid request: goal is required',
          totalDuration: Date.now() - startTime,
          error: 'Goal is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (goal.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          goal,
          runId: '',
          timestamp: new Date().toISOString(),
          phases: [],
          summary: 'Invalid request: goal too short',
          totalDuration: Date.now() - startTime,
          error: 'Goal must be at least 10 characters',
        },
        { status: 400 }
      );
    }

    // Configure orchestrator
    const config: Partial<OrchestratorConfig> = {
      skipExecution: options.skipExecution ?? false,
      skipReflection: options.skipReflection ?? false,
      enableOptimization: options.enableOptimization ?? true,
      verboseLogging: options.verboseLogging ?? false,
    };

    // Create and run orchestrator
    const orchestrator = createOrchestrator(config);
    const result = await orchestrator.run(goal, context);

    // Build response
    const response: GoalResponse = {
      success: result.success,
      goal: result.goal,
      runId: result.runId,
      timestamp: result.startedAt.toISOString(),
      phases: result.phases.map((phase: AgentPhase) => ({
        name: phase.name,
        status: phase.status,
        duration: phase.duration,
      })),
      taskPlan: transformPlan(result),
      executionStatus: transformExecution(result),
      reflection: transformReflection(result),
      optimization: transformOptimization(result),
      summary: result.summary,
      totalDuration: result.totalDuration,
      error: result.error,
    };

    // Add failure analysis if present
    if (result.failureAnalysis) {
      response.failureAnalysis = {
        totalFailures: result.failureAnalysis.totalFailures,
        failuresByType: result.failureAnalysis.failuresByType,
        rootCauses: result.failureAnalysis.rootCauses,
        recommendations: result.failureAnalysis.recommendations,
      };
    }
    
    // Add recovery plans if present
    if (result.recoveryPlans && result.recoveryPlans.length > 0) {
      response.recoveryPlans = result.recoveryPlans.map((plan: RecoveryPlan) => ({
        id: plan.id,
        strategy: plan.strategy,
        estimatedTime: plan.estimatedTime,
        confidence: plan.confidence,
        steps: plan.steps.map(step => ({
          order: step.order,
          action: step.action,
          description: step.description,
          automated: step.automated,
        })),
        alternativeTasks: plan.alternativeTasks,
      }));
    }
    
    // Add CodeRabbit review if present
    if (result.codeReview) {
      response.codeReview = {
        overallScore: result.codeReview.overallScore,
        grade: result.codeReview.grade,
        summary: result.codeReview.summary,
        insights: result.codeReview.insights.map((i: CodeReviewInsight) => ({
          category: i.category,
          severity: i.severity,
          title: i.title,
          description: i.description,
          recommendation: i.recommendation,
        })),
        securityConsiderations: result.codeReview.securityConsiderations.map((s: SecurityConsideration) => ({
          type: s.type,
          risk: s.risk,
          title: s.title,
          mitigation: s.mitigation,
        })),
        performanceRecommendations: result.codeReview.performanceRecommendations.map((p: PerformanceRecommendation) => ({
          type: p.type,
          impact: p.impact,
          title: p.title,
          expectedImprovement: p.expectedImprovement,
        })),
        agentNarrative: result.codeReview.agentNarrative,
      };
    }
    
    // Add agent narratives
    if (result.narratives && result.narratives.length > 0) {
      response.narratives = result.narratives.map((n: NarrativeEntry) => ({
        context: n.context,
        tone: n.tone,
        message: n.message,
        confidence: n.confidence,
      }));
    }
    
    // Add agent decisions
    if (result.agentDecisions && result.agentDecisions.length > 0) {
      response.agentDecisions = result.agentDecisions.map((d: AgentDecision) => ({
        phase: d.phase,
        decision: d.decision,
        reasoning: d.reasoning,
        selectedBecause: d.selectedBecause,
        confidence: d.confidence,
      }));
    }

    // Add verbose logs if requested
    if (options.verboseLogging) {
      response.logs = result.combinedLogs.map((log: AgentLog) => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        agent: log.agent,
        message: log.message,
      }));
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Goal processing error:', error);
    
    return NextResponse.json(
      {
        success: false,
        goal: '',
        runId: '',
        timestamp: new Date().toISOString(),
        phases: [],
        summary: 'Internal server error',
        totalDuration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET Handler - API Documentation & Memory Stats
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const memory = getAgentMemory();
  const stats = memory.getStats();
  const recentRuns = memory.getLastRuns(5);

  return NextResponse.json({
    name: 'AutoOps AI Multi-Agent Goal API',
    version: '2.0.0',
    description: 'Process goals through a coordinated multi-agent system',
    
    agents: {
      planner: 'Breaks down goals into structured tasks',
      executor: 'Selects workflows and executes tasks',
      reflection: 'Analyzes results and generates insights',
      optimizer: 'Suggests improvements based on history',
      orchestrator: 'Coordinates all agents',
    },
    
    endpoints: {
      'POST /api/agent/goal': {
        description: 'Process a goal through the multi-agent system',
        body: {
          goal: 'string (required) - The goal to achieve',
          context: 'string (optional) - Additional context',
          options: {
            skipExecution: 'boolean - Only plan, do not execute',
            skipReflection: 'boolean - Skip reflection phase',
            enableOptimization: 'boolean - Enable optimizer agent (default: true)',
            verboseLogging: 'boolean - Include detailed agent logs',
          },
        },
        response: {
          success: 'boolean',
          runId: 'string',
          phases: 'Array of phase results',
          taskPlan: 'Task plan with reasoning',
          executionStatus: 'Execution results',
          reflection: 'Analysis and insights',
          optimization: 'Improvement suggestions',
        },
      },
    },
    
    memoryStats: {
      totalRuns: stats.totalRuns,
      successfulRuns: stats.successfulRuns,
      failedRuns: stats.failedRuns,
      averageScore: stats.averageScore,
      topInsights: stats.topInsights.slice(0, 3),
      topImprovements: stats.topImprovements.slice(0, 3),
    },
    
    recentRuns: recentRuns.map(run => ({
      id: run.id,
      goal: run.goal.slice(0, 50) + (run.goal.length > 50 ? '...' : ''),
      success: run.result.success,
      score: run.reflection.score,
      timestamp: run.timestamp,
    })),
    
    example: {
      request: {
        goal: 'Create a data pipeline for processing user analytics',
        context: 'Using existing database infrastructure',
        options: {
          enableOptimization: true,
          verboseLogging: false,
        },
      },
    },
  });
}
