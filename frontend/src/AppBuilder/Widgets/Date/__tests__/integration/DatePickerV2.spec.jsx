import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for DatePickerV2 (display name "Date Picker").
// Contract: frontend/ee/test/app-builder/widgets/DatePickerV2/TESTING.md.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.

const ID = 'datepicker1';

const defaultProperties = {
  label: binding('Label'),
  defaultValue: binding('01/01/2022'),
  placeholder: binding('Select date'),
  dateFormat: binding('DD/MM/YYYY'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
  showClearBtn: binding('{{false}}'),
};

const defaultValidation = {
  minDate: binding(''),
  maxDate: binding(''),
  disabledDates: binding('{{[]}}'),
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
  icon: binding('IconCalendarEvent'),
  iconVisibility: binding('{{true}}'),
  iconDirection: binding('left'),
  fieldBorderRadius: binding('{{6}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
  iconColor: binding('var(--cc-default-icon)'),
  widthType: binding('ofComponent'),
};

const widget = createWidgetHarness({
  componentType: 'DatePickerV2',
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

describe('DatePickerV2 widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[DatePickerV2-VALUE-001] mount publishes deterministic date variables from defaultValue + format', async () => {
    // Break this catches: not seeding the mount exposed date variables
    // (DatePickerV2.jsx:123-135), so apps read empty date state on load.
    widget.render({});

    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));
    expect(exposed().displayValue).toBe('01/01/2022');
    expect(exposed().dateFormat).toBe('DD/MM/YYYY');
    expect(typeof exposed().unixTimestamp).toBe('number');
  });

  test('[DatePickerV2-VALUE-002] mount publishes value as an ISO-shaped string', async () => {
    // Break this catches: not exposing `value` on mount (DatePickerV2.jsx:125),
    // so `{{datepicker1.value}}` is empty until the first change.
    widget.render({});

    await waitFor(() => expect(typeof exposed().value).toBe('string'));
    expect(exposed().value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('[DatePickerV2-VAR-001] mount publishes isVisible/isDisabled/isLoading/isMandatory/label', async () => {
    // Break this catches: the hooks not publishing the runtime-only state
    // variables on mount (useDatetimeInput.js:71-79); config declares only value.
    widget.render({});

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().isLoading).toBe(false);
    expect(exposed().isMandatory).toBe(false);
    expect(exposed().label).toBe('Label');
  });

  test('[DatePickerV2-CSA-005] setDisable publishes isDisabled and disables the input', async () => {
    // Break this catches: setDisable not updating the exposed variable + state
    // (useDatetimeInput.js:89-92 -> DatepickerInput.jsx:101 disabled attr).
    widget.render({});
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(input()).toBeDisabled();
  });

  test('[DatePickerV2-CSA-006] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating the exposed variable +
    // state (useDatetimeInput.js:81-84 -> BaseDateComponent.jsx:149 invisible).
    widget.render({});
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DatePickerV2-CSA-007] setLoading publishes isLoading and marks the input busy/disabled', async () => {
    // Break this catches: setLoading not updating the exposed variable + state
    // (useDatetimeInput.js:85-88 -> DatepickerInput.jsx:84,101 aria-busy/disabled).
    widget.render({});
    await waitFor(() => expect(exposed().setLoading).toBeInstanceOf(Function));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DatePickerV2-STYLE-001] visibility=false applies the invisible class', async () => {
    // Break this catches: dropping the `invisible: !visibility` class mapping
    // (BaseDateComponent.jsx:149), so a hidden picker stays visible.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(wrapper()).toBeInTheDocument());
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DatePickerV2-STYLE-002] disabledState sets the input disabled attribute and aria', async () => {
    // Break this catches: dropping `disabled`/`aria-disabled` from the input
    // (DatepickerInput.jsx:83,101), so a disabled picker stays editable.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[DatePickerV2-STYLE-003] boxShadow is applied to the input inline style', async () => {
    // Break this catches: not forwarding `boxShadow` to the input inline style
    // (BaseDateComponent.jsx:66 -> DatepickerInput.jsx:46).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });

  test('[DatePickerV2-STYLE-004] fieldBorderRadius is applied to the input inline style', async () => {
    // Break this catches: not forwarding `fieldBorderRadius` to the input
    // inline border-radius (BaseDateComponent.jsx:67 -> DatepickerInput.jsx:46).
    widget.render({ styles: { fieldBorderRadius: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ borderRadius: '10px' });
  });

  test('[DatePickerV2-LOAD-001] loadingState marks the input busy and disabled', async () => {
    // Break this catches: not driving `aria-busy`/`disabled` from loading
    // (DatepickerInput.jsx:84,101), so a loading picker stays interactive.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DatePickerV2-CLEAR-001] the clear button shows with a value and hides when disabled', async () => {
    // Break this catches: dropping the shouldShowClearBtn guard
    // (DatepickerInput.jsx:49), so the clear button ignores value/disabled state.
    widget.render({ properties: { showClearBtn: binding('{{true}}') } });

    await waitFor(() => expect(clearBtn()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(clearBtn()).not.toBeInTheDocument());
  });

  const onSelectCounter = () =>
    setVariableOn(ID, 'onSelect', { key: 'onSelectCount', value: '{{(variables.onSelectCount ?? 0) + 1}}' });

  test('[DatePickerV2-CSA-001] setValue updates the value and fires onSelect once', async () => {
    // Break this catches: setValue not updating value / not firing onSelect
    // (DatePickerV2.jsx:64-71,141).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setValue).toBeInstanceOf(Function));

    await widget.act('setValue', '15/06/2023', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().selectedDate).toBe('15/06/2023'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatePickerV2-CSA-002] clearValue empties the value and fires onSelect', async () => {
    // Break this catches: clearValue not clearing the value (DatePickerV2.jsx:145).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearValue).toBeInstanceOf(Function));

    await widget.act('clearValue');

    await waitFor(() => expect(exposed().selectedDate).toBeNull());
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatePickerV2-CSA-003] setValueInTimestamp sets the value from a unix timestamp', async () => {
    // Break this catches: setValueInTimestamp not routing through setInputValue
    // (DatePickerV2.jsx:148).
    widget.render({});
    await waitFor(() => expect(exposed().setValueInTimestamp).toBeInstanceOf(Function));
    const mountUnix = exposed().unixTimestamp;

    await widget.act('clearValue');
    await waitFor(() => expect(exposed().selectedDate).toBeNull());
    await widget.act('setValueInTimestamp', mountUnix);

    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));
  });

  test('[DatePickerV2-CSA-004] setDate updates the date part and fires onSelect once', async () => {
    // Break this catches: setDate not updating the date / not firing onSelect
    // (DatePickerV2.jsx:151-162).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setDate).toBeInstanceOf(Function));

    await widget.act('setDate', '20/07/2023', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().selectedDate).toBe('20/07/2023'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatePickerV2-CSA-008] setMinDate publishes minDate and recomputes isValid', async () => {
    // Break this catches: setMinDate not exposing minDate / not recomputing
    // isValid (useDateInput.js:40-47 -> DatePickerV2.jsx:167-169).
    widget.render({});
    await waitFor(() => expect(exposed().setMinDate).toBeInstanceOf(Function));

    await widget.act('setMinDate', '02/01/2022');

    await waitFor(() => expect(exposed().minDate).toBe('02/01/2022'));
    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatePickerV2-CSA-009] setDisabledDates/clearDisabledDates recompute isValid', async () => {
    // Break this catches: set/clearDisabledDates not updating excludedDates ->
    // isValid (useDateInput.js:56-67 -> DatePickerV2.jsx:167-169).
    widget.render({});
    await waitFor(() => expect(exposed().setDisabledDates).toBeInstanceOf(Function));

    await widget.act('setDisabledDates', ['01/01/2022']);
    await waitFor(() => expect(exposed().isValid).toBe(false));

    await widget.act('clearDisabledDates');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[DatePickerV2-VALID-001] a mandatory empty field is invalid', async () => {
    // Break this catches: dropping the mandatory check from isDateValid
    // (utils.js:187-189), so a required empty date reports valid.
    widget.render({ properties: { defaultValue: binding('') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatePickerV2-VALID-002] a value earlier than minDate is invalid', async () => {
    // Break this catches: dropping the min-date check (utils.js:119-130).
    widget.render({ validation: { minDate: binding('02/01/2022') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatePickerV2-VALID-003] an excluded (disabled) date is invalid', async () => {
    // Break this catches: dropping the excluded-date check (utils.js:176-178).
    widget.render({ validation: { disabledDates: binding("{{['01/01/2022']}}") } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatePickerV2-VALID-004] a non-empty customRule is invalid', async () => {
    // Break this catches: dropping the customRule check (utils.js:155-159).
    widget.render({ validation: { customRule: binding('Date not allowed') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatePickerV2-PREC-001] a CSA setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: re-syncing disabled state from a property on an
    // unrelated re-resolve (useDatetimeInput.js:38-41 deps), clobbering the CSA.
    widget.render({});
    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed().isDisabled).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'placeholder', 'Changed placeholder', 'properties');
    });

    expect(exposed().isDisabled).toBe(true);
    expect(input()).toBeDisabled();
  });

  test('[DatePickerV2-FORM-001] a Form clear resets the value', async () => {
    // Break this catches: not wiring useFormClear -> setInputValue(null)
    // (DatePickerV2.jsx useFormClear), so a Form clear leaves the date set.
    widget.renderInsideForm({ properties: { defaultValue: binding('01/01/2022') } });
    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID)?.selectedDate).toBe('01/01/2022'));

    await waitFor(() =>
      expect(store().getExposedValueOfComponent('form1', MODULE_ID)?.clearForm).toBeInstanceOf(Function)
    );
    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID).selectedDate).toBeNull());
  });

  test('[DatePickerV2-BIND-001] a defaultValue binding change re-inits value WITHOUT firing onSelect', async () => {
    // Break this catches: firing onSelect on a defaultValue rebind - the
    // skipFireEvent=true flag (DatePickerV2.jsx:107-109); regression edd6fb3054.
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '02/02/2022', 'properties');
    });

    await waitFor(() => expect(exposed().selectedDate).toBe('02/02/2022'));
    expect(widget.variables().onSelectCount).toBeUndefined();
  });
});
