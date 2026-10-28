import React from 'react';
import { render, act, cleanup, fireEvent as domEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './packTestEnv';

installBrowserStubs();

// Every action of every component of every first-party pack, called the way an event handler's control-component step
// calls it (eventsSlice: the handler the component registered, positional arguments, its promise awaited), with no
// arguments, empty and wrong-typed ones, huge ones, unknown options and out-of-range indexes, 50 times in one frame,
// while the host is disabled or loading, and after the component unmounted. packFuzz.spec.jsx throws hostile values
// at the properties; this checks what the actions and events leave behind:
//   - an action never throws, rejects, crashes the component or loops;
//   - every exposed value keeps its declared type (a manifest prop of the same name) and never turns undefined;
//   - a change event (onChange, onSelect, onPageChange...) fires once per change of the exposed values: never with
//     nothing changed, never twice for one change, and never before the value it reports is exposed;
//   - what is drawn agrees with what is exposed where it can be read (a lone checkbox or switch, a slider, the
//     current page);
//   - a user-level change from the UI (a click on a checkbox, radio, tab, option or pager button) fires its change
//     event (not zero) and only once.
//
//   Opt-in: PACK_ACTIONS=shadcn,antd,mui · PACK_ACTIONS_ONLY=Select,Pagination · PACK_ACTIONS_OUT=<file> writes the
//   report (one JSON line per pack, problems and notes per component).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK_SOURCES = {
  shadcn: () => require('../../../../../../../packs/shadcn/src/index.ts'),
  antd: () => require('../../../../../../../packs/antd/src/index.ts'),
  mui: () => require('../../../../../../../packs/mui/src/index.ts'),
};
const PACKS_DIR = path.resolve(__dirname, '../../../../../../../packs');
const packs = (process.env.PACK_ACTIONS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .filter((pack) => fs.existsSync(path.join(PACKS_DIR, pack, 'dist/manifest.json')));
const only = new Set(
  (process.env.PACK_ACTIONS_ONLY || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
);

const BURST = 50;
const HUGE_TEXT = 'x'.repeat(10000);
const HUGE_LIST = Array.from({ length: 5000 }, (_, i) => ({ id: i, label: `Item ${i}`, value: i }));
const UNKNOWN = '__no_such_option__';

// The argument sets every action is called with, each applied to every parameter (an action without parameters
// still gets them: an app can pass junk to any action).
const JUNK = [
  ['null', null],
  ['undefined', undefined],
  ['a number', 42],
  ['a string', 'abc'],
  ['an object', { a: 1 }],
  ['a boolean', true],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['-1', -1],
  ['99999', 99999],
  ['1.5', 1.5],
  ['an unknown option', UNKNOWN],
  ['a 10k-char string', HUGE_TEXT],
  ['a 5000-item list', HUGE_LIST],
];

// Events that report a change of the component's state; each must follow a change of its exposed values.
const CHANGE_EVENT =
  /^(on|after)(Change|ChangeActive|ChangeComplete|ChangeCommitted|Select|SelectionChanged?|Check|UnCheck|PageChanged?|PaginationModelChange|SortModelChange|RowSelectionModelChange|StepChanged?|TabSwitch|SlideChanged|Expand|Collapse|OpenChange|Open|Close|Clear|TagAdded|TagDeleted|FilterChanged|Sort|MonthChanged|InputChange|SearchTextChanged|PanelChange|CardMoved|CardAdded|CardRemoved|CardUpdated|FileSelected|FileDeselected)$/;
// Exposed keys that are the component's own state (what a change event reports), as opposed to last-click records.
const STATE_KEY =
  /^(value|values|checked|selected\w*|current\w*|page\w*|open\w*|isOpen|isExpanded|isCollapsed|active\w*|startDate|endDate|tags|fileList|file|rowSelectionModel|sortModel|paginationModel|sortApplied|filters|searchText|searchValue|inputValue)$/;

// Events a vendor library fires from a render or a transition rather than from the action, so calls in one frame and
// calls a frame apart differ in count or timing: MUI's Autocomplete reports the text it resets to a new value
// (onInputChange, reason "reset"); Ant's Modal and MUI's Dialog fire after their open transition ends, which jsdom
// times differently. Not compared between a burst and spaced calls.
const RENDER_EVENTS = {
  'mui.Autocomplete': ['onInputChange'],
  'mui.AutocompleteMultiple': ['onInputChange'],
  'antd.Modal': ['afterOpen', 'afterClose'],
  'mui.Dialog': ['onEntered'],
};

const ELEMENT_BUDGET = 400000;
const realCreateElement = React.createElement;
let elements = 0;
let budgetHit = false;
React.createElement = (...args) => {
  elements += 1;
  if (elements > ELEMENT_BUDGET) {
    budgetHit = true;
    throw new Error('render loop: element budget exceeded');
  }
  return realCreateElement(...args);
};
const LOOP = /Too many re-renders|Maximum update depth|render loop/;

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

const same = (a, b) => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const kind = (v) =>
  v === undefined ? 'undefined' : v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isNaN(v) ? 'NaN' : typeof v;
// What a declared prop type admits as an exposed value: a number and an object may be empty (null), as the SDK's
// useStateNumber clears to null; text, lists and booleans never are. Text may hold a finite number: a choice keeps its
// option's value (Select's value 1 for { value: 1 }) and a figure stays a number (Stat), by design.
const fits = (declared, v) => {
  const k = kind(v);
  switch (declared) {
    case 'string':
      return k === 'string' || (k === 'number' && Number.isFinite(v));
    case 'number':
      return k === 'number' || k === 'null';
    case 'boolean':
      return k === 'boolean';
    case 'array':
      return k === 'array';
    case 'object':
      return k === 'object' || k === 'null';
    case 'enumeration':
      return k === 'string' || k === 'number' || k === 'boolean';
    default:
      return true;
  }
};
// Exposed values without the functions, for comparing two runs; ids and times made at call time differ between runs.
const plain = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v !== 'function'));
// A map's center and bounds move by a few millionths of a degree as Leaflet settles a zoom in jsdom.
const VOLATILE = /(time|date|At$|^id$|Id$|history|lastMessage|lastResponse|^center$|^bounds$)/i;
const show = (v) => {
  try {
    const text = typeof v === 'string' ? JSON.stringify(v) : (JSON.stringify(v) ?? String(v));
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  } catch {
    return String(v);
  }
};

// The first value of a component's own option-like prop (options, items, tabs, steps...), for a valid argument.
const LIST_PROPS =
  /^(options|items|tabs|steps|data|columns|cards|panels|slides|markers|tags|suggestions|nodes|treeData|menuItems|links|segments|fields)$/;
const firstOf = (defaults, keys = ['value', 'id', 'key', 'name']) => {
  for (const [name, v] of Object.entries(defaults)) {
    if (!LIST_PROPS.test(name) || !Array.isArray(v) || !v.length) continue;
    const item = v.find((x) => x != null) ?? v[0];
    if (item && typeof item === 'object') {
      for (const key of keys) if (item[key] !== undefined && item[key] !== null) return item[key];
      continue;
    }
    return item;
  }
  return undefined;
};
const validArg = (param, defaults) => {
  if (param.defaultValue !== undefined && param.defaultValue !== '') return param.defaultValue;
  if (param.type === 'toggle') return true;
  if (param.type === 'color') return '#3366ff';
  const h = String(param.handle);
  if (/^(index|indexOrUpdates|page|step|current|num1|num2|percent|zoom)$/i.test(h)) return /percent/i.test(h) ? 40 : 1;
  if (/^(lat)$/i.test(h)) return 12.9;
  if (/^(lng)$/i.test(h)) return 77.6;
  if (/date/i.test(h)) return /end/i.test(h) ? '2026-01-20' : '2026-01-15';
  if (/^(value|values|selected|tags)$/i.test(h) && /s$/.test(h)) {
    const first = firstOf(defaults);
    return first === undefined ? ['a'] : [first];
  }
  if (
    /^(value|option|selected|key|keys|id|tabId|item|cardId|columnId|columnKey|country|countryCode|currency)$/i.test(h)
  ) {
    const first = firstOf(defaults, /column/i.test(h) ? ['id', 'key', 'value'] : undefined);
    if (first !== undefined) return /keys/i.test(h) ? [first] : first;
    if (/country/i.test(h)) return 'US';
    if (/currency/i.test(h)) return 'EUR';
    if (h === 'value' && typeof defaults.value === 'number') return 3;
    if (h === 'value' && typeof defaults.value === 'boolean') return true;
    return h === 'value' ? 'hello' : 'a';
  }
  if (/^(checked|disabled|visibility|loading)$/i.test(h)) return true;
  if (/^(direction)$/i.test(h)) return 'asc';
  if (/^(format)$/i.test(h)) return undefined;
  if (/^(type)$/i.test(h)) return 'csv';
  if (/^(url|href|avatar)$/i.test(h)) return 'https://example.com/a.png';
  if (/^(history)$/i.test(h)) return [{ role: 'user', content: 'hi' }];
  if (/^(card)$/i.test(h)) return { id: 'pack-actions-card', title: 'New card' };
  if (/^(parameters)$/i.test(h)) return [];
  if (/^(trend)$/i.test(h)) return 'up';
  return 'hello';
};

// What is drawn, read back where a component has one obvious control for one exposed value.
const drawnMismatch = (exposed, roots) => {
  const out = [];
  const all = (sel) => roots.flatMap((r) => [...r.querySelectorAll(sel)]);
  const toggles = all('[role="checkbox"],[role="switch"],input[type="checkbox"]');
  const boolKey = ['checked', 'value'].find((k) => typeof exposed[k] === 'boolean');
  if (boolKey && toggles.length === 1) {
    const el = toggles[0];
    const drawn = el.tagName === 'INPUT' ? el.checked : el.getAttribute('aria-checked') === 'true';
    if (drawn !== exposed[boolKey]) out.push(`${boolKey} is ${exposed[boolKey]} but the control is drawn ${drawn}`);
  }
  const sliders = all('[role="slider"]');
  if (sliders.length === 1 && typeof exposed.value === 'number') {
    const now = Number(sliders[0].getAttribute('aria-valuenow'));
    if (sliders[0].hasAttribute('aria-valuenow') && Math.abs(now - exposed.value) > 1e-9)
      out.push(`value is ${exposed.value} but the slider is drawn at ${now}`);
  }
  const pageKey = ['currentPage', 'current', 'page'].find((k) => typeof exposed[k] === 'number');
  const currents = all('[aria-current="page"]').filter((el) => /^\d+$/.test(el.textContent.trim()));
  if (pageKey && currents.length === 1 && Number(currents[0].textContent.trim()) !== exposed[pageKey])
    out.push(`${pageKey} is ${exposed[pageKey]} but page ${currents[0].textContent.trim()} is drawn current`);
  return out;
};

if (!packs.length) test.skip('pack actions (set PACK_ACTIONS=shadcn,antd,mui to run it)', () => {});

(packs.length ? describe.each(packs) : () => () => {})('the %s pack actions and exposed values', (pack) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, pack, 'dist/manifest.json'), 'utf8'));
  const source = PACK_SOURCES[pack]();
  const names = Object.keys(manifest.components).filter((name) => !only.size || only.has(name));
  const failures = [];
  const totals = { components: 0, actions: 0, calls: 0, uiClicks: 0 };

  afterAll(() => {
    if (process.env.PACK_ACTIONS_OUT)
      fs.appendFileSync(process.env.PACK_ACTIONS_OUT, JSON.stringify({ pack, totals, failures }) + '\n');
  });

  test.each(names)(
    '%s',
    async (name) => {
      const Component = source[name];
      expect(Component).toBeDefined();
      loadLibraryModule.mockResolvedValue({ [name]: Component });
      const entry = manifest.components[name];
      const defaults = Object.fromEntries(
        (entry.props ?? []).filter((p) => p.default !== undefined).map((p) => [p.name, p.default])
      );
      const declared = Object.fromEntries((entry.props ?? []).map((p) => [p.name, p.type]));
      const changeEvents = new Set((entry.events ?? []).map((e) => e.name).filter((n) => CHANGE_EVENT.test(n)));
      const problems = new Set();
      const notes = new Set();
      const errors = [];
      const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const text = args.map(String).join(' ');
        if (LOOP.test(text)) errors.push(text.slice(0, 200));
      });
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // The store a real host keeps: exposed values, a counter of real changes, and the events with the counter at
      // the moment each fired.
      let exposed = {};
      let changes = 0;
      let changeLog = [];
      let fired = [];
      const setExposedVariable = (key, value) => {
        if (typeof value === 'function') return;
        if (!(key in exposed) || !same(exposed[key], value)) {
          changes += 1;
          changeLog.push(key);
        }
        exposed[key] = value;
      };
      const fireEvent = (eventName) => fired.push({ name: eventName, at: changes, keys: changeLog.slice() });

      let actions = new Map();
      const base = makeHost(name, entry);
      const view = (props, hostState = {}) => (
        <Boundary onError={(error) => errors.push(String(error?.message ?? error).slice(0, 200))}>
          <FormSignalContext.Provider value={{ clearCount: 0, submitAttemptCount: 0 }}>
            <InlineLibraryComponent
              bundleUrl={`${pack}-${name}.js`}
              cssUrl={`${pack}-${name}.css`}
              cacheKey={`actions-${pack}-${name}`}
              componentName={name}
              componentProps={props}
              componentStyles={{}}
              renderSlot={() => null}
              setExposedVariable={setExposedVariable}
              fireEvent={fireEvent}
              actions={actions}
              host={{ ...base, ...hostState }}
              dataCy="actions"
            />
          </FormSignalContext.Provider>
        </Boundary>
      );
      const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
      const roots = () =>
        [
          document.querySelector('[data-cy="actions"]')?.shadowRoot,
          ...[...document.querySelectorAll('.tj-cc-popup-host')].map((h) => h.shadowRoot),
        ].filter(Boolean);

      // The control-component step: the registered handler, positional arguments, its promise awaited.
      const invoke = (actionName, args) => {
        const handler = actions.get(actionName);
        if (!handler) return Promise.resolve('unregistered');
        return Promise.resolve().then(() => handler(...args));
      };

      let mountTypes = {};
      let rendered;
      const mount = async () => {
        cleanup();
        actions = new Map();
        exposed = {};
        changes = 0;
        changeLog = [];
        fired = [];
        await act(async () => {
          rendered = render(view(defaults));
          await settle();
        });
        mountTypes = Object.fromEntries(Object.entries(exposed).map(([k, v]) => [k, kind(v)]));
      };

      // Runs one step and checks everything the step can break.
      const SLOW_STEP_MS = 20000;
      const step = async (label, fn, { expectChange, single = false, quiet = false } = {}) => {
        elements = 0;
        budgetHit = false;
        errors.length = 0;
        const before = { ...exposed };
        const startChanges = changes;
        const firedFrom = fired.length;
        changeLog = [];
        const started = Date.now();
        try {
          await act(async () => {
            await fn();
            await settle();
            await settle();
          });
        } catch (error) {
          errors.push(`threw ${String(error?.message ?? error).slice(0, 160)}`);
        }
        if (budgetHit) errors.push('render loop: element budget exceeded');
        const took = Date.now() - started;
        if (took > SLOW_STEP_MS) errors.push(`took ${took} ms`);
        if (errors.length) problems.add(`${label}: ${[...new Set(errors)].join(' | ')}`);

        // Exposed values: declared type kept, nothing turned undefined.
        for (const [key, value] of Object.entries(exposed)) {
          if (key in before && before[key] !== undefined && value === undefined)
            problems.add(`${label}: exposed ${key} turned undefined`);
          else if (declared[key] && !fits(declared[key], value) && fits(declared[key], before[key]))
            problems.add(`${label}: exposed ${key} (${declared[key]}) became ${kind(value)} ${show(value)}`);
          else if (!declared[key] && mountTypes[key] && !['undefined', 'null'].includes(mountTypes[key])) {
            const k = kind(value);
            if (k !== mountTypes[key] && k !== 'null')
              problems.add(`${label}: exposed ${key} was ${mountTypes[key]} at mount, became ${k} ${show(value)}`);
          }
        }
        // Events: an action call or a click fires each event at most once, and a change event never before the value it
        // reports is exposed (a handler reading it would see the old one). An action that changes nothing (a setValue to
        // the current value, a clear of an empty field, a step past the last) fires no change event, in every pack
        // (product decision 2026-10-25); a click that changes nothing is the user's own and only noted.
        const stepFired = fired.slice(firedFrom);
        if (!quiet) {
          const counts = {};
          for (const event of stepFired) counts[event.name] = (counts[event.name] ?? 0) + 1;
          if (single)
            for (const [eventName, n] of Object.entries(counts))
              if (n > 1) problems.add(`${label}: ${eventName} fired ${n} times for one call`);
          for (const event of stepFired) {
            if (!changeEvents.has(event.name)) continue;
            const settledLater = changeLog.length > event.keys.length;
            if (event.at === startChanges && settledLater)
              problems.add(`${label}: ${event.name} fired before the exposed value it reports changed`);
            else if (event.at === startChanges && single && !settledLater) {
              // A transition's event (Ant Modal's afterOpen) lands in whichever step its animation ends in.
              const fromTransition = (RENDER_EVENTS[`${pack}.${name}`] ?? []).includes(event.name);
              if (label.startsWith('click ') || fromTransition)
                notes.add(`${label.replace(/\(.*\)/, '(...)')}: ${event.name} fires with nothing changed`);
              else problems.add(`${label}: ${event.name} fired with nothing changed`);
            }
          }
        }
        // A user-level change (a UI click) of the component's own state fires its change event.
        if (expectChange && changeEvents.size) {
          const stateChanged = Object.keys(exposed).some((k) => STATE_KEY.test(k) && !same(before[k], exposed[k]));
          const anyChangeEvent = stepFired.some((e) => changeEvents.has(e.name));
          if (stateChanged && !anyChangeEvent)
            problems.add(
              `${label}: the exposed state changed but no change event fired (${[...changeEvents].join(', ')})`
            );
        }
        for (const m of drawnMismatch(exposed, roots())) problems.add(`${label}: ${m}`);
        const counts = {};
        for (const event of stepFired) counts[event.name] = (counts[event.name] ?? 0) + 1;
        return { changed: changes > startChanges, counts, state: plain(exposed) };
      };

      const call = (actionName, args) => async () => {
        totals.calls += 1;
        await invoke(actionName, args);
      };

      totals.components += 1;
      await mount();
      // At mount a value is what the component starts with (a number left unset is undefined, a Schedule's selection
      // null, as UI 2.0's): noted, not failed. What an action or an event turns it into is checked by every step.
      for (const [key, value] of Object.entries(exposed))
        if (declared[key] && !fits(declared[key], value))
          notes.add(`mount: exposed ${key} (${declared[key]}) is ${kind(value)} ${show(value)}`);

      for (const action of entry.actions ?? []) {
        totals.actions += 1;
        const params = action.params ?? [];
        const valid = params.map((p) => validArg(p, defaults));
        const arity = Math.max(1, params.length);
        await mount();
        if (!actions.has(action.name)) {
          problems.add(`${action.name}: the manifest lists it but the component does not register it`);
          continue;
        }
        const a = action.name;
        await step(`${a}()`, call(a, []), { single: true });
        for (const [label, junk] of JUNK) {
          await step(`${a}(${label})`, call(a, Array(arity).fill(junk)), { single: true });
          // The first parameter junk, the rest valid: a two-argument action with one bad half.
          if (params.length > 1)
            await step(`${a}(${label}, valid...)`, call(a, [junk, ...valid.slice(1)]), { single: true });
        }
        const first = await step(`${a}(valid ${show(valid)})`, call(a, valid), { single: true });
        // The same call again: only an action that moves on (next, toggle) may change anything the second time.
        await step(`${a}(valid) again`, call(a, valid), { single: true });
        // 50 calls in one frame leave what the same 50 calls leave one frame apart: the same exposed values and the
        // same events, each as many times. A handler that reads its state from the last render (toggle: set(!checked))
        // flips once and fires 50 times.
        for (const [label, argsAt] of [
          ['', () => valid],
          [' alternating valid and junk', (i) => (i % 2 ? valid : Array(arity).fill(JUNK[i % JUNK.length][1]))],
        ]) {
          const spaced = { counts: {} };
          await mount();
          for (let i = 0; i < BURST; i++) {
            const r = await step(`${a} x${BURST}${label}, one frame apart (call ${i + 1})`, call(a, argsAt(i)), {
              quiet: true,
            });
            for (const [eventName, n] of Object.entries(r.counts))
              spaced.counts[eventName] = (spaced.counts[eventName] ?? 0) + n;
            spaced.state = r.state;
          }
          const drain = () => new Promise((resolve) => setTimeout(resolve, 150));
          const tail = await step(`${a} x${BURST}${label}, one frame apart (settling)`, drain, { quiet: true });
          for (const [eventName, n] of Object.entries(tail.counts))
            spaced.counts[eventName] = (spaced.counts[eventName] ?? 0) + n;
          spaced.state = tail.state;
          await mount();
          const burst = await step(
            `${a} x${BURST}${label} in one frame`,
            async () => {
              const runs = [];
              for (let i = 0; i < BURST; i++) runs.push(invoke(a, argsAt(i)));
              totals.calls += BURST;
              await Promise.all(runs);
              // As long for animation-driven events (Ant's afterOpen) as the spaced run had.
              await drain();
            },
            { quiet: true }
          );
          const diff = Object.keys({ ...spaced.state, ...burst.state }).filter(
            (k) => !VOLATILE.test(k) && !same(spaced.state[k], burst.state[k])
          );
          if (diff.length)
            problems.add(
              `${a} x${BURST}${label} in one frame: exposed ${diff
                .slice(0, 3)
                .map((k) => `${k} ${show(burst.state[k])} (one frame apart: ${show(spaced.state[k])})`)
                .join(', ')}`
            );
          const fromRender = RENDER_EVENTS[`${pack}.${name}`] ?? [];
          const eventDiff = Object.keys({ ...spaced.counts, ...burst.counts }).filter(
            (e) => !fromRender.includes(e) && (spaced.counts[e] ?? 0) !== (burst.counts[e] ?? 0)
          );
          if (eventDiff.length)
            problems.add(
              `${a} x${BURST}${label} in one frame: ${eventDiff
                .map((e) => `${e} fired ${burst.counts[e] ?? 0} times (one frame apart: ${spaced.counts[e] ?? 0})`)
                .join(', ')}`
            );
        }
        for (const [label, state] of [
          ['disabled', { disabled: true }],
          ['loading', { loading: true }],
        ]) {
          await step(`host ${label}`, () => rendered.rerender(view(defaults, state)));
          await step(`${a}(valid) while ${label}`, call(a, valid), { single: true });
          await step(`host ${label} off`, () => rendered.rerender(view(defaults)));
        }
        if (first.changed === false && params.length && !Object.keys(first.counts).length)
          notes.add(`${a}(${show(valid)}) changed nothing and fired nothing`);
        // After unmount: the host finds no handler; a handler an event captured before the unmount still runs safely.
        const captured = actions.get(a);
        await act(async () => {
          rendered.unmount();
          await settle();
        });
        if (actions.has(a)) problems.add(`${a}: still registered after unmount`);
        await step(
          `${a}(valid) after unmount, by a captured handler`,
          async () => {
            totals.calls += 1;
            await Promise.resolve().then(() => captured?.(...valid));
          },
          { quiet: true }
        );
      }

      // A user-level change from the UI: one click on each of the first few checkboxes, radios, tabs, options and pager
      // buttons drawn by default.
      await mount();
      const CLICKABLE =
        '[role="checkbox"],[role="switch"],[role="radio"],[role="tab"],[role="option"],[role="menuitemradio"],input[type="checkbox"],input[type="radio"],button[aria-label*="page" i],button[aria-label*="next" i],button[aria-label*="previous" i]';
      const targets = roots()
        .flatMap((r) => [...r.querySelectorAll(CLICKABLE)])
        .filter((el) => !el.disabled && el.getAttribute('aria-disabled') !== 'true')
        .slice(0, 4);
      for (const [i, el] of targets.entries()) {
        totals.uiClicks += 1;
        const label = `click ${el.getAttribute('role') || el.tagName.toLowerCase()} ${i + 1} (${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)})`;
        await step(
          label,
          () => {
            if (el.isConnected) domEvent.click(el);
          },
          { expectChange: true, single: true }
        );
      }

      consoleError.mockRestore();
      consoleWarn.mockRestore();
      cleanup();
      const list = [...problems];
      if (list.length || notes.size) failures.push({ component: name, problems: list, notes: [...notes] });
      expect(list).toEqual([]);
    },
    900000
  );
});
