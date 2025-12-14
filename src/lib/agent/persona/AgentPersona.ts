/**
 * AI Agent Persona - Professional Narration System
 * Provides confident, analytical, and concise agent communication
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type PersonaTone = 'confident' | 'analytical' | 'informative' | 'cautious';
export type NarrativeContext = 'planning' | 'execution' | 'reflection' | 'optimization' | 'failure' | 'recovery';

export interface NarrativeEntry {
  id: string;
  timestamp: Date;
  context: NarrativeContext;
  tone: PersonaTone;
  message: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AgentDecision {
  id: string;
  timestamp: Date;
  phase: NarrativeContext;
  decision: string;
  reasoning: string;
  alternatives: string[];
  selectedBecause: string;
  confidence: number;
}

export interface PersonaConfiguration {
  name: string;
  role: string;
  traits: string[];
  communicationStyle: {
    formality: 'casual' | 'professional' | 'technical';
    verbosity: 'concise' | 'moderate' | 'detailed';
    perspective: 'first-person' | 'third-person';
  };
}

// ============================================================================
// Default Persona Configuration
// ============================================================================

const DEFAULT_PERSONA: PersonaConfiguration = {
  name: 'AutoOps AI',
  role: 'Autonomous Workflow Orchestration Agent',
  traits: ['analytical', 'decisive', 'professional', 'solution-oriented'],
  communicationStyle: {
    formality: 'professional',
    verbosity: 'concise',
    perspective: 'first-person',
  },
};

// ============================================================================
// Narrative Templates
// ============================================================================

const NARRATIVE_TEMPLATES = {
  planning: {
    start: [
      "I'm analyzing the goal to construct an optimal execution plan.",
      "Beginning strategic planning phase. I'll identify the most efficient workflow path.",
      "Initiating plan generation. My analysis indicates several viable approaches.",
    ],
    decision: [
      "Based on my analysis, I've selected {workflow} as the optimal workflow for this goal.",
      "After evaluating {count} potential workflows, {workflow} emerged as the best fit.",
      "My strategic assessment favors {workflow} with a confidence score of {confidence}%.",
    ],
    complete: [
      "Planning complete. I've constructed a {count}-task execution plan.",
      "Plan finalized: {count} tasks staged for execution with estimated completion time of {duration}.",
      "Strategic planning concluded successfully. Ready to proceed with {count} optimized tasks.",
    ],
  },
  execution: {
    start: [
      "Initiating workflow execution. All systems are operational.",
      "Beginning task execution sequence. I'll monitor each step closely.",
      "Execution phase commenced. Deploying planned tasks in optimal order.",
    ],
    progress: [
      "Task '{task}' completed successfully. Moving to next phase.",
      "Checkpoint reached: {completed}/{total} tasks finished. Progress on track.",
      "Successfully processed '{task}'. Execution efficiency: {efficiency}%.",
    ],
    complete: [
      "Execution complete. {completed}/{total} tasks finished with {success_rate}% success rate.",
      "Workflow execution concluded. Total runtime: {duration}ms.",
      "All planned tasks processed. Final status: {status}.",
    ],
  },
  reflection: {
    start: [
      "Initiating post-execution analysis to extract insights.",
      "Beginning reflection phase. I'll evaluate what went well and identify improvements.",
      "Analyzing execution results to inform future optimizations.",
    ],
    insight: [
      "Key insight identified: {insight}",
      "My analysis revealed: {insight}",
      "Notable finding: {insight}",
    ],
    complete: [
      "Reflection complete. Overall execution scored {score}/100 ({grade}).",
      "Analysis finalized with {count} actionable insights generated.",
      "Reflection phase concluded. I've documented {count} recommendations for future runs.",
    ],
  },
  optimization: {
    start: [
      "Engaging optimization algorithms to refine workflow strategy.",
      "Initiating self-improvement cycle based on accumulated learnings.",
      "Beginning evolution analysis to enhance future performance.",
    ],
    decision: [
      "Optimization identified: {change}. Expected improvement: {improvement}%.",
      "Strategy refinement: {change}. This should reduce execution time by {improvement}%.",
      "Evolution suggestion: {change}. Confidence in positive impact: {confidence}%.",
    ],
    complete: [
      "Optimization cycle complete. {count} improvements staged for next execution.",
      "Self-improvement analysis finalized. Strategy evolved to generation {generation}.",
      "Evolution engine concluded. Future executions will benefit from {count} refinements.",
    ],
  },
  failure: {
    detected: [
      "Failure detected in task '{task}'. Initiating diagnostic analysis.",
      "Task '{task}' encountered an error. I'm analyzing the root cause.",
      "Execution anomaly identified. Engaging failure recovery protocols.",
    ],
    analysis: [
      "Root cause identified: {cause}. This is a {type} failure.",
      "Failure analysis complete: {cause}. Recovery options available.",
      "Diagnostic assessment: {cause}. I've formulated a recovery strategy.",
    ],
    recovery: [
      "Executing recovery plan: {plan}. Confidence in resolution: {confidence}%.",
      "Recovery strategy deployed: {plan}. Monitoring for success.",
      "Initiating remediation: {plan}. Expected resolution time: {duration}.",
    ],
  },
  recovery: {
    start: [
      "Recovery protocol initiated. I'll restore workflow to operational state.",
      "Engaging recovery procedures to address the identified failures.",
      "Beginning recovery sequence. Multiple strategies available.",
    ],
    progress: [
      "Recovery step '{step}' completed. Status: {status}.",
      "Recovery progressing: {completed}/{total} steps done.",
      "Remediation checkpoint: {step} successful.",
    ],
    complete: [
      "Recovery complete. Workflow restored to operational state.",
      "Recovery successful. All systems are now stable.",
      "Recovery concluded. Ready to resume normal operations.",
    ],
  },
};

// ============================================================================
// AgentPersona Class
// ============================================================================

export class AgentPersona {
  private config: PersonaConfiguration;
  private narrativeHistory: NarrativeEntry[] = [];
  private decisionHistory: AgentDecision[] = [];

  constructor(config?: Partial<PersonaConfiguration>) {
    this.config = {
      ...DEFAULT_PERSONA,
      ...config,
      communicationStyle: {
        ...DEFAULT_PERSONA.communicationStyle,
        ...config?.communicationStyle,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Narrative Generation
  // --------------------------------------------------------------------------

  generateNarrative(
    context: NarrativeContext,
    phase: 'start' | 'decision' | 'progress' | 'insight' | 'detected' | 'analysis' | 'recovery' | 'complete',
    variables?: Record<string, string | number>
  ): string {
    const templates = NARRATIVE_TEMPLATES[context];
    const phaseTemplates = (templates as Record<string, string[]>)[phase];
    
    if (!phaseTemplates || phaseTemplates.length === 0) {
      return this.generateFallbackNarrative(context, phase);
    }

    // Select a template based on some deterministic factor to avoid always picking the same one
    const index = Math.floor(Date.now() / 1000) % phaseTemplates.length;
    let narrative = phaseTemplates[index];

    // Replace variables in template
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        narrative = narrative.replace(`{${key}}`, String(value));
      });
    }

    // Record the narrative
    const entry: NarrativeEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      context,
      tone: this.determineTone(context, phase),
      message: narrative,
      confidence: this.calculateConfidence(context, phase),
      metadata: variables as Record<string, unknown>,
    };
    this.narrativeHistory.push(entry);

    return narrative;
  }

  private generateFallbackNarrative(context: NarrativeContext, phase: string): string {
    return `Processing ${context} phase: ${phase}`;
  }

  private determineTone(context: NarrativeContext, phase: string): PersonaTone {
    if (context === 'failure') return 'cautious';
    if (context === 'reflection' || context === 'optimization') return 'analytical';
    if (phase === 'decision' || phase === 'complete') return 'confident';
    return 'informative';
  }

  private calculateConfidence(context: NarrativeContext, phase: string): number {
    const baseConfidence = {
      planning: 0.85,
      execution: 0.90,
      reflection: 0.88,
      optimization: 0.82,
      failure: 0.70,
      recovery: 0.75,
    };
    
    const phaseModifier = {
      start: -0.05,
      progress: 0,
      complete: 0.05,
      decision: 0.08,
      detected: -0.10,
      recovery: 0.02,
    };

    return Math.min(
      1.0,
      (baseConfidence[context] || 0.8) + (phaseModifier[phase as keyof typeof phaseModifier] || 0)
    );
  }

  // --------------------------------------------------------------------------
  // Decision Documentation
  // --------------------------------------------------------------------------

  recordDecision(
    phase: NarrativeContext,
    decision: string,
    reasoning: string,
    alternatives: string[],
    selectedBecause: string,
    confidence: number = 0.85
  ): AgentDecision {
    const agentDecision: AgentDecision = {
      id: uuidv4(),
      timestamp: new Date(),
      phase,
      decision,
      reasoning,
      alternatives,
      selectedBecause,
      confidence,
    };
    this.decisionHistory.push(agentDecision);
    return agentDecision;
  }

  // --------------------------------------------------------------------------
  // Contextual Narratives
  // --------------------------------------------------------------------------

  narratePlanningStart(): string {
    return this.generateNarrative('planning', 'start');
  }

  narratePlanningDecision(workflowName: string, count: number, confidence: number): string {
    return this.generateNarrative('planning', 'decision', {
      workflow: workflowName,
      count,
      confidence: Math.round(confidence * 100),
    });
  }

  narratePlanningComplete(taskCount: number, estimatedDuration: number): string {
    return this.generateNarrative('planning', 'complete', {
      count: taskCount,
      duration: `${Math.round(estimatedDuration / 1000)}s`,
    });
  }

  narrateExecutionStart(): string {
    return this.generateNarrative('execution', 'start');
  }

  narrateExecutionProgress(
    taskName: string,
    completed: number,
    total: number,
    efficiency: number
  ): string {
    return this.generateNarrative('execution', 'progress', {
      task: taskName,
      completed,
      total,
      efficiency: Math.round(efficiency * 100),
    });
  }

  narrateExecutionComplete(
    completed: number,
    total: number,
    successRate: number,
    duration: number,
    status: string
  ): string {
    return this.generateNarrative('execution', 'complete', {
      completed,
      total,
      success_rate: Math.round(successRate * 100),
      duration,
      status,
    });
  }

  narrateReflectionStart(): string {
    return this.generateNarrative('reflection', 'start');
  }

  narrateReflectionInsight(insight: string): string {
    return this.generateNarrative('reflection', 'insight', { insight });
  }

  narrateReflectionComplete(score: number, grade: string, insightCount: number): string {
    return this.generateNarrative('reflection', 'complete', {
      score,
      grade,
      count: insightCount,
    });
  }

  narrateOptimizationStart(): string {
    return this.generateNarrative('optimization', 'start');
  }

  narrateOptimizationDecision(change: string, improvement: number, confidence: number): string {
    return this.generateNarrative('optimization', 'decision', {
      change,
      improvement: Math.round(improvement),
      confidence: Math.round(confidence * 100),
    });
  }

  narrateOptimizationComplete(improvementCount: number, generation: number): string {
    return this.generateNarrative('optimization', 'complete', {
      count: improvementCount,
      generation,
    });
  }

  narrateFailureDetected(taskName: string): string {
    return this.generateNarrative('failure', 'detected', { task: taskName });
  }

  narrateFailureAnalysis(cause: string, type: string): string {
    return this.generateNarrative('failure', 'analysis', { cause, type });
  }

  narrateRecoveryStart(): string {
    return this.generateNarrative('recovery', 'start');
  }

  narrateRecoveryComplete(): string {
    return this.generateNarrative('recovery', 'complete');
  }

  // --------------------------------------------------------------------------
  // Custom Narrative
  // --------------------------------------------------------------------------

  speak(message: string, context: NarrativeContext = 'execution', confidence: number = 0.85): string {
    const entry: NarrativeEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      context,
      tone: 'confident',
      message,
      confidence,
    };
    this.narrativeHistory.push(entry);
    return message;
  }

  // --------------------------------------------------------------------------
  // Summary Generation
  // --------------------------------------------------------------------------

  generateExecutiveSummary(
    planCount: number,
    executedCount: number,
    successRate: number,
    insights: number,
    improvements: number
  ): string {
    const parts: string[] = [];

    parts.push(`I orchestrated ${planCount} tasks with ${Math.round(successRate * 100)}% success rate.`);
    
    if (successRate >= 0.9) {
      parts.push("Performance exceeded expectations.");
    } else if (successRate >= 0.7) {
      parts.push("Performance met baseline requirements with room for optimization.");
    } else {
      parts.push("Performance indicates areas requiring attention.");
    }

    if (insights > 0) {
      parts.push(`My analysis yielded ${insights} actionable insights.`);
    }

    if (improvements > 0) {
      parts.push(`I've identified ${improvements} optimizations for future executions.`);
    }

    parts.push("Ready for the next operation on your command.");

    return parts.join(' ');
  }

  // --------------------------------------------------------------------------
  // History Access
  // --------------------------------------------------------------------------

  getNarrativeHistory(): NarrativeEntry[] {
    return [...this.narrativeHistory];
  }

  getDecisionHistory(): AgentDecision[] {
    return [...this.decisionHistory];
  }

  getRecentNarratives(count: number = 10): NarrativeEntry[] {
    return this.narrativeHistory.slice(-count);
  }

  clearHistory(): void {
    this.narrativeHistory = [];
    this.decisionHistory = [];
  }

  // --------------------------------------------------------------------------
  // Persona Info
  // --------------------------------------------------------------------------

  getPersonaInfo(): PersonaConfiguration {
    return { ...this.config };
  }

  updatePersona(updates: Partial<PersonaConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
      communicationStyle: {
        ...this.config.communicationStyle,
        ...updates.communicationStyle,
      },
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let personaInstance: AgentPersona | null = null;

export function getAgentPersona(): AgentPersona {
  if (!personaInstance) {
    personaInstance = new AgentPersona();
  }
  return personaInstance;
}

export function resetAgentPersona(): void {
  personaInstance = null;
}
