/**
 * A UI 2.0 surface in a fixed box fills it. The editor draws every widget at its saved height (and the viewer keeps it
 * when Dynamic height is off); a Hero panel that stopped at its content (max-height) and a Table card that ended at its
 * last row left a blank band between the card and the bottom of a taller box, under the selection outline. With dynamic
 * height on in the viewer the box follows the content instead, so the surface keeps its own height there.
 * Real store, real RenderWidget, real widgets.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import fs from 'fs';
import path from 'path';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const hero = createWidgetHarness({ componentType: 'ShadHero', handle: 'hero1', id: 'hero1', widgetHeight: 320 });
const table = createWidgetHarness({
  componentType: 'ShadTable',
  handle: 'table1',
  id: 'table1',
  widgetHeight: 440,
  widgetWidth: 600,
});
const ROWS = binding("{{[{ id: 1, name: 'A' }, { id: 2, name: 'B' }]}}");
const shell = () => document.querySelector('.tj-shadcn');

describe('A UI 2.0 surface in a fixed box fills it', () => {
  beforeEach(async () => {
    await hero.setup();
    await table.setup();
  });
  afterEach(() => {
    hero.teardown();
    table.teardown();
  });

  test('[FixedBox-001] the Hero panel fills its box in the editor, and in the viewer with dynamic height off', () => {
    for (const [currentMode, properties] of [
      ['edit', {}],
      ['view', { dynamicHeight: binding('{{false}}') }],
    ]) {
      hero.render({ currentMode, properties });
      const panel = document.querySelector('section.sc-hero');
      expect(shell()).toHaveClass('tw-h-full');
      expect(panel).toHaveClass('tw-h-full', 'tw-overflow-y-auto');
      expect(panel).not.toHaveClass('tw-max-h-full');
      hero.teardown();
    }
  });

  test('[FixedBox-002] with dynamic height on in the viewer the Hero keeps its content height', () => {
    hero.render({ currentMode: 'view' });
    expect(shell()).not.toHaveClass('tw-h-full');
    expect(document.querySelector('section.sc-hero')).not.toHaveClass('tw-h-full');
  });

  test('[FixedBox-003] the Table card fills its box in the editor, its rows scrolling inside', () => {
    table.render({ currentMode: 'edit', properties: { data: ROWS } });
    const scroll = document.querySelector('table').parentElement;
    expect(shell()).toHaveClass('tw-h-full');
    expect(shell().firstElementChild).toHaveClass('tw-h-full');
    expect(scroll).toHaveClass('tw-flex-1', 'tw-min-h-0', 'tw-overflow-auto');
    expect(scroll.style.maxHeight).toBe('');
  });

  test('[FixedBox-004] with dynamic height on in the viewer the Table card keeps its rows height', () => {
    table.render({ currentMode: 'view', properties: { data: ROWS } });
    const scroll = document.querySelector('table').parentElement;
    expect(shell()).not.toHaveClass('tw-h-full');
    expect(scroll).not.toHaveClass('tw-flex-1');
  });

  test('[FixedBox-005] the native Table in the UI 2.0 look hugs its rows only when the box follows them', () => {
    const look = fs.readFileSync(path.resolve(__dirname, '../../../NewTable/shadcnLook.scss'), 'utf8');
    const source = fs.readFileSync(path.resolve(__dirname, '../../../NewTable/Table.jsx'), 'utf8');
    // The hugging rules sit under .tj-table-look-fit, which Table.jsx sets only with dynamic height on in the viewer.
    expect(look).toMatch(/&\.tj-table-look-fit \{\s*height: auto !important;/);
    expect(look).not.toMatch(/^\s{2}height: auto !important;/m);
    expect(source).toMatch(/isDynamicHeightEnabled \? ' tj-table-look-fit' : ''/);
    expect(source).toMatch(/const isDynamicHeightEnabled = properties\.dynamicHeight && currentMode === 'view';/);
  });
});
