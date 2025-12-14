/**
 * AutoOps AI Agent - Main Module Exports
 * 
 * This module exports the multi-agent system with specialized agents:
 * - PlannerAgent: Goal decomposition and task planning
 * - ExecutorAgent: Workflow selection and task execution
 * - ReflectionAgent: Performance analysis and insights
 * - OptimizerAgent: Continuous improvement suggestions
 * - OrchestratorAgent: Coordinates all agents
 * 
 * Also includes memory system and legacy support.
 */

// ============================================================================
// Multi-Agent System (Primary Exports)
// ============================================================================

export {
  // Base Agent
  BaseAgent,
  type AgentRole,
  type AgentMessage,
  type AgentLog,
  type ReasoningStep,
  type AgentContext,
  
  // Specialized Agents
  PlannerAgent,
  type PlannedTask,
  type TaskType,
  type TaskPriority,
  type TaskPlan,
  
  ExecutorAgent,
  type Workflow,
  type WorkflowSelection,
  type TaskExecution,
  type ExecutionResult,
  
  ReflectionAgent,
  type PerformanceMetrics,
  type Insight,
  type ReflectionResult,
  
  OptimizerAgent,
  type Optimization,
  type Pattern,
  type OptimizationResult,
  
  // Orchestrator
  OrchestratorAgent,
  createOrchestrator,
  type OrchestratorConfig,
  type AgentPhase,
  type MultiAgentResult,
} from './agents';

// ============================================================================
// Memory System
// ============================================================================

export {
  AgentMemory,
  getAgentMemory,
  resetAgentMemory,
  type AgentRun,
  type StoredPlan,
  type StoredResult,
  type StoredReflection,
  type MemoryStats,
  type MemoryQuery,
} from './memory';

// ============================================================================
// Evolution System (Self-Improvement)
// ============================================================================

export {
  EvolutionEngine,
  getEvolutionEngine,
  resetEvolutionEngine,
  type ExecutionAnalysis,
  type Inefficiency,
  type OptimizationSuggestion,
  type EvolutionStrategy,
  type StrategyRule,
  type StrategyMetrics,
  type EvolutionReport,
} from './evolution';

// ============================================================================
// Reasoning Trace System
// ============================================================================

export {
  ReasoningTracer,
  getReasoningTracer,
  resetReasoningTracer,
  type ReasoningDecision,
  type DecisionType,
  type Assumption,
  type Alternative,
  type DecisionFactor,
  type AgentAction,
  type ReasoningTrace,
  type TimelineEvent,
  type TraceSummary,
} from './reasoning';

// ============================================================================
// Failure Handling System
// ============================================================================

export {
  FailureHandler,
  getFailureHandler,
  resetFailureHandler,
  type FailureRecord,
  type FailureType,
  type RecoveryPlan,
  type RecoveryStrategy,
  type RecoveryStep,
  type FailureAnalysis,
} from './failure';

// ============================================================================
// CodeRabbit Integration (AI Code Review)
// ============================================================================

export {
  CodeRabbit,
  getCodeRabbit,
  resetCodeRabbit,
  type CodeReviewInsight,
  type SecurityConsideration,
  type PerformanceRecommendation,
  type CodeQualitySuggestion,
  type CodeRabbitReview,
} from './integrations';

// ============================================================================
// AI Agent Persona
// ============================================================================

export {
  AgentPersona,
  getAgentPersona,
  resetAgentPersona,
  type PersonaTone,
  type NarrativeContext,
  type NarrativeEntry,
  type AgentDecision,
  type PersonaConfiguration,
} from './persona';

// ============================================================================
// Agent Evaluation System
// ============================================================================

export {
  AgentEvaluator,
  getAgentEvaluator,
  resetAgentEvaluator,
  TestScenarioRunner,
  getTestScenarioRunner,
  resetTestScenarioRunner,
  PREDEFINED_SCENARIOS,
  type PlanningScore,
  type ExecutionScore,
  type OptimizationScore,
  type AgentScorecard,
  type EvaluationConfig,
  type AgentRunData,
  type ScenarioComplexity,
  type ScenarioCategory,
  type TestScenario,
  type ScenarioResult,
  type ScenarioRunReport,
} from './evaluation';

// ============================================================================
// Timeline Playback System
// ============================================================================

export {
  TimelinePlayback,
  createTimelinePlayback,
  formatEventTime,
  getAgentColor,
  getEventIcon,
  type TimelineEventType,
  type TimelineAgentRole,
  type PlaybackEvent,
  type TimelineState,
  type PlaybackOptions,
  type TimelineFilter,
  type TimelineSummary,
} from './timeline';

// ============================================================================
// Confidence Scoring System
// ============================================================================

export {
  ConfidenceScorer,
  getConfidenceScorer,
  resetConfidenceScorer,
  type GoalClarityScore,
  type HistoricalScore,
  type ComplexityScore,
  type ConfidenceAssessment,
  type ConfidenceFactor,
  type ExecutionRecommendation,
  type ConfidenceConfig,
} from './confidence';

// ============================================================================
// Safety Validation System
// ============================================================================

export {
  SafetyValidator,
  getSafetyValidator,
  resetSafetyValidator,
  type SafetyLevel,
  type ValidationCategory,
  type SafetyViolation,
  type ClarificationRequest,
  type SafetyValidationResult,
  type SafetyDecisionLog,
  type SafetyConfig,
} from './safety';

// ============================================================================
// Plan Comparison System
// ============================================================================

export {
  PlanComparator,
  getPlanComparator,
  resetPlanComparator,
  type TaskSnapshot,
  type PlanSnapshot,
  type TaskChange,
  type Improvement,
  type PlanComparison,
  type ComparisonMetrics,
} from './comparison';

// ============================================================================
// Failure Injection Testing
// ============================================================================

export {
  FailureInjector,
  getFailureInjector,
  resetFailureInjector,
  FAILURE_SCENARIOS,
  type InjectedFailureType,
  type InjectionTiming,
  type FailureInjectionConfig,
  type InjectedFailure,
  type RecoveryAttempt,
  type InjectionOutcome,
  type InjectionStatistics,
} from './testing';

// ============================================================================
// Modular Skill System
// ============================================================================

export {
  SkillSystem,
  getSkillSystem,
  resetSkillSystem,
  BUILTIN_SKILLS,
  SKILL_PROFILES,
  type SkillCategory,
  type SkillTrigger,
  type SkillEffect,
  type Skill,
  type SkillExecutionResult,
  type SkillProfile,
} from './skills';

// ============================================================================
// Legacy AutoOpsAgent (Backward Compatibility)
// ============================================================================

export { 
  AutoOpsAgent,
  createAutoOpsAgent,
  type AgentGoal,
  type ReasoningStep as LegacyReasoningStep,
  type StructuredTask,
  type ExecutionPlan,
  type WorkflowDecision,
  type ReasoningChain,
  type ExecutionResult as LegacyExecutionResult,
  type ReflectionSummary,
  type AgentLog as LegacyAgentLogType,
  type AgentConfig,
} from './AutoOpsAgent';

// Legacy imports for backward compatibility
import { Goal, AgentState, AgentConfig as LegacyAgentConfig, DEFAULT_AGENT_CONFIG, Task, AgentLog as LegacyAgentLog } from '../types';
import { createPlan, prioritizeTasks } from './planner';
import { executeAllTasks } from './executor';
import { reflect } from './reflector';
import { v4 as uuidv4 } from 'uuid';

export interface AgentCallbacks {
  onPhaseChange?: (phase: AgentState['phase']) => void;
  onTaskUpdate?: (task: Task) => void;
  onLog?: (log: LegacyAgentLog) => void;
  onStateUpdate?: (state: AgentState) => void;
}

/**
 * Legacy Agent class that orchestrates the entire workflow
 * @deprecated Use OrchestratorAgent from './agents' for multi-agent support
 *             or AutoOpsAgent from './AutoOpsAgent' for single-agent use
 */
export class LegacyAutoOpsAgent {
  private config: LegacyAgentConfig;
  private callbacks: AgentCallbacks;
  private state: AgentState | null = null;
  
  constructor(config: Partial<LegacyAgentConfig> = {}, callbacks: AgentCallbacks = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.callbacks = callbacks;
  }
  
  /**
   * Executes the full agent workflow for a given goal
   */
  async execute(goalDescription: string, context?: string): Promise<AgentState> {
    const startTime = Date.now();
    
    // Initialize state
    const goal: Goal = {
      id: uuidv4(),
      description: goalDescription,
      context,
      createdAt: new Date(),
    };
    
    this.state = {
      id: uuidv4(),
      goal,
      phase: 'idle',
      tasks: [],
      logs: [],
      startedAt: new Date(),
    };
    
    this.notifyStateUpdate();
    
    try {
      // Phase 1: Planning
      await this.runPlanningPhase(goal);
      
      // Phase 2: Execution
      await this.runExecutionPhase();
      
      // Phase 3: Reflection
      await this.runReflectionPhase(startTime);
      
      // Complete
      this.updatePhase('complete');
      this.state.completedAt = new Date();
      this.state.totalDuration = Math.floor((Date.now() - startTime) / 1000);
      
      this.addLog('info', 'Agent workflow completed successfully');
      
    } catch (error) {
      this.updatePhase('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.addLog('error', `Agent workflow failed: ${errorMsg}`);
    }
    
    this.notifyStateUpdate();
    return this.state;
  }
  
  /**
   * Planning phase - break down goal into tasks
   */
  private async runPlanningPhase(goal: Goal): Promise<void> {
    this.updatePhase('planning');
    this.addLog('info', 'Starting planning phase');
    
    const planResult = await createPlan(goal);
    
    // Prioritize and order tasks
    const prioritizedTasks = prioritizeTasks(planResult.tasks);
    
    this.state!.tasks = prioritizedTasks;
    planResult.logs.forEach(log => this.state!.logs.push(log));
    
    this.addLog('info', `Planning complete: ${prioritizedTasks.length} tasks created`);
    this.notifyStateUpdate();
  }
  
  /**
   * Execution phase - run all tasks
   */
  private async runExecutionPhase(): Promise<void> {
    this.updatePhase('executing');
    this.addLog('info', 'Starting execution phase');
    
    const executedTasks = await executeAllTasks(
      this.state!.tasks,
      this.config,
      {
        onTaskStart: (task) => {
          this.state!.currentTaskId = task.id;
          this.callbacks.onTaskUpdate?.(task);
          this.notifyStateUpdate();
        },
        onTaskComplete: (task) => {
          // Update task in state
          const index = this.state!.tasks.findIndex(t => t.id === task.id);
          if (index >= 0) {
            this.state!.tasks[index] = task;
          }
          this.callbacks.onTaskUpdate?.(task);
          this.addLog(
            task.status === 'completed' ? 'info' : 'warning',
            `Task "${task.title}" ${task.status}`
          );
          this.notifyStateUpdate();
        },
        onLog: (log) => {
          this.state!.logs.push(log);
          this.callbacks.onLog?.(log);
        },
      }
    );
    
    this.state!.tasks = executedTasks;
    this.state!.currentTaskId = undefined;
    
    const completed = executedTasks.filter(t => t.status === 'completed').length;
    this.addLog('info', `Execution complete: ${completed}/${executedTasks.length} tasks successful`);
  }
  
  /**
   * Reflection phase - analyze results and generate insights
   */
  private async runReflectionPhase(startTime: number): Promise<void> {
    if (!this.config.reflectionEnabled) {
      this.addLog('info', 'Reflection phase skipped (disabled in config)');
      return;
    }
    
    this.updatePhase('reflecting');
    this.addLog('info', 'Starting reflection phase');
    
    const totalDuration = Math.floor((Date.now() - startTime) / 1000);
    
    const reflectionResult = await reflect({
      tasks: this.state!.tasks,
      totalDuration,
      goalDescription: this.state!.goal.description,
    });
    
    this.state!.reflection = reflectionResult.reflection;
    reflectionResult.logs.forEach(log => this.state!.logs.push(log));
    
    this.addLog('info', `Reflection complete. Score: ${reflectionResult.reflection.overallScore}/100`);
    this.notifyStateUpdate();
  }
  
  /**
   * Updates the current phase
   */
  private updatePhase(phase: AgentState['phase']): void {
    if (this.state) {
      this.state.phase = phase;
      this.callbacks.onPhaseChange?.(phase);
    }
  }
  
  /**
   * Adds a log entry
   */
  private addLog(
    level: LegacyAgentLog['level'],
    message: string,
    details?: Record<string, unknown>
  ): void {
    const log: LegacyAgentLog = {
      id: uuidv4(),
      timestamp: new Date(),
      phase: this.state?.phase || 'idle',
      message,
      details,
      level,
    };
    
    this.state?.logs.push(log);
    this.callbacks.onLog?.(log);
  }
  
  /**
   * Notifies state update callback
   */
  private notifyStateUpdate(): void {
    if (this.state) {
      this.callbacks.onStateUpdate?.({ ...this.state });
    }
  }
  
  /**
   * Gets current state
   */
  getState(): AgentState | null {
    return this.state ? { ...this.state } : null;
  }
}

/**
 * Factory function to create a legacy agent instance
 * @deprecated Use createAutoOpsAgent from './AutoOpsAgent' instead
 */
export function createLegacyAgent(
  config?: Partial<LegacyAgentConfig>,
  callbacks?: AgentCallbacks
): LegacyAutoOpsAgent {
  return new LegacyAutoOpsAgent(config, callbacks);
}

// Re-export the new agent as the default
export { createAutoOpsAgent as createAgent } from './AutoOpsAgent';
export { AutoOpsAgent as default } from './AutoOpsAgent';
