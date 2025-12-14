/**
 * Agent Execution API Route
 * 
 * POST /api/agent/execute
 * Accepts a goal and executes the full agent workflow using AutoOpsAgent
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createAutoOpsAgent, 
  ExecutionPlan, 
  ExecutionResult, 
  ReflectionSummary,
  AgentLog,
  AgentConfig 
} from '@/lib/agent/AutoOpsAgent';

export interface ExecuteRequest {
  goal: string;
  context?: string;
  config?: Partial<AgentConfig>;
}

export interface ExecuteResponse {
  success: boolean;
  plan?: ExecutionPlan;
  result?: ExecutionResult;
  reflection?: ReflectionSummary;
  logs?: AgentLog[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExecuteResponse>> {
  try {
    const body: ExecuteRequest = await request.json();
    
    // Validate request
    if (!body.goal || typeof body.goal !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Goal is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (body.goal.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Goal must be at least 10 characters long' },
        { status: 400 }
      );
    }
    
    // Create agent with optional config
    const agent = createAutoOpsAgent(body.config);
    
    // Step 1: Plan the goal
    const plan = await agent.planGoal(body.goal, body.context);
    
    // Step 2: Execute the plan
    const result = await agent.executePlan(plan);
    
    // Step 3: Reflect on results
    const reflection = await agent.reflect(plan, result);
    
    // Get all logs for transparency
    const logs = agent.getLogs();
    
    return NextResponse.json({
      success: result.success,
      plan,
      result,
      reflection,
      logs,
    });
    
  } catch (error) {
    console.error('Agent execution error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'AutoOps AI Agent API',
    version: '2.0.0',
    description: 'Oumi-style autonomous agent with explainable reasoning',
    endpoints: {
      'POST /api/agent/execute': {
        description: 'Execute agent with a goal',
        body: {
          goal: 'string (required) - The goal to accomplish',
          context: 'string (optional) - Additional context',
          config: 'object (optional) - Agent configuration',
        },
        response: {
          plan: 'ExecutionPlan - Structured task breakdown with reasoning',
          result: 'ExecutionResult - Execution outcomes',
          reflection: 'ReflectionSummary - Insights and improvements',
          logs: 'AgentLog[] - Full reasoning chain',
        },
      },
    },
  });
}
