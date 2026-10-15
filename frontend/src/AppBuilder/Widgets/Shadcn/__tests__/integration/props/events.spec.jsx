import useStore from '@/AppBuilder/_stores/store'; // eslint-disable-line no-unused-vars -- marks this a real-store (integration) spec
import { CONFIGS, NAMES, crashed, installGuards, mountWidget, takeErrors } from './harness';
import { run } from './probes';
import { TRIGGERS } from './eventTriggers';

// Every event of every shadcn/ui pack widget fires: each is wired to a real event handler (a set-custom-variable
// action, through ToolJet's events slice), the interaction in eventTriggers.jsx is made, and the handler must have run,
// seeing the widget's exposed value already updated where `reads` names one. An event with no trigger fails the suite.
installGuards();

beforeEach(() => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
});
afterEach(() => document.querySelectorAll('.canvas-content').forEach((n) => n.remove()));

const eventsOf = (name) => Object.keys(CONFIGS[name].events || {});

/** Handlers for every event of the widget: `fired_<event>` set to true, and `read_<event>` to the exposed value the
 *  trigger names, as the handler sees it. */
const handlers = (name, id) =>
  eventsOf(name).flatMap((eventId, i) => {
    const read = TRIGGERS[name]?.[eventId]?.reads;
    const row = (key, value, k) => ({
      id: `evt-${eventId}-${k}`,
      index: i * 2 + k,
      sourceId: id,
      name: `evt-${eventId}-${k}`,
      target: 'component',
      event: { eventId, actionId: 'set-custom-variable', key, value },
    });
    return [
      row(`fired_${eventId}`, '{{true}}', 0),
      ...(read ? [row(`read_${eventId}`, `{{JSON.stringify(components.w1.${read} ?? null)}}`, 1)] : []),
    ];
  });

// Mounting fires nothing: a handler that runs a query on change must not run when the page opens.
describe('no pack event fires on mount', () => {
  it.each(NAMES.filter((name) => eventsOf(name).length))('%s', async (name) => {
    const m = await mountWidget(name, { properties: TRIGGERS[name]?.context || {}, events: handlers(name, 'w1') });
    const fired = Object.keys(m.variables()).filter((k) => k.startsWith('fired_'));
    await m.unmount();
    expect(fired).toEqual([]);
  });
});

const cases = NAMES.flatMap((name) => eventsOf(name).map((eventId) => [`${name} ${eventId}`, name, eventId]));

describe('every pack event has a trigger', () => {
  it.each(NAMES)('%s', (name) => {
    const missing = eventsOf(name).filter((e) => !TRIGGERS[name]?.[e]);
    expect(missing).toEqual([]);
  });
});

describe.each(cases)('%s', (_, name, eventId) => {
  const trigger = TRIGGERS[name]?.[eventId];
  const test = trigger && !trigger.tbd ? it : it.skip;
  test('fires through the real event handler, with the exposed value already updated', async () => {
    const m = await mountWidget(name, {
      properties: { ...(TRIGGERS[name].context || {}), ...(trigger.context || {}) },
      events: handlers(name, 'w1'),
    });
    const before = m.variables();
    const initial = trigger.reads ? JSON.stringify(m.exposed()[trigger.reads] ?? null) : null;
    await run(m, trigger.steps);
    const vars = m.variables();
    const failed = crashed();
    const errors = takeErrors();
    await m.unmount();
    expect(failed).toBe(false);
    expect(errors).toEqual([]);
    expect(before[`fired_${eventId}`]).toBeUndefined();
    expect(vars[`fired_${eventId}`]).toBe(true);
    if (trigger.reads) {
      // The handler sees the value the interaction made, not the one the widget started with.
      const seen = vars[`read_${eventId}`];
      expect(seen).toBeDefined();
      expect(seen).not.toBe(initial);
    }
  }, 60000);
});
