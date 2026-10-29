/**
 * @jest-environment node
 */
// Every surface of the right-side query panel is the white surface layer. The legacy bottom-pane rules
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
