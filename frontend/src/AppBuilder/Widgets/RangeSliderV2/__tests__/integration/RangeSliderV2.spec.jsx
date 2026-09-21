/**
 * RangeSliderV2 behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/RangeSliderV2/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 *
 * The control is rc-slider 10.6.2. Its handle is the `slider` role and carries
 * aria-valuemin/valuemax/valuenow, so value, bounds and keyboard stepping are
 * all observable without geometry. Pointer dragging along the rail needs real
 * layout and is QA's (BRW-001) — every interaction here is keyboard.
 *
 * Several scenarios are CHARACTERIZATION of behaviour the contract records as
 * known-sharp rather than desirable (D-01/D-02/D-03/D-07). Those tests say so
 * in a comment, so a future fix reads as a deliberate expectation change.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, countInvocationsOn, binding, store } from '../../../__tests__/integration/widgetHarness';

const RS = 'rs1';
const FORM = 'form1';

const widget = createWidgetHarness({
  componentType: 'RangeSliderV2',
  handle: 'rangeslider1',
  id: RS,
  defaultProperties: {
    label: binding('Budget'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
});

/** `Slider` mode: the registered switch stores a string, not a boolean. */
const SINGLE = { enableTwoHandle: binding('slider') };
const RANGE = { enableTwoHandle: binding('rangeSlider') };

const handles = (container) => within(container).getAllByRole('slider');
const handle = (container) => handles(container)[0];
const rootEl = (container) => container.querySelector('.range-slider');
const labelEl = (container) => container.querySelector('label');
const railEl = (container) => container.querySelector('.rc-slider-rail');
const trackEl = (container) => container.querySelector('.rc-slider-track');
const markTexts = (container) => [...container.querySelectorAll('.rc-slider-mark-text')];
const valueNow = (el) => Number(el.getAttribute('aria-valuenow'));

/**
 * rc-slider 10.6.2 reads ONLY the deprecated `e.which || e.keyCode`
 * (Handles/Handle.js:68 and :105) and never `e.key`. user-event 14 populates
 * neither, so `user.keyboard()` cannot drive this control AT ALL — every
 * assertion through it passes vacuously. A real browser still sets `keyCode`
 * for arrow keys, so this is a jsdom/user-event gap and not a product defect;
 * the fix is to dispatch the event shape a browser actually produces, which
 * runs the real rc-slider handler on the real element.
 *
 * keydown moves the value; keyup is what commits it and fires the widget's
 * On change event, so the two are separable (see EVT-002).
 */
const KEY_CODES = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35 };

function keyEventInit(key) {
  const keyCode = KEY_CODES[key];
  if (!keyCode) throw new Error(`press(): no keyCode mapped for '${key}'`);
  return { key, code: key, keyCode, which: keyCode };
}

/** Press and hold: moves the value without committing it. */
function pressDown(el, key) {
  el.focus();
  fireEvent.keyDown(el, keyEventInit(key));
}

/** Release: commits the value and fires On change. */
function pressUp(el, key) {
  fireEvent.keyUp(el, keyEventInit(key));
}

/** A complete key press: move and commit. */
function press(el, key) {
  pressDown(el, key);
  pressUp(el, key);
}

describe('RangeSliderV2', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('defaults and mounting', () => {
    test('[RangeSliderV2-DEF-001] a single slider mounts exposing its configured default as a number', async () => {
      // Break this catches: the mount-time reset never running (an added
      // isInitialRender guard, or the effect reordered above the one that
      // clears it), which would leave `value` at the registered null and every
      // binding reading nothing until the user touched the control.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{30}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(30));
      expect(widget.exposed().value).not.toBeNull();
      expect(handles(container)).toHaveLength(1);
      expect(valueNow(handle(container))).toBe(30);
    });

    test('[RangeSliderV2-DEF-001] a default of zero survives as the number 0, not as unset', async () => {
      // Break this catches: a `value || min` style falsy guard replacing the
      // nullish one, which would silently promote a deliberate 0 to the minimum.
      // The minimum is deliberately NOT 0 — with min 0 both guards produce 0 and
      // the assertion cannot see the difference (the sensitivity pass caught
      // exactly that, so keep min negative here).
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{-50}}'), max: binding('{{100}}'), value: binding('{{0}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(0));
      expect(widget.exposed().value).not.toBe(-50);
      expect(valueNow(handle(container))).toBe(0);
    });

    test('[RangeSliderV2-DEF-001] with no default configured the value falls back to min', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{10}}'), max: binding('{{100}}'), value: binding('{{undefined}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(10));
      expect(valueNow(handle(container))).toBe(10);
    });

    test('[RangeSliderV2-DEF-002] a range slider mounts exposing both handles as a pair', async () => {
      // Break this catches: the range branch reading the single-slider default,
      // or publishing a scalar, which would break every `value[0]`/`value[1]`
      // binding an app has written against a range slider.
      const { container } = widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
      });

      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));
      expect(handles(container)).toHaveLength(2);
      expect(valueNow(handles(container)[0])).toBe(20);
      expect(valueNow(handles(container)[1])).toBe(70);
    });

    test('[RangeSliderV2-DEF-002] an unset start or end falls back to min and max respectively', async () => {
      widget.render({
        properties: {
          ...RANGE,
          min: binding('{{5}}'),
          max: binding('{{95}}'),
          startValue: binding('{{undefined}}'),
          endValue: binding('{{undefined}}'),
        },
      });

      await waitFor(() => expect(widget.exposed().value).toEqual([5, 95]));
    });

    test('[RangeSliderV2-DEF-003] the configured label renders and is published', async () => {
      const { container } = widget.render({ properties: { ...SINGLE, label: binding('Monthly budget') } });

      expect(await screen.findByText('Monthly budget')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().label).toBe('Monthly budget'));
      expect(labelEl(container)).toBeInTheDocument();
    });

    test('[RangeSliderV2-DEF-004] a default above the maximum is published unclamped', async () => {
      // CHARACTERIZATION (D-02). Not endorsed: the control draws clamped while
      // the published value is not, so a binding reads a number the slider
      // cannot represent. Pinned so a future clamp is a deliberate change.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{150}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(150));
      expect(valueNow(handle(container))).toBe(100);
    });

    test('[RangeSliderV2-DEF-004] a default below the minimum is published unclamped', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{20}}'), max: binding('{{100}}'), value: binding('{{5}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(5));
      expect(valueNow(handle(container))).toBe(20);
    });
  });

  describe('keyboard interaction', () => {
    test('[RangeSliderV2-INT-001] arrow keys move a single handle by the configured step', async () => {
      // Break this catches: the step prop dropped or the change handler no
      // longer publishing, either of which makes the keyboard silently inert
      // while the handle still appears to move.
      // The registered default schema puts marks at 25/50/75, and rc-slider
      // treats mark values as EXTRA snap points alongside the step grid — from
      // 20 with step 10 the next stop is the mark at 25, not 30. The step
      // guarantee is about the step, so these scenarios clear the marks; the
      // marks-as-snap-points behaviour is a separate finding (see the contract).
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          stepSize: binding('{{5}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(55));
      expect(valueNow(handle(container))).toBe(55);

      press(handle(container), 'ArrowLeft');
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'ArrowUp');
      await waitFor(() => expect(widget.exposed().value).toBe(55));

      press(handle(container), 'ArrowDown');
      await waitFor(() => expect(widget.exposed().value).toBe(50));
    });

    test('[RangeSliderV2-INT-001] arrow keys move the focused handle of a range slider only', async () => {
      const { container } = widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
          stepSize: binding('{{10}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      press(handles(container)[0], 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toEqual([30, 70]));

      press(handles(container)[1], 'ArrowLeft');
      await waitFor(() => expect(widget.exposed().value).toEqual([30, 60]));
    });

    test('[RangeSliderV2-INT-002] Home and End jump to the configured bounds', async () => {
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{10}}'),
          max: binding('{{90}}'),
          value: binding('{{50}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'Home');
      await waitFor(() => expect(widget.exposed().value).toBe(10));

      press(handle(container), 'End');
      await waitFor(() => expect(widget.exposed().value).toBe(90));
    });

    test('[RangeSliderV2-INT-002] stepping at a bound does not pass it', async () => {
      // Break this catches: min/max not reaching rc-slider, letting the
      // keyboard walk the value outside the configured range.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{10}}'),
          value: binding('{{10}}'),
          stepSize: binding('{{1}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(10));

      press(handle(container), 'ArrowRight');
      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(valueNow(handle(container))).toBe(10));
      expect(widget.exposed().value).toBe(10);
    });

    test('[RangeSliderV2-INT-002] an indivisible range still reaches its maximum via End', async () => {
      // 0..10 by 3 snaps to 0/3/6/9; 10 is only reachable as the bound itself.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{10}}'),
          value: binding('{{9}}'),
          stepSize: binding('{{3}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(9));

      press(handle(container), 'End');
      await waitFor(() => expect(widget.exposed().value).toBe(10));
    });

    test('[RangeSliderV2-INT-004] configured marks are keyboard stops as well as the step', async () => {
      // Break this catches: an rc-slider upgrade (or a switch to plain step
      // snapping) that stops treating marks as reachable positions — a builder
      // who labels 25/50/75 expects the keyboard to land on them, and with a
      // step of 10 from 20 nothing else would ever stop there.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{20}}'),
          stepSize: binding('{{10}}'),
          schema: binding("{{[{label:'Quarter',value:25}]}}"),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(20));

      // The mark at 25 wins over the step point at 30.
      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(25));

      // And stepping continues from there on the step grid.
      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(30));
    });

    test('[RangeSliderV2-INT-003] a step size of zero behaves as one', async () => {
      // CHARACTERIZATION. `step={stepSize || 1}` promotes any falsy step to 1,
      // which is why a "no stepping" configuration cannot be expressed.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          stepSize: binding('{{0}}'),
          schema: binding('{{[]}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(51));
    });
  });

  describe('bindings and property changes', () => {
    test('[RangeSliderV2-BIND-001] a bound label re-resolves and republishes', async () => {
      const { container } = widget.render({ properties: { ...SINGLE, label: binding('First') } });
      await waitFor(() => expect(widget.exposed().label).toBe('First'));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'label', 'Second', 'properties');
      });

      await waitFor(() => expect(widget.exposed().label).toBe('Second'));
      expect(within(container).getByText('Second')).toBeInTheDocument();
    });

    test('[RangeSliderV2-BIND-002] switching mode republishes the value in the other shape', async () => {
      // Break this catches: the mode switch missing from the reset effect's
      // dependencies, which would leave a range slider publishing a scalar (or
      // vice versa) until some other property happened to change.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{40}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));
      expect(handles(container)).toHaveLength(1);

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'enableTwoHandle', 'rangeSlider', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));
      expect(handles(container)).toHaveLength(2);

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'enableTwoHandle', 'slider', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBe(40));
      expect(handles(container)).toHaveLength(1);
    });

    test('[RangeSliderV2-BIND-003] lowering max under the live value leaves the published value stale', async () => {
      // CHARACTERIZATION (D-02), and the higher-risk half: min/max are usually
      // bound, so a query returning a smaller ceiling leaves a binding reading
      // a number the control no longer offers. Not endorsed; pinned.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{200}}'), value: binding('{{150}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(150));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'max', '{{100}}', 'properties');
      });

      await waitFor(() => expect(handle(container).getAttribute('aria-valuemax')).toBe('100'));
      expect(valueNow(handle(container))).toBe(100);
      expect(widget.exposed().value).toBe(150);
    });

    test('[RangeSliderV2-BIND-003] changing a default value property does re-derive it', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{200}}'), value: binding('{{150}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(150));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'value', '{{60}}', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBe(60));
      expect(valueNow(handle(container))).toBe(60);
    });
  });

  describe('events', () => {
    test('[RangeSliderV2-EVT-001] one committed key press fires On change exactly once', async () => {
      // Break this catches: the commit callback prop being wrong or dropped —
      // including a bad rename — which fires zero events while the value still
      // moves, so every dependent query stops re-running.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'ArrowRight');

      await waitFor(() => expect(widget.variables().calls).toBe(1));
      expect(widget.exposed().value).toBe(51);
    });

    test('[RangeSliderV2-EVT-001] a committed key press on a range slider fires it once too', async () => {
      const { container } = widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      press(handles(container)[0], 'ArrowRight');

      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });

    test('[RangeSliderV2-EVT-002] the value publishes during the interaction, before the event fires', async () => {
      // Break this catches: moving the publish onto the commit callback, which
      // would freeze a bound preview until the user let go of the key.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      const el = handle(container);
      pressDown(el, 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(51));
      expect(widget.variables().calls ?? 0).toBe(0);

      pressUp(el, 'ArrowRight');
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });
  });

  describe('component specific actions', () => {
    test('[RangeSliderV2-ACT-001] setValue moves a single slider, publishes and fires On change', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setValue', 30);

      await waitFor(() => expect(widget.exposed().value).toBe(30));
      expect(valueNow(handle(container))).toBe(30);
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });

    test('[RangeSliderV2-ACT-001] setValue converts a numeric string to a number', async () => {
      // Break this catches: the conversion being dropped, which would publish
      // a string and break every arithmetic binding downstream — query results
      // and URL params arrive as strings, so this path is the common one.
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setValue', '42');

      await waitFor(() => expect(widget.exposed().value).toBe(42));
      expect(typeof widget.exposed().value).toBe('number');
    });

    test('[RangeSliderV2-ACT-001] setValue(null) publishes zero', async () => {
      widget.render({
        properties: { ...SINGLE, min: binding('{{20}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setValue', null);

      await waitFor(() => expect(widget.exposed().value).toBe(0));
    });

    test('[RangeSliderV2-ACT-002] setRangeValue moves both handles and publishes the pair', async () => {
      const { container } = widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      await widget.act('setRangeValue', 35, 65);

      await waitFor(() => expect(widget.exposed().value).toEqual([35, 65]));
      expect(valueNow(handles(container)[0])).toBe(35);
      expect(valueNow(handles(container)[1])).toBe(65);
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });

    test('[RangeSliderV2-ACT-003] setValue on a range slider publishes a scalar the handles do not show', async () => {
      // CHARACTERIZATION (D-01). Not endorsed: the published value and the
      // rendered control disagree, with no cue to the builder. Pinned so a
      // mode-aware fix reads as a deliberate expectation change.
      const { container } = widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      await widget.act('setValue', 30);

      await waitFor(() => expect(widget.exposed().value).toBe(30));
      expect(handles(container)).toHaveLength(2);
      expect(valueNow(handles(container)[0])).toBe(20);
      expect(valueNow(handles(container)[1])).toBe(70);
    });

    test('[RangeSliderV2-ACT-003] setRangeValue on a single slider publishes a pair behind one handle', async () => {
      // CHARACTERIZATION (D-01), the mirror case.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setRangeValue', 10, 20);

      await waitFor(() => expect(widget.exposed().value).toEqual([10, 20]));
      expect(handles(container)).toHaveLength(1);
      expect(valueNow(handle(container))).toBe(50);
    });

    test('[RangeSliderV2-ACT-003] setValue with non-numeric input publishes NaN', async () => {
      // CHARACTERIZATION (D-03). Flagged to product as the sharpest of the
      // four: NaN spreads through every arithmetic binding downstream.
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setValue', 'abc');

      await waitFor(() => expect(Number.isNaN(widget.exposed().value)).toBe(true));
    });

    test('[RangeSliderV2-ACT-003] setRangeValue does not convert its arguments', async () => {
      // CHARACTERIZATION (D-03): the pair is published verbatim, so a bound
      // comparison compares strings.
      widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      await widget.act('setRangeValue', '10', '20');

      await waitFor(() => expect(widget.exposed().value).toEqual(['10', '20']));
    });

    test('[RangeSliderV2-ACT-004] the state actions update both the flag and the control', async () => {
      const { container } = widget.render({ properties: { ...SINGLE } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(rootEl(container)).toHaveAttribute('aria-disabled', 'true');

      // Loading before visibility: aria-hidden makes the whole subtree
      // inaccessible, so the loader has to be observed while still visible.
      await widget.act('setLoading', true);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(within(container).getByRole('status')).toBeInTheDocument();

      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(rootEl(container)).toHaveAttribute('aria-hidden', 'true');
    });

    test('[RangeSliderV2-ACT-005] reset restores the configured default in both modes, silently', async () => {
      // Break this catches: reset reading stale properties, or starting to
      // fire On change — the contract pins it as the silent path (D-04).
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{40}}') },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));

      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(41));
      await waitFor(() => expect(widget.variables().calls).toBe(1));

      await widget.act('reset');

      await waitFor(() => expect(widget.exposed().value).toBe(40));
      expect(valueNow(handle(container))).toBe(40);
      expect(widget.variables().calls).toBe(1);
    });

    test('[RangeSliderV2-ACT-005] reset uses the current properties, not the mounted ones', async () => {
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{40}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));

      await widget.act('setValue', 90);
      await waitFor(() => expect(widget.exposed().value).toBe(90));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'value', '{{25}}', 'properties');
      });
      await waitFor(() => expect(widget.exposed().value).toBe(25));

      await widget.act('setValue', 90);
      await waitFor(() => expect(widget.exposed().value).toBe(90));

      await widget.act('reset');
      await waitFor(() => expect(widget.exposed().value).toBe(25));
    });

    test('[RangeSliderV2-ACT-005] reset restores both handles of a range slider', async () => {
      widget.render({
        properties: {
          ...RANGE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          startValue: binding('{{20}}'),
          endValue: binding('{{70}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));

      await widget.act('setRangeValue', 5, 95);
      await waitFor(() => expect(widget.exposed().value).toEqual([5, 95]));

      await widget.act('reset');
      await waitFor(() => expect(widget.exposed().value).toEqual([20, 70]));
    });

    test('[RangeSliderV2-ACT-006] a value set by action survives an unrelated re-resolve', async () => {
      // Break this catches: the reset effect gaining a dependency it does not
      // need (or losing its guard), so an unrelated property change silently
      // throws away what the app just set.
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{40}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));

      await widget.act('setValue', 75);
      await waitFor(() => expect(widget.exposed().value).toBe(75));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'label', 'Renamed', 'properties');
      });
      await waitFor(() => expect(widget.exposed().label).toBe('Renamed'));

      expect(widget.exposed().value).toBe(75);
    });

    test('[RangeSliderV2-ACT-006] a no-op rewrite of the default value does not revert the action', async () => {
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{40}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));

      await widget.act('setValue', 75);
      await waitFor(() => expect(widget.exposed().value).toBe(75));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'value', '{{40}}', 'properties');
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().value).toBe(75);
    });

    test('[RangeSliderV2-ACT-006] a genuinely changed default value overrides the action', async () => {
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{40}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(40));

      await widget.act('setValue', 75);
      await waitFor(() => expect(widget.exposed().value).toBe(75));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'value', '{{10}}', 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBe(10));
    });
  });

  describe('state', () => {
    test('[RangeSliderV2-STATE-001] visibility hides the widget from sight and assistive tech', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, visibility: binding('{{false}}') },
      });

      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(rootEl(container)).toHaveAttribute('aria-hidden', 'true');
      expect(rootEl(container)).toHaveStyle({ display: 'none' });
    });

    test('[RangeSliderV2-STATE-002] a disabled slider is out of the Tab order and ignores the keyboard', async () => {
      // Break this catches: reverting the disabled prop on the control (the
      // regression #16909 fixed), which puts a disabled handle back in the Tab
      // order and lets arrow keys change a value the user cannot see is live.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          disabledState: binding('{{true}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      expect(rootEl(container)).toHaveAttribute('aria-disabled', 'true');
      expect(handle(container)).not.toHaveAttribute('tabindex');
      expect(handle(container)).toHaveAttribute('aria-disabled', 'true');

      press(handle(container), 'ArrowRight');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(widget.exposed().value).toBe(50);
    });

    test('[RangeSliderV2-STATE-003] the value actions still work while disabled', async () => {
      // CHARACTERIZATION: no disable guard on the actions, matching Checkbox.
      widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          disabledState: binding('{{true}}'),
        },
        events: countInvocationsOn(RS, 'onChange'),
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      await widget.act('setValue', 20);

      await waitFor(() => expect(widget.exposed().value).toBe(20));
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    });

    test('[RangeSliderV2-STATE-004] state set by action survives an unrelated re-resolve', async () => {
      const { container } = widget.render({ properties: { ...SINGLE } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'label', 'Something else', 'properties');
      });
      await waitFor(() => expect(widget.exposed().label).toBe('Something else'));

      expect(widget.exposed().isDisabled).toBe(true);
      expect(rootEl(container)).toHaveAttribute('aria-disabled', 'true');
    });

    test('[RangeSliderV2-STATE-004] a no-op rewrite of the paired property does not revert it', async () => {
      widget.render({ properties: { ...SINGLE, disabledState: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'disabledState', '{{false}}', 'properties');
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('[RangeSliderV2-STATE-004] a genuinely changed paired property overrides it', async () => {
      const { container } = widget.render({ properties: { ...SINGLE, disabledState: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'disabledState', '{{true}}', 'properties');
      });
      await widget.session.store.act(async () => {
        widget.setComponentProperty(RS, 'disabledState', '{{false}}', 'properties');
      });

      await waitFor(() => expect(rootEl(container)).toHaveAttribute('aria-disabled', 'false'));
    });

    test('[RangeSliderV2-STATE-005] loading replaces the control with the loader', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, loadingState: binding('{{true}}') },
      });

      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(within(container).getByRole('status')).toBeInTheDocument();
      expect(within(container).queryAllByRole('slider')).toHaveLength(0);
      expect(labelEl(container)).toBeNull();
    });

    test('[RangeSliderV2-STATE-005] state actions still write their flags while loading', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, loadingState: binding('{{true}}') },
      });
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

      await widget.act('setDisable', true);

      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(within(container).queryAllByRole('slider')).toHaveLength(0);
    });

    test('[RangeSliderV2-STATE-006] hiding does not clear the value', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(51));

      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(widget.exposed().value).toBe(51);

      await widget.act('setVisibility', true);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
      expect(widget.exposed().value).toBe(51);
    });
  });

  describe('Form lifecycle', () => {
    test('[RangeSliderV2-FORM-001] clearing the parent Form sends a single slider to its minimum', async () => {
      // Break this catches: clear restoring the configured default instead of
      // emptying, which would make a cleared form look filled in.
      widget.renderInsideForm({
        properties: { ...SINGLE, min: binding('{{10}}'), max: binding('{{100}}'), value: binding('{{60}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(60));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBe(10));
    }, 30000);

    test('[RangeSliderV2-FORM-001] clearing the parent Form collapses a range to both handles at the minimum', async () => {
      // CHARACTERIZATION (D-04): the target is `[min, min]`, not the configured
      // pair and not the full span. Confirmed correct against the house rule
      // that clearing empties a form rather than reloading its defaults.
      widget.renderInsideForm({
        properties: {
          ...RANGE,
          min: binding('{{10}}'),
          max: binding('{{100}}'),
          startValue: binding('{{40}}'),
          endValue: binding('{{80}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([40, 80]));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toEqual([10, 10]));
    }, 30000);

    test('[RangeSliderV2-FORM-002] a slider mounted after a clear does not clear itself', async () => {
      // Break this catches: dropping the mount-time snapshot of the clear
      // signal, which would wipe the default of any widget added to a form
      // that had been cleared earlier in the session.
      widget.renderInsideForm({
        properties: { ...SINGLE, min: binding('{{10}}'), max: binding('{{100}}'), value: binding('{{60}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(60));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });
      await waitFor(() => expect(widget.exposed().value).toBe(10));

      const LATE = 'rs2';
      const late = componentDefinition(LATE, 'rangeslider2', 'RangeSliderV2', {
        ...SINGLE,
        label: binding('Late'),
        min: binding('{{10}}'),
        max: binding('{{100}}'),
        value: binding('{{60}}'),
        visibility: binding('{{true}}'),
        disabledState: binding('{{false}}'),
        loadingState: binding('{{false}}'),
      });
      late.component.parent = FORM;
      await widget.session.store.act(async () => {
        store().addComponentToCurrentPage([late], 'canvas', { saveAfterAction: false });
      });

      // The late arrival keeps its own default; the one present at clear time
      // stays cleared.
      await waitFor(() => expect(widget.exposed(LATE).value).toBe(60));
      expect(widget.exposed().value).toBe(10);
    }, 30000);

    test('[RangeSliderV2-FORM-003] clearing the parent Form fires On change', async () => {
      // RED/GREEN for the one behaviour change in this delivery (D-04): before
      // the fix the clear path published a new value and told nothing, so a
      // dependent query never re-ran after a form reset.
      widget.renderInsideForm({
        properties: { ...SINGLE, min: binding('{{10}}'), max: binding('{{100}}'), value: binding('{{60}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(60));
      widget.setEvents(countInvocationsOn(RS, 'onChange'));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBe(10));
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    }, 30000);

    test('[RangeSliderV2-FORM-003] clearing fires On change once for a range slider too', async () => {
      widget.renderInsideForm({
        properties: {
          ...RANGE,
          min: binding('{{10}}'),
          max: binding('{{100}}'),
          startValue: binding('{{40}}'),
          endValue: binding('{{80}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toEqual([40, 80]));
      widget.setEvents(countInvocationsOn(RS, 'onChange'));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toEqual([10, 10]));
      await waitFor(() => expect(widget.variables().calls).toBe(1));
    }, 30000);
  });

  describe('marks', () => {
    test('[RangeSliderV2-MARK-001] configured marks render, take the marker colour, and drop above the maximum', async () => {
      // Break this catches: the above-max filter going away, which draws marks
      // past the end of the track, or the marker colour no longer being applied.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          schema: binding("{{[{label:'Low',value:10},{label:'High',value:90},{label:'TooFar',value:150}]}}"),
        },
        styles: { markerLabel: binding('rgb(1, 2, 3)') },
      });
      await waitFor(() => expect(markTexts(container).length).toBeGreaterThan(0));

      const labels = markTexts(container).map((el) => el.textContent);
      expect(labels).toEqual(['Low', 'High']);
      expect(labels).not.toContain('TooFar');
      expect(markTexts(container)[0]).toHaveStyle({ color: 'rgb(1, 2, 3)' });
    });

    test('[RangeSliderV2-MARK-001] the first percent sign of every mark label is stripped', async () => {
      // CHARACTERIZATION (D-07). Undocumented, and the shipped default schema
      // labels 25%/50%/75% render as 25/50/75 — which is what makes it look
      // accidental rather than intended. Reported to product; pinned here.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          schema: binding("{{[{label:'25%',value:25},{label:'50% off',value:50}]}}"),
        },
      });
      await waitFor(() => expect(markTexts(container)).toHaveLength(2));

      expect(markTexts(container).map((el) => el.textContent)).toEqual(['25', '50 off']);
    });

    test.each([
      ['a non-array', '{{"nonsense"}}'],
      ['a list of non-objects', '{{[1, 2, 3]}}'],
      ['entries missing a label', '{{[{value: 10}]}}'],
      ['entries missing a value', "{{[{label: 'Orphan'}]}}"],
      ['a non-numeric value', "{{[{label: 'Bad', value: 'abc'}]}}"],
      ['a null entry', '{{[null]}}'],
    ])('[RangeSliderV2-MARK-002] a malformed marks list (%s) never breaks the widget', async (_label, schema) => {
      // Break this catches: losing the hardening added in c5c5e1a65f, where a
      // malformed schema took the whole widget down rather than being skipped.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          schema: binding(schema),
        },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(50));
      expect(handles(container)).toHaveLength(1);
      expect(markTexts(container)).toHaveLength(0);

      press(handle(container), 'ArrowRight');
      await waitFor(() => expect(widget.exposed().value).toBe(51));
    });

    test('[RangeSliderV2-MARK-002] well-formed marks still render alongside malformed ones', async () => {
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{50}}'),
          schema: binding("{{[{label:'Good',value:20}, null, {value:30}, {label:'Fine',value:80}]}}"),
        },
      });
      await waitFor(() => expect(markTexts(container)).toHaveLength(2));

      expect(markTexts(container).map((el) => el.textContent)).toEqual(['Good', 'Fine']);
    });
  });

  describe('exposed surface', () => {
    test('[RangeSliderV2-EXP-001] the widget publishes its documented variables and actions', async () => {
      widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      const exposed = widget.exposed();
      expect(exposed.label).toBe('Budget');
      expect(exposed.isVisible).toBe(true);
      expect(exposed.isDisabled).toBe(false);
      expect(exposed.isLoading).toBe(false);

      for (const action of ['setValue', 'setRangeValue', 'reset', 'setVisibility', 'setDisable', 'setLoading']) {
        await waitFor(() => expect(exposedNow()[action]).toBeInstanceOf(Function));
      }

      function exposedNow() {
        return widget.exposed();
      }
    });
  });

  describe('styles', () => {
    test('[RangeSliderV2-STY-001] the documented slider colours reach the control', async () => {
      // Break this catches: a colour setting quietly stopping at the inspector
      // — the builder picks a brand colour and the slider keeps the old one,
      // which nothing else in the suite would notice.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{0}}'), max: binding('{{100}}'), value: binding('{{50}}') },
        styles: {
          lineColor: binding('rgb(10, 20, 30)'),
          trackColor: binding('rgb(40, 50, 60)'),
          handleColor: binding('rgb(70, 80, 90)'),
          handleBorderColor: binding('rgb(100, 110, 120)'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(50));

      expect(railEl(container)).toHaveStyle({ backgroundColor: 'rgb(10, 20, 30)' });
      expect(trackEl(container)).toHaveStyle({ backgroundColor: 'rgb(40, 50, 60)' });
      expect(handle(container)).toHaveStyle({ backgroundColor: 'rgb(70, 80, 90)' });
      expect(handle(container)).toHaveStyle({ border: '1px solid rgb(100, 110, 120)' });
    });

    test('[RangeSliderV2-STY-001] the box shadow reaches the container', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE },
        styles: { boxShadow: binding('0px 2px 4px 0px rgb(1, 1, 1)') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(rootEl(container)).toHaveStyle({ boxShadow: '0px 2px 4px 0px rgb(1, 1, 1)' });
    });

    test('[RangeSliderV2-STY-002] label colour and font size reach the label', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE },
        styles: { color: binding('rgb(9, 9, 9)'), labelFontSize: binding('{{18}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(labelEl(container)).toHaveStyle({ fontSize: '18px' });
      expect(within(labelEl(container)).getByText('Budget')).toHaveStyle({ color: 'rgb(9, 9, 9)' });
    });

    test('[RangeSliderV2-STY-002] alignment stacks the label above the control', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE },
        styles: { alignment: binding('top') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(rootEl(container)).toHaveStyle({ flexDirection: 'column' });
    });

    test('[RangeSliderV2-STY-002] direction flips which side the label sits on', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE },
        styles: { alignment: binding('side'), direction: binding('right') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(rootEl(container)).toHaveStyle({ flexDirection: 'row-reverse' });
    });

    test('[RangeSliderV2-STY-002] a manual width divides the space, and auto width overrides it', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE },
        styles: {
          alignment: binding('side'),
          auto: binding('{{false}}'),
          width: binding('{{40}}'),
          widthType: binding('ofComponent'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      const sliderBox = handle(container).closest('.rc-slider').parentElement;
      expect(sliderBox).toHaveStyle({ width: '60%' });

      const auto = widget.render({
        properties: { ...SINGLE },
        styles: { alignment: binding('side'), auto: binding('{{true}}'), width: binding('{{40}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());
      const autoBox = handle(auto.container).closest('.rc-slider').parentElement;
      expect(autoBox).toHaveStyle({ width: '100%' });
    });
  });

  describe('accessibility', () => {
    test('[RangeSliderV2-A11Y-001] the handle exposes its bounds, value and state', async () => {
      // Break this catches: the bounds or value not reaching the handle, which
      // leaves a screen reader announcing a slider with no position.
      const { container } = widget.render({
        properties: { ...SINGLE, min: binding('{{5}}'), max: binding('{{55}}'), value: binding('{{25}}') },
      });
      await waitFor(() => expect(widget.exposed().value).toBe(25));

      const el = handle(container);
      expect(el).toHaveAttribute('aria-valuemin', '5');
      expect(el).toHaveAttribute('aria-valuemax', '55');
      expect(el).toHaveAttribute('aria-valuenow', '25');
      expect(el).toHaveAttribute('aria-disabled', 'false');
      expect(el).toHaveAttribute('aria-orientation', 'horizontal');
      expect(el).toHaveAttribute('aria-labelledby', `${RS}-label`);
      expect(labelEl(container)).toHaveAttribute('id', `${RS}-label`);
    });

    test('[RangeSliderV2-A11Y-002] a label squeezed to zero width still names the handle', async () => {
      // Break this catches: removing the fallback added in f29f53034c, which
      // leaves the control with no accessible name at all once the label
      // element stops rendering.
      const { container } = widget.render({
        properties: { ...SINGLE, label: binding('Squeezed') },
        styles: {
          alignment: binding('side'),
          auto: binding('{{false}}'),
          width: binding('{{0}}'),
          widthType: binding('ofComponent'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(labelEl(container)).toBeNull();
      expect(handle(container)).toHaveAttribute('aria-label', 'Squeezed');
    });

    test('[RangeSliderV2-A11Y-002] with auto width the name comes from the label element instead', async () => {
      const { container } = widget.render({
        properties: { ...SINGLE, label: binding('Roomy') },
        styles: { alignment: binding('side'), auto: binding('{{true}}') },
      });
      await waitFor(() => expect(widget.exposed().value).not.toBeUndefined());

      expect(labelEl(container)).toBeInTheDocument();
      expect(handle(container)).not.toHaveAttribute('aria-label');
      expect(handle(container)).toHaveAttribute('aria-labelledby', `${RS}-label`);
    });
  });

  describe('instance isolation', () => {
    test('[RangeSliderV2-ISO-001] two sliders on one page stay independent', async () => {
      // Break this catches: any DOM id or state derived from something other
      // than the instance id — the class of bug that made ListView row 2 route
      // its clicks to row 1.
      const OTHER = 'rs2';
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          label: binding('First'),
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{20}}'),
        },
        extraComponents: {
          [OTHER]: componentDefinition(OTHER, 'rangeslider2', 'RangeSliderV2', {
            ...SINGLE,
            label: binding('Second'),
            min: binding('{{0}}'),
            max: binding('{{100}}'),
            value: binding('{{80}}'),
            visibility: binding('{{true}}'),
            disabledState: binding('{{false}}'),
            loadingState: binding('{{false}}'),
          }),
        },
        also: [{ id: OTHER, componentType: 'RangeSliderV2' }],
      });

      await waitFor(() => expect(widget.exposed(RS).value).toBe(20));
      await waitFor(() => expect(widget.exposed(OTHER).value).toBe(80));

      const all = within(container).getAllByRole('slider');
      expect(all).toHaveLength(2);
      expect(all[0]).toHaveAttribute('aria-labelledby', `${RS}-label`);
      expect(all[1]).toHaveAttribute('aria-labelledby', `${OTHER}-label`);

      press(all[0], 'ArrowRight');

      await waitFor(() => expect(widget.exposed(RS).value).toBe(21));
      expect(widget.exposed(OTHER).value).toBe(80);
    });
  });

  describe('saved-app compatibility', () => {
    test('[RangeSliderV2-COMPAT-001] a definition predating the width settings renders with the registered defaults', async () => {
      // Break this catches: the widget requiring a style key that older saved
      // apps cannot have, which would break every range slider saved before
      // 814feab911 rather than falling back to auto width.
      // A definition saved before 814feab911 carries no auto/width/widthType.
      // Production does not hand that to the widget: lodash.merge backfills the
      // registered defaults when the app loads (appUtils.js:211, and the
      // CSS-class decision log records the same mechanism), which is exactly
      // what componentDefinition() reproduces here. So the saved definition
      // states only pre-feature keys and the widget must come up on the
      // backfilled auto width.
      //
      // Worth knowing if that backfill ever regresses: with the trio genuinely
      // absent the shared Label renders NOTHING (it requires `width > 0 || auto`),
      // so every legacy slider would silently lose its label.
      const { container } = widget.render({
        properties: {
          ...SINGLE,
          label: binding('Legacy'),
          min: binding('{{0}}'),
          max: binding('{{100}}'),
          value: binding('{{35}}'),
        },
        styles: { lineColor: binding('rgb(2, 2, 2)') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe(35));
      expect(within(container).getByText('Legacy')).toBeInTheDocument();
      expect(handles(container)).toHaveLength(1);
      expect(valueNow(handle(container))).toBe(35);
      const sliderBox = handle(container).closest('.rc-slider').parentElement;
      expect(sliderBox).toHaveStyle({ width: '100%' });
    });
  });
});
