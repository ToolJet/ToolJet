import React, { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronsUpDown } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { cn } from '../lib/cn';
import { initialKey, isDisabledOption, keyOf, keptOptions, toChoiceOptions, wantedValue, type ChoiceOption } from '../lib/ui2/choice/options';
import { fieldVars, lookVars, useDropRemovedChoices, useFocusEvents, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle, useFieldStyles } from '../lib/ui2/choice/fieldStyles';
import { ClearX, OptionIcon, OptionsMenu, Spinner } from '../lib/ui2/choice/parts';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Combobox (Ui2/Combobox/Combobox.tsx) on the pack's CSS: a searchable single select whose options can carry a
// description, an icon (a lucide or Tabler name, an image URL or an emoji) and a group heading.
export const Combobox = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Country' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [rawOptions] = ToolJet.useStateArray({
    name: 'options',
    label: 'Options',
    inspector: 'options',
    description: 'Plain values or [{ label, value, description?, icon? (IconUser, an image URL or an emoji), group?, disabled? }].',
    initialValue: [
      { label: 'United States', value: 'us', group: 'Americas' },
      { label: 'Canada', value: 'ca', group: 'Americas' },
      { label: 'United Kingdom', value: 'uk', group: 'Europe' },
      { label: 'Germany', value: 'de', group: 'Europe' },
      { label: 'India', value: 'in', group: 'Asia Pacific' },
      { label: 'Japan', value: 'jp', group: 'Asia Pacific' },
    ],
  });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select a country...' });
  const [searchPlaceholder] = ToolJet.useStateString({ name: 'searchPlaceholder', label: 'Search placeholder', initialValue: 'Search countries...' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'No results text', initialValue: 'No country found.' });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: true });
  const [serverSideSearch] = ToolJet.useStateBoolean({
    name: 'serverSideSearch',
    label: 'Server-side search (options already filtered by searchText)',
    initialValue: false,
  });
  const [showClearBtn] = ToolJet.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: true });
  const [optionsLoadingState] = ToolJet.useStateBoolean({ name: 'optionsLoadingState', label: 'Options loading state', initialValue: false });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  // Exposed values. `value` was the pack's default value: an app that set it still starts on it.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedLabel] = ToolJet.useStateString({ name: 'selectedLabel', initialValue: '', inspector: 'hidden' });
  const [, setSearchText] = ToolJet.useStateString({ name: 'searchText', initialValue: '', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onSearchTextChanged = ToolJet.useEventCallback({ name: 'onSearchTextChanged' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const styles = useFieldStyles('Accent (focus ring, checks)');
  const menuBackgroundColor = useColorStyle('menuBackgroundColor', 'Menu background');
  const menuTextColor = useColorStyle('menuTextColor', 'Menu text color');
  const optionHoverColor = useColorStyle('optionHoverColor', 'Highlighted option background');
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = toChoiceOptions(rawOptions);
  const serverSide = serverSideSearch === true;
  const [key, setKey] = useState<string | null>(() => initialKey(defaultValue) ?? initialKey(legacyValue));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  useResetOn(defaultValue, () => setKey(initialKey(defaultValue)));
  useDropRemovedChoices(options.map((o) => keyOf(o.value)), key === null ? [] : [key], () => setKey(null), serverSide);
  const kept = useRef(new Map<string, ChoiceOption>());
  const [selected] = keptOptions(options, key === null ? [] : [key], serverSide ? kept.current : null);
  kept.current = new Map(selected ? [[keyOf(selected.value), selected]] : []);

  const expose = (option: ChoiceOption | undefined) => {
    setValue((option?.value ?? '') as string);
    setSelectedOption(option ?? {});
    setSelectedLabel(option?.label ?? '');
  };
  useEffect(() => expose(selected), [key, JSON.stringify(selected)]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = ToolJet.useValidation({ section: 'choice', value: selected?.value ?? '', present: !!selected });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const onSearch = (text: string) => {
    setSearch(text);
    setSearchText(text);
    onSearchTextChanged();
  };
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    setOpen(next);
    focus.opened(next);
    if (!next) {
      check.touch();
      if (search) onSearch('');
    }
  };
  const pick = (option: ChoiceOption) => {
    setKey(keyOf(option.value));
    expose(option);
    openChange(false);
    onSelect();
  };
  const clear = () => {
    setKey(null);
    expose(undefined);
    check.touch();
    onSelect();
  };
  const selectByValue = (v: unknown) => {
    const wanted = wantedValue(v);
    if (wanted === undefined || wanted === null || typeof wanted === 'object') return;
    const option = options.find((o) => keyOf(o.value) === keyOf(wanted));
    if (!option || isDisabledOption(option)) return;
    setKey(keyOf(wanted));
    expose(option);
    onSelect();
  };
  ToolJet.useAction({ name: 'selectOption', displayName: 'Select option', params: [{ handle: 'value', displayName: 'Value' }] }, selectByValue);
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setKey(null));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    if (open) openChange(false);
    triggerRef.current?.blur();
  });
  // The pack's earlier name for selectOption.
  ToolJet.useAction({ name: 'setValue', displayName: 'Select option (value)', params: [{ handle: 'value', displayName: 'Value' }] }, selectByValue);

  const showClear = showClearBtn !== false && !!selected && !disabled;
  const vars = lookVars({ ...fieldVars(styles), '--lk-menu-bg': menuBackgroundColor, '--lk-menu-fg': menuTextColor, '--lk-hl': optionHoverColor });
  const menuId = fieldId ? `${fieldId}-menu` : undefined;

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error} required={check.required}>
        <FieldLoading loading={loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            <div className="uc-wrap">
              <Popover.Trigger
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                aria-label={label ? undefined : placeholder || 'Select an option'}
                disabled={disabled}
                {...fieldAria(fieldId, check.error, check.required, !!description)}
                {...focus.handlers}
                className={cn('ui-select-trigger uc-trigger', showClear && 'has-clear', loading && 'uc-is-loading')}
              >
                <span className={cn('uc-trigger-value', !selected && 'ui-placeholder')}>
                  {selected ? <OptionIcon icon={selected.icon} /> : null}
                  <span className="uc-truncate">{selected ? selected.label : placeholder}</span>
                </span>
                {loading ? <Spinner /> : <ChevronsUpDown className="ui-icon-muted" />}
              </Popover.Trigger>
              {showClear && !loading ? <ClearX label="Clear selection" className="uc-clear-at before-chevron" onClear={clear} /> : null}
            </div>
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content
                  id={menuId}
                  aria-label="Options"
                  align="start"
                  sideOffset={4}
                  className="ui-popup uc-pop uc-pop-menu"
                  style={vars}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <OptionsMenu
                    id={menuId}
                    options={options}
                    search={search}
                    onSearch={onSearch}
                    showSearch={showSearch !== false}
                    searchPlaceholder={searchPlaceholder || 'Search...'}
                    emptyText={emptyText || 'No results found.'}
                    loading={optionsLoadingState === true}
                    serverSideSearch={serverSide}
                    isSelected={(o) => !!selected && keyOf(o.value) === key}
                    isDisabled={(o) => isDisabledOption(o)}
                    onPick={pick}
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
