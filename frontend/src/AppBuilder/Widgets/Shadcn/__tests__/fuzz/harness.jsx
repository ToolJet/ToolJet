// Fuzz harness for the shadcn/ui pack (experiment): mounts a pack widget the way RenderWidget does, from its generated
// config, feeds adversarial property and style values, and reports what a single misconfigured widget could do to an
// app: throw during render, throw in an event handler or a promise, loop on its exposed state, render without end,
// or take too long. Shared by the shard*.spec.jsx suites; not a suite itself.
import React, { Profiler, useReducer } from 'react';
import { act, fireEvent as fire, render } from '@testing-library/react';
import { shadcnConfigs } from '../../../../WidgetManager/widgets/shadcn';
import * as Core from '../../Shadcn';
import * as Charts from '../../ShadCharts';
import * as Kanban from '../../ShadKanban';
import * as Table from '../../ShadTable';
import * as Tabs from '../../ShadTabs';
import * as ListView from '../../ShadListView';
import * as Inputs from '../../ShadInputs';
import * as Pickers from '../../ShadPickers';
import * as Display from '../../ShadDisplay';
import * as Actions from '../../ShadActions';
import * as Overlays from '../../ShadOverlays';

// jsdom has no layout: charts get a fixed box, and sub-canvases (tabs, list rows, custom cards, the dialog body) a
// placeholder, since the canvas they hold is ToolJet's, not the pack's.
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
jest.mock('@/AppBuilder/AppCanvas/Container', () => ({
  Container: () => <div data-testid="fuzz-subcanvas" />,
}));

// Browser APIs jsdom lacks; the widgets run in browsers that have them.
if (typeof window !== 'undefined') {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.ResizeObserver = window.ResizeObserver || NoopObserver;
  window.IntersectionObserver = window.IntersectionObserver || NoopObserver;
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function scrollIntoView() {};
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function setPointerCapture() {};
  Element.prototype.releasePointerCapture =
    Element.prototype.releasePointerCapture || function releasePointerCapture() {};
}

const MODULES = [Core, Charts, Kanban, Table, Tabs, ListView, Inputs, Pickers, Display, Actions, Overlays];
// Widgets that keep their own control state; the rest get withControlState, as in editorHelpers.js.
const UNCONTROLLED = new Set(['ShadTable', 'ShadTabs', 'ShadListView', 'ShadDialog']);

export const CONFIGS = Object.fromEntries(shadcnConfigs.map((c) => [c.name, c]));
export const NAMES = Object.keys(CONFIGS);

const wrapped = {};
export const componentOf = (name) => {
  if (!wrapped[name]) {
    const mod = MODULES.find((m) => m[name]);
    if (!mod) throw new Error(`no component for ${name}`);
    wrapped[name] = UNCONTROLLED.has(name) ? mod[name] : Core.withControlState(mod[name]);
  }
  return wrapped[name];
};

// A definition value as the app resolves it: '{{...}}' evaluated, plain strings kept.
const resolve = (value) => {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!m) return value;
  try {
    return new Function(`return (${m[1]});`)(); // eslint-disable-line no-new-func
  } catch {
    return value;
  }
};
const valuesOf = (section) => Object.fromEntries(Object.entries(section || {}).map(([k, v]) => [k, resolve(v?.value)]));
export const defaultsOf = (name) => valuesOf(CONFIGS[name].definition.properties);
export const styleDefaultsOf = (name) => valuesOf(CONFIGS[name].definition.styles);
export const propertyKeys = (name) => Object.keys(CONFIGS[name].properties || {});
export const styleKeys = (name) => Object.keys(CONFIGS[name].styles || {});
export const eventNames = (name) => Object.keys(CONFIGS[name].events || {});
export const actionsOf = (name) => CONFIGS[name].actions || [];

// ---- Adversarial values ----------------------------------------------------------------------------------------

const circular = { a: 1 };
circular.self = circular;
export const ROWS_10K = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Row ${i}`,
  title: `Card ${i}`,
  label: `Item ${i}`,
  value: i,
  status: ['todo', 'doing', 'done'][i % 3],
  date: '2026-01-01',
  start: '2026-01-01',
  x: i,
  y: i * 2,
  month: `M${i}`,
  amount: i * 1.5,
  tags: ['a', 'b'],
  src: '',
}));
const NUMS_10K = Array.from({ length: 10000 }, (_, i) => i);

// [label, value] pairs: labels name the case in a failure report.
export const JUNK = [
  ['null', null],
  ['undefined', undefined],
  ['empty string', ''],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['-Infinity', -Infinity],
  ['-1', -1],
  ['0', 0],
  ['1e9', 1e9],
  ['-1e9', -1e9],
  ['0.5', 0.5],
  ['true', true],
  ['false', false],
  ['long string', 'lorem ipsum '.repeat(10000)],
  ['long word', 'x'.repeat(100000)],
  ['numeric string', '1e9'],
  ['object', { a: { b: { c: 1 } } }],
  ['empty object', {}],
  ['circular object', circular],
  ['empty array', []],
  ['nested arrays', [[[[1]]], [[]], [null]]],
  ['mixed array', [null, undefined, 3, 'a', {}, [1], NaN, true, { id: null }, { value: {} }]],
  ['10k rows', ROWS_10K],
  ['10k numbers', NUMS_10K],
  ['function', () => 'fn'],
  ['date object', new Date('2026-01-01')],
  ['invalid date object', new Date('nope')],
  ['malformed colour', '#zzz'],
  ['malformed rgb', 'rgb(300, -1)'],
  ['colour word', 'not-a-colour'],
  ['malformed date', '2026-13-45'],
  ['date word', 'yesterday'],
  ['unclosed binding', '{{x'],
  ['unresolved binding', '{{components.a.value}}'],
  ['html', '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'],
];
// Values a style can receive: the same, minus the slowest data-shaped ones (styles never hold rows).
export const STYLE_JUNK = JUNK.filter(([label]) => !['10k rows', '10k numbers'].includes(label));

// The default run (every jest run) tries each property and style one at a time with the values that found every bug
// so far, and every value all at once; FUZZ=full tries every value one at a time too (about 40 CPU minutes).
const FULL = process.env.FUZZ === 'full';
const pick = (labels) => JUNK.filter(([label]) => labels.includes(label));
const ONE_AT_A_TIME = FULL
  ? JUNK
  : pick([
      'null',
      'NaN',
      '1e9',
      'long word',
      'circular object',
      'mixed array',
      '10k rows',
      'function',
      'unclosed binding',
      'malformed date',
    ]);
const STYLE_ONE_AT_A_TIME = FULL ? STYLE_JUNK : pick(['NaN', 'object', 'malformed colour', 'false']);

// ---- Mounting --------------------------------------------------------------------------------------------------

// Above this many React elements in one render, the widget is drawing something unbounded (a list sized by a property,
// or every row of a 10k-row binding).
const ELEMENT_LIMIT = 200000;
// A store write re-renders the host at most this many times per case; a widget that keeps publishing past it loops.
const BUMP_LIMIT = 300;

// Above this many commits in one step (a mount, an interaction, an action), the widget re-renders itself without end (state set in every effect). React only
// warns about that, and act() would drain it forever, so the next element created throws and the boundary stops it.
const COMMIT_LIMIT = 2000;

// Once tripped, every element the widget creates throws (React retries a failed render once) until the boundary has
// taken over; the boundary's own fallback is created with the real createElement.
let elementCount = 0;
let runaway = null;
const realCreateElement = React.createElement;
// A mount, an interaction or an action that keeps rendering past this many ms is a freeze; checked as elements are
// created, so a slow render fails fast instead of holding the worker for minutes.
const RENDER_TIME_LIMIT = 8000;
let caseStarted = 0;
// Commits since the mount, interaction or action began (COMMIT_LIMIT applies per step).
let stepCommits = 0;
let createdTotal = 0;
React.createElement = function createElement(...args) {
  elementCount += 1;
  createdTotal += 1;
  if (elementCount === ELEMENT_LIMIT + 1) runaway = `runaway render: more than ${ELEMENT_LIMIT} elements`;
  if (caseStarted && createdTotal % 1024 === 0 && performance.now() - caseStarted > RENDER_TIME_LIMIT) {
    runaway = `freeze: still rendering after ${RENDER_TIME_LIMIT} ms`;
    caseStarted = 0;
  }
  if (runaway) throw new Error(runaway);
  return realCreateElement.apply(this, args);
};

class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    runaway = null;
    this.props.onError(error);
  }
  render() {
    return this.state.error ? realCreateElement('div', { 'data-testid': 'fuzz-fallback' }) : this.props.children;
  }
}

// Stands in for the store: each setExposedVariable(s) is a store write, which re-renders the host with a fresh
// properties object holding the same values, as ToolJet's resolver does. A widget that publishes on identity, not on
// content, therefore loops here as it would in an app.
const Host = ({ Widget, input, stats }) => {
  const [, bump] = useReducer((x) => x + 1, 0);
  stats.bump = () => {
    if (stats.bumps >= BUMP_LIMIT) return;
    stats.bumps += 1;
    bump();
  };
  const props = {
    id: 'fuzz-w1',
    componentType: input.name,
    componentName: 'fuzz1',
    dataCy: 'fuzz1',
    height: input.height ?? 240,
    width: input.width ?? 400,
    currentMode: input.mode || 'view',
    currentLayout: 'desktop',
    darkMode: false,
    parentId: null,
    subContainerIndex: null,
    properties: { ...input.properties },
    styles: { ...input.styles },
    validation: input.validation || {},
    setExposedVariables: stats.setExposedVariables,
    setExposedVariable: stats.setExposedVariable,
    fireEvent: stats.fireEvent,
    validate: stats.validate,
    resetComponent: () => {},
    resetExposedVariables: () => {},
    onComponentClick: () => {},
    componentCount: 0,
  };
  return (
    <Profiler
      id="fuzz"
      onRender={() => {
        stats.commits += 1;
        stepCommits += 1;
        stats.maxElements = Math.max(stats.maxElements || 0, elementCount);
        elementCount = 0;
        if (stepCommits === COMMIT_LIMIT) runaway = `runaway render: more than ${COMMIT_LIMIT} commits`;
      }}
    >
      <Widget {...props} />
    </Profiler>
  );
};

const describeError = (e) => (e && e.message ? e.message : String(e)).slice(0, 300);

export const newStats = () => {
  const stats = {
    commits: 0,
    bumps: 0,
    exposeCalls: 0,
    exposed: {},
    events: [],
    errors: [],
    warnings: [],
  };
  stats.setExposedVariables = (values) => {
    stats.exposeCalls += 1;
    Object.assign(stats.exposed, values);
    stats.bump?.();
  };
  stats.setExposedVariable = (key, value) => {
    stats.exposeCalls += 1;
    stats.exposed[key] = value;
    stats.bump?.();
  };
  stats.fireEvent = (event) => {
    stats.events.push(event);
    return Promise.resolve();
  };
  stats.validate = () => ({ isValid: true, validationError: null });
  return stats;
};

// Errors React reports outside the boundary: an event handler's throw (jsdom's window error), a rejected promise, and
// React's own warnings for update loops.
let current = null;
const onWindowError = (event) => {
  if (current) current.errors.push(`uncaught: ${describeError(event.error || event.message)}`);
  event.preventDefault();
};
const onRejection = (reason) => {
  if (current) current.errors.push(`unhandled rejection: ${describeError(reason)}`);
};
// Update loops, and a store write during render (another component updated while this one rendered).
const LOOP_WARNING = /Maximum update depth|Too many re-renders|infinite loop|Cannot update a component/i;
let consoleSpy;
export const installGuards = () => {
  beforeAll(() => {
    window.addEventListener('error', onWindowError);
    process.on('unhandledRejection', onRejection);
    const original = console.error;
    consoleSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const text = args.map((a) => (a && a.message ? a.message : String(a))).join(' ');
      if (current && LOOP_WARNING.test(text)) current.errors.push(`loop: ${text.slice(0, 300)}`);
      else if (current) current.warnings.push(text.slice(0, 200));
      else if (process.env.FUZZ_VERBOSE) original(...args);
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => {
    window.removeEventListener('error', onWindowError);
    process.off('unhandledRejection', onRejection);
    consoleSpy?.mockRestore();
  });
};

const settle = async (ms = 0) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

/** Mounts one case and lets it settle. Returns stats, timings and helpers; errors are collected, never thrown. */
export const mountCase = async (input) => {
  const stats = newStats();
  current = stats;
  const Widget = input.Widget || componentOf(input.name);
  elementCount = 0;
  runaway = null;
  const started = performance.now();
  caseStarted = started;
  stepCommits = 0;
  let view;
  try {
    await act(async () => {
      view = render(
        <Boundary onError={(e) => stats.errors.push(`render: ${describeError(e)}`)}>
          <Host Widget={Widget} input={input} stats={stats} />
        </Boundary>
      );
    });
  } catch (e) {
    stats.errors.push(`mount: ${describeError(e)}`);
  }
  stats.mountMs = performance.now() - started;
  stats.mountCommits = stats.commits;
  stats.mountExposeCalls = stats.exposeCalls;
  // Idle: no input; a widget that keeps rendering or publishing now is looping (timers included).
  const idleFrom = { commits: stats.commits, expose: stats.exposeCalls };
  try {
    await settle(20);
  } catch (e) {
    stats.errors.push(`idle: ${describeError(e)}`);
  }
  stats.idleCommits = stats.commits - idleFrom.commits;
  stats.idleExposeCalls = stats.exposeCalls - idleFrom.expose;
  if (stats.bumps >= BUMP_LIMIT) stats.errors.push(`loop: ${stats.exposeCalls} store writes without input`);
  return {
    stats,
    view,
    unmount: () => {
      try {
        act(() => view?.unmount());
      } catch (e) {
        stats.errors.push(`unmount: ${describeError(e)}`);
      }
      current = null;
    },
  };
};

// Limits of a healthy case.
// The time limit is loose outside FUZZ=full: CI machines and a loaded run are slower, and a freeze is far longer.
export const LIMITS = { commits: 50, exposeCalls: 50, mountMs: FULL ? 4000 : 10000 };

/** Problems with a settled case, as strings (empty: healthy). */
export const problemsOf = (stats, { mountMs = LIMITS.mountMs } = {}) => {
  // React reports a render error it hands to the boundary on window too: keep the render entry only.
  const rendered = new Set(stats.errors.filter((e) => e.startsWith('render: ')).map((e) => e.slice(8)));
  const out = stats.errors.filter((e) => !(e.startsWith('uncaught: ') && rendered.has(e.slice(10))));
  if (stats.mountCommits > LIMITS.commits) out.push(`renders: ${stats.mountCommits} commits while mounting`);
  if (stats.mountExposeCalls > LIMITS.exposeCalls)
    out.push(`expose: ${stats.mountExposeCalls} store writes while mounting`);
  if (stats.idleCommits > LIMITS.commits) out.push(`renders: ${stats.idleCommits} commits while idle`);
  if (stats.idleExposeCalls > LIMITS.exposeCalls) out.push(`expose: ${stats.idleExposeCalls} store writes while idle`);
  if (stats.mountMs > mountMs) out.push(`slow: mount took ${Math.round(stats.mountMs)} ms`);
  return [...new Set(out)];
};

// ---- Interactions and actions ----------------------------------------------------------------------------------

const INTERACTIVE =
  'button, a, input, textarea, select, [role=button], [role=tab], [role=option], [role=menuitem], [role=checkbox], [role=switch], [role=radio], [role=slider], [role=combobox], [role=gridcell], [role=row], [tabindex], [draggable=true], img, li, td, th';

/** Clicks, keys and types through everything interactive in the widget (and any portal it opened). */
export const interact = async (stats, view, { limit = 60 } = {}) => {
  const run = async (fn) => {
    caseStarted = performance.now();
    stepCommits = 0;
    try {
      await act(async () => {
        fn();
      });
    } catch (e) {
      stats.errors.push(`interaction: ${describeError(e)}`);
    }
  };
  const seen = new Set();
  for (let pass = 0; pass < 2; pass += 1) {
    const nodes = [...document.body.querySelectorAll(INTERACTIVE)].filter((n) => !seen.has(n)).slice(0, limit);
    for (const node of nodes) {
      seen.add(node);
      if (!node.isConnected) continue;
      await run(() => fire.pointerDown(node, { button: 0, pointerType: 'mouse' }));
      await run(() => fire.mouseDown(node));
      await run(() => fire.pointerUp(node, { button: 0, pointerType: 'mouse' }));
      await run(() => fire.mouseUp(node));
      if (!node.isConnected) continue;
      await run(() => fire.click(node));
      if (!node.isConnected) continue;
      await run(() => fire.doubleClick(node));
      for (const key of ['Enter', ' ', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End', 'Backspace', 'Escape']) {
        if (node.isConnected) await run(() => fire.keyDown(node, { key }));
      }
      if (node.isConnected && /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) && node.type !== 'file') {
        for (const value of ['x', '', '{{x', '-1', '1e9', 'lorem '.repeat(500), '2026-13-45', '#zzz']) {
          if (!node.isConnected) break;
          await run(() => fire.change(node, { target: { value } }));
          await run(() => fire.input(node, { target: { value } }));
        }
        if (node.isConnected) await run(() => fire.paste(node, { clipboardData: { getData: () => 'pasted' } }));
        if (node.isConnected) await run(() => fire.blur(node));
      }
      if (node.isConnected && node.getAttribute('draggable') === 'true') {
        await run(() => fire.dragStart(node));
        await run(() => fire.dragOver(node));
        await run(() => fire.drop(node));
        await run(() => fire.dragEnd(node));
      }
    }
  }
  await run(() => {});
};

const ACTION_JUNK = [
  [],
  [null],
  [undefined],
  [''],
  [NaN],
  [-1],
  [1e9],
  [Infinity],
  ['{{x'],
  [{}],
  [[]],
  [circular],
  [ROWS_10K],
  [{ a: { b: 1 } }, null],
  ['x', 'y', 'z'],
  [null, null, null],
  [() => {}],
];

/** Calls every function the widget exposed (its actions), with junk arguments; a throw or rejection is a problem. */
export const callActions = async (stats) => {
  const names = Object.entries(stats.exposed)
    .filter(([, v]) => typeof v === 'function')
    .map(([k]) => k);
  for (const action of names) {
    for (const args of ACTION_JUNK) {
      const fn = stats.exposed[action];
      if (typeof fn !== 'function') continue;
      caseStarted = performance.now();
      stepCommits = 0;
      try {
        await act(async () => {
          await fn(...args);
        });
      } catch (e) {
        stats.errors.push(`action ${action}(${args.map((a) => typeof a).join(', ')}): ${describeError(e)}`);
      }
    }
  }
  return names;
};

// ---- Runners ---------------------------------------------------------------------------------------------------

const fs = require('fs');
const trace = (line) => {
  if (process.env.FUZZ_TRACE) fs.appendFileSync(`${process.env.FUZZ_TRACE}.${process.env.JEST_WORKER_ID}`, `${line}\n`);
};

export const SLOW = [];
const runCase = async (label, input, out, { after } = {}) => {
  trace(label);
  const { stats, view, unmount } = await mountCase(input);
  if (after) await after(stats, view);
  unmount();
  const problems = problemsOf(stats);
  if (problems.length) out.push(`${label}: ${problems.join(' | ')}`);
  // Under the limits but worth a look: the slowest and largest healthy cases.
  if (stats.mountMs > 500 || stats.maxElements > 20000)
    SLOW.push(`${label}: ${Math.round(stats.mountMs)} ms, ${stats.maxElements} elements`);
  return stats;
};

/** Every property, one at a time, set to every junk value over the defaults; then every property junk at once. */
export const fuzzProperties = async (name, { mode = 'view', oneAtATime = true } = {}) => {
  const out = [];
  const defaults = defaultsOf(name);
  const styles = styleDefaultsOf(name);
  for (const key of oneAtATime ? propertyKeys(name) : []) {
    for (const [label, value] of ONE_AT_A_TIME) {
      await runCase(
        `${name} ${mode} property ${key} = ${label}`,
        { name, mode, properties: { ...defaults, [key]: value }, styles },
        out
      );
    }
  }
  for (const [label, value] of FULL || mode === 'view' ? JUNK : ONE_AT_A_TIME) {
    const all = Object.fromEntries(propertyKeys(name).map((k) => [k, value]));
    await runCase(
      `${name} ${mode} every property = ${label}`,
      { name, mode, properties: { ...defaults, ...all }, styles },
      out
    );
  }
  await runCase(`${name} ${mode} no properties`, { name, mode, properties: {}, styles: {} }, out);
  return out;
};

/** Every style, one at a time, set to every junk value; then every style junk at once, also while loading. */
export const fuzzStyles = async (name) => {
  const out = [];
  const defaults = defaultsOf(name);
  const styles = styleDefaultsOf(name);
  for (const key of styleKeys(name)) {
    for (const [label, value] of STYLE_ONE_AT_A_TIME) {
      await runCase(
        `${name} style ${key} = ${label}`,
        { name, properties: defaults, styles: { ...styles, [key]: value } },
        out
      );
    }
  }
  for (const [label, value] of STYLE_JUNK) {
    const all = Object.fromEntries(styleKeys(name).map((k) => [k, value]));
    await runCase(`${name} every style = ${label}`, { name, properties: defaults, styles: all }, out);
  }
  for (const [label, value] of FULL ? STYLE_JUNK : STYLE_ONE_AT_A_TIME) {
    const all = Object.fromEntries(styleKeys(name).map((k) => [k, value]));
    await runCase(
      `${name} loading, every style = ${label}`,
      { name, properties: { ...defaults, loadingState: true }, styles: all },
      out
    );
  }
  return out;
};

/** Interactions on the defaults (and on 10k rows in every data-shaped property), then every exposed action with
 *  junk arguments, then interactions again on whatever the actions left. Reports which declared events fired. */
export const fuzzBehaviour = async (name, extraProperties = {}) => {
  const out = [];
  const defaults = { ...defaultsOf(name), ...extraProperties };
  const styles = styleDefaultsOf(name);
  const fired = new Set();
  let actions = [];
  for (const mode of ['view', 'edit']) {
    await runCase(`${name} ${mode} behaviour`, { name, mode, properties: defaults, styles }, out, {
      after: async (stats, view) => {
        await interact(stats, view);
        actions = await callActions(stats);
        await interact(stats, view);
        stats.events.forEach((e) => fired.add(e));
        // After all that, the widget must still be quiet.
        const before = { commits: stats.commits, expose: stats.exposeCalls };
        await act(async () => {
          await new Promise((r) => setTimeout(r, 20));
        });
        if (stats.commits - before.commits > LIMITS.commits) stats.errors.push('renders: still rendering after input');
        if (stats.exposeCalls - before.expose > LIMITS.exposeCalls)
          stats.errors.push('expose: still publishing after input');
      },
    });
  }
  return {
    problems: out,
    fired: [...fired],
    declared: eventNames(name),
    actions,
  };
};

/** One shard's suite: the widgets whose index in the config registry falls in this shard. Problems fail the test; with
 *  FUZZ_OUT set, each widget's report (problems, fired and declared events, actions) is written there as JSON. */
export const fuzzShard = (shard, shards) => {
  installGuards();
  // FUZZ_ONLY=ShadSelect,ShadTable narrows a run to those widgets.
  const only = process.env.FUZZ_ONLY ? process.env.FUZZ_ONLY.split(',') : null;
  const names = NAMES.filter((n, i) => i % shards === shard && (!only || only.includes(n)));
  const report = (name, part, data) => {
    if (!process.env.FUZZ_OUT) return;
    fs.mkdirSync(process.env.FUZZ_OUT, { recursive: true });
    fs.writeFileSync(`${process.env.FUZZ_OUT}/${name}.${part}.json`, JSON.stringify(data, null, 1));
  };
  describe.each(names)('%s', (name) => {
    it('survives junk in every property, in view and edit mode', async () => {
      const problems = [
        ...(await fuzzProperties(name)),
        ...(await fuzzProperties(name, { mode: 'edit', oneAtATime: false })),
      ];
      report(name, 'properties', problems);
      expect(problems).toEqual([]);
    }, 900000);
    it('survives junk in every style', async () => {
      const problems = await fuzzStyles(name);
      report(name, 'styles', problems);
      expect(problems).toEqual([]);
    }, 900000);
    it('survives every interaction and every action called with junk', async () => {
      const result = await fuzzBehaviour(name);
      const big = await fuzzBehaviour(name, bigDataOf(name));
      report(name, 'behaviour', { ...result, bigData: big.problems });
      report(name, 'slow', SLOW.splice(0));
      expect([...result.problems, ...big.problems]).toEqual([]);
    }, 900000);
  });
};

// Every data-shaped property (a code property whose schema allows an array) given 10k rows.
const allowsArray = (schema) =>
  !!schema && (schema.type === 'array' || (schema.schemas || []).some((s) => allowsArray(s)));
export const bigDataOf = (name) =>
  Object.fromEntries(
    Object.entries(CONFIGS[name].properties || {})
      .filter(([, p]) => allowsArray(p?.validation?.schema))
      .map(([k]) => [k, ROWS_10K])
  );
