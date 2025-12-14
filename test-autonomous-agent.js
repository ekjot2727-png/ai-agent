/**
 * Autonomous Agent Test Suite
 * 
 * Tests the upgraded hybrid AI agent with:
 * - Information query handling
 * - Execution goal processing
 * - Ambiguous input clarification
 * - Intent classification accuracy
 */

const http = require('http');

const TEST_CASES = [
  // === INFORMATION QUERIES ===
  {
    category: 'Information Query',
    name: 'System Overview',
    input: 'What is AutoOps AI?',
    expectedMode: 'information',
    expectedIntent: 'INFORMATION_QUERY',
    shouldExecute: false,
  },
  {
    category: 'Information Query',
    name: 'Agent Explanation',
    input: 'How does the planner agent work?',
    expectedMode: 'information',
    expectedIntent: 'INFORMATION_QUERY',
    shouldExecute: false,
  },
  {
    category: 'Information Query',
    name: 'Feature Question',
    input: 'Explain the safety validation system',
    expectedMode: 'information',
    expectedIntent: 'INFORMATION_QUERY',
    shouldExecute: false,
  },
  
  // === EXECUTION GOALS ===
  {
    category: 'Execution Goal',
    name: 'CI/CD Pipeline',
    input: 'Create a CI/CD pipeline for my Node.js application',
    expectedMode: 'execution',
    expectedIntent: 'EXECUTION_GOAL',
    shouldExecute: true,
  },
  {
    category: 'Execution Goal',
    name: 'Data Pipeline',
    input: 'Build a data pipeline for user analytics',
    expectedMode: 'execution',
    expectedIntent: 'EXECUTION_GOAL',
    shouldExecute: true,
  },
  {
    category: 'Execution Goal',
    name: 'Simple Task',
    input: 'Generate a REST API with authentication',
    expectedMode: 'execution',
    expectedIntent: 'EXECUTION_GOAL',
    shouldExecute: true,
  },
  
  // === AMBIGUOUS INPUTS ===
  {
    category: 'Ambiguous Input',
    name: 'Too Vague',
    input: 'Do everything',
    expectedMode: 'clarification',
    expectedIntent: 'AMBIGUOUS',
    shouldExecute: false,
  },
  {
    category: 'Ambiguous Input',
    name: 'Unclear Intent',
    input: 'Help me',
    expectedMode: 'clarification',
    expectedIntent: 'AMBIGUOUS',
    shouldExecute: false,
  },
];

async function testAgent(testCase) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ goal: testCase.input });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/agent/goal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`Category: ${testCase.category}`);
    console.log(`Input: "${testCase.input}"`);
    console.log('='.repeat(80));

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          
          console.log(`\n✓ Response received (${res.statusCode})`);
          
          // Check intent classification
          if (result.intent) {
            console.log(`\nIntent Classification:`);
            console.log(`  Type: ${result.intent.type}`);
            console.log(`  Expected: ${testCase.expectedIntent}`);
            console.log(`  Match: ${result.intent.type === testCase.expectedIntent ? '✓' : '✗'}`);
            console.log(`  Confidence: ${result.intent.confidence}`);
          }
          
          // Check mode
          if (result.mode) {
            console.log(`\nMode:`);
            console.log(`  Actual: ${result.mode}`);
            console.log(`  Expected: ${testCase.expectedMode}`);
            console.log(`  Match: ${result.mode === testCase.expectedMode ? '✓' : '✗'}`);
          }
          
          // Check execution
          const hasExecution = !!result.taskPlan || !!result.executionStatus;
          console.log(`\nExecution:`);
          console.log(`  Workflow Executed: ${hasExecution ? 'Yes' : 'No'}`);
          console.log(`  Expected: ${testCase.shouldExecute ? 'Yes' : 'No'}`);
          console.log(`  Match: ${hasExecution === testCase.shouldExecute ? '✓' : '✗'}`);
          
          // Show response
          console.log(`\nResponse:`);
          const responseText = result.response || result.summary;
          console.log(`  ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
          
          // Show reasoning if available
          if (result.reasoning) {
            console.log(`\nReasoning:`);
            console.log(`  ${result.reasoning.substring(0, 150)}${result.reasoning.length > 150 ? '...' : ''}`);
          }
          
          // Determine test result
          const intentMatch = !result.intent || result.intent.type === testCase.expectedIntent;
          const modeMatch = !result.mode || result.mode === testCase.expectedMode;
          const execMatch = hasExecution === testCase.shouldExecute;
          const passed = intentMatch && modeMatch && execMatch;
          
          console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Test ${passed ? 'succeeded' : 'failed'}`);
          
          resolve({ ...testCase, passed, result });
        } catch (e) {
          console.error(`✗ Parse error:`, e.message);
          console.log('Response:', body.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`✗ Request error: ${e.message}`);
      reject(e);
    });

    req.on('timeout', () => {
      console.log('✗ Request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS AGENT TEST SUITE');
  console.log('='.repeat(80));
  console.log('\nTesting hybrid AI agent with:');
  console.log('  • Information query handling (no execution)');
  console.log('  • Execution goal processing (full pipeline)');
  console.log('  • Ambiguous input clarification');
  console.log('  • Intent classification accuracy');
  console.log('\nMake sure the dev server is running: npm run dev');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    byCategory: {}
  };
  
  for (const testCase of TEST_CASES) {
    try {
      const result = await testAgent(testCase);
      results.total++;
      
      if (result.passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Track by category
      if (!results.byCategory[testCase.category]) {
        results.byCategory[testCase.category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        results.byCategory[testCase.category].passed++;
      } else {
        results.byCategory[testCase.category].failed++;
      }
      
      // Wait between tests
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      results.total++;
      results.failed++;
      if (!results.byCategory[testCase.category]) {
        results.byCategory[testCase.category] = { passed: 0, failed: 0 };
      }
      results.byCategory[testCase.category].failed++;
      console.error(`\n✗ Test failed: ${e.message}`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nOverall: ${results.passed}/${results.total} passed (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`Failed: ${results.failed}`);
  
  console.log('\nBy Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const total = stats.passed + stats.failed;
    const pct = Math.round(stats.passed/total*100);
    console.log(`  ${category}: ${stats.passed}/${total} (${pct}%)`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  return results.passed === results.total ? 0 : 1;
}

// Run if executed directly
if (require.main === module) {
  runTests()
    .then(exitCode => process.exit(exitCode))
    .catch(e => {
      console.error('Test suite error:', e);
      process.exit(1);
    });
}

module.exports = { testAgent, runTests };
