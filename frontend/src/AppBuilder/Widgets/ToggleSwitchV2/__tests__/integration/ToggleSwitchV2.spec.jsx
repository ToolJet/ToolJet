/**
 * ToggleSwitchV2: the approved contract in
 * frontend/ee/test/app-builder/widgets/ToggleSwitchV2/TESTING.md, exercised
 * through the real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real ToggleSwitchV2 + OverflowTooltip. Nothing
 * about the widget is mocked.
 *
 * Why the RTL layer: the widget owns its `on` state and there are THREE entry
 * points into it (the switch body's click handler, the input's own
 * click/change handlers reached via the label, and the keyboard), two of which
 * write the state through different functions — only one of which recomputes
 * validity. Which handler ran, how often, and what it left behind is only
 * answerable by driving the real DOM, so every event assertion here COUNTS
 * fires rather than checking that a constant was written.
 *
 * Deliberately NOT duplicated here: the mandatory/customRule validator engine
 * (store-level, validateWidget.spec.js), tooltips and `collapseWhenHidden` /
 * `cssClass` / `padding` (RenderWidget-level, shared by ~50 widgets).
 *
 * Test titles carry their approved scenario ID as a `[ToggleSwitchV2-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tg1';
const NAME = 'toggleswitch1';

/** Baseline is `toggleswitchv2.js`'s own `definition`, copied rather than invented. */
const widget = createWidgetHarness({
  componentType: 'ToggleSwitchV2',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Enable notifications'),
    defaultValue: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    textColor: binding('var(--cc-primary-text)'),
    toggleSwitchColor: binding('var(--cc-primary-brand)'),
    uncheckedColor: binding('var(--cc-surface3-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    handleColor: binding('var(--cc-surface1-surface)'),
    alignment: binding('right'),
    boxShadow: binding('0px 0px 0px 0px #00000090'),
    padding: binding('default'),
  },
});

const user = () => widget.session.user;
const row = () => document.querySelector('[data-cy="toggleswitch1"]');
/** The clickable switch body. */
const switchBody = () => document.querySelector('div[style*="inline-block"]');
const input = () => document.querySelector('input[type="checkbox"]');
const label = () => document.querySelector('label');
const track = () => switchBody()?.querySelector('span');
const handle = () => track()?.querySelector('span');
const loader = () => row()?.querySelector('svg');
const errorText = () => document.querySelector(`[data-cy="${NAME}-invalid-feedback"]`)?.textContent ?? null;
const exposed = (key) => widget.exposed()?.[key];

async function mount(options = {}) {
  widget.render(options);
  await waitFor(() => expect(row()).toBeInTheDocument());
}

/**
 * Counting handlers, not constant writes: this widget reaches `fireEvent`
 * from two handlers for a single label click, and a constant write proves
 * at-least-once — it would pass on the double fire that is
 * ToggleSwitchV2-BUG-001.
 */
const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const ON_CHANGE = [counting('onChange', 'chg')];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('ToggleSwitchV2: what renders on load', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-DEF-001] an off switch renders its label and publishes value false', async () => {
    // Break this catches: publishing `undefined`/`null` instead of the boolean
    // `false` on mount, so `{{components.toggleswitch1.value === false}}` breaks.
    await mount({ properties: { label: binding('Send emails') } });

    expect(label().textContent).toContain('Send emails');
    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(exposed('label')).toBe('Send emails');
    expect(input()).not.toBeChecked();
  });

  test('[ToggleSwitchV2-DEF-002] a Default state of On loads switched on and publishes value true', async () => {
    // Break this catches: seeding the widget's state from something other than
    // the resolved `defaultValue`, so a switch configured On loads off.
    await mount({ properties: { defaultValue: binding('{{true}}') } });

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();
  });

  test('[ToggleSwitchV2-DEF-003] a mandatory switch shows its asterisk and publishes `isMandatory`', async () => {
    // Break this catches: dropping the mandatory marker, so a user has no way
    // to know which switch is blocking a Form submission.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isMandatory')).toBe(true));
    expect(row().textContent).toContain('*');
  });

  test('[ToggleSwitchV2-DEF-004] a Default state rebind replaces the state only when the value actually changes', async () => {
    // Break this catches: widening the defaults effect so ANY re-resolve
    // re-applies the default (a query refresh would discard the user's answer),
    // or dropping it so a deliberately changed Default state never lands.
    await mount({ properties: { defaultValue: binding('{{true}}') } });
    await waitFor(() => expect(exposed('value')).toBe(true));

    // The user turns it off.
    await user().click(switchBody());
    await waitFor(() => expect(exposed('value')).toBe(false));

    // An unrelated property re-resolving leaves the user's answer alone...
    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
    });
    expect(exposed('value')).toBe(false);

    // ...and so does a rewrite of Default state to a value it already resolved
    // to earlier in this session but that the user has since changed.
    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '{{false}}', 'properties');
    });
    expect(exposed('value')).toBe(false);

    // A genuine change of Default state is a builder instruction and wins.
    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '{{true}}', 'properties');
    });

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();
  });
});

describe('ToggleSwitchV2: toggling', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-TGL-001] clicking the switch turns it on, and clicking again turns it off', async () => {
    // Break this catches: writing the new state from a stale closure, so the
    // second click re-publishes the first value and the switch sticks.
    await mount();

    await user().click(switchBody());
    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();

    await user().click(switchBody());

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(input()).not.toBeChecked();
  });

  test('[ToggleSwitchV2-TGL-002] clicking the label toggles the switch as well', async () => {
    // Break this catches: breaking the label/input association (`htmlFor`), so
    // the label becomes dead text and only the 28px switch is clickable.
    await mount();

    await user().click(label());

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();
  });

  test('[ToggleSwitchV2-TGL-003] every interaction path leaves the value, the rendering and the validity in agreement', async () => {
    // Break this catches: letting the input's own onChange (which writes ONLY
    // the exposed value, without touching the widget state or re-validating)
    // be the last writer — `value` would then disagree with what is rendered,
    // and `isValid` would describe the previous state.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await user().click(switchBody());
    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input().checked).toBe(true);
    expect(exposed('isValid')).toBe(true);

    await user().click(label());
    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(input().checked).toBe(false);
    expect(exposed('isValid')).toBe(false);

    input().focus();
    await user().keyboard('{ }');

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input().checked).toBe(true);
    expect(exposed('isValid')).toBe(true);
  });
});

describe('ToggleSwitchV2: keyboard', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-KEY-001] Tab reaches the switch and Space toggles it', async () => {
    // Break this catches: hiding the input with `display: none` (as the sibling
    // Checkbox does), which takes the control out of the tab order entirely.
    await mount();

    await user().tab();
    expect(document.activeElement).toBe(input());

    await user().keyboard('{ }');

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();
  });

  test('[ToggleSwitchV2-KEY-002] a disabled switch cannot be reached or toggled with the keyboard', async () => {
    // Break this catches: re-introducing the regression 4f159069c7 fixed —
    // a disabled component that still accepts Tab and keyboard input.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    await user().tab();
    expect(document.activeElement).not.toBe(input());

    await user().keyboard('{ }');

    expect(exposed('value')).toBe(false);
  });
});

describe('ToggleSwitchV2: events and actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-EVT-001] On change fires once per click on the switch and the handler sees the new value', async () => {
    // Break this catches: a second path into fireEvent('onChange') on the
    // switch-body click, or firing before the value is written so the handler
    // reads the previous state.
    await mount({
      events: [
        counting('onChange', 'chg'),
        {
          id: 'evt-seen',
          index: 1,
          sourceId: ID,
          name: 'evt-seen',
          target: 'component',
          event: {
            eventId: 'onChange',
            actionId: 'set-custom-variable',
            key: 'seen',
            value: `{{components.${NAME}.value}}`,
          },
        },
      ],
    });

    await user().click(switchBody());

    await waitFor(() => expect(fired('chg')).toBe(1));
    expect(store().getVariable('seen', MODULE_ID)).toBe(true);
  });

  test('[ToggleSwitchV2-ACT-001] `setValue` writes the state and fires no event', async () => {
    // Break this catches: `setValue` silently not publishing `value`, or
    // gaining an onChange fire that would double-run handlers for apps that
    // call it from inside their own On change handler.
    await mount({ events: ON_CHANGE });

    await widget.act('setValue', true);

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(input()).toBeChecked();
    expect(fired('chg')).toBe(0);

    await widget.act('setValue', false);

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(fired('chg')).toBe(0);
  });

  test('[ToggleSwitchV2-ACT-002] `toggle` flips the current state and fires On change', async () => {
    // Break this catches: `toggle` reading a stale `on` (the second call would
    // re-write the same value), or losing its onChange fire.
    await mount({ events: ON_CHANGE });

    await widget.act('toggle');
    await waitFor(() => expect(exposed('value')).toBe(true));

    await widget.act('toggle');

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(fired('chg')).toBe(2);
  });
});

describe('ToggleSwitchV2: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-VAL-001] a mandatory switch that is off is invalid until it is turned on', async () => {
    // Break this catches: adding this widget to the store's
    // `optionValueWidgets` list, which would make `false` a legitimate answer
    // and let an off mandatory switch pass.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isValid')).toBe(false));

    await user().click(switchBody());

    await waitFor(() => expect(exposed('isValid')).toBe(true));
  });

  test('[ToggleSwitchV2-VAL-002] a custom validation message is shown once the user has interacted', async () => {
    // Break this catches: rendering the error row without its message, or
    // dropping customRule from the validate() call.
    await mount({
      validation: { customRule: binding(`{{components.${NAME}.value === false && 'Value needs to be checked'}}`) },
    });

    await user().click(switchBody());
    await user().click(switchBody());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Value needs to be checked');
  });

  test('[ToggleSwitchV2-VAL-003] the validation error stays hidden until the user interacts', async () => {
    // Break this catches: dropping the `userInteracted` gate, which puts a red
    // "Field cannot be empty" under every mandatory switch on app load.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBeNull();

    await user().click(switchBody());
    await user().click(switchBody());

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });
});

describe('ToggleSwitchV2: inside a Form', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-FORM-001] submitting the Form reveals the error on a switch the user never touched', async () => {
    // Break this catches: not subscribing to the Form submit signal, so a
    // mandatory switch blocks submission with no visible reason.
    widget.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(row()).toBeInTheDocument());
    expect(errorText()).toBeNull();

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).submitForm();
    });

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });

  test('[ToggleSwitchV2-FORM-002] clearing the Form switches off and republishes the value', async () => {
    // Break this catches: not subscribing to the Form clear signal, so a
    // "clear" leaves a stale `true` in the payload of the next submission.
    widget.renderInsideForm({ properties: { defaultValue: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeChecked());

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(input()).not.toBeChecked();
  });
});

describe('ToggleSwitchV2: disabled, loading and visibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-STATE-001] Disable publishes `isDisabled` and disables the control', async () => {
    // Break this catches: publishing the disabled state without applying it to
    // the input, which is what keeps the keyboard path blocked.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[ToggleSwitchV2-STATE-002] Loading state replaces the switch with a loader and publishes `isLoading`', async () => {
    // Break this catches: rendering the loader BESIDE the switch instead of
    // instead of it, which would let a user answer a field that is still
    // loading its state.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(input()).toBeNull();
    expect(label()).toBeNull();
    expect(loader()).toBeTruthy();
  });

  test('[ToggleSwitchV2-STATE-003] Visibility off hides the widget and publishes `isVisible`', async () => {
    // Break this catches: publishing isVisible without hiding the node, which
    // leaves a "hidden" switch clickable.
    await mount({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(row()).toHaveStyle({ display: 'none' });
  });

  test('[ToggleSwitchV2-STATE-004] `setDisable` survives an unrelated re-resolve and a no-op rewrite of `disabledState`', async () => {
    // Break this catches: widening the re-sync effect's dependencies, so any
    // property re-resolve silently reverts a RunJS-set disable and re-opens a
    // control an app deliberately locked.
    await mount();

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(input()).toBeDisabled();

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    });

    expect(exposed('isDisabled')).toBe(true);
    expect(input()).toBeDisabled();
  });

  test('[ToggleSwitchV2-STATE-005] `setVisibility` survives an unrelated re-resolve and a no-op rewrite of `visibility`', async () => {
    // Break this catches: the same re-sync effect reverting a RunJS-set
    // visibility when an unrelated property changes.
    await mount();

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    });

    expect(exposed('isVisible')).toBe(false);
    expect(row()).toHaveStyle({ display: 'none' });
  });

  test('[ToggleSwitchV2-STATE-006] `setLoading` survives an unrelated re-resolve and a no-op rewrite of `loadingState`', async () => {
    // Break this catches: the same re-sync effect reverting a RunJS-set loading
    // state, so a spinner disappears mid-query.
    await mount();

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(loader()).toBeTruthy();

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });

    expect(exposed('isLoading')).toBe(true);
    expect(input()).toBeNull();
  });
});

describe('ToggleSwitchV2: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-STYLE-001] the checked, unchecked, handle and border colors follow the configured styles', async () => {
    // Break this catches: inverting the on/off branch, which makes an on switch
    // look off, or dropping the handle/border colors so a themed switch renders
    // with defaults.
    await mount({
      styles: {
        toggleSwitchColor: binding('rgb(10, 20, 30)'),
        uncheckedColor: binding('rgb(40, 50, 60)'),
        handleColor: binding('rgb(70, 80, 90)'),
        borderColor: binding('rgb(1, 2, 3)'),
      },
    });

    expect(track().style.backgroundColor).toBe('rgb(40, 50, 60)');
    expect(handle().style.backgroundColor).toBe('rgb(70, 80, 90)');
    expect(track().style.outline).toContain('rgb(1, 2, 3)');

    await user().click(switchBody());

    await waitFor(() => expect(track().style.backgroundColor).toBe('rgb(10, 20, 30)'));
  });

  test('[ToggleSwitchV2-STYLE-002] the legacy black text shim still applies', async () => {
    // Break this catches: dropping the shim, which leaves every app saved
    // before custom themes with a hardcoded black label that disappears in dark
    // mode.
    //
    // The shim replaces the literal with a CSS custom property and jsdom drops
    // `var(...)` from inline styles, so the observable proof is "the legacy
    // literal is NOT what gets applied", while a non-legacy color IS.
    await mount({ styles: { textColor: binding('rgb(18, 52, 86)') } });
    expect(label().parentElement.style.color).toBe('rgb(18, 52, 86)');

    await mount({ styles: { textColor: binding('#1B1F24') } });

    expect(label().parentElement.style.color).not.toBe('rgb(27, 31, 36)');
  });

  test('[ToggleSwitchV2-STYLE-003] Alignment places the label on the configured side', async () => {
    // Break this catches: flipping the alignment mapping (it is already
    // inverted relative to the sibling Checkbox), which silently swaps the
    // layout of every existing app.
    await mount({ styles: { alignment: binding('right') } });
    expect(row().className).toContain('flex-row-reverse');

    await mount({ styles: { alignment: binding('left') } });

    expect(row().className).toContain('flex-row');
    expect(row().className).not.toContain('flex-row-reverse');
    expect(row()).toHaveStyle({ justifyContent: 'space-between' });
  });
});

describe('ToggleSwitchV2: accessibility and compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ToggleSwitchV2-A11Y-001] the control carries its required, invalid and disabled semantics', async () => {
    // Break this catches: dropping the aria attributes or the label/input
    // association, leaving a screen-reader user with an unnamed control that
    // never announces that it is required or in error.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(input()).toHaveAttribute('aria-required', 'true'));
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(label()).toHaveAttribute('for', input().getAttribute('id'));

    await user().click(switchBody());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'false'));
  });

  test('[ToggleSwitchV2-COMPAT-001] a definition predating collapseWhenHidden, padding and tooltipFormat still renders and toggles', async () => {
    // Break this catches: reading any of those newer keys as required, which
    // would break every app saved before they existed.
    legacyWidget.setup();
    legacyWidget.render();
    await waitFor(() => expect(row()).toBeInTheDocument());

    await legacyWidget.session.user.click(switchBody());

    await waitFor(() => expect(legacyWidget.exposed()?.value).toBe(true));
    expect(input()).toBeChecked();
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `collapseWhenHidden`/`padding`/`tooltipFormat`
 * existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'ToggleSwitchV2',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Enable notifications'),
    defaultValue: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
  defaultStyles: {
    textColor: binding('var(--cc-primary-text)'),
    toggleSwitchColor: binding('var(--cc-primary-brand)'),
    uncheckedColor: binding('var(--cc-surface3-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    handleColor: binding('var(--cc-surface1-surface)'),
    alignment: binding('right'),
  },
});

describe('ToggleSwitchV2: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-01): the input carries its own onClick AND
  // onChange, and sits inside the div that carries handleToggleChange. A click
  // on the label — or Space on the focused input — runs both, so fireEvent
  // ('onChange') runs twice and a builder's On change query runs twice. Only a
  // click on the switch body fires once. Fix: let one handler own the toggle.
  test.failing('[ToggleSwitchV2-BUG-001] one interaction fires On change exactly once', async () => {
    await mount({ events: ON_CHANGE });

    await user().click(label());

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(fired('chg')).toBe(1);
  });

  // BUG (unfixed, contract D-03): `disabled` reaches the input, so the label
  // and keyboard paths are correctly blocked, but the switch body's wrapper
  // onClick is not gated on `disable` — clicking the switch itself still flips
  // it. Fix: return early from handleToggleChange while disabled.
  test.failing('[ToggleSwitchV2-BUG-002] a disabled switch does not change when its body is clicked', async () => {
    await mount({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    await user().click(switchBody());

    expect(exposed('value')).toBe(false);
    expect(input()).not.toBeChecked();
  });
});
