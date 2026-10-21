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
const strip = createWidgetHarness({
  componentType: 'ShadSummaryStrip',
  handle: 'strip1',
  id: 'strip1',
  widgetHeight: 300,
  widgetWidth: 800,
});
const ROWS = binding("{{[{ id: 1, name: 'A' }, { id: 2, name: 'B' }]}}");
// The widget's root (a portal root left by an earlier widget is a .tj-shadcn too).
const shell = () => document.querySelector('.canvas-component .tj-shadcn');

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

describe('A Summary strip in a fixed box fills it', () => {
  beforeEach(() => strip.setup());
  afterEach(() => strip.teardown());

  test('[FixedBox-006] a Summary strip dragged taller fills its box in the editor, and with dynamic height off', () => {
    for (const [currentMode, properties] of [
      ['edit', {}],
      ['view', { dynamicHeight: binding('{{false}}') }],
    ]) {
      strip.render({ currentMode, properties });
      expect(shell()).toHaveClass('tw-h-full');
      expect(document.querySelector('dl')).toHaveClass('tw-h-full', 'tw-grid');
      strip.teardown();
    }
  });

  test('[FixedBox-007] with dynamic height on in the viewer the strip keeps its figures height, which the box follows', () => {
    strip.render({ currentMode: 'view' });
    expect(shell()).not.toHaveClass('tw-h-full');
    expect(document.querySelector('dl')).not.toHaveClass('tw-h-full');
  });

  test('[FixedBox-008] a strip with no figures centres its message in a fixed box', () => {
    strip.render({ currentMode: 'edit', properties: { items: binding('{{[]}}') } });
    expect(shell().firstElementChild).toHaveClass('tw-h-full', 'tw-items-center');
  });
});

const accordion = createWidgetHarness({
  componentType: 'ShadAccordion',
  handle: 'accordion1',
  id: 'accordion1',
  widgetHeight: 160,
});
const SECTIONS = binding(
  "{{Array.from({ length: 5 }, (_, i) => ({ title: 'Section ' + i, content: 'Line one\\nLine two\\nLine three' }))}}"
);
const OPEN = { items: SECTIONS, multiple: binding('{{true}}'), defaultOpen: binding('{{[0, 1, 2, 3, 4]}}') };

describe('An Accordion in a fixed box scrolls inside it', () => {
  beforeEach(() => accordion.setup());
  afterEach(() => accordion.teardown());

  test('[FixedBox-009] with dynamic height off, or in the editor, its open sections scroll inside the box', () => {
    for (const [currentMode, extra] of [
      ['view', { dynamicHeight: binding('{{false}}') }],
      ['edit', {}],
    ]) {
      accordion.render({ currentMode, properties: { ...OPEN, ...extra } });
      expect(document.querySelectorAll('.canvas-component [data-state=open]').length).toBeGreaterThan(1);
      expect(shell()).toHaveClass('tw-h-full', 'tw-overflow-y-auto');
      accordion.teardown();
    }
  });

  test('[FixedBox-010] with dynamic height on in the viewer it keeps its sections height, which the box follows', () => {
    accordion.render({ currentMode: 'view', properties: OPEN });
    expect(shell()).not.toHaveClass('tw-h-full');
    expect(shell()).not.toHaveClass('tw-overflow-y-auto');
  });
});
