/**
 * Reflection Module
 * 
 * Analyzes completed workflows, generates insights,
 * and provides recommendations for future improvements.
 */

import { Task, Reflection, AgentLog, AgentState } from '../types';
import { reason } from './oumi';
import { v4 as uuidv4 } from 'uuid';

export interface ReflectionInput {
  tasks: Task[];
  totalDuration: number;
  goalDescription: string;
}

/**
 * Generates a comprehensive reflection on the completed workflow
 */
export async function reflect(input: ReflectionInput): Promise<{
  reflection: Reflection;
  logs: AgentLog[];
}> {
  const logs: AgentLog[] = [];
  
  logs.push(createLog('info', 'Starting reflection phase'));
  
  // Calculate success metrics
  const successRate = calculateSuccessRate(input.tasks);
  const overallScore = calculateOverallScore(input);
  
  logs.push(createLog('debug', `Success rate: ${(successRate * 100).toFixed(1)}%`));
  
  // Use Oumi reasoning to analyze results
  const reasoning = reason(
    `Tasks completed: ${input.tasks.length}, Success rate: ${successRate}`,
    'What insights can be drawn from this workflow execution?'
  );
  
  // Generate insights based on task results
  const insights = generateInsights(input.tasks, successRate);
  
  // Generate improvement suggestions
  const improvements = generateImprovements(input.tasks, reasoning);
  
  // Extract lessons learned
  const lessonsLearned = extractLessonsLearned(input.tasks);
  
  logs.push(createLog('info', 'Reflection complete', {
    insightsCount: insights.length,
    improvementsCount: improvements.length,
  }));
  
  const reflection: Reflection = {
    summary: generateSummary(input, successRate),
    successRate,
    insights,
    improvements,
    lessonsLearned,
    overallScore,
  };
  
  return { reflection, logs };
}

/**
 * Calculates the success rate of tasks
 */
function calculateSuccessRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  return completed / tasks.length;
}

/**
 * Calculates overall performance score
 */
function calculateOverallScore(input: ReflectionInput): number {
  const { tasks, totalDuration } = input;
  
  // Base score from success rate
  const successRate = calculateSuccessRate(tasks);
  let score = successRate * 70; // 70% weight on success
  
  // Time efficiency bonus
  const estimatedTotal = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
  if (totalDuration < estimatedTotal) {
    score += 15; // Bonus for finishing early
  } else if (totalDuration < estimatedTotal * 1.2) {
    score += 10; // Acceptable time
  } else {
    score += 5; // Over time but completed
  }
  
  // Task complexity bonus
  const highPriorityComplete = tasks.filter(
    t => t.priority === 'high' && t.status === 'completed'
  ).length;
  score += highPriorityComplete * 5;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Generates insights from task execution
 */
function generateInsights(tasks: Task[], successRate: number): string[] {
  const insights: string[] = [];
  
  // Overall performance insight
  if (successRate >= 0.9) {
    insights.push('Excellent execution with high success rate across all tasks.');
  } else if (successRate >= 0.7) {
    insights.push('Good overall performance with room for improvement in some areas.');
  } else {
    insights.push('Several tasks encountered issues that require attention.');
  }
  
  // Task-specific insights
  const failedTasks = tasks.filter(t => t.status === 'failed');
  if (failedTasks.length > 0) {
    insights.push(`${failedTasks.length} task(s) failed and may need retry or redesign.`);
    
    // Identify patterns in failures
    const failedTitles = failedTasks.map(t => t.title.toLowerCase());
    if (failedTitles.some(t => t.includes('implement') || t.includes('execute'))) {
      insights.push('Execution-phase tasks showed higher failure rate - consider breaking into smaller steps.');
    }
  }
  
  // Timing insights
  const overTimeTasks = tasks.filter(
    t => t.actualDuration && t.actualDuration > t.estimatedDuration * 1.5
  );
  if (overTimeTasks.length > 0) {
    insights.push(`${overTimeTasks.length} task(s) took significantly longer than estimated.`);
  }
  
  // Dependency insights
  const taskWithDeps = tasks.filter(t => t.dependencies.length > 0);
  if (taskWithDeps.length > tasks.length * 0.8) {
    insights.push('High task interdependency detected - consider parallelization opportunities.');
  }
  
  return insights;
}

/**
 * Generates improvement suggestions
 */
function generateImprovements(tasks: Task[], reasoning: ReturnType<typeof reason>): string[] {
  const improvements: string[] = [];
  
  // Based on Oumi reasoning
  if (reasoning.confidence < 0.8) {
    improvements.push('Provide more detailed goal descriptions for better task decomposition.');
  }
  
  // Based on task analysis
  const failedTasks = tasks.filter(t => t.status === 'failed');
  if (failedTasks.length > 0) {
    improvements.push('Implement retry logic with exponential backoff for failed tasks.');
    improvements.push('Add pre-execution validation checks to catch issues early.');
  }
  
  // Based on task structure
  const longTasks = tasks.filter(t => t.estimatedDuration > 30);
  if (longTasks.length > 0) {
    improvements.push('Break down long-running tasks into smaller, more manageable units.');
  }
  
  // General improvements
  improvements.push('Consider adding checkpoints for long workflows to enable resume capability.');
  improvements.push('Implement parallel execution for independent tasks to reduce total duration.');
  
  return improvements.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Extracts lessons learned from execution
 */
function extractLessonsLearned(tasks: Task[]): string[] {
  const lessons: string[] = [];
  
  // Analyze patterns
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const fastTasks = completedTasks.filter(
    t => t.actualDuration && t.actualDuration < t.estimatedDuration
  );
  
  if (fastTasks.length > completedTasks.length / 2) {
    lessons.push('Task duration estimates were conservative - consider adjusting for future planning.');
  }
  
  // Check for dependency bottlenecks
  const maxDeps = Math.max(...tasks.map(t => t.dependencies.length));
  if (maxDeps > 2) {
    lessons.push('Complex dependency chains can create bottlenecks - design for parallelism when possible.');
  }
  
  // Success patterns
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const highPrioritySuccess = highPriorityTasks.filter(t => t.status === 'completed');
  if (highPrioritySuccess.length === highPriorityTasks.length) {
    lessons.push('Critical path tasks executed successfully - priority system is effective.');
  }
  
  // General lessons
  lessons.push('Continuous monitoring during execution enables faster issue detection.');
  lessons.push('Structured task decomposition improves overall workflow reliability.');
  
  return lessons.slice(0, 5);
}

/**
 * Generates a summary of the workflow execution
 */
function generateSummary(input: ReflectionInput, successRate: number): string {
  const { tasks, totalDuration, goalDescription } = input;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  
  let summary = `Workflow for "${goalDescription.slice(0, 50)}..." completed. `;
  summary += `${completed}/${tasks.length} tasks successful (${(successRate * 100).toFixed(0)}%). `;
  
  if (failed > 0) {
    summary += `${failed} task(s) failed. `;
  }
  
  summary += `Total execution time: ${totalDuration}s.`;
  
  return summary;
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
    phase: 'reflecting',
    message,
    details,
    level,
  };
}

export default {
  reflect,
};
