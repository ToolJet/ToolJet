import assert from 'node:assert/strict';
import test from 'node:test';
import policy from './ai-test-policy.cjs';

test('AI HTTP regressions belong to normal e2e execution, not the focused unit runner', () => {
  const file = 'server/ee/test/modules/ai/e2e/conversation-access.spec.ts';
  assert.equal(policy.testKind('server', file), 'e2e');
  assert.equal(policy.isFocusedTest('server', file), false);
});
test('cross-module regressions may exercise AI without moving to another module', () => {
  const file = 'server/test/modules/workspaces/unit/ai-plan.spec.ts';
  assert.equal(policy.testKind('server', file), 'unit');
  assert.equal(policy.isFocusedTest('server', file), false);
});
test('in-source files and node:test naming still fail normal Jest placement', () => {
  assert.equal(policy.testKind('server', 'server/ee/ai/cache.spec.ts'), null);
  assert.equal(policy.testKind('server', 'server/ee/test/modules/ai/unit/cache.test.ts'), null);
});
test('red-first regression cases remain executable while skips and focused tests are rejected', () => {
  assert.equal(policy.hasDisabledTest("test.failing('reproduces a regression', () => {});"), false);
  for (const modifier of ['skip', 'only', 'todo']) {
    assert.equal(policy.hasDisabledTest(`test.${modifier}('does not run the normal suite');`), true);
  }
});
