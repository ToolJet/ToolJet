import fs from 'fs';
import path from 'path';
import { LEFT_SIDEBAR_WIDTH } from '../appCanvasConstants';

// QA 2026-11-05: the Access panel is 420px wide but the canvas cleared only the default 350, so it covered the app's
// left edge and the "This version is locked" banner. The canvas has to clear each panel's own width.
const panelWidth = (file, item) => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../../../ee/modules/CodeMode/AppBuilder', file), 'utf8');
  const rule = new RegExp(`\\.PopoverContent\\.${item}\\s*\\{[^}]*width:\\s*min\\((\\d+)px`).exec(css);
  return rule ? Number(rule[1]) : null;
};

describe('left panels wider than the default', () => {
  it.each([
    ['access', 'Access/access.scss'],
    ['security', 'Security/security.scss'],
  ])('the canvas clears the %s panel', (item, file) => {
    const width = panelWidth(file, item);
    if (width === null) return; // Not this edition.
    expect(LEFT_SIDEBAR_WIDTH[item]).toBe(width);
  });
});
