/**
 * FailureHandler - Handles workflow failures with retry logic and recovery plans
 * Provides plain language explanations and recovery strategies
 */

import { v4 as uuidv4 } from 'uuid';
import { TaskExecution, ExecutionResult } from '../agents/ExecutorAgent';
import { TaskPlan, PlannedTask } from '../agents/PlannerAgent';

// ============================================================================
// Types
// ============================================================================

export interface FailureRecord {
  id: string;
  timestamp: Date;
  taskId: string;
  taskTitle: string;
  error: string;
  errorType: FailureType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryAttempted: boolean;
  retrySucceeded: boolean;
  recoveryPlan?: RecoveryPlan;
}

export type FailureType = 
  | 'timeout'
  | 'connection'
  | 'validation'
  | 'resource'
  | 'permission'
  | 'dependency'
  | 'unknown';

export interface RecoveryPlan {
  id: string;
  strategy: RecoveryStrategy;
  steps: RecoveryStep[];
  estimatedTime: number;
  confidence: number;
  alternativeTasks: string[];
}

export type RecoveryStrategy = 
  | 'retry'
  | 'skip'
  | 'fallback'
  | 'manual-intervention'
  | 'rollback'
  | 'partial-completion';

export interface RecoveryStep {
  order: number;
  action: string;
  description: string;
  automated: boolean;
}

export interface FailureAnalysis {
  totalFailures: number;
  failuresByType: Record<FailureType, number>;
  failuresBySeverity: Record<string, number>;
  retriesAttempted: number;
  retriesSucceeded: number;
  recoveryRate: number;
  plainLanguageSummary: string;
  rootCauses: string[];
  recommendations: string[];
}

// ============================================================================
// FailureHandler Class
// ============================================================================

export class FailureHandler {
  private failures: FailureRecord[] = [];
  private maxRetries: number = 1;

  constructor(maxRetries: number = 1) {
    this.maxRetries = maxRetries;
  }

  // --------------------------------------------------------------------------
  // Failure Recording & Classification
  // --------------------------------------------------------------------------

  recordFailure(
    execution: TaskExecution,
    plan?: TaskPlan
  ): FailureRecord {
    const errorType = this.classifyError(execution.error || 'Unknown error');
    const severity = this.assessSeverity(execution, plan);

    const record: FailureRecord = {
      id: uuidv4(),
      timestamp: new Date(),
      taskId: execution.taskId,
      taskTitle: execution.taskTitle,
      error: execution.error || 'Unknown error',
      errorType,
      severity,
      retryAttempted: false,
      retrySucceeded: false,
    };

    this.failures.push(record);
    console.log(`[FailureHandler] Recorded failure: ${record.taskTitle} (${record.errorType})`);

    return record;
  }

  private classifyError(error: string): FailureType {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'timeout';
    }
    if (errorLower.includes('connection') || errorLower.includes('network') || errorLower.includes('unreachable')) {
      return 'connection';
    }
    if (errorLower.includes('validation') || errorLower.includes('invalid') || errorLower.includes('format')) {
      return 'validation';
    }
    if (errorLower.includes('resource') || errorLower.includes('memory') || errorLower.includes('disk')) {
      return 'resource';
    }
    if (errorLower.includes('permission') || errorLower.includes('denied') || errorLower.includes('unauthorized')) {
      return 'permission';
    }
    if (errorLower.includes('dependency') || errorLower.includes('not found') || errorLower.includes('missing')) {
      return 'dependency';
    }

    return 'unknown';
  }

  private assessSeverity(
    execution: TaskExecution,
    plan?: TaskPlan
  ): FailureRecord['severity'] {
    // Check if this was a critical task
    if (plan) {
      const task = plan.tasks.find(t => t.id === execution.taskId);
      if (task?.priority === 'critical') return 'critical';
      if (task?.priority === 'high') return 'high';
    }

    // Assess based on error type
    const errorType = this.classifyError(execution.error || '');
    if (errorType === 'permission' || errorType === 'dependency') return 'high';
    if (errorType === 'validation' || errorType === 'resource') return 'medium';
    
    return 'low';
  }

  // --------------------------------------------------------------------------
  // Retry Logic
  // --------------------------------------------------------------------------

  async attemptRetry(
    execution: TaskExecution,
    executeTask: () => Promise<{ success: boolean; output?: any; error?: string }>
  ): Promise<{ success: boolean; execution: TaskExecution }> {
    const record = this.failures.find(f => f.taskId === execution.taskId);
    
    if (!record) {
      return { success: false, execution };
    }

    console.log(`[FailureHandler] Attempting retry for: ${execution.taskTitle}`);
    record.retryAttempted = true;

    // Wait before retry (exponential backoff simulation)
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const result = await executeTask();
      
      if (result.success) {
        console.log(`[FailureHandler] Retry succeeded for: ${execution.taskTitle}`);
        record.retrySucceeded = true;
        
        return {
          success: true,
          execution: {
            ...execution,
            status: 'completed',
            output: result.output,
            error: undefined,
          },
        };
      } else {
        console.log(`[FailureHandler] Retry failed for: ${execution.taskTitle}`);
        return {
          success: false,
          execution: {
            ...execution,
            error: `Retry failed: ${result.error}`,
          },
        };
      }
    } catch (error) {
      console.log(`[FailureHandler] Retry error for: ${execution.taskTitle}`);
      return {
        success: false,
        execution: {
          ...execution,
          error: `Retry error: ${error instanceof Error ? error.message : 'Unknown'}`,
        },
      };
    }
  }

  // --------------------------------------------------------------------------
  // Recovery Plan Generation
  // --------------------------------------------------------------------------

  generateRecoveryPlan(record: FailureRecord): RecoveryPlan {
    const strategy = this.selectRecoveryStrategy(record);
    const steps = this.generateRecoverySteps(record, strategy);

    const plan: RecoveryPlan = {
      id: uuidv4(),
      strategy,
      steps,
      estimatedTime: this.estimateRecoveryTime(strategy, steps),
      confidence: this.calculateRecoveryConfidence(record, strategy),
      alternativeTasks: this.suggestAlternatives(record),
    };

    record.recoveryPlan = plan;
    return plan;
  }

  private selectRecoveryStrategy(record: FailureRecord): RecoveryStrategy {
    // Already retried and failed
    if (record.retryAttempted && !record.retrySucceeded) {
      if (record.severity === 'low') return 'skip';
      if (record.severity === 'medium') return 'fallback';
      if (record.severity === 'high') return 'partial-completion';
      return 'manual-intervention';
    }

    // Based on error type
    switch (record.errorType) {
      case 'timeout':
      case 'connection':
        return 'retry';
      case 'validation':
        return 'fallback';
      case 'resource':
        return 'partial-completion';
      case 'permission':
        return 'manual-intervention';
      case 'dependency':
        return 'rollback';
      default:
        return record.severity === 'critical' ? 'manual-intervention' : 'skip';
    }
  }

  private generateRecoverySteps(
    record: FailureRecord,
    strategy: RecoveryStrategy
  ): RecoveryStep[] {
    const steps: RecoveryStep[] = [];

    switch (strategy) {
      case 'retry':
        steps.push(
          { order: 1, action: 'Wait', description: 'Wait for transient issue to resolve', automated: true },
          { order: 2, action: 'Retry', description: 'Attempt task execution again', automated: true },
          { order: 3, action: 'Verify', description: 'Verify task completion', automated: true }
        );
        break;

      case 'skip':
        steps.push(
          { order: 1, action: 'Log', description: 'Log failure for later review', automated: true },
          { order: 2, action: 'Skip', description: 'Skip non-critical task and continue', automated: true },
          { order: 3, action: 'Notify', description: 'Add to execution report', automated: true }
        );
        break;

      case 'fallback':
        steps.push(
          { order: 1, action: 'Analyze', description: 'Identify fallback approach', automated: true },
          { order: 2, action: 'Substitute', description: 'Use alternative method', automated: true },
          { order: 3, action: 'Validate', description: 'Ensure fallback meets requirements', automated: true }
        );
        break;

      case 'partial-completion':
        steps.push(
          { order: 1, action: 'Assess', description: 'Determine what can be completed', automated: true },
          { order: 2, action: 'Execute', description: 'Complete available portions', automated: true },
          { order: 3, action: 'Document', description: 'Record incomplete items', automated: true },
          { order: 4, action: 'Schedule', description: 'Plan for remaining work', automated: false }
        );
        break;

      case 'manual-intervention':
        steps.push(
          { order: 1, action: 'Alert', description: 'Notify administrator of critical failure', automated: true },
          { order: 2, action: 'Pause', description: 'Pause workflow execution', automated: true },
          { order: 3, action: 'Investigate', description: 'Manual investigation required', automated: false },
          { order: 4, action: 'Resolve', description: 'Apply manual fix', automated: false },
          { order: 5, action: 'Resume', description: 'Resume workflow after resolution', automated: false }
        );
        break;

      case 'rollback':
        steps.push(
          { order: 1, action: 'Stop', description: 'Halt current execution', automated: true },
          { order: 2, action: 'Revert', description: 'Undo completed changes', automated: true },
          { order: 3, action: 'Restore', description: 'Restore previous state', automated: true },
          { order: 4, action: 'Report', description: 'Generate failure report', automated: true }
        );
        break;
    }

    return steps;
  }

  private estimateRecoveryTime(strategy: RecoveryStrategy, steps: RecoveryStep[]): number {
    const baseTime: Record<RecoveryStrategy, number> = {
      'retry': 5,
      'skip': 1,
      'fallback': 10,
      'partial-completion': 15,
      'manual-intervention': 60,
      'rollback': 20,
    };

    return baseTime[strategy] + steps.filter(s => !s.automated).length * 10;
  }

  private calculateRecoveryConfidence(
    record: FailureRecord,
    strategy: RecoveryStrategy
  ): number {
    const baseConfidence: Record<RecoveryStrategy, number> = {
      'retry': 0.7,
      'skip': 0.95,
      'fallback': 0.75,
      'partial-completion': 0.8,
      'manual-intervention': 0.6,
      'rollback': 0.85,
    };

    let confidence = baseConfidence[strategy];

    // Adjust based on severity
    if (record.severity === 'critical') confidence *= 0.8;
    if (record.severity === 'low') confidence *= 1.1;

    // Adjust based on error type predictability
    if (record.errorType === 'timeout' || record.errorType === 'connection') {
      confidence *= 1.1; // More predictable
    }
    if (record.errorType === 'unknown') {
      confidence *= 0.8; // Less predictable
    }

    return Math.min(Math.max(confidence, 0.3), 0.95);
  }

  private suggestAlternatives(record: FailureRecord): string[] {
    const alternatives: string[] = [];

    switch (record.errorType) {
      case 'timeout':
        alternatives.push('Increase timeout limits');
        alternatives.push('Break into smaller subtasks');
        alternatives.push('Use async processing');
        break;
      case 'connection':
        alternatives.push('Check network connectivity');
        alternatives.push('Use offline fallback');
        alternatives.push('Queue for later execution');
        break;
      case 'validation':
        alternatives.push('Review input data format');
        alternatives.push('Apply data transformation');
        alternatives.push('Use lenient validation mode');
        break;
      case 'resource':
        alternatives.push('Free up system resources');
        alternatives.push('Scale up infrastructure');
        alternatives.push('Use resource pooling');
        break;
      case 'permission':
        alternatives.push('Request elevated permissions');
        alternatives.push('Use service account');
        alternatives.push('Contact administrator');
        break;
      case 'dependency':
        alternatives.push('Install missing dependencies');
        alternatives.push('Update dependency versions');
        alternatives.push('Use alternative library');
        break;
      default:
        alternatives.push('Review task configuration');
        alternatives.push('Check system logs');
        alternatives.push('Contact support');
    }

    return alternatives;
  }

  // --------------------------------------------------------------------------
  // Plain Language Explanations
  // --------------------------------------------------------------------------

  explainFailure(record: FailureRecord): string {
    const explanations: Record<FailureType, string> = {
      timeout: `The task "${record.taskTitle}" took too long to complete and was stopped. This usually happens when the operation is processing too much data or waiting for a slow external service.`,
      connection: `The task "${record.taskTitle}" couldn't connect to a required service. This might be due to network issues, the service being down, or incorrect connection settings.`,
      validation: `The task "${record.taskTitle}" received data that didn't match the expected format. The input needs to be checked and corrected before the task can succeed.`,
      resource: `The task "${record.taskTitle}" ran out of available resources (like memory or disk space). The system needs more capacity or the task should be optimized to use fewer resources.`,
      permission: `The task "${record.taskTitle}" doesn't have the necessary permissions to complete. Access rights need to be granted before this task can run.`,
      dependency: `The task "${record.taskTitle}" is missing something it needs to work properly. A required component or service wasn't available when the task ran.`,
      unknown: `The task "${record.taskTitle}" failed for an unexpected reason. Further investigation is needed to understand what went wrong.`,
    };

    let explanation = explanations[record.errorType];

    // Add recovery plan summary if available
    if (record.recoveryPlan) {
      const strategyExplanations: Record<RecoveryStrategy, string> = {
        'retry': 'The system will automatically try again.',
        'skip': 'This task has been skipped to allow the workflow to continue.',
        'fallback': 'An alternative approach will be used instead.',
        'partial-completion': 'The task will be completed partially, with remaining work scheduled for later.',
        'manual-intervention': 'This requires manual attention to resolve.',
        'rollback': 'Changes are being rolled back to a safe state.',
      };
      explanation += ` ${strategyExplanations[record.recoveryPlan.strategy]}`;
    }

    return explanation;
  }

  explainFailures(records: FailureRecord[]): string {
    if (records.length === 0) {
      return 'All tasks completed successfully with no failures.';
    }

    if (records.length === 1) {
      return this.explainFailure(records[0]);
    }

    // Group by type
    const byType = records.reduce((acc, r) => {
      if (!acc[r.errorType]) acc[r.errorType] = [];
      acc[r.errorType].push(r);
      return acc;
    }, {} as Record<FailureType, FailureRecord[]>);

    const parts: string[] = [`${records.length} tasks encountered issues:`];

    for (const [type, typeRecords] of Object.entries(byType)) {
      const taskNames = typeRecords.map(r => `"${r.taskTitle}"`).join(', ');
      const typeExplanation: Record<FailureType, string> = {
        timeout: `${typeRecords.length} task(s) timed out (${taskNames}) - operations took too long`,
        connection: `${typeRecords.length} task(s) had connection issues (${taskNames}) - network or service problems`,
        validation: `${typeRecords.length} task(s) failed validation (${taskNames}) - data format issues`,
        resource: `${typeRecords.length} task(s) ran out of resources (${taskNames}) - capacity limits reached`,
        permission: `${typeRecords.length} task(s) lacked permissions (${taskNames}) - access denied`,
        dependency: `${typeRecords.length} task(s) had missing dependencies (${taskNames}) - required components unavailable`,
        unknown: `${typeRecords.length} task(s) failed unexpectedly (${taskNames}) - investigation needed`,
      };
      parts.push(typeExplanation[type as FailureType]);
    }

    // Add recovery summary
    const withRecovery = records.filter(r => r.recoveryPlan);
    if (withRecovery.length > 0) {
      parts.push(`Recovery plans have been generated for ${withRecovery.length} failure(s).`);
    }

    return parts.join('\n\n');
  }

  // --------------------------------------------------------------------------
  // Analysis
  // --------------------------------------------------------------------------

  analyzeFailures(): FailureAnalysis {
    const failuresByType: Record<FailureType, number> = {
      timeout: 0, connection: 0, validation: 0, resource: 0, 
      permission: 0, dependency: 0, unknown: 0
    };
    const failuresBySeverity: Record<string, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    for (const f of this.failures) {
      failuresByType[f.errorType]++;
      failuresBySeverity[f.severity]++;
    }

    const retriesAttempted = this.failures.filter(f => f.retryAttempted).length;
    const retriesSucceeded = this.failures.filter(f => f.retrySucceeded).length;
    const recoveryRate = retriesAttempted > 0 ? retriesSucceeded / retriesAttempted : 0;

    // Identify root causes
    const rootCauses: string[] = [];
    if (failuresByType.timeout > this.failures.length * 0.3) {
      rootCauses.push('System performance issues causing frequent timeouts');
    }
    if (failuresByType.connection > this.failures.length * 0.3) {
      rootCauses.push('Network instability or external service issues');
    }
    if (failuresByType.validation > this.failures.length * 0.3) {
      rootCauses.push('Data quality problems in input sources');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (failuresByType.timeout > 0) {
      recommendations.push('Consider increasing timeout limits or optimizing slow operations');
    }
    if (failuresByType.connection > 0) {
      recommendations.push('Implement connection retry logic and circuit breakers');
    }
    if (recoveryRate < 0.5 && retriesAttempted > 0) {
      recommendations.push('Improve retry strategies or add fallback mechanisms');
    }

    return {
      totalFailures: this.failures.length,
      failuresByType,
      failuresBySeverity,
      retriesAttempted,
      retriesSucceeded,
      recoveryRate,
      plainLanguageSummary: this.explainFailures(this.failures),
      rootCauses: rootCauses.length > 0 ? rootCauses : ['No clear patterns identified'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring for patterns'],
    };
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  getFailures(): FailureRecord[] {
    return this.failures;
  }

  getFailure(taskId: string): FailureRecord | undefined {
    return this.failures.find(f => f.taskId === taskId);
  }

  clearFailures(): void {
    this.failures = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let failureHandlerInstance: FailureHandler | null = null;

export function getFailureHandler(): FailureHandler {
  if (!failureHandlerInstance) {
    failureHandlerInstance = new FailureHandler();
  }
  return failureHandlerInstance;
}

export function resetFailureHandler(): void {
  failureHandlerInstance = null;
}
