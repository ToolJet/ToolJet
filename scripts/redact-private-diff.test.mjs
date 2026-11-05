import assert from 'node:assert/strict';
import test from 'node:test';
import redactor from './redact-private-diff.cjs';

const header =
  'diff --git a/server/ee/ledger.ts b/server/ee/ledger.ts\n--- a/server/ee/ledger.ts\n+++ b/server/ee/ledger.ts\n';

test('removes source and function context while preserving changed-line metadata', () => {
  const input =
    header + '@@ -4,2 +4,3 @@ function syntheticLedger()\n-oldValue();\n+newValue();\n+\n unchangedValue();\n';
  assert.equal(
    redactor.redactPrivateDiff(input),
    header + '@@ -4,2 +4,3 @@\n-[source omitted]\n+[source omitted]\n+[source omitted]\n [source omitted]\n'
  );
});

test('retains new-file metadata and resets its hunk state between files', () => {
  const first = header + '@@ -1 +1 @@\n-oldValue();\n+newValue();\n';
  const second =
    'diff --git a/server/ee/new.ts b/server/ee/new.ts\nnew file mode 100644\n--- /dev/null\n+++ b/server/ee/new.ts\n@@ -0,0 +1 @@\n+newFile();\n';
  const output = redactor.redactPrivateDiff(first + second);
  assert.match(output, /new file mode 100644\n--- \/dev\/null\n\+\+\+ b\/server\/ee\/new.ts/);
  assert.equal(output.split('\n').filter((line) => line === '+[source omitted]').length, 2);
  assert.doesNotMatch(output, /oldValue|newValue|newFile/);
});

test('keeps the no-newline marker as patch metadata', () => {
  assert.match(
    redactor.redactPrivateDiff(header + '@@ -1 +1 @@\n-oldValue\n+newValue\n\\ No newline at end of file\n'),
    /\\ No newline at end of file/
  );
});

test('fails closed on encoded or unsupported patch payloads', () => {
  assert.throws(() => redactor.redactPrivateDiff('unframed private source\n'), /Unexpected/);
  assert.throws(() => redactor.redactPrivateDiff(header + 'GIT binary patch\nliteral 12\n'), /Binary patch/);
  assert.throws(() => redactor.redactPrivateDiff(header + '@@@ -1 -1 +1 @@@\n'), /Unsupported/);
  assert.throws(() => redactor.redactPrivateDiff(header + '@@ -1 +1 @@\nunprefixed source\n'), /Unexpected/);
});
