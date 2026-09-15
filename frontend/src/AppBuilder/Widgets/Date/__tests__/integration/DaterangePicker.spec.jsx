import { waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for DaterangePicker (display name "Date Range Picker").
// Contract: frontend/ee/test/app-builder/widgets/DaterangePicker/TESTING.md.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.
//
// Range facts pinned here (all characterized as-is, no production change):
//  - The exposed selectedDateRange uses the ` - ` separator (the display uses ` → `, QA).
//  - The range CSA (setStartDate/setEndDate/setDateRange/clearStartDate/clearEndDate/
//    clearDateRange) update exposed variables but NEVER fire onSelect; only the clear
//    BUTTON and a user calendar pick (QA) fire onSelect.
//  - setStartDate/setEndDate update only their date + selectedDateRange (not the *InUnix).
//  - setDateRange stores an end<start range verbatim (no reorder); a defaultStart>defaultEnd
//    rebind instead nulls the end.
//  - The two console.log smells (useDateInput.js:10, utils.js isDateRangeValid) are stubbed.

const ID = 'daterangepicker1';

const defaultProperties = {
  label: binding('Label'),
  placeholder: binding('Select Date Range'),
  defaultStartDate: binding('01/04/2022'),
  defaultEndDate: binding('10/04/2022'),
  format: binding('DD/MM/YYYY'),
  showClearBtn: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
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
  alignment: binding('top'),
  direction: binding('left'),
  auto: binding('{{true}}'),
  labelWidth: binding('20'),
  widthType: binding('ofComponent'),
  fieldBackgroundColor: binding('var(--cc-surface1-surface)'),
  fieldBorderColor: binding('var(--cc-default-border)'),
  accentColor: binding('var(--cc-primary-brand)'),
  selectedTextColor: binding('var(--cc-primary-text)'),
  errTextColor: binding('var(--cc-error-systemStatus)'),
  icon: binding('IconHome2'),
  iconColor: binding('var(--cc-default-icon)'),
  iconDirection: binding('left'),
  borderRadius: binding('{{6}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
};

const widget = createWidgetHarness({
  componentType: 'DaterangePicker',
  handle: ID,
  id: ID,
  defaultProperties,
  defaultValidation,
  defaultStyles,
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
// NOTE: DaterangePicker does not forward `dataCy` to BaseDateComponent (unlike
// DatePickerV2), so the input/clear-button data-cy resolve to `undefined-*`.
// Characterized as-is (backfill, not a fix); we select by stable class instead.
const input = () => document.querySelector('.datetimepicker-component input.table-column-datepicker-input');
const wrapper = () => document.querySelector('.datetimepicker-component');
const clearBtn = () => document.querySelector('.datetimepicker-component .tj-input-clear-btn');

const onSelectCounter = () =>
  setVariableOn(ID, 'onSelect', { key: 'onSelectCount', value: '{{(variables.onSelectCount ?? 0) + 1}}' });

describe('DaterangePicker widget', () => {
  let logSpy;
  beforeEach(() => {
    // D-10: the runtime logs on every render (useDateInput.js:10) and inside
    // isDateRangeValid (utils.js). Characterized as-is; stubbed to keep output clean.
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    logSpy.mockRestore();
  });

  test('[DaterangePicker-RANGE-001] mount publishes the deterministic range variables', async () => {
    // Break this catches: not seeding the mount exposed range variables
    // (DaterangePicker.jsx:135-172), so apps read empty range state on load.
    widget.render({});

    await waitFor(() => expect(exposed().startDate).toBe('01/04/2022'));
    expect(exposed().endDate).toBe('10/04/2022');
    expect(exposed().selectedDateRange).toBe('01/04/2022 - 10/04/2022');
    expect(typeof exposed().startDateInUnix).toBe('number');
    expect(typeof exposed().endDateInUnix).toBe('number');
    expect(exposed().dateFormat).toBe('DD/MM/YYYY');
    expect(exposed().isValid).toBe(true);
  });

  test('[DaterangePicker-VAR-001] mount publishes isVisible/isDisabled/isLoading/isMandatory/label', async () => {
    // Break this catches: the hooks not publishing the runtime-only state
    // variables on mount (useDatetimeInput.js:71-79); config declares only the range.
    widget.render({});

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().isLoading).toBe(false);
    expect(exposed().isMandatory).toBe(false);
    expect(exposed().label).toBe('Label');
  });

  test('[DaterangePicker-BIND-001] a defaultStart/EndDate rebind re-inits the range WITHOUT firing onSelect', async () => {
    // Break this catches: firing onSelect on a default-range rebind - the
    // skipFireEvent=true flag (DaterangePicker.jsx:118-134); regression edd6fb3054.
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().startDate).toBe('01/04/2022'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultStartDate', '02/04/2022', 'properties');
    });

    await waitFor(() => expect(exposed().startDate).toBe('02/04/2022'));
    expect(exposed().endDate).toBe('10/04/2022');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-BIND-002] a defaultStart>defaultEnd rebind nulls the end and fires zero onSelect', async () => {
    // Break this catches: dropping the start>end branch that nulls the end
    // (DaterangePicker.jsx:127-131 onChange([start,null],true)).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(typeof exposed().endDateInUnix).toBe('number'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultStartDate', '15/04/2022', 'properties');
    });

    await waitFor(() => expect(exposed().startDate).toBe('15/04/2022'));
    expect(exposed().endDateInUnix).toBeNull();
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-001] setStartDate updates the start + range string (not the unix) and fires no onSelect', async () => {
    // Break this catches: setStartDate not updating startDate/selectedDateRange
    // or wrongly firing onSelect (DaterangePicker.jsx:204-223).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setStartDate).toBeInstanceOf(Function));

    await widget.act('setStartDate', '05/04/2022', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().startDate).toBe('05/04/2022'));
    expect(exposed().selectedDateRange).toBe('05/04/2022 - 10/04/2022');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-002] setEndDate updates the end + range string (not the unix) and fires no onSelect', async () => {
    // Break this catches: setEndDate not updating endDate/selectedDateRange
    // or wrongly firing onSelect (DaterangePicker.jsx:189-197).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setEndDate).toBeInstanceOf(Function));

    await widget.act('setEndDate', '15/04/2022', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().endDate).toBe('15/04/2022'));
    expect(exposed().selectedDateRange).toBe('01/04/2022 - 15/04/2022');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-003] setDateRange updates all five vars, stores end<start verbatim, and fires no onSelect', async () => {
    // Break this catches: setDateRange reordering the range or not updating all
    // five range variables (DaterangePicker.jsx:137-149).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().setDateRange).toBeInstanceOf(Function));

    await widget.act('setDateRange', '10/04/2022', '01/04/2022', 'DD/MM/YYYY');

    await waitFor(() => expect(exposed().startDate).toBe('10/04/2022'));
    expect(exposed().endDate).toBe('01/04/2022');
    expect(exposed().selectedDateRange).toBe('10/04/2022 - 01/04/2022');
    expect(typeof exposed().startDateInUnix).toBe('number');
    expect(typeof exposed().endDateInUnix).toBe('number');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-004] clearStartDate nulls the start side, leaves the end, and fires no onSelect', async () => {
    // Break this catches: clearStartDate not nulling the start side or clobbering
    // the end (DaterangePicker.jsx:150-157).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearStartDate).toBeInstanceOf(Function));

    await widget.act('clearStartDate');

    await waitFor(() => expect(exposed().startDate).toBeNull());
    expect(exposed().startDateInUnix).toBeNull();
    expect(exposed().selectedDateRange).toBeNull();
    expect(exposed().endDate).toBe('10/04/2022');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-005] clearEndDate nulls the end side, leaves the start, and fires no onSelect', async () => {
    // Break this catches: clearEndDate not nulling the end side or clobbering
    // the start (DaterangePicker.jsx:158-165).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearEndDate).toBeInstanceOf(Function));

    await widget.act('clearEndDate');

    await waitFor(() => expect(exposed().endDate).toBeNull());
    expect(exposed().endDateInUnix).toBeNull();
    expect(exposed().selectedDateRange).toBeNull();
    expect(exposed().startDate).toBe('01/04/2022');
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-006] clearDateRange nulls all five range vars and fires no onSelect', async () => {
    // Break this catches: clearDateRange not nulling every range variable
    // (DaterangePicker.jsx:77-88,135-172).
    widget.render({ events: onSelectCounter() });
    await waitFor(() => expect(exposed().clearDateRange).toBeInstanceOf(Function));

    await widget.act('clearDateRange');

    await waitFor(() => expect(exposed().startDate).toBeNull());
    expect(exposed().endDate).toBeNull();
    expect(exposed().startDateInUnix).toBeNull();
    expect(exposed().endDateInUnix).toBeNull();
    expect(exposed().selectedDateRange).toBeNull();
    expect(widget.variables().onSelectCount).toBeUndefined();
  });

  test('[DaterangePicker-CSA-007] setMinDate publishes minDate and recomputes isValid', async () => {
    // Break this catches: setMinDate not exposing minDate / not recomputing
    // isValid (useDateInput.js:40-47 -> DaterangePicker.jsx:243-264).
    widget.render({});
    await waitFor(() => expect(exposed().setMinDate).toBeInstanceOf(Function));

    await widget.act('setMinDate', '05/04/2022');

    await waitFor(() => expect(exposed().minDate).toBe('05/04/2022'));
    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DaterangePicker-CSA-008] setDisabledDates/clearDisabledDates recompute isValid over the range', async () => {
    // Break this catches: set/clearDisabledDates not updating excludedDates ->
    // isValid (useDateInput.js:56-67 -> DaterangePicker.jsx:243-264).
    widget.render({});
    await waitFor(() => expect(exposed().setDisabledDates).toBeInstanceOf(Function));

    await widget.act('setDisabledDates', ['05/04/2022']);
    await waitFor(() => expect(exposed().isValid).toBe(false));

    await widget.act('clearDisabledDates');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[DaterangePicker-CSA-009] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating the exposed variable +
    // state (useDatetimeInput.js:81-84 -> BaseDateComponent.jsx:149 invisible).
    widget.render({});
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DaterangePicker-CSA-010] setLoading publishes isLoading and marks the input busy/disabled', async () => {
    // Break this catches: setLoading not updating the exposed variable + state
    // (useDatetimeInput.js:85-88 -> DatepickerInput.jsx aria-busy/disabled).
    widget.render({});
    await waitFor(() => expect(exposed().setLoading).toBeInstanceOf(Function));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DaterangePicker-CSA-011] setDisable publishes isDisabled and disables the input', async () => {
    // Break this catches: setDisable not updating the exposed variable + state
    // (useDatetimeInput.js:89-92 -> DatepickerInput.jsx disabled attr).
    widget.render({});
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(input()).toBeDisabled();
  });

  test('[DaterangePicker-VALID-001] a mandatory empty range is invalid', async () => {
    // Break this catches: dropping the mandatory check from isDateValid
    // (utils.js isMandatoryValid), so a required empty range reports valid.
    widget.render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(exposed().clearDateRange).toBeInstanceOf(Function));

    await widget.act('clearDateRange');

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
  });

  test('[DaterangePicker-VALID-002] a start earlier than minDate is invalid', async () => {
    // Break this catches: dropping the min-date check (utils.js isMinDateValid).
    widget.render({ validation: { minDate: binding('05/04/2022') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DaterangePicker-VALID-003] an excluded date within the range is invalid', async () => {
    // Break this catches: dropping the excluded-in-range check
    // (utils.js isDateRangeValid).
    widget.render({ validation: { disabledDates: binding("{{['05/04/2022']}}") } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DaterangePicker-VALID-004] a non-empty customRule is invalid', async () => {
    // Break this catches: dropping the customRule check (utils.js isCustomRuleValid).
    widget.render({ validation: { customRule: binding('Range not allowed') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
  });

  test('[DaterangePicker-STYLE-001] visibility=false applies the invisible class', async () => {
    // Break this catches: dropping the `invisible: !visibility` class mapping
    // (BaseDateComponent.jsx:149), so a hidden picker stays visible.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(wrapper()).toBeInTheDocument());
    expect(wrapper()).toHaveClass('invisible');
  });

  test('[DaterangePicker-STYLE-002] disabledState sets the input disabled attribute and aria', async () => {
    // Break this catches: dropping `disabled`/`aria-disabled` from the input
    // (DatepickerInput.jsx), so a disabled picker stays editable.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[DaterangePicker-STYLE-003] boxShadow is applied to the input inline style', async () => {
    // Break this catches: not forwarding `boxShadow` to the input inline style
    // (BaseDateComponent.jsx -> DatepickerInput.jsx).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });

  test('[DaterangePicker-STYLE-004] borderRadius is applied to the input inline style', async () => {
    // Break this catches: not forwarding `borderRadius` to the input inline
    // border-radius (BaseDateComponent.jsx -> DatepickerInput.jsx).
    widget.render({ styles: { borderRadius: binding('{{10}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveStyle({ borderRadius: '10px' });
  });

  test('[DaterangePicker-LOAD-001] loadingState marks the input busy and disabled', async () => {
    // Break this catches: not driving `aria-busy`/`disabled` from loading
    // (DatepickerInput.jsx), so a loading picker stays interactive.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(input()).toBeInTheDocument());
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(input()).toBeDisabled();
  });

  test('[DaterangePicker-CLEAR-001] the clear button nulls both dates + fires onSelect, and hides when disabled', async () => {
    // Break this catches: handleClear not nulling the range or not firing
    // onSelect (DaterangePicker.jsx:174-187), or dropping the shouldShowClearBtn
    // value/disabled guard (DatepickerInput.jsx).
    widget.render({ properties: { showClearBtn: binding('{{true}}') }, events: onSelectCounter() });
    await waitFor(() => expect(clearBtn()).toBeInTheDocument());

    await widget.session.store.act(async () => {
      fireEvent.click(clearBtn());
    });

    await waitFor(() => expect(exposed().startDate).toBeNull());
    expect(exposed().endDate).toBeNull();
    expect(widget.variables().onSelectCount).toBe(1);

    // A value present but disabled -> the clear button is guarded out.
    widget.render({ properties: { showClearBtn: binding('{{true}}'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(input()).toBeDisabled());
    expect(clearBtn()).not.toBeInTheDocument();
  });

  test('[DaterangePicker-FORM-001] a Form clear nulls the range', async () => {
    // Break this catches: not wiring useFormClear -> clearDateRangeValue
    // (DaterangePicker.jsx:227), so a Form clear leaves the range set.
    widget.renderInsideForm({});
    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID)?.startDate).toBe('01/04/2022'));

    await waitFor(() =>
      expect(store().getExposedValueOfComponent('form1', MODULE_ID)?.clearForm).toBeInstanceOf(Function)
    );
    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID).startDate).toBeNull());
  });

  test('[DaterangePicker-PREC-001] a CSA setDisable survives an unrelated property re-resolve', async () => {
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
});
