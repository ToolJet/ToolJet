/**
 * @jest-environment node
 */
// Every surface of the right-side query panel and the Inspector/Debugger drawer is the surface layer the
// left panel uses: white in light mode, the dark surface in dark mode. The legacy bottom-pane rules
// paint the header and preview bar with --base (#FCFCFD) and the preview body with --slate3, so the
// override has to come after them and name the token, not a hex value, so dark mode stays dark.
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '../../../_styles/queryManager.scss'), 'utf8');

const SURFACES = [
  '.query-manager-header--right',
  '.preview-section .preview-toggle',
  '.preview-section .preview-content',
  '.preview-data-container',
];

const overrideStart = styles.lastIndexOf('// Every surface of the right-side query panel is the white surface layer');
const overrideBlock = overrideStart === -1 ? '' : styles.slice(overrideStart);

test('paints the query header and every preview surface with the white surface token', () => {
  expect(overrideBlock).toMatch(/^[^\n]*\n[\s\S]*?\.right-sidebar-query-configuration \.query-manager--right \{/);
  SURFACES.forEach((selector) => expect(overrideBlock).toContain(selector));
  expect(overrideBlock).toMatch(/background:\s*var\(--background-surface-layer-01\);/);
});

test('comes after the legacy grey surface rules it overrides', () => {
  const legacyRules = [
    /\.preview-toggle \{[^}]*background-color: var\(--base\)/,
    /\.preview-content \{[^}]*background-color: var\(--slate3\)/,
  ];
  legacyRules.forEach((rule) => {
    const legacyIndex = styles.search(rule);
    expect(legacyIndex).toBeGreaterThan(-1);
    expect(overrideStart).toBeGreaterThan(legacyIndex);
  });
});

const ruleBody = (selector) => {
  const start = styles.indexOf(`\n${selector} {`);
  return start === -1 ? '' : styles.slice(start, styles.indexOf('\n}', start));
};

// Break this catches: the query body and its fields stay white in dark mode.
test('gives the query panel shell no hard-coded white background', () => {
  ['.right-sidebar-query-configuration', '.query-manager--right'].forEach((selector) => {
    const body = ruleBody(selector);
    expect(body).not.toBe('');
    expect(body).not.toMatch(/background:\s*#fff/i);
  });
  expect(styles).not.toMatch(/var\(--query-panel-background,\s*#fff/i);
});

// Break this catches: the Inspector/Debugger drawer shows --base around its content in dark mode.
test('paints the Inspector and Debugger drawer with the surface token', () => {
  expect(overrideBlock).toMatch(
    /\.query-pane\.runtime-panel-content\s*\{\s*background:\s*var\(--background-surface-layer-01\);/
  );
});
