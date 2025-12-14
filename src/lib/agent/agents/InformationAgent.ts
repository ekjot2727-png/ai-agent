/**
 * Information Agent
 * 
 * Handles informational queries without triggering workflow execution.
 * Provides expert-level explanations about the system, concepts, and processes.
 */

import { BaseAgent, AgentContext } from './BaseAgent';

// =============================================================================
// Types
// =============================================================================

export interface InformationResponse {
  id: string;
  timestamp: Date;
  query: string;
  answer: string;
  confidence: number;
  sources: string[];
  relatedTopics: string[];
  reasoning: string;
}

// =============================================================================
// Knowledge Base
// =============================================================================

const KNOWLEDGE_BASE = {
  system: {
    autoops: {
      answer: `AutoOps AI is an autonomous multi-agent system designed for DevOps automation. It uses specialized AI agents (Planner, Executor, Reflection, Optimizer) working together to understand goals, create task plans, execute workflows, analyze results, and continuously improve performance through machine learning.`,
      sources: ['System Architecture', 'README.md'],
      relatedTopics: ['multi-agent system', 'agents', 'workflows'],
    },
    architecture: {
      answer: `The system uses a multi-agent architecture with four specialized agents: (1) PlannerAgent - breaks down goals into executable tasks, (2) ExecutorAgent - selects and executes appropriate workflows, (3) ReflectionAgent - analyzes execution results and generates insights, (4) OptimizerAgent - suggests improvements based on historical patterns. All agents are coordinated by the OrchestratorAgent.`,
      sources: ['OrchestratorAgent', 'Multi-Agent Architecture'],
      relatedTopics: ['orchestrator', 'agents', 'planning', 'execution'],
    },
  },
  agents: {
    planner: {
      answer: `PlannerAgent is responsible for decomposing user goals into concrete, executable tasks. It analyzes goal complexity, identifies required operations, estimates duration, and creates a structured task plan with reasoning. It uses pattern matching and goal analysis to determine the optimal approach.`,
      sources: ['PlannerAgent.ts'],
      relatedTopics: ['task planning', 'goal decomposition', 'reasoning'],
    },
    executor: {
      answer: `ExecutorAgent selects the most appropriate workflow for a task plan and orchestrates its execution through Kestra. It tracks task status, handles failures, and reports execution metrics. Currently operates in simulation mode for hackathon purposes.`,
      sources: ['ExecutorAgent.ts', 'Kestra Integration'],
      relatedTopics: ['workflows', 'kestra', 'execution'],
    },
    reflection: {
      answer: `ReflectionAgent analyzes execution results to generate insights, identify improvement opportunities, and extract lessons learned. It evaluates success metrics, detects patterns, and provides recommendations for future runs.`,
      sources: ['ReflectionAgent.ts'],
      relatedTopics: ['analysis', 'insights', 'learning'],
    },
    optimizer: {
      answer: `OptimizerAgent leverages execution history to suggest performance improvements. It compares current plans with past successful executions, identifies optimization opportunities, and recommends strategies based on learned patterns.`,
      sources: ['OptimizerAgent.ts', 'AgentMemory'],
      relatedTopics: ['optimization', 'memory', 'learning'],
    },
  },
  features: {
    workflows: {
      answer: `Workflows are predefined automation sequences defined in YAML format and executed through Kestra. The system includes workflows for CI/CD pipelines, data processing, infrastructure setup, and general automation. The ExecutorAgent automatically selects the most suitable workflow based on task requirements.`,
      sources: ['Workflow System', 'Kestra Integration'],
      relatedTopics: ['kestra', 'yaml', 'automation'],
    },
    safety: {
      answer: `SafetyValidator examines goals before execution to detect ambiguous, destructive, or risky operations. It checks for unsafe patterns, validates context adequacy, and can block execution or request clarifications. Safety decisions are logged and include violation details and recommendations.`,
      sources: ['SafetyValidator.ts'],
      relatedTopics: ['security', 'validation', 'guardrails'],
    },
    learning: {
      answer: `The EvolutionEngine tracks execution patterns, success rates, and failure modes to improve system performance over time. It identifies recurring patterns, analyzes optimization opportunities, and builds a knowledge base of best practices. The system uses this learning to make better decisions on future tasks.`,
      sources: ['EvolutionEngine.ts', 'LearningEngine'],
      relatedTopics: ['machine learning', 'pattern recognition', 'improvement'],
    },
    memory: {
      answer: `AgentMemory stores execution history including task plans, results, and reflections. This enables the system to learn from past experiences, avoid duplicate work, and make data-driven decisions. Memory is used by the OptimizerAgent to suggest improvements.`,
      sources: ['AgentMemory.ts'],
      relatedTopics: ['storage', 'history', 'learning'],
    },
    intent: {
      answer: `IntentClassifier analyzes user input to determine the appropriate system response. It classifies inputs as EXECUTION_GOAL (requires workflow execution), INFORMATION_QUERY (requires explanation), or AMBIGUOUS (requires clarification). This ensures queries are answered directly without unnecessary execution.`,
      sources: ['IntentClassifier.ts'],
      relatedTopics: ['classification', 'routing', 'nlp'],
    },
  },
  concepts: {
    autonomy: {
      answer: `The system exhibits autonomy through independent decision-making in task planning, workflow selection, error recovery, and optimization. The AgentPersona module adds professional narratives and records decisions with reasoning, making the autonomous behavior explainable and trustworthy.`,
      sources: ['AgentPersona', 'Autonomous Decision Making'],
      relatedTopics: ['decision making', 'persona', 'explainability'],
    },
    explainability: {
      answer: `Every agent action includes reasoning traces that explain why decisions were made. The system tracks confidence scores, provides step-by-step reasoning, logs all decisions, and generates narratives that make AI behavior transparent and understandable to users.`,
      sources: ['ReasoningTracer', 'AgentPersona'],
      relatedTopics: ['transparency', 'reasoning', 'trust'],
    },
  },
};

// =============================================================================
// Information Agent Class
// =============================================================================

export class InformationAgent extends BaseAgent {
  constructor() {
    super('information' as any, 'InformationAgent');
  }

  /**
   * Implement BaseAgent abstract methods
   */
  async process(context: any): Promise<InformationResponse> {
    return this.processQuery(context.goal);
  }

  validateInput(context: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!context.goal || typeof context.goal !== 'string') {
      errors.push('Query must be a non-empty string');
    }
    
    if (context.goal && context.goal.trim().length < 3) {
      errors.push('Query must be at least 3 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process an informational query
   */
  async processQuery(query: string): Promise<InformationResponse> {
    this.reset();
    this.info('Processing information query', { query });

    const normalizedQuery = query.toLowerCase().trim();
    
    // Try to find relevant knowledge
    const knowledge = this.findRelevantKnowledge(normalizedQuery);
    
    let answer: string;
    let confidence: number;
    let sources: string[];
    let relatedTopics: string[];
    let reasoning: string;

    if (knowledge) {
      answer = knowledge.answer;
      confidence = 0.9;
      sources = knowledge.sources;
      relatedTopics = knowledge.relatedTopics;
      reasoning = `Found direct knowledge base match for query topic`;
    } else {
      // Generate a helpful response for unknown queries
      answer = this.generateFallbackAnswer(normalizedQuery);
      confidence = 0.6;
      sources = ['General Knowledge'];
      relatedTopics = this.extractTopics(normalizedQuery);
      reasoning = `Generated response based on system understanding`;
    }

    const response: InformationResponse = {
      id: this.generateId(),
      timestamp: new Date(),
      query,
      answer,
      confidence,
      sources,
      relatedTopics,
      reasoning,
    };

    this.observe('Query processed successfully', confidence);
    return response;
  }

  /**
   * Find relevant knowledge from knowledge base
   */
  private findRelevantKnowledge(query: string): any {
    const keywords = {
      // System-level
      autoops: ['autoops', 'system', 'what is this', 'what does'],
      architecture: ['architecture', 'how does', 'how work', 'structure'],
      
      // Agent-specific
      planner: ['planner', 'planning', 'plan', 'task'],
      executor: ['executor', 'execution', 'execute', 'run'],
      reflection: ['reflection', 'reflect', 'analysis', 'analyze'],
      optimizer: ['optimizer', 'optimize', 'improvement'],
      
      // Features
      workflows: ['workflow', 'kestra', 'automation', 'pipeline'],
      safety: ['safety', 'secure', 'validation', 'safe', 'guard'],
      learning: ['learning', 'learn', 'evolution', 'improve'],
      memory: ['memory', 'history', 'storage', 'remember'],
      intent: ['intent', 'classification', 'classify', 'routing'],
      
      // Concepts
      autonomy: ['autonomy', 'autonomous', 'independent', 'self'],
      explainability: ['explain', 'reasoning', 'why', 'transparent'],
    };

    // Check each category
    for (const [key, terms] of Object.entries(keywords)) {
      if (terms.some(term => query.includes(term))) {
        // Look up in knowledge base
        for (const category of Object.values(KNOWLEDGE_BASE)) {
          const categoryData = category as Record<string, any>;
          if (categoryData[key]) {
            return categoryData[key];
          }
        }
      }
    }

    return null;
  }

  /**
   * Generate fallback answer for unknown queries
   */
  private generateFallbackAnswer(query: string): string {
    // Check query type
    if (query.includes('how') && (query.includes('work') || query.includes('does'))) {
      return `AutoOps AI is an autonomous multi-agent system. The orchestrator coordinates specialized agents (Planner, Executor, Reflection, Optimizer) to break down goals, execute workflows, analyze results, and continuously improve. For specific component details, ask about individual agents or features.`;
    }

    if (query.includes('what') && (query.includes('can') || query.includes('do'))) {
      return `AutoOps AI can: (1) Decompose complex goals into executable tasks, (2) Select and execute appropriate DevOps workflows, (3) Analyze execution results and generate insights, (4) Learn from history to improve future performance, (5) Validate safety and prevent risky operations, (6) Answer questions about system behavior and concepts.`;
    }

    if (query.includes('why')) {
      return `The system makes decisions based on multi-agent reasoning. Each agent contributes specialized analysis: planning complexity, workflow suitability, execution feasibility, and historical patterns. All decisions include confidence scores and reasoning traces for transparency.`;
    }

    // Generic helpful response
    return `I can help explain AutoOps AI's features, architecture, and behavior. Try asking about: agents (planner, executor, reflection, optimizer), workflows, safety validation, learning capabilities, or specific features you'd like to understand better.`;
  }

  /**
   * Extract potential topics from query
   */
  private extractTopics(query: string): string[] {
    const topics: string[] = [];
    const words = query.split(/\s+/);
    
    const topicKeywords = [
      'agent', 'workflow', 'planning', 'execution', 'reflection',
      'optimization', 'safety', 'learning', 'memory', 'autonomy',
      'kestra', 'pipeline', 'devops', 'automation',
    ];

    for (const word of words) {
      const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
      if (topicKeywords.includes(normalized)) {
        topics.push(normalized);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

let informationAgentInstance: InformationAgent | null = null;

export function getInformationAgent(): InformationAgent {
  if (!informationAgentInstance) {
    informationAgentInstance = new InformationAgent();
  }
  return informationAgentInstance;
}

export function resetInformationAgent(): void {
  informationAgentInstance = null;
}
