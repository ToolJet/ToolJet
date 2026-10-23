import React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str } from '../lib/data';
import { ControlSkeleton } from '../lib/Loading';

const VALUE_FORMAT = 'YYYY-MM-DD';
const VALUE_FORMAT_TIME = 'YYYY-MM-DDTHH:mm:ss';
const parse = (v: unknown): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  const d = dayjs(s);
  return d.isValid() ? d : null;
};

// Ant's DatePicker: value (as YYYY-MM-DD text; YYYY-MM-DDTHH:mm:ss with showTime), showTime, format (how it shows), picker (date, week, month, quarter, year),
// minDate, maxDate, placeholder, allowClear; events onChange, onOpenChange.
export const DatePicker = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'YYYY-MM-DD, or YYYY-MM-DDTHH:mm:ss with showTime.', initialValue: '' });
  const [showTime] = ToolJet.useStateBoolean({ name: 'showTime', label: 'Show time', description: 'Pick a time too (a date-time picker).', initialValue: false });
  const [format] = ToolJet.useStateString({ name: 'format', label: 'Format', description: 'Display format (dayjs), e.g. DD MMM YYYY; empty for the default.', initialValue: '' });
  const [picker] = ToolJet.useStateEnumeration({
    name: 'picker',
    label: 'Picker',
    enumDefinition: ['date', 'week', 'month', 'quarter', 'year'],
    initialValue: 'date',
  });
  const [minDate] = ToolJet.useStateString({ name: 'minDate', label: 'Min date', description: 'YYYY-MM-DD', initialValue: '' });
  const [maxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Max date', description: 'YYYY-MM-DD', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onOpenChange = ToolJet.useEventCallback({ name: 'onOpenChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'date', value });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });

  const change = (next: Dayjs | null) => {
    setValue(next ? next.format(showTime ? VALUE_FORMAT_TIME : VALUE_FORMAT) : '');
    onChange();
  };
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Date (YYYY-MM-DD)' }] },
    (next) => change(parse(next))
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(parse(props.value)));

  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <Picker
            id={fieldId}
            value={parse(value)}
            format={str(format).trim() || (showTime ? 'YYYY-MM-DD HH:mm' : VALUE_FORMAT)}
            showTime={showTime ? { format: 'HH:mm' } : false}
            picker={showTime ? 'date' : (picker as 'date')}
            minDate={parse(minDate) ?? undefined}
            maxDate={parse(maxDate) ?? undefined}
            placeholder={placeholder || undefined}
            allowClear={allowClear}
            disabled={disabled}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            popupClassName={popup.className}
            popupStyle={popup.style}
            onChange={(d) => change(d as Dayjs | null)}
            onOpenChange={(open) => {
              if (!open) check.touch();
              onOpenChange();
            }}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

const Picker = (p: React.ComponentProps<typeof AntDatePicker>) => <AntDatePicker style={{ width: '100%' }} {...p} />;
