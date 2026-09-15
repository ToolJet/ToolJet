/**
 * Timer: the approved contract in
 * frontend/ee/test/app-builder/widgets/Timer/TESTING.md, exercised through the
 * real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Timer. Nothing about the widget is mocked
 * — the only control is `capabilities.time`, which installs jest fake timers so
 * the widget's own 15ms interval can be driven deterministically.
 *
 * Why fake timers and `fireEvent` rather than `userEvent`: the widget's product
 * IS elapsed time, so the clock has to be advanced by hand; userEvent's internal
 * delays deadlock against fake timers, and these controls are plain click
 * handlers with no pointer sequence worth simulating.
 *
 * Test titles carry their approved scenario ID as a `[Timer-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tm1';
const NAME = 'timer1';

// Baseline is `timer.js`'s own `definition`, copied rather than invented —
// including the fact that `visibility`/`disabledState` live under STYLES.
const widget = createWidgetHarness({
  componentType: 'Timer',
  handle: NAME,
  id: ID,
  defaultProperties: {
    value: binding('00:00:00:000'),
    type: binding('countUp'),
    collapseWhenHidden: binding('{{false}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  capabilities: { time: { at: '2026-01-01T00:00:00.000Z' } },
  widgetHeight: 128,
  widgetWidth: 300,
});

const card = () => document.querySelector('.card');
const display = () => document.querySelector('.counter-container')?.textContent;
const controls = () => [...document.querySelectorAll('a.btn')].map((node) => node.textContent.trim());
const control = (label) => [...document.querySelectorAll('a.btn')].find((node) => node.textContent.trim() === label);
const exposed = (key) => widget.exposed()?.[key];

async function mount(options = {}) {
  widget.render(options);
  await waitFor(() => expect(display()).toBeTruthy());
}

/** Advances the widget's own interval by `ms`, flushing the renders it causes. */
async function tick(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const ALL_EVENTS = [
  counting('onStart', 'started'),
  counting('onPause', 'paused'),
  counting('onResume', 'resumed'),
  counting('onReset', 'reset'),
  counting('onCountDownFinish', 'finished'),
];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('Timer: the default value', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Timer-DEF-001] the configured Default value is what the clock shows on load', async () => {
    // Break this catches: parsing the default with the wrong separator or field
    // order, so a configured start time renders as something else.
    await mount({ properties: { value: binding('01:02:03:004') } });

    expect(display()).toBe('01:02:03:004');
    expect(controls()).toEqual(['Start', 'Reset']);
  });

  test('[Timer-DEF-002] each part of the clock is zero-padded to its own width', async () => {
    // Break this catches: padding milliseconds to two digits (or seconds to
    // three), which makes the clock jump width as it counts.
    await mount({ properties: { value: binding('1:2:3:4') } });

    expect(display()).toBe('01:02:03:004');
  });

  test('[Timer-DEF-003] changing the Timer type or the Default value resets a running clock', async () => {
    // Break this catches: leaving the old interval running after a property
    // change, which double-counts the clock from then on.
    await mount({ events: ALL_EVENTS });
    fireEvent.click(control('Start'));
    await tick(500);
    expect(display()).not.toBe('00:00:00:000');

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'type', 'countDown', 'properties');
    });
    await waitFor(() => expect(controls()).toEqual(['Start', 'Reset']));
    expect(display()).toBe('00:00:00:000');

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'value', '00:00:05:000', 'properties');
    });

    await waitFor(() => expect(display()).toBe('00:00:05:000'));
    await tick(500);
    expect(display()).toBe('00:00:05:000');
  });

  test('[Timer-DEF-004] out-of-range or unparseable parts of the Default value become zero', async () => {
    // Break this catches: letting a malformed default through, so the clock
    // renders NaN or a minute value above 59 that then counts wrongly.
    await mount({ properties: { value: binding('00:99:75:9999') } });
    expect(display()).toBe('00:00:00:000');

    await mount({ properties: { value: binding('not-a-time') } });

    expect(display()).toBe('00:00:00:000');
  });
});

describe('Timer: running the clock', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Timer-RUN-001] Start counts the clock up and swaps the control to Pause', async () => {
    // Break this catches: starting the interval without moving the state, so
    // the user is left with a Start button on a running clock.
    await mount();

    fireEvent.click(control('Start'));
    await tick(1005);

    expect(display()).toBe('00:00:01:005');
    expect(controls()).toEqual(['Pause', 'Reset']);
  });

  test('[Timer-RUN-002] a count-down Timer counts down from its default', async () => {
    // Break this catches: branching on the wrong timer type, which counts a
    // countdown upwards — the single most visible possible defect here.
    await mount({ properties: { type: binding('countDown'), value: binding('00:00:05:000') } });

    fireEvent.click(control('Start'));
    await tick(1005);

    expect(display()).toBe('00:00:03:995');
  });

  test('[Timer-RUN-003] Pause holds the clock and Resume continues from where it stopped', async () => {
    // Break this catches: a paused clock that keeps ticking, or a Resume that
    // restarts from the default and throws away the elapsed time.
    await mount();
    fireEvent.click(control('Start'));
    await tick(1005);

    fireEvent.click(control('Pause'));
    await tick(1000);
    expect(display()).toBe('00:00:01:005');
    expect(controls()).toEqual(['Resume', 'Reset']);

    fireEvent.click(control('Resume'));
    await tick(300);

    expect(display()).toBe('00:00:01:305');
  });

  test('[Timer-RUN-004] a count-down reaching zero stops, fires On count down finish, and returns to Start', async () => {
    // Break this catches: counting past zero into negative time, or leaving the
    // interval running against a finished countdown.
    await mount({
      properties: { type: binding('countDown'), value: binding('00:00:01:000') },
      events: ALL_EVENTS,
    });

    fireEvent.click(control('Start'));
    await tick(1100);

    expect(display()).toBe('00:00:00:000');
    await waitFor(() => expect(fired('finished')).toBe(1));
    expect(controls()).toEqual(['Start', 'Reset']);

    await tick(1000);
    expect(display()).toBe('00:00:00:000');
  });

  test('[Timer-RUN-005] removing the Timer while it runs stops its interval', async () => {
    // Break this catches: leaking the interval on unmount, so a page that
    // removes a running Timer keeps a 15ms callback alive forever.
    await mount();
    fireEvent.click(control('Start'));
    await tick(300);

    widget.session.render(<div data-testid="after-unmount" />);

    await waitFor(() => expect(document.querySelector('.counter-container')).toBeNull());
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('Timer: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Timer-EVT-001] Start fires On start once, and Resume fires On resume rather than On start', async () => {
    // Break this catches: Resume routing through the start branch (both share
    // `onStart`), which would run a builder's "started" query on every resume.
    await mount({ events: ALL_EVENTS });

    fireEvent.click(control('Start'));
    await waitFor(() => expect(fired('started')).toBe(1));

    fireEvent.click(control('Pause'));
    fireEvent.click(control('Resume'));

    await waitFor(() => expect(fired('resumed')).toBe(1));
    expect(fired('started')).toBe(1);
  });

  test('[Timer-EVT-002] Pause fires On pause once and publishes the paused time', async () => {
    // Break this catches: pausing without republishing, so an app reading the
    // value after a pause sees the pre-start snapshot.
    await mount({ events: ALL_EVENTS });
    fireEvent.click(control('Start'));
    await tick(1005);

    fireEvent.click(control('Pause'));

    await waitFor(() => expect(fired('paused')).toBe(1));
    expect(exposed('value')).toEqual({ hour: 0, minute: 0, second: 1, mSecond: 5 });
  });

  test('[Timer-EVT-003] Reset returns the clock to its default, republishes it, and fires On reset once', async () => {
    // Break this catches: resetting the display without republishing the value,
    // or resetting to zero instead of to the configured default.
    await mount({ properties: { value: binding('00:00:02:000') }, events: ALL_EVENTS });
    fireEvent.click(control('Start'));
    await tick(1005);

    fireEvent.click(control('Reset'));

    await waitFor(() => expect(fired('reset')).toBe(1));
    expect(display()).toBe('00:00:02:000');
    expect(exposed('value')).toEqual({ hour: 0, minute: 0, second: 2, mSecond: 0 });
    expect(controls()).toEqual(['Start', 'Reset']);
  });
});

describe('Timer: states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Timer-STATE-001] Visibility off hides the Timer', async () => {
    // Break this catches: a "hidden" Timer still on screen.
    await mount({ styles: { visibility: binding('{{false}}'), disabledState: binding('{{false}}') } });

    expect(card()).toHaveStyle({ display: 'none' });
  });

  test('[Timer-STATE-002] a finished count-down marks its Start control disabled', async () => {
    // Break this catches: offering a Start on a countdown with nothing left to
    // count, which restarts a clock that immediately finishes again.
    await mount({ properties: { type: binding('countDown'), value: binding('00:00:01:000') } });
    fireEvent.click(control('Start'));
    await tick(1100);

    await waitFor(() => expect(controls()).toEqual(['Start', 'Reset']));
    expect(control('Start').className).toContain('disabled');
  });

  test('[Timer-STATE-003] Disable marks every control disabled', async () => {
    // Break this catches: dropping the disabled marker, so a locked Timer looks
    // interactive. Whether the controls then refuse input is Timer-BUG-004.
    await mount({ styles: { visibility: binding('{{true}}'), disabledState: binding('{{true}}') } });

    expect(control('Start').className).toContain('disabled');
    expect(control('Reset').className).toContain('disabled');
  });

  test('[Timer-COMPAT-001] a definition predating collapseWhenHidden still renders and runs', async () => {
    // Break this catches: reading the newer key as required, which would break
    // every Timer saved before it existed.
    legacyWidget.setup();
    legacyWidget.render();
    await waitFor(() => expect(display()).toBeTruthy());

    fireEvent.click(control('Start'));
    await tick(1005);

    expect(display()).toBe('00:00:01:005');
    legacyWidget.teardown();
  });
});

/** A definition saved before `collapseWhenHidden` existed: the key is ABSENT. */
const legacyWidget = createWidgetHarness({
  componentType: 'Timer',
  handle: NAME,
  id: ID,
  defaultProperties: {
    value: binding('00:00:00:000'),
    type: binding('countUp'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  capabilities: { time: { at: '2026-01-01T00:00:00.000Z' } },
  widgetHeight: 128,
  widgetWidth: 300,
});

describe('Timer: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-01): the mount effect publishes `value` as `{}`
  // (Timer.jsx:41-43) instead of the parsed default, so every binding against
  // the widget's ONLY exposed variable reads `undefined` until the user presses
  // a control. Fix: publish `getTimeObj(getDefaultValue)` on mount.
  test.failing('[Timer-BUG-001] `value` holds the Timer s default on load', async () => {
    await mount({ properties: { value: binding('00:00:02:000') } });

    expect(exposed('value')).toEqual({ hour: 0, minute: 0, second: 2, mSecond: 0 });
  });

  // BUG (unfixed, contract D-01): `value` is written only at start/pause/reset,
  // and the start write uses the PRE-start time, so while the clock runs the
  // variable holds a stale snapshot of where it began. Fix: publish from the
  // interval callback alongside setTime.
  test.failing('[Timer-BUG-002] `value` tracks the clock while it runs', async () => {
    await mount();
    fireEvent.click(control('Start'));

    await tick(1005);

    expect(display()).toBe('00:00:01:005');
    expect(exposed('value')).toEqual({ hour: 0, minute: 0, second: 1, mSecond: 5 });
  });

  // BUG (unfixed, contract D-02): the finish effect runs on every `time` change
  // INCLUDING the mount and the type/default reset, so a countdown configured
  // with a zero default fires onCountDownFinish before the user starts
  // anything. Fix: fire only when the clock was running.
  test.failing('[Timer-BUG-003] On count down finish fires only when a running count-down reaches zero', async () => {
    await mount({
      properties: { type: binding('countDown'), value: binding('00:00:00:000') },
      events: ALL_EVENTS,
    });

    expect(fired('finished')).toBe(0);
  });

  // BUG (unfixed, contract D-03): `disabledState` only adds a CSS class; no
  // handler is gated on it and the widget applies no `inert`, so a disabled
  // Timer still starts on click. Fix: return early from the handlers while
  // disabled.
  test.failing('[Timer-BUG-004] a disabled Timer does not start when its control is clicked', async () => {
    await mount({
      styles: { visibility: binding('{{true}}'), disabledState: binding('{{true}}') },
      events: ALL_EVENTS,
    });

    fireEvent.click(control('Start'));
    await tick(300);

    expect(display()).toBe('00:00:00:000');
    expect(fired('started')).toBe(0);
  });

  // BUG (unfixed, contract D-05): the controls are `<a>` elements with no href,
  // role, tabIndex or key handler, so a keyboard user cannot reach or operate
  // the Timer at all. Fix: render real buttons.
  test.failing('[Timer-BUG-005] the Timer s controls are reachable and operable by keyboard', async () => {
    await mount();

    const start = control('Start');
    start.focus();
    expect(document.activeElement).toBe(start);

    fireEvent.keyDown(start, { key: 'Enter', code: 'Enter' });
    await tick(300);

    expect(display()).not.toBe('00:00:00:000');
  });
});
