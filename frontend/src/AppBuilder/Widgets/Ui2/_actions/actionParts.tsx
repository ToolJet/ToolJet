import React, { useRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { TablerIcon } from '@/AppBuilder/Widgets/Ui2/_shared/TablerIcon';
import { Skeleton, cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { MutableRefObject, ReactNode } from 'react';
import type { MenuEntry } from './actionsModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// shadcn/ui pack (experiment): the actions widgets. Configs in WidgetManager/widgets/shad*.js, style variables
// in looks/actions, pure logic in actionsModel and calendarModel.

export const Icon = ({ name, className, size = 16 }: { name: string; className?: string; size?: number }) =>
  name ? (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)} aria-hidden="true">
      <TablerIcon iconName={name} style={{ width: size, height: size }} stroke={1.75} />
    </span>
  ) : null;

/** Latest values for actions: the exposed action functions are published once, so they read state through this. */
export const useLive = <T,>(value: T): MutableRefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

// ---- Dropdown menu primitives (shadcn new-york) --------------------------------------------------------------------

const MENU_CONTENT =
  'z-[1060] max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden border p-1 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-[var(--lk-menu-radius,calc(var(--sc-radius)-2px))] border-[color:var(--lk-menu-border,var(--sc-border))] bg-[color:var(--lk-menu-bg,var(--sc-popover))] text-[color:var(--lk-item-fg,var(--sc-popover-foreground))]';

export const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal container={getPortalRoot()}>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(MENU_CONTENT, className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
MenuContent.displayName = 'MenuContent';

const MENU_ITEM =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
const ITEM_HOVER =
  'data-[highlighted]:bg-[color:var(--lk-item-hover,var(--sc-accent))] data-[highlighted]:text-[color:var(--lk-item-hover-fg,var(--sc-accent-foreground))]';
const ITEM_DESTRUCTIVE =
  'text-[color:var(--lk-destructive,var(--sc-destructive))] data-[highlighted]:bg-[color:color-mix(in_srgb,var(--lk-destructive,var(--sc-destructive))_10%,transparent)] data-[highlighted]:text-[color:var(--lk-destructive,var(--sc-destructive))]';
const MUTED = 'text-[color:var(--lk-desc,var(--sc-muted-foreground))]';

export const MenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-[color:var(--lk-menu-border,var(--sc-border))]" />
);
export const MenuLabel = ({ children }: { children?: ReactNode }) => (
  <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
    {children}
  </DropdownMenuPrimitive.Label>
);

/** The rows of a menu (items, group headings, separators), or skeleton rows while its options load. */
/** What MenuRows reads of an item (a dropdown menu's entries carry all of it, a navigation's children some). */
export type MenuRowsItem = Pick<MenuEntry, 'label' | 'value' | 'icon' | 'description' | 'disabled'> &
  Partial<Pick<MenuEntry, 'shortcut' | 'destructive'>>;

/** A row MenuRows draws: an item, a group heading or a separator. */
export type MenuRowOf<T extends MenuRowsItem> =
  | ({ kind: 'item' } & T)
  | { kind: 'label'; label: string }
  | { kind: 'separator' };

export interface MenuRowsProps<T extends MenuRowsItem> {
  rows: MenuRowOf<T>[];
  loading?: boolean;
  onPick: (item: { kind: 'item' } & T) => void;
  /** The value (as text) of the item to mark as current. */
  activeKey?: string;
}

export const MenuRows = <T extends MenuRowsItem>({ rows, loading, onPick, activeKey }: MenuRowsProps<T>) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-1" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn('h-6', i === 2 ? 'w-3/5' : 'w-full')} />
        ))}
      </div>
    );
  }
  if (!rows.length) return <div className={cn('px-2 py-1.5 text-sm', MUTED)}>No options</div>;
  return rows.map((row, i) => {
    if (row.kind === 'separator') return <MenuSeparator key={`s${i}`} />;
    if (row.kind === 'label') return <MenuLabel key={`l${i}`}>{row.label}</MenuLabel>;
    const active = activeKey !== undefined && String(row.value) === activeKey;
    return (
      <DropdownMenuPrimitive.Item
        key={`i${i}`}
        disabled={row.disabled}
        onSelect={() => onPick(row)}
        className={cn(
          MENU_ITEM,
          row.description && 'items-start',
          row.destructive ? ITEM_DESTRUCTIVE : ITEM_HOVER,
          active && 'font-medium'
        )}
      >
        {row.icon ? (
          <Icon
            name={row.icon}
            className={cn(
              row.description && 'mt-0.5',
              !row.destructive && 'text-[color:var(--lk-icon,var(--sc-muted-foreground))]'
            )}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{row.label}</span>
          {row.description ? <span className={cn('text-xs', MUTED)}>{row.description}</span> : null}
        </span>
        {row.shortcut ? (
          <span className={cn('ml-auto pl-4 text-xs tracking-widest', MUTED)}>{row.shortcut}</span>
        ) : null}
        {active ? <Check className="ml-auto h-4 w-4" /> : null}
      </DropdownMenuPrimitive.Item>
    );
  });
};

export const SIZES = ['sm', 'default', 'lg'];
