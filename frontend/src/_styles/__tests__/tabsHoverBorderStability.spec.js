// Regression guard for ToolJet#18149 — "Glitch: Tabs are moving on hover".
//
// Root cause: the workspace-groups override set `border-right/left/top: none
// !important` on `.nav-link:hover`. tabler's base `.nav-tabs .nav-link` reserves
// `1px solid transparent` on all four edges, so collapsing three of them made
// the hovered flex item 2px narrower and 1px shorter — sibling tabs slid left
// and the tab panel jumped up. The hover underline must never resize the box.
//
// This spec asserts on the real stylesheet source rather than a rendered box for
// two reasons: jsdom performs no layout, so a box measurement is unavailable at
// this layer, and `jest.config.js` maps `.scss` imports to a stub, so the file
// cannot be imported for its content. Compiling with the project's own `sass`
// was tried first and is not viable here either — dart-sass's filesystem layer
// throws `NullError` in `_realCasePath` inside the Jest sandbox. The invariant
// enforced below is therefore the declaration-level cause of the shift.

const fs = require('fs');
const path = require('path');

const STYLES_DIR = path.resolve(__dirname, '..');

/** Flatten SCSS into one record per `{}` block, outermost-first. */
function parseBlocks(src) {
  const out = [];
  const stack = [];
  let selStart = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      stack.push({ raw: src.slice(selStart, i), start: i + 1 });
    } else if (ch === '}') {
      const frame = stack.pop();
      if (frame) {
        out.push({
          raw: frame.raw,
          inner: src.slice(frame.start, i),
          line: src.slice(0, frame.start).split('\n').length,
        });
      }
      selStart = i + 1;
    }
  }
  return out;
}

/** Selector of a block: the trailing chunk before its `{`, ignoring ancestors. */
function selectorOf(raw) {
  const chunks = raw
    .split(/[;{}]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return chunks.length ? chunks[chunks.length - 1] : '';
}

/** Declarations owned by this block, excluding those of nested blocks. */
function ownDeclarations(inner) {
  let depth = 0;
  let out = '';
  for (const ch of inner) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) out += ch;
  }
  return out;
}

const navLinkHoverBlocks = fs
  .readdirSync(STYLES_DIR)
  .filter((file) => file.endsWith('.scss'))
  .flatMap((file) => {
    const src = fs.readFileSync(path.join(STYLES_DIR, file), 'utf8');
    return parseBlocks(src).map((block) => ({
      file,
      ...block,
      selector: selectorOf(block.raw),
      declarations: ownDeclarations(block.inner),
    }));
  })
  .filter((b) => b.selector.includes('nav-link') && b.selector.includes(':hover'));

// Each of these either zeroes a border edge or removes its style, collapsing the
// 1px box tabler reserves — the exact mechanism behind #18149.
const BORDER_COLLAPSING = [
  ['border: none|0', /\bborder\s*:\s*(?:none|0)\b/],
  ['border-<side>: none|0', /\bborder-(?:top|right|bottom|left)\s*:\s*(?:none|0)\b/],
  ['border-width: 0', /\bborder-width\s*:\s*0\b/],
  ['border-style: none', /\bborder-style\s*:\s*none\b/],
];

const groupsHover = navLinkHoverBlocks.find((b) => b.selector.includes('nav-link') && /indigo9/.test(b.declarations));

describe('tab hover does not resize the tab border box (#18149)', () => {
  test('the stylesheets still contain the tab hover rules under test', () => {
    expect(navLinkHoverBlocks.length).toBeGreaterThan(0);
    expect(groupsHover).toBeDefined();
  });

  test('the guard itself detects a collapsing hover rule', () => {
    // If this fails the patterns below can no longer be trusted, so assert the
    // detector's sensitivity before relying on it.
    const side = /\bborder-(?:top|right|bottom|left)\s*:\s*(?:none|0)\b/;
    expect(side.test('border-top: none !important;')).toBe(true);
    expect(side.test('border-top-color: transparent !important;')).toBe(false);

    const shorthand = /\bborder\s*:\s*(?:none|0)\b/;
    expect(shorthand.test('border: none !important;')).toBe(true);
    expect(shorthand.test('border-bottom: 2px solid var(--indigo9);')).toBe(false);
  });

  test('no nav-link :hover rule collapses its border box', () => {
    const offenders = [];

    for (const block of navLinkHoverBlocks) {
      for (const [name, pattern] of BORDER_COLLAPSING) {
        if (pattern.test(block.declarations)) {
          offenders.push(`${block.file}:${block.line} [${name}] ${block.selector.replace(/\s+/g, ' ')}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  test('the workspace-groups hover rule keeps its 1px box by colour alone', () => {
    for (const side of ['top', 'left', 'right']) {
      expect(groupsHover.declarations).toMatch(new RegExp(`border-${side}-color:\\s*transparent\\s*!important`));
    }
  });

  test('the hover underline is still painted, not just suppressed', () => {
    // tabler paints the underline with a 3-value border-color shorthand
    // (top / left-right / bottom), so an explicit border-bottom is not required
    // for the line to appear.
    const vendor = navLinkHoverBlocks.find((b) => /\bborder-color\s*:/.test(b.declarations));
    expect(vendor).toBeDefined();
    expect(vendor.declarations).toMatch(/border-color\s*:\s*#f0f2f6\s+#f0f2f6\s+#e7eaef/);

    // The groups override must neutralise only top/left/right so the vendor
    // bottom value survives.
    expect(groupsHover.declarations).not.toMatch(/\bborder-bottom/);
  });
});
