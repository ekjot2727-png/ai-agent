/**
 * AutoOpsAgent - Oumi-Style Autonomous AI Agent
 * 
 * A goal-driven agent that:
 * 1. Accepts a user goal as input
 * 2. Reasons about the goal with explainable logic
 * 3. Breaks it into structured tasks
 * 4. Decides which workflow to trigger
 * 5. Generates a reflection summary
 * 
 * All reasoning is explainable and logged for transparency.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface AgentGoal {
  id: string;
  description: string;
  context?: string;
  constraints?: string[];
  createdAt: Date;
}

export interface ReasoningStep {
  id: string;
  timestamp: Date;
  type: 'observation' | 'thought' | 'analysis' | 'decision' | 'action';
  content: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface StructuredTask {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'transformation' | 'integration' | 'validation' | 'execution';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: number; // seconds
  dependencies: string[];
  inputs: string[];
  expectedOutputs: string[];
  reasoning: string;
}

export interface ExecutionPlan {
  id: string;
  goalId: string;
  tasks: StructuredTask[];
  workflow: WorkflowDecision;
  reasoning: ReasoningChain;
  createdAt: Date;
  estimatedTotalDuration: number;
}

export interface WorkflowDecision {
  workflowId: string;
  workflowName: string;
  reason: string;
  confidence: number;
  alternatives: { id: string; name: string; reason: string }[];
}

export interface ReasoningChain {
  steps: ReasoningStep[];
  summary: string;
  totalConfidence: number;
}

export interface ExecutionResult {
  planId: string;
  success: boolean;
  completedTasks: string[];
  failedTasks: string[];
  outputs: Record<string, unknown>;
  duration: number;
  errors: string[];
}

export interface ReflectionSummary {
  id: string;
  planId: string;
  goalAchieved: boolean;
  successRate: number;
  score: number; // 0-100
  summary: string;
  insights: string[];
  improvements: string[];
  lessonsLearned: string[];
  reasoning: ReasoningChain;
  generatedAt: Date;
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warning' | 'error';
  phase: 'planning' | 'executing' | 'reflecting' | 'idle';
  message: string;
  reasoning?: ReasoningStep;
  data?: Record<string, unknown>;
}

export interface AgentConfig {
  verboseLogging: boolean;
  maxReasoningDepth: number;
  confidenceThreshold: number;
  enableReflection: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: AgentConfig = {
  verboseLogging: true,
  maxReasoningDepth: 10,
  confidenceThreshold: 0.6,
  enableReflection: true,
};

const WORKFLOW_TEMPLATES = {
  'data-pipeline': {
    id: 'data-pipeline',
    name: 'Data Pipeline Workflow',
    keywords: ['data', 'etl', 'pipeline', 'extract', 'transform', 'load', 'analytics'],
    description: 'For data extraction, transformation, and loading operations',
  },
  'ci-cd': {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    keywords: ['deploy', 'build', 'test', 'ci', 'cd', 'release', 'automation'],
    description: 'For continuous integration and deployment workflows',
  },
  'analysis': {
    id: 'analysis',
    name: 'Analysis Workflow',
    keywords: ['analyze', 'report', 'insight', 'feedback', 'review', 'assess', 'evaluate'],
    description: 'For data analysis and report generation',
  },
  'integration': {
    id: 'integration',
    name: 'Integration Workflow',
    keywords: ['integrate', 'api', 'connect', 'sync', 'webhook', 'service'],
    description: 'For system integration and API connections',
  },
  'general': {
    id: 'general',
    name: 'General Workflow',
    keywords: [],
    description: 'General purpose task execution workflow',
  },
};

// ============================================================================
// AutoOpsAgent Class
// ============================================================================

export class AutoOpsAgent {
  private config: AgentConfig;
  private logs: AgentLog[] = [];
  private onLogCallback?: (log: AgentLog) => void;

  constructor(config: Partial<AgentConfig> = {}, onLog?: (log: AgentLog) => void) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onLogCallback = onLog;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Plans a goal by reasoning about it and breaking it into structured tasks.
   * Returns an execution plan with full reasoning chain.
   */
  async planGoal(goal: string, context?: string): Promise<ExecutionPlan> {
    const startTime = Date.now();
    this.log('info', 'planning', `Starting goal planning: "${goal.slice(0, 50)}..."`);

    // Create goal object
    const agentGoal: AgentGoal = {
      id: uuidv4(),
      description: goal,
      context,
      createdAt: new Date(),
    };

    // Step 1: Reason about the goal
    const reasoningChain = await this.reasonAboutGoal(agentGoal);
    this.log('info', 'planning', `Reasoning complete with ${reasoningChain.steps.length} steps`);

    // Step 2: Break into structured tasks
    const tasks = await this.decomposeIntoTasks(agentGoal, reasoningChain);
    this.log('info', 'planning', `Decomposed into ${tasks.length} tasks`);

    // Step 3: Decide workflow
    const workflow = await this.decideWorkflow(agentGoal, tasks);
    this.log('info', 'planning', `Selected workflow: ${workflow.workflowName}`);

    // Create execution plan
    const plan: ExecutionPlan = {
      id: uuidv4(),
      goalId: agentGoal.id,
      tasks,
      workflow,
      reasoning: reasoningChain,
      createdAt: new Date(),
      estimatedTotalDuration: tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
    };

    const duration = Date.now() - startTime;
    this.log('info', 'planning', `Planning complete in ${duration}ms`, { planId: plan.id });

    return plan;
  }

  /**
   * Executes a plan by running all tasks in sequence.
   * Returns execution results with success/failure details.
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.log('info', 'executing', `Starting plan execution: ${plan.id}`);

    const completedTasks: string[] = [];
    const failedTasks: string[] = [];
    const outputs: Record<string, unknown> = {};
    const errors: string[] = [];

    // Execute tasks in order (respecting dependencies)
    const orderedTasks = this.topologicalSort(plan.tasks);

    for (const task of orderedTasks) {
      // Check dependencies
      const depsComplete = task.dependencies.every(dep => completedTasks.includes(dep));
      
      if (!depsComplete) {
        this.log('warning', 'executing', `Skipping task "${task.title}" - dependencies not met`);
        failedTasks.push(task.id);
        errors.push(`Task "${task.title}" skipped: dependencies not satisfied`);
        continue;
      }

      // Execute task
      const result = await this.executeTask(task);
      
      if (result.success) {
        completedTasks.push(task.id);
        outputs[task.id] = result.output;
        this.log('info', 'executing', `Task completed: "${task.title}"`);
      } else {
        failedTasks.push(task.id);
        errors.push(result.error || `Task "${task.title}" failed`);
        this.log('error', 'executing', `Task failed: "${task.title}"`, { error: result.error });
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const success = failedTasks.length === 0;

    this.log(
      success ? 'info' : 'warning',
      'executing',
      `Execution complete: ${completedTasks.length}/${orderedTasks.length} tasks successful`
    );

    return {
      planId: plan.id,
      success,
      completedTasks,
      failedTasks,
      outputs,
      duration,
      errors,
    };
  }

  /**
   * Reflects on the plan and execution results.
   * Generates insights and improvement suggestions.
   */
  async reflect(plan: ExecutionPlan, result: ExecutionResult): Promise<ReflectionSummary> {
    this.log('info', 'reflecting', 'Starting reflection phase');

    // Build reasoning chain for reflection
    const reasoningChain = await this.reasonAboutResults(plan, result);

    // Calculate metrics
    const successRate = result.completedTasks.length / plan.tasks.length;
    const goalAchieved = successRate >= 0.8;
    const score = this.calculateScore(plan, result);

    // Generate insights
    const insights = this.generateInsights(plan, result, reasoningChain);
    const improvements = this.generateImprovements(plan, result);
    const lessonsLearned = this.generateLessons(plan, result);

    // Create summary
    const summary = this.generateSummary(plan, result, goalAchieved);

    const reflection: ReflectionSummary = {
      id: uuidv4(),
      planId: plan.id,
      goalAchieved,
      successRate,
      score,
      summary,
      insights,
      improvements,
      lessonsLearned,
      reasoning: reasoningChain,
      generatedAt: new Date(),
    };

    this.log('info', 'reflecting', `Reflection complete. Score: ${score}/100`);

    return reflection;
  }

  /**
   * Returns all logged reasoning and actions
   */
  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  /**
   * Clears the log history
   */
  clearLogs(): void {
    this.logs = [];
  }

  // ==========================================================================
  // Reasoning Engine
  // ==========================================================================

  private async reasonAboutGoal(goal: AgentGoal): Promise<ReasoningChain> {
    const steps: ReasoningStep[] = [];

    // Step 1: Observation
    steps.push(this.createReasoningStep(
      'observation',
      `Received goal: "${goal.description}"`,
      0.95
    ));

    // Step 2: Initial Analysis
    const keywords = this.extractKeywords(goal.description);
    steps.push(this.createReasoningStep(
      'analysis',
      `Identified key concepts: ${keywords.join(', ')}`,
      0.85,
      { keywords }
    ));

    // Step 3: Domain Classification
    const domain = this.classifyDomain(goal.description);
    steps.push(this.createReasoningStep(
      'thought',
      `This goal appears to be in the ${domain} domain`,
      0.8,
      { domain }
    ));

    // Step 4: Complexity Assessment
    const complexity = this.assessComplexity(goal.description);
    steps.push(this.createReasoningStep(
      'analysis',
      `Complexity assessment: ${complexity.level} (${complexity.factors.join(', ')})`,
      0.75,
      { complexity }
    ));

    // Step 5: Approach Decision
    const approach = this.decideApproach(domain, complexity);
    steps.push(this.createReasoningStep(
      'decision',
      `Selected approach: ${approach}`,
      0.85
    ));

    // Step 6: Action Plan
    steps.push(this.createReasoningStep(
      'action',
      'Proceeding to decompose goal into structured tasks',
      0.9
    ));

    const totalConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    return {
      steps,
      summary: `Analyzed goal in ${domain} domain with ${complexity.level} complexity. Using ${approach} approach.`,
      totalConfidence,
    };
  }

  private async reasonAboutResults(plan: ExecutionPlan, result: ExecutionResult): Promise<ReasoningChain> {
    const steps: ReasoningStep[] = [];

    // Observe results
    steps.push(this.createReasoningStep(
      'observation',
      `Execution completed: ${result.completedTasks.length}/${plan.tasks.length} tasks successful`,
      0.95
    ));

    // Analyze success/failure patterns
    if (result.failedTasks.length > 0) {
      const failedTaskTitles = plan.tasks
        .filter(t => result.failedTasks.includes(t.id))
        .map(t => t.title);
      
      steps.push(this.createReasoningStep(
        'analysis',
        `Failed tasks: ${failedTaskTitles.join(', ')}`,
        0.85,
        { failedTasks: failedTaskTitles, errors: result.errors }
      ));
    }

    // Evaluate efficiency
    const expectedDuration = plan.estimatedTotalDuration;
    const efficiency = expectedDuration > 0 ? expectedDuration / Math.max(result.duration, 1) : 1;
    steps.push(this.createReasoningStep(
      'analysis',
      `Time efficiency: ${(efficiency * 100).toFixed(0)}% (expected: ${expectedDuration}s, actual: ${result.duration}s)`,
      0.8,
      { efficiency, expectedDuration, actualDuration: result.duration }
    ));

    // Draw conclusions
    const successRate = result.completedTasks.length / plan.tasks.length;
    steps.push(this.createReasoningStep(
      'thought',
      successRate >= 0.9
        ? 'Excellent execution with high success rate'
        : successRate >= 0.7
        ? 'Good execution with room for improvement'
        : 'Execution encountered significant issues',
      0.85
    ));

    // Decision for future
    steps.push(this.createReasoningStep(
      'decision',
      this.decideFutureAction(successRate, efficiency),
      0.8
    ));

    const totalConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    return {
      steps,
      summary: `Execution analysis complete. Success rate: ${(successRate * 100).toFixed(0)}%, Efficiency: ${(efficiency * 100).toFixed(0)}%`,
      totalConfidence,
    };
  }

  private createReasoningStep(
    type: ReasoningStep['type'],
    content: string,
    confidence: number,
    metadata?: Record<string, unknown>
  ): ReasoningStep {
    const step: ReasoningStep = {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      content,
      confidence,
      metadata,
    };

    if (this.config.verboseLogging) {
      this.log('debug', 'planning', `[${type.toUpperCase()}] ${content}`, { reasoning: step });
    }

    return step;
  }

  // ==========================================================================
  // Task Decomposition
  // ==========================================================================

  private async decomposeIntoTasks(goal: AgentGoal, reasoning: ReasoningChain): Promise<StructuredTask[]> {
    const domain = this.classifyDomain(goal.description);
    const templates = this.getTaskTemplates(domain);
    
    const tasks: StructuredTask[] = templates.map((template, index) => {
      const task: StructuredTask = {
        id: uuidv4(),
        title: template.title,
        description: this.customizeDescription(template.description, goal.description),
        type: template.type,
        priority: this.calculatePriority(index, templates.length),
        estimatedDuration: template.estimatedDuration,
        dependencies: index > 0 ? [templates[index - 1].title] : [],
        inputs: template.inputs,
        expectedOutputs: template.outputs,
        reasoning: `This task is necessary for ${goal.description.slice(0, 30)}... - ${template.rationale}`,
      };
      return task;
    });

    // Fix dependencies to use IDs
    for (let i = 1; i < tasks.length; i++) {
      tasks[i].dependencies = [tasks[i - 1].id];
    }

    return tasks;
  }

  private getTaskTemplates(domain: string): Array<{
    title: string;
    description: string;
    type: StructuredTask['type'];
    estimatedDuration: number;
    inputs: string[];
    outputs: string[];
    rationale: string;
  }> {
    type TaskTemplate = {
      title: string;
      description: string;
      type: StructuredTask['type'];
      estimatedDuration: number;
      inputs: string[];
      outputs: string[];
      rationale: string;
    };

    const templates: Record<string, TaskTemplate[]> = {
      data: [
        { title: 'Analyze Data Requirements', description: 'Identify data sources, formats, and quality requirements', type: 'analysis', estimatedDuration: 20, inputs: ['goal specification'], outputs: ['requirements document'], rationale: 'Understanding data needs is fundamental' },
        { title: 'Design Data Schema', description: 'Create data models and transformation rules', type: 'analysis', estimatedDuration: 25, inputs: ['requirements document'], outputs: ['schema definition'], rationale: 'A clear schema ensures consistent processing' },
        { title: 'Extract Source Data', description: 'Pull data from identified sources', type: 'execution', estimatedDuration: 30, inputs: ['schema definition', 'source credentials'], outputs: ['raw data'], rationale: 'Data extraction is the first step in any pipeline' },
        { title: 'Transform Data', description: 'Apply transformations and validations', type: 'transformation', estimatedDuration: 35, inputs: ['raw data', 'schema definition'], outputs: ['transformed data'], rationale: 'Transformation ensures data quality' },
        { title: 'Load to Destination', description: 'Store processed data in target system', type: 'execution', estimatedDuration: 20, inputs: ['transformed data'], outputs: ['loaded data confirmation'], rationale: 'Loading completes the ETL process' },
        { title: 'Validate Results', description: 'Verify data integrity and completeness', type: 'validation', estimatedDuration: 15, inputs: ['loaded data confirmation'], outputs: ['validation report'], rationale: 'Validation ensures successful completion' },
      ],
      automation: [
        { title: 'Define Automation Scope', description: 'Identify processes to automate and success criteria', type: 'analysis', estimatedDuration: 20, inputs: ['goal specification'], outputs: ['automation scope'], rationale: 'Clear scope prevents scope creep' },
        { title: 'Design Automation Flow', description: 'Create workflow diagram and decision logic', type: 'analysis', estimatedDuration: 25, inputs: ['automation scope'], outputs: ['flow design'], rationale: 'Design before implementation reduces errors' },
        { title: 'Implement Core Logic', description: 'Build the automation scripts and handlers', type: 'execution', estimatedDuration: 40, inputs: ['flow design'], outputs: ['automation code'], rationale: 'Core logic is the heart of automation' },
        { title: 'Add Error Handling', description: 'Implement retry logic and failure notifications', type: 'execution', estimatedDuration: 25, inputs: ['automation code'], outputs: ['robust automation'], rationale: 'Error handling ensures reliability' },
        { title: 'Test Automation', description: 'Run tests in isolated environment', type: 'validation', estimatedDuration: 30, inputs: ['robust automation'], outputs: ['test results'], rationale: 'Testing prevents production issues' },
        { title: 'Deploy and Document', description: 'Deploy to production and create documentation', type: 'execution', estimatedDuration: 20, inputs: ['test results', 'robust automation'], outputs: ['deployed automation', 'documentation'], rationale: 'Documentation enables maintenance' },
      ],
      analysis: [
        { title: 'Gather Source Data', description: 'Collect data from all relevant sources', type: 'execution', estimatedDuration: 25, inputs: ['data sources'], outputs: ['raw dataset'], rationale: 'Complete data ensures accurate analysis' },
        { title: 'Clean and Preprocess', description: 'Handle missing values, outliers, and formatting', type: 'transformation', estimatedDuration: 30, inputs: ['raw dataset'], outputs: ['clean dataset'], rationale: 'Clean data produces reliable insights' },
        { title: 'Perform Analysis', description: 'Apply statistical methods and algorithms', type: 'analysis', estimatedDuration: 35, inputs: ['clean dataset'], outputs: ['analysis results'], rationale: 'Analysis extracts meaningful patterns' },
        { title: 'Generate Visualizations', description: 'Create charts, graphs, and dashboards', type: 'transformation', estimatedDuration: 25, inputs: ['analysis results'], outputs: ['visualizations'], rationale: 'Visualizations communicate findings effectively' },
        { title: 'Extract Insights', description: 'Identify key findings and recommendations', type: 'analysis', estimatedDuration: 20, inputs: ['analysis results', 'visualizations'], outputs: ['insights document'], rationale: 'Insights drive decision-making' },
        { title: 'Create Report', description: 'Compile final report with all findings', type: 'execution', estimatedDuration: 20, inputs: ['insights document', 'visualizations'], outputs: ['final report'], rationale: 'Reports document and share results' },
      ],
      integration: [
        { title: 'Map Integration Points', description: 'Identify all systems and their interfaces', type: 'analysis', estimatedDuration: 25, inputs: ['system documentation'], outputs: ['integration map'], rationale: 'Mapping prevents missed connections' },
        { title: 'Review API Documentation', description: 'Study available APIs and their capabilities', type: 'analysis', estimatedDuration: 20, inputs: ['api documentation'], outputs: ['api assessment'], rationale: 'Understanding APIs enables proper integration' },
        { title: 'Implement Authentication', description: 'Set up secure authentication flows', type: 'execution', estimatedDuration: 30, inputs: ['api assessment', 'credentials'], outputs: ['auth implementation'], rationale: 'Security is fundamental for integrations' },
        { title: 'Build Integration Logic', description: 'Create data mapping and transformation logic', type: 'execution', estimatedDuration: 35, inputs: ['integration map', 'auth implementation'], outputs: ['integration code'], rationale: 'Logic connects the systems effectively' },
        { title: 'Handle Edge Cases', description: 'Implement error handling and edge case logic', type: 'execution', estimatedDuration: 25, inputs: ['integration code'], outputs: ['robust integration'], rationale: 'Edge cases cause production failures' },
        { title: 'Test End-to-End', description: 'Verify complete integration flow', type: 'validation', estimatedDuration: 25, inputs: ['robust integration'], outputs: ['test report'], rationale: 'E2E testing validates the full flow' },
      ],
    };

    return templates[domain] || templates.automation;
  }

  // ==========================================================================
  // Workflow Decision
  // ==========================================================================

  private async decideWorkflow(goal: AgentGoal, tasks: StructuredTask[]): Promise<WorkflowDecision> {
    const goalLower = goal.description.toLowerCase();
    const scores: Array<{ id: string; name: string; score: number; reason: string }> = [];

    for (const [id, workflow] of Object.entries(WORKFLOW_TEMPLATES)) {
      if (id === 'general') continue;
      
      const keywordMatches = workflow.keywords.filter(k => goalLower.includes(k)).length;
      const score = keywordMatches / Math.max(workflow.keywords.length, 1);
      
      if (score > 0) {
        scores.push({
          id,
          name: workflow.name,
          score,
          reason: `Matched keywords: ${workflow.keywords.filter(k => goalLower.includes(k)).join(', ')}`,
        });
      }
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Select best or default to general
    const selected = scores[0] || {
      id: 'general',
      name: WORKFLOW_TEMPLATES.general.name,
      score: 0.5,
      reason: 'No specific workflow matched; using general workflow',
    };

    return {
      workflowId: selected.id,
      workflowName: selected.name,
      reason: selected.reason,
      confidence: Math.min(selected.score + 0.3, 0.95),
      alternatives: scores.slice(1, 3).map(s => ({
        id: s.id,
        name: s.name,
        reason: s.reason,
      })),
    };
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  private async executeTask(task: StructuredTask): Promise<{ success: boolean; output?: unknown; error?: string }> {
    // Simulate task execution with realistic timing
    const executionTime = task.estimatedDuration * 100; // Convert to smaller time for demo
    
    await this.sleep(Math.min(executionTime, 2000)); // Cap at 2 seconds for demo

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        output: {
          taskId: task.id,
          title: task.title,
          completedAt: new Date().toISOString(),
          outputs: task.expectedOutputs,
        },
      };
    } else {
      return {
        success: false,
        error: `Simulated failure in task: ${task.title}`,
      };
    }
  }

  private topologicalSort(tasks: StructuredTask[]): StructuredTask[] {
    const sorted: StructuredTask[] = [];
    const visited = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (task: StructuredTask) => {
      if (visited.has(task.id)) return;
      visited.add(task.id);

      for (const depId of task.dependencies) {
        const dep = taskMap.get(depId);
        if (dep) visit(dep);
      }

      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }

    return sorted;
  }

  // ==========================================================================
  // Reflection Helpers
  // ==========================================================================

  private calculateScore(plan: ExecutionPlan, result: ExecutionResult): number {
    let score = 0;

    // Success rate (60% weight)
    const successRate = result.completedTasks.length / plan.tasks.length;
    score += successRate * 60;

    // Time efficiency (25% weight)
    const expectedDuration = plan.estimatedTotalDuration;
    if (result.duration <= expectedDuration) {
      score += 25;
    } else if (result.duration <= expectedDuration * 1.5) {
      score += 15;
    } else {
      score += 5;
    }

    // No errors bonus (15% weight)
    if (result.errors.length === 0) {
      score += 15;
    } else if (result.errors.length <= 2) {
      score += 8;
    }

    return Math.round(Math.min(score, 100));
  }

  private generateInsights(plan: ExecutionPlan, result: ExecutionResult, reasoning: ReasoningChain): string[] {
    const insights: string[] = [];

    const successRate = result.completedTasks.length / plan.tasks.length;

    if (successRate >= 0.9) {
      insights.push('Excellent execution with high reliability across all task types.');
    } else if (successRate >= 0.7) {
      insights.push('Good overall execution with some areas needing attention.');
    } else {
      insights.push('Significant issues detected that require investigation.');
    }

    if (result.failedTasks.length > 0) {
      const failedTypes = plan.tasks
        .filter(t => result.failedTasks.includes(t.id))
        .map(t => t.type);
      const uniqueTypes = Array.from(new Set(failedTypes));
      insights.push(`Failed task types: ${uniqueTypes.join(', ')} - consider adding retry logic.`);
    }

    if (result.duration < plan.estimatedTotalDuration) {
      insights.push('Tasks completed faster than estimated - consider tightening estimates.');
    }

    insights.push(`Reasoning confidence: ${(reasoning.totalConfidence * 100).toFixed(0)}% - ${
      reasoning.totalConfidence > 0.8 ? 'high confidence in decisions' : 'consider gathering more context'
    }`);

    return insights;
  }

  private generateImprovements(plan: ExecutionPlan, result: ExecutionResult): string[] {
    const improvements: string[] = [];

    if (result.failedTasks.length > 0) {
      improvements.push('Implement automatic retry with exponential backoff for failed tasks.');
      improvements.push('Add pre-execution validation to catch issues early.');
    }

    const longTasks = plan.tasks.filter(t => t.estimatedDuration > 30);
    if (longTasks.length > 0) {
      improvements.push('Break down long-running tasks into smaller, more manageable units.');
    }

    if (plan.tasks.length > 8) {
      improvements.push('Consider parallel execution for independent tasks to reduce total duration.');
    }

    improvements.push('Add checkpointing for long workflows to enable resume capability.');

    return improvements.slice(0, 5);
  }

  private generateLessons(plan: ExecutionPlan, result: ExecutionResult): string[] {
    const lessons: string[] = [];

    if (result.success) {
      lessons.push('Structured task decomposition leads to more predictable outcomes.');
    }

    const criticalTasks = plan.tasks.filter(t => t.priority === 'critical' || t.priority === 'high');
    const criticalSuccess = criticalTasks.filter(t => result.completedTasks.includes(t.id));
    if (criticalSuccess.length === criticalTasks.length) {
      lessons.push('Prioritizing critical tasks ensures core functionality is delivered.');
    }

    if (plan.reasoning.totalConfidence > 0.8) {
      lessons.push('High-confidence reasoning correlates with better execution outcomes.');
    }

    lessons.push('Continuous monitoring and logging enables faster issue detection.');
    lessons.push('Explainable AI decisions build trust and enable debugging.');

    return lessons.slice(0, 5);
  }

  private generateSummary(plan: ExecutionPlan, result: ExecutionResult, goalAchieved: boolean): string {
    const successRate = ((result.completedTasks.length / plan.tasks.length) * 100).toFixed(0);
    
    return goalAchieved
      ? `Goal achieved successfully. ${result.completedTasks.length}/${plan.tasks.length} tasks completed (${successRate}%) in ${result.duration}s using ${plan.workflow.workflowName}.`
      : `Goal partially achieved. ${result.completedTasks.length}/${plan.tasks.length} tasks completed (${successRate}%) with ${result.errors.length} error(s). Review failed tasks for remediation.`;
  }

  private decideFutureAction(successRate: number, efficiency: number): string {
    if (successRate >= 0.9 && efficiency >= 1) {
      return 'Maintain current approach - high success rate and efficiency';
    } else if (successRate >= 0.9) {
      return 'Optimize for speed - success rate is high but timing can improve';
    } else if (successRate >= 0.7) {
      return 'Focus on reliability - investigate and fix failing tasks';
    } else {
      return 'Major review needed - consider redesigning task breakdown';
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'for', 'to', 'of', 'in', 'on', 'with', 'that', 'this', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  private classifyDomain(description: string): string {
    const lower = description.toLowerCase();
    
    if (/data|etl|pipeline|analytics|database|query|extract|transform|load/.test(lower)) {
      return 'data';
    }
    if (/deploy|build|test|ci|cd|release|automat/.test(lower)) {
      return 'automation';
    }
    if (/analy|report|insight|feedback|review|assess|evaluat/.test(lower)) {
      return 'analysis';
    }
    if (/integrat|api|connect|sync|webhook|service/.test(lower)) {
      return 'integration';
    }
    
    return 'automation'; // default
  }

  private assessComplexity(description: string): { level: string; factors: string[] } {
    const factors: string[] = [];
    const words = description.split(/\s+/).length;

    if (words > 20) factors.push('verbose description');
    if (/multiple|several|many|all/.test(description.toLowerCase())) factors.push('multiple items');
    if (/complex|advanced|sophisticated/.test(description.toLowerCase())) factors.push('explicit complexity');
    if (/integrate|connect|sync/.test(description.toLowerCase())) factors.push('integration required');
    if (/real-time|realtime|streaming/.test(description.toLowerCase())) factors.push('real-time processing');

    const level = factors.length >= 3 ? 'high' : factors.length >= 1 ? 'medium' : 'low';

    return { level, factors: factors.length > 0 ? factors : ['standard task'] };
  }

  private decideApproach(domain: string, complexity: { level: string }): string {
    const approaches: Record<string, Record<string, string>> = {
      data: {
        low: 'Simple ETL with direct processing',
        medium: 'Staged ETL with validation checkpoints',
        high: 'Distributed ETL with parallel processing',
      },
      automation: {
        low: 'Linear automation with basic error handling',
        medium: 'Modular automation with retry logic',
        high: 'Orchestrated automation with circuit breakers',
      },
      analysis: {
        low: 'Direct analysis with standard methods',
        medium: 'Multi-stage analysis with validation',
        high: 'Advanced analysis with ML techniques',
      },
      integration: {
        low: 'Point-to-point integration',
        medium: 'API gateway with transformation layer',
        high: 'Event-driven integration with message queues',
      },
    };

    return approaches[domain]?.[complexity.level] || 'Standard structured approach';
  }

  private calculatePriority(index: number, total: number): StructuredTask['priority'] {
    if (index === 0) return 'critical';
    if (index === total - 1) return 'high';
    if (index < total / 3) return 'high';
    if (index < (total * 2) / 3) return 'medium';
    return 'low';
  }

  private customizeDescription(template: string, goal: string): string {
    const context = goal.split(' ').slice(0, 6).join(' ');
    return `${template} (Context: ${context}...)`;
  }

  private log(
    level: AgentLog['level'],
    phase: AgentLog['phase'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    const log: AgentLog = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      phase,
      message,
      data,
    };

    this.logs.push(log);
    this.onLogCallback?.(log);

    if (this.config.verboseLogging) {
      const prefix = `[${level.toUpperCase()}][${phase}]`;
      console.log(`${prefix} ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAutoOpsAgent(
  config?: Partial<AgentConfig>,
  onLog?: (log: AgentLog) => void
): AutoOpsAgent {
  return new AutoOpsAgent(config, onLog);
}

export default AutoOpsAgent;
