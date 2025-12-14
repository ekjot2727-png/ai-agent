/**
 * BaseAgent - Abstract base class for all agents in the multi-agent system
 * Provides common functionality for logging, reasoning, and agent communication
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type AgentRole = 'planner' | 'executor' | 'reflection' | 'optimizer' | 'orchestrator';

export interface AgentMessage {
  id: string;
  timestamp: Date;
  from: AgentRole;
  to: AgentRole | 'all';
  type: 'request' | 'response' | 'broadcast' | 'error';
  content: any;
  correlationId?: string;
}

export interface AgentLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  agent: AgentRole;
  message: string;
  data?: any;
}

export interface ReasoningStep {
  type: 'observation' | 'thought' | 'analysis' | 'decision' | 'action';
  content: string;
  confidence: number;
  timestamp: Date;
}

export interface AgentContext {
  goal: string;
  userContext?: string;
  previousResults?: any;
  sharedState: Map<string, any>;
  messages: AgentMessage[];
}

// ============================================================================
// BaseAgent Class
// ============================================================================

export abstract class BaseAgent {
  protected role: AgentRole;
  protected name: string;
  protected logs: AgentLog[] = [];
  protected reasoning: ReasoningStep[] = [];
  protected isActive: boolean = false;

  constructor(role: AgentRole, name: string) {
    this.role = role;
    this.name = name;
  }

  // --------------------------------------------------------------------------
  // Abstract Methods (must be implemented by subclasses)
  // --------------------------------------------------------------------------

  /**
   * Main processing method - each agent implements its specific logic
   */
  abstract process(context: AgentContext): Promise<any>;

  /**
   * Validate input before processing
   */
  abstract validateInput(context: AgentContext): { valid: boolean; errors: string[] };

  // --------------------------------------------------------------------------
  // Logging Methods
  // --------------------------------------------------------------------------

  protected log(level: AgentLog['level'], message: string, data?: any): void {
    const entry: AgentLog = {
      timestamp: new Date(),
      level,
      agent: this.role,
      message,
      data,
    };
    this.logs.push(entry);
    
    // Console output for debugging
    const prefix = `[${this.name}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data || '');
        break;
      case 'info':
        console.info(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  }

  protected debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  protected info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  protected warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  protected error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  // --------------------------------------------------------------------------
  // Reasoning Methods
  // --------------------------------------------------------------------------

  protected addReasoningStep(
    type: ReasoningStep['type'],
    content: string,
    confidence: number
  ): void {
    this.reasoning.push({
      type,
      content,
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: new Date(),
    });
  }

  protected observe(content: string, confidence: number = 0.9): void {
    this.addReasoningStep('observation', content, confidence);
  }

  protected think(content: string, confidence: number = 0.8): void {
    this.addReasoningStep('thought', content, confidence);
  }

  protected analyze(content: string, confidence: number = 0.85): void {
    this.addReasoningStep('analysis', content, confidence);
  }

  protected decide(content: string, confidence: number = 0.9): void {
    this.addReasoningStep('decision', content, confidence);
  }

  protected act(content: string, confidence: number = 0.95): void {
    this.addReasoningStep('action', content, confidence);
  }

  // --------------------------------------------------------------------------
  // Message Methods
  // --------------------------------------------------------------------------

  protected createMessage(
    to: AgentRole | 'all',
    type: AgentMessage['type'],
    content: any,
    correlationId?: string
  ): AgentMessage {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      from: this.role,
      to,
      type,
      content,
      correlationId,
    };
  }

  protected sendRequest(to: AgentRole, content: any, context: AgentContext): AgentMessage {
    const message = this.createMessage(to, 'request', content);
    context.messages.push(message);
    return message;
  }

  protected sendResponse(to: AgentRole, content: any, correlationId: string, context: AgentContext): AgentMessage {
    const message = this.createMessage(to, 'response', content, correlationId);
    context.messages.push(message);
    return message;
  }

  protected broadcast(content: any, context: AgentContext): AgentMessage {
    const message = this.createMessage('all', 'broadcast', content);
    context.messages.push(message);
    return message;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Get all logs from this agent
   */
  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  /**
   * Get reasoning chain from this agent
   */
  getReasoning(): ReasoningStep[] {
    return [...this.reasoning];
  }

  /**
   * Get agent info
   */
  getInfo(): { role: AgentRole; name: string; isActive: boolean } {
    return {
      role: this.role,
      name: this.name,
      isActive: this.isActive,
    };
  }

  /**
   * Clear logs and reasoning (for new run)
   */
  reset(): void {
    this.logs = [];
    this.reasoning = [];
    this.isActive = false;
  }

  /**
   * Calculate overall confidence from reasoning steps
   */
  protected calculateConfidence(): number {
    if (this.reasoning.length === 0) return 0;
    
    const totalConfidence = this.reasoning.reduce((sum, step) => sum + step.confidence, 0);
    return totalConfidence / this.reasoning.length;
  }

  /**
   * Simulate processing delay (for realistic feel)
   */
  protected async simulateThinking(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
