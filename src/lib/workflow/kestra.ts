/**
 * Kestra Workflow Integration Module
 * 
 * Provides workflow templates and generation for Kestra orchestration
 */

import { WorkflowDefinition, WorkflowTask, Task } from '../types';

// Pre-defined workflow templates
const WORKFLOW_TEMPLATES: Record<string, WorkflowDefinition> = {
  'data-pipeline': {
    id: 'data-pipeline',
    name: 'Data Pipeline Workflow',
    namespace: 'autoops.data',
    tasks: [
      {
        id: 'extract',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Extracting data..."'],
        },
      },
      {
        id: 'transform',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Transforming data..."'],
        },
        dependsOn: ['extract'],
      },
      {
        id: 'load',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Loading data..."'],
        },
        dependsOn: ['transform'],
      },
    ],
  },
  'ci-cd': {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    namespace: 'autoops.deployment',
    tasks: [
      {
        id: 'checkout',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Checking out code..."'],
        },
      },
      {
        id: 'build',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Building application..."'],
        },
        dependsOn: ['checkout'],
      },
      {
        id: 'test',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Running tests..."'],
        },
        dependsOn: ['build'],
      },
      {
        id: 'deploy',
        type: 'io.kestra.core.tasks.scripts.Bash',
        properties: {
          commands: ['echo "Deploying..."'],
        },
        dependsOn: ['test'],
      },
    ],
  },
  'analysis': {
    id: 'analysis',
    name: 'Data Analysis Workflow',
    namespace: 'autoops.analysis',
    tasks: [
      {
        id: 'collect',
        type: 'io.kestra.core.tasks.scripts.Python',
        properties: {
          script: 'print("Collecting data...")',
        },
      },
      {
        id: 'analyze',
        type: 'io.kestra.core.tasks.scripts.Python',
        properties: {
          script: 'print("Analyzing data...")',
        },
        dependsOn: ['collect'],
      },
      {
        id: 'report',
        type: 'io.kestra.core.tasks.scripts.Python',
        properties: {
          script: 'print("Generating report...")',
        },
        dependsOn: ['analyze'],
      },
    ],
  },
};

/**
 * Returns all available workflow templates
 */
export function getWorkflowTemplates(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_TEMPLATES);
}

/**
 * Gets a specific workflow template
 */
export function getWorkflowTemplate(templateId: string): WorkflowDefinition | undefined {
  return WORKFLOW_TEMPLATES[templateId];
}

/**
 * Generates a workflow from a template with custom parameters
 */
export function generateWorkflow(
  templateId: string,
  parameters?: Record<string, unknown>
): WorkflowDefinition | null {
  const template = WORKFLOW_TEMPLATES[templateId];
  if (!template) return null;
  
  // Clone and customize the workflow
  const workflow: WorkflowDefinition = {
    ...template,
    id: `${template.id}-${Date.now()}`,
  };
  
  // Apply parameters if provided
  if (parameters) {
    workflow.tasks = workflow.tasks.map(task => ({
      ...task,
      properties: {
        ...task.properties,
        ...parameters,
      },
    }));
  }
  
  return workflow;
}

/**
 * Converts agent tasks to Kestra workflow format
 */
export function tasksToWorkflow(tasks: Task[], namespace: string = 'autoops.agent'): WorkflowDefinition {
  const workflowTasks: WorkflowTask[] = tasks.map((task, index) => ({
    id: task.id,
    type: 'io.kestra.core.tasks.scripts.Bash',
    properties: {
      commands: [`echo "Executing: ${task.title}"`, `sleep ${task.estimatedDuration}`],
      description: task.description,
    },
    dependsOn: task.dependencies.length > 0 ? task.dependencies : undefined,
  }));
  
  return {
    id: `agent-workflow-${Date.now()}`,
    name: 'Agent Generated Workflow',
    namespace,
    tasks: workflowTasks,
  };
}

/**
 * Generates YAML representation of a workflow
 */
export function workflowToYaml(workflow: WorkflowDefinition): string {
  const lines: string[] = [
    `id: ${workflow.id}`,
    `namespace: ${workflow.namespace}`,
    '',
    'tasks:',
  ];
  
  for (const task of workflow.tasks) {
    lines.push(`  - id: ${task.id}`);
    lines.push(`    type: ${task.type}`);
    
    if (task.dependsOn && task.dependsOn.length > 0) {
      lines.push(`    dependsOn:`);
      task.dependsOn.forEach(dep => lines.push(`      - ${dep}`));
    }
    
    if (task.properties) {
      for (const [key, value] of Object.entries(task.properties)) {
        if (Array.isArray(value)) {
          lines.push(`    ${key}:`);
          value.forEach(v => lines.push(`      - "${v}"`));
        } else {
          lines.push(`    ${key}: "${value}"`);
        }
      }
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

export default {
  getWorkflowTemplates,
  getWorkflowTemplate,
  generateWorkflow,
  tasksToWorkflow,
  workflowToYaml,
};
