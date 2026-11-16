import assert from 'node:assert';
import {
  evaluateEligibility,
  ELIGIBILITY_VERDICTS
} from '../src/engine/deterministicEligibilityEngine.js';

console.log('[Test Suite] Running Deterministic Eligibility Engine Tests...');

// Standard 1st Year Rule
const ruleFirstYear = {
  pathway: 'FIRST_YEAR',
  branchCode: 'MECH',
  minPercentageGeneral: 35.0,
  minPercentageReserved: 30.0,
  mandatorySubjects: ['MATHEMATICS', 'SCIENCE'],
  minAgeYears: 14,
  ruleVersion: '2025.1'
};

// Standard Lateral Entry MECH Rule
const ruleLateralMech = {
  pathway: 'LATERAL_ENTRY',
  branchCode: 'MECH',
  minPercentageGeneral: 35.0,
  minPercentageReserved: 30.0,
  eligibleItiTrades: ['FITTER', 'TURNER', 'MACHINIST', 'WELDER', 'MECHANIC_MOTOR_VEHICLE'],
  ruleVersion: '2025.1'
};

// 1. First Year General Pass
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'GENERAL',
    aggregatePercentage: 58.5,
    subjects: { mathematics: true, science: true },
    ageYears: 16
  };
  const result = evaluateEligibility(candidate, ruleFirstYear, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.ELIGIBLE, '1st Year General candidate with 58.5% should be ELIGIBLE');
  assert.strictEqual(result.isEligible, true);
  console.log('✓ Test 1 Passed: 1st Year General Pass (58.5%)');
}

// 2. First Year General Borderline Fail (34.9%)
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'GENERAL',
    aggregatePercentage: 34.9,
    subjects: { mathematics: true, science: true },
    ageYears: 16
  };
  const result = evaluateEligibility(candidate, ruleFirstYear, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.NOT_ELIGIBLE, '1st Year General candidate with 34.9% should be NOT_ELIGIBLE');
  assert.strictEqual(result.isEligible, false);
  console.log('✓ Test 2 Passed: 1st Year General Borderline Fail (34.9%)');
}

// 3. First Year Reserved (SC/ST) Pass at 32% (cutoff 30%)
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'SC',
    aggregatePercentage: 32.0,
    subjects: { mathematics: true, science: true },
    ageYears: 15
  };
  const result = evaluateEligibility(candidate, ruleFirstYear, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.ELIGIBLE, '1st Year SC candidate with 32.0% should be ELIGIBLE');
  console.log('✓ Test 3 Passed: 1st Year Reserved (SC/ST) Pass (32%)');
}

// 4. First Year Subject Failure (Failed Science)
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'GENERAL',
    aggregatePercentage: 72.0,
    subjects: { mathematics: true, science: false },
    ageYears: 16
  };
  const result = evaluateEligibility(candidate, ruleFirstYear, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.NOT_ELIGIBLE, 'Candidate who failed Science should be NOT_ELIGIBLE');
  console.log('✓ Test 4 Passed: 1st Year Subject Failure (Failed Science)');
}

// 5. First Year Age Underage (13 Years)
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'GENERAL',
    aggregatePercentage: 65.0,
    subjects: { mathematics: true, science: true },
    ageYears: 13
  };
  const result = evaluateEligibility(candidate, ruleFirstYear, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.NOT_ELIGIBLE, 'Underage candidate (13 years) should be NOT_ELIGIBLE');
  console.log('✓ Test 5 Passed: 1st Year Age Underage (13 Years)');
}

// 6. Lateral Entry ITI Aligned Trade (Fitter -> Mechanical)
{
  const candidate = {
    pathway: 'LATERAL_ENTRY',
    examType: 'ITI',
    itiTrade: 'fitter',
    aggregatePercentage: 68.0,
    branchCode: 'MECH'
  };
  const result = evaluateEligibility(candidate, ruleLateralMech, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.ELIGIBLE, 'ITI Fitter candidate applying for MECH should be ELIGIBLE');
  console.log('✓ Test 6 Passed: Lateral Entry ITI Aligned Trade (Fitter -> MECH)');
}

// 7. Lateral Entry ITI Mismatched Trade (COPA -> Mechanical)
{
  const candidate = {
    pathway: 'LATERAL_ENTRY',
    examType: 'ITI',
    itiTrade: 'COPA',
    aggregatePercentage: 75.0,
    branchCode: 'MECH'
  };
  const result = evaluateEligibility(candidate, ruleLateralMech, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.NOT_ELIGIBLE, 'ITI COPA candidate applying for MECH should be NOT_ELIGIBLE');
  console.log('✓ Test 7 Passed: Lateral Entry ITI Mismatched Trade (COPA -> MECH)');
}

// 8. Lateral Entry 12th Science PCM
{
  const candidate = {
    pathway: 'LATERAL_ENTRY',
    examType: '12TH_SCIENCE',
    aggregatePercentage: 54.0,
    subjects: { physics: true, chemistry: true, mathematics: true },
    branchCode: 'MECH'
  };
  const result = evaluateEligibility(candidate, ruleLateralMech, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.ELIGIBLE, '12th Science PCM should be ELIGIBLE for Lateral Entry');
  console.log('✓ Test 8 Passed: Lateral Entry 12th Science PCM');
}

// 9. Lateral Entry 12th Vocational (Conditional Verification)
{
  const candidate = {
    pathway: 'LATERAL_ENTRY',
    examType: '12TH_VOCATIONAL',
    aggregatePercentage: 60.0,
    branchCode: 'MECH'
  };
  const result = evaluateEligibility(candidate, ruleLateralMech, 'en');
  assert.strictEqual(result.verdict, ELIGIBILITY_VERDICTS.NEEDS_MANUAL_VERIFICATION, '12th Vocational should require NEEDS_MANUAL_VERIFICATION');
  assert.strictEqual(result.needsVerification, true);
  console.log('✓ Test 9 Passed: Lateral Entry 12th Vocational (Conditional Verification)');
}

// 10. Multilingual Explanations in Odia and Hindi
{
  const candidate = {
    pathway: 'FIRST_YEAR',
    category: 'GENERAL',
    aggregatePercentage: 32.0, // Fails General (needs 35%)
    subjects: { mathematics: true, science: false } // Fails Science
  };

  const resultOdia = evaluateEligibility(candidate, ruleFirstYear, 'or');
  assert(resultOdia.plainReason.includes('ଦୁଃଖିତ'), 'Odia explanation should contain polite Odia rejection phrasing');
  assert(resultOdia.evaluations.some(e => e.explanation.includes('ବାଧ୍ୟତାମୂଳକ ବିଷୟ')), 'Odia evaluation should cite mandatory subjects');

  const resultHindi = evaluateEligibility(candidate, ruleFirstYear, 'hi');
  assert(resultHindi.plainReason.includes('खेद है'), 'Hindi explanation should contain polite Hindi rejection phrasing');
  assert(resultHindi.evaluations.some(e => e.explanation.includes('अनिवार्य विषय')), 'Hindi evaluation should cite mandatory subjects');

  console.log('✓ Test 10 Passed: Multilingual Plain-Language Explanations (Odia & Hindi)');
}

console.log('\nAll 10 Deterministic Eligibility Engine unit tests passed with 100% accuracy!');
