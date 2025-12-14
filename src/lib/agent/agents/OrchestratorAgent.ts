/**
 * OrchestratorAgent - Coordinates the multi-agent system
 * Manages the flow between PlannerAgent, ExecutorAgent, ReflectionAgent, and OptimizerAgent
 * Now with integrated failure handling, CodeRabbit insights, and professional AI persona
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentContext, AgentMessage, AgentLog, ReasoningStep } from './BaseAgent';
import { PlannerAgent, TaskPlan } from './PlannerAgent';
import { ExecutorAgent, ExecutionResult } from './ExecutorAgent';
import { ReflectionAgent, ReflectionResult } from './ReflectionAgent';
import { OptimizerAgent, OptimizationResult } from './OptimizerAgent';
import { AgentMemory, getAgentMemory, StoredPlan, StoredResult, StoredReflection } from '../memory/AgentMemory';
import { FailureHandler, getFailureHandler, FailureAnalysis, RecoveryPlan } from '../failure';
import { CodeRabbit, getCodeRabbit, CodeRabbitReview } from '../integrations';
import { AgentPersona, getAgentPersona, NarrativeEntry, AgentDecision } from '../persona';
import { SafetyValidator, getSafetyValidator, SafetyValidationResult } from '../safety';
import { IntentClassifier, getIntentClassifier, IntentClassification } from '../intent';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorConfig {
  enableOptimization: boolean;
  skipExecution: boolean;
  skipReflection: boolean;
  verboseLogging: boolean;
  maxRetries: number;
  timeout: number; // ms
}

export interface AgentPhase {
  name: 'planning' | 'executing' | 'reflecting' | 'optimizing' | 'complete' | 'error';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

export interface MultiAgentResult {
  runId: string;
  goal: string;
  success: boolean;
  phases: AgentPhase[];
  plan?: TaskPlan;
  execution?: ExecutionResult;
  reflection?: ReflectionResult;
  optimization?: OptimizationResult;
  combinedLogs: AgentLog[];
  combinedReasoning: Array<{ agent: string; steps: ReasoningStep[] }>;
  summary: string;
  startedAt: Date;
  completedAt: Date;
  totalDuration: number;
  error?: string;
  // New enhanced fields
  failureAnalysis?: FailureAnalysis;
  recoveryPlans?: RecoveryPlan[];
  codeReview?: CodeRabbitReview;
  narratives?: NarrativeEntry[];
  agentDecisions?: AgentDecision[];
  safetyValidation?: SafetyValidationResult;
  intentClassification?: IntentClassification;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  enableOptimization: true,
  skipExecution: false,
  skipReflection: false,
  verboseLogging: true,
  maxRetries: 2,
  timeout: 60000,
};

// ============================================================================
// OrchestratorAgent Class
// ============================================================================

export class OrchestratorAgent extends BaseAgent {
  private plannerAgent: PlannerAgent;
  private executorAgent: ExecutorAgent;
  private reflectionAgent: ReflectionAgent;
  private optimizerAgent: OptimizerAgent;
  private memory: AgentMemory;
  private config: OrchestratorConfig;
  private phases: AgentPhase[] = [];
  // New integrated systems
  private failureHandler: FailureHandler;
  private codeRabbit: CodeRabbit;
  private persona: AgentPersona;
  private safetyValidator: SafetyValidator;
  private intentClassifier: IntentClassifier;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super('orchestrator', 'OrchestratorAgent');
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memory = getAgentMemory();
    
    // Initialize specialized agents
    this.plannerAgent = new PlannerAgent();
    this.executorAgent = new ExecutorAgent(true); // Simulation mode
    this.reflectionAgent = new ReflectionAgent();
    this.optimizerAgent = new OptimizerAgent(this.memory);
    
    // Initialize enhanced systems
    this.failureHandler = getFailureHandler();
    this.codeRabbit = getCodeRabbit();
    this.persona = getAgentPersona();
    this.safetyValidator = getSafetyValidator();
    this.intentClassifier = getIntentClassifier();
  }

  // --------------------------------------------------------------------------
  // Main Orchestration
  // --------------------------------------------------------------------------

  async process(context: AgentContext): Promise<MultiAgentResult> {
    this.reset();
    this.phases = [];
    this.isActive = true;
    this.persona.clearHistory();

    const runId = uuidv4();
    const startedAt = new Date();
    
    // Professional persona narration
    this.persona.speak(
      this.persona.narratePlanningStart(),
      'planning',
      0.95
    );
    
    this.info('Starting multi-agent orchestration', { runId, goal: context.goal });

    let plan: TaskPlan | undefined;
    let execution: ExecutionResult | undefined;
    let reflection: ReflectionResult | undefined;
    let optimization: OptimizationResult | undefined;
    let failureAnalysis: FailureAnalysis | undefined;
    let recoveryPlans: RecoveryPlan[] = [];
    let codeReview: CodeRabbitReview | undefined;
    let safetyValidation: SafetyValidationResult | undefined;
    let intentClassification: IntentClassification | undefined;
    let error: string | undefined;
    let success = false;

    try {
      // Phase 0: Intent Classification
      this.observe('Classifying user intent', 0.98);
      intentClassification = this.intentClassifier.classify(context.goal);
      
      this.info('Intent classified', { 
        type: intentClassification.intentType,
        confidence: intentClassification.confidence 
      });

      // Handle INFORMATION_QUERY - return explanation without execution
      if (intentClassification.intentType === 'INFORMATION_QUERY') {
        this.observe('Detected information query - providing explanation', 0.95);
        
        const explanation = this.intentClassifier.generateExplanation(context.goal);
        
        this.persona.speak(
          explanation,
          'planning',
          0.9
        );
        
        const completedAt = new Date();
        return this.createResult(
          runId,
          context.goal,
          true,
          undefined,
          undefined,
          undefined,
          undefined,
          startedAt,
          completedAt,
          `Information query handled: ${explanation}`,
          undefined,
          undefined,
          undefined,
          undefined,
          intentClassification
        );
      }

      // Handle AMBIGUOUS - request clarification
      if (intentClassification.intentType === 'AMBIGUOUS') {
        this.warn('Input is ambiguous', { 
          reasoning: intentClassification.reasoning 
        });
        
        this.persona.speak(
          `Your request is unclear. ${intentClassification.suggestedAction}. Please provide more specific details about what you want to accomplish.`,
          'planning',
          0.7
        );
        
        const completedAt = new Date();
        return this.createResult(
          runId,
          context.goal,
          false,
          undefined,
          undefined,
          undefined,
          undefined,
          startedAt,
          completedAt,
          `Clarification needed: ${intentClassification.reasoning}`,
          undefined,
          undefined,
          undefined,
          undefined,
          intentClassification
        );
      }

      // Continue with EXECUTION_GOAL...
      this.info('Processing execution goal', { confidence: intentClassification.confidence });

      // Phase 1: Safety Validation
      this.observe('Validating goal safety', 0.95);
      safetyValidation = this.safetyValidator.validateGoal(context.goal, context.userContext);
      
      if (!safetyValidation.isApproved) {
        this.warn('Goal safety validation failed', { 
          reason: safetyValidation.summary,
          violations: safetyValidation.violations.length 
        });
        
        this.persona.speak(
          `I've identified some concerns with this goal that need clarification: ${safetyValidation.clarificationsNeeded?.[0]?.question || 'Please provide more specific details.'}`,
          'planning',
          0.8
        );
        
        // Return early with safety failure
        const completedAt = new Date();
        return this.createResult(
          runId,
          context.goal,
          false,
          undefined,
          undefined,
          undefined,
          undefined,
          startedAt,
          completedAt,
          `Safety validation failed: ${safetyValidation.summary}`,
          undefined,
          undefined,
          undefined,
          safetyValidation,
          intentClassification
        );
      }
      
      this.info('Goal safety validated', { approved: true });

      // Phase 2: Planning
      this.observe('Initiating planning phase', 0.95);
      plan = await this.runPlanningPhase(context);
      
      // Record persona decision
      this.persona.recordDecision(
        'planning',
        `Selected ${plan.tasks.length}-task plan`,
        'Analyzed goal complexity and available workflows',
        ['Simpler 3-task plan', 'Complex 8-task plan'],
        'Balanced complexity with goal requirements',
        0.88
      );
      
      // Phase 3: Execution (if not skipped)
      if (!this.config.skipExecution && plan) {
        this.persona.speak(
          this.persona.narrateExecutionStart(),
          'execution',
          0.92
        );
        this.observe('Initiating execution phase', 0.95);
        execution = await this.runExecutionPhase(context);
        
        // Handle failures with retry and recovery
        if (execution && execution.failedTasks > 0) {
          const { analysis, plans } = await this.handleExecutionFailures(execution, plan);
          failureAnalysis = analysis;
          recoveryPlans = plans;
        }
        
        this.persona.speak(
          this.persona.narrateExecutionComplete(
            execution.completedTasks,
            execution.taskExecutions.length,
            execution.success ? 1 : execution.completedTasks / execution.taskExecutions.length,
            execution.totalDuration,
            execution.success ? 'Success' : 'Completed with issues'
          ),
          'execution',
          0.9
        );
      }

      // Phase 3: Reflection (if not skipped)
      if (!this.config.skipReflection && execution) {
        this.persona.speak(
          this.persona.narrateReflectionStart(),
          'reflection',
          0.88
        );
        this.observe('Initiating reflection phase', 0.95);
        reflection = await this.runReflectionPhase(context);
        
        if (reflection && reflection.insights.length > 0) {
          this.persona.speak(
            this.persona.narrateReflectionInsight(reflection.insights[0].description),
            'reflection',
            0.85
          );
        }
        
        this.persona.speak(
          this.persona.narrateReflectionComplete(
            reflection.score,
            reflection.grade,
            reflection.insights.length
          ),
          'reflection',
          0.9
        );
      }

      // Phase 4: Optimization (if enabled)
      if (this.config.enableOptimization) {
        this.persona.speak(
          this.persona.narrateOptimizationStart(),
          'optimization',
          0.85
        );
        this.observe('Initiating optimization phase', 0.9);
        optimization = await this.runOptimizationPhase(context);
        
        if (optimization && optimization.optimizations.length > 0) {
          this.persona.speak(
            this.persona.narrateOptimizationComplete(
              optimization.optimizations.length,
              1
            ),
            'optimization',
            0.88
          );
        }
      }

      // Phase 5: CodeRabbit AI Review
      if (plan && execution) {
        codeReview = this.codeRabbit.generateReview(plan, execution, reflection);
        this.info('CodeRabbit review generated', { 
          score: codeReview.overallScore, 
          grade: codeReview.grade 
        });
      }

      // Save to memory
      if (plan && execution && reflection) {
        this.saveToMemory(context.goal, plan, execution, reflection);
      }

      success = execution ? execution.success : true;
      this.decide(`Orchestration ${success ? 'succeeded' : 'completed with issues'}`, 0.95);

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      this.error('Orchestration failed', { error });
      this.addErrorPhase(error);
      
      this.persona.speak(
        this.persona.narrateFailureDetected('orchestration'),
        'failure',
        0.7
      );
    } finally {
      this.isActive = false;
    }

    const completedAt = new Date();

    return this.createResult(
      runId,
      context.goal,
      success,
      plan,
      execution,
      reflection,
      optimization,
      startedAt,
      completedAt,
      error,
      failureAnalysis,
      recoveryPlans,
      codeReview,
      safetyValidation,
      intentClassification
    );
  }

  // --------------------------------------------------------------------------
  // Failure Handling
  // --------------------------------------------------------------------------

  private async handleExecutionFailures(
    execution: ExecutionResult,
    plan: TaskPlan
  ): Promise<{ analysis: FailureAnalysis; plans: RecoveryPlan[] }> {
    const failedExecutions = execution.taskExecutions.filter(t => t.status === 'failed');
    const plans: RecoveryPlan[] = [];

    // Record failures
    for (const failed of failedExecutions) {
      const task = plan.tasks.find(t => t.id === failed.taskId);
      
      this.persona.speak(
        this.persona.narrateFailureDetected(task?.title || failed.taskId),
        'failure',
        0.75
      );
      
      // Record the failure using the TaskExecution
      const failure = this.failureHandler.recordFailure(failed, plan);
      
      this.persona.speak(
        this.persona.narrateFailureAnalysis(
          failed.error || 'Unknown error',
          failure.errorType
        ),
        'failure',
        0.8
      );
      
      // Attempt retry
      const retryResult = await this.failureHandler.attemptRetry(
        failed,
        async () => {
          // Simulated retry - in real implementation would re-execute the task
          await new Promise(resolve => setTimeout(resolve, 100));
          const success = Math.random() > 0.5;
          return { success, output: success ? 'Retry succeeded' : undefined };
        }
      );
      
      if (!retryResult.success) {
        // Generate recovery plan
        const recoveryPlan = this.failureHandler.generateRecoveryPlan(failure);
        plans.push(recoveryPlan);
        
        this.info('Recovery plan generated', {
          failureId: failure.id,
          strategy: recoveryPlan.strategy,
          steps: recoveryPlan.steps.length,
        });
      }
    }

    // Generate overall analysis
    const analysis = this.failureHandler.analyzeFailures();
    
    if (plans.length > 0) {
      this.persona.speak(
        this.persona.narrateRecoveryStart(),
        'recovery',
        0.78
      );
    }

    return { analysis, plans };
  }

  validateInput(context: AgentContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!context.goal || context.goal.trim().length < 5) {
      errors.push('Goal must be at least 5 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --------------------------------------------------------------------------
  // Phase Execution
  // --------------------------------------------------------------------------

  private async runPlanningPhase(context: AgentContext): Promise<TaskPlan> {
    const phase = this.startPhase('planning');

    try {
      // Validate input
      const validation = this.plannerAgent.validateInput(context);
      if (!validation.valid) {
        throw new Error(`Planning validation failed: ${validation.errors.join(', ')}`);
      }

      // Run planner
      const plan = await this.plannerAgent.process(context);
      
      // Store in shared state for other agents
      context.sharedState.set('plan', plan);

      this.completePhase(phase, 'completed');
      this.act(`Planning complete: ${plan.tasks.length} tasks generated`, 0.9);

      return plan;
    } catch (err) {
      this.completePhase(phase, 'failed');
      throw err;
    }
  }

  private async runExecutionPhase(context: AgentContext): Promise<ExecutionResult> {
    const phase = this.startPhase('executing');

    try {
      // Validate input
      const validation = this.executorAgent.validateInput(context);
      if (!validation.valid) {
        throw new Error(`Execution validation failed: ${validation.errors.join(', ')}`);
      }

      // Run executor
      const result = await this.executorAgent.process(context);
      
      // Store in shared state
      context.sharedState.set('result', result);

      this.completePhase(phase, 'completed');
      this.act(`Execution complete: ${result.completedTasks}/${result.taskExecutions.length} tasks`, 0.9);

      return result;
    } catch (err) {
      this.completePhase(phase, 'failed');
      throw err;
    }
  }

  private async runReflectionPhase(context: AgentContext): Promise<ReflectionResult> {
    const phase = this.startPhase('reflecting');

    try {
      // Validate input
      const validation = this.reflectionAgent.validateInput(context);
      if (!validation.valid) {
        throw new Error(`Reflection validation failed: ${validation.errors.join(', ')}`);
      }

      // Run reflection
      const reflection = await this.reflectionAgent.process(context);
      
      // Store in shared state
      context.sharedState.set('reflection', reflection);

      this.completePhase(phase, 'completed');
      this.act(`Reflection complete: Score ${reflection.score}/100`, 0.9);

      return reflection;
    } catch (err) {
      this.completePhase(phase, 'failed');
      throw err;
    }
  }

  private async runOptimizationPhase(context: AgentContext): Promise<OptimizationResult> {
    const phase = this.startPhase('optimizing');

    try {
      // Optimizer has flexible validation
      const optimization = await this.optimizerAgent.process(context);

      this.completePhase(phase, 'completed');
      this.act(`Optimization complete: ${optimization.optimizations.length} suggestions`, 0.85);

      return optimization;
    } catch (err) {
      // Optimization is non-critical, don't fail the whole run
      this.warn('Optimization phase encountered an error', { error: err });
      this.completePhase(phase, 'failed');
      
      // Return empty optimization result
      return {
        optimizationId: uuidv4(),
        timestamp: new Date(),
        optimizations: [],
        patterns: [],
        workflowRecommendations: [],
        taskOptimizations: [],
        processSuggestions: [],
        estimatedImprovements: { successRate: 0, efficiency: 0, duration: 0 },
        reasoning: {
          steps: [],
          summary: 'Optimization skipped due to error',
          totalConfidence: 0,
        },
      };
    }
  }

  // --------------------------------------------------------------------------
  // Phase Management
  // --------------------------------------------------------------------------

  private startPhase(name: AgentPhase['name']): AgentPhase {
    const phase: AgentPhase = {
      name,
      startedAt: new Date(),
      status: 'running',
    };
    this.phases.push(phase);
    this.info(`Phase started: ${name}`);
    return phase;
  }

  private completePhase(phase: AgentPhase, status: 'completed' | 'failed' | 'skipped'): void {
    phase.status = status;
    phase.completedAt = new Date();
    phase.duration = phase.completedAt.getTime() - phase.startedAt.getTime();
    this.info(`Phase ${phase.name} ${status}`, { duration: phase.duration });
  }

  private addErrorPhase(error: string): void {
    this.phases.push({
      name: 'error',
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      status: 'failed',
    });
  }

  // --------------------------------------------------------------------------
  // Memory Management
  // --------------------------------------------------------------------------

  private saveToMemory(
    goal: string,
    plan: TaskPlan,
    execution: ExecutionResult,
    reflection: ReflectionResult
  ): void {
    const storedPlan: StoredPlan = {
      planId: plan.planId,
      tasks: plan.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        priority: t.priority,
        estimatedDuration: t.estimatedDuration,
      })),
      workflowId: execution.workflowSelection.workflow.id,
      workflowName: execution.workflowSelection.workflow.name,
      confidence: execution.workflowSelection.confidence,
      reasoning: plan.reasoning.summary,
    };

    const storedResult: StoredResult = {
      success: execution.success,
      completedTasks: execution.completedTasks,
      failedTasks: execution.failedTasks,
      totalTasks: execution.taskExecutions.length,
      duration: execution.totalDuration,
      errors: execution.errors,
      outputs: execution.outputs,
    };

    const storedReflection: StoredReflection = {
      goalAchieved: reflection.goalAchieved,
      successRate: reflection.metrics.successRate,
      score: reflection.score,
      summary: reflection.summary,
      insights: reflection.insights.map(i => i.description),
      improvements: reflection.improvements,
      lessonsLearned: reflection.lessonsLearned,
    };

    this.memory.saveRun(goal, storedPlan, storedResult, storedReflection);
    this.info('Run saved to memory');
  }

  // --------------------------------------------------------------------------
  // Result Creation
  // --------------------------------------------------------------------------

  private createResult(
    runId: string,
    goal: string,
    success: boolean,
    plan?: TaskPlan,
    execution?: ExecutionResult,
    reflection?: ReflectionResult,
    optimization?: OptimizationResult,
    startedAt?: Date,
    completedAt?: Date,
    error?: string,
    failureAnalysis?: FailureAnalysis,
    recoveryPlans?: RecoveryPlan[],
    codeReview?: CodeRabbitReview,
    safetyValidation?: SafetyValidationResult,
    intentClassification?: IntentClassification
  ): MultiAgentResult {
    const start = startedAt || new Date();
    const end = completedAt || new Date();

    // Combine logs from all agents
    const combinedLogs: AgentLog[] = [
      ...this.getLogs(),
      ...this.plannerAgent.getLogs(),
      ...this.executorAgent.getLogs(),
      ...this.reflectionAgent.getLogs(),
      ...this.optimizerAgent.getLogs(),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Combine reasoning from all agents
    const combinedReasoning = [
      { agent: 'orchestrator', steps: this.getReasoning() },
      { agent: 'planner', steps: this.plannerAgent.getReasoning() },
      { agent: 'executor', steps: this.executorAgent.getReasoning() },
      { agent: 'reflection', steps: this.reflectionAgent.getReasoning() },
      { agent: 'optimizer', steps: this.optimizerAgent.getReasoning() },
    ].filter(r => r.steps.length > 0);

    // Generate summary with persona
    const summary = this.generateSummary(goal, success, plan, execution, reflection, error);
    
    // Get narratives and decisions from persona
    const narratives = this.persona.getNarrativeHistory();
    const agentDecisions = this.persona.getDecisionHistory();

    return {
      runId,
      goal,
      success,
      phases: this.phases,
      plan,
      execution,
      reflection,
      optimization,
      combinedLogs,
      combinedReasoning,
      summary,
      startedAt: start,
      completedAt: end,
      totalDuration: end.getTime() - start.getTime(),
      error,
      failureAnalysis,
      recoveryPlans,
      codeReview,
      narratives,
      agentDecisions,
      safetyValidation,
      intentClassification,
    };
  }

  private generateSummary(
    goal: string,
    success: boolean,
    plan?: TaskPlan,
    execution?: ExecutionResult,
    reflection?: ReflectionResult,
    error?: string
  ): string {
    if (error) {
      return `Orchestration failed: ${error}`;
    }

    const parts: string[] = [];
    
    parts.push(`Goal: "${goal.slice(0, 50)}${goal.length > 50 ? '...' : ''}"`);
    
    if (plan) {
      parts.push(`Planned ${plan.tasks.length} tasks (${plan.complexity} complexity)`);
    }
    
    if (execution) {
      parts.push(`Executed ${execution.completedTasks}/${execution.taskExecutions.length} tasks`);
    }
    
    if (reflection) {
      parts.push(`Score: ${reflection.score}/100 (${reflection.grade})`);
    }

    parts.push(success ? 'Status: Success' : 'Status: Completed with issues');

    return parts.join(' | ');
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Run the complete multi-agent pipeline
   */
  async run(goal: string, userContext?: string): Promise<MultiAgentResult> {
    const context: AgentContext = {
      goal,
      userContext,
      sharedState: new Map(),
      messages: [],
    };

    return this.process(context);
  }

  /**
   * Run only the planning phase
   */
  async planOnly(goal: string, userContext?: string): Promise<TaskPlan> {
    const context: AgentContext = {
      goal,
      userContext,
      sharedState: new Map(),
      messages: [],
    };

    return this.plannerAgent.process(context);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return this.memory.getStats();
  }

  /**
   * Get recent runs from memory
   */
  getRecentRuns(limit: number = 10) {
    return this.memory.getLastRuns(limit);
  }

  /**
   * Get recommendations for a goal
   */
  getRecommendations(goal: string) {
    return this.memory.getRecommendations(goal);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses() {
    return {
      orchestrator: this.getInfo(),
      planner: this.plannerAgent.getInfo(),
      executor: this.executorAgent.getInfo(),
      reflection: this.reflectionAgent.getInfo(),
      optimizer: this.optimizerAgent.getInfo(),
    };
  }

  /**
   * Reset all agents
   */
  resetAll(): void {
    this.reset();
    this.plannerAgent.reset();
    this.executorAgent.reset();
    this.reflectionAgent.reset();
    this.optimizerAgent.reset();
    this.phases = [];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createOrchestrator(config?: Partial<OrchestratorConfig>): OrchestratorAgent {
  return new OrchestratorAgent(config);
}
