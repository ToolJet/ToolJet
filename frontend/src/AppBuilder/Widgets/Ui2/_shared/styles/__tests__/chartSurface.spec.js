// A Recharts drawing is a block inside its frame: inline, its svg sat on the text baseline of its line box, 1.4px below
// the frame's top, so a 20px Sparkline showed a 3.4px band above it (the Cypress geometry check). jsdom has no layout,
// so the rule is read from the stylesheet.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';

const SCSS = fs.readFileSync(path.join(__dirname, '../shadcn.scss'), 'utf8');

test('[UI2-CHART-SURFACE] a chart svg is drawn as a block', () => {
  const at = SCSS.indexOf('.tj-shadcn .recharts-surface {');
  expect(at).toBeGreaterThan(-1);
  expect(SCSS.slice(at, SCSS.indexOf('}', at))).toMatch(/display:\s*block/);
});
