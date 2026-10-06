// Run: node --test scripts/time-migrations.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeMigrations, renderSummary } from './time-migrations.mjs';

const at = (t, line) => ({ t, line });
const NEW = (n) => `${n} migrations are new migrations must be executed.`;
const DONE = (name) => `Migration ${name} has been executed successfully.`;

test('times each migration from the previous success line, the first from the anchor', () => {
  const rows = timeMigrations([
    at(0.0, NEW(2)),
    at(0.004, 'query: START TRANSACTION'),
    at(0.042, DONE('AddAiRunCancellation1788820000000')),
    at(48.113, DONE('BackfillFooStyle1788900000000')),
    at(48.29, 'query: COMMIT'),
  ], { judged: new Set(['1788900000000']), limit: 30 });

  assert.deepEqual(
    rows.map(({ name, seconds, judged, slow }) => ({ name, seconds: +seconds.toFixed(3), judged, slow })),
    [
      { name: 'AddAiRunCancellation1788820000000', seconds: 0.042, judged: false, slow: false },
      { name: 'BackfillFooStyle1788900000000', seconds: 48.071, judged: true, slow: true },
      { name: '(commit)', seconds: 0.177, judged: false, slow: false },
    ]
  );
});

test('resets the anchor for each CLI run (schema migrations, then data migrations)', () => {
  const rows = timeMigrations([
    at(0, NEW(1)),
    at(2, DONE('AddCol1790000000000')),
    at(2.5, 'query: COMMIT'),
    at(10, NEW(1)),
    at(15, DONE('BackfillCol1790000000001')),
    at(15.1, 'query: COMMIT'),
  ]);

  assert.deepEqual(rows.filter((r) => r.name !== '(commit)').map((r) => [r.name, r.seconds]), [
    ['AddCol1790000000000', 2],
    ['BackfillCol1790000000001', 5],
  ]);
});

test('only judged migrations can be slow; others are reported only', () => {
  const rows = timeMigrations([
    at(0, NEW(2)),
    at(90, DONE('MergedEarlier1790000000000')),
    at(91, DONE('ThisPr1790000000001')),
  ], { judged: new Set(['1790000000001']), limit: 30 });

  assert.deepEqual(rows.map(({ name, judged, slow }) => ({ name, judged, slow })), [
    { name: 'MergedEarlier1790000000000', judged: false, slow: false },
    { name: 'ThisPr1790000000001', judged: true, slow: false },
  ]);
});

test('matches lines that TypeORM colours with ANSI escape codes', () => {
  const rows = timeMigrations([
    at(0, NEW(1)),
    at(3, DONE('AddIndex1790598290000')),
    at(3.4, '\u001b[90m\u001b[4mquery:\u001b[24m\u001b[39m \u001b[94mCOMMIT\u001b[0m'),
  ]);
  assert.deepEqual(rows.map((r) => [r.name, +r.seconds.toFixed(1)]), [
    ['AddIndex1790598290000', 3],
    ['(commit)', 0.4],
  ]);
});

test('nothing pending means no rows', () => {
  assert.deepEqual(timeMigrations([at(0, 'No migrations are pending')]), []);
});

test('summary marks over-limit, within-limit and merged-earlier rows', () => {
  const md = renderSummary(
    [
      { name: 'Slow1790000000001', seconds: 48.07, judged: true, slow: true },
      { name: 'Fast1790000000002', seconds: 0.04, judged: true, slow: false },
      { name: 'Old1790000000000', seconds: 3, judged: false, slow: false },
    ],
    30
  );
  assert.match(md, /\| Slow1790000000001 \| 48\.07s \| ❌ over 30s limit \|/);
  assert.match(md, /\| Fast1790000000002 \| 0\.04s \| ✅ \|/);
  assert.match(md, /\| Old1790000000000 \| 3\.00s \| merged earlier, not judged \|/);
});
