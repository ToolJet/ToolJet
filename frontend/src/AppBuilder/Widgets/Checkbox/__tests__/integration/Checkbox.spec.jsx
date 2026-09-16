/**
 * Checkbox: the approved contract in
 * frontend/ee/test/app-builder/widgets/Checkbox/TESTING.md, exercised through
 * the real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Checkbox + OverflowTooltip. Nothing about
 * the widget is mocked.
 *
 * Why the RTL layer: the widget owns its own `checked` state and publishes it,
 * so "what does a click put into `components.checkbox1.value`, and which events
 * ran" can only be answered by driving the real DOM. Three of this widget's four
 * known bugs are event-count bugs — two handlers on nested nodes, and CSAs that
 * fire different event sets for the same state write — so every event assertion
 * here COUNTS fires rather than checking a constant was written.
 *
 * Deliberately NOT duplicated here: the mandatory/customRule validator engine
 * (store-level, validateWidget.spec.js), tooltips and `collapseWhenHidden` /
 * `cssClass` / `padding` (RenderWidget-level, shared by ~50 widgets).
 *
 * Test titles carry their approved scenario ID as a `[Checkbox-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'cb1';
const NAME = 'checkbox1';

/** Baseline is `checkbox.js`'s own `definition`, copied rather than invented. */
const widget = createWidgetHarness({
  componentType: 'Checkbox',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Agree'),
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
    checkboxColor: binding('var(--cc-primary-brand)'),
    uncheckedColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    handleColor: binding('var(--cc-surface1-surface)'),
    alignment: binding('right'),
    boxShadow: binding('0px 0px 0px 0px #00000090'),
    padding: binding('default'),
  },
});

const user = () => widget.session.user;
const root = () => document.querySelector('.checkbox-component');
const row = () => document.querySelector('.checkbox-component > div');
/** The clickable box: the only inline-block div in the widget. */
const box = () => document.querySelector('.checkbox-component div[style*="inline-block"]');
const input = () => document.querySelector('input[type="checkbox"]');
const label = () => document.querySelector('label');
const tick = () => document.querySelector('.icon-tabler-check');
const loader = () => root()?.querySelector('svg:not(.icon-tabler-check)');
const errorText = () => document.querySelector(`[data-cy="${NAME}-invalid-feedback"]`)?.textContent ?? null;
const exposed = (key) => widget.exposed()?.[key];

async function mount(options = {}) {
  widget.render(options);
  await waitFor(() => expect(root()).toBeInTheDocument());
}

/**
 * Counting handlers, not constant writes: `set-custom-variable` with a constant
 * proves at-least-once and passes on a double fire, which is precisely
 * Checkbox-BUG-001. The binding increments, so the assertion is a count.
 */
const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const ALL_EVENTS = [counting('onChange', 'chg'), counting('onCheck', 'chk'), counting('onUnCheck', 'unchk')];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('Checkbox: what renders on load', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-DEF-001] an unchecked checkbox renders its label and publishes value false', async () => {
    // Break this catches: publishing `undefined`/`null` instead of the boolean
    // `false` on mount, so `{{components.checkbox1.value === false}}` breaks.
    await mount({ properties: { label: binding('Accept terms') } });

    expect(label().textContent).toContain('Accept terms');
    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(exposed('label')).toBe('Accept terms');
    expect(tick()).toBeNull();
  });

  test('[Checkbox-DEF-002] a default state of On renders checked and publishes value true', async () => {
    // Break this catches: seeding the widget's state from something other than
    // the resolved `defaultValue`, so a box configured On loads unchecked.
    await mount({ properties: { defaultValue: binding('{{true}}') } });

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(tick()).toBeInTheDocument();
    expect(input()).toBeChecked();
  });

  test('[Checkbox-DEF-003] a mandatory checkbox keeps its asterisk after it is checked', async () => {
    // Break this catches: re-introducing the regression fixed by b2f2ce7213,
    // where the mandatory `*` disappeared as soon as the box was ticked.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isMandatory')).toBe(true));
    expect(label().querySelector('span').textContent).toBe('*');

    await user().click(box());

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(label().querySelector('span').textContent).toBe('*');
  });

  test('[Checkbox-DEF-004] a Default state rebind replaces the state only when the value actually changes', async () => {
    // Break this catches: widening the defaults effect so that ANY re-resolve
    // re-applies the default (a query refresh would discard the user's answer),
    // or dropping it so a deliberately changed Default state never lands.
    await mount();
    await user().click(box());
    await waitFor(() => expect(exposed('value')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '{{false}}', 'properties');
    });
    expect(exposed('value')).toBe(true);

    // An unrelated property re-resolving must not re-apply the default either:
    // the effect is keyed on the default's own value, not on every render.
    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
    });
    expect(exposed('value')).toBe(true);

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '{{true}}', 'properties');
    });
    await waitFor(() => expect(exposed('value')).toBe(true));

    await user().click(box());
    await waitFor(() => expect(exposed('value')).toBe(false));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '{{false}}', 'properties');
    });

    await waitFor(() => expect(exposed('value')).toBe(false));
  });
});

describe('Checkbox: toggling', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-TGL-001] clicking the box checks it, and clicking again unchecks it', async () => {
    // Break this catches: writing the new state from a stale closure, so the
    // second click re-publishes the first value and the box sticks.
    await mount();

    await user().click(box());
    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(tick()).toBeInTheDocument();

    await user().click(box());

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(tick()).toBeNull();
  });

  test('[Checkbox-TGL-002] clicking the label toggles the checkbox too', async () => {
    // Break this catches: breaking the label/input association (`htmlFor`), so
    // the label becomes dead text and only the 18px box is clickable.
    await mount();

    await user().click(label());

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(tick()).toBeInTheDocument();
  });
});

describe('Checkbox: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-EVT-001] On change fires once per click and the handler sees the new value', async () => {
    // Break this catches: a second path into fireEvent('onChange') (a double
    // run per click), or firing before the value is written so the handler
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

    await user().click(box());

    await waitFor(() => expect(fired('chg')).toBe(1));
    expect(store().getVariable('seen', MODULE_ID)).toBe(true);
  });

  test('[Checkbox-EVT-002] the deprecated On check and On uncheck fire on the matching transition', async () => {
    // Break this catches: swapping the two branches, or firing both on every
    // click, which would run a builder's "uncheck" query on a check.
    await mount({ events: ALL_EVENTS });

    await user().click(box());
    await waitFor(() => expect(fired('chk')).toBe(1));
    expect(fired('unchk')).toBe(0);

    await user().click(box());

    await waitFor(() => expect(fired('unchk')).toBe(1));
    expect(fired('chk')).toBe(1);
  });
});

describe('Checkbox: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-ACT-001] `setValue` writes the state and fires only the deprecated pair', async () => {
    // Break this catches: `setValue` silently not publishing `value`, or the
    // event set changing without a contract decision (D-02).
    await mount({ events: ALL_EVENTS });

    await widget.act('setValue', true);

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(tick()).toBeInTheDocument();
    expect(fired('chk')).toBe(1);
    expect(fired('chg')).toBe(0);

    await widget.act('setValue', false);

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(fired('unchk')).toBe(1);
    expect(fired('chg')).toBe(0);
  });

  test('[Checkbox-ACT-002] `setChecked` behaves identically to `setValue`', async () => {
    // Break this catches: the deprecated alias drifting away from `setValue`
    // (a different state write or a different event set).
    await mount({ events: ALL_EVENTS });

    await widget.act('setChecked', true);

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(fired('chk')).toBe(1);
    expect(fired('chg')).toBe(0);
  });

  test('[Checkbox-ACT-003] `toggle` flips the current state and fires only On change', async () => {
    // Break this catches: `toggle` reading a stale `checked` (the second call
    // would re-write the same value), or its event set changing.
    await mount({ events: ALL_EVENTS });

    await widget.act('toggle');
    await waitFor(() => expect(exposed('value')).toBe(true));

    await widget.act('toggle');

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(fired('chg')).toBe(2);
    expect(fired('chk')).toBe(0);
    expect(fired('unchk')).toBe(0);
  });
});

describe('Checkbox: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-VAL-001] a mandatory unchecked box is invalid until it is checked', async () => {
    // Break this catches: adding Checkbox to the store's `optionValueWidgets`
    // list, which would make `false` a legitimate answer and let an unchecked
    // mandatory box pass.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isValid')).toBe(false));

    await user().click(box());

    await waitFor(() => expect(exposed('isValid')).toBe(true));
  });

  test('[Checkbox-VAL-002] a custom validation message is shown once the user has interacted', async () => {
    // Break this catches: rendering the error row without its message, or
    // dropping customRule from the validate() call.
    await mount({
      validation: { customRule: binding(`{{components.${NAME}.value === false && 'Value needs to be checked'}}`) },
    });

    await user().click(box());
    await user().click(box());

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Value needs to be checked');
  });

  test('[Checkbox-VAL-003] the validation error stays hidden until the user interacts', async () => {
    // Break this catches: dropping the `userInteracted` gate, which puts a red
    // "Field cannot be empty" under every mandatory checkbox on app load.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBeNull();

    await user().click(box());
    await user().click(box());

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });
});

describe('Checkbox: inside a Form', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-FORM-001] submitting the Form reveals the error on a checkbox the user never touched', async () => {
    // Break this catches: not subscribing to the Form submit signal, so a
    // mandatory checkbox blocks submission with no visible reason.
    widget.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(root()).toBeInTheDocument());
    expect(errorText()).toBeNull();

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).submitForm();
    });

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });

  test('[Checkbox-FORM-002] clearing the Form unchecks the box and republishes its value', async () => {
    // Break this catches: not subscribing to the Form clear signal, so a
    // "clear" leaves a stale `true` in the payload of the next submission.
    widget.renderInsideForm({ properties: { defaultValue: binding('{{true}}') } });
    await waitFor(() => expect(tick()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(exposed('value')).toBe(false));
    expect(tick()).toBeNull();
  });
});

describe('Checkbox: disabled, loading and visibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-STATE-001] Disable publishes `isDisabled` and marks the control disabled', async () => {
    // Break this catches: publishing the disabled state without marking the
    // DOM (or the reverse), leaving assistive technology and styling out of
    // step with what the app believes.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(input()).toHaveAttribute('aria-disabled', 'true');
    expect(row()).toHaveAttribute('data-disabled', 'true');
  });

  test('[Checkbox-STATE-002] Loading state replaces the checkbox with a loader and publishes `isLoading`', async () => {
    // Break this catches: rendering the loader BESIDE the checkbox instead of
    // instead of it, which would let a user answer a field that is still
    // loading its state.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(input()).toBeNull();
    expect(label()).toBeNull();
    expect(loader()).toBeTruthy();
  });

  test('[Checkbox-STATE-003] Visibility off hides the widget and publishes `isVisible`', async () => {
    // Break this catches: publishing isVisible without hiding the node, which
    // leaves a "hidden" checkbox clickable.
    await mount({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(row()).toHaveStyle({ display: 'none' });
  });

  test('[Checkbox-STATE-004] `setDisable` survives an unrelated re-resolve and a no-op rewrite of `disabledState`', async () => {
    // Break this catches: widening the re-sync effect's dependencies, so any
    // property re-resolve silently reverts a RunJS-set disable.
    await mount();

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    });

    expect(exposed('isDisabled')).toBe(true);
  });

  test('[Checkbox-STATE-005] `setVisibility` survives an unrelated re-resolve and a no-op rewrite of `visibility`', async () => {
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

  test('[Checkbox-STATE-006] `setLoading` survives an unrelated re-resolve and a no-op rewrite of `loadingState`', async () => {
    // Break this catches: the same re-sync effect reverting a RunJS-set loading
    // state, so a spinner disappears mid-query.
    await mount();

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });

    expect(exposed('isLoading')).toBe(true);
    expect(input()).toBeNull();
  });
});

describe('Checkbox: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-STYLE-001] the checked, unchecked and tick colors follow the configured styles', async () => {
    // Break this catches: inverting the checked/unchecked branch, which makes a
    // checked box look unchecked, or drawing the tick in the wrong color.
    await mount({
      styles: {
        checkboxColor: binding('rgb(10, 20, 30)'),
        uncheckedColor: binding('rgb(40, 50, 60)'),
        handleColor: binding('rgb(70, 80, 90)'),
        borderColor: binding('rgb(1, 1, 1)'),
      },
    });

    expect(box().style.backgroundColor).toBe('rgb(40, 50, 60)');
    expect(tick()).toBeNull();

    await user().click(box());

    await waitFor(() => expect(tick()).toBeInTheDocument());
    expect(box().style.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(tick().getAttribute('stroke')).toBe('rgb(70, 80, 90)');
  });

  test('[Checkbox-STYLE-002] the legacy black text and legacy border compatibility shims still apply', async () => {
    // Break this catches: dropping either shim, which restyles every app saved
    // before custom themes — hardcoded black labels that vanish in dark mode,
    // and a visible grey border around every checked box.
    //
    // Both shims replace a literal color with a CSS custom property, and jsdom
    // drops `var(...)` from inline styles, so the observable proof is "the
    // legacy literal is NOT what gets applied". That a NON-legacy color IS
    // applied verbatim is pinned by Checkbox-STYLE-001.
    await mount({ styles: { textColor: binding('#1B1F24'), borderColor: binding('#CCD1D5') } });

    expect(label().parentElement.style.color).not.toBe('rgb(27, 31, 36)');
    expect(box().style.borderColor).not.toBe('rgb(204, 209, 213)');

    await user().click(box());

    await waitFor(() => expect(tick()).toBeInTheDocument());
    expect(box().style.borderColor).toBe('transparent');
  });

  test('[Checkbox-STYLE-003] Alignment places the label on the configured side', async () => {
    // Break this catches: fixing the flex direction while leaving
    // justifyContent (or vice versa), so one alignment renders correctly and
    // the other collapses the gap.
    await mount({ styles: { alignment: binding('right') } });
    expect(row().className).toContain('flex-row');
    expect(row().className).not.toContain('flex-row-reverse');

    await mount({ styles: { alignment: binding('left') } });

    expect(row().className).toContain('flex-row-reverse');
    expect(row()).toHaveStyle({ justifyContent: 'space-between' });
  });
});

describe('Checkbox: accessibility and compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Checkbox-A11Y-001] the control carries its required, invalid and disabled semantics', async () => {
    // Break this catches: dropping the aria attributes or the label/input
    // association, leaving a screen-reader user with an unnamed control that
    // never announces that it is required or in error.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(input()).toHaveAttribute('aria-required', 'true'));
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(label()).toHaveAttribute('for', input().getAttribute('id'));

    await user().click(box());

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'false'));
  });

  test('[Checkbox-COMPAT-001] a definition predating collapseWhenHidden, padding and tooltipFormat still renders and toggles', async () => {
    // Break this catches: reading any of those newer keys as required, which
    // would break every app saved before they existed.
    legacyWidget.setup();
    legacyWidget.render();
    await waitFor(() => expect(root()).toBeInTheDocument());

    await legacyWidget.session.user.click(box());

    await waitFor(() => expect(legacyWidget.exposed()?.value).toBe(true));
    expect(tick()).toBeInTheDocument();
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `collapseWhenHidden`/`padding`/`tooltipFormat`
 * existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'Checkbox',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Agree'),
    defaultValue: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
  defaultStyles: {
    textColor: binding('var(--cc-primary-text)'),
    checkboxColor: binding('var(--cc-primary-brand)'),
    uncheckedColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    handleColor: binding('var(--cc-surface1-surface)'),
    alignment: binding('right'),
  },
});

describe('Checkbox: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-01): the hidden input carries its own onClick AND
  // sits inside the div that carries `handleToggleChange`, so a click on the
  // label runs both handlers. The value lands correctly (both compute the same
  // next state) but the deprecated onCheck/onUnCheck run twice, double-running
  // whatever query a builder wired to them. Fix: drop the input's onClick.
  test.failing('[Checkbox-BUG-001] clicking the label fires the deprecated events exactly once', async () => {
    await mount({ events: ALL_EVENTS });

    await user().click(label());

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(fired('chk')).toBe(1);
  });

  // BUG (unfixed, contract D-02): `setValue`/`setChecked` write the value but
  // never fire onChange, while `toggle` fires onChange and never the deprecated
  // pair — three CSAs, three different event sets for the same state write.
  // Fix: fire onChange from every path that changes the value.
  test.failing('[Checkbox-BUG-002] `setValue` fires On change like every other value change', async () => {
    await mount({ events: ALL_EVENTS });

    await widget.act('setValue', true);

    await waitFor(() => expect(exposed('value')).toBe(true));
    expect(fired('chg')).toBe(1);
  });

  // BUG (unfixed, contract D-03): the only input is `display: none`, so it can
  // never be focused, and the clickable wrapper is a plain div with no
  // tabIndex/role/key handler. A keyboard-only user cannot answer a mandatory
  // checkbox at all. Fix: visually hide the input instead of display:none, or
  // give the wrapper role="checkbox" + tabIndex + a key handler.
  test.failing('[Checkbox-BUG-003] the checkbox can be reached and toggled with the keyboard', async () => {
    await mount();

    await user().tab();
    await user().keyboard('{ }');

    await waitFor(() => expect(exposed('value')).toBe(true));
  });

  // BUG (unfixed, contract D-06): `disable` only reaches `data-disabled` and
  // `aria-disabled`; the wrapper's onClick is not gated on it, so a disabled
  // checkbox still toggles and publishes the new value. Fix: return early from
  // handleToggleChange while disabled.
  test.failing('[Checkbox-BUG-004] a disabled checkbox does not change when clicked', async () => {
    await mount({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    await user().click(box());

    expect(exposed('value')).toBe(false);
    expect(tick()).toBeNull();
  });
});
