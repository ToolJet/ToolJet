import React, { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { toOptions, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { useFocusEvents } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import {
  ClearButton,
  MENU_SURFACE,
  OptionIcon,
  OptionsMenu,
  PLACEHOLDER,
  useSearch,
} from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';

// ---- Combobox ------------------------------------------------------------------------------------------------------

export const ShadCombobox = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const options = toOptions(properties.options);
  const initial = M.initialKey(properties.defaultValue);
  const [key, setKey] = useState(initial);
  useEffect(() => setKey(initial), [initial]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const focus = useFocusEvents(fireEvent);
  const [search, onSearch] = useSearch(props);
  const selected = key === null ? undefined : options.find((o) => M.keyOf(o.value) === key);
  const value = selected ? selected.value : '';
  useExposed(setExposedVariables, properties, {
    value,
    selectedOption: selected || {},
    searchText: search,
    options,
    label: String(properties.label ?? ''),
    selectOption: async (v) => setKey(v === undefined || v === null ? null : M.keyOf(v)),
    clear: async () => setKey(null),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const check = useValidation(props, M.validationInput(!!selected, value), () => {
    setKey(null);
    setExposedVariables({ value: '', selectedOption: {} });
  });
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const openChange = (next) => {
    if (next && disabled) return;
    setOpen(next);
    focus.opened(next);
    if (!next) {
      check.touch();
      if (search) onSearch('');
    }
  };
  const pick = (option) => {
    setKey(M.keyOf(option.value));
    setExposedVariables({ value: option.value, selectedOption: option });
    openChange(false);
    fireEvent('onSelect');
  };
  const clear = () => {
    setKey(null);
    setExposedVariables({ value: '', selectedOption: {} });
    check.touch();
    fireEvent('onSelect');
  };
  const showClear = properties.showClearBtn !== false && !!selected && !disabled;
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover open={open} onOpenChange={openChange}>
          <div className="relative">
            <PopoverTrigger asChild>
              <Button
                ref={triggerRef}
                id={`shad-${id}`}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-invalid={!!check.error || undefined}
                disabled={disabled}
                {...focus.handlers}
                className={cn('w-full justify-between gap-2 px-3 font-normal', CONTROL)}
              >
                <span className={cn('flex min-w-0 items-center gap-2', !selected && PLACEHOLDER)}>
                  {selected ? <OptionIcon icon={selected.icon} /> : null}
                  <span className="truncate">{selected ? selected.label : String(properties.placeholder ?? '')}</span>
                </span>
                {loading ? null : (
                  <span className="flex shrink-0 items-center gap-1">
                    {showClear ? <span className="w-5" /> : null}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            {showClear && !loading ? (
              <span className="absolute right-8 top-1/2 flex -translate-y-1/2">
                <ClearButton onClear={clear} label="Clear selection" />
              </span>
            ) : null}
          </div>
          <PopoverContent
            align="start"
            className={cn('w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0', MENU_SURFACE)}
            style={lookVars(componentType, styles)}
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
      </Field>
    </Shell>
  );
};

export default withControlState(ShadCombobox);
