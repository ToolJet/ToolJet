import fs from 'fs';
import path from 'path';

// The editor canvas paints widgets before the lazy Grid chunk (and its Grid.css) loads. If the rule that takes
// widget boxes out of normal flow only ships with that chunk, every box first stacks below the ones above it and
// then jumps to its saved place.
test('[Grid-LAYOUT-001] the eagerly loaded canvas stylesheet positions editor widget boxes absolutely', () => {
  // Break this catches: `.target, .nested-target { position: absolute }` living only in the lazily loaded
  // Grid.css, so editor widgets paint stacked and jump once the grid chunk arrives.
  const scss = fs.readFileSync(path.join(__dirname, '../appCanvas.scss'), 'utf8');
  const rule = scss.match(/(^|\n)\.target,\s*\n\.nested-target\s*\{([^}]*)\}/);

  expect(rule).not.toBeNull();
  expect(rule[2]).toMatch(/position:\s*absolute;/);
});
