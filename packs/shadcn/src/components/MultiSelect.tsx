import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronsUpDown } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { popupLayerStyle } from '../lib/popupLayer';
import { cn } from '../lib/cn';
import {
  addKeys,
  clampLimit,
  isDisabledOption,
  keyOf,
  keptOptions,
  removeKeys,
  toChoiceOptions,
  toValueList,
  type ChoiceOption,
} from '../lib/ui2/choice/options';
import { fieldVars, lookVars, useDropRemovedChoices, useFocusEvents, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle, useFieldStyles } from '../lib/ui2/choice/fieldStyles';
import { TOKEN } from '../lib/styleDefaults';
import { Chip, ClearX, OptionsMenu, Spinner, type MenuCommand } from '../lib/ui2/choice/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import { activeElementIn } from '../lib/activeElement';
import '../styles/ui2-choice.css';

// UI 2.0's Multiselect (Ui2/Multiselect/Multiselect.tsx) on the pack's CSS: picked options as removable chips in the
// field (+N past maxVisibleChips), search, select all, a selection limit and server-side search.
const MAX_CHIPS = 50;

export const MultiSelect = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Teams' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, description?, icon?, group?, disabled? }].',
    initialValue: [
      { label: 'Design', value: 'design' },
      { label: 'Engineering', value: 'engineering' },
      { label: 'Marketing', value: 'marketing' },
      { label: 'Sales', value: 'sales' },
      { label: 'Support', value: 'support' },
    ],
  });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select teams...' });
  const [searchPlaceholder] = ToolJet.useStateString({ name: 'searchPlaceholder', label: 'Search placeholder', initialValue: 'Search teams...' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'No results text', initialValue: 'No team found.' });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: true });
  const [serverSideSearch] = ToolJet.useStateBoolean({
    name: 'serverSideSearch',
    label: 'Server-side search (options already filtered by searchText)',
    initialValue: false,
  });
  const [showClearBtn] = ToolJet.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: true });
  const [optionsLoadingState] = ToolJet.useStateBoolean({ name: 'optionsLoadingState', label: 'Options loading state', initialValue: false });
  const [defaultValue] = ToolJet.useStateArray({ name: 'defaultValue', label: 'Default values', initialValue: ['design', 'engineering'] });
  const [showSelectAll] = ToolJet.useStateBoolean({ name: 'showSelectAll', label: 'Show select all', initialValue: true });
  const [maxVisibleChips] = ToolJet.useStateNumber({ name: 'maxVisibleChips', label: 'Max visible chips (0 shows all)', initialValue: 3 });
  const [maxSelections] = ToolJet.useStateNumber({ name: 'maxSelections', label: 'Max selections (0 for no limit)', initialValue: 0 });
  // Exposed values, and the pack's earlier names (values was its default, maxSelected its limit).
  const [legacyValues, setValues] = ToolJet.useStateArray({ name: 'values', initialValue: [], inspector: 'hidden' });
  const [, setSelectedOptions] = ToolJet.useStateArray({ name: 'selectedOptions', initialValue: [], inspector: 'hidden' });
  const [, setSearchText] = ToolJet.useStateString({ name: 'searchText', initialValue: '', inspector: 'hidden' });
  const [maxSelected] = ToolJet.useStateNumber({ name: 'maxSelected', initialValue: 0, inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onSearchTextChanged = ToolJet.useEventCallback({ name: 'onSearchTextChanged' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  // onSelect is UI 2.0's one change event: the pack's earlier onChange fired alongside it.
  const styles = useFieldStyles('Accent (focus ring, checks)');
  const chipBackgroundColor = useColorStyle('chipBackgroundColor', 'Chip background', TOKEN.muted);
  const chipTextColor = useColorStyle('chipTextColor', 'Chip text color', TOKEN.text);
  const menuBackgroundColor = useColorStyle('menuBackgroundColor', 'Menu background', TOKEN.surface);
  const menuTextColor = useColorStyle('menuTextColor', 'Menu text color', TOKEN.text);
  const optionHoverColor = useColorStyle('optionHoverColor', 'Highlighted option background', TOKEN.muted);
  const chipColor = ToolJet.useStyleString({ name: 'chipColor', label: 'Chip background (earlier name)', inspector: 'hidden', initialValue: '' });
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const fieldRef = useRef<HTMLDivElement>(null);
  const options = toChoiceOptions(rawOptions);
  const limit = clampLimit(maxSelections) || clampLimit(maxSelected);
  const serverSide = serverSideSearch === true;
  const keysOf = (given: unknown) => [...new Set(toValueList(given).map(keyOf))].slice(0, limit || undefined);
  // An app saved before defaultValue existed starts on its `values` when no default is given.
  const [keys, setKeys] = useState<string[]>(() => keysOf(toValueList(defaultValue).length ? defaultValue : legacyValues));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // A new default starts the selection again, an empty one with nothing: falling back to `values` there, as on mount,
  // read back the exposed selection and kept it (SP-27). A lower limit cuts it to fit.
  useResetOn(defaultValue, () => setKeys(keysOf(defaultValue)));
  // A Form's clearForm empties what the field shows as well as what it exposes (the SDK clears only `value`).
  ToolJet.useFormClear(() => { setOpen(false); setKeys([]); publish([]); });
  useEffect(() => {
    if (limit > 0) setKeys((k) => (k.length > limit ? k.slice(0, limit) : k));
  }, [limit]);
  useDropRemovedChoices(options.map((o) => keyOf(o.value)), keys, (gone) => setKeys((k) => k.filter((x) => !gone.has(x))), serverSide);
  // With server-side search, a selected option off the current results keeps the record it had when last seen.
  const kept = useRef(new Map<string, ChoiceOption>());
  const selectedOptions = keptOptions(options, keys, serverSide ? kept.current : null);
  kept.current = new Map(selectedOptions.map((o) => [keyOf(o.value), o] as [string, ChoiceOption]));
  const values = selectedOptions.map((o) => o.value);
  useEffect(() => {
    setValues(values);
    setSelectedOptions(selectedOptions);
  }, [JSON.stringify(selectedOptions)]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = ToolJet.useValidation({ section: 'choice', value: values, present: values.length > 0 });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const publish = (next: string[]) => {
    const picked = keptOptions(options, next, serverSide ? kept.current : null);
    setValues(picked.map((o) => o.value));
    setSelectedOptions(picked);
  };
  const commit = (next: string[]) => {
    setKeys(next);
    publish(next);
    onSelect();
  };
  const onSearch = (text: string) => {
    setSearch(text);
    setSearchText(text);
    onSearchTextChanged();
  };
  // Set while a close by useOwnerGuard is under way: focus does not go back to a field that cannot take input.
  const ownerClosed = useRef(false);
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    if (next) ownerClosed.current = false;
    setOpen(next);
    focus.opened(next);
    if (!next) {
      check.touch();
      if (search) onSearch('');
    }
  };
  // An open popup closes when its owner stops taking input (disabled, or blocked or hidden by the host): the same close
  // as a dismiss (the search empties), and the field counts as left (onBlur), so the next focus is a new onFocus.
  useOwnerGuard(
    anchorRef,
    open,
    () => {
      ownerClosed.current = true;
      openChange(false);
      focus.leave();
    },
    disabled
  );
  const selectedKeys = new Set(selectedOptions.map((o) => keyOf(o.value)));
  const isOn = (o: ChoiceOption) => selectedKeys.has(keyOf(o.value));
  const full = limit > 0 && selectedOptions.length >= limit;
  const toggle = (o: ChoiceOption) => {
    const k = keyOf(o.value);
    if (isOn(o)) commit(keys.filter((x) => x !== k));
    else if (!full) commit([...keys.filter((x) => selectedKeys.has(x) || !options.length), k]);
  };
  // A chip removed from its own focused Remove button (Enter or Space) takes that button out of the page: focus goes on
  // to the Remove of the chip now in its place, else the one before, else the field, rather than to the page (SP-23).
  // Focus is read from the field's own root (a shadow root in the inline runtime); a pointer removal leaves focus where
  // it is.
  const refocusChip = useRef<number | null>(null);
  const removeChip = (o: ChoiceOption, index: number) => {
    const active = activeElementIn(fieldRef.current);
    const fromButton = !!active && active.classList.contains('uc-chip-remove') && !!fieldRef.current?.contains(active);
    toggle(o);
    refocusChip.current = fromButton ? index : null;
  };
  useLayoutEffect(() => {
    const index = refocusChip.current;
    refocusChip.current = null;
    const field = fieldRef.current;
    if (index === null || !field) return;
    const buttons = field.querySelectorAll<HTMLElement>('.uc-chip-remove');
    (buttons[Math.min(index, buttons.length - 1)] ?? field).focus();
  });
  const enabled = options.filter((o) => !isDisabledOption(o));
  const allOn = enabled.length > 0 && enabled.every(isOn);
  const toggleAll = () => {
    const enabledKeys = enabled.map((o) => keyOf(o.value));
    const enabledSet = new Set(enabledKeys);
    const keySet = new Set(keys);
    commit(allOn ? keys.filter((k) => !enabledSet.has(k)) : [...keys, ...enabledKeys.filter((k) => !keySet.has(k))]);
  };

  ToolJet.useAction({ name: 'selectOptions', displayName: 'Select options', params: [{ handle: 'values', displayName: 'Values' }] }, (v) =>
    setKeys((k) => addKeys(k, v, options, limit))
  );
  ToolJet.useAction({ name: 'deselectOptions', displayName: 'Deselect options', params: [{ handle: 'values', displayName: 'Values' }] }, (v) =>
    setKeys((k) => removeKeys(k, v))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setKeys([]));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => fieldRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    if (open) openChange(false);
    fieldRef.current?.blur();
  });
  // The pack's earlier name: replaces the selection.
  ToolJet.useAction({ name: 'setValues', displayName: 'Set values', params: [{ handle: 'values', displayName: 'Values (array)' }] }, (v) =>
    setKeys(addKeys([], v, options, limit))
  );

  const maxChips = clampLimit(maxVisibleChips);
  // Unlimited still means a field's worth: past MAX_CHIPS the rest count in the "+N" chip.
  const chips = selectedOptions.slice(0, maxChips > 0 ? Math.min(maxChips, MAX_CHIPS) : MAX_CHIPS);
  const extra = selectedOptions.length - chips.length;
  const showClear = showClearBtn !== false && selectedOptions.length > 0 && !disabled;
  const selectAll = showSelectAll !== false && limit === 0 && !search && enabled.length > 1;
  const vars = lookVars({
    ...fieldVars(styles),
    '--lk-chip-bg': chipBackgroundColor || chipColor,
    '--lk-chip-fg': chipTextColor,
    '--lk-menu-bg': menuBackgroundColor,
    '--lk-menu-fg': menuTextColor,
    '--lk-hl': optionHoverColor,
  });
  // A popup in a Dialog's body stacks above the dialog (popupLayer.ts), read off the owner as it opens.
  const popVars = open ? { ...vars, ...popupLayerStyle(anchorRef.current) } : vars;
  const menuId = fieldId ? `${fieldId}-menu` : undefined;
  const top: MenuCommand[] = selectAll ? [{ key: 'select-all', label: 'Select all', checked: allOn, onSelect: toggleAll }] : [];
  const bottom: MenuCommand[] = selectedOptions.length ? [{ key: 'clear-selection', label: 'Clear selection', center: true, onSelect: () => commit([]) }] : [];

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error} required={check.required}>
        <FieldLoading loading={loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            <Popover.Anchor asChild>
              <div
                ref={fieldRef}
                {...fieldAria(fieldId, check.error, check.required, !!description)}
                role="combobox"
                tabIndex={disabled ? -1 : 0}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={open ? menuId : undefined}
                aria-disabled={disabled || undefined}
                aria-label={label || placeholder || 'Select options'}
                {...focus.handlers}
                onClick={() => openChange(!open)}
                onKeyDown={(e) => {
                  if (disabled || e.target !== e.currentTarget) return;
                  if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    openChange(true);
                  } else if (e.key === 'Backspace' && selectedOptions.length) {
                    toggle(selectedOptions[selectedOptions.length - 1]);
                  }
                }}
                className={cn('ui-select-trigger uc-multi', disabled && 'is-disabled', loading && 'uc-is-loading')}
              >
                <div className="uc-chips">
                  {selectedOptions.length === 0 ? (
                    <span className="ui-placeholder uc-truncate">{placeholder}</span>
                  ) : (
                    chips.map((o, i) => (
                      <Chip key={keyOf(o.value)} label={o.label} removeLabel={`Remove ${o.label}`} onRemove={disabled ? undefined : () => removeChip(o, i)} />
                    ))
                  )}
                  {extra > 0 ? <Chip label={`+${extra} more`} /> : null}
                </div>
                <span className="uc-trigger-end">
                  {loading ? (
                    <Spinner />
                  ) : (
                    <>
                      {showClear ? (
                        <ClearX
                          label="Clear selection"
                          onClear={() => {
                            commit([]);
                            fieldRef.current?.focus();
                          }}
                        />
                      ) : null}
                      <ChevronsUpDown className="ui-icon-muted" />
                    </>
                  )}
                </span>
              </div>
            </Popover.Anchor>
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content
                  id={menuId}
                  aria-label="Options"
                  align="start"
                  sideOffset={4}
                  className="ui-popup uc-pop uc-pop-menu"
                  style={popVars}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  // A click on the field while open closes the menu (the field's own click), not reopens it.
                  onInteractOutside={(e) => {
                    if (e.target instanceof Node && fieldRef.current?.contains(e.target)) e.preventDefault();
                  }}
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    if (!ownerClosed.current) fieldRef.current?.focus();
                  }}
                >
                  <OptionsMenu
                    id={menuId}
                    multiple
                    options={options}
                    search={search}
                    onSearch={onSearch}
                    showSearch={showSearch !== false}
                    searchPlaceholder={searchPlaceholder || 'Search...'}
                    emptyText={emptyText || 'No results found.'}
                    loading={optionsLoadingState === true}
                    serverSideSearch={serverSide}
                    isSelected={isOn}
                    isDisabled={(o, on) => isDisabledOption(o) || (full && !on)}
                    onPick={toggle}
                    top={top}
                    bottom={bottom}
                    bottomNote={limit > 0 ? `${selectedOptions.length} of ${limit} selected` : undefined}
                  />
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
