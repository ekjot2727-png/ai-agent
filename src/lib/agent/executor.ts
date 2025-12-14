/**
 * Task Executor Module
 * 
 * Handles the execution of individual tasks within the agent workflow.
 * Simulates task execution with realistic timing and outcomes.
 */

import { Task, TaskResult, AgentLog, AgentConfig, DEFAULT_AGENT_CONFIG } from '../types';
import { evaluateTask } from './oumi';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionContext {
  config: AgentConfig;
  previousResults: Map<string, TaskResult>;
  onProgress?: (task: Task, progress: number) => void;
  onLog?: (log: AgentLog) => void;
}

/**
 * Executes a single task
 */
export async function executeTask(
  task: Task,
  context: ExecutionContext
): Promise<Task> {
  const startTime = Date.now();
  const updatedTask: Task = {
    ...task,
    status: 'in-progress',
    startedAt: new Date(),
  };
  
  logMessage(context, 'info', `Starting task: ${task.title}`, { taskId: task.id });
  
  try {
    // Check dependencies
    const depsReady = checkDependencies(task, context.previousResults);
    if (!depsReady) {
      throw new Error('Dependencies not satisfied');
    }
    
    // Simulate task execution with progress updates
    const result = await simulateExecution(updatedTask, context);
    
    const endTime = Date.now();
    const actualDuration = Math.floor((endTime - startTime) / 1000);
    
    // Use Oumi to evaluate task completion
    const evaluation = evaluateTask({ ...updatedTask, status: 'completed', result });
    
    logMessage(context, 'debug', `Task evaluation: ${evaluation.decision}`, {
      confidence: evaluation.confidence,
    });
    
    return {
      ...updatedTask,
      status: result.success ? 'completed' : 'failed',
      result,
      actualDuration,
      completedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logMessage(context, 'error', `Task failed: ${errorMessage}`, { taskId: task.id });
    
    return {
      ...updatedTask,
      status: 'failed',
      result: {
        success: false,
        output: '',
        error: errorMessage,
      },
      actualDuration: Math.floor((Date.now() - startTime) / 1000),
      completedAt: new Date(),
    };
  }
}

/**
 * Executes all tasks in sequence
 */
export async function executeAllTasks(
  tasks: Task[],
  config: AgentConfig = DEFAULT_AGENT_CONFIG,
  callbacks?: {
    onTaskStart?: (task: Task) => void;
    onTaskComplete?: (task: Task) => void;
    onLog?: (log: AgentLog) => void;
  }
): Promise<Task[]> {
  const results: Task[] = [];
  const previousResults = new Map<string, TaskResult>();
  
  const context: ExecutionContext = {
    config,
    previousResults,
    onLog: callbacks?.onLog,
  };
  
  for (const task of tasks) {
    callbacks?.onTaskStart?.(task);
    
    const executedTask = await executeTask(task, context);
    results.push(executedTask);
    
    if (executedTask.result) {
      previousResults.set(task.id, executedTask.result);
    }
    
    callbacks?.onTaskComplete?.(executedTask);
    
    // Stop if task failed and not configured to continue
    if (executedTask.status === 'failed' && !config.parallelExecution) {
      // Mark remaining tasks as skipped
      const remainingIndex = tasks.indexOf(task) + 1;
      for (let i = remainingIndex; i < tasks.length; i++) {
        results.push({
          ...tasks[i],
          status: 'skipped',
          result: {
            success: false,
            output: 'Skipped due to previous task failure',
          },
        });
      }
      break;
    }
  }
  
  return results;
}

/**
 * Simulates task execution with realistic timing
 */
async function simulateExecution(
  task: Task,
  context: ExecutionContext
): Promise<TaskResult> {
  const duration = task.estimatedDuration * 1000; // Convert to ms
  const steps = 10;
  const stepDuration = duration / steps;
  
  // Simulate progress
  for (let i = 1; i <= steps; i++) {
    await sleep(stepDuration);
    context.onProgress?.(task, (i / steps) * 100);
  }
  
  // Simulate outcome (90% success rate for demo)
  const success = Math.random() > 0.1;
  
  return {
    success,
    output: generateTaskOutput(task, success),
    metrics: generateMetrics(task),
    artifacts: success ? [`artifact_${task.id.slice(0, 8)}.json`] : undefined,
    error: success ? undefined : 'Simulated task failure for demonstration',
  };
}

/**
 * Generates simulated task output
 */
function generateTaskOutput(task: Task, success: boolean): string {
  if (!success) {
    return `Task "${task.title}" encountered an error during execution.`;
  }
  
  const outputs: Record<string, string> = {
    'Analyze': `Analysis complete. Identified 5 key components and 3 potential optimizations.`,
    'Design': `Design specification created. Architecture follows best practices.`,
    'Implement': `Implementation successful. 150 lines of code generated.`,
    'Test': `All tests passed. Coverage: 87%. Performance within acceptable limits.`,
    'Deploy': `Deployment successful. Service is now live and healthy.`,
    'Validate': `Validation complete. All checks passed.`,
    'default': `Task completed successfully. Output generated.`,
  };
  
  for (const [key, output] of Object.entries(outputs)) {
    if (task.title.includes(key)) {
      return output;
    }
  }
  
  return outputs.default;
}

/**
 * Generates simulated metrics
 */
function generateMetrics(task: Task): Record<string, number> {
  return {
    executionTime: task.estimatedDuration + Math.floor(Math.random() * 5),
    memoryUsed: Math.floor(Math.random() * 100) + 50,
    cpuUsage: Math.floor(Math.random() * 30) + 10,
  };
}

/**
 * Checks if task dependencies are satisfied
 */
function checkDependencies(
  task: Task,
  previousResults: Map<string, TaskResult>
): boolean {
  for (const depId of task.dependencies) {
    const result = previousResults.get(depId);
    if (!result || !result.success) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a log entry
 */
function logMessage(
  context: ExecutionContext,
  level: AgentLog['level'],
  message: string,
  details?: Record<string, unknown>
): void {
  if (!context.config.verboseLogging && level === 'debug') return;
  
  const log: AgentLog = {
    id: uuidv4(),
    timestamp: new Date(),
    phase: 'executing',
    message,
    details,
    level,
  };
  
  context.onLog?.(log);
}

/**
 * Utility sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  executeTask,
  executeAllTasks,
};
