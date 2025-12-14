// Core types for AutoOps AI Agent System

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
export type AgentPhase = 'idle' | 'planning' | 'executing' | 'reflecting' | 'complete' | 'error';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  estimatedDuration: number; // in seconds
  actualDuration?: number;
  result?: TaskResult;
  reasoning?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TaskResult {
  success: boolean;
  output: string;
  metrics?: Record<string, number>;
  artifacts?: string[];
  error?: string;
}

export interface Goal {
  id: string;
  description: string;
  context?: string;
  constraints?: string[];
  createdAt: Date;
}

export interface AgentState {
  id: string;
  goal: Goal;
  phase: AgentPhase;
  tasks: Task[];
  currentTaskId?: string;
  reflection?: Reflection;
  logs: AgentLog[];
  startedAt: Date;
  completedAt?: Date;
  totalDuration?: number;
}

export interface Reflection {
  summary: string;
  successRate: number;
  insights: string[];
  improvements: string[];
  lessonsLearned: string[];
  overallScore: number; // 0-100
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  phase: AgentPhase;
  message: string;
  details?: Record<string, unknown>;
  level: 'info' | 'warning' | 'error' | 'debug';
}

export interface OumiReasoning {
  thought: string;
  analysis: string[];
  decision: string;
  confidence: number; // 0-1
  alternatives?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  namespace: string;
  tasks: WorkflowTask[];
  triggers?: WorkflowTrigger[];
}

export interface WorkflowTask {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  dependsOn?: string[];
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'manual';
  config: Record<string, unknown>;
}

export interface AgentConfig {
  maxRetries: number;
  taskTimeout: number; // seconds
  parallelExecution: boolean;
  reflectionEnabled: boolean;
  verboseLogging: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxRetries: 3,
  taskTimeout: 60,
  parallelExecution: false,
  reflectionEnabled: true,
  verboseLogging: true,
};
