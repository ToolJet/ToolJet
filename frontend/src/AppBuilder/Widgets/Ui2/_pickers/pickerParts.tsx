import React, { useState } from 'react';
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

// shadcn/ui pack (experiment): the pickers widgets. Combobox and Multiselect are shadcn's Popover + Command (cmdk)
// recipe; Tags input, Color picker and Rating follow shadcn's field look; File upload is react-dropzone in shadcn
// styling. Pure logic lives in pickersModel, colorModel and fileModel, style variables in looks/pickers.

// ---- Shared pieces -------------------------------------------------------------------------------------------------

export const PLACEHOLDER = 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';
export const MUTED = 'text-[color:var(--sc-muted-foreground)]';
export const MENU_SURFACE =
  'bg-[color:var(--lk-menu-bg,var(--sc-popover))] text-[color:var(--lk-menu-fg,var(--sc-popover-foreground))]';
const CHIP =
  'bg-[color:var(--lk-chip-bg,var(--sc-secondary))] text-[color:var(--lk-chip-fg,var(--sc-secondary-foreground))]';
// A small icon button inside a field (remove a chip, clear): p-0 and no border keep ToolJet's global button styles out.
const ICON_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-sm border-0 bg-transparent p-0.5 opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring';

export const isText = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';
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
    className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent text-inherit', className)}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
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

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
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
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[color:var(--sc-muted-foreground)]',
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
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-[color:var(--lk-hl,var(--sc-accent))] data-[selected=true]:text-[color:var(--lk-menu-fg,var(--sc-accent-foreground))]',
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

const OptionText = ({ option }: { option: Option }) => (
  <span className="flex min-w-0 flex-1 flex-col">
    <span className="truncate">{option.label}</span>
    {isText(option.description) && String(option.description) ? (
      <span className={cn('truncate text-xs', MUTED)}>{String(option.description)}</span>
    ) : null}
  </span>
);

/** The search text of an options menu: kept locally, exposed as searchText, with onSearchTextChanged. */
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
            {more > 0 ? (
              <div className={cn('px-2 py-1.5 text-center text-xs', MUTED)}>
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
    <X className="h-3.5 w-3.5" />
  </button>
);

export interface ChipProps {
  label: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

export const Chip = ({ label, onRemove, removeLabel }: ChipProps) => (
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
