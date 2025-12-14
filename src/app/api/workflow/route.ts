/**
 * Workflow API Route
 * 
 * GET /api/workflow
 * Returns available workflow templates
 * 
 * POST /api/workflow
 * Triggers a workflow execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowDefinition } from '@/lib/types';
import { getWorkflowTemplates, generateWorkflow } from '@/lib/workflow/kestra';

export interface WorkflowRequest {
  templateId: string;
  parameters?: Record<string, unknown>;
}

export interface WorkflowResponse {
  success: boolean;
  workflow?: WorkflowDefinition;
  templates?: WorkflowDefinition[];
  error?: string;
}

export async function GET(): Promise<NextResponse<WorkflowResponse>> {
  try {
    const templates = getWorkflowTemplates();
    
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workflows',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<WorkflowResponse>> {
  try {
    const body: WorkflowRequest = await request.json();
    
    if (!body.templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const workflow = generateWorkflow(body.templateId, body.parameters);
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      workflow,
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate workflow',
      },
      { status: 500 }
    );
  }
}
