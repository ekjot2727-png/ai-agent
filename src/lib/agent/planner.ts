/**
 * Task Planner Module
 * 
 * Responsible for breaking down goals into executable tasks
 * using Oumi reasoning engine.
 */

import { Goal, Task, AgentLog } from '../types';
import { decomposeGoal, reason } from './oumi';
import { v4 as uuidv4 } from 'uuid';

export interface PlanningResult {
  tasks: Task[];
  reasoning: string;
  estimatedTotalDuration: number;
  logs: AgentLog[];
}

/**
 * Creates an execution plan from a user goal
 */
export async function createPlan(goal: Goal): Promise<PlanningResult> {
  const logs: AgentLog[] = [];
  
  // Log start of planning
  logs.push(createLog('info', 'Starting goal decomposition', { goalId: goal.id }));
  
  // Use Oumi reasoning to analyze the goal
  const reasoning = reason(goal.description, 'How should this goal be broken down into tasks?');
  
  logs.push(createLog('debug', `Reasoning confidence: ${(reasoning.confidence * 100).toFixed(1)}%`, {
    analysis: reasoning.analysis,
  }));
  
  // Decompose goal into tasks
  const tasks = decomposeGoal(goal);
  
  logs.push(createLog('info', `Created ${tasks.length} tasks`, {
    taskIds: tasks.map(t => t.id),
  }));
  
  // Calculate estimated duration
  const estimatedTotalDuration = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
  
  // Validate task dependencies
  const validationResult = validateDependencies(tasks);
  if (!validationResult.valid) {
    logs.push(createLog('warning', 'Dependency validation issues detected', {
      issues: validationResult.issues,
    }));
  }
  
  // Apply constraints from goal
  const constrainedTasks = applyConstraints(tasks, goal.constraints || []);
  
  logs.push(createLog('info', 'Planning phase complete', {
    totalTasks: constrainedTasks.length,
    estimatedDuration: `${estimatedTotalDuration}s`,
  }));
  
  return {
    tasks: constrainedTasks,
    reasoning: reasoning.decision,
    estimatedTotalDuration,
    logs,
  };
}

/**
 * Reorders tasks based on priority and dependencies
 */
export function prioritizeTasks(tasks: Task[]): Task[] {
  // Topological sort with priority consideration
  const sorted: Task[] = [];
  const visited = new Set<string>();
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  function visit(task: Task) {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    
    // Visit dependencies first
    for (const depId of task.dependencies) {
      const dep = taskMap.get(depId);
      if (dep) visit(dep);
    }
    
    sorted.push(task);
  }
  
  // Sort by priority first, then process
  const byPriority = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  for (const task of byPriority) {
    visit(task);
  }
  
  return sorted;
}

/**
 * Validates task dependency graph
 */
function validateDependencies(tasks: Task[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const taskIds = new Set(tasks.map(t => t.id));
  
  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (!taskIds.has(depId)) {
        issues.push(`Task "${task.title}" has unknown dependency: ${depId}`);
      }
    }
  }
  
  // Check for circular dependencies
  const circularCheck = detectCircularDependencies(tasks);
  if (circularCheck) {
    issues.push(`Circular dependency detected: ${circularCheck}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Detects circular dependencies in task graph
 */
function detectCircularDependencies(tasks: Task[]): string | null {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(taskId: string): boolean {
    if (recursionStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;
    
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = taskMap.get(taskId);
    if (task) {
      for (const depId of task.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  }
  
  for (const task of tasks) {
    if (hasCycle(task.id)) {
      return task.title;
    }
  }
  
  return null;
}

/**
 * Applies goal constraints to tasks
 */
function applyConstraints(tasks: Task[], constraints: string[]): Task[] {
  // Simulate constraint application
  // In a real system, this would modify tasks based on constraints
  return tasks.map(task => {
    if (constraints.includes('fast')) {
      return { ...task, estimatedDuration: Math.floor(task.estimatedDuration * 0.7) };
    }
    if (constraints.includes('thorough')) {
      return { ...task, estimatedDuration: Math.floor(task.estimatedDuration * 1.5) };
    }
    return task;
  });
}

/**
 * Creates a log entry
 */
function createLog(
  level: AgentLog['level'],
  message: string,
  details?: Record<string, unknown>
): AgentLog {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    phase: 'planning',
    message,
    details,
    level,
  };
}

export default {
  createPlan,
  prioritizeTasks,
};
