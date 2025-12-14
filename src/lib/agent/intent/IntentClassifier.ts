/**
 * Intent Classifier
 * 
 * Classifies user input to determine appropriate system response:
 * - EXECUTION_GOAL: Requires planning and workflow execution
 * - INFORMATION_QUERY: Requires direct explanation (no execution)
 * - AMBIGUOUS: Requires clarification from user
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type IntentType = 'EXECUTION_GOAL' | 'INFORMATION_QUERY' | 'AMBIGUOUS';

export interface IntentClassification {
  id: string;
  timestamp: Date;
  input: string;
  intentType: IntentType;
  confidence: number; // 0-1
  reasoning: string;
  suggestedAction: string;
  keywords: string[];
}

// =============================================================================
// Pattern Definitions
// =============================================================================

// Information query indicators
const INFORMATION_PATTERNS = [
  /^what\s+(is|are|does|do|can|will|would|should)/i,
  /^why\s+(is|are|does|do|did|can|should)/i,
  /^how\s+(does|do|can|to|should|is|are)/i,
  /^explain\s/i,
  /^describe\s/i,
  /^tell\s+me\s+(about|what|why|how)/i,
  /^can\s+you\s+(explain|describe|tell)/i,
  /\?$/,  // Ends with question mark
];

const INFORMATION_KEYWORDS = [
  'what', 'why', 'how', 'explain', 'describe', 'definition',
  'meaning', 'difference', 'compare', 'versus', 'vs',
];

// Execution goal indicators
const EXECUTION_PATTERNS = [
  /^(create|build|make|generate|develop|implement)\s/i,
  /^(run|execute|start|launch|deploy|trigger)\s/i,
  /^(setup|configure|install|initialize|prepare)\s/i,
  /^(update|modify|change|edit|fix|repair)\s/i,
  /^(delete|remove|clean|purge)\s/i,
  /^(test|validate|verify|check)\s/i,
  /^(optimize|improve|enhance|refactor)\s/i,
  /^(migrate|move|transfer|copy)\s/i,
];

const EXECUTION_KEYWORDS = [
  'create', 'build', 'make', 'generate', 'develop', 'implement',
  'run', 'execute', 'start', 'launch', 'deploy', 'trigger',
  'setup', 'configure', 'install', 'initialize',
  'update', 'modify', 'change', 'edit', 'fix',
  'delete', 'remove', 'clean',
  'test', 'validate', 'verify',
  'optimize', 'improve', 'enhance',
  'pipeline', 'workflow', 'automation',
];

// Ambiguous indicators
const AMBIGUOUS_PATTERNS = [
  /^(do|handle|manage|process)\s+(everything|all|anything|something)/i,
  /^(help|assist)\s+(me|with)?$/i,
  /^(fix|solve|resolve)\s+(it|this|that|problem|issue)?$/i,
];

const AMBIGUOUS_KEYWORDS = [
  'everything', 'anything', 'something', 'stuff',
  'things', 'it', 'this', 'that',
];

// =============================================================================
// Intent Classifier
// =============================================================================

export class IntentClassifier {
  private classificationHistory: IntentClassification[] = [];

  /**
   * Classify user input intent
   */
  classify(input: string): IntentClassification {
    const normalizedInput = input.trim().toLowerCase();
    const words = normalizedInput.split(/\s+/);

    // Check for ambiguous input first
    const ambiguousScore = this.calculateAmbiguousScore(normalizedInput, words);
    if (ambiguousScore > 0.7) {
      return this.createClassification(
        input,
        'AMBIGUOUS',
        ambiguousScore,
        'Input is too vague and lacks specific details',
        'Request more specific information from the user',
        this.extractKeywords(words, AMBIGUOUS_KEYWORDS)
      );
    }

    // Check for information query
    const infoScore = this.calculateInformationScore(normalizedInput, words);
    const execScore = this.calculateExecutionScore(normalizedInput, words);

    // Determine intent based on scores
    if (infoScore > execScore && infoScore > 0.5) {
      return this.createClassification(
        input,
        'INFORMATION_QUERY',
        infoScore,
        'Input is a question seeking information or explanation',
        'Provide a direct answer without executing workflows',
        this.extractKeywords(words, INFORMATION_KEYWORDS)
      );
    }

    if (execScore > 0.4) {
      return this.createClassification(
        input,
        'EXECUTION_GOAL',
        execScore,
        'Input contains actionable goal requiring execution',
        'Proceed with planning and workflow execution',
        this.extractKeywords(words, EXECUTION_KEYWORDS)
      );
    }

    // Default to ambiguous if scores are low
    return this.createClassification(
      input,
      'AMBIGUOUS',
      0.6,
      'Intent is unclear - could be question or action',
      'Request clarification on whether information or execution is needed',
      []
    );
  }

  /**
   * Calculate ambiguous score
   */
  private calculateAmbiguousScore(input: string, words: string[]): number {
    let score = 0;

    // Check patterns
    for (const pattern of AMBIGUOUS_PATTERNS) {
      if (pattern.test(input)) {
        score += 0.4;
      }
    }

    // Check keywords
    const keywordMatches = words.filter(w => AMBIGUOUS_KEYWORDS.includes(w)).length;
    score += Math.min(keywordMatches * 0.2, 0.4);

    // Very short input (< 3 words) is likely ambiguous
    if (words.length < 3) {
      score += 0.3;
    }

    // No specific nouns or verbs = ambiguous
    const hasSpecificContent = words.some(w => 
      w.length > 5 && !AMBIGUOUS_KEYWORDS.includes(w)
    );
    if (!hasSpecificContent) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate information query score
   */
  private calculateInformationScore(input: string, words: string[]): number {
    let score = 0;

    // Check patterns (highest weight)
    for (const pattern of INFORMATION_PATTERNS) {
      if (pattern.test(input)) {
        score += 0.5;
        break; // Only count first match
      }
    }

    // Check for question mark
    if (input.includes('?')) {
      score += 0.3;
    }

    // Check keywords
    const keywordMatches = words.filter(w => INFORMATION_KEYWORDS.includes(w)).length;
    score += Math.min(keywordMatches * 0.15, 0.3);

    return Math.min(score, 1);
  }

  /**
   * Calculate execution goal score
   */
  private calculateExecutionScore(input: string, words: string[]): number {
    let score = 0;

    // Check patterns (highest weight)
    for (const pattern of EXECUTION_PATTERNS) {
      if (pattern.test(input)) {
        score += 0.5;
        break; // Only count first match
      }
    }

    // Check keywords
    const keywordMatches = words.filter(w => EXECUTION_KEYWORDS.includes(w)).length;
    score += Math.min(keywordMatches * 0.2, 0.4);

    // Check for specific technical terms that indicate execution
    const technicalTerms = [
      'api', 'database', 'server', 'application', 'service',
      'website', 'page', 'component', 'function', 'script',
      'pipeline', 'workflow', 'automation', 'deployment',
    ];
    const techMatches = words.filter(w => technicalTerms.includes(w)).length;
    score += Math.min(techMatches * 0.1, 0.2);

    return Math.min(score, 1);
  }

  /**
   * Extract matched keywords
   */
  private extractKeywords(words: string[], keywordList: string[]): string[] {
    return words.filter(w => keywordList.includes(w));
  }

  /**
   * Create classification result
   */
  private createClassification(
    input: string,
    intentType: IntentType,
    confidence: number,
    reasoning: string,
    suggestedAction: string,
    keywords: string[]
  ): IntentClassification {
    const classification: IntentClassification = {
      id: uuidv4(),
      timestamp: new Date(),
      input,
      intentType,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      suggestedAction,
      keywords,
    };

    this.classificationHistory.push(classification);
    return classification;
  }

  /**
   * Generate explanation for information queries
   */
  generateExplanation(query: string): string {
    const normalized = query.toLowerCase().trim();

    // Pattern-based explanations
    if (normalized.includes('autoops') || normalized.includes('this system')) {
      return `AutoOps AI is an autonomous multi-agent system for DevOps automation. It uses specialized agents (Planner, Executor, Reflection, Optimizer) to break down goals, execute workflows, analyze results, and improve over time through machine learning.`;
    }

    if (normalized.includes('agent') && (normalized.includes('what') || normalized.includes('how'))) {
      return `The system uses 4 specialized agents: PlannerAgent (breaks goals into tasks), ExecutorAgent (executes workflows), ReflectionAgent (analyzes results), and OptimizerAgent (suggests improvements). They work together through the OrchestratorAgent to autonomously handle DevOps tasks.`;
    }

    if (normalized.includes('workflow')) {
      return `Workflows are predefined automation sequences (CI/CD pipelines, data pipelines, infrastructure setup, etc.) stored as YAML. The system selects the most appropriate workflow based on your goal, executes it through Kestra, and tracks results.`;
    }

    if (normalized.includes('learning') || normalized.includes('evolution')) {
      return `The system learns from execution history through the EvolutionEngine. It tracks success patterns, failure modes, and optimization opportunities. Over time, it improves task planning, workflow selection, and error handling based on past experiences.`;
    }

    if (normalized.includes('safety')) {
      return `SafetyValidator checks goals before execution to detect ambiguous, destructive, or risky operations. It blocks unsafe actions, requests clarifications for vague goals, and ensures operations align with configured safety policies.`;
    }

    // Generic explanation
    return `This is an autonomous AI system for DevOps automation. It can plan tasks, execute workflows, learn from results, and improve over time. To execute a task, provide a specific goal like "Create a CI/CD pipeline for Node.js" or "Deploy a data processing pipeline."`;
  }

  /**
   * Get classification history
   */
  getHistory(): IntentClassification[] {
    return [...this.classificationHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.classificationHistory = [];
  }
}

// =============================================================================
// Singleton
// =============================================================================

let intentClassifierInstance: IntentClassifier | null = null;

export function getIntentClassifier(): IntentClassifier {
  if (!intentClassifierInstance) {
    intentClassifierInstance = new IntentClassifier();
  }
  return intentClassifierInstance;
}

export function resetIntentClassifier(): void {
  intentClassifierInstance = null;
}
