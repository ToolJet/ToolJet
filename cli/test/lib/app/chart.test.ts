import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { scaffoldApp } from '../../../src/lib/app/scaffold';

/*
  Charts in a new app: Recharts (the same major as packs/shadcn) through a shadcn wrapper adapted to this template. How
  they behave was checked in a browser, on the CLI's build and on the Code panel's: this holds the parts a later edit could
  quietly lose.
*/

describe('the code-app template charts', () => {
  let root: string;
  let frontend: string;
  let chart: string;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-chart-'));
    scaffoldApp(path.join(root, 'app'), 'Charts');
    frontend = path.join(root, 'app', 'frontend');
    chart = fs.readFileSync(path.join(frontend, 'src', 'components', 'ui', 'chart.tsx'), 'utf8');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('has Recharts in package.json and the lockfile, so publish and the in-browser build resolve it', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(frontend, 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(frontend, 'package-lock.json'), 'utf8'));
    expect(pkg.dependencies.recharts).to.match(/^\^2\./);
    expect(lock.packages[''].dependencies.recharts).to.equal(pkg.dependencies.recharts);
    expect(lock.packages['node_modules/recharts'].version).to.match(/^2\./);
    for (const dep of Object.keys(lock.packages['node_modules/recharts'].dependencies)) {
      expect(lock.packages[`node_modules/${dep}`], dep).to.exist;
    }
  });

  it('adds no style tag: the scanner and a strict code page policy refuse one', () => {
    expect(chart).not.to.contain('dangerouslySetInnerHTML');
    expect(chart).not.to.contain('<style');
    expect(chart).to.contain('--color-');
  });

  it('stops the JavaScript animation under reduced motion and past the point limit', () => {
    expect(chart).to.contain("'(prefers-reduced-motion: reduce)'");
    expect(chart).to.contain('MAX_ANIMATED_POINTS = 300');
    expect(chart).to.contain('isAnimationActive: isAnimationActive !== false && animate');
  });

  it('recognises series by name, so a chart bundles only what it uses, and leaves them neutral', () => {
    expect(chart).not.to.contain('RechartsPrimitive.Funnel');
    expect(chart).to.contain("'var(--foreground)'");
    expect(chart).to.contain("'var(--muted-foreground)'");
  });

  it('uses the template’s own paths', () => {
    expect(chart).to.contain("from '../../lib/utils'");
    expect(chart).not.to.contain('@/');
  });
});
