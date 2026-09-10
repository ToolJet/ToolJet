import { screen, waitFor } from '@testing-library/react';
import moment from 'moment-timezone';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for DatetimePickerV2 (display name "Date Time Picker").
// Contract: frontend/ee/test/app-builder/widgets/DatetimePickerV2/TESTING.md.
// DatetimePickerV2 is the UNION of DatePickerV2 + TimePicker plus a timezone layer.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.

const ID = 'datetimepicker1';

const defaultProperties = {
  label: binding('Label'),
  defaultValue: binding('01/01/2022'),
  placeholder: binding('Select date and time'),
  dateFormat: binding('DD/MM/YYYY'),
  timeFormat: binding('HH:mm'),
  isTimezoneEnabled: binding('{{false}}'),
  displayTimezone: binding('UTC'),
  storeTimezone: binding('UTC'),
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
  minTime: binding(''),
  maxTime: binding(''),
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
  icon: binding('IconCalendarTime'),
  iconVisibility: binding('{{true}}'),
  iconDirection: binding('left'),
  fieldBorderRadius: binding('{{6}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
  iconColor: binding('var(--cc-default-icon)'),
  widthType: binding('ofComponent'),
};

const widget = createWidgetHarness({
  componentType: 'DatetimePickerV2',
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

const tzEnabled = { properties: { isTimezoneEnabled: binding('{{true}}') } };

describe('DatetimePickerV2 widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[DatetimePickerV2-VALUE-001] mount publishes deterministic date/time variables + formats', async () => {
    // Break this catches: not seeding the mount date variables
    // (DatetimePickerV2.jsx:285-305), so apps read empty datetime state on load.
    widget.render({});

    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));
    expect(exposed().selectedTime).toBe('00:00');
    expect(exposed().displayValue).toBe('01/01/2022 00:00');
    expect(exposed().dateFormat).toBe('DD/MM/YYYY');
    expect(exposed().timeFormat).toBe('HH:mm');
    expect(typeof exposed().unixTimestamp).toBe('number');
  });

  test('[DatetimePickerV2-VALUE-002] mount publishes value as an ISO-shaped string (timezone disabled)', async () => {
    // Break this catches: not exposing `value` on mount (DatetimePickerV2.jsx:285-305),
    // so `{{datetimepicker1.value}}` is empty until the first change.
    widget.render({});

    await waitFor(() => expect(typeof exposed().value).toBe('string'));
    expect(exposed().value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('[DatetimePickerV2-VALUE-003] timezone-enabled + storeTimezone=UTC pins value exactly', async () => {
    // Break this catches: value not honoring storeTimezone (DatetimePickerV2.jsx:198-204),
    // so a UTC-stored datetime no longer serializes at a fixed +00:00 offset.
    widget.render(tzEnabled);

    await waitFor(() => expect(exposed().value).toMatch(/^2022-01-01T00:00:00/));
    expect(exposed().value).toMatch(/(Z|\+00:00)$/);
  });

  test('[DatetimePickerV2-VAR-001] mount publishes isVisible/isDisabled/isLoading/isMandatory/label + min/max', async () => {
    // Break this catches: the hooks not publishing the runtime-only state
    // variables on mount (useDatetimeInput.js:72-79); config declares only value.
    widget.render({});

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().isLoading).toBe(false);
    expect(exposed().isMandatory).toBe(false);
    expect(exposed().label).toBe('Label');
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  test('[DatetimePickerV2-TZ-001] mount publishes storeTimezone/displayTimezone = moment.tz.guess() (tz disabled)', async () => {
    // Break this catches: not falling back to moment.tz.guess() when timezone is
    // disabled (DatetimePickerV2.jsx:117-123,285-305), leaking the raw 'UTC' prop.
    widget.render({});

    await waitFor(() => expect(exposed().storeTimezone).toBe(moment.tz.guess()));
    expect(exposed().displayTimezone).toBe(moment.tz.guess());
  });

  test('[DatetimePickerV2-BIND-001] a defaultValue binding change re-inits value WITHOUT firing onSelect', async () => {
    // Break this catches: firing onSelect on a defaultValue rebind - the
    // skipFireEvent=true flag (DatetimePickerV2.jsx:246-248); regression edd6fb3054.
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '02/02/2022', 'properties');
    });

    await waitFor(() => expect(exposed().selectedDate).toBe('02/02/2022'));
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DatetimePickerV2-CSA-001] setValue updates the value and fires onSelect once', async () => {
    // Break this catches: setValue not updating value / not firing onSelect
    // (DatetimePickerV2.jsx:157-171,306-308).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setValue).toBeInstanceOf(Function));

    await widget.act('setValue', '15/06/2023 10:30', 'DD/MM/YYYY HH:mm');

    await waitFor(() => expect(exposed().selectedDate).toBe('15/06/2023'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatetimePickerV2-CSA-002] clearValue empties the value and fires onSelect', async () => {
    // Break this catches: clearValue not clearing the value (DatetimePickerV2.jsx:309-311).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearValue).toBeInstanceOf(Function));

    await widget.act('clearValue');

    await waitFor(() => expect(exposed().selectedDate).toBeNull());
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatetimePickerV2-CSA-003] setValueInTimestamp sets the value from the exposed ISO value', async () => {
    // Break this catches: setValueInTimestamp not routing through setInputValue
    // (DatetimePickerV2.jsx:312-314). NB: the runtime round-trips the ISO `value`
    // string (moment(date) via the `.includes('T')` path), NOT a raw unix number -
    // getUnixTimeFromParsedDate lacks DatePickerV2's numeric fast-path.
    widget.render({});
    await waitFor(() => expect(exposed().setValueInTimestamp).toBeInstanceOf(Function));
    const mountValue = exposed().value;

    await widget.act('clearValue');
    await waitFor(() => expect(exposed().selectedDate).toBeNull());
    await widget.act('setValueInTimestamp', mountValue);

    await waitFor(() => expect(exposed().selectedDate).toBe('01/01/2022'));
  });

  test('[DatetimePickerV2-CSA-004] setDate updates the date part and fires onSelect once', async () => {
    // Break this catches: setDate not updating the date / not firing onSelect
    // (DatetimePickerV2.jsx:315-333).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setDate).toBeInstanceOf(Function));

    await widget.act('setDate', '20/07/2023', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().selectedDate).toBe('20/07/2023'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatetimePickerV2-CSA-005] setTime updates the time part and fires onSelect once', async () => {
    // Break this catches: setTime not updating the time / not firing onSelect
    // (DatetimePickerV2.jsx:334-352).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setTime).toBeInstanceOf(Function));

    await widget.act('setTime', '08:45', 'HH:mm');

    await waitFor(() => expect(exposed().selectedTime).toBe('08:45'));
    expect(widget.variables().onSelectCount).toBe(1);
  });

  test('[DatetimePickerV2-CSA-006] setMinDate publishes minDate and recomputes isValid', async () => {
    // Break this catches: setMinDate not exposing minDate / not recomputing
    // isValid (useDateInput.js:39-47 -> DatetimePickerV2.jsx:389-412).
    widget.render({});
    await waitFor(() => expect(exposed().setMinDate).toBeInstanceOf(Function));

    await widget.act('setMinDate', '02/01/2022');

    await waitFor(() => expect(exposed().minDate).toBe('02/01/2022'));
    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-CSA-007] setDisabledDates/clearDisabledDates recompute isValid', async () => {
    // Break this catches: set/clearDisabledDates not updating excludedDates ->
    // isValid (useDateInput.js:55-70 -> DatetimePickerV2.jsx:389-412).
    widget.render({});
    await waitFor(() => expect(exposed().setDisabledDates).toBeInstanceOf(Function));

    await widget.act('setDisabledDates', ['01/01/2022']);
    await waitFor(() => expect(exposed().isValid).toBe(false));

    await widget.act('clearDisabledDates');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[DatetimePickerV2-CSA-008] setMinTime publishes minTime and recomputes isValid', async () => {
    // Break this catches: setMinTime not exposing minTime / not recomputing
    // isValid (useTimeInput.js:26-32 -> DatetimePickerV2.jsx:389-412).
    widget.render({});
    await waitFor(() => expect(exposed().setMinTime).toBeInstanceOf(Function));

    await widget.act('setMinTime', '01:00');

    await waitFor(() => expect(exposed().minTime).toBe('01:00'));
    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-CSA-009] setDisable publishes isDisabled and disables the input', async () => {
    // Break this catches: setDisable not updating the exposed variable + state
    // (useDatetimeInput.js:93-96 -> DatepickerInput.jsx:84 disabled attr).
    widget.render({});
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(input()).toBeDisabled();
  });

  test('[DatetimePickerV2-CSA-010] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating the exposed variable +
    // state (useDatetimeInput.js:85-88 -> BaseDateComponent.jsx:149 invisible).
    widget.render({});
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DatetimePickerV2-CSA-011] setLoading publishes isLoading and marks the input busy/disabled', async () => {
    // Break this catches: setLoading not updating the exposed variable + state
    // (useDatetimeInput.js:89-92 -> DatepickerInput.jsx:84 aria-busy/disabled).
    widget.render({});
    await waitFor(() => expect(exposed().setLoading).toBeInstanceOf(Function));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DatetimePickerV2-TZ-002] setStoreTimezone publishes storeTimezone and recomputes value (tz enabled)', async () => {
    // Break this catches: setStoreTimezone not mapping the label / not recomputing
    // value (DatetimePickerV2.jsx:360-372; TIMEZONE_OPTIONS_MAP).
    widget.render(tzEnabled);
    await waitFor(() => expect(exposed().setStoreTimezone).toBeInstanceOf(Function));
    const before = exposed().value;

    await widget.act('setStoreTimezone', '+05:30');

    await waitFor(() => expect(exposed().storeTimezone).toBe('Asia/Colombo'));
    expect(exposed().value).not.toBe(before);
  });

  test('[DatetimePickerV2-TZ-003] setDisplayTimezone publishes displayTimezone (tz enabled)', async () => {
    // Break this catches: setDisplayTimezone not mapping the label via
    // TIMEZONE_OPTIONS_MAP (DatetimePickerV2.jsx:373-386).
    widget.render(tzEnabled);
    await waitFor(() => expect(exposed().setDisplayTimezone).toBeInstanceOf(Function));

    await widget.act('setDisplayTimezone', '+05:30');

    await waitFor(() => expect(exposed().displayTimezone).toBe('Asia/Colombo'));
  });

  test('[DatetimePickerV2-TZ-004] the timezone CSA are no-ops when timezone is disabled', async () => {
    // Break this catches: dropping the isTimezoneEnabled gate (DatetimePickerV2.jsx:360-372),
    // so setStoreTimezone would override the machine timezone while tz is off.
    widget.render({});
    await waitFor(() => expect(exposed().setStoreTimezone).toBeInstanceOf(Function));

    await widget.act('setStoreTimezone', '+05:30');

    expect(exposed().storeTimezone).toBe(moment.tz.guess());
  });

  test('[DatetimePickerV2-VALID-001] a mandatory empty field is invalid', async () => {
    // Break this catches: dropping the mandatory check from isDateValid
    // (utils.js isMandatoryValid), so a required empty datetime reports valid.
    widget.render({ properties: { defaultValue: binding('') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-VALID-002] a value earlier than minDate is invalid', async () => {
    // Break this catches: dropping the min-date check (utils.js isMinDateValid).
    widget.render({ validation: { minDate: binding('02/01/2022') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-VALID-003] a value earlier than minTime is invalid', async () => {
    // Break this catches: dropping the min-time check (utils.js isMinTimeValid).
    widget.render({ validation: { minTime: binding('01:00') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-VALID-004] an excluded (disabled) date is invalid', async () => {
    // Break this catches: dropping the excluded-date check (utils.js excludedDates).
    widget.render({ validation: { disabledDates: binding("{{['01/01/2022']}}") } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-VALID-005] a non-empty customRule is invalid', async () => {
    // Break this catches: dropping the customRule check (utils.js isCustomRuleValid).
    widget.render({ validation: { customRule: binding('Not allowed') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DatetimePickerV2-PREC-001] a CSA setDisable survives an unrelated property re-resolve', async () => {
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

  test('[DatetimePickerV2-FORM-001] a Form clear resets the value', async () => {
    // Break this catches: not wiring useFormClear -> setInputValue(null)
    // (DatetimePickerV2.jsx useFormClear), so a Form clear leaves the datetime set.
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

  test('[DatetimePickerV2-STYLE-001] visibility=false applies the invisible class', async () => {
    // Break this catches: dropping the `invisible: !visibility` class mapping
    // (BaseDateComponent.jsx:149), so a hidden picker stays visible.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(wrapper()).toBeInTheDocument());
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DatetimePickerV2-STYLE-002] disabledState sets the input disabled attribute and aria', async () => {
    // Break this catches: dropping `disabled`/`aria-disabled` from the input
    // (DatepickerInput.jsx:74,84), so a disabled picker stays editable.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[DatetimePickerV2-STYLE-003] boxShadow is applied to the input inline style', async () => {
    // Break this catches: not forwarding `boxShadow` to the input inline style
    // (BaseDateComponent.jsx:54-81 -> DatepickerInput.jsx:46).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });

  test('[DatetimePickerV2-STYLE-004] fieldBorderRadius is applied to the input inline style', async () => {
    // Break this catches: not forwarding `fieldBorderRadius` to the input
    // inline border-radius (BaseDateComponent.jsx:54-81 -> DatepickerInput.jsx:46).
    widget.render({ styles: { fieldBorderRadius: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ borderRadius: '10px' });
  });

  test('[DatetimePickerV2-LOAD-001] loadingState marks the input busy and disabled', async () => {
    // Break this catches: not driving `aria-busy`/`disabled` from loading
    // (DatepickerInput.jsx:84), so a loading picker stays interactive.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DatetimePickerV2-CLEAR-001] the clear button shows with a value and hides when disabled', async () => {
    // Break this catches: dropping the shouldShowClearBtn guard
    // (DatepickerInput.jsx:49), so the clear button ignores value/disabled state.
    widget.render({ properties: { showClearBtn: binding('{{true}}') } });

    await waitFor(() => expect(clearBtn()).toBeInTheDocument());

    await widget.act('setDisable', true);
    await waitFor(() => expect(clearBtn()).not.toBeInTheDocument());
  });
});
