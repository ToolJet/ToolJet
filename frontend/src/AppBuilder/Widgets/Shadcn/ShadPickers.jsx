import React, { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { useDropzone } from 'react-dropzone';
import {
  Check,
  ChevronsUpDown,
  Circle,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Heart,
  Pipette,
  Search,
  Star,
  Upload,
  X,
} from 'lucide-react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { createFileFieldRef, registerFileHandle, releaseFileHandle } from '@/AppBuilder/_utils/fileHandleRegistry';
import { CONTROL, Field, Shell, Spinner, busy, useValidation, useValue } from './Shadcn';
import { list, toOptions, useAutoHeight, useExposed } from '../packHooks';
import { Badge, Button, Input, Popover, PopoverContent, PopoverTrigger, cn, getPortalRoot } from './ui';
import { lookVars } from './shadcnLook';
import * as M from './pickersModel';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack (experiment): the pickers widgets. Combobox and Multiselect are shadcn's Popover + Command (cmdk)
// recipe; Tags input, Color picker and Rating follow shadcn's field look; File upload is react-dropzone in shadcn
// styling. Pure logic lives in pickersModel.js, style variables in looks/pickers.js.

// ---- Shared pieces -------------------------------------------------------------------------------------------------

const PLACEHOLDER = 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';
const MUTED = 'text-[color:var(--sc-muted-foreground)]';
const MENU_SURFACE =
  'bg-[color:var(--lk-menu-bg,var(--sc-popover))] text-[color:var(--lk-menu-fg,var(--sc-popover-foreground))]';
const CHIP =
  'bg-[color:var(--lk-chip-bg,var(--sc-secondary))] text-[color:var(--lk-chip-fg,var(--sc-secondary-foreground))]';
// A small icon button inside a field (remove a chip, clear): p-0 and no border keep ToolJet's global button styles out.
const ICON_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-sm border-0 bg-transparent p-0.5 opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring';

const isText = (v) => typeof v === 'string' || typeof v === 'number';
/** Keeps a pointer press on a control inside a trigger from opening or closing the trigger's menu. */
const stopPress = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

// shadcn's Command (new-york), on cmdk. Items size their own icons (no [&_svg]:size-4: it would outrank them).
const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent text-inherit', className)}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-[color:var(--sc-border)] px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border-0 bg-transparent px-0 py-3 text-sm text-inherit shadow-none outline-none placeholder:text-[color:var(--sc-muted-foreground)] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[color:var(--sc-muted-foreground)]',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

const CommandSeparator = ({ className, ...props }) => (
  <CommandPrimitive.Separator className={cn('-mx-1 h-px bg-[color:var(--sc-border)]', className)} {...props} />
);

const CommandItem = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-[color:var(--lk-hl,var(--sc-accent))] data-[selected=true]:text-[color:var(--lk-menu-fg,var(--sc-accent-foreground))]',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

/** An option's icon: a Tabler icon name (IconUser), an image URL, or text such as an emoji. */
const OptionIcon = ({ icon }) => {
  if (typeof icon !== 'string' || !icon.trim()) return null;
  if (/^(https?:|data:image\/|\/)/.test(icon)) {
    return <img src={icon} alt="" className="h-4 w-4 shrink-0 rounded-sm object-cover" />;
  }
  if (/^Icon[A-Z0-9]/.test(icon)) {
    return <TablerIcon iconName={icon} style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} stroke={1.75} />;
  }
  return (
    <span aria-hidden className="w-4 shrink-0 text-center leading-none">
      {icon.slice(0, 4)}
    </span>
  );
};

const OptionText = ({ option }) => (
  <span className="flex min-w-0 flex-1 flex-col">
    <span className="truncate">{option.label}</span>
    {isText(option.description) && String(option.description) ? (
      <span className={cn('truncate text-xs', MUTED)}>{String(option.description)}</span>
    ) : null}
  </span>
);

/** The search text of an options menu: kept locally, exposed as searchText, with onSearchTextChanged. */
const useSearch = ({ setExposedVariable, fireEvent }) => {
  const [search, setSearch] = useState('');
  const change = (text) => {
    setSearch(text);
    setExposedVariable('searchText', text);
    fireEvent('onSearchTextChanged');
  };
  return [search, change];
};

/** The options list of Combobox and Multiselect: search box, grouped options (filtered here unless the author
 *  filters them server-side), an empty or loading state, and optional rows before (`top`) and after (`bottom`). Items
 *  are keyed by position, so an option valued '' or two options with the same label stay distinct. */
const OptionsMenu = ({
  properties,
  options,
  search,
  onSearch,
  isSelected,
  isDisabled,
  onPick,
  multiple,
  top,
  bottom,
}) => {
  const entries =
    properties.serverSideSearch === true
      ? options.map((option, index) => ({ option, index }))
      : M.filterOptions(options, search);
  const groups = M.groupOptions(entries);
  return (
    <Command shouldFilter={false} loop>
      {properties.showSearch !== false ? (
        <CommandInput
          value={search}
          onValueChange={onSearch}
          placeholder={String(properties.searchPlaceholder ?? 'Search...')}
        />
      ) : null}
      <CommandList>
        {properties.optionsLoadingState === true ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className={cn('py-6 text-center text-sm', MUTED)}>
            {String(properties.emptyText ?? 'No results found.')}
          </div>
        ) : (
          <>
            {top}
            {groups.map((group, gi) => (
              <CommandGroup key={`g${gi}`} heading={group.heading || undefined}>
                {group.items.map(({ option, index }) => {
                  const on = isSelected(option);
                  return (
                    <CommandItem
                      key={`o${index}`}
                      value={`o${index}`}
                      disabled={isDisabled(option, on)}
                      onSelect={() => onPick(option)}
                      data-checked={on || undefined}
                    >
                      {multiple ? (
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[color:var(--sc-primary)]',
                            on ? 'bg-[color:var(--sc-primary)] text-[color:var(--sc-primary-foreground)]' : 'opacity-50'
                          )}
                        >
                          {on ? <Check className="h-3 w-3" /> : null}
                        </span>
                      ) : null}
                      <OptionIcon icon={option.icon} />
                      <OptionText option={option} />
                      {!multiple ? (
                        <Check className={cn('ml-auto h-4 w-4 shrink-0', on ? 'opacity-100' : 'opacity-0')} />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {bottom}
          </>
        )}
      </CommandList>
    </Command>
  );
};

const ClearButton = ({ onClear, label = 'Clear' }) => (
  <button
    type="button"
    aria-label={label}
    className={ICON_BUTTON}
    onPointerDown={stopPress}
    onClick={(e) => {
      e.stopPropagation();
      onClear();
    }}
  >
    <X className="h-3.5 w-3.5" />
  </button>
);

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
  const [search, onSearch] = useSearch(props);
  const selected = key === null ? undefined : options.find((o) => M.keyOf(o.value) === key);
  const value = selected ? selected.value : '';
  useExposed(setExposedVariables, properties, {
    value,
    selectedOption: selected || {},
    searchText: search,
    options,
    selectOption: async (v) => setKey(v === undefined || v === null ? null : M.keyOf(v)),
    clear: async () => setKey(null),
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
    fireEvent('onChange');
  };
  const clear = () => {
    setKey(null);
    setExposedVariables({ value: '', selectedOption: {} });
    check.touch();
    fireEvent('onChange');
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
                id={`shad-${id}`}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-invalid={!!check.error || undefined}
                disabled={disabled}
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

// ---- Multiselect ---------------------------------------------------------------------------------------------------

/** A field that anchors a popover without being its trigger button (it holds chips with their own buttons): opens on
 *  click, Enter, Space or ArrowDown; a click on it while open closes the menu instead of reopening it. */
const useAnchoredMenu = (disabled, onClose) => {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const change = (next) => {
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
      'aria-haspopup': 'listbox',
      'aria-disabled': disabled || undefined,
      onClick: () => change(!open),
    },
    contentProps: {
      onInteractOutside: (e) => {
        if (anchorRef.current?.contains(e.target)) e.preventDefault();
      },
      onCloseAutoFocus: (e) => {
        e.preventDefault();
        anchorRef.current?.focus();
      },
    },
  };
};

const Chip = ({ label, onRemove, removeLabel }) => (
  <Badge variant="secondary" className={cn('max-w-full gap-1 font-normal', onRemove && 'pr-1', CHIP)}>
    <span className="max-w-[12rem] truncate">{label}</span>
    {onRemove ? (
      <button
        type="button"
        aria-label={removeLabel}
        className={ICON_BUTTON}
        onPointerDown={stopPress}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    ) : null}
  </Badge>
);

export const ShadMultiselect = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const options = toOptions(properties.options);
  const limit = M.clampLimit(properties.maxSelections);
  const initial = M.toValueList(properties.defaultValue)
    .map(M.keyOf)
    .filter((k, i, all) => all.indexOf(k) === i)
    .slice(0, limit || undefined);
  const initialKey = M.stableKey(initial);
  const [keys, setKeys] = useState(initial);
  useEffect(() => setKeys(initial), [initialKey]); // eslint-disable-line react-hooks/exhaustive-deps
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
    selectOptions: async (v) => setKeys((k) => M.addKeys(k, v, latest.current.options, latest.current.limit)),
    deselectOptions: async (v) => setKeys((k) => M.removeKeys(k, v)),
    clear: async () => setKeys([]),
  });
  const publish = (next) => {
    const picked = M.selectedOf(options, next);
    setExposedVariables({ values: picked.map((o) => o.value), selectedOptions: picked });
  };
  const check = useValidation(props, M.validationInput(values.length > 0, values), () => {
    setKeys([]);
    publish([]);
  });
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const menu = useAnchoredMenu(disabled, () => {
    check.touch();
    if (search) onSearch('');
  });
  const commit = (next) => {
    setKeys(next);
    publish(next);
    fireEvent('onSelect');
    fireEvent('onChange');
  };
  const selectedKeys = new Set(selectedOptions.map((o) => M.keyOf(o.value)));
  const isOn = (o) => selectedKeys.has(M.keyOf(o.value));
  const full = limit > 0 && selectedOptions.length >= limit;
  const toggle = (o) => {
    const k = M.keyOf(o.value);
    if (isOn(o)) commit(keys.filter((x) => x !== k));
    else if (!full) commit([...keys.filter((x) => selectedKeys.has(x) || !options.length), k]);
  };
  const enabled = options.filter((o) => !M.isDisabledOption(o));
  const allOn = enabled.length > 0 && enabled.every(isOn);
  const toggleAll = () => {
    const enabledKeys = enabled.map((o) => M.keyOf(o.value));
    commit(
      allOn ? keys.filter((k) => !enabledKeys.includes(k)) : [...keys, ...enabledKeys.filter((k) => !keys.includes(k))]
    );
  };
  const maxChips = M.clampLimit(properties.maxVisibleChips);
  const chips = maxChips > 0 ? selectedOptions.slice(0, maxChips) : selectedOptions;
  const extra = selectedOptions.length - chips.length;
  const showClear = properties.showClearBtn !== false && selectedOptions.length > 0 && !disabled;
  const showSelectAll = properties.showSelectAll !== false && limit === 0 && !search && enabled.length > 1;
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <PopoverPrimitive.Root open={menu.open} onOpenChange={menu.change}>
          <PopoverPrimitive.Anchor asChild>
            <div
              {...menu.anchorProps}
              id={`shad-${id}`}
              role="combobox"
              aria-invalid={!!check.error || undefined}
              onKeyDown={(e) => {
                if (disabled) return;
                if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                  menu.change(true);
                } else if (e.key === 'Backspace' && selectedOptions.length) {
                  toggle(selectedOptions[selectedOptions.length - 1]);
                }
              }}
              className={cn(
                'flex min-h-9 w-full cursor-pointer items-center gap-2 border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                CONTROL,
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {selectedOptions.length === 0 ? (
                  <span className={cn('truncate py-0.5', PLACEHOLDER)}>{String(properties.placeholder ?? '')}</span>
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
                <span className="flex shrink-0 items-center gap-1">
                  {showClear ? <ClearButton onClear={() => commit([])} label="Clear selection" /> : null}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </span>
              )}
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal container={getPortalRoot()}>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              {...menu.contentProps}
              className={cn(
                'z-[1060] w-[var(--radix-popover-trigger-width)] min-w-[12rem] rounded-md border border-[color:var(--sc-border)] p-0 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
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
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[color:var(--sc-primary)]',
                            allOn
                              ? 'bg-[color:var(--sc-primary)] text-[color:var(--sc-primary-foreground)]'
                              : 'opacity-50'
                          )}
                        >
                          {allOn ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="font-medium">Select all</span>
                      </CommandItem>
                    </CommandGroup>
                  ) : null
                }
                bottom={
                  selectedOptions.length > 0 || limit > 0 ? (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        {limit > 0 ? (
                          <div className={cn('px-2 py-1 text-xs', MUTED)}>
                            {selectedOptions.length} of {limit} selected
                          </div>
                        ) : null}
                        {selectedOptions.length > 0 ? (
                          <CommandItem value="clear-selection" onSelect={() => commit([])} className="justify-center">
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
      </Field>
    </Shell>
  );
};

// ---- Tags input ----------------------------------------------------------------------------------------------------

export const ShadTagsInput = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const inputRef = useRef(null);
  const anchorRef = useRef(null);
  const rules = {
    maxTags: properties.maxTags,
    caseSensitive: properties.caseSensitive === true,
    pattern: properties.tagPattern,
    patternError: properties.patternError,
  };
  const initial = M.addTags([], M.toTags(properties.defaultValue), rules).tags;
  const initialKey = M.stableKey(initial);
  const [tags, setTags] = useState(initial);
  useEffect(() => setTags(initial), [initialKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [text, setText] = useState('');
  const [tagError, setTagError] = useState('');
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const rulesRef = useRef(rules);
  rulesRef.current = rules;
  useExposed(setExposedVariables, properties, {
    tags,
    value: tags,
    setTags: async (t) => setTags(M.addTags([], M.toTags(t), rulesRef.current).tags),
    clear: async () => setTags([]),
  });
  const check = useValidation(props, M.validationInput(tags.length > 0, tags), () => {
    setTags([]);
    setExposedVariables({ tags: [], value: [] });
  });
  const disabled = busy(properties);
  const suggestions = toOptions(properties.suggestions).map((o) => ({ label: o.label, tag: String(o.value) }));
  const query = text.trim().toLowerCase();
  const visible = suggestions
    .filter(
      (s) =>
        !tags.some((t) => M.sameTag(t, s.tag, rules.caseSensitive)) &&
        (!query || s.label.toLowerCase().includes(query) || s.tag.toLowerCase().includes(query))
    )
    .slice(0, 50);
  const menuOpen = focused && !dismissed && !disabled && visible.length > 0;

  const commit = (next, event, tag) => {
    setTags(next);
    setExposedVariables({
      tags: next,
      value: next,
      ...(event === 'onTagAdded' ? { lastAddedTag: tag } : { lastRemovedTag: tag }),
    });
    fireEvent(event);
    fireEvent('onChange');
  };
  /** Adds typed or picked tags; true when at least one was added. */
  const add = (candidates) => {
    let wanted = M.toTags(candidates);
    if (properties.allowCustomTags === false) {
      const known = wanted
        .map((c) => suggestions.find((s) => M.sameTag(s.tag, c) || M.sameTag(s.label, c))?.tag)
        .filter(Boolean);
      if (known.length < wanted.length) setTagError('Pick a tag from the suggestions');
      wanted = known;
      if (!wanted.length) return false;
    }
    const result = M.addTags(tags, wanted, rules);
    if (result.error || properties.allowCustomTags !== false) setTagError(result.error);
    if (result.added.length) commit(result.tags, 'onTagAdded', result.added[result.added.length - 1]);
    setActive(-1);
    return result.added.length > 0;
  };
  const remove = (index) => {
    const tag = tags[index];
    if (tag === undefined) return;
    setTagError('');
    commit(
      tags.filter((_, i) => i !== index),
      'onTagRemoved',
      tag
    );
  };
  const onChange = (e) => {
    setTagError('');
    setDismissed(false);
    const { parts, rest } = M.splitTyped(e.target.value);
    if (parts.length) add(parts);
    setText(rest);
    setActive(-1);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (menuOpen && active >= 0 && visible[active]) {
        if (add([visible[active].tag])) setText('');
      } else if (text.trim() && add([text])) setText('');
    } else if (e.key === 'Backspace' && text === '' && tags.length) {
      remove(tags.length - 1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!visible.length) return;
      e.preventDefault();
      setDismissed(false);
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + dir + visible.length + (i < 0 && dir < 0 ? 1 : 0)) % visible.length);
    } else if (e.key === 'Escape') {
      setDismissed(true);
      setActive(-1);
    }
  };
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={tagError || check.error}
        required={check.required}
      >
        <PopoverPrimitive.Root open={menuOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div
              ref={anchorRef}
              onClick={() => inputRef.current?.focus()}
              className={cn(
                'flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 border px-2 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
                CONTROL,
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {tags.map((tag, i) => (
                <Chip
                  key={`${tag}-${i}`}
                  label={tag}
                  removeLabel={`Remove ${tag}`}
                  onRemove={disabled ? undefined : () => remove(i)}
                />
              ))}
              <input
                ref={inputRef}
                id={`shad-${id}`}
                type="text"
                role="combobox"
                aria-expanded={menuOpen}
                aria-autocomplete="list"
                aria-invalid={!!(tagError || check.error) || undefined}
                autoComplete="off"
                value={text}
                disabled={disabled}
                placeholder={String(properties.placeholder ?? '')}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  setFocused(true);
                  setDismissed(false);
                }}
                onBlur={() => {
                  setFocused(false);
                  setActive(-1);
                  check.touch();
                  if (properties.addOnBlur === true && text.trim() && add([text])) setText('');
                }}
                className={cn(
                  'h-7 min-w-[6rem] flex-1 border-0 bg-transparent px-1 py-0 text-sm text-[color:var(--lk-fg,var(--sc-foreground))] shadow-none outline-none focus:outline-none focus:ring-0 disabled:cursor-not-allowed',
                  'placeholder:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
                )}
              />
              {properties.showClearBtn === true && tags.length && !disabled && !properties.loadingState ? (
                <ClearButton
                  label="Clear tags"
                  onClear={() => {
                    setTagError('');
                    commit([], 'onTagRemoved', tags[tags.length - 1]);
                  }}
                />
              ) : null}
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal container={getPortalRoot()}>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                if (anchorRef.current?.contains(e.target)) e.preventDefault();
                else setDismissed(true);
              }}
              onEscapeKeyDown={() => setDismissed(true)}
              className={cn(
                'z-[1060] max-h-60 w-[var(--radix-popover-trigger-width)] min-w-[10rem] overflow-y-auto rounded-md border border-[color:var(--sc-border)] p-1 shadow-md outline-none',
                MENU_SURFACE
              )}
              style={lookVars(componentType, styles)}
            >
              <div role="listbox" aria-label="Suggestions">
                {visible.map((s, i) => (
                  <div
                    key={`${s.tag}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    data-selected={i === active || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      if (add([s.tag])) setText('');
                      inputRef.current?.focus();
                    }}
                    className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected]:bg-[color:var(--lk-hl,var(--sc-accent))] data-[selected]:text-[color:var(--lk-menu-fg,var(--sc-accent-foreground))]"
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </Field>
    </Shell>
  );
};

// ---- Color picker --------------------------------------------------------------------------------------------------

const CHECKERBOARD = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 50% / 8px 8px';
/** A swatch's fill: the colour over a checkerboard when it is see-through. */
const swatchStyle = (hex) => {
  if (!hex) return undefined;
  return hex.length === 9 ? { background: `linear-gradient(${hex}, ${hex}), ${CHECKERBOARD}` } : { background: hex };
};
const toHsva = (hex, keepHue) => {
  const c = M.hexToRgba(hex);
  if (!c) return { h: keepHue ?? 0, s: 0, v: 1, a: 1 };
  const hsv = M.rgbToHsv(c);
  return { ...hsv, h: (hsv.s === 0 || hsv.v === 0) && keepHue !== undefined ? keepHue : hsv.h, a: c.a };
};
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const THUMB =
  'pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.3)]';
const SLIDER_FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

/** Pointer dragging over an element: onMove({ x, y }) with both from 0 to 1, onEnd when released. */
const useDrag = (onMove, onEnd) => {
  const el = useRef(null);
  const at = (e) => {
    const r = el.current?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 };
    return {
      x: r.width ? clamp01((e.clientX - r.left) / r.width) : 0,
      y: r.height ? clamp01((e.clientY - r.top) / r.height) : 0,
    };
  };
  return {
    ref: el,
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.focus?.();
      onMove(at(e));
    },
    onPointerMove: (e) => {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) onMove(at(e));
    },
    onPointerUp: (e) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      onEnd();
    },
  };
};

export const ShadColorPicker = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const alpha = properties.allowAlpha === true;
  const initial = M.normalizeHex(properties.defaultValue, alpha) || '';
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const [open, setOpen] = useState(false);
  const [hsva, setHsvaState] = useState(() => toHsva(initial));
  const hsvaRef = useRef(hsva);
  const [draft, setDraft] = useState(initial);
  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;
  useExposed(setExposedVariables, properties, {
    value,
    ...M.colorForms(value),
    setColor: async (c) => {
      if (c === '' || c === null || c === undefined) return setValue('');
      const hex = M.normalizeHex(c, alphaRef.current);
      if (hex) setValue(hex);
    },
  });
  const hexOf = (c) => M.rgbaToHex({ ...M.hsvToRgb(c), a: c.a }, alpha);
  const live = open ? hexOf(hsva) : value;
  const setHsva = (next) => {
    hsvaRef.current = next;
    setHsvaState(next);
    setDraft(hexOf(next));
  };
  const commit = (hex) => {
    if (!hex || hex === value) return;
    setValue(hex);
    setExposedVariables({ value: hex, ...M.colorForms(hex) });
    fireEvent('onChange');
  };
  const pickHex = (hex) => {
    setHsva(toHsva(hex, hsvaRef.current.h));
    setDraft(hex);
    commit(hex);
  };
  const applyDraft = () => {
    const hex = M.normalizeHex(draft, alpha);
    if (hex) pickHex(hex);
    else setDraft(value);
  };
  const openChange = (next) => {
    if (next && busy(properties)) return;
    if (next) {
      const start = toHsva(value);
      hsvaRef.current = start;
      setHsvaState(start);
      setDraft(value);
    }
    setOpen(next);
  };
  const commitLive = () => commit(hexOf(hsvaRef.current));
  const area = useDrag(({ x, y }) => setHsva({ ...hsvaRef.current, s: x, v: 1 - y }), commitLive);
  const hue = useDrag(({ x }) => setHsva({ ...hsvaRef.current, h: x * 360 }), commitLive);
  const alphaBar = useDrag(({ x }) => setHsva({ ...hsvaRef.current, a: Math.round(x * 100) / 100 }), commitLive);
  /** Arrow keys on a slider: change one channel by a step (ten steps with Shift) and commit. */
  const keys = (channel, step, min, max) => (e) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const c = hsvaRef.current;
    const delta = dir * step * (e.shiftKey ? 10 : 1);
    const next = { ...c, [channel]: Math.max(min, Math.min(max, c[channel] + delta)) };
    setHsva(next);
    commit(hexOf(next));
  };
  const areaKeys = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') return keys('v', 0.01, 0, 1)(e);
    return keys('s', 0.01, 0, 1)(e);
  };
  const swatches = M.toSwatches(properties.swatches);
  const opaque = M.rgbaToHex(M.hsvToRgb(hsva), false);
  const canEyeDrop = typeof window !== 'undefined' && typeof window.EyeDropper === 'function';
  const eyeDrop = async () => {
    try {
      const result = await new window.EyeDropper().open();
      const hex = M.normalizeHex(result?.sRGBHex, alpha);
      if (hex) pickHex(hex);
    } catch {
      // cancelled
    }
  };
  const swatchOnly = properties.triggerStyle === 'swatch';
  const disabled = busy(properties);
  return (
    <Shell {...props} innerRef={ref}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <Button
              id={`shad-${id}`}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={swatchOnly ? `Color ${value || 'not set'}` : undefined}
              className={cn(
                'font-normal',
                CONTROL,
                swatchOnly ? 'h-9 w-9 p-1.5' : 'w-full justify-start gap-2 px-3',
                swatchOnly && 'shrink-0'
              )}
            >
              <span
                className={cn(
                  'shrink-0 rounded-[calc(var(--sc-radius)-4px)] border border-[color:var(--sc-border)] shadow-sm',
                  swatchOnly ? 'h-full w-full' : 'h-5 w-5',
                  !live && 'border-dashed'
                )}
                style={swatchStyle(live)}
              />
              {swatchOnly ? null : (
                <span className={cn('truncate', live ? 'uppercase tabular-nums' : PLACEHOLDER)}>
                  {live || String(properties.placeholder ?? '')}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={cn('flex w-64 flex-col gap-3 p-3', MENU_SURFACE)}
            style={lookVars(componentType, styles)}
          >
            {properties.showPicker !== false ? (
              <>
                <div
                  {...area}
                  role="slider"
                  tabIndex={0}
                  aria-label="Saturation and brightness"
                  aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
                  onKeyDown={areaKeys}
                  className={cn(
                    'relative h-36 w-full cursor-crosshair touch-none rounded-[calc(var(--sc-radius)-2px)]',
                    SLIDER_FOCUS
                  )}
                  style={{
                    background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, hsl(${Math.round(
                      hsva.h
                    )} 100% 50%))`,
                  }}
                >
                  <span
                    className={THUMB}
                    style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: opaque }}
                  />
                </div>
                <div
                  {...hue}
                  role="slider"
                  tabIndex={0}
                  aria-label="Hue"
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={Math.round(hsva.h)}
                  onKeyDown={keys('h', 1, 0, 360)}
                  className={cn('relative h-3 w-full cursor-pointer touch-none rounded-full', SLIDER_FOCUS)}
                  style={{
                    background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                  }}
                >
                  <span
                    className={cn(THUMB, 'top-1/2')}
                    style={{ left: `${(hsva.h / 360) * 100}%`, background: `hsl(${Math.round(hsva.h)} 100% 50%)` }}
                  />
                </div>
                {alpha ? (
                  <div
                    {...alphaBar}
                    role="slider"
                    tabIndex={0}
                    aria-label="Opacity"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(hsva.a * 100)}
                    onKeyDown={keys('a', 0.01, 0, 1)}
                    className={cn('relative h-3 w-full cursor-pointer touch-none rounded-full', SLIDER_FOCUS)}
                    style={{ background: `linear-gradient(to right, transparent, ${opaque}), ${CHECKERBOARD}` }}
                  >
                    <span className={cn(THUMB, 'top-1/2')} style={{ left: `${hsva.a * 100}%`, background: opaque }} />
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 shrink-0 rounded-[calc(var(--sc-radius)-2px)] border border-[color:var(--sc-border)] shadow-sm"
                style={swatchStyle(live)}
              />
              <Input
                aria-label="Hex color"
                spellCheck={false}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={applyDraft}
                onKeyDown={(e) => e.key === 'Enter' && applyDraft()}
                className="h-8 border-[color:var(--sc-input)] font-mono text-xs uppercase"
              />
              {canEyeDrop ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Pick a color from the screen"
                  onClick={eyeDrop}
                >
                  <Pipette />
                </Button>
              ) : null}
            </div>
            {properties.showSwatches !== false && swatches.length ? (
              <div className="grid grid-cols-8 gap-1.5">
                {swatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    aria-pressed={c === value}
                    onClick={() => pickHex(M.normalizeHex(c, alpha))}
                    className="relative aspect-square w-full rounded-[calc(var(--sc-radius)-4px)] border border-[color:var(--sc-border)] p-0 shadow-sm outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    style={swatchStyle(c)}
                  >
                    {c === value ? (
                      <Check className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: M.contrastOn(c) }} />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

// ---- Rating --------------------------------------------------------------------------------------------------------

const RATING_SIZES = { sm: 16, default: 20, lg: 28 };
const RATING_ICONS = { star: Star, heart: Heart, circle: Circle };
// Filled icons: the filledColor style, else a colour that suits the icon (amber stars, red hearts, primary dots).
const FILLED = {
  star: 'fill-[color:var(--lk-on,var(--sc-warning))] text-[color:var(--lk-on,var(--sc-warning))]',
  heart: 'fill-[color:var(--lk-on,var(--sc-destructive))] text-[color:var(--lk-on,var(--sc-destructive))]',
  circle: 'fill-[color:var(--lk-on,var(--sc-primary))] text-[color:var(--lk-on,var(--sc-primary))]',
};
const EMPTY =
  'fill-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))] text-[color:var(--lk-off,color-mix(in_srgb,var(--sc-muted-foreground)_22%,transparent))]';

export const ShadRating = (props) => {
  const { properties, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const max = M.clampMax(properties.max);
  const half = properties.allowHalf === true;
  const limits = useRef({ max, half });
  limits.current = { max, half };
  const [stored, change] = useValue(props, M.normalizeRating(properties.defaultValue, max, half), (set) => ({
    setValue: async (v) => set(M.normalizeRating(v, limits.current.max, limits.current.half)),
    clear: async () => set(0),
  }));
  const value = Math.min(Number(stored) || 0, max);
  const check = useValidation(props, M.validationInput(value > 0, value), () => change(0));
  const [hover, setHover] = useState(null);
  const radios = useRef([]);
  const readOnly = properties.readOnly === true;
  const interactive = !readOnly && !busy(properties);
  const shown = interactive && hover !== null ? hover : value;
  const kind = RATING_ICONS[properties.icon] ? properties.icon : 'star';
  const Icon = RATING_ICONS[kind];
  const size = RATING_SIZES[properties.size] || RATING_SIZES.default;
  const labels = list(properties.valueLabels).map((l) => (isText(l) ? String(l) : ''));
  const setTo = (next) => {
    if (next !== value) change(next);
    check.touch();
  };
  const pointAt = (e, position) => {
    const r = e.currentTarget.getBoundingClientRect?.();
    return half && r?.width && e.clientX - r.left < r.width / 2 ? position - 0.5 : position;
  };
  const onKeyDown = (e) => {
    if (!interactive) return;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = M.stepRating(value, 1, max, half);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = M.stepRating(value, -1, max, half);
    else if (e.key === 'Home') next = half ? 0.5 : 1;
    else if (e.key === 'End') next = max;
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= max) next = Number(e.key);
    else if (['0', 'Delete', 'Backspace'].includes(e.key) && properties.allowClear !== false) next = 0;
    if (next === null) return;
    e.preventDefault();
    setTo(next);
    radios.current[Math.max(1, Math.ceil(next)) - 1]?.focus();
  };
  const focusable = Math.max(1, Math.ceil(value));
  const valueText = shown > 0 ? labels[Math.ceil(shown) - 1] || `${shown} / ${max}` : labels.length ? '' : `0 / ${max}`;
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <div className="flex items-center gap-2">
          <div
            id={`shad-${id}`}
            role="radiogroup"
            aria-label={isText(properties.label) && properties.label ? String(properties.label) : 'Rating'}
            aria-readonly={readOnly || undefined}
            aria-disabled={busy(properties) || undefined}
            className={cn('inline-flex items-center', size >= 28 ? 'gap-1.5' : 'gap-1')}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: max }, (_, i) => {
              const position = i + 1;
              const fill = M.iconFill(position, shown);
              return (
                <span
                  key={position}
                  ref={(el) => (radios.current[i] = el)}
                  role="radio"
                  aria-checked={Math.ceil(value) === position}
                  aria-label={labels[i] || `${position} of ${max}`}
                  tabIndex={interactive && position === focusable ? 0 : -1}
                  onKeyDown={onKeyDown}
                  onMouseMove={interactive ? (e) => setHover(pointAt(e, position)) : undefined}
                  onClick={
                    interactive
                      ? (e) => {
                          const next = pointAt(e, position);
                          setHover(null);
                          setTo(next === value && properties.allowClear !== false ? 0 : next);
                        }
                      : undefined
                  }
                  className={cn(
                    'relative inline-flex shrink-0 rounded-sm outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    interactive && 'cursor-pointer hover:scale-110'
                  )}
                  style={{ width: size, height: size }}
                >
                  <Icon
                    className={cn('absolute inset-0', fill === 'full' ? FILLED[kind] : EMPTY)}
                    style={{ width: size, height: size }}
                    strokeWidth={1.5}
                  />
                  {fill === 'half' ? (
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Icon
                        className={cn('absolute left-0 top-0', FILLED[kind])}
                        style={{ width: size, height: size }}
                        strokeWidth={1.5}
                      />
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
          {properties.showValue === true && valueText ? (
            <span className="text-sm tabular-nums text-[color:var(--lk-value,var(--sc-muted-foreground))]">
              {valueText}
            </span>
          ) : null}
        </div>
      </Field>
    </Shell>
  );
};

// ---- File upload ---------------------------------------------------------------------------------------------------

const KIND_ICONS = {
  image: FileImage,
  pdf: FileText,
  sheet: FileSpreadsheet,
  text: FileText,
  archive: FileArchive,
  audio: FileAudio,
  video: FileVideo,
  other: FileIcon,
};

const readAs = (file, how) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader[how](file);
  });

let handleSeq = 0;
/** Reads a file the native File picker's way: text content, base64 and data URL, held in the file-handle registry
 *  (the store gets light string-like refs), plus parsed rows for CSV/TSV/Excel/JSON when parsing is on. */
const readFile = async (file, { parse, parseFileType, delimiter }) => {
  const dataURL = await readAs(file, 'readAsDataURL');
  const content = await readAs(file, 'readAsText');
  const base64Data = dataURL.split(',')[1] || '';
  let parsedData = null;
  if (parse) {
    try {
      const fp = await import('@/AppBuilder/Widgets/FilePicker/helpers/fileProcessing');
      const type = parseFileType || 'auto-detect';
      if (fp.parseFileContentEnabled(file, type === 'auto-detect', type)) {
        parsedData = await fp.processFileContent(
          file.type,
          { readFileAsText: content, readFileAsDataURL: base64Data },
          { fileParsingDelimiter: delimiter || ',', fileTypeFromExtension: type }
        );
      }
    } catch {
      parsedData = null;
    }
  }
  handleSeq += 1;
  const handle = `shad-file-${Date.now().toString(36)}-${handleSeq}`;
  registerFileHandle(handle, file, { content, base64Data, dataURL });
  return {
    handle,
    name: String(file.name ?? ''),
    type: String(file.type ?? ''),
    size: Number(file.size) || 0,
    lastModified: file.lastModified,
    preview: String(file.type ?? '').startsWith('image/') ? dataURL : '',
    parsedData,
  };
};

const exposedFile = (f) => ({
  name: f.name,
  type: f.type,
  size: f.size,
  lastModified: f.lastModified,
  content: createFileFieldRef(f.handle, 'content'),
  base64Data: createFileFieldRef(f.handle, 'base64Data'),
  dataURL: createFileFieldRef(f.handle, 'dataURL'),
  parsedData: f.parsedData,
});

const DROPZONE =
  'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--lk-radius,var(--sc-radius))] border-2 border-dashed border-[color:var(--lk-invalid,var(--lk-drop-border,var(--sc-input)))] bg-[color:var(--lk-drop-bg,transparent)] px-6 py-5 text-center outline-none transition-colors hover:bg-[color:color-mix(in_srgb,var(--sc-muted)_50%,transparent)] focus-visible:ring-1 focus-visible:ring-ring';

export const ShadFileUpload = (props) => {
  const { properties, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const [files, setFiles] = useState([]);
  const filesRef = useRef(files);
  const mounted = useRef(true);
  const [parsing, setParsing] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const multiple = properties.multiple !== false;
  const maxFiles = multiple ? M.clampFiles(properties.maxFiles) : 1;
  const maxSize = M.clampBytes(properties.maxSize);
  const minSize = M.clampBytes(properties.minSize);
  const disabled = busy(properties);
  const publish = (next) => {
    filesRef.current = next;
    setFiles(next);
    setExposedVariables({
      files: next.map(exposedFile),
      fileSize: next.reduce((sum, f) => sum + (f.size || 0), 0),
    });
  };
  const clearFiles = (withEvent = true) => {
    const old = filesRef.current;
    old.forEach((f) => releaseFileHandle(f.handle));
    setRejectError('');
    publish([]);
    if (withEvent && old.length) fireEvent('onFileDeselected');
  };
  const clearRef = useRef(clearFiles);
  clearRef.current = clearFiles;
  useExposed(setExposedVariables, properties, {
    isParsing: parsing,
    clearFiles: async () => clearRef.current(),
    clear: async () => clearRef.current(),
  });
  useEffect(() => {
    mounted.current = true;
    setExposedVariables({ files: [], fileSize: 0 });
    return () => {
      mounted.current = false;
      filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const check = useValidation(props, files.length || '', () => clearFiles(false));

  const onDrop = async (accepted, rejections) => {
    check.touch();
    const current = multiple ? filesRef.current : [];
    const room = multiple ? Math.max(0, maxFiles - current.length) : 1;
    const fresh = list(accepted).filter(
      (f) => !current.some((c) => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified)
    );
    const taking = fresh.slice(0, room);
    let message = M.rejectionMessage(rejections, { maxSize, minSize, maxFiles });
    if (!message && fresh.length > taking.length) {
      message = M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles });
    }
    setRejectError(message);
    if (!taking.length) return;
    const parse = properties.parseContent === true;
    if (parse) {
      setParsing(true);
      setExposedVariables({ isParsing: true });
    }
    const options = { parse, parseFileType: properties.parseFileType, delimiter: properties.delimiter };
    const results = await Promise.allSettled(taking.map((f) => readFile(f, options)));
    const read = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (!mounted.current) {
      read.forEach((f) => releaseFileHandle(f.handle));
      return;
    }
    if (parse) {
      setParsing(false);
      setExposedVariables({ isParsing: false });
    }
    if (read.length < taking.length) setRejectError(`${taking.length - read.length} file(s) could not be read`);
    if (!read.length) return;
    if (!multiple) filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    publish(multiple ? [...filesRef.current, ...read].slice(0, maxFiles) : read.slice(0, 1));
    fireEvent('onFileSelected');
  };
  const remove = (index) => {
    const file = filesRef.current[index];
    if (!file) return;
    releaseFileHandle(file.handle);
    setRejectError('');
    publish(filesRef.current.filter((_, i) => i !== index));
    fireEvent('onFileDeselected');
  };
  const full = multiple && files.length >= maxFiles;
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: M.toDropzoneAccept(properties.accept),
    maxSize: maxSize || undefined,
    minSize,
    multiple,
    disabled: disabled || full,
  });
  const hint =
    isText(properties.hint) && String(properties.hint).trim()
      ? String(properties.hint)
      : [
          M.acceptHint(properties.accept) || 'Any file',
          maxSize ? `up to ${M.formatBytes(maxSize)}` : '',
          multiple ? `max ${maxFiles} files` : '',
        ]
          .filter(Boolean)
          .join(' · ');
  const title = full
    ? `Limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'} reached`
    : isDragActive
    ? 'Drop to upload'
    : String(properties.title ?? 'Drag & drop files here');
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={rejectError || check.error}
        required={check.required}
      >
        <div className="flex flex-col gap-2">
          <div
            {...getRootProps({
              'aria-label': title,
              'aria-invalid': !!(rejectError || check.error) || undefined,
              className: cn(
                DROPZONE,
                isDragActive &&
                  'border-[color:var(--sc-primary)] bg-[color:color-mix(in_srgb,var(--sc-primary)_6%,transparent)]',
                isDragReject && 'border-[color:var(--lk-error,var(--sc-destructive))]',
                (disabled || full) && 'cursor-not-allowed opacity-60 hover:bg-transparent'
              ),
            })}
          >
            <input {...getInputProps({ id: `shad-${id}` })} />
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
              {properties.loadingState || parsing ? (
                <Spinner />
              ) : (
                <Upload className="h-5 w-5 text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
              )}
            </div>
            <p className="m-0 text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">{title}</p>
            {full ? null : (
              <p className={cn('m-0 text-sm', MUTED)}>
                or{' '}
                <span className="font-medium text-[color:var(--sc-primary)] underline-offset-4 hover:underline">
                  click to browse
                </span>
              </p>
            )}
            <p className="m-0 text-xs text-[color:var(--lk-hint,var(--sc-muted-foreground))]">{hint}</p>
          </div>
          {files.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Selected files">
              {files.map((f, i) => {
                const Kind = KIND_ICONS[M.fileKind(f.type, f.name)] || FileIcon;
                const ext = (f.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toUpperCase();
                return (
                  <li
                    key={f.handle}
                    className="flex items-center gap-3 rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] border border-[color:var(--lk-item-border,var(--sc-border))] bg-[color:var(--lk-item-bg,var(--sc-card))] p-2 pr-1"
                  >
                    {properties.showPreview !== false && f.preview ? (
                      <img
                        src={f.preview}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md border border-[color:var(--sc-border)] object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--sc-muted)]">
                        <Kind className={cn('h-5 w-5', MUTED)} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-medium text-[color:var(--sc-foreground)]">{f.name}</p>
                      <p className={cn('m-0 text-xs', MUTED)}>
                        {M.formatBytes(f.size)}
                        {ext ? ` · ${ext}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn('h-8 w-8 shrink-0', MUTED)}
                      aria-label={`Remove ${f.name}`}
                      disabled={disabled}
                      onClick={() => remove(i)}
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Field>
    </Shell>
  );
};
