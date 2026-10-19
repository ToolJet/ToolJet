import React, { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import {
  CONTROL,
  controlAria,
  fieldIdOf,
  fieldName,
  FormField,
  requiredAria,
} from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  runNow,
  toOptions,
  useAutoHeight,
  useExposed,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { useFocusEvents, usePickerPopup } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import {
  ClearButton,
  MENU_SURFACE,
  OptionIcon,
  OptionsMenu,
  PLACEHOLDER,
  useDropRemovedChoices,
  useKeptSelection,
  useSearch,
} from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { Option } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Combobox ------------------------------------------------------------------------------------------------------

export const ShadCombobox = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, componentType } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const options = toOptions(properties.options);
  const initial = M.initialKey(properties.defaultValue);
  const [key, setKey] = useState(initial);
  // An option that is removed takes its choice with it (unless it is only off a server-side search page).
  useDropRemovedChoices(
    options.map((o) => M.keyOf(o.value)),
    key === null ? [] : [key],
    () => setKey(null),
    properties.serverSideSearch === true
  );
  useEffect(() => setKey(initial), [initial]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popup = usePickerPopup(properties, triggerRef);
  const { open } = popup;
  const focus = useFocusEvents(fireEvent, () => check.touch());
  const [search, onSearch] = useSearch(props);
  const [selected] = useKeptSelection(options, key === null ? [] : [key], properties.serverSideSearch === true) as [
    Option | undefined
  ];
  const value = selected ? selected.value : '';
  useExposed(setExposedVariables, properties, {
    value,
    selectedOption: selected || {},
    searchText: search,
    options,
    label: String(properties.label ?? ''),
    // As the native Select: an option that exists and is enabled is picked, with onSelect; anything else changes
    // nothing. An { value } object picks by its value.
    selectOption: async (v: unknown) => {
      const wanted = v && typeof v === 'object' && 'value' in v ? (v as { value: unknown }).value : v;
      if (wanted === undefined || wanted === null || typeof wanted === 'object') return;
      const option = options.find((o) => M.keyOf(o.value) === M.keyOf(wanted));
      if (!option || M.isDisabledOption(option)) return;
      setKey(M.keyOf(wanted));
      fireEvent('onSelect');
    },
    clear: async () => setKey(null),
    setFocus: async () => triggerRef.current?.focus(),
    // Closes an open popup too (focus is in it then), the way the popup's own close does: touched, onBlur once.
    setBlur: async () => {
      const wasOpen = popup.open;
      popup.blurAway(triggerRef.current);
      if (wasOpen) openChange(false);
    },
  });
  const check = useValidation(
    props,
    value,
    () => {
      setKey(null);
      setExposedVariables({ value: '', selectedOption: {} });
    },
    !!selected
  );
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const openChange = (next: boolean) => {
    if (next && popup.blocked) return;
    popup.setOpen(next);
    focus.opened(next);
    if (!next) {
      check.touch();
      if (search) onSearch('');
    }
  };
  const pick = (option: Option) =>
    !popup.blocked &&
    runNow(() => {
      setKey(M.keyOf(option.value));
      setExposedVariables({ value: option.value, selectedOption: option });
      openChange(false);
      fireEvent('onSelect');
    });
  const clear = () =>
    !popup.blocked &&
    runNow(() => {
      setKey(null);
      setExposedVariables({ value: '', selectedOption: {} });
      check.touch();
      fireEvent('onSelect');
    });
  const showClear = properties.showClearBtn !== false && !!selected && !disabled;
  return (
    <FormField props={props} properties={properties} check={check} innerRef={ref}>
      <Popover open={open} onOpenChange={openChange}>
        <div className="tw-relative">
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              id={fieldIdOf(props)}
              // Named by its label; without a visible one (empty, or only spaces) by its placeholder or component name.
              aria-label={fieldName(props, 'Select an option')}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              {...controlAria(props, check.error)}
              {...requiredAria(props)}
              disabled={disabled}
              {...focus.handlers}
              className={cn('tw-w-full tw-justify-between tw-gap-2 tw-px-3 tw-font-normal', CONTROL)}
            >
              <span className={cn('tw-flex tw-min-w-0 tw-items-center tw-gap-2', !selected && PLACEHOLDER)}>
                {selected ? <OptionIcon icon={selected.icon} /> : null}
                <span className="tw-truncate">{selected ? selected.label : String(properties.placeholder ?? '')}</span>
              </span>
              {loading ? null : (
                <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
                  {showClear ? <span className="tw-w-5" /> : null}
                  <ChevronsUpDown className="tw-h-4 tw-w-4 tw-opacity-50" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          {showClear && !loading ? (
            <span className="tw-absolute tw-right-8 tw-top-1/2 tw-flex -tw-translate-y-1/2">
              <ClearButton onClear={clear} label="Clear selection" />
            </span>
          ) : null}
        </div>
        <PopoverContent
          aria-label="Options"
          align="start"
          className={cn('tw-w-[var(--radix-popover-trigger-width)] tw-min-w-[12rem] tw-p-0', MENU_SURFACE)}
          style={lookVars(componentType, styles)}
          onCloseAutoFocus={popup.onCloseAutoFocus}
        >
          <OptionsMenu
            properties={properties}
            options={options}
            search={search}
            onSearch={onSearch}
            isSelected={(o) => !!selected && M.keyOf(o.value) === key}
            isDisabled={(o) => M.isDisabledOption(o)}
            onPick={pick}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
};

export default withControlState(ShadCombobox);
