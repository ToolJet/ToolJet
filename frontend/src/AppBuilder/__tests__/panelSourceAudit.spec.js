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

  test('[UB-07] no style reads --editor-accent-text, which the loaded editor never defines', () => {
    expect(matches(['src', 'ee'], /--editor-accent-text/)).toEqual([]);
  });

  test('[UB-12] panel focus rings use the design-system tokens, not hard-coded or misspelt ones', () => {
    // Only focus rules count: the #C6D4F9 press (:active) and picker-open shadows are not focus rings,
    // and the TJDB and workflow ones sit outside the App Builder.
    const sites = matches(PANEL_ROOTS, /:focus[\w-]*[^{};]*\{[^}]*#c6d4f9|--interactive-focusactive\b/i);
    // queryManager.scss also styles the TJDB pages' foreign key dropdown, which the scope rule leaves alone.
    const tjdbPage = (site) => {
      const [file, line] = site.split(':');
      const above = fs.readFileSync(path.join(FRONTEND, file), 'utf8').split('\n').slice(0, Number(line));
      return /^\.foreignKeyAcces-container\b/.test(above.findLast((text) => /^\S.*\{\s*$/.test(text)) || '');
    };
    expect(sites.filter((site) => !tjdbPage(site))).toEqual([]);
  });

  test.failing('[UC-21] rail items take their names from one registry, not per-call railLabel props', () => {
    // LeftSidebar.jsx:260-351 and the ee rail icons each set tip, railLabel and aria names by hand.
    expect(matches(RAIL_FILES, /\brailLabel=/)).toEqual([]);
  });

  test.failing('[UC-24] panel search fields say what they search instead of a bare "Search"', () => {
    // CodeSearch.tsx:396, DependencyViewer.tsx:128, RuntimeInspector.jsx:296, among others.
    expect(matches(PANEL_ROOTS, /placeholder=(?:"Search"|\{\s*['"]Search['"]\s*\})/)).toEqual([]);
  });

  test('[UB-09] each segmented-toggle rule sets one font size', () => {
    const scss = fs.readFileSync(path.join(FRONTEND, 'src/ToolJetUI/SwitchGroup/toggleGroup.scss'), 'utf8');
    expect(rulesWithRepeatedDeclaration(scss, 'font-size')).toEqual([]);
  });

  test('[UB-09] editor chrome stylesheets put text on the 12/13/14/16px scale', () => {
    // A small size reads --app-builder-small-font-size with its old value as the fallback, so it is
    // 12px in the editor and unchanged where shared styles render outside it.
    const onScale = /^(?:(?:12|13|14|16)px|var\(--app-builder-small-font-size,)/;
    // Fixed boxes that cannot fit 12px: the rail label (42px item; its size waits on the rail names in U7)
    // and the 72x26 palette tile title, an allowed type-scale exception. The data-source suggestion
    // heading is shared with the data-sources page, which keeps its size.
    const pendingFit = ['.left-sidebar-item-label', '.component-title', '.suggestion-container'];
    const sheets = files([...PANEL_ROOTS, 'src/_styles/left-sidebar.scss'], /\.scss$/);
    const offScale = sheets.flatMap((file) => {
      const src = fs.readFileSync(file, 'utf8');
      return [...src.matchAll(/font-size:\s*([^;]+);/g)].flatMap((m) => {
        const value = m[1].trim();
        if (!/^[\d.]+(px|r?em)\b/.test(value) || onScale.test(value)) return [];
        const open = src.lastIndexOf('{', m.index);
        const selector = src
          .slice(Math.max(src.lastIndexOf(';', open), src.lastIndexOf('}', open)) + 1, open)
          .split('\n')
          .filter((line) => line.trim() && !line.trim().startsWith('//'))
          .join(' ')
          .trim();
        if (selector.includes('::') || pendingFit.some((s) => selector.includes(s))) return []; // icon glyphs are not text
        return [`${where(file, src, m.index)} ${selector} ${value}`];
      });
    });
    expect(offScale).toEqual([]);
  });

  test('[UB-07][UB-08] editor chrome reads the editor colour tokens, which pass AA on dark panels', () => {
    // The shared dark --text-accent/-danger/-success stay as they are for everything outside the editor
    // (and for widgets); chrome reads var(--editor-text-*, <shared token>) instead.
    const shared = files(PANEL_ROOTS, /\.(jsx?|tsx?|scss)$/).flatMap((file) => {
      const src = fs.readFileSync(file, 'utf8');
      // tw-text-text-accent maps to --text-brand, which the dark fix never touched.
      const reads =
        /(editor-text-[\w-]+,\s?)?(?:var\(--text-(?:accent|danger|success)\b|tw-text-text-(?:danger|success)\b)/g;
      return [...src.matchAll(reads)].filter((m) => !m[1]).map((m) => where(file, src, m.index));
    });
    expect(shared).toEqual([]);
  });

  test('[UB-01][UA-08] Tailwind typography helpers resolve the App Builder font in the editor', () => {
    // Runs the config's own typography plugin and reads what it emits.
    const config = require(path.join(FRONTEND, 'tailwind.config.js'));
    const utilities = {};
    config.plugins
      .filter((p) => typeof p?.handler === 'function')
      // Other plugins get no-op helpers; only addUtilities output matters here.
      .forEach((p) =>
        p.handler(
          new Proxy(
            { addUtilities: (u) => Object.assign(utilities, u) },
            { get: (api, key) => api[key] || (() => ({})) }
          )
        )
      );
    const families = Object.entries(utilities).filter(([, rules]) => rules.fontFamily);
    expect(families.length).toBeGreaterThan(0);
    const offChain = families
      .filter(([, { fontFamily }]) => !/mono/.test(fontFamily))
      .filter(([, { fontFamily }]) => fontFamily !== 'var(--app-builder-font-family, var(--font-family-inter))')
      .map(([name, { fontFamily }]) => `${name}: ${fontFamily}`);
    expect(offChain).toEqual([]);
  });
});
