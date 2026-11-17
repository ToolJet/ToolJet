/**
 * @jest-environment node
 */
// QA ids come from the panel redesign QA report (ToolJet PR #18471). jsdom loads no SCSS and
// renders no portals, so these read the source text. Each `test.failing` is an open QA item; flip
// it to `test` with its fix.
import fs from 'fs';
import path from 'path';

const FRONTEND = path.join(__dirname, '../../..');
const PANEL_ROOTS = [
  'src/AppBuilder',
  'src/ToolJetUI',
  'src/_styles/queryManager.scss',
  'ee/modules/AiBuilder',
  'ee/modules/AppHistory',
  'ee/modules/AppLibraries',
];
const RAIL_FILES = [
  'src/AppBuilder/LeftSidebar/LeftSidebar.jsx',
  'ee/modules/AiBuilder/components/Sidebar/AiSidebarItem.jsx',
  'ee/modules/AppHistory/components/AppHistoryIcon.jsx',
  'ee/modules/AppLibraries/components/AppLibrariesIcon.jsx',
];

function files(roots, extensions = /\.(jsx?|tsx?|scss)$/) {
  const out = [];
  const walk = (abs) => {
    if (!fs.existsSync(abs)) return; // ee/ is absent on CE checkouts
    if (fs.statSync(abs).isDirectory()) {
      if (/(__tests__|node_modules|\/Widgets)$/.test(abs)) return;
      fs.readdirSync(abs).forEach((name) => walk(path.join(abs, name)));
    } else if (extensions.test(abs) && !/\.stories\./.test(abs)) {
      out.push(abs);
    }
  };
  roots.forEach((root) => walk(path.join(FRONTEND, root)));
  return out;
}

const where = (file, src, index) => `${path.relative(FRONTEND, file)}:${src.slice(0, index).split('\n').length}`;

function matches(roots, pattern, extensions) {
  return files(roots, extensions).flatMap((file) => {
    const src = fs.readFileSync(file, 'utf8');
    return [...src.matchAll(new RegExp(pattern, `${pattern.flags.replace('g', '')}g`))].map((m) =>
      where(file, src, m.index)
    );
  });
}

// A ToolTip around a button does not name it, so only the tag's own props count.
function unnamedIconOnly() {
  return files(PANEL_ROOTS, /\.(jsx?|tsx)$/).flatMap((file) => {
    const src = fs.readFileSync(file, 'utf8');
    return [...src.matchAll(/<[A-Z][\w.]*\b/g)].flatMap((open) => {
      let depth = 0;
      let end = open.index + open[0].length;
      for (; end < src.length; end++) {
        if (src[end] === '{') depth++;
        else if (src[end] === '}') depth--;
        else if (src[end] === '>' && depth === 0) break;
      }
      const tag = src.slice(open.index, end + 1);
      const iconOnly = /\biconOnly(?=[\s/>]|=\{(?!false\}))/.test(tag);
      const named = /aria-label|aria-labelledby|\btitle=|\{\.\.\./.test(tag);
      return iconOnly && !named ? [where(file, src, open.index)] : [];
    });
  });
}

function rulesWithRepeatedDeclaration(scss, name) {
  const body = scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const stack = [];
  const repeated = [];
  for (const token of body.match(/[{};]|[^{};]+/g)) {
    if (token === '{') stack.push({ selector: stack.pending, count: 0 });
    else if (token === '}') {
      const rule = stack.pop();
      if (rule.count > 1) repeated.push(rule.selector);
    } else if (token !== ';') {
      if (new RegExp(`^\\s*${name}\\s*:`).test(token) && stack.length) stack.at(-1).count++;
      stack.pending = token.trim();
    }
  }
  return repeated;
}

describe('panel source audit', () => {
  test('[X-02] active Cypress specs and helpers never click the rail Inspector or Debugger the redesign removed', () => {
    const cypress = (dir) => path.relative(FRONTEND, path.join(FRONTEND, '../cypress-tests/cypress', dir));
    // Verifiers leave *.lane-tmp.* copies of trunk specs while a lane runs.
    const scanned = [
      [cypress('e2e'), /^(?!.*\.lane-tmp\.).*\.cy\.js$/],
      [cypress('support'), /^(?!.*\.lane-tmp\.).*\.js$/],
    ];
    scanned.forEach(([root, extensions]) => expect(files([root], extensions).length).toBeGreaterThan(0));
    expect(
      scanned.flatMap(([root, extensions]) => matches([root], /left-sidebar-(debugger|inspector)\b/, extensions))
    ).toEqual([]);
  });

  test.failing('[UB-04] every icon-only button in the panels has an accessible name', () => {
    // 47 unnamed sites at 4bdaed6682, e.g. QueryManagerHeader.jsx:238 (Run), Inspector.jsx:737 (menu),
    // QueryCard.jsx:185 (row menu), Restapi/Tabs.jsx:66 (add header).
    expect(unnamedIconOnly()).toEqual([]);
  });

  test.failing('[UB-07] no style reads --editor-accent-text, which the loaded editor never defines', () => {
    // theme.scss:7820-7828 scopes it to .apploader; 12 uses fall back to --indigo9.
    expect(matches(['src', 'ee'], /--editor-accent-text/)).toEqual([]);
  });

  test.failing('[UB-12] panel focus rings use the design-system tokens, not hard-coded or misspelt ones', () => {
    // #C6D4F9 rings (queryManager.scss, Restapi/index.jsx:272, GRPC.jsx:95) and the misspelt
    // --interactive-focusactive in ToolJetUI/Tabs/tabs.scss:82.
    expect(matches(PANEL_ROOTS, /#c6d4f9|--interactive-focusactive\b/i)).toEqual([]);
  });

  test.failing('[UC-21] rail items take their names from one registry, not per-call railLabel props', () => {
    // LeftSidebar.jsx:260-351 and the ee rail icons each set tip, railLabel and aria names by hand.
    expect(matches(RAIL_FILES, /\brailLabel=/)).toEqual([]);
  });

  test.failing('[UC-24] panel search fields say what they search instead of a bare "Search"', () => {
    // CodeSearch.tsx:396, DependencyViewer.tsx:128, RuntimeInspector.jsx:296, among others.
    expect(matches(PANEL_ROOTS, /placeholder=(?:"Search"|\{\s*['"]Search['"]\s*\})/)).toEqual([]);
  });

  test.failing('[UB-09] each segmented-toggle rule sets one font size', () => {
    // toggleGroup.scss:14 and :22 both set font-size on .ToggleGroupItem, so 12px becomes 10px.
    const scss = fs.readFileSync(path.join(FRONTEND, 'src/ToolJetUI/SwitchGroup/toggleGroup.scss'), 'utf8');
    expect(rulesWithRepeatedDeclaration(scss, 'font-size')).toEqual([]);
  });

  test.failing('[UB-01][UA-08] Tailwind typography helpers resolve the App Builder font in the editor', () => {
    // tailwind.config.js typography utilities hard-code var(--font-family-inter), so editor chrome
    // built from them renders Inter next to IBM Plex panels.
    const config = fs.readFileSync(path.join(FRONTEND, 'tailwind.config.js'), 'utf8');
    const bare = [...config.matchAll(/fontFamily:\s*'var\(--font-family-inter\)'/g)].map((m) =>
      where(path.join(FRONTEND, 'tailwind.config.js'), config, m.index)
    );
    expect(bare).toEqual([]);
  });
});
