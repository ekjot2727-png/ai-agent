/**
 * PlannerAgent - Breaks down goals into structured task steps
 * Responsible for goal decomposition and task prioritization
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentContext, ReasoningStep } from './BaseAgent';

// ============================================================================
// Types
// ============================================================================

export interface PlannedTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  estimatedDuration: number; // seconds
  dependencies: string[]; // task IDs
  reasoning: string;
  subtasks?: PlannedTask[];
}

export type TaskType = 
  | 'data-processing'
  | 'api-call'
  | 'file-operation'
  | 'computation'
  | 'validation'
  | 'transformation'
  | 'notification'
  | 'deployment'
  | 'testing'
  | 'monitoring'
  | 'cleanup'
  | 'generic';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskPlan {
  planId: string;
  goalId: string;
  goal: string;
  tasks: PlannedTask[];
  totalEstimatedDuration: number;
  complexity: 'simple' | 'moderate' | 'complex';
  reasoning: {
    steps: ReasoningStep[];
    summary: string;
    totalConfidence: number;
  };
  createdAt: Date;
}

// ============================================================================
// PlannerAgent Class
// ============================================================================

export class PlannerAgent extends BaseAgent {
  private taskTemplates: Map<string, Partial<PlannedTask>>;

  constructor() {
    super('planner', 'PlannerAgent');
    this.taskTemplates = this.initializeTaskTemplates();
  }

  // --------------------------------------------------------------------------
  // Main Processing
  // --------------------------------------------------------------------------

  async process(context: AgentContext): Promise<TaskPlan> {
    this.reset();
    this.isActive = true;
    this.info('Starting goal decomposition', { goal: context.goal });

    try {
      // Phase 1: Observe and understand the goal
      await this.observeGoal(context);

      // Phase 2: Analyze requirements
      await this.analyzeRequirements(context);

      // Phase 3: Generate tasks
      const tasks = await this.generateTasks(context);

      // Phase 4: Prioritize and order tasks
      const orderedTasks = this.prioritizeTasks(tasks);

      // Phase 5: Create final plan
      const plan = this.createPlan(context, orderedTasks);

      this.info('Goal decomposition complete', { 
        taskCount: plan.tasks.length,
        complexity: plan.complexity 
      });

      return plan;
    } finally {
      this.isActive = false;
    }
  }

  validateInput(context: AgentContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!context.goal || context.goal.trim().length < 5) {
      errors.push('Goal must be at least 5 characters long');
    }

    if (context.goal && context.goal.length > 2000) {
      errors.push('Goal exceeds maximum length of 2000 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --------------------------------------------------------------------------
  // Planning Phases
  // --------------------------------------------------------------------------

  private async observeGoal(context: AgentContext): Promise<void> {
    await this.simulateThinking(50, 150);

    this.observe(`Received goal: "${context.goal}"`, 0.95);
    
    // Extract key elements
    const keywords = this.extractKeyElements(context.goal);
    this.observe(`Identified key elements: ${keywords.join(', ')}`, 0.9);

    // Check for context
    if (context.userContext) {
      this.observe(`Additional context provided: "${context.userContext}"`, 0.85);
    }

    // Check for previous results that might inform planning
    if (context.previousResults) {
      this.observe('Previous execution results available for reference', 0.8);
    }
  }

  private async analyzeRequirements(context: AgentContext): Promise<void> {
    await this.simulateThinking(100, 200);

    // Determine goal category
    const category = this.categorizeGoal(context.goal);
    this.think(`Goal appears to be related to: ${category}`, 0.85);

    // Estimate complexity
    const complexity = this.estimateComplexity(context.goal);
    this.analyze(`Estimated complexity: ${complexity}`, 0.8);

    // Identify potential challenges
    const challenges = this.identifyChallenges(context.goal);
    if (challenges.length > 0) {
      this.analyze(`Potential challenges identified: ${challenges.join('; ')}`, 0.75);
    }

    // Determine required task types
    const requiredTypes = this.determineRequiredTaskTypes(context.goal);
    this.analyze(`Required task types: ${requiredTypes.join(', ')}`, 0.85);
  }

  private async generateTasks(context: AgentContext): Promise<PlannedTask[]> {
    await this.simulateThinking(150, 300);

    const tasks: PlannedTask[] = [];
    const goal = context.goal.toLowerCase();

    // Decision: How to break down the goal
    this.decide('Breaking goal into sequential task phases', 0.9);

    // Generate tasks based on goal analysis
    const taskSpecs = this.analyzeGoalForTasks(context.goal);

    for (const spec of taskSpecs) {
      const task = this.createTask(spec);
      tasks.push(task);
      this.act(`Created task: ${task.title}`, 0.9);
    }

    // Add validation task if needed
    if (this.needsValidation(context.goal)) {
      tasks.push(this.createTask({
        title: 'Validate Results',
        description: 'Verify that all operations completed successfully and outputs are correct',
        type: 'validation',
        priority: 'high',
        estimatedDuration: 15,
      }));
    }

    // Add cleanup task if needed
    if (this.needsCleanup(context.goal)) {
      tasks.push(this.createTask({
        title: 'Cleanup Resources',
        description: 'Release temporary resources and clean up intermediate artifacts',
        type: 'cleanup',
        priority: 'low',
        estimatedDuration: 10,
      }));
    }

    return tasks;
  }

  private prioritizeTasks(tasks: PlannedTask[]): PlannedTask[] {
    // Sort by priority, then by dependencies
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return tasks.sort((a, b) => {
      // Tasks with dependencies should come after their dependencies
      if (a.dependencies.includes(b.id)) return 1;
      if (b.dependencies.includes(a.id)) return -1;

      // Otherwise sort by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private createPlan(context: AgentContext, tasks: PlannedTask[]): TaskPlan {
    const totalDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    const complexity = this.calculatePlanComplexity(tasks);

    this.decide(`Final plan created with ${tasks.length} tasks, complexity: ${complexity}`, 0.95);

    return {
      planId: uuidv4(),
      goalId: uuidv4(),
      goal: context.goal,
      tasks,
      totalEstimatedDuration: totalDuration,
      complexity,
      reasoning: {
        steps: this.getReasoning(),
        summary: this.generatePlanSummary(tasks, complexity),
        totalConfidence: this.calculateConfidence(),
      },
      createdAt: new Date(),
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private extractKeyElements(goal: string): string[] {
    const elements: string[] = [];
    const goalLower = goal.toLowerCase();

    const keywords = [
      'data', 'api', 'deploy', 'test', 'build', 'create', 'update', 'delete',
      'pipeline', 'workflow', 'automate', 'monitor', 'analyze', 'transform',
      'validate', 'notify', 'schedule', 'backup', 'restore', 'migrate',
      'integrate', 'sync', 'process', 'generate', 'report', 'export', 'import'
    ];

    for (const keyword of keywords) {
      if (goalLower.includes(keyword)) {
        elements.push(keyword);
      }
    }

    return elements.length > 0 ? elements : ['generic-task'];
  }

  private categorizeGoal(goal: string): string {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('data') || goalLower.includes('etl') || goalLower.includes('pipeline')) {
      return 'Data Processing';
    }
    if (goalLower.includes('deploy') || goalLower.includes('release') || goalLower.includes('ci/cd')) {
      return 'Deployment & CI/CD';
    }
    if (goalLower.includes('api') || goalLower.includes('endpoint') || goalLower.includes('service')) {
      return 'API & Services';
    }
    if (goalLower.includes('test') || goalLower.includes('quality') || goalLower.includes('validate')) {
      return 'Testing & QA';
    }
    if (goalLower.includes('monitor') || goalLower.includes('alert') || goalLower.includes('log')) {
      return 'Monitoring & Observability';
    }
    if (goalLower.includes('automate') || goalLower.includes('workflow') || goalLower.includes('schedule')) {
      return 'Automation';
    }

    return 'General Operations';
  }

  private estimateComplexity(goal: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = goal.split(/\s+/).length;
    const hasMultipleVerbs = (goal.match(/\b(create|build|deploy|test|validate|update|delete|transform|analyze)\b/gi) || []).length > 2;
    const hasConditionals = /if|when|unless|otherwise|depending/i.test(goal);

    if (wordCount > 50 || hasConditionals || hasMultipleVerbs) {
      return 'complex';
    }
    if (wordCount > 20 || hasMultipleVerbs) {
      return 'moderate';
    }
    return 'simple';
  }

  private identifyChallenges(goal: string): string[] {
    const challenges: string[] = [];
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('real-time') || goalLower.includes('realtime')) {
      challenges.push('Requires real-time processing');
    }
    if (goalLower.includes('large') || goalLower.includes('scale') || goalLower.includes('million')) {
      challenges.push('May involve large data volumes');
    }
    if (goalLower.includes('external') || goalLower.includes('third-party')) {
      challenges.push('Depends on external services');
    }
    if (goalLower.includes('secure') || goalLower.includes('encrypt') || goalLower.includes('auth')) {
      challenges.push('Security considerations required');
    }

    return challenges;
  }

  private determineRequiredTaskTypes(goal: string): TaskType[] {
    const types: TaskType[] = [];
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('data') || goalLower.includes('process') || goalLower.includes('etl')) {
      types.push('data-processing');
    }
    if (goalLower.includes('api') || goalLower.includes('fetch') || goalLower.includes('request')) {
      types.push('api-call');
    }
    if (goalLower.includes('file') || goalLower.includes('read') || goalLower.includes('write')) {
      types.push('file-operation');
    }
    if (goalLower.includes('transform') || goalLower.includes('convert')) {
      types.push('transformation');
    }
    if (goalLower.includes('deploy') || goalLower.includes('release')) {
      types.push('deployment');
    }
    if (goalLower.includes('test') || goalLower.includes('verify')) {
      types.push('testing');
    }
    if (goalLower.includes('monitor') || goalLower.includes('track')) {
      types.push('monitoring');
    }

    return types.length > 0 ? types : ['generic'];
  }

  private analyzeGoalForTasks(goal: string): Partial<PlannedTask>[] {
    const specs: Partial<PlannedTask>[] = [];
    const goalLower = goal.toLowerCase();

    // Initialize/Setup task
    specs.push({
      title: 'Initialize Environment',
      description: 'Set up necessary configurations and validate prerequisites',
      type: 'generic',
      priority: 'high',
      estimatedDuration: 10,
    });

    // Data-related tasks
    if (goalLower.includes('data') || goalLower.includes('pipeline')) {
      specs.push({
        title: 'Configure Data Sources',
        description: 'Set up connections to data sources and validate access',
        type: 'data-processing',
        priority: 'high',
        estimatedDuration: 20,
      });
      specs.push({
        title: 'Process Data',
        description: 'Execute data transformation and processing logic',
        type: 'data-processing',
        priority: 'critical',
        estimatedDuration: 45,
      });
    }

    // API-related tasks
    if (goalLower.includes('api') || goalLower.includes('service') || goalLower.includes('endpoint')) {
      specs.push({
        title: 'Configure API Endpoints',
        description: 'Set up API connections and authentication',
        type: 'api-call',
        priority: 'high',
        estimatedDuration: 15,
      });
      specs.push({
        title: 'Execute API Operations',
        description: 'Perform the required API calls and handle responses',
        type: 'api-call',
        priority: 'critical',
        estimatedDuration: 30,
      });
    }

    // Deployment tasks
    if (goalLower.includes('deploy') || goalLower.includes('release') || goalLower.includes('ci')) {
      specs.push({
        title: 'Build Artifacts',
        description: 'Compile and package deployment artifacts',
        type: 'deployment',
        priority: 'critical',
        estimatedDuration: 60,
      });
      specs.push({
        title: 'Deploy to Environment',
        description: 'Execute deployment to target environment',
        type: 'deployment',
        priority: 'critical',
        estimatedDuration: 45,
      });
    }

    // Testing tasks
    if (goalLower.includes('test') || goalLower.includes('validate') || goalLower.includes('verify')) {
      specs.push({
        title: 'Run Tests',
        description: 'Execute test suite and collect results',
        type: 'testing',
        priority: 'high',
        estimatedDuration: 30,
      });
    }

    // Monitoring tasks
    if (goalLower.includes('monitor') || goalLower.includes('alert') || goalLower.includes('track')) {
      specs.push({
        title: 'Setup Monitoring',
        description: 'Configure monitoring dashboards and alerts',
        type: 'monitoring',
        priority: 'medium',
        estimatedDuration: 25,
      });
    }

    // Automation tasks
    if (goalLower.includes('automate') || goalLower.includes('schedule') || goalLower.includes('workflow')) {
      specs.push({
        title: 'Configure Automation',
        description: 'Set up workflow automation and scheduling',
        type: 'generic',
        priority: 'high',
        estimatedDuration: 35,
      });
    }

    // Generic processing if nothing specific matched
    if (specs.length === 1) {
      specs.push({
        title: 'Execute Main Operation',
        description: `Perform the primary operation: ${goal.slice(0, 100)}`,
        type: 'generic',
        priority: 'critical',
        estimatedDuration: 40,
      });
    }

    // Finalization task
    specs.push({
      title: 'Finalize and Report',
      description: 'Generate execution report and notify stakeholders',
      type: 'notification',
      priority: 'medium',
      estimatedDuration: 10,
    });

    return specs;
  }

  private createTask(spec: Partial<PlannedTask>): PlannedTask {
    return {
      id: uuidv4(),
      title: spec.title || 'Unnamed Task',
      description: spec.description || '',
      type: spec.type || 'generic',
      priority: spec.priority || 'medium',
      estimatedDuration: spec.estimatedDuration || 30,
      dependencies: spec.dependencies || [],
      reasoning: `Task created based on goal analysis: ${spec.title}`,
      subtasks: spec.subtasks,
    };
  }

  private needsValidation(goal: string): boolean {
    return /data|deploy|critical|important|production/i.test(goal);
  }

  private needsCleanup(goal: string): boolean {
    return /temporary|cache|build|compile/i.test(goal);
  }

  private calculatePlanComplexity(tasks: PlannedTask[]): 'simple' | 'moderate' | 'complex' {
    if (tasks.length <= 3) return 'simple';
    if (tasks.length <= 6) return 'moderate';
    return 'complex';
  }

  private generatePlanSummary(tasks: PlannedTask[], complexity: string): string {
    const criticalCount = tasks.filter(t => t.priority === 'critical').length;
    const totalDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    
    return `Generated ${tasks.length} tasks with ${complexity} complexity. ` +
           `${criticalCount} critical tasks identified. ` +
           `Estimated total duration: ${totalDuration} seconds.`;
  }

  private initializeTaskTemplates(): Map<string, Partial<PlannedTask>> {
    const templates = new Map<string, Partial<PlannedTask>>();

    templates.set('data-ingest', {
      title: 'Data Ingestion',
      type: 'data-processing',
      priority: 'high',
      estimatedDuration: 30,
    });

    templates.set('api-setup', {
      title: 'API Configuration',
      type: 'api-call',
      priority: 'high',
      estimatedDuration: 15,
    });

    templates.set('deploy-prod', {
      title: 'Production Deployment',
      type: 'deployment',
      priority: 'critical',
      estimatedDuration: 60,
    });

    return templates;
  }
}
