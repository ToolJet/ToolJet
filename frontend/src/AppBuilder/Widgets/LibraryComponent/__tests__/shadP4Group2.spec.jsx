import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Hero } from '../../../../../../packs/shadcn/src/components/Hero';
import { Kanban } from '../../../../../../packs/shadcn/src/components/Kanban';
import { Map as MapComponent } from '../../../../../../packs/shadcn/src/components/Map';
import { Select } from '../../../../../../packs/shadcn/src/components/Select';
import { Breadcrumb } from '../../../../../../packs/shadcn/src/components/Breadcrumb';
import { Steps } from '../../../../../../packs/shadcn/src/components/Steps';
import { Skeleton } from '../../../../../../packs/shadcn/src/components/Skeleton';
import { ChartFrame } from '../../../../../../packs/shadcn/src/lib/ui2/charts/chartParts';
import { menuRows, navItems } from '../../../../../../packs/shadcn/src/lib/ui2/nav/model';
import { installBrowserStubs } from './fuzz/packTestEnv';

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  installBrowserStubs();
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  document.body.innerHTML = '';
});

const COMPONENTS = { Hero, Kanban, Map: MapComponent, Select, Breadcrumb, Steps, Skeleton };
const PACK_CSS = (file) =>
  fs.readFileSync(path.resolve(__dirname, `../../../../../../packs/shadcn/src/styles/${file}`), 'utf8');
const ruleOf = (css, selector) => {
  const at = css.indexOf(`${selector} {`);
  return css.slice(at, css.indexOf('}', at));
};

const mount = async (name, props, { disabled = false, styles = {} } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const actions = new Map();
  const host = {
    formField: true,
    fieldId: `p4b-${name}`,
    disabled,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
    setRows: () => {},
  };
  const make = (componentProps) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`shad-p4b-${name}`}
      componentName={name}
      componentProps={componentProps}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      fireEvent={() => {}}
      actions={actions}
      host={host}
      dataCy="pack-p4b"
    />
  );
  const view = render(make(props));
  const root = () => view.container.querySelector('[data-cy="pack-p4b"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  const run = (action, ...args) => act(() => actions.get(action)(...args));
  return { exposed, root, actions, run, rerender: (next) => view.rerender(make(next)) };
};

describe('RK-22: Hero with Disable on', () => {
  it('draws its action buttons disabled', async () => {
    // Break this catches: a disabled Hero keeps enabled-looking buttons (no disabled attribute, no disabled style).
    const h = await mount('Hero', { actionLabel: 'New booking', secondaryActionLabel: 'Later' }, { disabled: true });
    const buttons = [...h.root().querySelectorAll('.ui2-hero-buttons button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Later', 'New booking']);
    buttons.forEach((b) => expect(b.disabled).toBe(true));
  });
});

describe('RK-23: Kanban card fields that hold objects', () => {
  it('leaves them out instead of drawing [object Object]', async () => {
    // Break this catches: String() on an object field draws "[object Object]" (title, badge) and "OO" (avatar).
    const k = await mount('Kanban', {
      data: [{ id: 1, status: 'todo', title: { a: 1 }, priority: { b: 2 }, owner: { c: 3 } }],
      columns: [{ id: 'todo', title: 'To do' }],
      badgeField: 'priority',
      avatarField: 'owner',
    });
    await waitFor(() => expect(k.root().querySelector('.ui2-kb-card-title')).toBeTruthy());
    const text = k.root().textContent;
    expect(text).not.toContain('[object Object]');
    expect(k.root().querySelector('.ui2-kb-avatar')).toBeNull();
    expect(k.root().querySelector('.ui2-kb-foot')).toBeNull();
  });
});

describe('RK-25: Map sample data', () => {
  it('has a name in every sample row, so the default Title field finds a title', () => {
    // Break this catches: the default Title field (name) matches no field of the sample rows, so every popup says Location.
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../packs/shadcn/src/components/Map.tsx'),
      'utf8'
    );
    const sample = src.slice(src.indexOf('const SAMPLE = ['), src.indexOf('];', src.indexOf('const SAMPLE = [')));
    const rows = sample.match(/\n {2}\{/g).length;
    expect(sample.match(/\n {4}name: '/g) || []).toHaveLength(rows);
    expect(src).toMatch(/name: 'titleField'[\s\S]{0,80}initialValue: 'name'/);
  });
});

describe('RK-27 and RK-37: Radius 0 gives square corners', () => {
  it('Schedule frame drops its extra 4px at radius 0 and keeps it otherwise', () => {
    // Break this catches: the frame always adds 4px to Radius, so Radius 0 still draws rounded corners.
    const rule = ruleOf(PACK_CSS('ui2-choice.css'), '.ucs-frame');
    expect(rule).toContain(
      'border-radius: var(--ui-radius-lg, calc(var(--ui-radius) + min(4px, var(--ui-radius) * 4)))'
    );
  });

  it('Skeleton Card block follows Border radius', async () => {
    // Break this catches: the Card shape's big block keeps a fixed 10px radius whatever Border radius says.
    const s = await mount('Skeleton', { shape: 'card' }, { styles: { borderRadius: 0 } });
    const block = [...s.root().querySelectorAll('.ui2-skeleton')].find((el) => el.style.minHeight === '60px');
    expect(block.style.borderRadius).toBe('calc(var(--ui-radius) + min(4px, var(--ui-radius) * 4))');
  });
});

describe('RK-36: Select defaults', () => {
  const placeholderOf = (s) => s.root().querySelector('button[role="combobox"]').textContent;

  it('shows the placeholder for a default that matches no option', async () => {
    // Break this catches: an unmatched default leaves an empty box with a clear x and no placeholder.
    const s = await mount('Select', {
      options: [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
      ],
      defaultValue: 'zzz',
      placeholder: 'Select an option',
    });
    await waitFor(() => expect(placeholderOf(s)).toContain('Select an option'));
    expect(s.root().querySelector('[aria-label="Clear selection"]')).toBeNull();
  });

  it('shows the first label once when two options share the value', async () => {
    // Break this catches: both options with the chosen value draw their text, joined as "AB".
    const s = await mount('Select', {
      options: [
        { label: 'A', value: 1 },
        { label: 'B', value: 1 },
      ],
      defaultValue: 1,
      placeholder: 'Select an option',
    });
    await waitFor(() => expect(placeholderOf(s).trim()).toBe('A'));
  });
});

describe('RK-30: Breadcrumb and menus with bad items', () => {
  it('Breadcrumb draws only entries with something to show, keeping their index in Items', async () => {
    // Break this catches: null, '', {} and a list each draw an empty crumb with a separator.
    const b = await mount('Breadcrumb', { items: [null, '', {}, ['x'], 'Home', 'ok'] });
    const crumbs = [...b.root().querySelectorAll('.n2-crumb')].map((el) => el.textContent);
    expect(crumbs).toEqual(['Home', 'ok']);
    fireEvent.click(b.root().querySelector('button.n2-crumb'));
    await waitFor(() => expect(b.exposed.lastClickedItem).toMatchObject({ title: 'Home', index: 4 }));
  });

  it('Dropdown Menu and Navigation skip an empty text entry', () => {
    // Break this catches: an empty text becomes a blank, clickable row.
    expect(menuRows(['', '  ', 'Edit']).map((r) => r.label)).toEqual(['Edit']);
    expect(navItems(['', 'Home']).map((r) => r.label)).toEqual(['Home']);
  });
});

describe('RK-40: Steps when another step is hidden and shown again', () => {
  it('stays on the same step', async () => {
    // Break this catches: the current position is kept, so showing a step before it moves the current step.
    const s = await mount('Steps', {
      steps: [
        { id: 'a', name: 'Alpha' },
        { id: 'b', name: 'Beta' },
        { id: 'c', name: 'Gamma' },
        { id: 'd', name: 'Delta' },
      ],
      currentStep: '',
      currentStepIndex: 3,
    });
    await waitFor(() => expect(s.exposed.currentStepId).toBe('d'));
    await s.run('setStepVisible', 'c', false);
    await waitFor(() => expect(s.exposed.currentStepId).toBe('d'));
    await s.run('setStep', 'd');
    await s.run('setStepVisible', 'c', true);
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(s.exposed.currentStepId).toBe('d');
  });
});

describe('RK-20: Date Time Picker Popover text color', () => {
  it('reaches the calendar in the popup, dimmer for weekdays and the Time label', () => {
    // Break this catches: the calendar reads only the field's Text color, so the popover color stops at the lists.
    const css = PACK_CSS('ui2-choice.css');
    expect(ruleOf(css, '.uc-pop')).toContain('--lk-cal-fg: var(--lk-menu-fg);');
    expect(ruleOf(css, '.uc-pop')).toContain('--lk-cal-muted: color-mix(in srgb, var(--lk-menu-fg) 60%, transparent);');
    expect(ruleOf(css, '.uc-cal-day')).toContain('color: var(--lk-cal-fg, var(--lk-fg, var(--ui-fg)));');
    expect(ruleOf(css, '.uc-cal-caption')).toContain('color: var(--lk-cal-fg, var(--lk-title, var(--ui-fg)));');
    expect(ruleOf(css, '.uc-cal-weekday')).toContain(
      'color: var(--lk-cal-muted, var(--lk-muted, var(--ui-muted-fg)));'
    );
    expect(ruleOf(css, '.uc-time-row-label')).toContain('color: var(--lk-cal-muted, var(--ui-muted-fg));');
  });
});

describe('RK-24: Map marker image that fails to load', () => {
  it('falls back to the normal pin', async () => {
    // Break this catches: the redraw signature holds the image URL, which does not change, so the broken image stays.
    const m = await mount('Map', {
      data: [{ id: 1, name: 'A', lat: 37.78, lng: -122.41, pic: 'https://broken.invalid/x.png' }],
      imageField: 'pic',
      clusterMarkers: false,
    });
    await waitFor(() => expect(m.root().querySelector('.ui-map-mark img')).toBeTruthy());
    fireEvent.error(m.root().querySelector('.ui-map-mark img'));
    await waitFor(() => expect(m.root().querySelector('.ui-map-mark img')).toBeNull());
    expect(m.root().querySelector('.ui-map-pin')).toBeTruthy();
  });
});

describe('RK-34: Radial Chart Value suffix', () => {
  it('new charts ("auto") show % only in Progress mode; a stored suffix is kept', () => {
    // Break this catches: the Progress-mode % default is added to Categories counts (275%).
    const { radialSuffix } = require('../../../../../../packs/shadcn/src/components/RadialChart');
    expect(radialSuffix('auto', false)).toBe('');
    expect(radialSuffix('auto', true)).toBe('%');
    expect(radialSuffix('%', false)).toBe('%');
    expect(radialSuffix('', true)).toBe('');
  });
});

describe('RK-42: Toggle Group styles the Outline and Plain looks ignored', () => {
  it('Group background shows only for Segmented; Option text color shows and draws in every look', async () => {
    // Break this catches: a style shows for a look that does not draw it (Group background has no bar outside Segmented).
    const { toolJetSdk } = jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
    const spy = jest.spyOn(toolJetSdk, 'useStyleString');
    try {
      const { ToggleGroup } = require('../../../../../../packs/shadcn/src/components/ToggleGroup');
      COMPONENTS.ToggleGroup = ToggleGroup;
      await mount('ToggleGroup', { options: ['All', 'Open'] });
      const optionsOf = (name) => spy.mock.calls.map(([o]) => o).find((o) => o.name === name);
      expect(optionsOf('backgroundColor').visibleWhen).toEqual({ key: 'variant', value: 'segmented' });
      expect(optionsOf('textColor').visibleWhen).toBeUndefined();
      expect(optionsOf('selectedBackgroundColor').visibleWhen).toBeUndefined();
      // Unset, the text keeps the theme text colour it had before the style applied to these looks.
      const rule = ruleOf(PACK_CSS('ui2-choice.css'), ".uc-toggles .ui-toggle:not([data-state='on'])");
      expect(rule).toContain('color: var(--lk-fg, var(--ui-fg));');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('RK-29: chart tooltip in a narrow chart', () => {
  it('leaves the clipped widget box and sits where the chart is', () => {
    // Break this catches: the host clips the widget box, so a tooltip wider than a narrow chart is cut at its edge.
    const view = render(
      <ChartFrame label="chart" resetKey={0} plain>
        <div className="recharts-wrapper" />
      </ChartFrame>
    );
    const chart = view.container.querySelector('.recharts-wrapper');
    const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      // The fixed origin is the widget box (left 100, top 50), drawn at 2x zoom; the chart starts 80px and 40px past it.
      if (this === chart) return { left: 180, top: 90, width: 160, height: 200 };
      if (this.style.position === 'fixed') return { left: 100, top: 50, width: 200, height: 200 };
      return { left: 0, top: 0, width: 0, height: 0 };
    });
    fireEvent.pointerEnter(view.container.querySelector('.ui2-chart'));
    rect.mockRestore();
    expect(chart.style.getPropertyValue('--tip-x')).toBe('40px');
    expect(chart.style.getPropertyValue('--tip-y')).toBe('20px');
    const css = PACK_CSS('ui2-charts.css');
    const wrap = ruleOf(css, '.ui2-chart .recharts-tooltip-wrapper');
    expect(wrap).toContain('position: fixed !important;');
    expect(wrap).toContain('left: var(--tip-x, 0) !important;');
    expect(wrap).toContain('top: var(--tip-y, 0) !important;');
  });
});
