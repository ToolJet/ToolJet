import React, { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Clock } from 'lucide-react';
import { Field } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { popupLayerStyle } from '../lib/popupLayer';
import { formatTime, inTimeRange, is24h, minuteStep, parseTime, parseTimeArg, timeBounds, timeSlots, toHHmm } from '../lib/ui2/choice/dates';
import { lookVars, pickerVars, useFocusEvents, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useFieldStyles, usePopoverStyles } from '../lib/ui2/choice/fieldStyles';
import { PickerTrigger } from '../lib/ui2/choice/PickerField';
import { OptionColumn, timeColumns } from '../lib/ui2/choice/TimeParts';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Time picker (Ui2/TimePicker/TimePicker.tsx) on the pack's CSS: hour, minute and AM/PM columns, or one list
// of times (pickerStyle list); a time every minuteStep minutes from midnight, within minTime and maxTime. value is
// 'HH:mm' (24-hour), formattedValue as shown.
export const TimePicker = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Time' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Pick a time' });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value (HH:mm)', initialValue: '' });
  const [timeFormat] = ToolJet.useStateEnumeration({
    name: 'timeFormat',
    label: 'Time format',
    enumDefinition: ['12h', '24h'],
    enumLabels: { '12h': '12h', '24h': '24h' },
    initialValue: '12h',
    inspector: 'switch',
  });
  const [pickerStyle] = ToolJet.useStateEnumeration({
    name: 'pickerStyle',
    label: 'Picker',
    enumDefinition: ['columns', 'list'],
    enumLabels: { columns: 'Columns', list: 'List' },
    initialValue: 'columns',
    inspector: 'switch',
  });
  const [minuteStepProp] = ToolJet.useStateNumber({ name: 'minuteStep', label: 'Minute step', initialValue: 15 });
  const [minTime, setMinTime] = ToolJet.useStateString({ name: 'minTime', label: 'Earliest time (HH:mm)', initialValue: '' });
  const [maxTime, setMaxTime] = ToolJet.useStateString({ name: 'maxTime', label: 'Latest time (HH:mm)', initialValue: '' });
  const [showClearBtn] = ToolJet.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed values. `value` was the pack's default time: an app that set it still starts on it.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setFormattedValue] = ToolJet.useStateString({ name: 'formattedValue', initialValue: '', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const styles = useFieldStyles();
  const popoverStyles = usePopoverStyles('Clock icon color');
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const use24 = is24h(timeFormat);
  const step = minuteStep(minuteStepProp, 15);
  const bounds = timeBounds(minTime, maxTime);
  const [minutes, setMinutes] = useState<number | null>(() => parseTime(defaultValue) ?? parseTime(legacyValue));
  const [open, setOpen] = useState(false);
  // An open popup closes when its owner stops taking input (disabled, or blocked or hidden by the host): useOwnerGuard.
  useOwnerGuard(anchorRef, open, () => setOpen(false), disabled);
  useResetOn(defaultValue, () => setMinutes(parseTime(defaultValue)));
  // A Form's clearForm empties what the field shows as well as what it exposes (the SDK clears only `value`).
  ToolJet.useFormClear(() => { setOpen(false); setMinutes(null); });
  const expose = (m: number | null) => {
    setValue(toHHmm(m));
    setFormattedValue(formatTime(m, use24));
  };
  useEffect(() => expose(minutes), [minutes, use24]); // eslint-disable-line react-hooks/exhaustive-deps

  const outOfRange = minutes !== null && !inTimeRange(minutes, bounds);
  const problem = outOfRange ? `Pick a time between ${formatTime(bounds.lo, use24)} and ${formatTime(bounds.hi, use24)}` : '';
  const check = ToolJet.useValidation({ section: 'date', value: toHHmm(minutes), present: minutes !== null && !outOfRange });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const pick = (m: number | null, close = false) => {
    if (close) openChange(false);
    if (m === minutes) return;
    setMinutes(m);
    expose(m);
    onSelect();
  };
  const setTime = (t: unknown, format: unknown) => {
    const m = parseTimeArg(t, format);
    if (m !== null || t === '' || t === null || t === undefined) setMinutes(m);
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, setTime);
  ToolJet.useAction({ name: 'clearValue', displayName: 'Clear value' }, () => setMinutes(null));
  ToolJet.useAction({ name: 'setMinTime', displayName: 'Set min time', params: [{ handle: 'value', displayName: 'Value' }] }, (t) => setMinTime(t ? String(t) : ''));
  ToolJet.useAction({ name: 'setMaxTime', displayName: 'Set max time', params: [{ handle: 'value', displayName: 'Value' }] }, (t) => setMaxTime(t ? String(t) : ''));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    setOpen(false);
    triggerRef.current?.blur();
  });

  const shown = formatTime(minutes, use24);
  const clearable = showClearBtn === true && minutes !== null && !disabled;
  const list = pickerStyle === 'list';
  const vars = lookVars(pickerVars({ ...styles, ...popoverStyles }));
  // Inside a Dialog's body the popup stacks above the dialog (lib/popupLayer).
  const popVars = open ? { ...vars, ...popupLayerStyle(anchorRef.current) } : vars;

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error || problem} required={check.required}>
        <FieldLoading loading={loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            <PickerTrigger
              ref={triggerRef}
              icon={<Clock className="uc-picker-icon" />}
              text={shown}
              placeholder={placeholder}
              disabled={disabled}
              loading={loading}
              clearable={clearable}
              onClear={() => {
                pick(null);
                check.touch();
                triggerRef.current?.focus();
              }}
              fieldId={fieldId}
              error={check.error || problem}
              required={check.required}
              hasNote={!!description}
              label={label}
              focusHandlers={focus.handlers}
            />
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content
                  aria-label="Choose a time"
                  align="start"
                  sideOffset={4}
                  className={list ? 'ui-popup uc-pop uc-pop-menu' : 'ui-popup uc-pop'}
                  style={{ ...popVars, ...(list ? { minWidth: '9rem' } : {}) }}
                >
                  {list ? (
                    <OptionColumn
                      list
                      label="Times"
                      options={timeSlots(step, minTime, maxTime).map((t) => ({
                        key: t,
                        label: formatTime(t, use24),
                        selected: t === minutes,
                        onClick: () => pick(t, true),
                      }))}
                    />
                  ) : (
                    <div className="uc-time-cols">
                      {timeColumns({ minutes, use24, step, bounds, onPick: (m) => pick(m) }).map((col) => (
                        <OptionColumn key={col.label} label={col.label} options={col.options} />
                      ))}
                    </div>
                  )}
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
