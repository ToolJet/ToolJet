import React, { useEffect, useRef, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Check, ChevronDown } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { cn } from '../lib/cn';
import { choiceKey, defaultKey, isDisabledOption, shownOptions, toChoiceOptions, wantedValue, type ChoiceOption } from '../lib/ui2/choice/options';
import { fieldVars, lookVars, useDropRemovedChoices, useFocusEvents, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useFieldStyles } from '../lib/ui2/choice/fieldStyles';
import { ClearX, Spinner } from '../lib/ui2/choice/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Select (Ui2/Select/Select.tsx) on the pack's CSS: the same properties, styles, events and actions. Options
// keep their value's type; an option valued '' (an "All" choice) has its own key, as '' means nothing selected.
const MAX_SELECT_OPTIONS = 500;

export const Select = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Label' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: "Labels that differ from values: [{ label: 'Standard', value: 'std' }, { label: 'Premium', value: 'pro' }]",
    placeholder: "['Standard', 'Premium'] or [{ label, value }]",
    initialValue: [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
    ],
  });
  const [allowClear] = ToolJet.useStateBoolean({
    name: 'allowClear',
    label: 'Allow clear',
    description: 'An x in the box, and a click on the chosen option, clear it. Off while the field is mandatory.',
    initialValue: true,
  });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select an option' });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  // Exposed values. `value` was the pack's default value: an app that set it still starts on it.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedLabel] = ToolJet.useStateString({ name: 'selectedLabel', initialValue: '', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const styles = useFieldStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = toChoiceOptions(rawOptions);
  const byKey = new Map(options.map((o) => [choiceKey(o.value), o] as [string, ChoiceOption]));
  const [key, setKey] = useState(() => defaultKey(defaultValue) || defaultKey(legacyValue));
  const [open, setOpen] = useState(false);
  // A new default value starts the selection again.
  useResetOn(defaultValue, () => setKey(defaultKey(defaultValue)));
  const selected = byKey.get(key);
  // An option that is removed takes its choice with it, so it does not come back selected when it reappears.
  useDropRemovedChoices(options.map((o) => choiceKey(o.value)), key ? [key] : [], () => setKey(''), false);

  const expose = (option: ChoiceOption | undefined) => {
    setValue((option?.value ?? '') as string);
    setSelectedOption(option ?? {});
    setSelectedLabel(option?.label ?? '');
  };
  useEffect(() => expose(selected), [key, JSON.stringify(selected)]); // eslint-disable-line react-hooks/exhaustive-deps

  // A picked option counts even when its value is false, 0 or '' (an "All" choice); only no pick is empty.
  const check = ToolJet.useValidation({ section: 'choice', value: selected?.value ?? '', present: !!selected });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const choose = (next: string, fire = true) => {
    setKey(next);
    expose(byKey.get(next));
    if (fire) onSelect();
  };
  // As the native Select: an option that exists and is enabled is picked, with onSelect; anything else changes nothing.
  const selectByValue = (v: unknown) => {
    const wanted = wantedValue(v);
    if (wanted === undefined || wanted === null || typeof wanted === 'object') return;
    const option = byKey.get(choiceKey(wanted));
    if (option && !isDisabledOption(option)) choose(choiceKey(wanted));
  };
  ToolJet.useAction({ name: 'selectOption', displayName: 'Select option', params: [{ handle: 'value', displayName: 'Value' }] }, selectByValue);
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => choose('', false));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    setOpen(false);
    triggerRef.current?.blur();
  });
  // The pack's earlier name for selectOption.
  ToolJet.useAction({ name: 'setValue', displayName: 'Select option (value)', params: [{ handle: 'value', displayName: 'Value' }] }, selectByValue);

  // Allow clear (on unless turned off, and never while mandatory): an x in the box and a click on the chosen option.
  const clearable = allowClear !== false && !check.required && !disabled;
  const clearChoice = () => {
    choose('');
    check.touch();
  };
  const vars = lookVars(fieldVars(styles));
  // Radix mounts every item even while closed: the list shows the first MAX_SELECT_OPTIONS (and the selected one).
  const shown = shownOptions(options, selected, MAX_SELECT_OPTIONS);

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error} required={check.required}>
        <FieldLoading loading={loading}>
          <div className="uc-wrap">
            <SelectPrimitive.Root
              value={key}
              disabled={disabled}
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                focus.opened(next);
                if (!next) check.touch();
              }}
              onValueChange={(next) => !isDisabledOption(byKey.get(next)) && choose(next)}
            >
              <SelectPrimitive.Trigger
                ref={triggerRef}
                className={cn('ui-select-trigger uc-trigger', clearable && key && 'has-clear', loading && 'uc-is-loading')}
                // role="combobox" takes no name from its content: without a label, the placeholder names it.
                aria-label={label ? undefined : placeholder || 'Select'}
                {...fieldAria(fieldId, check.error, check.required, !!description)}
                {...focus.handlers}
              >
                <span className="uc-truncate">
                  <SelectPrimitive.Value placeholder={placeholder} />
                </span>
                {loading ? (
                  <Spinner />
                ) : (
                  <SelectPrimitive.Icon asChild>
                    <ChevronDown className="ui-icon-muted" />
                  </SelectPrimitive.Icon>
                )}
              </SelectPrimitive.Trigger>
              {container ? (
                <SelectPrimitive.Portal container={container}>
                  <SelectPrimitive.Content className="ui-popup ui-menu uc-select-menu" position="popper" sideOffset={4} style={vars}>
                    <SelectPrimitive.Viewport>
                      {shown.map((o) => {
                        const k = choiceKey(o.value);
                        return (
                          <SelectPrimitive.Item
                            key={k}
                            value={k}
                            disabled={isDisabledOption(o)}
                            className="ui-menu-item"
                            // The chosen option, clicked again, clears the choice when clearing is allowed.
                            onPointerUp={
                              clearable && k === key
                                ? (e) => {
                                    e.preventDefault();
                                    setOpen(false);
                                    clearChoice();
                                  }
                                : undefined
                            }
                          >
                            <span className="ui-menu-indicator">
                              <SelectPrimitive.ItemIndicator>
                                <Check size={14} />
                              </SelectPrimitive.ItemIndicator>
                            </span>
                            <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                        );
                      })}
                      {options.length > MAX_SELECT_OPTIONS ? (
                        <div className="uc-cap-note">{`Showing ${MAX_SELECT_OPTIONS} of ${options.length} options. A Combobox searches them all.`}</div>
                      ) : null}
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              ) : null}
            </SelectPrimitive.Root>
            {clearable && key && !loading ? (
              <ClearX
                label="Clear selection"
                className="uc-clear-at before-chevron"
                onClear={() => {
                  clearChoice();
                  triggerRef.current?.focus();
                }}
              />
            ) : null}
          </div>
        </FieldLoading>
      </Field>
    </div>
  );
};
