/**
 * Intent Classification Test Script
 * Tests the new intent classification feature
 */

const http = require('http');

const tests = [
  {
    name: 'Information Query Test',
    goal: 'What is AutoOps AI?',
    expected: 'INFORMATION_QUERY'
  },
  {
    name: 'Execution Goal Test',
    goal: 'Create a CI/CD pipeline for my Node.js app',
    expected: 'EXECUTION_GOAL'
  },
  {
    name: 'Ambiguous Input Test',
    goal: 'Do everything',
    expected: 'AMBIGUOUS'
  },
  {
    name: 'How Question Test',
    goal: 'How does the agent system work?',
    expected: 'INFORMATION_QUERY'
  },
  {
    name: 'Action Verb Test',
    goal: 'Build a REST API with authentication',
    expected: 'EXECUTION_GOAL'
  }
];

async function testIntent(test) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ goal: test.goal });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/agent/goal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`Goal: "${test.goal}"`);
    console.log(`Expected: ${test.expected}`);
    console.log('='.repeat(70));

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          
          console.log(`\n✓ Response received (${res.statusCode})`);
          
          if (result.intentClassification) {
            const intent = result.intentClassification;
            console.log(`\nIntent Classification:`);
            console.log(`  Type: ${intent.intentType}`);
            console.log(`  Confidence: ${intent.confidence}`);
            console.log(`  Reasoning: ${intent.reasoning}`);
            console.log(`  Keywords: ${intent.keywords.join(', ')}`);
            
            const passed = intent.intentType === test.expected;
            console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Intent ${intent.intentType} ${passed ? '===' : '!=='} ${test.expected}`);
          }
          
          console.log(`\nExecution:`);
          console.log(`  Success: ${result.success}`);
          console.log(`  Has Plan: ${result.plan ? 'Yes' : 'No'}`);
          console.log(`  Has Execution: ${result.execution ? 'Yes' : 'No'}`);
          
          console.log(`\nSummary: ${result.summary.substring(0, 150)}${result.summary.length > 150 ? '...' : ''}`);
          
          resolve(result);
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

    req.setTimeout(30000, () => {
      console.log('✗ Request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('INTENT CLASSIFICATION TEST SUITE');
  console.log('='.repeat(70));
  console.log('\nMake sure the dev server is running on port 3000');
  console.log('Run: npm run dev');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await testIntent(test);
      passed++;
      await new Promise(r => setTimeout(r, 1000)); // Wait between tests
    } catch (e) {
      failed++;
      console.error(`\n✗ Test failed: ${e.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  console.log('='.repeat(70));
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testIntent, runTests };
