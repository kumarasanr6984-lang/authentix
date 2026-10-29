import { runNameVerificationTestCases } from '../src/services/nameVerificationService';

const results = runNameVerificationTestCases();
console.log(`OFFICIAL NAME VERIFICATION CASES: ${results.passedCount} / ${results.total} passed`);

for (const r of results.results) {
  if (!r.passed) {
    console.error(`FAILED: ${r.testCase.description}`);
    console.error(`  Expected: ${r.testCase.expectedVerdict}, Got: ${r.actualResult.verdict}`);
  }
}

if (!results.allPassed) {
  process.exit(1);
} else {
  console.log('ALL OFFICIAL NAME VERIFICATION CASES PASSED!');
}
