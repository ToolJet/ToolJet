import fs from 'fs';
import path from 'path';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Rocket 2.0. The pack's components, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

const STYLES = path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles');
// The declarations a Rocket stylesheet gives a selector (jsdom matches no :focus-visible).
const rule = (file, selector) => {
  const style = document.createElement('style');
  style.textContent = fs.readFileSync(path.join(STYLES, file), 'utf8');
  document.head.appendChild(style);
  const found = [...style.sheet.cssRules].find((r) => r.selectorText === selector);
  style.remove();
  return found?.style;
};
const count = (v, event) => v.events.filter((e) => e === event).length;

// PF-129: On focus and On blur fired only when the palette opened and closed, never for focus on the swatch.
describe('Rocket Color Picker focus events', () => {
  const swatch = (v) => v.root().querySelector('.ui2-color-trigger');

  test('[PackComponent-COLORPICKER-010] focus on the swatch fires On focus, leaving it On blur', async () => {
    const v = await mountPack('shadcn', 'ColorPicker', {});

    act(() => {
      fireEvent.focus(swatch(v));
    });
    expect(count(v, 'onFocus')).toBe(1);

    act(() => {
      fireEvent.blur(swatch(v));
    });
    await settle();
    expect(count(v, 'onBlur')).toBe(1);
  });

  test('[PackComponent-COLORPICKER-011] Set focus and Set blur fire them', async () => {
    const v = await mountPack('shadcn', 'ColorPicker', {});

    await v.run('setFocus');
    expect(count(v, 'onFocus')).toBe(1);
    await v.run('setBlur');
    await settle();
    expect(count(v, 'onBlur')).toBe(1);
  });
});

// PF-138, PF-147, PF-166, PF-170, PF-202: Tab skipped every Rocket chart. The chart (its named image) is a Tab stop,
// with a focus ring.
describe('Rocket charts from the keyboard', () => {
  test.each(['LineChart', 'BarChart', 'RadarChart', 'ComboChart', 'Sparkline'])(
    '[PackComponent-CHART-010] the %s is a Tab stop',
    async (chart) => {
      const v = await mountPack('shadcn', chart, {});

      await waitFor(() => expect(v.root().querySelector('[role=img][aria-label]')).toBeTruthy());
      expect(v.root().querySelector('[role=img][aria-label]').getAttribute('tabindex')).toBe('0');
    }
  );

  test('[PackComponent-CHART-011] a focused chart shows a ring', () => {
    const ring =
      rule('ui2-charts.css', '.ui2-chart-area[role="img"]:focus-visible') ??
      rule('ui2-charts.css', ".ui2-chart-area[role='img']:focus-visible");
    expect(ring.outline).toMatch(/2px solid/);
  });
});

// PF-259: a Skeleton whose Background was bound to a number or an object crashed ("e.replace is not a function").
test.each([42, { a: 1 }])(
  '[PackComponent-SKELETON-001] a Background of %p is ignored, the Skeleton draws',
  async (bg) => {
    const v = await mountPack('shadcn', 'Skeleton', {}, { styles: { backgroundColor: bg } });

    expect(v.root().querySelector('.ui-skeleton-wrap')).toBeTruthy();
  }
);

// PF-270: a Link's Font size set to text, empty or null (the host gives a number property set to text as null) drew at
// the 8px minimum, not the 14px default.
test.each([null, ''])('[PackComponent-LINK-010] Font size %p draws at the 14px default', async (fontSize) => {
  const v = await mountPack('shadcn', 'Link', { fontSize });

  expect(v.root().querySelector('a').style.fontSize).toBe('14px');
});

// PF-288: the Select item action chose a disabled item, which a click cannot.
test('[PackComponent-NAVIGATION-010] Select item leaves a disabled item unchosen', async () => {
  const items = [
    { label: 'On', value: 'on' },
    { label: 'Off', value: 'off', disabled: true },
  ];
  const v = await mountPack('shadcn', 'Navigation', { items, defaultValue: 'on' });

  await v.run('selectItem', 'off');
  expect(v.exposed.value).toBe('on');
  await v.run('selectItem', 'on');
  expect(v.exposed.value).toBe('on');
});

// PF-298: a focused Button Group button showed no ring: .n2-group > .ui-btn's box-shadow: none beat the Button's.
test('[PackComponent-BUTTONGROUP-010] a focused group button shows the Button focus ring', () => {
  // Read as text: jsdom's parser drops ui2-nav.css (its @container rules).
  const css = fs.readFileSync(path.join(STYLES, 'ui2-nav.css'), 'utf8');
  const block = css.slice(css.indexOf('.n2-group > .ui-btn:focus-visible {'));
  expect(block.slice(0, block.indexOf('}'))).toContain('box-shadow: 0 0 0 3px var(--ui-ring);');
});

// PF-218: the Sparkline's Type had no fx toggle: the editor gives none to a field labelled exactly "Type".
test('[PackComponent-SPARKLINE-010] the type property is labelled Chart type, not Type', async () => {
  const real = toolJetSdk.useStateEnumeration;
  const declared = {};
  jest.spyOn(toolJetSdk, 'useStateEnumeration').mockImplementation((options) => {
    declared[options.name] = options;
    return real(options);
  });
  await mountPack('shadcn', 'Sparkline', {});

  expect(declared.type.label).toBe('Chart type');
});

// PF-299: in the editor a Dropdown Menu could not be dragged by its trigger: Radix opened the menu on pointerdown and
// cancelled it, so the canvas got no mousedown. In the editor the press stops before Radix, and a click opens the menu.
describe('Rocket Dropdown Menu in the editor', () => {
  const trigger = (v) => v.root().querySelector('button.n2-trigger');

  test('[PackComponent-DROPDOWNMENU-010] a press on the trigger is not cancelled', async () => {
    const v = await mountPack('shadcn', 'DropdownMenu', {}, { host: { editing: true } });

    const press = new window.Event('pointerdown', { bubbles: true, cancelable: true, composed: true });
    Object.assign(press, { button: 0, ctrlKey: false, pointerType: 'mouse' });
    act(() => {
      trigger(v).dispatchEvent(press);
    });

    expect(press.defaultPrevented).toBe(false);
  });

  test('[PackComponent-DROPDOWNMENU-011] a click opens the menu', async () => {
    const v = await mountPack('shadcn', 'DropdownMenu', {}, { host: { editing: true } });

    act(() => {
      fireEvent.click(trigger(v));
    });
    await settle();

    expect(trigger(v).getAttribute('data-state')).toBe('open');
  });
});
