// Real-store property checks for the shadcn/ui pack (experiment): every property and style of every pack widget,
// mounted through the real composed store and RenderWidget (so ToolJet's resolver, validation and FallbackBoundary
// are in the path), in the form the inspector stores it and as an fx binding. Reports, per property:
//   crash     the widget fell back ("Something went wrong") or threw
//   parity    the plain value and the same value as {{...}} render differently
//   effect    a different valid value changes nothing the user can see or read (a dead property)
//   live      changing the property on a mounted widget (an inspector edit, a binding update) does not match a fresh
//             mount with that value, or changing it back does not restore the original
// Shared by the shard*.spec.jsx suites in this folder; not a suite itself.
import React from 'react';
import { act } from '@testing-library/react';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { createWidgetHarness, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const R = jest.requireActual('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 480, height: 280 }}>{R.cloneElement(children, { width: 480, height: 280 })}</div>
    ),
  };
});

// Recharts animates its shapes (react-smooth): two snapshots taken at different moments differ. Charts draw their final
// frame at once here.
jest.mock('react-smooth', () => {
  const R = jest.requireActual('react');
  const Animate = ({ children, to, attributeName }) => {
    const style = attributeName ? { [attributeName]: to } : to;
    return typeof children === 'function' ? children(style) : R.Children.only(children);
  };
  return { __esModule: true, default: Animate, Animate };
});

// Browser APIs jsdom lacks, which an opened popover or select list calls. PointerEvent too: without it a pointer
// event carries no button, and Radix opens menus only on a primary-button press.
if (typeof window !== 'undefined') {
  if (!window.PointerEvent) {
    class PointerEvent extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    window.PointerEvent = PointerEvent;
  }
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function scrollIntoView() {};
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function setPointerCapture() {};
  Element.prototype.releasePointerCapture =
    Element.prototype.releasePointerCapture || function releasePointerCapture() {};
}

export const CONFIGS = Object.fromEntries(shadcnConfigs.map((c) => [c.name, c]));
export const NAMES = Object.keys(CONFIGS);

// ---- Values --------------------------------------------------------------------------------------------------------

const SAMPLE_ROWS = [
  {
    id: 1,
    label: 'Alpha',
    value: 'a',
    title: 'Alpha task',
    name: 'Alpha',
    status: 'todo',
    month: 'Jan',
    revenue: 30,
    x: 'A',
    y: 3,
  },
  {
    id: 2,
    label: 'Beta',
    value: 'b',
    title: 'Beta task',
    name: 'Beta',
    status: 'done',
    month: 'Feb',
    revenue: 70,
    x: 'B',
    y: 9,
  },
  {
    id: 3,
    label: 'Gamma',
    value: 'c',
    title: 'Gamma task',
    name: 'Gamma',
    status: 'todo',
    month: 'Mar',
    revenue: 50,
    x: 'C',
    y: 5,
  },
];
const resolveDefault = (value) => {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!m) return value;
  try {
    return new Function(`return (${m[1]});`)(); // eslint-disable-line no-new-func
  } catch {
    return value;
  }
};
const schemaTypes = (schema) =>
  !schema ? [] : schema.type === 'union' ? schema.schemas.flatMap(schemaTypes) : [schema.type];

// Text properties whose valid values are not free text: a value of the right kind for each.
const KEY_VALUES = [
  [/^currency$/i, 'EUR'],
  [/^locale$/i, 'de-DE'],
  [/^(dateFormat|format)$/i, 'YYYY/MM/DD'],
  [/^minDate$/i, '2026-10-20'],
  [/^maxDate$/i, '2026-10-05'],
  [/^disabledDates$/i, ['2026-10-14', '2026-10-15']],
  [/^minTime$/i, '09:00'],
  [/^maxTime$/i, '11:00'],
  [/^defaultCountry$/i, 'GB'],
  [/^onlyCountries$/i, ['GB', 'FR']],
];

/** A valid value different from the default, for a property or style meta, or undefined when none is known. */
export const alternativeOf = (meta, defaultValue, key = '') => {
  const d = resolveDefault(defaultValue);
  const known = KEY_VALUES.find(([re]) => re.test(key));
  if (known) return known[1];
  if (meta.type === 'alignButtons') return d === 'center' ? 'right' : 'center';
  const options = (meta.options || [])
    .map((o) => (o && typeof o === 'object' ? o.value : o))
    .filter((v) => v !== undefined);
  if (options.length) return options.find((o) => String(o) !== String(d));
  const types = schemaTypes(meta.validation?.schema);
  if (meta.type === 'toggle' || types[0] === 'boolean') return !(d === true || d === 'true');
  if (meta.type === 'colorSwatches') return d === '#e11d48' ? '#2563eb' : '#e11d48';
  if (meta.type === 'boxShadow') return '0px 4px 12px 0px #00000059';
  if (meta.type === 'icon') return 'IconStar';
  // A number where the default is one (a union of text and number reads text first otherwise), and a size word for
  // sizes given by name.
  if (typeof d === 'number' && types.includes('number')) return d + (d >= 10 ? 7 : 3);
  if (/size/i.test(key) && typeof d === 'string' && ['sm', 'default', 'lg'].includes(d))
    return d === 'lg' ? 'sm' : 'lg';
  if (meta.type === 'numberInput' || types[0] === 'number') {
    const n = Number(d);
    return Number.isFinite(n) ? n + (n >= 10 ? 7 : 3) : 7;
  }
  if (types.includes('array') && !types.includes('string')) return SAMPLE_ROWS;
  if (types[0] === 'object') return { a: 'Alpha', b: 'Beta' };
  if (types.includes('string') || meta.type === 'code')
    return typeof d === 'string' && d === 'Sample 42' ? 'Other 7' : 'Sample 42';
  return undefined;
};

// Inspector controls whose stored value is plain (not code): both forms are tested for these.
const PLAIN_CONTROLS = new Set([
  'toggle',
  'switch',
  'select',
  'colorSwatches',
  'numberInput',
  'alignButtons',
  'icon',
  'boxShadow',
]);

/** The forms a value takes in a definition: how the inspector stores it, and as an fx binding. */
export const formsOf = (meta, value) => {
  const fx = `{{${JSON.stringify(value)}}}`;
  const forms = {};
  if (meta.type === 'toggle' || typeof value === 'boolean') forms.plain = `{{${value}}}`;
  else if (PLAIN_CONTROLS.has(meta.type)) forms.plain = typeof value === 'string' ? value : value;
  else if (typeof value === 'string') forms.plain = value;
  forms.fx = fx;
  return forms;
};

// ---- Mounting ------------------------------------------------------------------------------------------------------

const definitionOf = (name) => {
  const def = CONFIGS[name].definition || {};
  return { properties: { ...(def.properties || {}) }, styles: { ...(def.styles || {}) } };
};

// The DOM in a canonical form: attributes sorted (React appends one it adds later), and the volatile parts dropped:
// generated ids and the attributes that point at them, recharts clip-path ids.
const VOLATILE = /^(id|for|aria-controls|aria-labelledby|aria-describedby|aria-activedescendant|data-radix-.*)$/;
// Floating-point noise in SVG geometry (99.30000000000001 against 99.3) is rounded away.
const roundNumbers = (text) => text.replace(/-?\d+\.\d{3,}/g, (n) => String(Math.round(Number(n) * 100) / 100));
const canonical = (node) => {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';
  // Recharts' text-measuring span on the body keeps whatever it last measured.
  if (node.id === 'recharts_measurement_span') return '';
  // A chart is compared by what it draws: Recharts nests its layers differently on an update than on a first mount.
  if (node.tagName.toLowerCase() === 'svg' && /recharts/.test(node.getAttribute('class') || '')) return drawn(node);
  // The style React asked for, from the element's props: jsdom drops values it cannot parse (color-mix(), var() in
  // colours) and keeps the previous one, which a browser would replace.
  const propsKey = Object.keys(node).find((k) => k.startsWith('__reactProps$'));
  // An element React renders takes its style from its props alone (none: no style), even where jsdom kept an old one.
  const intended = propsKey
    ? node[propsKey]?.style && typeof node[propsKey].style === 'object'
      ? node[propsKey].style
      : {}
    : null;
  const attrs = [...node.attributes]
    .filter((a) => !(intended && a.name === 'style'))
    .filter((a) => !VOLATILE.test(a.name) && !(['style', 'class'].includes(a.name) && !a.value.trim()))
    // One-off entrance animations (a lazy icon fading in on first load) are not state.
    .map((a) => ({
      name: a.name,
      // Declarations sorted: React keeps the order they were first set in, which differs after an edit.
      value:
        a.name === 'style'
          ? a.value
              .split(';')
              .map((d) => d.trim())
              .filter((d) => d && !/^animation:/.test(d))
              .sort()
              .join('; ')
          : a.value,
    }))
    .filter((a) => !(a.name === 'style' && !a.value))
    .map(
      (a) =>
        `${a.name}="${roundNumbers(a.value).replace(
          /radix-:[^:"]*:|:r[0-9a-z]+:|url\(#[^)]*\)|recharts\d+-clip/g,
          ''
        )}"`
    )
    .concat(
      intended && Object.keys(intended).length
        ? [
            `style="${Object.entries(intended)
              .filter(([k, v]) => v !== undefined && v !== null && v !== '' && v !== false && !/^animation/.test(k))
              .map(([k, v]) => `${k}: ${roundNumbers(String(v))}`)
              .sort()
              .join('; ')}"`,
          ]
        : []
    )
    .sort()
    .join(' ');
  return `<${node.tagName.toLowerCase()} ${attrs}>${[...node.childNodes].map(canonical).join('')}</>`;
};

const SHAPES = 'path, rect, circle, line, polygon, polyline, ellipse, text, tspan';
let withGeometry = false;
const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'points', 'x1', 'x2', 'y1', 'y2'];
const drawn = (svg) =>
  `<svg ${[...svg.querySelectorAll(SHAPES)]
    // Clip paths and other definitions are never drawn themselves.
    .filter((el) => !el.closest('defs, clipPath'))
    .map((el) => {
      // Colours, dashes and text, not geometry: Recharts caches text sizes across charts, so the same chart's axis
      // width (and every coordinate after it) depends on what was measured before it.
      const keep = [
        'fill',
        'stroke',
        'opacity',
        'fill-opacity',
        'stroke-dasharray',
        'stroke-width',
        'r',
        ...(withGeometry ? GEOMETRY : []),
      ]
        // A line's draw-in animation starts at dasharray "0px 0px", which draws the same as none.
        .map((k) =>
          el.hasAttribute(k) && !(k === 'stroke-dasharray' && /^0px 0px$/.test(el.getAttribute(k)))
            ? `${k}=${roundNumbers(el.getAttribute(k))}`
            : ''
        )
        .filter(Boolean)
        .join(' ');
      const text = el.tagName.toLowerCase() === 'tspan' || el.tagName.toLowerCase() === 'text' ? el.textContent : '';
      return `${el.tagName.toLowerCase()}(${keep})${text}`;
    })
    .sort()
    .join('|')}>`;

export const snapshot = (id) => {
  const box = document.querySelector(`[data-cy="draggable-widget-${id}"]`)?.parentElement || document.body;
  const exposed = store().getExposedValueOfComponent(id, 'canvas') || {};
  const values = Object.fromEntries(Object.entries(exposed).filter(([, v]) => typeof v !== 'function'));
  let exposedText;
  try {
    exposedText = JSON.stringify(values);
  } catch {
    exposedText = String(Object.keys(values));
  }
  // Portals (popovers, the dialog) render at the body, after the app root.
  const portals = [...document.body.children]
    .filter((n) => !n.contains(box) && n.id !== 'recharts_measurement_span' && n.innerHTML.trim())
    .map((n) => [...n.childNodes].map(canonical).join(''))
    .join('');
  const dom = canonical(box) + portals;
  // With chart geometry too: two fresh mounts lay a chart out the same way, so a curve, stack or angle shows here.
  withGeometry = true;
  const geometry = canonical(box) + portals;
  withGeometry = false;
  return { dom, geometry, exposed: exposedText };
};

export const crashed = () =>
  [...document.querySelectorAll('*')].some(
    (e) => e.children.length === 0 && /Something went wrong/i.test(e.textContent || '')
  );

const errors = [];
let consoleSpy;
export const installGuards = () => {
  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const text = args.map((a) => (a && a.message ? a.message : String(a))).join(' ');
      if (
        /Maximum update depth|Too many re-renders|Cannot update a component|The above error occurred|Uncaught/i.test(
          text
        )
      )
        errors.push(text.slice(0, 240));
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => consoleSpy?.mockRestore());
};
export const takeErrors = () => errors.splice(0);

const settle = async (ms = 120) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

/** Mounts one widget through the real store with its definition, overridden by `properties`/`styles` ({key: value
 *  as stored}); returns a handle to read it, change a property live, and unmount. */
export const mountWidget = async (name, { properties = {}, styles = {}, mode = 'view', offsetHeight } = {}) => {
  const id = 'w1';
  const harness = createWidgetHarness({
    componentType: name,
    handle: id,
    id,
    offsetHeight,
    capabilities: { dnd: true },
    widgetHeight: CONFIGS[name].defaultSize?.height || 200,
    widgetWidth: 600,
  });
  harness.setup();
  const def = definitionOf(name);
  const wrap = (entries) => Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { value: v }]));
  let view;
  await act(async () => {
    view = harness.render({
      properties: { ...def.properties, ...wrap(properties) },
      styles: { ...def.styles, ...wrap(styles) },
      currentMode: mode,
    });
  });
  await settle();
  return {
    id,
    snapshot: () => snapshot(id),
    crashed,
    async change(key, value, paramType = 'properties') {
      await act(async () => {
        harness.setComponentProperty(id, key, value, paramType, 'value');
      });
      await settle();
    },
    async unmount() {
      await act(async () => view?.unmount?.());
      harness.teardown();
    },
  };
};

/** Where two snapshots first differ, shortly: the element on each side. */
export const diffHint = (a, b) => {
  const x = a.split('<');
  const y = b.split('<');
  const i = x.findIndex((part, k) => part !== y[k]);
  if (i < 0) return x.length === y.length ? '' : `length ${x.length} vs ${y.length}`;
  if ((x[i] || '').startsWith('svg ') && (y[i] || '').startsWith('svg ')) {
    const a = x[i].slice(4).split('|');
    const b = y[i].slice(4).split('|');
    const count = (list) => list.reduce((m, e) => m.set(e, (m.get(e) || 0) + 1), new Map());
    const ca = count(a);
    const cb = count(b);
    const onlyA = [...ca]
      .filter(([e, n]) => n > (cb.get(e) || 0))
      .map(([e, n]) => `${n - (cb.get(e) || 0)}x ${e}`)
      .slice(0, 3);
    const onlyB = [...cb]
      .filter(([e, n]) => n > (ca.get(e) || 0))
      .map(([e, n]) => `${n - (ca.get(e) || 0)}x ${e}`)
      .slice(0, 3);
    return `chart ${a.length} vs ${b.length} shapes; only first: ${onlyA
      .join(' ; ')
      .slice(0, 200)}; only second: ${onlyB.join(' ; ').slice(0, 200)}`;
  }
  return `[${(x[i] || '').slice(0, 140)}] vs [${(y[i] || '').slice(0, 140)}]`;
};

// ---- Contexts ------------------------------------------------------------------------------------------------------

// Many properties act only in some state: while loading, on empty data, with a value set, inside an opened popup, or
// on a field the data has. A property that changes nothing at rest is tried again in each of these before it counts
// as dead.
const VALUE_CONTEXT = {
  ShadDatePicker: { defaultValue: '2026-01-05' },
  ShadDateTimePicker: { defaultValue: '2026-01-05 10:30' },
  ShadTimePicker: { defaultValue: '10:30' },
  ShadNumberInput: { defaultValue: '{{1234.567}}' },
  ShadCurrencyInput: { defaultValue: '{{1234.5}}' },
  ShadCombobox: { defaultValue: 'a', options: `{{${JSON.stringify(SAMPLE_ROWS)}}}` },
  ShadMultiselect: { defaultValue: '{{["a","b","c"]}}', options: `{{${JSON.stringify(SAMPLE_ROWS)}}}` },
  ShadRating: { defaultValue: '{{3}}' },
  ShadSlider: { defaultValue: '{{37}}' },
  ShadColorPicker: { defaultValue: '#336699' },
  ShadPhoneInput: { defaultValue: '+14155550123' },
  ShadOtpInput: { defaultValue: '123456' },
  ShadTagsInput: { defaultValue: '{{["alpha","beta"]}}' },
  ShadAvatar: {
    names: '{{["Ada Lovelace","Grace Hopper","Alan Turing","Edsger Dijkstra","Barbara Liskov","Donald Knuth"]}}',
  },
};
const arrayKeys = (name) =>
  Object.entries(CONFIGS[name].properties || {})
    .filter(([, m]) => schemaTypes(m.validation?.schema).includes('array'))
    .map(([k]) => k);
const contexts = (name) => ({
  loading: { properties: { loadingState: '{{true}}' } },
  value: VALUE_CONTEXT[name] ? { properties: VALUE_CONTEXT[name] } : null,
  empty: arrayKeys(name).length ? { properties: Object.fromEntries(arrayKeys(name).map((k) => [k, '{{[]}}'])) } : null,
  open: { open: true },
  valueOpen: VALUE_CONTEXT[name] ? { properties: VALUE_CONTEXT[name], open: true } : null,
});

/** Field-name properties take another key of the widget's own data (a field that is not there changes nothing). */
const fieldAlternative = (name, key, meta, defaultValue) => {
  if (!/Fields?$/.test(key)) return undefined;
  const props = CONFIGS[name].definition?.properties || {};
  const source = ['data', 'items', 'cards', 'rows'].map((k) => resolveDefault(props[k]?.value)).find(Array.isArray);
  const row = (source || []).find((r) => r && typeof r === 'object');
  if (!row) return undefined;
  const current = resolveDefault(defaultValue);
  const keys = Object.keys(row).filter((k) => k !== current && !(Array.isArray(current) && current.includes(k)));
  if (!keys.length) return undefined;
  const numeric = keys.filter((k) => typeof row[k] === 'number');
  const pick = (/value|y|size/i.test(key) && numeric[0]) || keys.find((k) => typeof row[k] === 'string') || keys[0];
  return /Fields$/.test(key) && schemaTypes(meta.validation?.schema).includes('array') ? [pick] : pick;
};

/** Opens what the widget opens on a press (a popover, a menu, a select list). */
const openWidget = async (id) => {
  const box = document.querySelector(`[data-cy="draggable-widget-${id}"]`)?.parentElement;
  const trigger = box?.querySelector('[aria-haspopup], [role=combobox], button');
  if (!trigger) return;
  const { fireEvent } = require('@testing-library/react');
  await act(async () => {
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false });
    fireEvent.click(trigger);
  });
  await settle();
};

const snapshotIn = async (name, ctx, override) => {
  const m = await mountWidget(name, {
    properties: { ...(ctx?.properties || {}), ...(override.properties || {}) },
    styles: override.styles || {},
  });
  if (ctx?.open) await openWidget(m.id);
  const snap = m.snapshot();
  await m.unmount();
  return snap;
};

/** The context in which `stored` (for `key`) changes what the widget shows, or null when none does. */
const effectContext = async (name, section, key, stored) => {
  for (const [label, ctx] of Object.entries(contexts(name))) {
    if (!ctx) continue;
    const base = await snapshotIn(name, ctx, {});
    const variant = await snapshotIn(name, ctx, { [section]: { [key]: stored } });
    if (base.geometry !== variant.geometry || base.exposed !== variant.exposed) return label;
  }
  return null;
};

// ---- Checks --------------------------------------------------------------------------------------------------------

/** Every check for every property and style of one widget. Returns { problems, deadProperties } as strings. */
export const checkWidget = async (name) => {
  const config = CONFIGS[name];
  const problems = [];
  const dead = [];
  const base = await mountWidget(name);
  const baseline = base.snapshot();
  if (base.crashed()) problems.push(`${name} defaults: crash`);
  await base.unmount();
  for (const err of takeErrors()) problems.push(`${name} defaults: ${err}`);

  for (const [section, metas] of [
    ['properties', config.properties || {}],
    ['styles', config.styles || {}],
  ]) {
    for (const [key, meta] of Object.entries(metas)) {
      const defaultValue = config.definition?.[section]?.[key]?.value;
      const alt = fieldAlternative(name, key, meta, defaultValue) ?? alternativeOf(meta, defaultValue, key);
      if (alt === undefined) continue;
      const forms = formsOf(meta, alt);
      const seen = {};
      for (const [form, stored] of Object.entries(forms)) {
        const m = await mountWidget(name, { [section]: { [key]: stored } });
        seen[form] = m.snapshot();
        if (m.crashed()) problems.push(`${name} ${section}.${key} ${form}: crash`);
        await m.unmount();
      }
      for (const err of takeErrors()) problems.push(`${name} ${section}.${key}: ${err}`);
      if (seen.plain && seen.plain.dom !== seen.fx.dom)
        problems.push(
          `${name} ${section}.${key}: parity (plain and fx render differently) ${diffHint(seen.fx.dom, seen.plain.dom)}`
        );
      const variant = seen.fx;
      if (variant.geometry === baseline.geometry && variant.exposed === baseline.exposed) {
        const where = await effectContext(name, section, key, forms.fx);
        if (!where) dead.push(`${section}.${key}`);
      }
      // Live: change the mounted widget to the alternative, then back.
      const live = await mountWidget(name);
      await live.change(key, forms.fx, section);
      const afterChange = live.snapshot();
      // Back to the default, or cleared ('') when the definition has none, as the inspector clears a field.
      await live.change(key, defaultValue === undefined ? '' : defaultValue, section);
      const afterRestore = live.snapshot();
      if (live.crashed()) problems.push(`${name} ${section}.${key} live: crash`);
      await live.unmount();
      for (const err of takeErrors()) problems.push(`${name} ${section}.${key} live: ${err}`);
      if (afterChange.dom !== variant.dom)
        problems.push(
          `${name} ${section}.${key} live: an edit on a mounted widget differs from a fresh mount ${diffHint(
            variant.dom,
            afterChange.dom
          )}`
        );
      if (afterRestore.dom !== baseline.dom)
        problems.push(
          `${name} ${section}.${key} live: changing it back does not restore the original ${diffHint(
            baseline.dom,
            afterRestore.dom
          )}`
        );
    }
  }
  return { problems, dead };
};

/** One shard's suite: the widgets whose index falls in this shard. With PROPS_OUT set, each widget's report is
 *  written there as JSON (PROPS_ONLY=ShadA,ShadB narrows the run). */
export const propsShard = (shard, shards) => {
  installGuards();
  const only = process.env.PROPS_ONLY ? process.env.PROPS_ONLY.split(',') : null;
  const names = NAMES.filter((n, i) => i % shards === shard && (!only || only.includes(n)));
  describe.each(names)('%s', (name) => {
    it('every property and style works, plain and as fx, fresh and edited live', async () => {
      const result = await checkWidget(name);
      if (process.env.PROPS_OUT) {
        require('fs').writeFileSync(`${process.env.PROPS_OUT}/${name}.json`, JSON.stringify(result, null, 1));
      }
      expect(result.problems).toEqual([]);
      // A property that changes nothing here must be proved working elsewhere (coverage.jsx).
      const { covered } = require('./coverage');
      const proved = covered(name);
      expect(result.dead.filter((k) => !proved.includes(k.split('.')[1]))).toEqual([]);
    }, 900000);
  });
};
