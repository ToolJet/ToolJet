import React, { useEffect } from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles, WithPopupTheme } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str } from '../lib/data';
import { ControlSkeleton } from '../lib/Loading';
import { useOwnedPopup } from '../lib/useOwnerGuard';
import { useValueSetter } from '../lib/sameValue';

const VALUE_FORMAT = 'YYYY-MM-DD';
const VALUE_FORMAT_TIME = 'YYYY-MM-DDTHH:mm:ss';
const parse = (v: unknown): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  const d = dayjs(s);
  return d.isValid() ? d : null;
};

/** A date-time bound: a date alone is the start of that day as a minimum and its end as a maximum, so maxDate
 *  2026-10-25 still allows that afternoon. */
const bound = (v: unknown, edge: 'start' | 'end'): Dayjs | undefined => {
  const d = parse(v);
  if (!d) return undefined;
  return /^\s*\d{4}-\d{2}-\d{2}\s*$/.test(str(v)) ? (edge === 'end' ? d.endOf('day') : d.startOf('day')) : d;
};

/**
 * The picker both components draw. `dateTime` is the DateTimePicker: the time is always on (no showTime or picker
 * option), use12Hours and minuteStep set the time columns, a date-only min or max covers that whole day, `clear`
 * empties it, and selectedDate, selectedTime (HH:mm) and unixTimestamp are exposed with the value, as UI 2.0's Date and
 * time picker exposes them. The DatePicker keeps its options, actions and value as saved apps have them.
 */
// What the date and the date-time picker tell ToolJet about themselves (useComponentSettings).
const DATE_SETTINGS = {
  role: 'datepicker',
  fit: true,
  loading: 'own',
  usage:
    "Ant's DatePicker: label, value YYYY-MM-DD (YYYY-MM-DDTHH:mm:ss with showTime), showTime (a date-time picker), format (display), picker (date, week, month, quarter, year), minDate, maxDate; onChange.",
  roleProps: { description: 'extra' },
  roleEvents: { onSelect: 'onChange' },
  roleActions: { setValue: 'setFieldValue', clear: 'resetFields' },
} as const;
const DATE_TIME_SETTINGS = {
  role: 'datetimepicker',
  fit: true,
  loading: 'own',
  usage:
    "Ant's DatePicker with the time always on: label, value YYYY-MM-DDTHH:mm:ss (local time), format (display; empty for YYYY-MM-DD plus the time), use12Hours, minuteStep, minDate, maxDate (YYYY-MM-DDTHH:mm:ss, or a date alone for that whole day), placeholder, allowClear; selectedDate, selectedTime and unixTimestamp are exposed; onChange, onOpenChange; setFieldValue, resetFields (back to the value property), clear.",
  roleProps: { description: 'extra', timeFormat: 'use12Hours' },
  roleValues: { use12Hours: { '12h': true, '24h': false } },
  roleEvents: { onSelect: 'onChange' },
  roleActions: { setValue: 'setFieldValue', clearValue: 'clear' },
} as const;

const usePicker = (props: Record<string, unknown>, dateTime: boolean) => {
  const field = useFieldProps({ label: dateTime ? 'Date and time' : 'Date' });
  const [value, setValue] = ToolJet.useStateString(
    dateTime
      ? { name: 'value', label: 'Value', description: 'YYYY-MM-DDTHH:mm:ss (local time).', initialValue: '' }
      : {
          name: 'value',
          label: 'Value',
          description: 'YYYY-MM-DD, or YYYY-MM-DDTHH:mm:ss with showTime.',
          initialValue: '',
        }
  );
  const [showTimeProp] = dateTime
    ? [true]
    : ToolJet.useStateBoolean({
        name: 'showTime',
        label: 'Show time',
        description: 'Pick a time too (a date-time picker).',
        initialValue: false,
      });
  const showTime = !!showTimeProp;
  const [format] = ToolJet.useStateString({
    name: 'format',
    label: 'Format',
    description: 'Display format (dayjs), e.g. DD MMM YYYY; empty for the default.',
    initialValue: '',
  });
  const [picker] = dateTime
    ? ['date']
    : ToolJet.useStateEnumeration({
        name: 'picker',
        label: 'Picker',
        enumDefinition: ['date', 'week', 'month', 'quarter', 'year'],
        initialValue: 'date',
      });
  const [use12Hours] = dateTime
    ? ToolJet.useStateBoolean({ name: 'use12Hours', label: 'Use 12 hours', initialValue: false })
    : [false];
  const [minuteStep] = dateTime
    ? ToolJet.useStateNumber({ name: 'minuteStep', label: 'Minute step', initialValue: 5, min: 1, max: 30 })
    : [1];
  const [minDate] = ToolJet.useStateString({
    name: 'minDate',
    label: 'Min date',
    description: dateTime ? 'YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD',
    initialValue: '',
  });
  const [maxDate] = ToolJet.useStateString({
    name: 'maxDate',
    label: 'Max date',
    description: dateTime ? 'YYYY-MM-DD (the whole day) or YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD',
    initialValue: '',
  });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder',
    initialValue: dateTime ? 'Pick a date and time' : 'Pick a date',
  });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const parts = useDateTimeParts(dateTime, value);
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onOpenChange = ToolJet.useEventCallback({ name: 'onOpenChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ kind: 'date', value });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    ...(dateTime ? DATE_TIME_SETTINGS : DATE_SETTINGS),
    defaultWidth: dateTime ? 12 : 10,
    defaultHeight: 6,
  });

  // A value it already has changes nothing and fires nothing (lib/sameValue).
  const valueSetter = useValueSetter<unknown>(value, (v) => setValue(v as never));
  const change = (next: Dayjs | null) => {
    if (!valueSetter.set(next ? next.format(showTime ? VALUE_FORMAT_TIME : VALUE_FORMAT) : '')) return;
    parts.expose(next);
    onChange();
  };
  ToolJet.useAction(
    {
      name: 'setFieldValue',
      displayName: 'Set field value',
      params: [
        { handle: 'value', displayName: dateTime ? 'Date and time (YYYY-MM-DDTHH:mm:ss)' : 'Date (YYYY-MM-DD)' },
      ],
    },
    (next) => change(parse(next))
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(parse(props.value)));
  parts.useClear(() => change(null));
  const panel = useOwnedPopup(disabled, (open) => {
    if (!open) check.touch();
    onOpenChange();
  });
  const timeFormat = use12Hours ? 'hh:mm A' : 'HH:mm';
  const step = Math.max(1, Number(minuteStep) || 1) as 1;

  return (
    <AntProvider tokens={tokens} ownerRef={panel.anchor}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <WithPopupTheme>
            {(popup) => (
              <Picker
                id={fieldId}
                value={parse(value)}
                format={str(format).trim() || (showTime ? `YYYY-MM-DD ${timeFormat}` : VALUE_FORMAT)}
                showTime={
                  showTime
                    ? dateTime
                      ? { format: timeFormat, use12Hours, minuteStep: step }
                      : { format: 'HH:mm' }
                    : false
                }
                picker={showTime ? 'date' : (picker as 'date')}
                minDate={(dateTime ? bound(minDate, 'start') : parse(minDate)) ?? undefined}
                maxDate={(dateTime ? bound(maxDate, 'end') : parse(maxDate)) ?? undefined}
                placeholder={placeholder || undefined}
                allowClear={allowClear}
                disabled={disabled}
                variant={look.variant}
                size={look.size}
                status={check.error ? 'error' : undefined}
                popupClassName={popup.className}
                popupStyle={popup.style}
                open={panel.open}
                onOpenChange={panel.onOpenChange}
                // The time columns have no seconds: a pick keeps none (Ant fills them from the clock).
                onChange={(d) =>
                  panel.available() &&
                  change(dateTime && d ? (d as Dayjs).second(0).millisecond(0) : (d as Dayjs | null))
                }
              />
            )}
          </WithPopupTheme>
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

/** The DateTimePicker's exposed parts and clear action; nothing on the DatePicker. Each change publishes the parts
 *  before its event; a value the app sets itself publishes them on render. */
const useDateTimeParts = (dateTime: boolean, value: unknown) => {
  const parts = dateTime
    ? {
        date: ToolJet.useStateString({ name: 'selectedDate', initialValue: '', inspector: 'hidden' })[1],
        time: ToolJet.useStateString({ name: 'selectedTime', initialValue: '', inspector: 'hidden' })[1],
        stamp: ToolJet.useStateNumber({
          name: 'unixTimestamp',
          initialValue: null as unknown as number,
          inspector: 'hidden',
        })[1],
      }
    : null;
  const expose = (d: Dayjs | null) => {
    if (!parts) return;
    parts.date(d ? d.format(VALUE_FORMAT) : '');
    parts.time(d ? d.format('HH:mm') : '');
    parts.stamp((d ? d.valueOf() : null) as number);
  };
  useEffect(() => expose(parse(value)), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    expose,
    // A hook only on the DateTimePicker (dateTime is fixed for a component).
    useClear: (run: () => void) => {
      if (dateTime) ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, run); // eslint-disable-line react-hooks/rules-of-hooks
    },
  };
};

// Ant's DatePicker: value (as YYYY-MM-DD text; YYYY-MM-DDTHH:mm:ss with showTime), showTime, format (how it shows), picker (date, week, month, quarter, year),
// minDate, maxDate, placeholder, allowClear; events onChange, onOpenChange.
export const DatePicker = (props: Record<string, unknown>) => usePicker(props, false);

// Ant's DatePicker with the time always on: value YYYY-MM-DDTHH:mm:ss (local time), format (display; empty for
// YYYY-MM-DD and the time), use12Hours, minuteStep, minDate, maxDate (a date alone covers that whole day), placeholder,
// allowClear; selectedDate, selectedTime, unixTimestamp exposed; events onChange, onOpenChange; actions setFieldValue,
// resetFields (back to the value property), clear.
export const DateTimePicker = (props: Record<string, unknown>) => usePicker(props, true);

const Picker = (p: React.ComponentProps<typeof AntDatePicker>) => <AntDatePicker style={{ width: '100%' }} {...p} />;
