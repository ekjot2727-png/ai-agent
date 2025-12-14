/**
 * AgentMemory - Lightweight in-memory storage system for AI agent
 * Simulates long-term memory for storing goals, plans, results, and reflections
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface StoredPlan {
  planId: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    estimatedDuration: number;
  }>;
  workflowId: string;
  workflowName: string;
  confidence: number;
  reasoning: string;
}

export interface StoredResult {
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
  duration: number;
  errors: string[];
  outputs: Record<string, any>;
}

export interface StoredReflection {
  goalAchieved: boolean;
  successRate: number;
  score: number;
  summary: string;
  insights: string[];
  improvements: string[];
  lessonsLearned: string[];
}

export interface AgentRun {
  id: string;
  timestamp: Date;
  goal: string;
  context?: string;
  plan: StoredPlan;
  result: StoredResult;
  reflection: StoredReflection;
  metadata: {
    agentVersion: string;
    executionTime: number;
    tags: string[];
  };
}

export interface MemoryStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageScore: number;
  averageExecutionTime: number;
  topInsights: string[];
  topImprovements: string[];
  commonPatterns: string[];
}

export interface MemoryQuery {
  goalContains?: string;
  minScore?: number;
  maxScore?: number;
  successful?: boolean;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// ============================================================================
// AgentMemory Class
// ============================================================================

export class AgentMemory {
  private runs: Map<string, AgentRun> = new Map();
  private insights: Map<string, number> = new Map(); // insight -> frequency
  private improvements: Map<string, number> = new Map(); // improvement -> frequency
  private goalPatterns: Map<string, string[]> = new Map(); // pattern -> related goals
  private maxStorageSize: number;

  constructor(maxStorageSize: number = 1000) {
    this.maxStorageSize = maxStorageSize;
  }

  // --------------------------------------------------------------------------
  // Core Methods
  // --------------------------------------------------------------------------

  /**
   * Save a complete agent run to memory
   */
  saveRun(
    goal: string,
    plan: StoredPlan,
    result: StoredResult,
    reflection: StoredReflection,
    context?: string,
    tags: string[] = []
  ): AgentRun {
    const id = uuidv4();
    const timestamp = new Date();

    const run: AgentRun = {
      id,
      timestamp,
      goal,
      context,
      plan,
      result,
      reflection,
      metadata: {
        agentVersion: '1.0.0',
        executionTime: result.duration,
        tags: this.extractTags(goal, tags),
      },
    };

    // Enforce storage limit (FIFO)
    if (this.runs.size >= this.maxStorageSize) {
      const oldestKey = this.runs.keys().next().value;
      if (oldestKey) {
        this.runs.delete(oldestKey);
      }
    }

    this.runs.set(id, run);

    // Index insights and improvements for quick retrieval
    this.indexInsights(reflection.insights);
    this.indexImprovements(reflection.improvements);
    this.indexGoalPattern(goal);

    return run;
  }

  /**
   * Get the most recent runs
   */
  getLastRuns(limit: number = 10): AgentRun[] {
    const allRuns = Array.from(this.runs.values());
    return allRuns
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get a specific run by ID
   */
  getRun(id: string): AgentRun | undefined {
    return this.runs.get(id);
  }

  /**
   * Query runs with filters
   */
  queryRuns(query: MemoryQuery): AgentRun[] {
    let results = Array.from(this.runs.values());

    if (query.goalContains) {
      const searchTerm = query.goalContains.toLowerCase();
      results = results.filter(run => 
        run.goal.toLowerCase().includes(searchTerm)
      );
    }

    if (query.minScore !== undefined) {
      results = results.filter(run => run.reflection.score >= query.minScore!);
    }

    if (query.maxScore !== undefined) {
      results = results.filter(run => run.reflection.score <= query.maxScore!);
    }

    if (query.successful !== undefined) {
      results = results.filter(run => run.result.success === query.successful);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(run =>
        query.tags!.some(tag => run.metadata.tags.includes(tag))
      );
    }

    if (query.startDate) {
      results = results.filter(run => run.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter(run => run.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Analytics & Insights
  // --------------------------------------------------------------------------

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const allRuns = Array.from(this.runs.values());
    
    if (allRuns.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageScore: 0,
        averageExecutionTime: 0,
        topInsights: [],
        topImprovements: [],
        commonPatterns: [],
      };
    }

    const successfulRuns = allRuns.filter(r => r.result.success).length;
    const totalScore = allRuns.reduce((sum, r) => sum + r.reflection.score, 0);
    const totalTime = allRuns.reduce((sum, r) => sum + r.metadata.executionTime, 0);

    return {
      totalRuns: allRuns.length,
      successfulRuns,
      failedRuns: allRuns.length - successfulRuns,
      averageScore: Math.round(totalScore / allRuns.length),
      averageExecutionTime: Math.round(totalTime / allRuns.length),
      topInsights: this.getTopInsights(5),
      topImprovements: this.getTopImprovements(5),
      commonPatterns: this.getCommonPatterns(5),
    };
  }

  /**
   * Get top recurring insights
   */
  getTopInsights(limit: number = 5): string[] {
    return Array.from(this.insights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([insight]) => insight);
  }

  /**
   * Get top recurring improvements
   */
  getTopImprovements(limit: number = 5): string[] {
    return Array.from(this.improvements.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([improvement]) => improvement);
  }

  /**
   * Get common goal patterns
   */
  getCommonPatterns(limit: number = 5): string[] {
    return Array.from(this.goalPatterns.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, limit)
      .map(([pattern]) => pattern);
  }

  /**
   * Find similar past runs for a given goal
   */
  findSimilarRuns(goal: string, limit: number = 5): AgentRun[] {
    const keywords = this.extractKeywords(goal);
    const allRuns = Array.from(this.runs.values());

    // Score each run by keyword overlap
    const scoredRuns = allRuns.map(run => {
      const runKeywords = this.extractKeywords(run.goal);
      const overlap = keywords.filter(k => runKeywords.includes(k)).length;
      return { run, score: overlap };
    });

    return scoredRuns
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.run);
  }

  /**
   * Get recommendations based on past performance
   */
  getRecommendations(goal: string): {
    suggestedWorkflow: string | null;
    estimatedScore: number;
    tips: string[];
    warnings: string[];
  } {
    const similarRuns = this.findSimilarRuns(goal, 10);
    
    if (similarRuns.length === 0) {
      return {
        suggestedWorkflow: null,
        estimatedScore: 75, // Default estimate
        tips: ['This appears to be a new type of goal. The agent will learn from this execution.'],
        warnings: [],
      };
    }

    // Find most successful workflow for similar goals
    const workflowScores: Map<string, { total: number; count: number }> = new Map();
    
    for (const run of similarRuns) {
      const workflow = run.plan.workflowName;
      const existing = workflowScores.get(workflow) || { total: 0, count: 0 };
      existing.total += run.reflection.score;
      existing.count += 1;
      workflowScores.set(workflow, existing);
    }

    let bestWorkflow: string | null = null;
    let bestAvgScore = 0;

    Array.from(workflowScores.entries()).forEach(([workflow, scores]) => {
      const avgScore = scores.total / scores.count;
      if (avgScore > bestAvgScore) {
        bestAvgScore = avgScore;
        bestWorkflow = workflow;
      }
    });

    // Calculate estimated score
    const avgScore = similarRuns.reduce((sum, r) => sum + r.reflection.score, 0) / similarRuns.length;

    // Gather tips from successful runs
    const successfulRuns = similarRuns.filter(r => r.reflection.score >= 80);
    const tips = successfulRuns
      .flatMap(r => r.reflection.insights)
      .slice(0, 3);

    // Gather warnings from failed runs
    const failedRuns = similarRuns.filter(r => r.reflection.score < 60);
    const warnings = failedRuns
      .flatMap(r => r.result.errors)
      .filter(e => e)
      .slice(0, 3);

    return {
      suggestedWorkflow: bestWorkflow,
      estimatedScore: Math.round(avgScore),
      tips: tips.length > 0 ? tips : ['Follow best practices for optimal results.'],
      warnings,
    };
  }

  // --------------------------------------------------------------------------
  // Persistence Simulation
  // --------------------------------------------------------------------------

  /**
   * Export memory to JSON (for persistence simulation)
   */
  export(): string {
    const data = {
      runs: Array.from(this.runs.entries()),
      insights: Array.from(this.insights.entries()),
      improvements: Array.from(this.improvements.entries()),
      goalPatterns: Array.from(this.goalPatterns.entries()),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import memory from JSON
   */
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      this.runs = new Map(data.runs.map(([k, v]: [string, AgentRun]) => [
        k,
        { ...v, timestamp: new Date(v.timestamp) }
      ]));
      this.insights = new Map(data.insights);
      this.improvements = new Map(data.improvements);
      this.goalPatterns = new Map(data.goalPatterns);
    } catch (error) {
      console.error('Failed to import memory:', error);
      throw new Error('Invalid memory data format');
    }
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.runs.clear();
    this.insights.clear();
    this.improvements.clear();
    this.goalPatterns.clear();
  }

  // --------------------------------------------------------------------------
  // Private Helper Methods
  // --------------------------------------------------------------------------

  private indexInsights(insights: string[]): void {
    for (const insight of insights) {
      const count = this.insights.get(insight) || 0;
      this.insights.set(insight, count + 1);
    }
  }

  private indexImprovements(improvements: string[]): void {
    for (const improvement of improvements) {
      const count = this.improvements.get(improvement) || 0;
      this.improvements.set(improvement, count + 1);
    }
  }

  private indexGoalPattern(goal: string): void {
    const keywords = this.extractKeywords(goal);
    for (const keyword of keywords) {
      const goals = this.goalPatterns.get(keyword) || [];
      if (!goals.includes(goal)) {
        goals.push(goal);
      }
      this.goalPatterns.set(keyword, goals);
    }
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
      'neither', 'not', 'only', 'own', 'same', 'than', 'too',
      'very', 'just', 'also', 'now', 'here', 'there', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both',
      'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'any', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
      'create', 'build', 'make', 'set', 'up', 'get', 'that', 'this'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private extractTags(goal: string, existingTags: string[]): string[] {
    const autoTags: string[] = [];
    const goalLower = goal.toLowerCase();

    // Auto-detect common categories
    const tagPatterns: Record<string, string[]> = {
      'data': ['data', 'database', 'analytics', 'etl', 'pipeline'],
      'api': ['api', 'endpoint', 'rest', 'graphql', 'webhook'],
      'ci-cd': ['deploy', 'ci', 'cd', 'build', 'release', 'pipeline'],
      'testing': ['test', 'qa', 'quality', 'validation'],
      'monitoring': ['monitor', 'alert', 'log', 'metric', 'observability'],
      'security': ['security', 'auth', 'encrypt', 'ssl', 'certificate'],
      'infrastructure': ['infra', 'server', 'cloud', 'kubernetes', 'docker'],
      'automation': ['automate', 'schedule', 'cron', 'workflow'],
    };

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some(p => goalLower.includes(p))) {
        autoTags.push(tag);
      }
    }

    return Array.from(new Set([...existingTags, ...autoTags]));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let memoryInstance: AgentMemory | null = null;

export function getAgentMemory(): AgentMemory {
  if (!memoryInstance) {
    memoryInstance = new AgentMemory();
  }
  return memoryInstance;
}

export function resetAgentMemory(): void {
  memoryInstance = new AgentMemory();
}
