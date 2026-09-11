// Reconstruct the base from a complete unified patch. PR APIs can omit/truncate
// patches: verify both hunk lengths and independent file-level change counts.
function readTestDiff(source, { patch, additions, deletions }) {
  const fail = () => {
    throw new Error('Missing or incomplete diff; supply a reliable base comparison with --base-ref <ref>');
  };
  if (!Number.isInteger(additions) || additions < 0 || !Number.isInteger(deletions) || deletions < 0) fail();
  if (!patch && additions === 0 && deletions === 0) return { before: source, oldLines: [], newLines: [] };
  if (typeof patch !== 'string' || !patch.startsWith('@@ ')) fail();
  const current = source ? source.replace(/\n$/, '').split('\n') : [];
  const before = [];
  const oldLines = [];
  const newLines = [];
  const lines = patch.replace(/\n$/, '').split('\n');
  let cursor = 0;
  for (let i = 0; i < lines.length; ) {
    const hunk = lines[i++].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!hunk) fail();
    const [, oldStart, oldCount = '1', newStart, newCount = '1'] = hunk;
    // An empty range starts AFTER its numbered line (including line zero).
    const start = Number(newStart) - (Number(newCount) > 0 ? 1 : 0);
    if (start < cursor || start > current.length) fail();
    before.push(...current.slice(cursor, start));
    cursor = start;
    if (before.length !== Number(oldStart) - (Number(oldCount) > 0 ? 1 : 0)) fail();
    let oldRead = 0;
    let newRead = 0;
    while (i < lines.length && !lines[i].startsWith('@@ ')) {
      const line = lines[i++];
      if (line === '\\ No newline at end of file') continue;
      const prefix = line[0];
      if (![' ', '+', '-'].includes(prefix)) fail();
      const content = line.slice(1);
      if (prefix !== '-') {
        if (cursor >= current.length || current[cursor] !== content) fail();
        if (prefix === '+') newLines.push(cursor + 1);
        cursor++;
        newRead++;
      }
      if (prefix !== '+') {
        if (prefix === '-') oldLines.push(before.length + 1);
        before.push(content);
        oldRead++;
      }
    }
    if (oldRead !== Number(oldCount) || newRead !== Number(newCount)) fail();
  }
  if (oldLines.length !== deletions || newLines.length !== additions) fail();
  before.push(...current.slice(cursor));
  return { before: before.join('\n'), oldLines, newLines };
}

function affectedTests(current, previous, { oldLines, newLines }) {
  const affected = new Set();
  let sharedSetup = false;
  const includes = (range, line) => range.start <= line && range.end >= line;
  for (const [tests, lines, isCurrent] of [
    [current, newLines, true],
    [previous, oldLines, false],
  ]) {
    for (const line of lines) {
      const direct = tests.filter((test) => includes(test, line));
      if (direct.length) {
        for (const test of direct) {
          if (isCurrent) affected.add(test);
          else {
            // Deleting an assertion can leave no added line inside its test.
            for (const candidate of current) {
              if (candidate.title === test.title && candidate.scope === test.scope) affected.add(candidate);
            }
          }
        }
      } else {
        sharedSetup = true;
        const enclosing = tests.flatMap((test) => test.suites).filter((suite) => includes(suite, line));
        enclosing.sort((a, b) => a.end - a.start - (b.end - b.start));
        const scope = enclosing[0]?.scope;
        for (const test of current) {
          if (!scope || test.suites.some((suite) => suite.scope === scope)) affected.add(test);
        }
      }
    }
  }
  return { tests: [...affected], sharedSetup };
}

module.exports = { readTestDiff, affectedTests };
