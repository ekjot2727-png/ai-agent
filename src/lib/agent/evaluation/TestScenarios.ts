/**
 * TestScenarios - Predefined Agent Test Scenarios
 * 
 * Provides test scenarios with:
 * - Goal
 * - Expected task complexity
 * - Expected workflow behavior
 * - Success criteria
 * 
 * Exposes function to auto-run scenarios.
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type ScenarioComplexity = 'simple' | 'moderate' | 'complex' | 'extreme';
export type ScenarioCategory = 'deployment' | 'data-pipeline' | 'infrastructure' | 'testing' | 'monitoring' | 'security' | 'general';

export interface ExpectedWorkflowBehavior {
  workflowType: string;
  minTasks: number;
  maxTasks: number;
  expectedPhases: string[];
  shouldSucceed: boolean;
  acceptableErrorRate: number;
  maxDuration: number; // in seconds
}

export interface SuccessCriteria {
  minScore: number;
  mustCompleteTasks: string[];
  requiredInsights: number;
  maxFailedTasks: number;
  requiredWorkflowMatch: boolean;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  complexity: ScenarioComplexity;
  goal: string;
  context?: string;
  expectedWorkflow: ExpectedWorkflowBehavior;
  successCriteria: SuccessCriteria;
  tags: string[];
  timeout: number; // in milliseconds
  enabled: boolean;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  timestamp: Date;
  passed: boolean;
  duration: number;
  score: number;
  criteriaResults: {
    scoreCheck: { passed: boolean; expected: number; actual: number };
    taskCountCheck: { passed: boolean; expected: string; actual: number };
    insightCheck: { passed: boolean; expected: number; actual: number };
    failedTasksCheck: { passed: boolean; maxAllowed: number; actual: number };
    workflowCheck: { passed: boolean; expected: string; actual: string };
  };
  executionSummary: string;
  errors: string[];
  logs: string[];
}

export interface ScenarioRunReport {
  id: string;
  timestamp: Date;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  totalDuration: number;
  results: ScenarioResult[];
  summary: string;
  recommendations: string[];
}

// =============================================================================
// Predefined Test Scenarios
// =============================================================================

export const PREDEFINED_SCENARIOS: TestScenario[] = [
  // ---------------------------------------------------------------------------
  // Simple Scenarios
  // ---------------------------------------------------------------------------
  {
    id: 'scenario-simple-deploy',
    name: 'Simple Web Deployment',
    description: 'Deploy a basic static website to a hosting platform',
    category: 'deployment',
    complexity: 'simple',
    goal: 'Deploy a static HTML website to Netlify',
    context: 'Single page website with CSS and JavaScript',
    expectedWorkflow: {
      workflowType: 'deployment',
      minTasks: 2,
      maxTasks: 5,
      expectedPhases: ['planning', 'executing', 'reflecting'],
      shouldSucceed: true,
      acceptableErrorRate: 0,
      maxDuration: 30,
    },
    successCriteria: {
      minScore: 70,
      mustCompleteTasks: [],
      requiredInsights: 1,
      maxFailedTasks: 0,
      requiredWorkflowMatch: false,
    },
    tags: ['deployment', 'web', 'simple'],
    timeout: 60000,
    enabled: true,
  },
  {
    id: 'scenario-simple-test',
    name: 'Basic Unit Testing',
    description: 'Run unit tests for a JavaScript function',
    category: 'testing',
    complexity: 'simple',
    goal: 'Run unit tests for a utility function',
    context: 'Jest test suite with 5 test cases',
    expectedWorkflow: {
      workflowType: 'testing',
      minTasks: 2,
      maxTasks: 4,
      expectedPhases: ['planning', 'executing', 'reflecting'],
      shouldSucceed: true,
      acceptableErrorRate: 0.1,
      maxDuration: 20,
    },
    successCriteria: {
      minScore: 65,
      mustCompleteTasks: [],
      requiredInsights: 1,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['testing', 'unit-test', 'simple'],
    timeout: 45000,
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Moderate Scenarios
  // ---------------------------------------------------------------------------
  {
    id: 'scenario-moderate-cicd',
    name: 'CI/CD Pipeline Setup',
    description: 'Set up a continuous integration pipeline with automated testing',
    category: 'deployment',
    complexity: 'moderate',
    goal: 'Create a CI/CD pipeline for a Node.js application with automated testing and deployment',
    context: 'Using GitHub Actions and deploying to AWS EC2',
    expectedWorkflow: {
      workflowType: 'cicd-pipeline',
      minTasks: 4,
      maxTasks: 8,
      expectedPhases: ['planning', 'executing', 'reflecting', 'optimizing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.15,
      maxDuration: 60,
    },
    successCriteria: {
      minScore: 75,
      mustCompleteTasks: [],
      requiredInsights: 2,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['cicd', 'deployment', 'moderate', 'github-actions'],
    timeout: 90000,
    enabled: true,
  },
  {
    id: 'scenario-moderate-monitoring',
    name: 'Application Monitoring Setup',
    description: 'Configure monitoring and alerting for a production application',
    category: 'monitoring',
    complexity: 'moderate',
    goal: 'Set up application monitoring with metrics, logs, and alerts',
    context: 'Using Prometheus, Grafana, and PagerDuty for a microservices app',
    expectedWorkflow: {
      workflowType: 'monitoring',
      minTasks: 4,
      maxTasks: 7,
      expectedPhases: ['planning', 'executing', 'reflecting'],
      shouldSucceed: true,
      acceptableErrorRate: 0.1,
      maxDuration: 45,
    },
    successCriteria: {
      minScore: 70,
      mustCompleteTasks: [],
      requiredInsights: 2,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['monitoring', 'observability', 'moderate'],
    timeout: 75000,
    enabled: true,
  },
  {
    id: 'scenario-moderate-data',
    name: 'Data Pipeline Creation',
    description: 'Build a data processing pipeline for analytics',
    category: 'data-pipeline',
    complexity: 'moderate',
    goal: 'Create a data pipeline to process and analyze user event data',
    context: 'ETL from PostgreSQL to data warehouse with transformation',
    expectedWorkflow: {
      workflowType: 'data-pipeline',
      minTasks: 4,
      maxTasks: 8,
      expectedPhases: ['planning', 'executing', 'reflecting'],
      shouldSucceed: true,
      acceptableErrorRate: 0.1,
      maxDuration: 50,
    },
    successCriteria: {
      minScore: 70,
      mustCompleteTasks: [],
      requiredInsights: 2,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['data', 'etl', 'analytics', 'moderate'],
    timeout: 80000,
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Complex Scenarios
  // ---------------------------------------------------------------------------
  {
    id: 'scenario-complex-infra',
    name: 'Infrastructure as Code',
    description: 'Provision cloud infrastructure using Terraform',
    category: 'infrastructure',
    complexity: 'complex',
    goal: 'Deploy a complete 3-tier architecture on AWS using Terraform with VPC, subnets, load balancer, auto-scaling, and RDS',
    context: 'Production environment with high availability requirements',
    expectedWorkflow: {
      workflowType: 'infrastructure',
      minTasks: 6,
      maxTasks: 12,
      expectedPhases: ['planning', 'executing', 'reflecting', 'optimizing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.2,
      maxDuration: 90,
    },
    successCriteria: {
      minScore: 75,
      mustCompleteTasks: [],
      requiredInsights: 3,
      maxFailedTasks: 2,
      requiredWorkflowMatch: false,
    },
    tags: ['infrastructure', 'terraform', 'aws', 'complex'],
    timeout: 120000,
    enabled: true,
  },
  {
    id: 'scenario-complex-security',
    name: 'Security Hardening',
    description: 'Implement comprehensive security measures for an application',
    category: 'security',
    complexity: 'complex',
    goal: 'Implement security best practices including secrets management, network policies, vulnerability scanning, and audit logging',
    context: 'Healthcare application with HIPAA compliance requirements',
    expectedWorkflow: {
      workflowType: 'security',
      minTasks: 6,
      maxTasks: 10,
      expectedPhases: ['planning', 'executing', 'reflecting', 'optimizing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.15,
      maxDuration: 75,
    },
    successCriteria: {
      minScore: 80,
      mustCompleteTasks: [],
      requiredInsights: 3,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['security', 'compliance', 'complex'],
    timeout: 100000,
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Extreme Scenarios
  // ---------------------------------------------------------------------------
  {
    id: 'scenario-extreme-migration',
    name: 'Full Stack Migration',
    description: 'Migrate a monolithic application to microservices',
    category: 'infrastructure',
    complexity: 'extreme',
    goal: 'Migrate a legacy monolithic e-commerce application to a microservices architecture with Kubernetes, service mesh, and distributed tracing',
    context: 'Production system with zero-downtime requirement, 1M daily users',
    expectedWorkflow: {
      workflowType: 'migration',
      minTasks: 8,
      maxTasks: 15,
      expectedPhases: ['planning', 'executing', 'reflecting', 'optimizing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.25,
      maxDuration: 120,
    },
    successCriteria: {
      minScore: 70,
      mustCompleteTasks: [],
      requiredInsights: 4,
      maxFailedTasks: 3,
      requiredWorkflowMatch: false,
    },
    tags: ['migration', 'microservices', 'kubernetes', 'extreme'],
    timeout: 180000,
    enabled: true,
  },
  {
    id: 'scenario-extreme-disaster-recovery',
    name: 'Disaster Recovery Implementation',
    description: 'Set up comprehensive disaster recovery with multi-region failover',
    category: 'infrastructure',
    complexity: 'extreme',
    goal: 'Implement disaster recovery with automated failover, data replication across regions, RTO < 15 minutes, RPO < 5 minutes',
    context: 'Financial services application with strict compliance requirements',
    expectedWorkflow: {
      workflowType: 'disaster-recovery',
      minTasks: 8,
      maxTasks: 14,
      expectedPhases: ['planning', 'executing', 'reflecting', 'optimizing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.2,
      maxDuration: 100,
    },
    successCriteria: {
      minScore: 75,
      mustCompleteTasks: [],
      requiredInsights: 4,
      maxFailedTasks: 2,
      requiredWorkflowMatch: false,
    },
    tags: ['disaster-recovery', 'high-availability', 'extreme'],
    timeout: 150000,
    enabled: true,
  },

  // ---------------------------------------------------------------------------
  // Edge Case Scenarios
  // ---------------------------------------------------------------------------
  {
    id: 'scenario-edge-ambiguous',
    name: 'Ambiguous Goal Handling',
    description: 'Test handling of an ambiguous or unclear goal',
    category: 'general',
    complexity: 'simple',
    goal: 'Make it better',
    context: 'No additional context provided',
    expectedWorkflow: {
      workflowType: 'generic',
      minTasks: 1,
      maxTasks: 4,
      expectedPhases: ['planning'],
      shouldSucceed: true,
      acceptableErrorRate: 0.5,
      maxDuration: 30,
    },
    successCriteria: {
      minScore: 50,
      mustCompleteTasks: [],
      requiredInsights: 0,
      maxFailedTasks: 2,
      requiredWorkflowMatch: false,
    },
    tags: ['edge-case', 'ambiguous'],
    timeout: 45000,
    enabled: true,
  },
  {
    id: 'scenario-edge-empty-context',
    name: 'No Context Handling',
    description: 'Test handling of a goal without any context',
    category: 'deployment',
    complexity: 'simple',
    goal: 'Deploy the application',
    expectedWorkflow: {
      workflowType: 'deployment',
      minTasks: 2,
      maxTasks: 5,
      expectedPhases: ['planning', 'executing'],
      shouldSucceed: true,
      acceptableErrorRate: 0.2,
      maxDuration: 30,
    },
    successCriteria: {
      minScore: 60,
      mustCompleteTasks: [],
      requiredInsights: 1,
      maxFailedTasks: 1,
      requiredWorkflowMatch: false,
    },
    tags: ['edge-case', 'no-context'],
    timeout: 50000,
    enabled: true,
  },
];

// =============================================================================
// TestScenarioRunner Class
// =============================================================================

export class TestScenarioRunner {
  private scenarios: Map<string, TestScenario> = new Map();
  private results: ScenarioResult[] = [];
  private reports: ScenarioRunReport[] = [];

  constructor() {
    // Load predefined scenarios
    for (const scenario of PREDEFINED_SCENARIOS) {
      this.scenarios.set(scenario.id, scenario);
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario Management
  // ---------------------------------------------------------------------------

  addScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  removeScenario(scenarioId: string): boolean {
    return this.scenarios.delete(scenarioId);
  }

  getScenario(scenarioId: string): TestScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  getAllScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values());
  }

  getEnabledScenarios(): TestScenario[] {
    return this.getAllScenarios().filter(s => s.enabled);
  }

  getScenariosByCategory(category: ScenarioCategory): TestScenario[] {
    return this.getAllScenarios().filter(s => s.category === category);
  }

  getScenariosByComplexity(complexity: ScenarioComplexity): TestScenario[] {
    return this.getAllScenarios().filter(s => s.complexity === complexity);
  }

  enableScenario(scenarioId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.enabled = true;
    }
  }

  disableScenario(scenarioId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.enabled = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario Execution (Simulated)
  // ---------------------------------------------------------------------------

  /**
   * Run a single scenario and return the result
   */
  async runScenario(
    scenarioId: string,
    executor?: (goal: string, context?: string) => Promise<any>
  ): Promise<ScenarioResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const startTime = Date.now();
    const logs: string[] = [];
    const errors: string[] = [];

    logs.push(`Starting scenario: ${scenario.name}`);
    logs.push(`Complexity: ${scenario.complexity}`);
    logs.push(`Goal: ${scenario.goal}`);

    let executionResult: any = null;

    try {
      if (executor) {
        // Run with provided executor
        executionResult = await Promise.race([
          executor(scenario.goal, scenario.context),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scenario timeout')), scenario.timeout)
          ),
        ]);
      } else {
        // Simulate execution
        executionResult = this.simulateExecution(scenario);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Unknown error');
    }

    const duration = Date.now() - startTime;
    const criteriaResults = this.evaluateCriteria(scenario, executionResult);
    const passed = this.determinePass(criteriaResults);
    const score = this.calculateScenarioScore(criteriaResults);

    logs.push(`Execution completed in ${duration}ms`);
    logs.push(`Score: ${score}`);
    logs.push(`Passed: ${passed}`);

    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      timestamp: new Date(),
      passed,
      duration,
      score,
      criteriaResults,
      executionSummary: this.generateExecutionSummary(scenario, passed, score),
      errors,
      logs,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run all enabled scenarios
   */
  async runAllScenarios(
    executor?: (goal: string, context?: string) => Promise<any>
  ): Promise<ScenarioRunReport> {
    const enabledScenarios = this.getEnabledScenarios();
    const startTime = Date.now();
    const results: ScenarioResult[] = [];
    let skipped = 0;

    for (const scenario of enabledScenarios) {
      try {
        const result = await this.runScenario(scenario.id, executor);
        results.push(result);
      } catch (err) {
        skipped++;
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    const report: ScenarioRunReport = {
      id: uuidv4(),
      timestamp: new Date(),
      totalScenarios: enabledScenarios.length,
      passedScenarios: passed,
      failedScenarios: failed,
      skippedScenarios: skipped,
      totalDuration,
      results,
      summary: this.generateReportSummary(passed, failed, skipped, totalDuration),
      recommendations: this.generateRecommendations(results),
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Run scenarios by category
   */
  async runScenariosByCategory(
    category: ScenarioCategory,
    executor?: (goal: string, context?: string) => Promise<any>
  ): Promise<ScenarioRunReport> {
    const scenarios = this.getScenariosByCategory(category).filter(s => s.enabled);
    const startTime = Date.now();
    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario.id, executor);
      results.push(result);
    }

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      id: uuidv4(),
      timestamp: new Date(),
      totalScenarios: scenarios.length,
      passedScenarios: passed,
      failedScenarios: failed,
      skippedScenarios: 0,
      totalDuration,
      results,
      summary: `Category '${category}': ${passed}/${scenarios.length} passed`,
      recommendations: this.generateRecommendations(results),
    };
  }

  // ---------------------------------------------------------------------------
  // Simulation & Evaluation
  // ---------------------------------------------------------------------------

  private simulateExecution(scenario: TestScenario): any {
    const expected = scenario.expectedWorkflow;
    const success = Math.random() > (1 - (expected.shouldSucceed ? 0.9 : 0.3));
    const taskCount = Math.floor(Math.random() * (expected.maxTasks - expected.minTasks + 1)) + expected.minTasks;
    const failedTasks = success ? 0 : Math.floor(Math.random() * 2) + 1;

    return {
      success,
      plan: {
        tasks: Array(taskCount).fill(null).map((_, i) => ({
          id: `task-${i + 1}`,
          title: `Task ${i + 1}`,
          description: `Description for task ${i + 1}`,
          type: 'generic',
          priority: i === 0 ? 'high' : 'medium',
          estimatedDuration: 10 + i * 5,
        })),
        workflow: {
          id: expected.workflowType,
          name: expected.workflowType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          confidence: 0.85,
        },
      },
      execution: {
        success,
        completedTasks: taskCount - failedTasks,
        failedTasks,
        totalTasks: taskCount,
        duration: Math.floor(Math.random() * expected.maxDuration * 0.8) + expected.maxDuration * 0.2,
        errors: failedTasks > 0 ? ['Simulated error'] : [],
      },
      reflection: {
        score: success ? 75 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 30),
        insights: Array(success ? 3 : 1).fill(null).map((_, i) => ({
          type: 'performance',
          title: `Insight ${i + 1}`,
          description: `Simulated insight ${i + 1}`,
        })),
        improvements: ['Simulated improvement'],
      },
    };
  }

  private evaluateCriteria(scenario: TestScenario, result: any): ScenarioResult['criteriaResults'] {
    const criteria = scenario.successCriteria;
    const expected = scenario.expectedWorkflow;

    const actualScore = result?.reflection?.score || 0;
    const actualTasks = result?.plan?.tasks?.length || 0;
    const actualInsights = result?.reflection?.insights?.length || 0;
    const actualFailedTasks = result?.execution?.failedTasks || 0;
    const actualWorkflow = result?.plan?.workflow?.id || 'unknown';

    return {
      scoreCheck: {
        passed: actualScore >= criteria.minScore,
        expected: criteria.minScore,
        actual: actualScore,
      },
      taskCountCheck: {
        passed: actualTasks >= expected.minTasks && actualTasks <= expected.maxTasks,
        expected: `${expected.minTasks}-${expected.maxTasks}`,
        actual: actualTasks,
      },
      insightCheck: {
        passed: actualInsights >= criteria.requiredInsights,
        expected: criteria.requiredInsights,
        actual: actualInsights,
      },
      failedTasksCheck: {
        passed: actualFailedTasks <= criteria.maxFailedTasks,
        maxAllowed: criteria.maxFailedTasks,
        actual: actualFailedTasks,
      },
      workflowCheck: {
        passed: !criteria.requiredWorkflowMatch || actualWorkflow === expected.workflowType,
        expected: expected.workflowType,
        actual: actualWorkflow,
      },
    };
  }

  private determinePass(criteriaResults: ScenarioResult['criteriaResults']): boolean {
    return (
      criteriaResults.scoreCheck.passed &&
      criteriaResults.taskCountCheck.passed &&
      criteriaResults.failedTasksCheck.passed
    );
  }

  private calculateScenarioScore(criteriaResults: ScenarioResult['criteriaResults']): number {
    let score = 0;
    if (criteriaResults.scoreCheck.passed) score += 30;
    if (criteriaResults.taskCountCheck.passed) score += 25;
    if (criteriaResults.insightCheck.passed) score += 20;
    if (criteriaResults.failedTasksCheck.passed) score += 15;
    if (criteriaResults.workflowCheck.passed) score += 10;
    return score;
  }

  private generateExecutionSummary(scenario: TestScenario, passed: boolean, score: number): string {
    return `Scenario '${scenario.name}' (${scenario.complexity}): ${passed ? 'PASSED' : 'FAILED'} with score ${score}/100`;
  }

  private generateReportSummary(passed: number, failed: number, skipped: number, duration: number): string {
    const total = passed + failed + skipped;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return `Test run completed: ${passed}/${total} passed (${passRate}%) in ${duration}ms. ${failed} failed, ${skipped} skipped.`;
  }

  private generateRecommendations(results: ScenarioResult[]): string[] {
    const recommendations: string[] = [];
    const failed = results.filter(r => !r.passed);

    if (failed.length === 0) {
      recommendations.push('All scenarios passed! Consider adding more complex test cases.');
      return recommendations;
    }

    // Analyze failure patterns
    const scoreFailures = failed.filter(r => !r.criteriaResults.scoreCheck.passed);
    const taskFailures = failed.filter(r => !r.criteriaResults.failedTasksCheck.passed);

    if (scoreFailures.length > 0) {
      recommendations.push('Improve overall execution quality to meet minimum score requirements');
    }

    if (taskFailures.length > 0) {
      recommendations.push('Enhance error handling to reduce task failures');
    }

    return recommendations;
  }

  // ---------------------------------------------------------------------------
  // Results & Reports
  // ---------------------------------------------------------------------------

  getResults(): ScenarioResult[] {
    return [...this.results];
  }

  getRecentResults(limit: number = 10): ScenarioResult[] {
    return this.results.slice(-limit);
  }

  getReports(): ScenarioRunReport[] {
    return [...this.reports];
  }

  getLatestReport(): ScenarioRunReport | undefined {
    return this.reports[this.reports.length - 1];
  }

  clearResults(): void {
    this.results = [];
  }

  clearReports(): void {
    this.reports = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let scenarioRunnerInstance: TestScenarioRunner | null = null;

export function getTestScenarioRunner(): TestScenarioRunner {
  if (!scenarioRunnerInstance) {
    scenarioRunnerInstance = new TestScenarioRunner();
  }
  return scenarioRunnerInstance;
}

export function resetTestScenarioRunner(): void {
  scenarioRunnerInstance = null;
}
