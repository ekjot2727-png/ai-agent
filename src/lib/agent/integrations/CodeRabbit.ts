/**
 * CodeRabbit Integration - Simulated AI Code Review
 * Generates intelligent code review feedback after execution
 */

import { v4 as uuidv4 } from 'uuid';
import { TaskPlan, PlannedTask } from '../agents/PlannerAgent';
import { ExecutionResult, TaskExecution } from '../agents/ExecutorAgent';
import { ReflectionResult } from '../agents/ReflectionAgent';

// ============================================================================
// Types
// ============================================================================

export interface CodeReviewInsight {
  id: string;
  category: 'quality' | 'performance' | 'security' | 'maintainability' | 'best-practice';
  severity: 'info' | 'suggestion' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  affectedTasks: string[];
  confidence: number;
  codeExample?: {
    before: string;
    after: string;
    language: string;
  };
}

export interface SecurityConsideration {
  id: string;
  type: 'vulnerability' | 'exposure' | 'compliance' | 'authentication' | 'data-handling';
  risk: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  mitigation: string;
  references: string[];
}

export interface PerformanceRecommendation {
  id: string;
  type: 'caching' | 'parallelization' | 'optimization' | 'resource-usage' | 'latency';
  impact: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  expectedImprovement: string;
  implementationEffort: 'trivial' | 'easy' | 'moderate' | 'complex';
}

export interface CodeQualitySuggestion {
  id: string;
  type: 'naming' | 'structure' | 'documentation' | 'testing' | 'error-handling' | 'typing';
  title: string;
  description: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CodeRabbitReview {
  reviewId: string;
  timestamp: Date;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  insights: CodeReviewInsight[];
  securityConsiderations: SecurityConsideration[];
  performanceRecommendations: PerformanceRecommendation[];
  codeQualitySuggestions: CodeQualitySuggestion[];
  agentNarrative: string;
  metrics: {
    totalIssues: number;
    criticalIssues: number;
    securityIssues: number;
    performanceIssues: number;
    qualityIssues: number;
  };
}

// ============================================================================
// CodeRabbit Class
// ============================================================================

export class CodeRabbit {
  private readonly ANALYSIS_PATTERNS = {
    quality: [
      'error handling', 'input validation', 'code structure', 'naming conventions',
      'documentation', 'type safety', 'modularity', 'testability'
    ],
    performance: [
      'caching opportunities', 'parallelization', 'memory usage', 'database queries',
      'API calls', 'loop optimization', 'lazy loading', 'batch processing'
    ],
    security: [
      'authentication', 'authorization', 'data encryption', 'input sanitization',
      'secure storage', 'API security', 'dependency vulnerabilities', 'logging'
    ]
  };

  // --------------------------------------------------------------------------
  // Main Review Generation
  // --------------------------------------------------------------------------

  generateReview(
    plan: TaskPlan,
    execution: ExecutionResult,
    reflection?: ReflectionResult
  ): CodeRabbitReview {
    const insights = this.generateInsights(plan, execution);
    const security = this.generateSecurityConsiderations(plan, execution);
    const performance = this.generatePerformanceRecommendations(plan, execution);
    const quality = this.generateQualitySuggestions(plan, execution);

    const score = this.calculateOverallScore(insights, security, performance, quality, execution);
    const grade = this.calculateGrade(score);
    const summary = this.generateSummary(plan, execution, score, insights, security);
    const narrative = this.generateAgentNarrative(plan, execution, reflection, score);

    return {
      reviewId: uuidv4(),
      timestamp: new Date(),
      overallScore: score,
      grade,
      summary,
      insights,
      securityConsiderations: security,
      performanceRecommendations: performance,
      codeQualitySuggestions: quality,
      agentNarrative: narrative,
      metrics: {
        totalIssues: insights.length + security.length + performance.length + quality.length,
        criticalIssues: insights.filter(i => i.severity === 'critical').length + 
                       security.filter(s => s.risk === 'critical').length,
        securityIssues: security.length,
        performanceIssues: performance.length,
        qualityIssues: quality.length,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Insight Generation
  // --------------------------------------------------------------------------

  private generateInsights(plan: TaskPlan, execution: ExecutionResult): CodeReviewInsight[] {
    const insights: CodeReviewInsight[] = [];

    // Analyze task structure
    if (plan.tasks.length > 8) {
      insights.push({
        id: uuidv4(),
        category: 'maintainability',
        severity: 'suggestion',
        title: 'Consider Task Decomposition',
        description: `The workflow contains ${plan.tasks.length} tasks which may indicate high complexity.`,
        recommendation: 'Consider breaking down into smaller, more focused sub-workflows for better maintainability.',
        affectedTasks: plan.tasks.slice(5).map(t => t.id),
        confidence: 0.78,
      });
    }

    // Check for failed tasks and provide insights
    const failedTasks = execution.taskExecutions.filter(t => t.status === 'failed');
    if (failedTasks.length > 0) {
      insights.push({
        id: uuidv4(),
        category: 'quality',
        severity: 'warning',
        title: 'Error Handling Review Needed',
        description: `${failedTasks.length} task(s) failed during execution, indicating potential error handling gaps.`,
        recommendation: 'Implement comprehensive try-catch blocks and add specific error recovery logic for each task type.',
        affectedTasks: failedTasks.map(t => t.taskId),
        confidence: 0.85,
        codeExample: {
          before: 'await executeTask(task);',
          after: `try {
  await executeTask(task);
} catch (error) {
  await handleTaskError(error, task);
  await executeRecoveryPlan(task);
}`,
          language: 'typescript',
        },
      });
    }

    // Check execution time patterns
    const avgDuration = execution.totalDuration / execution.taskExecutions.length;
    const slowTasks = execution.taskExecutions.filter(t => (t.duration || 0) > avgDuration * 2);
    if (slowTasks.length > 0) {
      insights.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'suggestion',
        title: 'Optimize Slow Tasks',
        description: `${slowTasks.length} task(s) took significantly longer than average execution time.`,
        recommendation: 'Profile these tasks to identify bottlenecks. Consider caching, async operations, or algorithm optimization.',
        affectedTasks: slowTasks.map(t => t.taskId),
        confidence: 0.72,
      });
    }

    // Check for sequential patterns that could be parallelized
    const independentTasks = plan.tasks.filter(t => 
      !t.dependencies || t.dependencies.length === 0
    );
    if (independentTasks.length >= 3) {
      insights.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'suggestion',
        title: 'Parallelization Opportunity',
        description: `${independentTasks.length} tasks have no dependencies and could potentially run in parallel.`,
        recommendation: 'Implement Promise.all() or worker pools to execute independent tasks concurrently.',
        affectedTasks: independentTasks.map(t => t.id),
        confidence: 0.75,
        codeExample: {
          before: `for (const task of tasks) {
  await executeTask(task);
}`,
          after: `const independentTasks = tasks.filter(t => !t.dependencies.length);
await Promise.all(independentTasks.map(t => executeTask(t)));`,
          language: 'typescript',
        },
      });
    }

    // Add best practice insights
    insights.push({
      id: uuidv4(),
      category: 'best-practice',
      severity: 'info',
      title: 'Logging Enhancement',
      description: 'Comprehensive logging helps with debugging and monitoring.',
      recommendation: 'Add structured logging with correlation IDs for tracing workflow execution across tasks.',
      affectedTasks: [],
      confidence: 0.9,
    });

    return insights;
  }

  // --------------------------------------------------------------------------
  // Security Analysis
  // --------------------------------------------------------------------------

  private generateSecurityConsiderations(
    plan: TaskPlan,
    execution: ExecutionResult
  ): SecurityConsideration[] {
    const considerations: SecurityConsideration[] = [];

    // Check for data handling tasks
    const dataHandlingTasks = plan.tasks.filter(t => 
      t.title.toLowerCase().includes('data') ||
      t.description.toLowerCase().includes('data') ||
      t.description.toLowerCase().includes('user')
    );

    if (dataHandlingTasks.length > 0) {
      considerations.push({
        id: uuidv4(),
        type: 'data-handling',
        risk: 'medium',
        title: 'Data Protection Review',
        description: `${dataHandlingTasks.length} task(s) handle data operations. Ensure proper data protection measures.`,
        mitigation: 'Implement data encryption at rest and in transit. Apply data masking for sensitive fields. Follow GDPR/privacy compliance guidelines.',
        references: ['OWASP Data Protection', 'GDPR Article 32'],
      });
    }

    // Check for API/integration tasks
    const apiTasks = plan.tasks.filter(t => 
      t.type === 'api-call' || 
      t.title.toLowerCase().includes('api') ||
      t.description.toLowerCase().includes('external')
    );

    if (apiTasks.length > 0) {
      considerations.push({
        id: uuidv4(),
        type: 'authentication',
        risk: 'high',
        title: 'API Security Check',
        description: `${apiTasks.length} task(s) involve API operations. Verify authentication and authorization.`,
        mitigation: 'Use OAuth 2.0 or API keys stored in secure vaults. Implement rate limiting and request validation. Use HTTPS for all external calls.',
        references: ['OWASP API Security Top 10', 'OAuth 2.0 Best Practices'],
      });
    }

    // General security consideration
    considerations.push({
      id: uuidv4(),
      type: 'vulnerability',
      risk: 'low',
      title: 'Dependency Security',
      description: 'Regularly audit dependencies for known vulnerabilities.',
      mitigation: 'Run npm audit or similar tools regularly. Keep dependencies updated. Use lock files to ensure consistent versions.',
      references: ['npm audit', 'Snyk Security'],
    });

    // Input validation
    if (execution.errors.length > 0) {
      considerations.push({
        id: uuidv4(),
        type: 'exposure',
        risk: 'medium',
        title: 'Input Validation Strengthening',
        description: 'Errors during execution may indicate insufficient input validation.',
        mitigation: 'Implement strict input validation at workflow entry points. Use schema validation (Zod, Joi). Sanitize all user inputs.',
        references: ['OWASP Input Validation', 'CWE-20'],
      });
    }

    return considerations;
  }

  // --------------------------------------------------------------------------
  // Performance Recommendations
  // --------------------------------------------------------------------------

  private generatePerformanceRecommendations(
    plan: TaskPlan,
    execution: ExecutionResult
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Check total execution time
    if (execution.totalDuration > 5000) {
      recommendations.push({
        id: uuidv4(),
        type: 'caching',
        impact: 'high',
        title: 'Implement Result Caching',
        description: `Total execution time of ${(execution.totalDuration / 1000).toFixed(1)}s could benefit from caching.`,
        expectedImprovement: '40-60% reduction in execution time for repeated operations',
        implementationEffort: 'moderate',
      });
    }

    // Check for similar tasks
    const taskTypes = plan.tasks.map(t => t.type);
    const duplicateTypes = taskTypes.filter((t, i) => taskTypes.indexOf(t) !== i);
    if (duplicateTypes.length > 0) {
      recommendations.push({
        id: uuidv4(),
        type: 'optimization',
        impact: 'medium',
        title: 'Batch Similar Operations',
        description: 'Multiple tasks of the same type could be batched for efficiency.',
        expectedImprovement: '20-30% reduction in overhead from batching similar operations',
        implementationEffort: 'easy',
      });
    }

    // Parallel execution opportunity
    recommendations.push({
      id: uuidv4(),
      type: 'parallelization',
      impact: 'high',
      title: 'Enable Task Parallelization',
      description: 'Independent tasks can run in parallel to reduce total execution time.',
      expectedImprovement: 'Up to 50% reduction when tasks can run concurrently',
      implementationEffort: 'moderate',
    });

    // Resource optimization
    if (plan.tasks.length > 5) {
      recommendations.push({
        id: uuidv4(),
        type: 'resource-usage',
        impact: 'medium',
        title: 'Implement Resource Pooling',
        description: 'Use connection pooling and resource reuse across tasks.',
        expectedImprovement: '15-25% reduction in resource allocation overhead',
        implementationEffort: 'moderate',
      });
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Code Quality Suggestions
  // --------------------------------------------------------------------------

  private generateQualitySuggestions(
    plan: TaskPlan,
    execution: ExecutionResult
  ): CodeQualitySuggestion[] {
    const suggestions: CodeQualitySuggestion[] = [];

    // Documentation suggestion
    suggestions.push({
      id: uuidv4(),
      type: 'documentation',
      title: 'Add Workflow Documentation',
      description: 'Document the workflow purpose, inputs, outputs, and expected behavior.',
      suggestion: 'Create README with workflow diagram, task descriptions, and configuration options.',
      priority: 'medium',
    });

    // Error handling
    if (execution.errors.length > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'error-handling',
        title: 'Implement Comprehensive Error Handling',
        description: 'Add specific error types and recovery strategies.',
        suggestion: 'Create custom error classes. Implement error boundaries. Add retry logic with exponential backoff.',
        priority: 'high',
      });
    }

    // Testing suggestion
    suggestions.push({
      id: uuidv4(),
      type: 'testing',
      title: 'Add Unit and Integration Tests',
      description: 'Ensure workflow reliability with comprehensive testing.',
      suggestion: 'Create unit tests for each task. Add integration tests for workflow. Implement mock services for external dependencies.',
      priority: 'high',
    });

    // Type safety
    suggestions.push({
      id: uuidv4(),
      type: 'typing',
      title: 'Strengthen Type Definitions',
      description: 'Use strict TypeScript types for all workflow data.',
      suggestion: 'Define interfaces for task inputs/outputs. Use discriminated unions for status. Enable strict TypeScript mode.',
      priority: 'medium',
    });

    // Structure
    if (plan.tasks.length > 6) {
      suggestions.push({
        id: uuidv4(),
        type: 'structure',
        title: 'Consider Modular Architecture',
        description: 'Large workflows benefit from modular organization.',
        suggestion: 'Group related tasks into sub-workflows. Create reusable task templates. Implement plugin architecture for extensibility.',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  // --------------------------------------------------------------------------
  // Scoring & Summary
  // --------------------------------------------------------------------------

  private calculateOverallScore(
    insights: CodeReviewInsight[],
    security: SecurityConsideration[],
    performance: PerformanceRecommendation[],
    quality: CodeQualitySuggestion[],
    execution: ExecutionResult
  ): number {
    let score = 100;

    // Deduct for critical insights
    score -= insights.filter(i => i.severity === 'critical').length * 15;
    score -= insights.filter(i => i.severity === 'warning').length * 5;

    // Deduct for security issues
    score -= security.filter(s => s.risk === 'critical').length * 20;
    score -= security.filter(s => s.risk === 'high').length * 10;
    score -= security.filter(s => s.risk === 'medium').length * 5;

    // Deduct for high impact performance issues
    score -= performance.filter(p => p.impact === 'high').length * 5;

    // Deduct for high priority quality issues
    score -= quality.filter(q => q.priority === 'high').length * 3;

    // Bonus for successful execution
    if (execution.success) score += 5;
    score += (execution.completedTasks / execution.taskExecutions.length) * 10;

    return Math.max(Math.min(Math.round(score), 100), 0);
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateSummary(
    plan: TaskPlan,
    execution: ExecutionResult,
    score: number,
    insights: CodeReviewInsight[],
    security: SecurityConsideration[]
  ): string {
    const parts: string[] = [];

    parts.push(`CodeRabbit analyzed the "${plan.tasks[0]?.title || 'workflow'}" workflow with ${plan.tasks.length} tasks.`);
    
    if (score >= 80) {
      parts.push(`Overall quality is good (${score}/100).`);
    } else if (score >= 60) {
      parts.push(`Quality score of ${score}/100 indicates room for improvement.`);
    } else {
      parts.push(`Quality score of ${score}/100 suggests significant improvements needed.`);
    }

    const criticalCount = insights.filter(i => i.severity === 'critical').length +
                         security.filter(s => s.risk === 'critical' || s.risk === 'high').length;
    
    if (criticalCount > 0) {
      parts.push(`Found ${criticalCount} critical issue(s) requiring attention.`);
    }

    if (execution.failedTasks > 0) {
      parts.push(`${execution.failedTasks} task(s) failed - review error handling.`);
    }

    return parts.join(' ');
  }

  // --------------------------------------------------------------------------
  // Agent Narrative
  // --------------------------------------------------------------------------

  private generateAgentNarrative(
    plan: TaskPlan,
    execution: ExecutionResult,
    reflection?: ReflectionResult,
    score?: number
  ): string {
    const narrativeParts: string[] = [];

    // Opening - confident analytical tone
    narrativeParts.push(
      `I've completed a comprehensive analysis of this workflow execution.`
    );

    // Execution assessment
    if (execution.success) {
      narrativeParts.push(
        `The execution completed successfully with ${execution.completedTasks} of ${execution.taskExecutions.length} tasks finished.`
      );
    } else {
      narrativeParts.push(
        `The execution encountered ${execution.failedTasks} failure(s). I've identified the root causes and generated recovery plans.`
      );
    }

    // Performance insight
    const avgDuration = Math.round(execution.totalDuration / execution.taskExecutions.length);
    narrativeParts.push(
      `Average task duration was ${avgDuration}ms. ${avgDuration < 300 ? 'This is within optimal range.' : 'Consider optimization for faster execution.'}`
    );

    // Learning-based insight
    if (reflection) {
      narrativeParts.push(
        `Based on my reflection analysis, I scored this execution at ${reflection.score}/100 (${reflection.grade}).`
      );
    }

    // Forward-looking recommendation
    narrativeParts.push(
      `For future runs, I recommend focusing on the critical security and performance items identified in this review.`
    );

    return narrativeParts.join(' ');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let codeRabbitInstance: CodeRabbit | null = null;

export function getCodeRabbit(): CodeRabbit {
  if (!codeRabbitInstance) {
    codeRabbitInstance = new CodeRabbit();
  }
  return codeRabbitInstance;
}

export function resetCodeRabbit(): void {
  codeRabbitInstance = null;
}
