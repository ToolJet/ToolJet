import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { a11yRules, lintAccessibility } from '../../../src/lib/app/a11y';

describe('tooljet app check: accessibility lint (jsx-a11y)', () => {
  let dir: string;
  beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-a11y-'))));
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('turns every recommended rule that is on into a warning, keeping its options', () => {
    const rules = a11yRules();
    expect(rules).to.not.have.property('jsx-a11y/label-has-for');
    expect(Object.keys(rules).length).to.be.greaterThan(20);
    for (const setting of Object.values(rules)) {
      expect(Array.isArray(setting) ? setting[0] : setting).to.equal('warn');
    }
  });

  it('reports an image without alt and a clickable div, with file and line, and passes clean TSX', async () => {
    fs.mkdirSync(path.join(dir, 'App'));
    fs.writeFileSync(
      path.join(dir, 'App', 'Bad.tsx'),
      [
        "import React from 'react';",
        'type P = { go: () => void };',
        'export const Bad = ({ go }: P) => (',
        '  <div>',
        '    <img src="/logo.png" />',
        '    <div onClick={go}>Open</div>',
        '    {/* eslint-disable-next-line react-hooks/exhaustive-deps */}',
        '  </div>',
        ');',
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(dir, 'App', 'Good.tsx'),
      'import React from \'react\';\nexport const Good = ({ go }: { go: () => void }) => <button type="button" onClick={go}><img src="/l.png" alt="Logo" /></button>;\n'
    );
    fs.writeFileSync(path.join(dir, 'tooljet.gen.ts'), 'export const x = 1;\n');
    const warnings = await lintAccessibility(dir);
    const rules = warnings.map((w) => `${w.file}:${w.line} ${w.rule}`);
    expect(rules).to.include(`${path.join('App', 'Bad.tsx')}:5 jsx-a11y/alt-text`);
    expect(
      rules.some(
        (r) => r.includes('Bad.tsx:6') && /click-events-have-key-events|no-static-element-interactions/.test(r)
      )
    ).to.equal(true);
    expect(warnings.filter((w) => w.file.includes('Good.tsx'))).to.deep.equal([]);
    expect(warnings.every((w) => w.rule.startsWith('jsx-a11y/'))).to.equal(true);
  });
});
