import React, { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { CONTROL, FormField, controlAria, fieldName } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  toOptions,
  useAutoHeight,
  useExposed,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { useFocusEvents } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import {
  Chip,
  ClearButton,
  CommandGroup,
  CommandItem,
  MENU_SURFACE,
  MUTED,
  OptionsMenu,
  PLACEHOLDER,
  useSearch,
} from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { Option } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** A rule between the options and the selection's own commands: drawn only, since a list of options may hold only
 *  options and groups (cmdk's Separator is role="separator"). */
const MenuRule = () => <div aria-hidden="true" className="-tw-mx-1 tw-h-px tw-bg-[color:var(--sc-border)]" />;

// ---- Multiselect ---------------------------------------------------------------------------------------------------

/** A field that anchors a popover without being its trigger button (it holds chips with their own buttons): opens on
 *  click, Enter, Space or ArrowDown; a click on it while open closes the menu instead of reopening it. */
const useAnchoredMenu = (disabled: boolean, onClose?: () => void) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    if (next && disabled) return;
    setOpen(next);
    if (!next) onClose?.();
  };
  return {
    open,
    change,
    anchorRef,
    anchorProps: {
      ref: anchorRef,
      tabIndex: disabled ? -1 : 0,
      'aria-expanded': open,
      'aria-haspopup': 'listbox' as const,
      'aria-disabled': disabled || undefined,
      onClick: () => change(!open),
    },
    contentProps: {
      onInteractOutside: (e: Event) => {
        if (e.target instanceof Node && anchorRef.current?.contains(e.target)) e.preventDefault();
      },
      onCloseAutoFocus: (e: Event) => {
        e.preventDefault();
        anchorRef.current?.focus();
      },
    },
  };
};

export const MAX_CHIPS = 50;

export const ShadMultiselect = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const options = toOptions(properties.options);
  const limit = M.clampLimit(properties.maxSelections);
  const initial = useStable(
    [...new Set(M.toValueList(properties.defaultValue).map(M.keyOf))].slice(0, limit || undefined)
  );
  const [keys, setKeys] = useState(initial);
  useEffect(() => setKeys(initial), [initial]);
  const latest = useRef({ options, limit });
  latest.current = { options, limit };
  const [search, onSearch] = useSearch(props);
  const selectedOptions = M.selectedOf(options, keys);
  const values = selectedOptions.map((o) => o.value);
  useExposed(setExposedVariables, properties, {
    values,
    selectedOptions,
    searchText: search,
    options,
    label: String(properties.label ?? ''),
    selectOptions: async (v: unknown) => setKeys((k) => M.addKeys(k, v, latest.current.options, latest.current.limit)),
    deselectOptions: async (v: unknown) => setKeys((k) => M.removeKeys(k, v)),
    clear: async () => setKeys([]),
    setFocus: async () => menu.anchorRef.current?.focus(),
    setBlur: async () => menu.anchorRef.current?.blur(),
  });
  const publish = (next: string[]) => {
    const picked = M.selectedOf(options, next);
    setExposedVariables({ values: picked.map((o) => o.value), selectedOptions: picked });
  };
  const check = useValidation(props, M.validationInput(values.length > 0, values), () => {
    setKeys([]);
    publish([]);
  });
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const focus = useFocusEvents(fireEvent);
  const menuId = `shad-${id}-menu`;
  const menu = useAnchoredMenu(disabled, () => {
    check.touch();
    if (search) onSearch('');
  });
  const menuChange = (next: boolean) => {
    menu.change(next);
    if (!(next && disabled)) focus.opened(next);
  };
  const commit = (next: string[]) => {
    setKeys(next);
    publish(next);
    fireEvent('onSelect');
  };
  const selectedKeys = new Set(selectedOptions.map((o) => M.keyOf(o.value)));
  const isOn = (o: Option) => selectedKeys.has(M.keyOf(o.value));
  const full = limit > 0 && selectedOptions.length >= limit;
  const toggle = (o: Option) => {
    const k = M.keyOf(o.value);
    if (isOn(o)) commit(keys.filter((x) => x !== k));
    else if (!full) commit([...keys.filter((x) => selectedKeys.has(x) || !options.length), k]);
  };
  const enabled = options.filter((o) => !M.isDisabledOption(o));
  const allOn = enabled.length > 0 && enabled.every(isOn);
  const toggleAll = () => {
    // Sets, not includes(): select all over 10k options compared every key with every other.
    const enabledKeys = enabled.map((o) => M.keyOf(o.value));
    const enabledSet = new Set(enabledKeys);
    const keySet = new Set(keys);
    commit(allOn ? keys.filter((k) => !enabledSet.has(k)) : [...keys, ...enabledKeys.filter((k) => !keySet.has(k))]);
  };
  const maxChips = M.clampLimit(properties.maxVisibleChips);
  // Unlimited still means a field's worth: past MAX_CHIPS the rest count in the "+N" chip (10k chips froze the page).
  const chips = selectedOptions.slice(0, maxChips > 0 ? Math.min(maxChips, MAX_CHIPS) : MAX_CHIPS);
  const extra = selectedOptions.length - chips.length;
  const showClear = properties.showClearBtn !== false && selectedOptions.length > 0 && !disabled;
  const showSelectAll = properties.showSelectAll !== false && limit === 0 && !search && enabled.length > 1;
  return (
    <FormField props={props} properties={properties} check={check} innerRef={ref}>
      <PopoverPrimitive.Root open={menu.open} onOpenChange={menuChange}>
        <PopoverPrimitive.Anchor asChild>
          <div
            {...menu.anchorProps}
            {...focus.handlers}
            onClick={() => menuChange(!menu.open)}
            id={`shad-${id}`}
            role="combobox"
            aria-controls={menu.open ? menuId : undefined}
            // A div takes no name from <label for>: the label's text, else the placeholder, names it.
            aria-label={toText(properties.label) || fieldName(props, 'Select options')}
            {...controlAria(props, check.error)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                menuChange(true);
              } else if (e.key === 'Backspace' && selectedOptions.length) {
                toggle(selectedOptions[selectedOptions.length - 1]);
              }
            }}
            className={cn(
              'tw-flex tw-min-h-9 tw-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-border tw-px-3 tw-py-1 tw-text-ui2-sm tw-shadow-sm tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring',
              CONTROL,
              disabled && 'tw-cursor-not-allowed tw-opacity-50'
            )}
          >
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-1">
              {selectedOptions.length === 0 ? (
                <span className={cn('tw-truncate tw-py-0.5', PLACEHOLDER)}>{String(properties.placeholder ?? '')}</span>
              ) : (
                chips.map((o) => (
                  <Chip
                    key={M.keyOf(o.value)}
                    label={o.label}
                    removeLabel={`Remove ${o.label}`}
                    onRemove={disabled ? undefined : () => toggle(o)}
                  />
                ))
              )}
              {extra > 0 ? <Chip label={`+${extra} more`} /> : null}
            </div>
            {loading ? null : (
              <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
                {showClear ? <ClearButton onClear={() => commit([])} label="Clear selection" /> : null}
                <ChevronsUpDown className="tw-h-4 tw-w-4 tw-opacity-50" />
              </span>
            )}
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal container={getPortalRoot()}>
          <PopoverPrimitive.Content
            id={menuId}
            aria-label="Options"
            align="start"
            sideOffset={4}
            {...menu.contentProps}
            className={cn(
              'tw-z-[1060] tw-w-[var(--radix-popover-trigger-width)] tw-min-w-[12rem] tw-rounded-ui2-md tw-border tw-border-[color:var(--sc-border)] tw-p-0 tw-shadow-md tw-outline-none data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95',
              MENU_SURFACE
            )}
            style={lookVars(componentType, styles)}
          >
            <OptionsMenu
              multiple
              properties={properties}
              options={options}
              search={search}
              onSearch={onSearch}
              isSelected={isOn}
              isDisabled={(o, on) => M.isDisabledOption(o) || (full && !on)}
              onPick={toggle}
              top={
                showSelectAll ? (
                  <CommandGroup>
                    <CommandItem value="select-all" onSelect={toggleAll}>
                      <span
                        className={cn(
                          'tw-flex tw-h-4 tw-w-4 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-sm tw-border tw-border-[color:var(--sc-primary)]',
                          allOn
                            ? 'tw-bg-[color:var(--sc-primary)] tw-text-[color:var(--sc-primary-foreground)]'
                            : 'tw-opacity-50'
                        )}
                      >
                        {allOn ? <Check className="tw-h-3 tw-w-3" /> : null}
                      </span>
                      <span className="tw-font-medium">Select all</span>
                    </CommandItem>
                  </CommandGroup>
                ) : null
              }
              bottom={
                selectedOptions.length > 0 || limit > 0 ? (
                  <>
                    <MenuRule />
                    <CommandGroup>
                      {limit > 0 ? (
                        <div className={cn('tw-px-2 tw-py-1 tw-text-xs', MUTED)}>
                          {selectedOptions.length} of {limit} selected
                        </div>
                      ) : null}
                      {selectedOptions.length > 0 ? (
                        <CommandItem value="clear-selection" onSelect={() => commit([])} className="tw-justify-center">
                          Clear selection
                        </CommandItem>
                      ) : null}
                    </CommandGroup>
                  </>
                ) : null
              }
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </FormField>
  );
};

export default withControlState(ShadMultiselect);
