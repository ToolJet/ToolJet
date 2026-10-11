const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('scrollable mixin (Issue #18148)', () => {
  const repoRoot = path.resolve(__dirname, '../../../../');
  const tempScssPath = path.resolve(repoRoot, 'temp_test_scrollable.scss');

  const scssInput = `
@import "frontend/src/_styles/mixins.scss";

.test-scrollable-container {
  @include scrollable(50vh);
}
`;

  fs.writeFileSync(tempScssPath, scssInput, 'utf-8');

  let compiledCss = '';
  try {
    compiledCss = execSync(`npx sass "${tempScssPath}"`, {
      encoding: 'utf-8',
      cwd: repoRoot,
    });
  } finally {
    try {
      fs.unlinkSync(tempScssPath);
    } catch {}
  }

  test('Test 1 — Dark mode', () => {
    // 1. Verify scrollbar-color: var(--interactive-selected) transparent
    const darkModeFirefoxRegex = /(?:\.theme-dark\s+\.test-scrollable-container|\.dark-theme\s+\.test-scrollable-container|\.test-scrollable-container\.theme-dark|\.test-scrollable-container\.dark-theme)[^{]*\{[^}]*scrollbar-color:\s*var\(--interactive-selected\)\s+transparent[^}]*\}/s;
    expect(compiledCss).toMatch(darkModeFirefoxRegex);

    // 2. Verify scrollbar thumb uses var(--interactive-selected)
    const darkModeThumbRegex = /(?:\.theme-dark\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-thumb|\.dark-theme\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-thumb|\.test-scrollable-container\.theme-dark::-(?:webkit-)?scrollbar-thumb|\.test-scrollable-container\.dark-theme::-(?:webkit-)?scrollbar-thumb)[^{]*\{[^}]*background-color:\s*var\(--interactive-selected\)[^}]*\}/s;
    expect(compiledCss).toMatch(darkModeThumbRegex);

    // 3. Verify hover uses var(--interactive-hover)
    const darkModeThumbHoverRegex = /(?:\.theme-dark\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-thumb:hover|\.dark-theme\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-thumb:hover|\.test-scrollable-container\.theme-dark::-(?:webkit-)?scrollbar-thumb:hover|\.test-scrollable-container\.dark-theme::-(?:webkit-)?scrollbar-thumb:hover)[^{]*\{[^}]*background-color:\s*var\(--interactive-hover\)[^}]*\}/s;
    expect(compiledCss).toMatch(darkModeThumbHoverRegex);

    // 4. Verify the track is transparent
    const darkModeTrackRegex = /(?:\.theme-dark\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-track|\.dark-theme\s+\.test-scrollable-container::-(?:webkit-)?scrollbar-track|\.test-scrollable-container\.theme-dark::-(?:webkit-)?scrollbar-track|\.test-scrollable-container\.dark-theme::-(?:webkit-)?scrollbar-track)[^{]*\{[^}]*background:\s*transparent[^}]*\}/s;
    expect(compiledCss).toMatch(darkModeTrackRegex);
  });

  test('Test 2 — Light mode', () => {
    // 1. Verify original Firefox colors #888 #f1f1f1
    const lightFirefoxRegex = /\.test-scrollable-container\s*\{[^}]*scrollbar-color:\s*#888\s+#f1f1f1[^}]*\}/s;
    expect(compiledCss).toMatch(lightFirefoxRegex);

    // 2. Verify thumb is #888
    const lightThumbRegex = /\.test-scrollable-container::-webkit-scrollbar-thumb\s*\{[^}]*background-color:\s*#888;[^}]*\}/s;
    expect(compiledCss).toMatch(lightThumbRegex);

    // 3. Verify hover is #555
    const lightThumbHoverRegex = /\.test-scrollable-container::-webkit-scrollbar-thumb:hover\s*\{[^}]*background-color:\s*#555;[^}]*\}/s;
    expect(compiledCss).toMatch(lightThumbHoverRegex);

    // 4. Verify track is #f1f1f1
    const lightTrackRegex = /\.test-scrollable-container::-webkit-scrollbar-track\s*\{[^}]*background:\s*#f1f1f1;[^}]*\}/s;
    expect(compiledCss).toMatch(lightTrackRegex);
  });
});
