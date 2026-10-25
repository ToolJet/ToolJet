import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { normalizeColumns } from '../../../../../../../packs/shadcn/src/lib/ui2/table/model';
import { formatter, affixFormatter } from '../../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel';
import { formatValue, withAffixes } from '../../../../../../../packs/shadcn/src/lib/format';
import { TOKEN, unlessDefault } from '../../../../../../../packs/shadcn/src/lib/styleDefaults';

installBrowserStubs();

// shadcn pack, round two of the team's UI 2.0 issues (2026-10-24): style fields default to what they draw, the Kanban
// custom-card hint, theme radius in popups and charts, the DataTable filter select ring, explicit number types that
// never turn into money, no doubled currency symbol, and the narrow-slot Kanban, ListView and Stepper fixes. The pack
// components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK = path.resolve(__dirname, '../../../../../../../packs/shadcn');
const SOURCE = require('../../../../../../../packs/shadcn/src/index.ts');
const MANIFEST = path.join(PACK, 'dist/manifest.json');
const css = (file) => fs.readFileSync(path.join(PACK, 'src/styles', file), 'utf8');
// The rule body of one selector in a stylesheet (the first rule that names exactly it).
const rule = (file, selector) => {
  const text = css(file);
  const at = text.indexOf(`${selector} {`);
  return at < 0 ? '' : text.slice(at, text.indexOf('}', at));
};

let mounts = 0;
const mount = async (name, props = {}, styles = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE[name] });
  mounts += 1;
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl={`r2-${mounts}.js`}
        cssUrl={`r2-${mounts}.css`}
        cacheKey={`round2-${name}-${mounts}`}
        componentName={name}
        componentProps={props}
        componentStyles={styles}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost(name, {})}
        dataCy="pack-widget"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  return { view, root };
};
// A widget's drawing, with React's generated ids and instance counters taken out.
const drawing = (root) =>
  root()
    .querySelector('.tj-cc-root')
    .innerHTML.replace(/:r[0-9a-z]+:/g, ':id:')
    .replace(/\b(ui2q)-\d+/g, '$1-n')
    .replace(/(--now: )[\d.]+/g, '$1t');

// The drawing once it stops changing (an Avatar shows its fallback only after its image gives up, on a timer).
const settled = async (root) => {
  let last = drawing(root);
  for (let i = 0; i < 20; i += 1) {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    const next = drawing(root);
    if (next === last) return next;
    last = next;
  }
  return last;
};

const manifestOrSkip = fs.existsSync(MANIFEST) ? describe : describe.skip;

manifestOrSkip('style fields default to what they draw', () => {
  const manifest = JSON.parse(fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, 'utf8') : '{"components":{}}');
  const names = Object.keys(manifest.components);
  const styles = (name) => manifest.components[name].styles ?? [];
  // Left blank on purpose: legacy aliases still listed with a swatch, and colours that depend on another choice (the
  // Hero background, an image's backdrop, a caption gradient).
  const BLANK_COLORS = new Set([
    'Accordion.borderColor',
    'AccordionContainer.headerColor',
    'Avatar.fallbackColor',
    'Tabs.listBackground',
    'Tabs.activeBackground',
    'Progress.accentColor',
    'Hero.backgroundColor',
    'Image.backgroundColor',
    'Carousel.captionBackgroundColor',
  ]);

  test('every visible colour field names a theme token or the colour drawn', () => {
    const blank = [];
    const bad = [];
    for (const name of names)
      for (const s of styles(name)) {
        if (s.inspector !== 'color') continue;
        const key = `${name}.${s.name}`;
        if (!s.default) {
          if (!BLANK_COLORS.has(key)) blank.push(key);
        } else if (!/^var\(--cc-[\w-]+\)$|^#[0-9a-f]{3,8}$|^transparent$/i.test(s.default)) bad.push(`${key}=${s.default}`);
      }
    expect(blank).toEqual([]);
    expect(bad).toEqual([]);
    // 578 of 626 were blank before; now only the listed ones and non-colour text styles are.
    const all = names.flatMap((name) => styles(name).filter((s) => s.inspector !== 'hidden'));
    const stillBlank = all.filter((s) => (s.default === undefined || s.default === '') && s.placeholder === undefined);
    expect(stillBlank.length).toBeLessThan(25);
  });

  test('every number field shows its drawn number or says it follows the theme', () => {
    const missing = [];
    for (const name of names)
      for (const s of styles(name))
        if (s.type === 'number' && (s.default === undefined || s.default === '') && !s.placeholder) missing.push(`${name}.${s.name}`);
    expect(missing).toEqual([]);
    const radius = styles('Button').find((s) => s.name === 'borderRadius');
    expect(radius.placeholder).toBe('Theme radius');
    expect(styles('Kanban').find((s) => s.name === 'columnGap').default).toBe(16);
  });

  test('the declared default reads back as unset, so the component keeps its unset look', () => {
    expect(unlessDefault('var(--cc-primary-brand)', TOKEN.brand)).toBe('');
    expect(unlessDefault(' VAR(--cc-primary-brand ) ', TOKEN.brand)).toBe('');
    expect(unlessDefault('#123456', TOKEN.brand)).toBe('#123456');
    expect(unlessDefault('16', 16)).toBe('');
    expect(unlessDefault(20, 16)).toBe(20);
  });

  // The jsdom half of "no visual change": a widget at its new defaults (nothing stored), with those defaults stamped
  // into the definition as a fresh drop does, and with every style cleared, draws the same markup. (Real Chrome, with
  // and without an app theme, against the previous bundle: see the round-two report.)
  test.each(names)('%s draws the same unset, at its stamped defaults and cleared', async (name) => {
    const entry = manifest.components[name];
    const props = Object.fromEntries((entry.props ?? []).filter((p) => p.default !== undefined).map((p) => [p.name, p.default]));
    const stamped = Object.fromEntries(styles(name).filter((s) => s.default !== undefined && s.default !== '').map((s) => [s.name, s.default]));
    const cleared = Object.fromEntries(styles(name).map((s) => [s.name, '']));
    const unset = await settled((await mount(name, props, {})).root);
    cleanup();
    const atDefaults = await settled((await mount(name, props, stamped)).root);
    cleanup();
    const afterClear = await settled((await mount(name, props, cleared)).root);
    cleanup();
    expect(atDefaults).toBe(unset);
    expect(afterClear).toBe(unset);
  });

  test('a colour the builder picks still reaches the widget', async () => {
    const t = await mount('Button', { label: 'Go' }, { backgroundColor: '#123456' });
    expect(drawing(t.root)).toContain('#123456');
    cleanup();
    const picked = await mount('DataTable', { data: [{ id: 1, a: 'x' }] }, { rowHoverColor: '#abcdef' });
    expect(drawing(picked.root)).toContain('#abcdef');
  });
});

describe('hints', () => {
  test('the Kanban custom-card help names {{cardData}}', () => {
    const source = fs.readFileSync(path.join(PACK, 'src/components/Kanban.tsx'), 'utf8');
    const hint = source.match(/description: '(Custom: each card[^']*)'/)[1];
    expect(hint).toContain('{{cardData}}');
    expect(hint).toContain('{{cardData.title}}');
  });
});

describe('theme radius and the filter select ring', () => {
  test('popup items, the dialog, funnel bars and heatmap cells follow the theme radius', () => {
    expect(rule('ui.css', '.ui-menu-item')).toContain('border-radius: calc(var(--ui-radius) - 2px)');
    expect(rule('ui2-inputs.css', '.ui2-pop-item')).toContain('calc(var(--ui-radius) - 2px)');
    expect(css('ui.css')).toMatch(/border: 1px solid var\(--ui-border\);\s*\/\*[^*]*\*\/\s*border-radius: calc\(var\(--ui-radius\) \+ 4px\);\s*background: var\(--ui-bg\);\s*box-shadow: var\(--ui-shadow-lg\)/);
    expect(rule('ui2-charts.css', '.ui2-funnel-bar')).toContain('border-radius: var(--ui-radius)');
    expect(rule('ui2-charts.css', '.ui2-heatmap-cell')).toContain('border-radius: calc(var(--ui-radius) - 2px)');
    // The popup layer's radius is the theme's: no fixed fallback beyond the 6px of an unthemed host.
    expect(css('ui.css')).toContain('--ui-radius: var(--tj-radius, 6px)');
  });

  test('the DataTable filter selects take the brand ring, not the browser outline', () => {
    const focus = rule('ui2-table.css', '.t2-select:focus');
    expect(focus).toContain('outline: none');
    expect(focus).toContain('box-shadow: 0 0 0 3px var(--ui-ring)');
    expect(focus).toContain('border-color: var(--ui-primary)');
  });
});

describe('an explicit number type never becomes money', () => {
  const sample = [{ id: 1, total_claims: 20, total: 1250.5, amount: 99, claims: 3 }];
  const typeOf = (columns, key) => normalizeColumns(columns, sample).find((c) => c.key === key).type;

  test('columnType number stays a number whatever the name', () => {
    expect(typeOf([{ key: 'total_claims', name: 'Total claims', columnType: 'number' }], 'total_claims')).toBe('number');
    expect(typeOf([{ key: 'amount', name: 'Amount', columnType: 'number' }], 'amount')).toBe('number');
    // A currency set on the column is the author's choice.
    expect(typeOf([{ key: 'amount', columnType: 'number', currency: 'EUR' }], 'amount')).toBe('currency');
  });

  test('a column with no type: counts named with a weak money word stay counts, money stays money', () => {
    expect(typeOf([{ key: 'total_claims' }], 'total_claims')).toBe('number');
    expect(typeOf([{ key: 'total' }], 'total')).toBe('currency');
    expect(typeOf([{ key: 'amount' }], 'amount')).toBe('currency');
    expect(typeOf(undefined, 'total_claims')).toBe('number');
  });

  test('the DataTable draws "Total claims" plain beside its other numbers', async () => {
    const t = await mount('DataTable', {
      data: [{ id: 1, adjuster: 'Ana', open_claims: 7, total_claims: 20 }],
      columns: [
        { key: 'adjuster', name: 'Adjuster' },
        { key: 'open_claims', name: 'Open claims', columnType: 'number' },
        { key: 'total_claims', name: 'Total claims', columnType: 'number' },
      ],
    });
    const cells = [...t.root().querySelectorAll('tbody td')].map((td) => td.textContent.trim());
    expect(cells).toContain('20');
    expect(cells.join(' ')).not.toContain('$');
  });

  test('a ProgressList bound to counts prints counts by default', async () => {
    const t = await mount('ProgressList', {
      data: [
        { id: 1, label: 'Offen', count: 10 },
        { id: 2, label: 'Erledigt', count: 9 },
      ],
      labelField: 'label',
      valueField: 'count',
      targetField: '',
    });
    const text = t.root().textContent;
    expect(text).toContain('10');
    expect(text).not.toContain('$');
  });
});

describe('a currency or percent symbol is never written twice', () => {
  test('chart axis ticks and tooltips with a "$" prefix on a currency format', () => {
    expect(formatter({ format: 'currency', prefix: '$' }, true)(1200)).toBe('$1.2K');
    expect(formatter({ format: 'currency', prefix: '$' })(1200)).toBe('$1,200');
    expect(formatter({ format: 'currency', prefix: '$' })(-1200)).toBe('-$1,200');
    expect(formatter({ format: 'percent', suffix: '%' })(42)).toBe('42%');
    // A prefix the format does not write is kept.
    expect(formatter({ format: 'number', prefix: '$' }, true)(1200)).toBe('$1.2K');
    expect(formatter({ format: 'currency', prefix: '~' })(10)).toBe('~$10');
    expect(affixFormatter({ valuePrefix: '$' }, true)(1200)).toBe('$1.2K');
  });

  test('stats and lists, including a currency written after the figure', () => {
    expect(formatValue(1200, { format: 'currency', prefix: '$' })).toBe('$1,200');
    // German writes the sign after the figure, with a no-break space.
    expect(formatValue(1200, { format: 'currency', currency: 'EUR', locale: 'de-DE', suffix: ' €' })).toMatch(/^1\.200\s€$/);
    expect(formatValue(1200, { format: 'currency', currency: 'EUR', locale: 'de-DE', prefix: '€' })).toMatch(/^1\.200\s€$/);
    expect(withAffixes('1,200', 'Approx. ', ' units')).toBe('Approx. 1,200 units');
  });
});

describe('narrow slots', () => {
  test('Kanban column marks are drawn inset, so the board edge never cuts them', () => {
    for (const selector of ['.ui2-kb-col.is-over', '.ui2-kb-col.is-collapsed:hover', '.ui2-kb-col.is-collapsed.is-over', '.ui2-kb-col:focus-visible'])
      expect(rule('ui2-display-kanban.css', selector)).toMatch(/box-shadow: inset 0 0 0 [12]px/);
  });

  describe('the Kanban right-edge fade', () => {
    const size = { client: 555, scroll: 555 };
    const observers = [];
    let restore;
    beforeEach(() => {
      const proto = HTMLElement.prototype;
      // jsdom keeps clientWidth and scrollWidth on Element.prototype: the overrides below shadow them.
      const before = { ro: window.ResizeObserver };
      const board = (el) => el.classList?.contains('ui2-kb');
      Object.defineProperty(proto, 'clientWidth', { configurable: true, get() { return board(this) ? size.client : 0; } });
      Object.defineProperty(proto, 'scrollWidth', { configurable: true, get() { return board(this) ? size.scroll : 0; } });
      window.ResizeObserver = class {
        constructor(cb) {
          this.cb = cb;
          this.targets = [];
          observers.push(this);
        }
        observe(el) {
          this.targets.push(el);
        }
        unobserve() {}
        disconnect() {
          this.targets = [];
        }
      };
      restore = () => {
        delete proto.clientWidth;
        delete proto.scrollWidth;
        window.ResizeObserver = before.ro;
      };
    });
    afterEach(() => restore());
    const fade = (t) => t.root().querySelector('.ui2-kb').classList.contains('has-more-right');
    // The board's own observer: the one watching the .ui2-kb element.
    const boardObserver = () => observers.find((o) => o.targets.some((el) => el.classList?.contains('ui2-kb')));

    test('goes once the columns settle to fit, without the board resizing', async () => {
      size.scroll = 900;
      const t = await mount('Kanban', {});
      expect(fade(t)).toBe(true);
      // The columns are observed as well as the board.
      expect(boardObserver().targets.some((el) => el.classList?.contains('ui2-kb-col'))).toBe(true);
      size.scroll = 555;
      await act(async () => boardObserver().cb([]));
      expect(fade(t)).toBe(false);
    });

    test('stays while columns really are off screen', async () => {
      size.scroll = 555;
      const t = await mount('Kanban', {});
      expect(fade(t)).toBe(false);
      size.scroll = 900;
      await act(async () => boardObserver().cb([]));
      expect(fade(t)).toBe(true);
    });
  });

  test('a narrow ListView row wraps its trailing group instead of squeezing the title to nothing', () => {
    expect(rule('ui2-display-lists.css', '.u2l-list-item.is-fields:not(.is-grid)')).toContain('flex-wrap: wrap');
    expect(rule('ui2-display-lists.css', '.u2l-list-item.is-fields:not(.is-grid) .u2l-list-text')).toContain('flex: 1 1 80px');
    const trail = rule('ui2-display-lists.css', '.u2l-list-item.is-fields:not(.is-grid) .u2l-list-trail');
    expect(trail).toContain('flex-wrap: wrap');
    expect(trail).toContain('max-width: 100%');
  });

  test('a ListView row of components in an outlined card keeps its content off the frame; a plain row adds none', async () => {
    expect(rule('ui2-display-lists.css', '.u2l-list-item.is-canvas.is-framed')).toContain('padding: 0 12px');
    expect(rule('ui2-display-lists.css', '.u2l-list-item.is-canvas')).toContain('padding: 0');
    const data = [{ id: 1, name: 'Harbour Lofts' }];
    const outlined = await mount('ListView', { data, itemContent: 'components' }, { itemVariant: 'outline' });
    expect(outlined.root().querySelector('.u2l-list-item.is-canvas').classList.contains('is-framed')).toBe(true);
    cleanup();
    const plain = await mount('ListView', { data, itemContent: 'components' }, { itemVariant: 'plain' });
    expect(plain.root().querySelector('.u2l-list-item.is-canvas').classList.contains('is-framed')).toBe(false);
  });

  test('a narrow Stepper shortens its labels, then scrolls its head, and names each step', async () => {
    const head = rule('extended.css', '.ui-stepper-head');
    expect(head).toContain('overflow-x: auto');
    expect(rule('extended.css', '.ui-stepper-label')).toContain('text-overflow: ellipsis');
    const t = await mount('Stepper', {});
    const labels = [...t.root().querySelectorAll('.ui-stepper-label')];
    expect(labels.length).toBeGreaterThan(1);
    labels.forEach((label) => expect(label.getAttribute('title')).toBe(label.textContent));
  });
});
