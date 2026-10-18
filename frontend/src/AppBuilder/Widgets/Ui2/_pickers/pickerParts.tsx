import React, { useEffect, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Search, X } from 'lucide-react';
import { TablerIcon } from '@/AppBuilder/Widgets/Ui2/_shared/TablerIcon';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from './pickersModel';
import type { ReactNode, SyntheticEvent } from 'react';
import type { Option } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { isStringOrNumber } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { missingIsGone, useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

// ToolJet UI 2.0: the pickers widgets. Combobox and Multiselect are shadcn's Popover + Command (cmdk)
// recipe; Tags input, Color picker and Rating follow shadcn's field look; File upload is react-dropzone in shadcn
// styling. Pure logic lives in pickersModel, colorModel and fileModel, style variables in looks/pickers.

// ---- Shared pieces -------------------------------------------------------------------------------------------------

export const PLACEHOLDER = 'tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';
export const MUTED = 'tw-text-[color:var(--sc-muted-foreground)]';
// An option's secondary text (a description, a dialling code) is muted, except on the highlighted row, where muted
// text on the highlight read at 4.4:1 (4.05:1 dark): there it takes the row's colour. Mark the text data-secondary.
export const SECONDARY_ON_HIGHLIGHT = '[&[data-selected=true]_[data-secondary]]:tw-text-inherit';
export const MENU_SURFACE =
  'tw-bg-[color:var(--lk-menu-bg,var(--sc-popover))] tw-text-[color:var(--lk-menu-fg,var(--sc-popover-foreground))]';
const CHIP =
  'tw-bg-[color:var(--lk-chip-bg,var(--sc-secondary))] tw-text-[color:var(--lk-chip-fg,var(--sc-secondary-foreground))]';
// A small icon button inside a field (remove a chip, clear): p-0 and no border keep ToolJet's global button styles out.
// A 24px touch target (WCAG 2.5.8; a chip's 16px button sat between its neighbours) that takes 16px of the line.
const ICON_BUTTON =
  'tw-inline-flex tw-h-6 tw-w-6 -tw-m-1 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-sm tw-border-0 tw-bg-transparent tw-p-0 tw-opacity-60 tw-outline-none tw-transition-opacity hover:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring';

/** Keeps a pointer press on a control inside a trigger from opening or closing the trigger's menu. */
const stopPress = (e: SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

// shadcn's Command (new-york), on cmdk. Items size their own icons (no [&_svg]:size-4: it would outrank them).
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-ui2-md tw-bg-transparent tw-text-inherit',
      className
    )}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="tw-flex tw-items-center tw-border-b tw-border-[color:var(--sc-border)] tw-px-3" cmdk-input-wrapper="">
    <Search className="tw-mr-2 tw-h-4 tw-w-4 tw-shrink-0 tw-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'tw-flex tw-h-10 tw-w-full tw-rounded-ui2-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-3 tw-text-ui2-sm tw-text-inherit tw-shadow-none tw-outline-none placeholder:tw-text-[color:var(--sc-muted-foreground)] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('tw-max-h-[300px] tw-overflow-y-auto tw-overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'tw-overflow-hidden tw-p-1 [&_[cmdk-group-heading]]:tw-px-2 [&_[cmdk-group-heading]]:tw-py-1.5 [&_[cmdk-group-heading]]:tw-text-xs [&_[cmdk-group-heading]]:tw-font-medium [&_[cmdk-group-heading]]:tw-text-[color:var(--sc-muted-foreground)]',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-gap-2 tw-rounded-ui2-sm tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-outline-none data-[disabled=true]:tw-pointer-events-none data-[disabled=true]:tw-opacity-50 data-[selected=true]:tw-bg-[color:var(--lk-hl,var(--sc-accent))] data-[selected=true]:tw-text-[color:var(--lk-menu-fg,var(--sc-accent-foreground))]',
      SECONDARY_ON_HIGHLIGHT,
      className
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

/** An option's icon: a Tabler icon name (IconUser), an image URL, or text such as an emoji. */
export const OptionIcon = ({ icon }: { icon: unknown }) => {
  if (typeof icon !== 'string' || !icon.trim()) return null;
  if (/^(https?:|data:image\/|\/)/.test(icon)) {
    return <img src={icon} alt="" className="tw-h-4 tw-w-4 tw-shrink-0 tw-rounded-ui2-xs tw-object-cover" />;
  }
  if (/^Icon[A-Z0-9]/.test(icon)) {
    return <TablerIcon iconName={icon} style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} stroke={1.75} />;
  }
  return (
    <span aria-hidden className="tw-w-4 tw-shrink-0 tw-text-center tw-leading-none">
      {icon.slice(0, 4)}
    </span>
  );
};

const OptionText = ({ option }: { option: Option }) => (
  <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
    <span className="tw-truncate">{option.label}</span>
    {isStringOrNumber(option.description) && String(option.description) ? (
      <span data-secondary className={cn('tw-truncate tw-text-xs', MUTED)}>
        {String(option.description)}
      </span>
    ) : null}
  </span>
);

/** The search text of an options menu: kept locally, exposed as searchText, with onSearchTextChanged. */
/** The selected options, by key. With server-side search (`keep`) the app replaces `options` with each search's
 *  results, so a selected option can be off the current page: it keeps the record it had when last seen, and the
 *  selection (and what a Form submits) stays whole, in the order it was picked (option order means nothing when the
 *  options change with every search). Without server-side search the options are the whole list: the selection is in
 *  option order, and a key no option has any more was deleted and drops out. Only selected keys are kept, so
 *  searching does not grow the memory. */
export const keptOptions = (options: Option[], keys: string[], kept: Map<string, Option> | null): Option[] => {
  if (!kept) return M.selectedOf(options, keys);
  const here = new Map(options.map((o) => [M.keyOf(o.value), o] as [string, Option]));
  return keys.flatMap((k) => {
    const option = here.get(k) ?? kept.get(k);
    return option ? [option] : [];
  });
};

export const useKeptSelection = (options: Option[], keys: string[], keep: boolean): Option[] => {
  const kept = useRef(new Map<string, Option>());
  const selected = keptOptions(options, keys, keep ? kept.current : null);
  kept.current = new Map(selected.map((o) => [M.keyOf(o.value), o] as [string, Option]));
  return selected;
};

/** Drops selected keys whose option was there and is gone, so a removed choice does not come back selected when an
 *  option of that value reappears, and does not count against a limit while it is gone. A key whose option was never
 *  seen stays (a default whose options are still loading). With server-side search nothing is dropped: a missing
 *  option is off the current result page, not deleted (useKeptSelection keeps it). No event: the data changed, not
 *  the user's choice. */
export const useDropRemovedChoices = (
  optionKeys: string[],
  selectedKeys: string[],
  drop: (gone: Set<string>) => void,
  keep: boolean
) => {
  const seen = useRef<Set<string>>(new Set());
  const latest = useLatest({ selectedKeys, drop, keep });
  const signature = optionKeys.join('\u0000');
  useEffect(() => {
    const present = new Set(signature ? signature.split('\u0000') : []);
    if (!missingIsGone(present.size)) return;
    const { selectedKeys: selected, drop: dropKeys, keep: kept } = latest.current;
    if (!kept) {
      const gone = new Set(selected.filter((k) => seen.current.has(k) && !present.has(k)));
      if (gone.size) dropKeys(gone);
    }
    seen.current = present;
  }, [signature, latest]);
};

export const useSearch = ({
  setExposedVariable,
  fireEvent,
}: Pick<WidgetProps, 'setExposedVariable' | 'fireEvent'>): [string, (text: string) => void] => {
  const [search, setSearch] = useState('');
  const change = (text: string) => {
    setSearch(text);
    setExposedVariable('searchText', text);
    fireEvent('onSearchTextChanged');
  };
  return [search, change];
};

/** The options list of Combobox and Multiselect: search box, grouped options (filtered here unless the author
 *  filters them server-side), an empty or loading state, and optional rows before (`top`) and after (`bottom`). Items
 *  are keyed by position, so an option valued '' or two options with the same label stay distinct. */
export interface OptionsMenuProps {
  properties: Resolved;
  options: Option[];
  search: string;
  onSearch: (text: string) => void;
  isSelected: (option: Option) => boolean;
  isDisabled: (option: Option, selected: boolean) => boolean;
  onPick: (option: Option) => void;
  multiple?: boolean;
  top?: ReactNode;
  bottom?: ReactNode;
}

export const OptionsMenu = ({
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
}: OptionsMenuProps) => {
  const entries =
    properties.serverSideSearch === true
      ? options.map((option, index) => ({ option, index }))
      : M.filterOptions(options, search);
  const groups = M.groupOptions(entries.slice(0, M.MAX_SHOWN_OPTIONS));
  const more = entries.length - M.MAX_SHOWN_OPTIONS;
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
          <div className="tw-flex tw-justify-center tw-py-6">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className={cn('tw-py-6 tw-text-center tw-text-ui2-sm', MUTED)}>
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
                            'tw-flex tw-h-4 tw-w-4 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-xs tw-border tw-border-[color:var(--sc-primary)]',
                            on
                              ? 'tw-bg-[color:var(--sc-primary)] tw-text-[color:var(--sc-primary-foreground)]'
                              : 'tw-opacity-50'
                          )}
                        >
                          {on ? <Check className="tw-h-3 tw-w-3" /> : null}
                        </span>
                      ) : null}
                      <OptionIcon icon={option.icon} />
                      <OptionText option={option} />
                      {!multiple ? (
                        <Check
                          className={cn('tw-ml-auto tw-h-4 tw-w-4 tw-shrink-0', on ? 'tw-opacity-100' : 'tw-opacity-0')}
                        />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {more > 0 ? (
              <div className={cn('tw-px-2 tw-py-1.5 tw-text-center tw-text-xs', MUTED)}>
                {`${more} more. Type to narrow the list.`}
              </div>
            ) : null}
            {bottom}
          </>
        )}
      </CommandList>
    </Command>
  );
};

export const ClearButton = ({ onClear, label = 'Clear' }: { onClear: () => void; label?: string }) => (
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
    <X className="tw-h-3.5 tw-w-3.5" />
  </button>
);

export interface ChipProps {
  label: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

export const Chip = ({ label, onRemove, removeLabel }: ChipProps) => (
  <Badge variant="secondary" className={cn('tw-max-w-full tw-gap-1 tw-font-normal', onRemove && 'tw-pr-1', CHIP)}>
    <span className="tw-max-w-[12rem] tw-truncate">{label}</span>
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
        <X className="tw-h-3 tw-w-3" />
      </button>
    ) : null}
  </Badge>
);
