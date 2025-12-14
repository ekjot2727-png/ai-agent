/**
 * ExecutorAgent - Selects and executes appropriate workflows for tasks
 * Responsible for workflow selection, task execution, and result collection
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentContext, ReasoningStep } from './BaseAgent';
import { TaskPlan, PlannedTask, TaskType } from './PlannerAgent';

// ============================================================================
// Types
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  supportedTaskTypes: TaskType[];
  estimatedDuration: number;
  reliability: number; // 0-1
  complexity: 'low' | 'medium' | 'high';
}

export interface WorkflowSelection {
  workflow: Workflow;
  reason: string;
  confidence: number;
  alternatives: Array<{ workflow: Workflow; reason: string }>;
}

export interface TaskExecution {
  taskId: string;
  taskTitle: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  output?: any;
  error?: string;
}

export interface ExecutionResult {
  executionId: string;
  planId: string;
  workflowSelection: WorkflowSelection;
  taskExecutions: TaskExecution[];
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  totalDuration: number;
  errors: string[];
  outputs: Record<string, any>;
  reasoning: {
    steps: ReasoningStep[];
    summary: string;
    totalConfidence: number;
  };
  completedAt: Date;
}

// ============================================================================
// ExecutorAgent Class
// ============================================================================

export class ExecutorAgent extends BaseAgent {
  private workflows: Map<string, Workflow>;
  private simulationMode: boolean;

  constructor(simulationMode: boolean = true) {
    super('executor', 'ExecutorAgent');
    this.workflows = this.initializeWorkflows();
    this.simulationMode = simulationMode;
  }

  // --------------------------------------------------------------------------
  // Main Processing
  // --------------------------------------------------------------------------

  async process(context: AgentContext): Promise<ExecutionResult> {
    this.reset();
    this.isActive = true;

    // Get plan from shared state
    const plan = context.sharedState.get('plan') as TaskPlan;
    if (!plan) {
      throw new Error('No plan found in context. PlannerAgent must run first.');
    }

    this.info('Starting execution', { planId: plan.planId, taskCount: plan.tasks.length });

    try {
      // Phase 1: Select appropriate workflow
      const workflowSelection = await this.selectWorkflow(plan);

      // Phase 2: Prepare execution
      const taskExecutions = this.prepareTaskExecutions(plan.tasks);

      // Phase 3: Execute tasks
      const executedTasks = await this.executeTasks(taskExecutions, workflowSelection.workflow);

      // Phase 4: Collect results
      const result = this.collectResults(plan, workflowSelection, executedTasks);

      this.info('Execution complete', {
        success: result.success,
        completedTasks: result.completedTasks,
        failedTasks: result.failedTasks,
      });

      return result;
    } finally {
      this.isActive = false;
    }
  }

  validateInput(context: AgentContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const plan = context.sharedState.get('plan') as TaskPlan;

    if (!plan) {
      errors.push('No plan found in shared state');
    } else if (!plan.tasks || plan.tasks.length === 0) {
      errors.push('Plan has no tasks to execute');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --------------------------------------------------------------------------
  // Workflow Selection
  // --------------------------------------------------------------------------

  private async selectWorkflow(plan: TaskPlan): Promise<WorkflowSelection> {
    await this.simulateThinking(100, 200);

    this.observe(`Analyzing plan with ${plan.tasks.length} tasks`, 0.95);

    // Analyze task types in the plan
    const taskTypes = new Set(plan.tasks.map(t => t.type));
    this.observe(`Task types identified: ${Array.from(taskTypes).join(', ')}`, 0.9);

    // Score each workflow
    const scoredWorkflows = this.scoreWorkflows(plan, taskTypes);
    
    this.analyze(`Evaluated ${scoredWorkflows.length} potential workflows`, 0.85);

    // Select best workflow
    const best = scoredWorkflows[0];
    const alternatives = scoredWorkflows.slice(1, 4);

    this.decide(`Selected workflow: ${best.workflow.name}`, best.score);
    this.act(`Workflow selection complete with ${(best.score * 100).toFixed(0)}% confidence`, best.score);

    return {
      workflow: best.workflow,
      reason: best.reason,
      confidence: best.score,
      alternatives: alternatives.map(a => ({
        workflow: a.workflow,
        reason: a.reason,
      })),
    };
  }

  private scoreWorkflows(
    plan: TaskPlan,
    taskTypes: Set<TaskType>
  ): Array<{ workflow: Workflow; score: number; reason: string }> {
    const results: Array<{ workflow: Workflow; score: number; reason: string }> = [];

    for (const workflow of Array.from(this.workflows.values())) {
      let score = 0;
      const reasons: string[] = [];

      // Score based on task type support
      const supportedTypes = taskTypes.size > 0
        ? Array.from(taskTypes).filter(t => workflow.supportedTaskTypes.includes(t)).length / taskTypes.size
        : 0.5;
      score += supportedTypes * 0.4;
      if (supportedTypes > 0.5) {
        reasons.push(`Supports ${Math.round(supportedTypes * 100)}% of required task types`);
      }

      // Score based on reliability
      score += workflow.reliability * 0.3;
      if (workflow.reliability >= 0.9) {
        reasons.push('High reliability rating');
      }

      // Score based on complexity match
      const complexityMatch = this.matchComplexity(plan.complexity, workflow.complexity);
      score += complexityMatch * 0.2;
      if (complexityMatch > 0.7) {
        reasons.push('Complexity well-matched to plan');
      }

      // Score based on estimated duration
      const durationMatch = this.matchDuration(plan.totalEstimatedDuration, workflow.estimatedDuration);
      score += durationMatch * 0.1;

      results.push({
        workflow,
        score,
        reason: reasons.length > 0 ? reasons.join('; ') : 'General purpose workflow',
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private matchComplexity(planComplexity: string, workflowComplexity: string): number {
    const levels: Record<string, number> = { simple: 1, low: 1, moderate: 2, medium: 2, complex: 3, high: 3 };
    const planLevel = levels[planComplexity] || 2;
    const workflowLevel = levels[workflowComplexity] || 2;
    return 1 - Math.abs(planLevel - workflowLevel) / 2;
  }

  private matchDuration(planDuration: number, workflowDuration: number): number {
    if (workflowDuration === 0) return 0.5;
    const ratio = planDuration / workflowDuration;
    if (ratio >= 0.5 && ratio <= 2) return 1;
    if (ratio >= 0.25 && ratio <= 4) return 0.7;
    return 0.4;
  }

  // --------------------------------------------------------------------------
  // Task Execution
  // --------------------------------------------------------------------------

  private prepareTaskExecutions(tasks: PlannedTask[]): TaskExecution[] {
    return tasks.map(task => ({
      taskId: task.id,
      taskTitle: task.title,
      status: 'pending' as const,
    }));
  }

  private async executeTasks(
    executions: TaskExecution[],
    workflow: Workflow
  ): Promise<TaskExecution[]> {
    this.info(`Executing ${executions.length} tasks using ${workflow.name}`);

    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      
      this.act(`Starting task ${i + 1}/${executions.length}: ${execution.taskTitle}`, 0.9);
      
      execution.status = 'running';
      execution.startedAt = new Date();

      try {
        // Simulate or execute task
        const result = await this.executeTask(execution, workflow);
        
        execution.status = result.success ? 'completed' : 'failed';
        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
        execution.output = result.output;
        
        if (!result.success) {
          execution.error = result.error;
          this.warn(`Task failed: ${execution.taskTitle}`, { error: result.error });
        } else {
          this.info(`Task completed: ${execution.taskTitle}`, { duration: execution.duration });
        }
      } catch (error) {
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        this.error(`Task error: ${execution.taskTitle}`, { error: execution.error });
      }
    }

    return executions;
  }

  private async executeTask(
    execution: TaskExecution,
    workflow: Workflow
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    if (this.simulationMode) {
      return this.simulateTaskExecution(execution, workflow);
    }

    // Real execution would go here
    // For now, return simulated results
    return this.simulateTaskExecution(execution, workflow);
  }

  private async simulateTaskExecution(
    execution: TaskExecution,
    workflow: Workflow
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    // Simulate execution time
    const baseTime = 100 + Math.random() * 400;
    await new Promise(resolve => setTimeout(resolve, baseTime));

    // Simulate success/failure based on workflow reliability
    const success = Math.random() < workflow.reliability;

    if (success) {
      return {
        success: true,
        output: {
          taskId: execution.taskId,
          message: `Task "${execution.taskTitle}" completed successfully`,
          simulatedData: {
            processedItems: Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
          },
        },
      };
    } else {
      return {
        success: false,
        error: this.generateSimulatedError(execution.taskTitle),
      };
    }
  }

  private generateSimulatedError(taskTitle: string): string {
    const errors = [
      `Timeout while executing "${taskTitle}"`,
      `Resource temporarily unavailable for "${taskTitle}"`,
      `Validation failed in "${taskTitle}"`,
      `Connection error during "${taskTitle}"`,
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  // --------------------------------------------------------------------------
  // Result Collection
  // --------------------------------------------------------------------------

  private collectResults(
    plan: TaskPlan,
    workflowSelection: WorkflowSelection,
    executions: TaskExecution[]
  ): ExecutionResult {
    const completedTasks = executions.filter(e => e.status === 'completed').length;
    const failedTasks = executions.filter(e => e.status === 'failed').length;
    const skippedTasks = executions.filter(e => e.status === 'skipped').length;
    
    const errors = executions
      .filter(e => e.error)
      .map(e => `${e.taskTitle}: ${e.error}`);

    const outputs: Record<string, any> = {};
    for (const execution of executions) {
      if (execution.output) {
        outputs[execution.taskId] = execution.output;
      }
    }

    const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      executionId: uuidv4(),
      planId: plan.planId,
      workflowSelection,
      taskExecutions: executions,
      success: failedTasks === 0,
      completedTasks,
      failedTasks,
      skippedTasks,
      totalDuration,
      errors,
      outputs,
      reasoning: {
        steps: this.getReasoning(),
        summary: this.generateExecutionSummary(completedTasks, failedTasks, totalDuration),
        totalConfidence: this.calculateConfidence(),
      },
      completedAt: new Date(),
    };
  }

  private generateExecutionSummary(
    completed: number,
    failed: number,
    duration: number
  ): string {
    const total = completed + failed;
    const successRate = total > 0 ? (completed / total * 100).toFixed(0) : '0';
    return `Executed ${total} tasks with ${successRate}% success rate. ` +
           `${completed} completed, ${failed} failed. Total duration: ${duration}ms.`;
  }

  // --------------------------------------------------------------------------
  // Workflow Initialization
  // --------------------------------------------------------------------------

  private initializeWorkflows(): Map<string, Workflow> {
    const workflows = new Map<string, Workflow>();

    workflows.set('data-pipeline', {
      id: 'data-pipeline',
      name: 'Data Pipeline Workflow',
      description: 'Optimized for data processing, ETL, and analytics tasks',
      supportedTaskTypes: ['data-processing', 'transformation', 'validation', 'file-operation'],
      estimatedDuration: 120,
      reliability: 0.95,
      complexity: 'medium',
    });

    workflows.set('ci-cd', {
      id: 'ci-cd',
      name: 'CI/CD Pipeline',
      description: 'Build, test, and deployment automation',
      supportedTaskTypes: ['deployment', 'testing', 'validation', 'notification'],
      estimatedDuration: 180,
      reliability: 0.92,
      complexity: 'high',
    });

    workflows.set('api-orchestration', {
      id: 'api-orchestration',
      name: 'API Orchestration Workflow',
      description: 'Coordinates API calls and service integrations',
      supportedTaskTypes: ['api-call', 'transformation', 'validation', 'notification'],
      estimatedDuration: 90,
      reliability: 0.88,
      complexity: 'medium',
    });

    workflows.set('monitoring', {
      id: 'monitoring',
      name: 'Monitoring & Alerting Workflow',
      description: 'System monitoring, metrics collection, and alerting',
      supportedTaskTypes: ['monitoring', 'notification', 'validation', 'api-call'],
      estimatedDuration: 60,
      reliability: 0.97,
      complexity: 'low',
    });

    workflows.set('batch-processing', {
      id: 'batch-processing',
      name: 'Batch Processing Workflow',
      description: 'High-volume batch operations and scheduled tasks',
      supportedTaskTypes: ['data-processing', 'computation', 'file-operation', 'cleanup'],
      estimatedDuration: 240,
      reliability: 0.93,
      complexity: 'high',
    });

    workflows.set('general', {
      id: 'general',
      name: 'General Purpose Workflow',
      description: 'Flexible workflow for varied task types',
      supportedTaskTypes: ['generic', 'computation', 'file-operation', 'notification', 'validation', 'cleanup'],
      estimatedDuration: 100,
      reliability: 0.90,
      complexity: 'medium',
    });

    return workflows;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Get available workflows
   */
  getAvailableWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Set simulation mode
   */
  setSimulationMode(enabled: boolean): void {
    this.simulationMode = enabled;
  }
}
