/**
 * SkillSystem - Modular Skill System for Agent
 * 
 * Features:
 * - Skills can be enabled/disabled
 * - Skills modify agent behavior
 * - Skills are composable and extensible
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type SkillCategory = 
  | 'planning'
  | 'execution'
  | 'analysis'
  | 'optimization'
  | 'communication'
  | 'security'
  | 'integration';

export type SkillTrigger = 
  | 'on_goal_received'
  | 'on_planning_start'
  | 'on_task_created'
  | 'on_execution_start'
  | 'on_task_complete'
  | 'on_task_failed'
  | 'on_reflection_start'
  | 'on_optimization_start'
  | 'always';

export interface SkillEffect {
  type: 'modify_task' | 'add_task' | 'skip_task' | 'modify_priority' | 'add_insight' | 'modify_confidence' | 'log' | 'custom';
  target?: string;
  value?: any;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  triggers: SkillTrigger[];
  enabled: boolean;
  priority: number;           // Higher priority skills run first
  effects: SkillEffect[];
  requirements?: string[];    // Other skills that must be enabled
  conflicts?: string[];       // Skills that conflict with this one
  config?: Record<string, any>;
}

export interface SkillExecutionResult {
  skillId: string;
  skillName: string;
  timestamp: Date;
  trigger: SkillTrigger;
  effectsApplied: SkillEffect[];
  success: boolean;
  message: string;
  impact?: string;
}

export interface SkillProfile {
  id: string;
  name: string;
  description: string;
  enabledSkills: string[];
  isDefault: boolean;
}

// =============================================================================
// Predefined Skills
// =============================================================================

export const BUILTIN_SKILLS: Skill[] = [
  // Planning Skills
  {
    id: 'skill-task-decomposition',
    name: 'Advanced Task Decomposition',
    description: 'Breaks down complex goals into more granular sub-tasks',
    category: 'planning',
    triggers: ['on_planning_start'],
    enabled: true,
    priority: 100,
    effects: [
      {
        type: 'modify_task',
        description: 'Splits large tasks into smaller, manageable sub-tasks',
      },
    ],
  },
  {
    id: 'skill-dependency-analysis',
    name: 'Dependency Analysis',
    description: 'Identifies and manages task dependencies',
    category: 'planning',
    triggers: ['on_task_created'],
    enabled: true,
    priority: 90,
    effects: [
      {
        type: 'add_insight',
        description: 'Adds dependency information to task metadata',
      },
    ],
  },
  {
    id: 'skill-risk-assessment',
    name: 'Risk Assessment',
    description: 'Evaluates potential risks for each task',
    category: 'planning',
    triggers: ['on_planning_start', 'on_task_created'],
    enabled: true,
    priority: 85,
    effects: [
      {
        type: 'add_insight',
        description: 'Identifies and documents potential risks',
      },
      {
        type: 'modify_priority',
        description: 'Adjusts task priority based on risk level',
      },
    ],
  },

  // Execution Skills
  {
    id: 'skill-parallel-execution',
    name: 'Parallel Execution',
    description: 'Executes independent tasks in parallel for efficiency',
    category: 'execution',
    triggers: ['on_execution_start'],
    enabled: true,
    priority: 95,
    effects: [
      {
        type: 'custom',
        description: 'Identifies parallelizable tasks and executes concurrently',
      },
    ],
  },
  {
    id: 'skill-retry-logic',
    name: 'Smart Retry',
    description: 'Implements intelligent retry logic with backoff',
    category: 'execution',
    triggers: ['on_task_failed'],
    enabled: true,
    priority: 100,
    effects: [
      {
        type: 'custom',
        description: 'Retries failed tasks with exponential backoff',
      },
    ],
  },
  {
    id: 'skill-checkpoint',
    name: 'Checkpointing',
    description: 'Creates checkpoints during execution for recovery',
    category: 'execution',
    triggers: ['on_task_complete'],
    enabled: false,
    priority: 80,
    effects: [
      {
        type: 'log',
        description: 'Saves execution state at checkpoints',
      },
    ],
  },

  // Analysis Skills
  {
    id: 'skill-performance-profiling',
    name: 'Performance Profiling',
    description: 'Analyzes execution performance metrics',
    category: 'analysis',
    triggers: ['on_reflection_start'],
    enabled: true,
    priority: 85,
    effects: [
      {
        type: 'add_insight',
        description: 'Generates detailed performance analysis',
      },
    ],
  },
  {
    id: 'skill-pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identifies recurring patterns in execution',
    category: 'analysis',
    triggers: ['on_reflection_start', 'on_optimization_start'],
    enabled: true,
    priority: 80,
    effects: [
      {
        type: 'add_insight',
        description: 'Detects and documents execution patterns',
      },
    ],
  },
  {
    id: 'skill-anomaly-detection',
    name: 'Anomaly Detection',
    description: 'Detects unusual behavior or results',
    category: 'analysis',
    triggers: ['on_task_complete', 'on_reflection_start'],
    enabled: false,
    priority: 75,
    effects: [
      {
        type: 'add_insight',
        description: 'Flags anomalous results for review',
      },
    ],
  },

  // Optimization Skills
  {
    id: 'skill-resource-optimization',
    name: 'Resource Optimization',
    description: 'Optimizes resource allocation and usage',
    category: 'optimization',
    triggers: ['on_optimization_start'],
    enabled: true,
    priority: 85,
    effects: [
      {
        type: 'add_insight',
        description: 'Suggests resource optimization strategies',
      },
    ],
  },
  {
    id: 'skill-cost-analysis',
    name: 'Cost Analysis',
    description: 'Analyzes and optimizes operation costs',
    category: 'optimization',
    triggers: ['on_optimization_start'],
    enabled: false,
    priority: 70,
    effects: [
      {
        type: 'add_insight',
        description: 'Provides cost breakdown and savings suggestions',
      },
    ],
  },

  // Communication Skills
  {
    id: 'skill-verbose-logging',
    name: 'Verbose Logging',
    description: 'Provides detailed logging of all operations',
    category: 'communication',
    triggers: ['always'],
    enabled: false,
    priority: 50,
    effects: [
      {
        type: 'log',
        description: 'Logs detailed information about each operation',
      },
    ],
  },
  {
    id: 'skill-progress-reporting',
    name: 'Progress Reporting',
    description: 'Provides real-time progress updates',
    category: 'communication',
    triggers: ['on_task_complete', 'on_task_failed'],
    enabled: true,
    priority: 60,
    effects: [
      {
        type: 'log',
        description: 'Reports task completion status',
      },
    ],
  },

  // Security Skills
  {
    id: 'skill-input-sanitization',
    name: 'Input Sanitization',
    description: 'Sanitizes and validates all inputs',
    category: 'security',
    triggers: ['on_goal_received', 'on_task_created'],
    enabled: true,
    priority: 100,
    effects: [
      {
        type: 'custom',
        description: 'Validates and sanitizes input data',
      },
    ],
  },
  {
    id: 'skill-audit-logging',
    name: 'Audit Logging',
    description: 'Creates audit trail for all operations',
    category: 'security',
    triggers: ['always'],
    enabled: true,
    priority: 90,
    effects: [
      {
        type: 'log',
        description: 'Records all operations for audit purposes',
      },
    ],
  },

  // Integration Skills
  {
    id: 'skill-webhook-notifications',
    name: 'Webhook Notifications',
    description: 'Sends notifications to configured webhooks',
    category: 'integration',
    triggers: ['on_task_complete', 'on_task_failed'],
    enabled: false,
    priority: 40,
    effects: [
      {
        type: 'custom',
        description: 'Sends webhook notifications for events',
      },
    ],
    config: {
      webhookUrl: '',
      events: ['task_complete', 'task_failed'],
    },
  },
  {
    id: 'skill-slack-integration',
    name: 'Slack Integration',
    description: 'Posts updates to Slack channels',
    category: 'integration',
    triggers: ['on_task_complete', 'on_task_failed'],
    enabled: false,
    priority: 40,
    effects: [
      {
        type: 'custom',
        description: 'Posts messages to configured Slack channels',
      },
    ],
    config: {
      channel: '',
      token: '',
    },
  },
];

// =============================================================================
// Predefined Skill Profiles
// =============================================================================

export const SKILL_PROFILES: SkillProfile[] = [
  {
    id: 'profile-default',
    name: 'Default',
    description: 'Balanced skill configuration for general use',
    enabledSkills: [
      'skill-task-decomposition',
      'skill-dependency-analysis',
      'skill-risk-assessment',
      'skill-parallel-execution',
      'skill-retry-logic',
      'skill-performance-profiling',
      'skill-pattern-recognition',
      'skill-resource-optimization',
      'skill-progress-reporting',
      'skill-input-sanitization',
      'skill-audit-logging',
    ],
    isDefault: true,
  },
  {
    id: 'profile-minimal',
    name: 'Minimal',
    description: 'Minimal skills for fast execution',
    enabledSkills: [
      'skill-retry-logic',
      'skill-input-sanitization',
    ],
    isDefault: false,
  },
  {
    id: 'profile-analysis',
    name: 'Analysis Focus',
    description: 'Enhanced analysis and monitoring capabilities',
    enabledSkills: [
      'skill-task-decomposition',
      'skill-dependency-analysis',
      'skill-risk-assessment',
      'skill-retry-logic',
      'skill-performance-profiling',
      'skill-pattern-recognition',
      'skill-anomaly-detection',
      'skill-resource-optimization',
      'skill-cost-analysis',
      'skill-verbose-logging',
      'skill-progress-reporting',
      'skill-input-sanitization',
      'skill-audit-logging',
    ],
    isDefault: false,
  },
  {
    id: 'profile-secure',
    name: 'Security Focus',
    description: 'Maximum security features enabled',
    enabledSkills: [
      'skill-task-decomposition',
      'skill-risk-assessment',
      'skill-retry-logic',
      'skill-checkpoint',
      'skill-anomaly-detection',
      'skill-verbose-logging',
      'skill-input-sanitization',
      'skill-audit-logging',
    ],
    isDefault: false,
  },
];

// =============================================================================
// SkillSystem Class
// =============================================================================

export class SkillSystem {
  private skills: Map<string, Skill> = new Map();
  private executionHistory: SkillExecutionResult[] = [];
  private activeProfile: SkillProfile | null = null;

  constructor() {
    // Load builtin skills
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.id, { ...skill });
    }

    // Apply default profile
    const defaultProfile = SKILL_PROFILES.find(p => p.isDefault);
    if (defaultProfile) {
      this.applyProfile(defaultProfile.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Skill Management
  // ---------------------------------------------------------------------------

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  unregisterSkill(skillId: string): boolean {
    return this.skills.delete(skillId);
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getEnabledSkills(): Skill[] {
    return this.getAllSkills().filter(s => s.enabled);
  }

  getSkillsByCategory(category: SkillCategory): Skill[] {
    return this.getAllSkills().filter(s => s.category === category);
  }

  getSkillsByTrigger(trigger: SkillTrigger): Skill[] {
    return this.getEnabledSkills()
      .filter(s => s.triggers.includes(trigger) || s.triggers.includes('always'))
      .sort((a, b) => b.priority - a.priority);
  }

  // ---------------------------------------------------------------------------
  // Enable/Disable
  // ---------------------------------------------------------------------------

  enableSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Check requirements
    if (skill.requirements) {
      for (const reqId of skill.requirements) {
        const req = this.skills.get(reqId);
        if (!req || !req.enabled) {
          console.warn(`Skill ${skillId} requires ${reqId} to be enabled first`);
          return false;
        }
      }
    }

    // Check conflicts
    if (skill.conflicts) {
      for (const conflictId of skill.conflicts) {
        const conflict = this.skills.get(conflictId);
        if (conflict && conflict.enabled) {
          console.warn(`Skill ${skillId} conflicts with ${conflictId}`);
          return false;
        }
      }
    }

    skill.enabled = true;
    return true;
  }

  disableSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Check if other skills depend on this one
    for (const other of this.getEnabledSkills()) {
      if (other.requirements?.includes(skillId)) {
        console.warn(`Cannot disable ${skillId}: ${other.id} depends on it`);
        return false;
      }
    }

    skill.enabled = false;
    return true;
  }

  toggleSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    if (skill.enabled) {
      return this.disableSkill(skillId);
    } else {
      return this.enableSkill(skillId);
    }
  }

  // ---------------------------------------------------------------------------
  // Profile Management
  // ---------------------------------------------------------------------------

  getProfiles(): SkillProfile[] {
    return [...SKILL_PROFILES];
  }

  getActiveProfile(): SkillProfile | null {
    return this.activeProfile;
  }

  applyProfile(profileId: string): boolean {
    const profile = SKILL_PROFILES.find(p => p.id === profileId);
    if (!profile) return false;

    // Disable all skills first
    for (const skill of Array.from(this.skills.values())) {
      skill.enabled = false;
    }

    // Enable skills in profile
    for (const skillId of profile.enabledSkills) {
      const skill = this.skills.get(skillId);
      if (skill) {
        skill.enabled = true;
      }
    }

    this.activeProfile = profile;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Skill Execution
  // ---------------------------------------------------------------------------

  /**
   * Execute skills for a given trigger
   */
  executeSkills(
    trigger: SkillTrigger,
    context: Record<string, any> = {}
  ): SkillExecutionResult[] {
    const applicableSkills = this.getSkillsByTrigger(trigger);
    const results: SkillExecutionResult[] = [];

    for (const skill of applicableSkills) {
      const result = this.executeSkill(skill, trigger, context);
      results.push(result);
      this.executionHistory.push(result);
    }

    return results;
  }

  private executeSkill(
    skill: Skill,
    trigger: SkillTrigger,
    context: Record<string, any>
  ): SkillExecutionResult {
    const appliedEffects: SkillEffect[] = [];
    let success = true;
    let message = `Skill ${skill.name} executed successfully`;

    try {
      // Simulate skill execution
      for (const effect of skill.effects) {
        // In a real implementation, this would apply the actual effects
        appliedEffects.push(effect);
      }
    } catch (error) {
      success = false;
      message = `Skill ${skill.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return {
      skillId: skill.id,
      skillName: skill.name,
      timestamp: new Date(),
      trigger,
      effectsApplied: appliedEffects,
      success,
      message,
      impact: success ? this.estimateImpact(skill, appliedEffects) : undefined,
    };
  }

  private estimateImpact(skill: Skill, effects: SkillEffect[]): string {
    const effectTypes = effects.map(e => e.type);
    
    if (effectTypes.includes('modify_priority')) {
      return 'Task priorities adjusted';
    }
    if (effectTypes.includes('add_insight')) {
      return 'New insights added';
    }
    if (effectTypes.includes('modify_task')) {
      return 'Tasks modified';
    }
    if (effectTypes.includes('log')) {
      return 'Information logged';
    }
    return 'Skill applied';
  }

  // ---------------------------------------------------------------------------
  // History & Statistics
  // ---------------------------------------------------------------------------

  getExecutionHistory(): SkillExecutionResult[] {
    return [...this.executionHistory];
  }

  getRecentExecutions(limit: number = 20): SkillExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  getSkillExecutions(skillId: string): SkillExecutionResult[] {
    return this.executionHistory.filter(r => r.skillId === skillId);
  }

  getStatistics(): {
    totalSkills: number;
    enabledSkills: number;
    totalExecutions: number;
    successRate: number;
    byCategory: Record<SkillCategory, number>;
    mostUsedSkills: Array<{ skillId: string; count: number }>;
  } {
    const skills = this.getAllSkills();
    const executions = this.executionHistory;
    const successfulExecutions = executions.filter(e => e.success).length;

    const byCategory: Record<SkillCategory, number> = {
      planning: 0,
      execution: 0,
      analysis: 0,
      optimization: 0,
      communication: 0,
      security: 0,
      integration: 0,
    };

    for (const skill of skills) {
      if (skill.enabled) {
        byCategory[skill.category]++;
      }
    }

    // Count skill usage
    const usageCount = new Map<string, number>();
    for (const exec of executions) {
      usageCount.set(exec.skillId, (usageCount.get(exec.skillId) || 0) + 1);
    }

    const mostUsedSkills = Array.from(usageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skillId, count]) => ({ skillId, count }));

    return {
      totalSkills: skills.length,
      enabledSkills: skills.filter(s => s.enabled).length,
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? successfulExecutions / executions.length : 1,
      byCategory,
      mostUsedSkills,
    };
  }

  reset(): void {
    // Reset to builtin skills only
    this.skills.clear();
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.id, { ...skill });
    }
    
    // Apply default profile
    const defaultProfile = SKILL_PROFILES.find(p => p.isDefault);
    if (defaultProfile) {
      this.applyProfile(defaultProfile.id);
    }
    
    this.executionHistory = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let skillSystemInstance: SkillSystem | null = null;

export function getSkillSystem(): SkillSystem {
  if (!skillSystemInstance) {
    skillSystemInstance = new SkillSystem();
  }
  return skillSystemInstance;
}

export function resetSkillSystem(): void {
  skillSystemInstance = null;
}
