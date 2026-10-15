import { act } from '@testing-library/react';
import { CONFIGS, NAMES, crashed, installGuards, mountWidget, takeErrors } from './harness';
import { run } from './probes';
import { ACTION_ARGS, JUNK_ARGS } from './actionArgs';

// Every component action of every shadcn/ui pack widget, called the way a Control component event action calls it
// (the widget's exposed function, through the real store): with valid arguments it must change what the widget
// shows or exposes (or fire its event, or move focus), and with junk arguments it must not crash, throw or freeze.
// An action with no entry in actionArgs.jsx fails the suite. Shared by the actions*.spec.jsx shards; not a suite.

const setup = () => {
  installGuards();
  beforeEach(() => {
    const host = document.createElement('div');
    host.className = 'canvas-content';
    host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
    document.body.appendChild(host);
  });
  afterEach(() => document.querySelectorAll('.canvas-content').forEach((n) => n.remove()));
};

const STANDARD = ['setVisibility', 'setDisable', 'setLoading'];
const actionsOf = (name) => (CONFIGS[name].actions || []).map((a) => a.handle);
const own = (name) => actionsOf(name).filter((a) => !STANDARD.includes(a));
const boxOf = () => document.querySelector('[data-cy="draggable-widget-w1"]')?.parentElement;

/** Calls an exposed action; returns the error it threw or rejected with, or null. */
const call = async (m, handle, args) => {
  const fn = m.exposed()[handle];
  if (typeof fn !== 'function') return new Error(`${handle} is not exposed`);
  let failure = null;
  await act(async () => {
    try {
      await fn(...args);
    } catch (e) {
      failure = e;
    }
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });
  return failure;
};

const firedHandler = (eventId) => [
  {
    id: 'evt-fired',
    index: 0,
    sourceId: 'w1',
    name: 'evt-fired',
    target: 'component',
    event: {
      eventId,
      actionId: 'set-custom-variable',
      key: 'fired',
      value: '{{true}}',
    },
  },
];

export const actionsShard = (shard, shards) => {
  setup();
  const names = NAMES.filter((n, i) => i % shards === shard);
  describe('every pack action has valid arguments to test with', () => {
    it.each(names)('%s', (name) => {
      expect(own(name).filter((a) => !ACTION_ARGS[name]?.[a])).toEqual([]);
    });
  });

  const ownCases = names.flatMap((name) => own(name).map((handle) => [`${name} ${handle}`, name, handle]));

  describe.each(ownCases)('%s', (_, name, handle) => {
    const spec = ACTION_ARGS[name]?.[handle];
    const test = spec ? it : it.skip;
    test('with valid arguments changes the widget', async () => {
      const m = await mountWidget(name, {
        properties: spec.context || {},
        events: spec.fires ? firedHandler(spec.fires) : [],
      });
      await run(m, spec.before || []);
      const before = m.snapshot();
      const created = [];
      const realCreate = URL.createObjectURL;
      if (spec.download) URL.createObjectURL = (blob) => created.push(blob) && 'blob:test';
      const failure = await call(m, handle, spec.args);
      URL.createObjectURL = realCreate;
      await run(m, spec.after || []);
      const after = m.snapshot();
      const focusInside = !!boxOf()?.contains(document.activeElement) && document.activeElement !== document.body;
      const vars = m.variables();
      const failed = crashed();
      const errors = takeErrors();
      await m.unmount();
      expect(failed).toBe(false);
      expect(errors).toEqual([]);
      expect(failure).toBeNull();
      if (spec.fires) expect(vars.fired).toBe(true);
      else if (spec.focus !== undefined) expect(focusInside).toBe(spec.focus);
      else if (spec.download) expect(created).toHaveLength(1);
      else expect(before.geometry !== after.geometry || before.exposed !== after.exposed).toBe(true);
    }, 60000);
  });

  describe.each(names)('%s', (name) => {
    it('takes junk arguments in every action without crashing, throwing or freezing', async () => {
      const m = await mountWidget(name, { properties: {} });
      const problems = [];
      for (const handle of actionsOf(name)) {
        for (const args of JUNK_ARGS) {
          const started = Date.now();
          const failure = await call(m, handle, args);
          const took = Date.now() - started;
          const label = `${handle}(${args
            .map((a) => (typeof a === 'string' ? a.slice(0, 12) : JSON.stringify(a)?.slice(0, 20)))
            .join(', ')})`;
          if (failure) problems.push(`${label} threw ${failure.message}`);
          if (took > 2000) problems.push(`${label} took ${took} ms`);
          if (crashed()) problems.push(`${label} crashed the widget`);
          for (const e of takeErrors()) problems.push(`${label}: ${e}`);
          if (problems.length > 10) break;
        }
        // Each action's junk is followed by the standard actions back to a usable widget.
        await call(m, 'setVisibility', [true]);
        await call(m, 'setDisable', [false]);
        await call(m, 'setLoading', [false]);
      }
      const stillThere = !!boxOf();
      await m.unmount();
      expect(problems).toEqual([]);
      expect(stillThere).toBe(true);
    }, 300000);

    it('answers the standard actions: setVisibility, setDisable and setLoading', async () => {
      const m = await mountWidget(name, { properties: {} });
      const seen = {};
      await call(m, 'setVisibility', [false]);
      seen.hidden = m.exposed().isVisible;
      seen.hiddenDom = boxOf()?.querySelector('.tj-shadcn')?.style.display;
      await call(m, 'setVisibility', [true]);
      seen.shown = m.exposed().isVisible;
      // The Dialog has the native ModalV2's setDisableTrigger and setDisableModal instead of setDisable.
      const disable = name === 'ShadDialog' ? 'setDisableModal' : 'setDisable';
      const disabledKey = name === 'ShadDialog' ? 'isDisabledModal' : 'isDisabled';
      await call(m, disable, [true]);
      seen.disabled = m.exposed()[disabledKey];
      await call(m, disable, [false]);
      seen.enabled = m.exposed()[disabledKey];
      await call(m, 'setLoading', [true]);
      seen.loading = m.exposed().isLoading;
      // The loading look: the widget marked busy, or a spinner or skeleton in it (Table, Tabs and List view draw their own).
      seen.busy = !!boxOf()?.querySelector('[aria-busy=true], [role=status], .animate-pulse, .animate-spin');
      await call(m, 'setLoading', [false]);
      seen.loaded = m.exposed().isLoading;
      const failed = crashed();
      const errors = takeErrors();
      await m.unmount();
      expect(failed).toBe(false);
      expect(errors).toEqual([]);
      const isDialog = name === 'ShadDialog';
      expect(seen).toEqual({
        hidden: false,
        hiddenDom: isDialog ? seen.hiddenDom : 'none',
        shown: true,
        disabled: true,
        enabled: false,
        loading: true,
        busy: isDialog ? seen.busy : true,
        loaded: false,
      });
    }, 60000);
  });
};
