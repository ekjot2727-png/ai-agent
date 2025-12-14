/**
 * SafetyValidator - Safety Validation Layer for Agent Goals
 * 
 * Features:
 * - Detect ambiguous or unsafe goals
 * - Request clarification for problematic goals
 * - Log all safety decisions
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'blocked';
export type ValidationCategory = 
  | 'ambiguity'
  | 'scope'
  | 'security'
  | 'resource'
  | 'compliance'
  | 'destructive'
  | 'external';

export interface SafetyViolation {
  category: ValidationCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  matchedPattern?: string;
  recommendation: string;
}

export interface ClarificationRequest {
  question: string;
  reason: string;
  suggestions: string[];
  required: boolean;
}

export interface SafetyValidationResult {
  id: string;
  timestamp: Date;
  goal: string;
  context?: string;
  safetyLevel: SafetyLevel;
  isApproved: boolean;
  violations: SafetyViolation[];
  clarificationsNeeded: ClarificationRequest[];
  safetyScore: number; // 0-100
  summary: string;
  recommendations: string[];
}

export interface SafetyDecisionLog {
  id: string;
  timestamp: Date;
  goal: string;
  decision: 'approved' | 'clarification_required' | 'modified' | 'blocked';
  safetyLevel: SafetyLevel;
  reason: string;
  violations: SafetyViolation[];
  appliedOverride?: boolean;
  overrideReason?: string;
}

export interface SafetyConfig {
  strictMode: boolean;
  allowDestructiveOperations: boolean;
  allowExternalAccess: boolean;
  maxViolationScore: number;
  requireClarificationThreshold: number;
}

// =============================================================================
// Pattern Definitions
// =============================================================================

interface ValidationPattern {
  pattern: RegExp;
  category: ValidationCategory;
  severity: SafetyViolation['severity'];
  description: string;
  recommendation: string;
}

const AMBIGUITY_PATTERNS: ValidationPattern[] = [
  {
    pattern: /^(do|make|fix|handle|take care of|sort out)\s+(it|this|that|stuff|things)/i,
    category: 'ambiguity',
    severity: 'medium',
    description: 'Goal is too vague - unclear what needs to be done',
    recommendation: 'Specify exactly what needs to be done and to what',
  },
  {
    pattern: /^(improve|optimize|enhance|better)\s*$/i,
    category: 'ambiguity',
    severity: 'high',
    description: 'Goal lacks any specific target or action',
    recommendation: 'Specify what to improve and define success criteria',
  },
  {
    pattern: /^(something|anything|whatever)/i,
    category: 'ambiguity',
    severity: 'high',
    description: 'Goal is completely undefined',
    recommendation: 'Provide a clear, specific goal',
  },
  {
    pattern: /^.{1,10}$/,
    category: 'ambiguity',
    severity: 'medium',
    description: 'Goal is too short to be actionable',
    recommendation: 'Provide more detail about the desired outcome',
  },
  {
    pattern: /\?\s*$/,
    category: 'ambiguity',
    severity: 'low',
    description: 'Goal appears to be a question rather than an instruction',
    recommendation: 'Rephrase as an actionable goal statement',
  },
];

const SECURITY_PATTERNS: ValidationPattern[] = [
  {
    pattern: /\b(password|secret|api[_\-\s]?key|token|credential|private[_\-\s]?key)\b/i,
    category: 'security',
    severity: 'high',
    description: 'Goal mentions sensitive credentials',
    recommendation: 'Ensure secrets are handled securely and not logged',
  },
  {
    pattern: /\b(sudo|root|admin|administrator)\b.*\b(access|permission|privilege)/i,
    category: 'security',
    severity: 'high',
    description: 'Goal involves elevated privileges',
    recommendation: 'Verify privilege escalation is necessary and authorized',
  },
  {
    pattern: /\b(disable|bypass|skip)\s*(security|auth|validation|firewall)/i,
    category: 'security',
    severity: 'critical',
    description: 'Goal attempts to bypass security measures',
    recommendation: 'Security measures should not be bypassed',
  },
  {
    pattern: /\b(inject|exploit|vulnerability|hack)\b/i,
    category: 'security',
    severity: 'critical',
    description: 'Goal contains potential security threat keywords',
    recommendation: 'Clarify intent - this appears to involve security vulnerabilities',
  },
];

const DESTRUCTIVE_PATTERNS: ValidationPattern[] = [
  {
    pattern: /\b(delete|remove|drop|destroy|erase|wipe)\s*(all|everything|\*|database|production|prod)/i,
    category: 'destructive',
    severity: 'critical',
    description: 'Goal involves mass deletion or destruction',
    recommendation: 'Ensure backups exist and confirm this action is intended',
  },
  {
    pattern: /\bformat\s*(disk|drive|volume)\b/i,
    category: 'destructive',
    severity: 'critical',
    description: 'Goal involves disk formatting',
    recommendation: 'Verify correct target and ensure data is backed up',
  },
  {
    pattern: /\brm\s+-rf\s+[\/\\]?\s*$/i,
    category: 'destructive',
    severity: 'critical',
    description: 'Goal contains dangerous recursive delete command',
    recommendation: 'Specify exact path and verify target is correct',
  },
  {
    pattern: /\b(truncate|purge)\s*(table|log|data)/i,
    category: 'destructive',
    severity: 'high',
    description: 'Goal involves data purging',
    recommendation: 'Ensure data retention requirements are met',
  },
];

const RESOURCE_PATTERNS: ValidationPattern[] = [
  {
    pattern: /\b(unlimited|infinite|maximum|all\s+available)\s*(resource|cpu|memory|storage|instances)/i,
    category: 'resource',
    severity: 'medium',
    description: 'Goal requests unlimited resources',
    recommendation: 'Specify reasonable resource limits to prevent cost overruns',
  },
  {
    pattern: /\b(scale|spawn|create)\s*(\d{3,}|thousands?|millions?)\s*(instance|server|container)/i,
    category: 'resource',
    severity: 'high',
    description: 'Goal involves creating many resources',
    recommendation: 'Verify scale is intended and budget is available',
  },
];

const EXTERNAL_PATTERNS: ValidationPattern[] = [
  {
    pattern: /\b(call|access|connect|send\s+to)\s*(external|third[_\-\s]?party|public)\s*(api|service|endpoint)/i,
    category: 'external',
    severity: 'medium',
    description: 'Goal involves external service access',
    recommendation: 'Verify external service is authorized and rate limits are respected',
  },
  {
    pattern: /\b(upload|send|transmit|share)\s*(data|file|information)\s*(to|with)\s*(external|public|internet)/i,
    category: 'external',
    severity: 'high',
    description: 'Goal involves sending data externally',
    recommendation: 'Ensure data classification allows external sharing',
  },
];

const SCOPE_PATTERNS: ValidationPattern[] = [
  {
    pattern: /\b(entire|all|whole|every)\s*(system|infrastructure|network|organization)/i,
    category: 'scope',
    severity: 'medium',
    description: 'Goal has very broad scope',
    recommendation: 'Consider breaking into smaller, targeted goals',
  },
  {
    pattern: /\b(migrate|upgrade|transform)\s*(everything|all|entire)/i,
    category: 'scope',
    severity: 'high',
    description: 'Goal involves large-scale migration',
    recommendation: 'Plan in phases with rollback capability',
  },
];

const ALL_PATTERNS: ValidationPattern[] = [
  ...AMBIGUITY_PATTERNS,
  ...SECURITY_PATTERNS,
  ...DESTRUCTIVE_PATTERNS,
  ...RESOURCE_PATTERNS,
  ...EXTERNAL_PATTERNS,
  ...SCOPE_PATTERNS,
];

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: SafetyConfig = {
  strictMode: false,
  allowDestructiveOperations: false,
  allowExternalAccess: true,
  maxViolationScore: 100,
  requireClarificationThreshold: 50,
};

// =============================================================================
// SafetyValidator Class
// =============================================================================

export class SafetyValidator {
  private config: SafetyConfig;
  private validationHistory: SafetyValidationResult[] = [];
  private decisionLog: SafetyDecisionLog[] = [];

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Main Validation Method
  // ---------------------------------------------------------------------------

  validateGoal(goal: string, context?: string): SafetyValidationResult {
    const violations = this.detectViolations(goal, context);
    const clarifications = this.generateClarifications(violations, goal);
    const safetyScore = this.calculateSafetyScore(violations);
    const safetyLevel = this.determineSafetyLevel(violations, safetyScore);
    const isApproved = this.determineApproval(safetyLevel, violations);

    const result: SafetyValidationResult = {
      id: uuidv4(),
      timestamp: new Date(),
      goal,
      context,
      safetyLevel,
      isApproved,
      violations,
      clarificationsNeeded: clarifications,
      safetyScore,
      summary: this.generateSummary(safetyLevel, violations, isApproved),
      recommendations: this.generateRecommendations(violations),
    };

    this.validationHistory.push(result);
    this.logDecision(result);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Violation Detection
  // ---------------------------------------------------------------------------

  private detectViolations(goal: string, context?: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const fullText = `${goal} ${context || ''}`;

    for (const pattern of ALL_PATTERNS) {
      if (pattern.pattern.test(fullText)) {
        // Skip certain violations based on config
        if (pattern.category === 'destructive' && this.config.allowDestructiveOperations) {
          continue;
        }
        if (pattern.category === 'external' && this.config.allowExternalAccess) {
          continue;
        }

        violations.push({
          category: pattern.category,
          severity: pattern.severity,
          description: pattern.description,
          matchedPattern: pattern.pattern.source,
          recommendation: pattern.recommendation,
        });
      }
    }

    // Check for missing context on complex goals
    if (!context && goal.length > 50) {
      const hasComplexIndicators = /\b(deploy|migrate|setup|configure|implement)\b/i.test(goal);
      if (hasComplexIndicators) {
        violations.push({
          category: 'ambiguity',
          severity: 'low',
          description: 'Complex goal lacks additional context',
          recommendation: 'Provide context about environment, constraints, or requirements',
        });
      }
    }

    return violations;
  }

  // ---------------------------------------------------------------------------
  // Clarification Generation
  // ---------------------------------------------------------------------------

  private generateClarifications(
    violations: SafetyViolation[],
    goal: string
  ): ClarificationRequest[] {
    const clarifications: ClarificationRequest[] = [];

    // Group violations by category
    const byCategory = new Map<ValidationCategory, SafetyViolation[]>();
    for (const v of violations) {
      const existing = byCategory.get(v.category) || [];
      existing.push(v);
      byCategory.set(v.category, existing);
    }

    // Generate clarifications per category
    if (byCategory.has('ambiguity')) {
      clarifications.push({
        question: 'Can you provide more specific details about what you want to achieve?',
        reason: 'The goal is ambiguous and could be interpreted in multiple ways',
        suggestions: [
          'Add specific technologies or systems involved',
          'Define measurable success criteria',
          'Specify the scope (which services, environments, etc.)',
        ],
        required: true,
      });
    }

    if (byCategory.has('destructive')) {
      clarifications.push({
        question: 'Are you sure you want to perform this destructive operation?',
        reason: 'This goal involves deleting or destroying resources',
        suggestions: [
          'Confirm backups are in place',
          'Specify exact targets to avoid accidental damage',
          'Consider a dry-run first',
        ],
        required: true,
      });
    }

    if (byCategory.has('security')) {
      clarifications.push({
        question: 'Please confirm the security implications are understood',
        reason: 'This goal involves security-sensitive operations',
        suggestions: [
          'Verify you have proper authorization',
          'Ensure audit logging is enabled',
          'Consider security review before proceeding',
        ],
        required: byCategory.get('security')!.some(v => v.severity === 'critical'),
      });
    }

    if (byCategory.has('scope')) {
      clarifications.push({
        question: 'Can you narrow the scope of this goal?',
        reason: 'The goal has a very broad scope which increases risk',
        suggestions: [
          'Break into smaller, phased goals',
          'Start with a single environment or system',
          'Define clear boundaries',
        ],
        required: false,
      });
    }

    if (byCategory.has('resource')) {
      clarifications.push({
        question: 'Can you specify resource limits?',
        reason: 'Unbounded resource requests can cause cost or availability issues',
        suggestions: [
          'Define maximum instance count',
          'Set budget limits',
          'Specify scaling boundaries',
        ],
        required: false,
      });
    }

    return clarifications;
  }

  // ---------------------------------------------------------------------------
  // Safety Scoring
  // ---------------------------------------------------------------------------

  private calculateSafetyScore(violations: SafetyViolation[]): number {
    let score = 100;

    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 40;
          break;
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  private determineSafetyLevel(
    violations: SafetyViolation[],
    score: number
  ): SafetyLevel {
    const hasCritical = violations.some(v => v.severity === 'critical');
    const highCount = violations.filter(v => v.severity === 'high').length;

    if (hasCritical || score < 20) return 'blocked';
    if (highCount >= 2 || score < 50) return 'warning';
    if (violations.length > 0 || score < 80) return 'caution';
    return 'safe';
  }

  private determineApproval(
    level: SafetyLevel,
    violations: SafetyViolation[]
  ): boolean {
    if (level === 'blocked') return false;
    if (this.config.strictMode && level !== 'safe') return false;
    
    // Block if any critical violation
    if (violations.some(v => v.severity === 'critical')) return false;
    
    return true;
  }

  // ---------------------------------------------------------------------------
  // Summary & Recommendations
  // ---------------------------------------------------------------------------

  private generateSummary(
    level: SafetyLevel,
    violations: SafetyViolation[],
    isApproved: boolean
  ): string {
    if (level === 'safe') {
      return 'Goal passed safety validation. No concerns detected.';
    }

    if (level === 'blocked') {
      return `Goal blocked due to ${violations.length} safety concern(s). Critical issues must be addressed.`;
    }

    if (!isApproved) {
      return `Goal requires clarification. ${violations.length} concern(s) need to be addressed.`;
    }

    return `Goal approved with ${violations.length} advisory note(s). Review recommendations before proceeding.`;
  }

  private generateRecommendations(violations: SafetyViolation[]): string[] {
    const recommendations = violations.map(v => v.recommendation);
    return Array.from(new Set(recommendations));
  }

  // ---------------------------------------------------------------------------
  // Decision Logging
  // ---------------------------------------------------------------------------

  private logDecision(result: SafetyValidationResult): void {
    let decision: SafetyDecisionLog['decision'];
    
    if (!result.isApproved && result.safetyLevel === 'blocked') {
      decision = 'blocked';
    } else if (result.clarificationsNeeded.some(c => c.required)) {
      decision = 'clarification_required';
    } else if (result.violations.length > 0) {
      decision = 'modified';
    } else {
      decision = 'approved';
    }

    const log: SafetyDecisionLog = {
      id: uuidv4(),
      timestamp: new Date(),
      goal: result.goal,
      decision,
      safetyLevel: result.safetyLevel,
      reason: result.summary,
      violations: result.violations,
    };

    this.decisionLog.push(log);
  }

  // ---------------------------------------------------------------------------
  // Override & Manual Approval
  // ---------------------------------------------------------------------------

  approveWithOverride(
    validationId: string,
    overrideReason: string
  ): boolean {
    const result = this.validationHistory.find(v => v.id === validationId);
    if (!result) return false;

    // Cannot override critical violations
    if (result.violations.some(v => v.severity === 'critical')) {
      return false;
    }

    // Log the override
    const overrideLog: SafetyDecisionLog = {
      id: uuidv4(),
      timestamp: new Date(),
      goal: result.goal,
      decision: 'approved',
      safetyLevel: result.safetyLevel,
      reason: 'Manual override applied',
      violations: result.violations,
      appliedOverride: true,
      overrideReason,
    };

    this.decisionLog.push(overrideLog);
    return true;
  }

  // ---------------------------------------------------------------------------
  // History Access
  // ---------------------------------------------------------------------------

  getValidationHistory(): SafetyValidationResult[] {
    return [...this.validationHistory];
  }

  getDecisionLog(): SafetyDecisionLog[] {
    return [...this.decisionLog];
  }

  getRecentDecisions(limit: number = 10): SafetyDecisionLog[] {
    return this.decisionLog.slice(-limit);
  }

  getBlockedGoals(): SafetyDecisionLog[] {
    return this.decisionLog.filter(d => d.decision === 'blocked');
  }

  getStatistics(): {
    totalValidations: number;
    approved: number;
    blocked: number;
    clarificationRequired: number;
    averageSafetyScore: number;
    violationsByCategory: Record<string, number>;
  } {
    const validations = this.validationHistory;
    const decisions = this.decisionLog;

    const violationsByCategory: Record<string, number> = {};
    for (const v of validations) {
      for (const violation of v.violations) {
        violationsByCategory[violation.category] = 
          (violationsByCategory[violation.category] || 0) + 1;
      }
    }

    return {
      totalValidations: validations.length,
      approved: decisions.filter(d => d.decision === 'approved').length,
      blocked: decisions.filter(d => d.decision === 'blocked').length,
      clarificationRequired: decisions.filter(d => d.decision === 'clarification_required').length,
      averageSafetyScore: validations.length > 0
        ? validations.reduce((sum, v) => sum + v.safetyScore, 0) / validations.length
        : 100,
      violationsByCategory,
    };
  }

  reset(): void {
    this.validationHistory = [];
    this.decisionLog = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let safetyValidatorInstance: SafetyValidator | null = null;

export function getSafetyValidator(): SafetyValidator {
  if (!safetyValidatorInstance) {
    safetyValidatorInstance = new SafetyValidator();
  }
  return safetyValidatorInstance;
}

export function resetSafetyValidator(): void {
  safetyValidatorInstance = null;
}
