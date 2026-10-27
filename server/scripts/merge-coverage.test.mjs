import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./merge-coverage.mjs', import.meta.url));

test('coverage transported from another checkout merges into the same source file', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-transfer-')));
  try {
    const producer = path.join(root, 'producer');
    const consumer = path.join(root, 'consumer');
    const writeReport = (cwd, hits) => {
      fs.mkdirSync(path.join(cwd, 'input'), { recursive: true });
      const source = path.join(cwd, 'src/service.ts');
      const entry = {
        path: source,
        statementMap: {
          0: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
          1: { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } },
        },
        fnMap: {}, branchMap: {}, s: hits, f: {}, b: {},
      };
      fs.writeFileSync(path.join(cwd, 'input/coverage-final.json'), JSON.stringify({ [source]: entry }));
    };
    writeReport(producer, { 0: 1, 1: 0 });
    writeReport(consumer, { 0: 0, 1: 1 });
    execFileSync(process.execPath, [script, '--relative-paths', '--reporters', 'json', '--out', 'portable', 'input'], { cwd: producer });
    const portable = JSON.parse(fs.readFileSync(path.join(producer, 'portable/coverage-final.json')));
    assert.deepEqual(Object.keys(portable), ['src/service.ts']);
    assert.equal(portable['src/service.ts'].path, 'src/service.ts');
    fs.cpSync(path.join(producer, 'portable'), path.join(consumer, 'oauth'), { recursive: true });
    execFileSync(process.execPath, [script, '--reporters', 'json,json-summary', '--out', 'merged', 'input', 'oauth'], { cwd: consumer });
    const merged = JSON.parse(fs.readFileSync(path.join(consumer, 'merged/coverage-final.json')));
    const source = path.join(consumer, 'src/service.ts');
    assert.deepEqual(Object.keys(merged), [source]);
    assert.deepEqual(merged[source].s, { 0: 1, 1: 1 });
    const summary = JSON.parse(fs.readFileSync(path.join(consumer, 'merged/coverage-summary.json')));
    assert.equal(summary.total.lines.total, 2);
    assert.equal(summary.total.lines.covered, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
