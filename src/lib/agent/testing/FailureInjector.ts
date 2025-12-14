/**
 * FailureInjector - Failure Injection Mode for Testing
 * 
 * Features:
 * - Force workflow failure on demand
 * - Test recovery logic
 * - Log all outcomes
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type FailureType = 
  | 'task_timeout'
  | 'task_error'
  | 'workflow_abort'
  | 'resource_unavailable'
  | 'permission_denied'
  | 'network_failure'
  | 'validation_failure'
  | 'dependency_failure'
  | 'random';

export type InjectionTiming = 
  | 'immediate'
  | 'delayed'
  | 'random'
  | 'on_task'
  | 'on_phase';

export interface FailureInjectionConfig {
  enabled: boolean;
  failureType: FailureType;
  timing: InjectionTiming;
  targetTaskId?: string;
  targetPhase?: 'planning' | 'executing' | 'reflecting' | 'optimizing';
  probability: number;       // 0-1, chance of injection
  delayMs?: number;          // Delay before injection
  customMessage?: string;
  recoverable: boolean;      // Whether the failure should be recoverable
}

export interface InjectedFailure {
  id: string;
  timestamp: Date;
  config: FailureInjectionConfig;
  triggeredAt: string;       // Phase or task where failure occurred
  errorMessage: string;
  stackTrace?: string;
}

export interface RecoveryAttempt {
  id: string;
  timestamp: Date;
  failureId: string;
  strategy: string;
  steps: string[];
  success: boolean;
  duration: number;
  outcome: string;
}

export interface InjectionOutcome {
  id: string;
  runId: string;
  timestamp: Date;
  failure: InjectedFailure;
  recoveryAttempts: RecoveryAttempt[];
  finalOutcome: 'recovered' | 'failed' | 'partial';
  totalRecoveryTime: number;
  lessonsLearned: string[];
}

export interface InjectionStatistics {
  totalInjections: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  recoveryRate: number;
  byFailureType: Record<FailureType, number>;
  mostReliableRecovery: string;
}

// =============================================================================
// Predefined Failure Scenarios
// =============================================================================

export const FAILURE_SCENARIOS: Record<string, FailureInjectionConfig> = {
  'task-timeout': {
    enabled: true,
    failureType: 'task_timeout',
    timing: 'on_task',
    probability: 1,
    recoverable: true,
    customMessage: 'Task execution timed out after maximum wait time',
  },
  'network-failure': {
    enabled: true,
    failureType: 'network_failure',
    timing: 'random',
    probability: 0.5,
    recoverable: true,
    customMessage: 'Network connection lost during operation',
  },
  'permission-denied': {
    enabled: true,
    failureType: 'permission_denied',
    timing: 'on_task',
    probability: 1,
    recoverable: false,
    customMessage: 'Insufficient permissions to perform operation',
  },
  'resource-exhaustion': {
    enabled: true,
    failureType: 'resource_unavailable',
    timing: 'delayed',
    probability: 1,
    delayMs: 2000,
    recoverable: true,
    customMessage: 'Resource limits exceeded',
  },
  'cascade-failure': {
    enabled: true,
    failureType: 'dependency_failure',
    timing: 'on_phase',
    targetPhase: 'executing',
    probability: 1,
    recoverable: true,
    customMessage: 'Dependency service unavailable causing cascade failure',
  },
  'validation-error': {
    enabled: true,
    failureType: 'validation_failure',
    timing: 'immediate',
    probability: 1,
    recoverable: true,
    customMessage: 'Input validation failed',
  },
  'random-chaos': {
    enabled: true,
    failureType: 'random',
    timing: 'random',
    probability: 0.3,
    recoverable: true,
    customMessage: 'Random failure injected for chaos testing',
  },
};

// =============================================================================
// FailureInjector Class
// =============================================================================

export class FailureInjector {
  private config: FailureInjectionConfig | null = null;
  private injectedFailures: InjectedFailure[] = [];
  private recoveryAttempts: RecoveryAttempt[] = [];
  private outcomes: InjectionOutcome[] = [];
  private isActive: boolean = false;

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  enable(config: FailureInjectionConfig): void {
    this.config = config;
    this.isActive = true;
  }

  enableScenario(scenarioName: string): void {
    const scenario = FAILURE_SCENARIOS[scenarioName];
    if (scenario) {
      this.enable(scenario);
    } else {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
  }

  disable(): void {
    this.config = null;
    this.isActive = false;
  }

  isEnabled(): boolean {
    return this.isActive && this.config !== null;
  }

  getConfig(): FailureInjectionConfig | null {
    return this.config;
  }

  // ---------------------------------------------------------------------------
  // Failure Injection
  // ---------------------------------------------------------------------------

  /**
   * Check if a failure should be injected at this point
   */
  shouldInjectFailure(context: {
    phase?: string;
    taskId?: string;
    timestamp?: Date;
  }): boolean {
    if (!this.isActive || !this.config) return false;

    // Check timing constraints
    switch (this.config.timing) {
      case 'on_phase':
        if (context.phase !== this.config.targetPhase) return false;
        break;
      case 'on_task':
        if (this.config.targetTaskId && context.taskId !== this.config.targetTaskId) return false;
        break;
      case 'immediate':
        // Always inject on first check
        break;
      case 'delayed':
        // Would need timing tracking - simplified here
        break;
      case 'random':
        // Will use probability
        break;
    }

    // Check probability
    return Math.random() < this.config.probability;
  }

  /**
   * Inject a failure and return the failure object
   */
  injectFailure(triggeredAt: string): InjectedFailure {
    if (!this.config) {
      throw new Error('No failure configuration set');
    }

    const failureType = this.config.failureType === 'random'
      ? this.getRandomFailureType()
      : this.config.failureType;

    const failure: InjectedFailure = {
      id: uuidv4(),
      timestamp: new Date(),
      config: { ...this.config },
      triggeredAt,
      errorMessage: this.config.customMessage || this.getDefaultMessage(failureType),
      stackTrace: this.generateMockStackTrace(failureType),
    };

    this.injectedFailures.push(failure);
    return failure;
  }

  private getRandomFailureType(): FailureType {
    const types: FailureType[] = [
      'task_timeout',
      'task_error',
      'resource_unavailable',
      'network_failure',
      'validation_failure',
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getDefaultMessage(type: FailureType): string {
    const messages: Record<FailureType, string> = {
      task_timeout: 'Task execution exceeded timeout limit',
      task_error: 'Task encountered an unexpected error',
      workflow_abort: 'Workflow was forcefully aborted',
      resource_unavailable: 'Required resource is not available',
      permission_denied: 'Operation not permitted',
      network_failure: 'Network connection failed',
      validation_failure: 'Input validation failed',
      dependency_failure: 'Required dependency is unavailable',
      random: 'Random failure for testing',
    };
    return messages[type];
  }

  private generateMockStackTrace(type: FailureType): string {
    return `Error: ${this.getDefaultMessage(type)}
    at ExecutorAgent.executeTask (ExecutorAgent.ts:245)
    at OrchestratorAgent.runExecutionPhase (OrchestratorAgent.ts:412)
    at OrchestratorAgent.process (OrchestratorAgent.ts:178)
    at processGoal (route.ts:89)`;
  }

  // ---------------------------------------------------------------------------
  // Recovery Simulation
  // ---------------------------------------------------------------------------

  /**
   * Simulate a recovery attempt
   */
  attemptRecovery(failureId: string): RecoveryAttempt {
    const failure = this.injectedFailures.find(f => f.id === failureId);
    if (!failure) {
      throw new Error(`Failure not found: ${failureId}`);
    }

    const strategy = this.selectRecoveryStrategy(failure);
    const steps = this.generateRecoverySteps(strategy, failure);
    const startTime = Date.now();

    // Simulate recovery execution
    const success = failure.config.recoverable && Math.random() > 0.2;
    const duration = Math.floor(Math.random() * 2000) + 500;

    const attempt: RecoveryAttempt = {
      id: uuidv4(),
      timestamp: new Date(),
      failureId,
      strategy,
      steps,
      success,
      duration,
      outcome: success 
        ? 'Successfully recovered from failure'
        : 'Recovery attempt failed, manual intervention required',
    };

    this.recoveryAttempts.push(attempt);
    return attempt;
  }

  private selectRecoveryStrategy(failure: InjectedFailure): string {
    const strategies: Record<FailureType, string> = {
      task_timeout: 'retry_with_backoff',
      task_error: 'isolate_and_retry',
      workflow_abort: 'checkpoint_recovery',
      resource_unavailable: 'wait_and_retry',
      permission_denied: 'escalate_permissions',
      network_failure: 'reconnect_with_backoff',
      validation_failure: 'validate_and_correct',
      dependency_failure: 'fallback_dependency',
      random: 'generic_retry',
    };
    return strategies[failure.config.failureType] || 'generic_retry';
  }

  private generateRecoverySteps(strategy: string, failure: InjectedFailure): string[] {
    const stepTemplates: Record<string, string[]> = {
      retry_with_backoff: [
        'Captured failure context',
        'Waiting for backoff period (1s)',
        'Retrying operation',
        'Validating retry result',
      ],
      isolate_and_retry: [
        'Isolated failed task',
        'Cleared task state',
        'Re-initialized task context',
        'Executing task in isolation',
      ],
      checkpoint_recovery: [
        'Located last checkpoint',
        'Restored workflow state',
        'Resuming from checkpoint',
        'Continuing execution',
      ],
      wait_and_retry: [
        'Resource unavailability detected',
        'Waiting for resource (2s)',
        'Checking resource availability',
        'Acquiring resource',
      ],
      escalate_permissions: [
        'Permission denied detected',
        'Requesting elevated permissions',
        'Awaiting authorization',
        'Retrying with new permissions',
      ],
      reconnect_with_backoff: [
        'Network failure detected',
        'Closing existing connections',
        'Waiting for backoff (1s)',
        'Establishing new connection',
      ],
      validate_and_correct: [
        'Validation error captured',
        'Analyzing input data',
        'Applying corrections',
        'Re-validating input',
      ],
      fallback_dependency: [
        'Dependency failure detected',
        'Locating fallback service',
        'Switching to fallback',
        'Validating fallback operation',
      ],
      generic_retry: [
        'Failure captured',
        'Preparing retry',
        'Executing retry',
        'Validating result',
      ],
    };

    return stepTemplates[strategy] || stepTemplates.generic_retry;
  }

  // ---------------------------------------------------------------------------
  // Outcome Recording
  // ---------------------------------------------------------------------------

  /**
   * Record the final outcome of a failure injection
   */
  recordOutcome(
    runId: string,
    failure: InjectedFailure,
    recoveryAttempts: RecoveryAttempt[]
  ): InjectionOutcome {
    const successfulRecovery = recoveryAttempts.some(a => a.success);
    const totalRecoveryTime = recoveryAttempts.reduce((sum, a) => sum + a.duration, 0);

    let finalOutcome: InjectionOutcome['finalOutcome'];
    if (successfulRecovery) {
      finalOutcome = 'recovered';
    } else if (recoveryAttempts.length > 0) {
      finalOutcome = 'partial';
    } else {
      finalOutcome = 'failed';
    }

    const lessonsLearned = this.extractLessons(failure, recoveryAttempts, finalOutcome);

    const outcome: InjectionOutcome = {
      id: uuidv4(),
      runId,
      timestamp: new Date(),
      failure,
      recoveryAttempts,
      finalOutcome,
      totalRecoveryTime,
      lessonsLearned,
    };

    this.outcomes.push(outcome);
    return outcome;
  }

  private extractLessons(
    failure: InjectedFailure,
    recoveryAttempts: RecoveryAttempt[],
    finalOutcome: string
  ): string[] {
    const lessons: string[] = [];

    if (finalOutcome === 'recovered') {
      const successfulAttempt = recoveryAttempts.find(a => a.success);
      if (successfulAttempt) {
        lessons.push(`Strategy "${successfulAttempt.strategy}" was effective for ${failure.config.failureType}`);
      }
      if (recoveryAttempts.length === 1) {
        lessons.push('First recovery attempt succeeded - good error handling');
      }
    } else {
      lessons.push(`${failure.config.failureType} failures may need improved handling`);
      if (recoveryAttempts.length > 2) {
        lessons.push('Multiple recovery attempts indicate need for better primary strategy');
      }
    }

    if (!failure.config.recoverable && finalOutcome === 'failed') {
      lessons.push('Non-recoverable failure type requires prevention rather than recovery');
    }

    return lessons;
  }

  // ---------------------------------------------------------------------------
  // Statistics & Reporting
  // ---------------------------------------------------------------------------

  getStatistics(): InjectionStatistics {
    const totalInjections = this.injectedFailures.length;
    const outcomes = this.outcomes;
    const successfulRecoveries = outcomes.filter(o => o.finalOutcome === 'recovered').length;
    const failedRecoveries = outcomes.filter(o => o.finalOutcome === 'failed').length;

    const byFailureType: Record<FailureType, number> = {
      task_timeout: 0,
      task_error: 0,
      workflow_abort: 0,
      resource_unavailable: 0,
      permission_denied: 0,
      network_failure: 0,
      validation_failure: 0,
      dependency_failure: 0,
      random: 0,
    };

    for (const failure of this.injectedFailures) {
      byFailureType[failure.config.failureType]++;
    }

    // Find most reliable recovery strategy
    const strategySuccess = new Map<string, { success: number; total: number }>();
    for (const attempt of this.recoveryAttempts) {
      const stats = strategySuccess.get(attempt.strategy) || { success: 0, total: 0 };
      stats.total++;
      if (attempt.success) stats.success++;
      strategySuccess.set(attempt.strategy, stats);
    }

    let mostReliableRecovery = 'none';
    let bestRate = 0;
    for (const [strategy, stats] of Array.from(strategySuccess.entries())) {
      const rate = stats.total > 0 ? stats.success / stats.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        mostReliableRecovery = strategy;
      }
    }

    return {
      totalInjections,
      successfulRecoveries,
      failedRecoveries,
      averageRecoveryTime: outcomes.length > 0
        ? outcomes.reduce((sum, o) => sum + o.totalRecoveryTime, 0) / outcomes.length
        : 0,
      recoveryRate: totalInjections > 0 ? successfulRecoveries / totalInjections : 0,
      byFailureType,
      mostReliableRecovery,
    };
  }

  getInjectedFailures(): InjectedFailure[] {
    return [...this.injectedFailures];
  }

  getRecoveryAttempts(): RecoveryAttempt[] {
    return [...this.recoveryAttempts];
  }

  getOutcomes(): InjectionOutcome[] {
    return [...this.outcomes];
  }

  getRecentOutcomes(limit: number = 10): InjectionOutcome[] {
    return this.outcomes.slice(-limit);
  }

  reset(): void {
    this.config = null;
    this.isActive = false;
    this.injectedFailures = [];
    this.recoveryAttempts = [];
    this.outcomes = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let failureInjectorInstance: FailureInjector | null = null;

export function getFailureInjector(): FailureInjector {
  if (!failureInjectorInstance) {
    failureInjectorInstance = new FailureInjector();
  }
  return failureInjectorInstance;
}

export function resetFailureInjector(): void {
  failureInjectorInstance = null;
}
