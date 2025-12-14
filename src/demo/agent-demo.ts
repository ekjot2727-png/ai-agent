/**
 * AutoOpsAgent Demo Script
 * 
 * Demonstrates the agent's capabilities:
 * - Goal planning with reasoning
 * - Task execution
 * - Reflection and insights
 * 
 * Run with: npx ts-node src/demo/agent-demo.ts
 * Or import and use in your application
 */

import { createAutoOpsAgent, AgentLog } from '../lib/agent/AutoOpsAgent';

async function runDemo() {
  console.log('═'.repeat(60));
  console.log('  AutoOps AI Agent Demo');
  console.log('  Oumi-Style Autonomous Agent with Explainable Reasoning');
  console.log('═'.repeat(60));
  console.log();

  // Create agent with logging callback
  const agent = createAutoOpsAgent(
    { verboseLogging: false }, // We'll handle our own logging
    (log: AgentLog) => {
      const icon = {
        debug: '🔍',
        info: '📋',
        warning: '⚠️',
        error: '❌',
      }[log.level];
      console.log(`  ${icon} [${log.phase}] ${log.message}`);
    }
  );

  // Example goals to test
  const goals = [
    'Create a data pipeline for user analytics that extracts data from our API, transforms it, and loads into BigQuery',
    // 'Set up a CI/CD workflow for deploying our Node.js application to AWS',
    // 'Analyze customer feedback from surveys and generate actionable insights',
  ];

  for (const goal of goals) {
    console.log('─'.repeat(60));
    console.log(`\n🎯 GOAL: "${goal}"\n`);
    console.log('─'.repeat(60));

    // ========================================
    // Phase 1: Planning
    // ========================================
    console.log('\n📊 PHASE 1: PLANNING\n');
    
    const plan = await agent.planGoal(goal);
    
    console.log('\n  Reasoning Chain:');
    for (const step of plan.reasoning.steps) {
      const icon = {
        observation: '👁️',
        thought: '💭',
        analysis: '🔬',
        decision: '✅',
        action: '🚀',
      }[step.type];
      console.log(`    ${icon} [${step.type}] ${step.content} (${(step.confidence * 100).toFixed(0)}% confidence)`);
    }
    
    console.log(`\n  Summary: ${plan.reasoning.summary}`);
    console.log(`  Total Confidence: ${(plan.reasoning.totalConfidence * 100).toFixed(0)}%`);
    
    console.log('\n  Structured Tasks:');
    plan.tasks.forEach((task, i) => {
      console.log(`    ${i + 1}. [${task.priority.toUpperCase()}] ${task.title}`);
      console.log(`       Type: ${task.type} | Est: ${task.estimatedDuration}s`);
      console.log(`       Reasoning: ${task.reasoning.slice(0, 80)}...`);
    });
    
    console.log('\n  Workflow Decision:');
    console.log(`    Selected: ${plan.workflow.workflowName}`);
    console.log(`    Reason: ${plan.workflow.reason}`);
    console.log(`    Confidence: ${(plan.workflow.confidence * 100).toFixed(0)}%`);
    if (plan.workflow.alternatives.length > 0) {
      console.log('    Alternatives considered:');
      plan.workflow.alternatives.forEach(alt => {
        console.log(`      - ${alt.name}: ${alt.reason}`);
      });
    }

    // ========================================
    // Phase 2: Execution
    // ========================================
    console.log('\n─'.repeat(60));
    console.log('\n⚡ PHASE 2: EXECUTION\n');
    
    const result = await agent.executePlan(plan);
    
    console.log(`\n  Execution Summary:`);
    console.log(`    Success: ${result.success ? '✅ Yes' : '❌ No'}`);
    console.log(`    Completed: ${result.completedTasks.length}/${plan.tasks.length} tasks`);
    console.log(`    Duration: ${result.duration}s`);
    
    if (result.errors.length > 0) {
      console.log('    Errors:');
      result.errors.forEach(err => console.log(`      - ${err}`));
    }

    // ========================================
    // Phase 3: Reflection
    // ========================================
    console.log('\n─'.repeat(60));
    console.log('\n🔮 PHASE 3: REFLECTION\n');
    
    const reflection = await agent.reflect(plan, result);
    
    console.log(`  Summary: ${reflection.summary}`);
    console.log(`  Goal Achieved: ${reflection.goalAchieved ? '✅ Yes' : '❌ No'}`);
    console.log(`  Success Rate: ${(reflection.successRate * 100).toFixed(0)}%`);
    console.log(`  Score: ${reflection.score}/100`);
    
    console.log('\n  Insights:');
    reflection.insights.forEach(insight => console.log(`    💡 ${insight}`));
    
    console.log('\n  Improvements:');
    reflection.improvements.forEach(imp => console.log(`    📈 ${imp}`));
    
    console.log('\n  Lessons Learned:');
    reflection.lessonsLearned.forEach(lesson => console.log(`    📚 ${lesson}`));
    
    console.log('\n  Reflection Reasoning:');
    for (const step of reflection.reasoning.steps) {
      console.log(`    [${step.type}] ${step.content}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  Demo Complete');
  console.log('═'.repeat(60));

  // Return logs for inspection
  return agent.getLogs();
}

// Export for use as module
export { runDemo };

// Run if executed directly
if (require.main === module) {
  runDemo()
    .then(logs => {
      console.log(`\n📝 Total logs generated: ${logs.length}`);
    })
    .catch(console.error);
}
