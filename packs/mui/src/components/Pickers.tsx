import React from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers/TimePicker';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import type { ThemeOverrides } from '../lib/theme';
import { checkProps, fieldClass, useFieldProps, useTextFieldLook } from '../lib/field';
import { str } from '../lib/data';
import { FieldSkeleton, Loading } from '../lib/loading';

// Always the desktop picker (a popper under the field): the mobile one is a full-screen dialog, wrong in a widget box.
const DESKTOP = '@media (min-width: 0px)';
const DATE = 'YYYY-MM-DD';
const TIME = 'HH:mm';

const parse = (v: unknown, format: string): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  const strict = dayjs(s, format, true);
  if (strict.isValid()) return strict;
  const loose = dayjs(s);
  return loose.isValid() ? loose : null;
};

/** The events both pickers share, by MUI's names: onChange (each edit), onAccept (a value is committed), onOpen, onClose. */
const usePickerEvents = () => ({
  onChange: ToolJet.useEventCallback({ name: 'onChange' }),
  onAccept: ToolJet.useEventCallback({ name: 'onAccept' }),
  onOpen: ToolJet.useEventCallback({ name: 'onOpen' }),
  onClose: ToolJet.useEventCallback({ name: 'onClose' }),
});

/** A picker in the provider, with dayjs as MUI's date adapter; a field Skeleton while loading. */
const PickerFrame = ({
  overrides,
  className,
  loading,
  look,
  children,
}: {
  overrides: ThemeOverrides;
  className?: string;
  loading: boolean;
  look: ReturnType<typeof useTextFieldLook>;
  children: React.ReactNode;
}) => (
  <MuiProvider overrides={overrides} className={className}>
    <Loading loading={loading} look={<FieldSkeleton variant={look.variant} size={look.size} />}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>{children}</LocalizationProvider>
    </Loading>
  </MuiProvider>
);

// The picker's own text field. Its popper portals into the pack's popup layer through the theme (MuiPopper's default
// container).
const pickerSlots = (p: {
  fieldId?: string;
  label: string;
  helperText: string;
  check: { error: string; required: boolean; touch: () => void };
  look: ReturnType<typeof useTextFieldLook>;
}) => ({
  textField: {
    id: p.fieldId,
    fullWidth: true,
    label: p.label || undefined,
    variant: p.look.variant,
    size: p.look.size,
    color: p.look.color,
    onBlur: () => p.check.touch(),
    ...checkProps(p.check, p.helperText),
  },
});

// MUI X's DatePicker: label, value (YYYY-MM-DD; MUI holds a date object, ToolJet the ISO date), format (the field's
// display format, dayjs tokens), views and openTo (year, month, day), minDate, maxDate, disablePast, disableFuture,
// helperText; events onChange, onAccept, onOpen, onClose.
export const DatePicker = () => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The date, YYYY-MM-DD.', initialValue: '' });
  const [format] = ToolJet.useStateString({ name: 'format', label: 'Format', description: 'Display format (dayjs tokens).', initialValue: 'MM/DD/YYYY' });
  const [views] = ToolJet.useStateEnumeration({
    name: 'views',
    label: 'Views',
    enumDefinition: ['year,month,day', 'year,month', 'year', 'month,day'],
    initialValue: 'year,month,day',
  });
  const [openTo] = ToolJet.useStateEnumeration({ name: 'openTo', label: 'Open to', enumDefinition: ['day', 'month', 'year'], initialValue: 'day' });
  const [minDate] = ToolJet.useStateString({ name: 'minDate', label: 'Min date', description: 'YYYY-MM-DD; empty for none.', initialValue: '' });
  const [maxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Max date', description: 'YYYY-MM-DD; empty for none.', initialValue: '' });
  const [disablePast] = ToolJet.useStateBoolean({ name: 'disablePast', label: 'Disable past', initialValue: false });
  const [disableFuture] = ToolJet.useStateBoolean({ name: 'disableFuture', label: 'Disable future', initialValue: false });
  const look = useTextFieldLook();
  const events = usePickerEvents();
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const date = parse(value, DATE);
  const check = ToolJet.useValidation({ section: 'date', value: date ? date.format(DATE) : '', present: !!date });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6.9 });

  const change = (next: Dayjs | null) => {
    setValue(next && next.isValid() ? next.format(DATE) : '');
    events.onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Date' }] }, (next) => change(parse(next, DATE)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));

  const viewList = String(views).split(',') as ('year' | 'month' | 'day')[];
  const slots = pickerSlots({ fieldId, label: field.label, helperText: field.helperText, check, look });
  return (
    <PickerFrame overrides={overrides} className={fieldClass(look.variant, field.label)} loading={loading} look={look}>
      <MuiDatePicker
        value={date}
        format={format || 'MM/DD/YYYY'}
        views={viewList}
        openTo={viewList.includes(openTo as 'day') ? (openTo as 'day') : viewList[viewList.length - 1]}
        minDate={parse(minDate, DATE) ?? undefined}
        maxDate={parse(maxDate, DATE) ?? undefined}
        disablePast={disablePast}
        disableFuture={disableFuture}
        disabled={disabled}
        desktopModeMediaQuery={DESKTOP}
        slotProps={slots}
        onChange={change}
        onAccept={() => events.onAccept()}
        onOpen={() => events.onOpen()}
        onClose={() => events.onClose()}
      />
    </PickerFrame>
  );
};

// MUI X's TimePicker: label, value (HH:mm, 24-hour), ampm (12-hour display), minutesStep, minTime, maxTime, format;
// events onChange, onAccept, onOpen, onClose.
export const TimePicker = () => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The time, HH:mm (24-hour).', initialValue: '' });
  const [ampm] = ToolJet.useStateBoolean({ name: 'ampm', label: 'AM/PM', description: '12-hour display.', initialValue: true });
  const [minutesStep] = ToolJet.useStateNumber({ name: 'minutesStep', label: 'Minutes step', initialValue: 5, min: 1, max: 60 });
  const [minTime] = ToolJet.useStateString({ name: 'minTime', label: 'Min time', description: 'HH:mm; empty for none.', initialValue: '' });
  const [maxTime] = ToolJet.useStateString({ name: 'maxTime', label: 'Max time', description: 'HH:mm; empty for none.', initialValue: '' });
  const look = useTextFieldLook();
  const events = usePickerEvents();
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  // A time alone, on today's date, for the adapter.
  const atToday = (v: unknown) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(str(v).trim());
    return m ? dayjs().hour(Number(m[1])).minute(Number(m[2])).second(0).millisecond(0) : null;
  };
  const time = atToday(value);
  const check = ToolJet.useValidation({ section: 'text', value: time ? time.format(TIME) : '', present: !!time });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 6.9 });

  const change = (next: Dayjs | null) => {
    setValue(next && next.isValid() ? next.format(TIME) : '');
    events.onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Time (HH:mm)' }] }, (next) => change(atToday(next)));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => change(null));

  const slots = pickerSlots({ fieldId, label: field.label, helperText: field.helperText, check, look });
  return (
    <PickerFrame overrides={overrides} className={fieldClass(look.variant, field.label)} loading={loading} look={look}>
      <MuiTimePicker
        value={time}
        ampm={ampm}
        minutesStep={Math.max(1, Number(minutesStep) || 1)}
        minTime={atToday(minTime) ?? undefined}
        maxTime={atToday(maxTime) ?? undefined}
        disabled={disabled}
        desktopModeMediaQuery={DESKTOP}
        slotProps={slots}
        onChange={change}
        onAccept={() => events.onAccept()}
        onOpen={() => events.onOpen()}
        onClose={() => events.onClose()}
      />
    </PickerFrame>
  );
};
