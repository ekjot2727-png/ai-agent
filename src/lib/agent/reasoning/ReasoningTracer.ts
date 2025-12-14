/**
 * ReasoningTracer - Generates detailed reasoning traces for agent decisions
 * Provides structured reasoning objects for UI display
 */

import { v4 as uuidv4 } from 'uuid';
import { ReasoningStep, AgentRole } from '../agents/BaseAgent';

// ============================================================================
// Types
// ============================================================================

export interface ReasoningDecision {
  id: string;
  timestamp: Date;
  agent: AgentRole;
  decisionType: DecisionType;
  question: string;
  answer: string;
  reasoning: string[];
  assumptions: Assumption[];
  alternatives: Alternative[];
  confidence: number;
  factors: DecisionFactor[];
}

export type DecisionType = 
  | 'task-selection'
  | 'workflow-selection'
  | 'priority-assignment'
  | 'resource-allocation'
  | 'error-handling'
  | 'optimization-choice';

export interface Assumption {
  id: string;
  description: string;
  basis: string;
  risk: 'low' | 'medium' | 'high';
  validated: boolean;
}

export interface Alternative {
  id: string;
  option: string;
  pros: string[];
  cons: string[];
  rejectionReason: string;
}

export interface DecisionFactor {
  name: string;
  value: string | number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface AgentAction {
  id: string;
  timestamp: Date;
  agent: AgentRole;
  action: string;
  target: string;
  result: 'success' | 'pending' | 'failed';
  duration?: number;
  details?: Record<string, any>;
}

export interface ReasoningTrace {
  traceId: string;
  sessionId: string;
  goal: string;
  startTime: Date;
  endTime?: Date;
  decisions: ReasoningDecision[];
  actions: AgentAction[];
  timeline: TimelineEvent[];
  summary: TraceSummary;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'decision' | 'action' | 'observation' | 'thought' | 'milestone';
  agent: AgentRole;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  metadata?: Record<string, any>;
}

export interface TraceSummary {
  totalDecisions: number;
  totalActions: number;
  averageConfidence: number;
  keyAssumptions: string[];
  criticalDecisions: string[];
  agentContributions: Record<AgentRole, number>;
}

// ============================================================================
// ReasoningTracer Class
// ============================================================================

export class ReasoningTracer {
  private currentTrace: ReasoningTrace | null = null;
  private traces: ReasoningTrace[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = uuidv4();
  }

  // --------------------------------------------------------------------------
  // Trace Management
  // --------------------------------------------------------------------------

  startTrace(goal: string): ReasoningTrace {
    this.currentTrace = {
      traceId: uuidv4(),
      sessionId: this.sessionId,
      goal,
      startTime: new Date(),
      decisions: [],
      actions: [],
      timeline: [],
      summary: {
        totalDecisions: 0,
        totalActions: 0,
        averageConfidence: 0,
        keyAssumptions: [],
        criticalDecisions: [],
        agentContributions: {
          planner: 0,
          executor: 0,
          reflection: 0,
          optimizer: 0,
          orchestrator: 0,
        },
      },
    };

    this.addTimelineEvent({
      type: 'milestone',
      agent: 'orchestrator',
      title: 'Trace Started',
      description: `Beginning reasoning trace for goal: "${goal.slice(0, 50)}..."`,
      status: 'completed',
    });

    return this.currentTrace;
  }

  endTrace(): ReasoningTrace | null {
    if (!this.currentTrace) return null;

    this.currentTrace.endTime = new Date();
    this.updateSummary();

    this.addTimelineEvent({
      type: 'milestone',
      agent: 'orchestrator',
      title: 'Trace Complete',
      description: `Reasoning trace completed with ${this.currentTrace.decisions.length} decisions`,
      status: 'completed',
    });

    this.traces.push(this.currentTrace);
    const completedTrace = this.currentTrace;
    this.currentTrace = null;

    return completedTrace;
  }

  // --------------------------------------------------------------------------
  // Decision Recording
  // --------------------------------------------------------------------------

  recordDecision(params: {
    agent: AgentRole;
    decisionType: DecisionType;
    question: string;
    answer: string;
    reasoning: string[];
    assumptions?: Assumption[];
    alternatives?: Alternative[];
    confidence: number;
    factors?: DecisionFactor[];
  }): ReasoningDecision {
    const decision: ReasoningDecision = {
      id: uuidv4(),
      timestamp: new Date(),
      agent: params.agent,
      decisionType: params.decisionType,
      question: params.question,
      answer: params.answer,
      reasoning: params.reasoning,
      assumptions: params.assumptions || [],
      alternatives: params.alternatives || [],
      confidence: params.confidence,
      factors: params.factors || [],
    };

    if (this.currentTrace) {
      this.currentTrace.decisions.push(decision);
      this.currentTrace.summary.agentContributions[params.agent]++;

      this.addTimelineEvent({
        type: 'decision',
        agent: params.agent,
        title: this.getDecisionTitle(params.decisionType),
        description: params.answer,
        status: 'completed',
        metadata: { decisionId: decision.id, confidence: params.confidence },
      });
    }

    return decision;
  }

  recordTaskSelection(
    agent: AgentRole,
    selectedTask: string,
    alternatives: string[],
    reasons: string[]
  ): ReasoningDecision {
    return this.recordDecision({
      agent,
      decisionType: 'task-selection',
      question: 'Which task should be executed next?',
      answer: selectedTask,
      reasoning: reasons,
      alternatives: alternatives.map(alt => ({
        id: uuidv4(),
        option: alt,
        pros: ['Available for execution'],
        cons: ['Lower priority or dependency not met'],
        rejectionReason: 'Selected task has higher priority or better alignment with goal',
      })),
      confidence: 0.85,
      factors: [
        { name: 'Priority', value: 'high', weight: 0.4, impact: 'positive' },
        { name: 'Dependencies', value: 'resolved', weight: 0.3, impact: 'positive' },
        { name: 'Complexity', value: 'manageable', weight: 0.3, impact: 'neutral' },
      ],
    });
  }

  recordWorkflowSelection(
    agent: AgentRole,
    selectedWorkflow: string,
    confidence: number,
    reasons: string[],
    assumptions: string[]
  ): ReasoningDecision {
    return this.recordDecision({
      agent,
      decisionType: 'workflow-selection',
      question: 'Which workflow best fits this goal?',
      answer: selectedWorkflow,
      reasoning: reasons,
      assumptions: assumptions.map(a => ({
        id: uuidv4(),
        description: a,
        basis: 'Based on goal analysis and historical patterns',
        risk: 'low' as const,
        validated: false,
      })),
      confidence,
      factors: [
        { name: 'Goal Match', value: confidence * 100, weight: 0.5, impact: 'positive' },
        { name: 'Historical Success', value: 'high', weight: 0.3, impact: 'positive' },
        { name: 'Resource Fit', value: 'optimal', weight: 0.2, impact: 'positive' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // Action Recording
  // --------------------------------------------------------------------------

  recordAction(params: {
    agent: AgentRole;
    action: string;
    target: string;
    result: 'success' | 'pending' | 'failed';
    duration?: number;
    details?: Record<string, any>;
  }): AgentAction {
    const agentAction: AgentAction = {
      id: uuidv4(),
      timestamp: new Date(),
      agent: params.agent,
      action: params.action,
      target: params.target,
      result: params.result,
      duration: params.duration,
      details: params.details,
    };

    if (this.currentTrace) {
      this.currentTrace.actions.push(agentAction);

      this.addTimelineEvent({
        type: 'action',
        agent: params.agent,
        title: params.action,
        description: `Target: ${params.target}`,
        status: params.result === 'success' ? 'completed' : 
                params.result === 'pending' ? 'in-progress' : 'failed',
        metadata: { actionId: agentAction.id, duration: params.duration },
      });
    }

    return agentAction;
  }

  // --------------------------------------------------------------------------
  // Timeline Management
  // --------------------------------------------------------------------------

  addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): TimelineEvent {
    const timelineEvent: TimelineEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
    };

    if (this.currentTrace) {
      this.currentTrace.timeline.push(timelineEvent);
    }

    return timelineEvent;
  }

  recordObservation(agent: AgentRole, observation: string): void {
    this.addTimelineEvent({
      type: 'observation',
      agent,
      title: 'Observation',
      description: observation,
      status: 'completed',
    });
  }

  recordThought(agent: AgentRole, thought: string): void {
    this.addTimelineEvent({
      type: 'thought',
      agent,
      title: 'Thinking',
      description: thought,
      status: 'completed',
    });
  }

  // --------------------------------------------------------------------------
  // Import from Agent Reasoning
  // --------------------------------------------------------------------------

  importReasoningSteps(agent: AgentRole, steps: ReasoningStep[]): void {
    for (const step of steps) {
      this.addTimelineEvent({
        type: step.type === 'decision' ? 'decision' : 
              step.type === 'action' ? 'action' :
              step.type === 'observation' ? 'observation' : 'thought',
        agent,
        title: this.capitalizeFirst(step.type),
        description: step.content,
        status: 'completed',
        metadata: { confidence: step.confidence },
      });
    }
  }

  // --------------------------------------------------------------------------
  // Summary Generation
  // --------------------------------------------------------------------------

  private updateSummary(): void {
    if (!this.currentTrace) return;

    const trace = this.currentTrace;
    
    trace.summary.totalDecisions = trace.decisions.length;
    trace.summary.totalActions = trace.actions.length;
    
    if (trace.decisions.length > 0) {
      trace.summary.averageConfidence = 
        trace.decisions.reduce((sum, d) => sum + d.confidence, 0) / trace.decisions.length;
    }

    // Extract key assumptions
    const allAssumptions = trace.decisions.flatMap(d => d.assumptions);
    trace.summary.keyAssumptions = allAssumptions
      .filter(a => a.risk !== 'low')
      .map(a => a.description)
      .slice(0, 5);

    // Identify critical decisions
    trace.summary.criticalDecisions = trace.decisions
      .filter(d => d.decisionType === 'workflow-selection' || d.confidence < 0.7)
      .map(d => d.answer)
      .slice(0, 3);
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  getCurrentTrace(): ReasoningTrace | null {
    return this.currentTrace;
  }

  getTraces(): ReasoningTrace[] {
    return this.traces;
  }

  getLatestTrace(): ReasoningTrace | null {
    return this.traces[this.traces.length - 1] || null;
  }

  getTimeline(): TimelineEvent[] {
    return this.currentTrace?.timeline || [];
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private getDecisionTitle(type: DecisionType): string {
    const titles: Record<DecisionType, string> = {
      'task-selection': 'Task Selected',
      'workflow-selection': 'Workflow Selected',
      'priority-assignment': 'Priority Assigned',
      'resource-allocation': 'Resources Allocated',
      'error-handling': 'Error Handled',
      'optimization-choice': 'Optimization Chosen',
    };
    return titles[type] || 'Decision Made';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --------------------------------------------------------------------------
  // Export for UI
  // --------------------------------------------------------------------------

  toUIFormat(): {
    trace: ReasoningTrace | null;
    timeline: TimelineEvent[];
    decisions: ReasoningDecision[];
    summary: TraceSummary | null;
  } {
    return {
      trace: this.currentTrace,
      timeline: this.currentTrace?.timeline || [],
      decisions: this.currentTrace?.decisions || [],
      summary: this.currentTrace?.summary || null,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let tracerInstance: ReasoningTracer | null = null;

export function getReasoningTracer(): ReasoningTracer {
  if (!tracerInstance) {
    tracerInstance = new ReasoningTracer();
  }
  return tracerInstance;
}

export function resetReasoningTracer(): void {
  tracerInstance = null;
}
