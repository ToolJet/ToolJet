import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for TimePicker (display name "Time Picker").
// Contract: frontend/ee/test/app-builder/widgets/TimePicker/TESTING.md.
// TimePicker shares the Widgets/Date/ runtime with DatePickerV2 but is leaner:
// a deterministic string `value` (no timezone) and minTime/maxTime validation.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.

const ID = 'timepicker1';

const defaultProperties = {
  label: binding('Label'),
  defaultValue: binding('00:00'),
  placeholder: binding('Select time'),
  timeFormat: binding('HH:mm'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
  showClearBtn: binding('{{false}}'),
};

const defaultValidation = {
  minTime: binding(''),
  maxTime: binding(''),
  customRule: binding(''),
  mandatory: binding('{{false}}'),
};

const defaultStyles = {
  labelColor: binding('var(--cc-primary-text)'),
  labelFontSize: binding('{{12}}'),
  alignment: binding('side'),
  direction: binding('left'),
  labelWidth: binding('20'),
  auto: binding('{{true}}'),
  fieldBackgroundColor: binding('var(--cc-surface1-surface)'),
  fieldBorderColor: binding('var(--cc-default-border)'),
  accentColor: binding('var(--cc-primary-brand)'),
  selectedTextColor: binding('var(--cc-primary-text)'),
  errTextColor: binding('var(--cc-error-systemStatus)'),
  icon: binding('IconClock'),
  iconVisibility: binding('{{true}}'),
  iconDirection: binding('left'),
  fieldBorderRadius: binding('{{6}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
  iconColor: binding('var(--cc-default-icon)'),
  widthType: binding('ofComponent'),
};

const widget = createWidgetHarness({
  componentType: 'TimePicker',
  handle: ID,
  id: ID,
  defaultProperties,
  defaultValidation,
  defaultStyles,
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const input = () => document.querySelector(`[data-cy="${ID}-input-field"]`);
const wrapper = () => document.querySelector('.datetimepicker-component');
const clearBtn = () => document.querySelector(`[data-cy="${ID}-clear-button"]`);

const onSelectCounter = () =>
  setVariableOn(ID, 'onSelect', { key: 'onSelectCount', value: '{{(variables.onSelectCount ?? 0) + 1}}' });

describe('TimePicker widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[TimePicker-VALUE-001] mount publishes a deterministic value and timeFormat', async () => {
    // Break this catches: not seeding the mount exposed variables
    // (TimePicker.jsx:112-119), so apps read empty time state on load.
    widget.render({});

    await waitFor(() => expect(exposed().value).toBe('00:00'));
    expect(exposed().timeFormat).toBe('HH:mm');
  });

  test('[TimePicker-VAR-001] mount publishes isVisible/isDisabled/isLoading/isMandatory/label', async () => {
    // Break this catches: the shared hook not publishing the runtime-only state
    // variables on mount (useDatetimeInput.js); config declares only value.
    widget.render({});

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().isLoading).toBe(false);
    expect(exposed().isMandatory).toBe(false);
    expect(exposed().label).toBe('Label');
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  test('[TimePicker-BIND-001] a defaultValue binding change re-inits value WITHOUT firing onSelect', async () => {
    // Break this catches: firing onSelect on a defaultValue rebind - the
    // skipFireEvent=true flag (TimePicker.jsx:100-102); regression edd6fb3054.
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().value).toBe('00:00'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '06:30', 'properties');
    });

    await waitFor(() => expect(exposed().value).toBe('06:30'));
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[TimePicker-CSA-001] setValue updates the value and fires onSelect once', async () => {
    // Break this catches: setValue not updating value / not firing onSelect
    // (TimePicker.jsx:60-67,122-126).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setValue).toBeInstanceOf(Function));

    await widget.act('setValue', '10:30', 'HH:mm');

    await waitFor(() => expect(exposed().value).toBe('10:30'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[TimePicker-CSA-002] clearValue empties the value and fires onSelect', async () => {
    // Break this catches: clearValue not clearing the value (TimePicker.jsx:127).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearValue).toBeInstanceOf(Function));

    await widget.act('clearValue');

    await waitFor(() => expect(exposed().value).toBeNull());
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[TimePicker-CSA-003] setMinTime publishes minTime and recomputes isValid', async () => {
    // Break this catches: setMinTime not exposing minTime / not recomputing
    // isValid (useTimeInput.js:26-32 -> TimePicker.jsx:131-133).
    widget.render({});
    await waitFor(() => expect(exposed().setMinTime).toBeInstanceOf(Function));

    await widget.act('setMinTime', '01:00');

    await waitFor(() => expect(exposed().minTime).toBe('01:00'));
    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[TimePicker-CSA-004] setDisable publishes isDisabled and disables the input', async () => {
    // Break this catches: setDisable not updating the exposed variable + state
    // (useDatetimeInput.js -> DatepickerInput.jsx:98 disabled attr).
    widget.render({});
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(input()).toBeDisabled();
  });

  test('[TimePicker-CSA-005] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating the exposed variable +
    // state (useDatetimeInput.js -> BaseDateComponent.jsx:149 invisible).
    widget.render({});
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[TimePicker-CSA-006] setLoading publishes isLoading and marks the input busy/disabled', async () => {
    // Break this catches: setLoading not updating the exposed variable + state
    // (useDatetimeInput.js -> DatepickerInput.jsx:72,98 aria-busy/disabled).
    widget.render({});
    await waitFor(() => expect(exposed().setLoading).toBeInstanceOf(Function));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[TimePicker-VALID-001] a mandatory empty field is invalid', async () => {
    // Break this catches: dropping the mandatory check from isDateValid
    // (utils.js:166), so a required empty time reports valid.
    widget.render({ properties: { defaultValue: binding('') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[TimePicker-VALID-002] a value earlier than minTime is invalid', async () => {
    // Break this catches: dropping the min-time check (utils.js:180-181).
    widget.render({ validation: { minTime: binding('01:00') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[TimePicker-VALID-003] a non-empty customRule is invalid', async () => {
    // Break this catches: dropping the customRule check (utils.js:186).
    widget.render({ validation: { customRule: binding('Time not allowed') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[TimePicker-PREC-001] a CSA setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: re-syncing disabled state from a property on an
    // unrelated re-resolve (useDatetimeInput.js deps), clobbering the CSA.
    widget.render({});
    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed().isDisabled).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'placeholder', 'Changed placeholder', 'properties');
    });

    expect(exposed().isDisabled).toBe(true);
    expect(input()).toBeDisabled();
  });

  test('[TimePicker-FORM-001] a Form clear resets the value', async () => {
    // Break this catches: not wiring useFormClear -> setInputValue(null)
    // (TimePicker.jsx:135), so a Form clear leaves the time set.
    widget.renderInsideForm({ properties: { defaultValue: binding('00:00') } });
    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID)?.value).toBe('00:00'));

    await waitFor(() =>
      expect(store().getExposedValueOfComponent('form1', MODULE_ID)?.clearForm).toBeInstanceOf(Function)
    );
    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID).value).toBeNull());
  });

  test('[TimePicker-STYLE-001] visibility=false applies the invisible class', async () => {
    // Break this catches: dropping the `invisible: !visibility` class mapping
    // (BaseDateComponent.jsx:149), so a hidden picker stays visible.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(wrapper()).toBeInTheDocument());
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[TimePicker-STYLE-002] disabledState sets the input disabled attribute and aria', async () => {
    // Break this catches: dropping `disabled`/`aria-disabled` from the input
    // (DatepickerInput.jsx:71,98), so a disabled picker stays editable.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[TimePicker-STYLE-003] boxShadow is applied to the input inline style', async () => {
    // Break this catches: not forwarding `boxShadow` to the input inline style
    // (BaseDateComponent.jsx:82 -> DatepickerInput.jsx:46).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });

  test('[TimePicker-STYLE-004] fieldBorderRadius is applied to the input inline style', async () => {
    // Break this catches: not forwarding `fieldBorderRadius` to the input
    // inline border-radius (BaseDateComponent.jsx:81 -> DatepickerInput.jsx:46).
    widget.render({ styles: { fieldBorderRadius: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ borderRadius: '10px' });
  });

  test('[TimePicker-LOAD-001] loadingState marks the input busy and disabled', async () => {
    // Break this catches: not driving `aria-busy`/`disabled` from loading
    // (DatepickerInput.jsx:72,98), so a loading picker stays interactive.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[TimePicker-CLEAR-001] the clear button shows with a value and hides when disabled', async () => {
    // Break this catches: dropping the shouldShowClearBtn guard
    // (DatepickerInput.jsx:48-49), so the clear button ignores value/disabled state.
    widget.render({ properties: { showClearBtn: binding('{{true}}') } });

    await waitFor(() => expect(clearBtn()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(clearBtn()).not.toBeInTheDocument());
  });
});
