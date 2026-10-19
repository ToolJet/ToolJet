import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { TablerIcon } from '@/AppBuilder/Widgets/Ui2/_shared/TablerIcon';
import { Skeleton, cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { ReactNode } from 'react';
import type { MenuEntry } from './actionsModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// ToolJet UI 2.0: the actions widgets. Configs in WidgetManager/widgets/shad*.js, style variables
// in looks/actions, pure logic in actionsModel and calendarModel.

export const Icon = ({ name, className, size = 16 }: { name: string; className?: string; size?: number }) =>
  name ? (
    <span className={cn('tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center', className)} aria-hidden="true">
      <TablerIcon iconName={name} style={{ width: size, height: size }} stroke={1.75} />
    </span>
  ) : null;

// ---- Dropdown menu primitives (shadcn new-york) --------------------------------------------------------------------

const MENU_CONTENT =
  'tw-z-[1060] tw-max-h-[var(--radix-dropdown-menu-content-available-height)] tw-min-w-[8rem] tw-overflow-y-auto tw-overflow-x-hidden tw-border tw-p-1 tw-shadow-md tw-outline-none data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95 data-[side=bottom]:tw-slide-in-from-top-2 data-[side=left]:tw-slide-in-from-right-2 data-[side=right]:tw-slide-in-from-left-2 data-[side=top]:tw-slide-in-from-bottom-2 tw-rounded-[var(--lk-menu-radius,calc(var(--sc-radius)-2px))] tw-border-[color:var(--lk-menu-border,var(--sc-border))] tw-bg-[color:var(--lk-menu-bg,var(--sc-popover))] tw-text-[color:var(--lk-item-fg,var(--sc-popover-foreground))]';

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
  'tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-gap-2 tw-rounded-ui2-sm tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-outline-none tw-transition-colors data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50';
const ITEM_HOVER =
  'data-[highlighted]:tw-bg-[color:var(--lk-item-hover,var(--sc-accent))] data-[highlighted]:tw-text-[color:var(--lk-item-hover-fg,var(--sc-accent-foreground))]';
const ITEM_DESTRUCTIVE =
  'tw-text-[color:var(--lk-destructive,var(--sc-destructive))] data-[highlighted]:tw-bg-[color:color-mix(in_srgb,var(--lk-destructive,var(--sc-destructive))_10%,transparent)] data-[highlighted]:tw-text-[color:var(--lk-destructive,var(--sc-destructive))]';
const MUTED = 'tw-text-[color:var(--lk-desc,var(--sc-muted-foreground))]';

export const MenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="-tw-mx-1 tw-my-1 tw-h-px tw-bg-[color:var(--lk-menu-border,var(--sc-border))]" />
);
export const MenuLabel = ({ children }: { children?: ReactNode }) => (
  <DropdownMenuPrimitive.Label className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
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

/** A React key per row that follows the action, not its position: the item's value with its type (1 and '1' stay
 *  apart), else its label, and a count when the same identity repeats. Keyed by position, a refresh that moved an
 *  open menu's focused action left focus on the same row now drawing another action, and Enter picked that one. When
 *  the focused action goes, its row goes with it and nothing is picked. */
const rowKeys = <T extends MenuRowsItem>(rows: MenuRowOf<T>[]) => {
  const seen = new Map<string, number>();
  return rows.map((row, i) => {
    if (row.kind !== 'item') return `${row.kind}${i}`;
    const absent = row.value === undefined || row.value === null || row.value === '';
    const id = absent ? `label:${row.label}` : `${typeof row.value}:${String(row.value)}`;
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    return `${id}#${n}`;
  });
};

export const MenuRows = <T extends MenuRowsItem>({ rows, loading, onPick, activeKey }: MenuRowsProps<T>) => {
  if (loading) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-1 tw-p-1" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn('tw-h-6', i === 2 ? 'tw-w-3/5' : 'tw-w-full')} />
        ))}
      </div>
    );
  }
  if (!rows.length) return <div className={cn('tw-px-2 tw-py-1.5 tw-text-ui2-sm', MUTED)}>No options</div>;
  const keys = rowKeys(rows);
  return rows.map((row, i) => {
    if (row.kind === 'separator') return <MenuSeparator key={keys[i]} />;
    if (row.kind === 'label') return <MenuLabel key={keys[i]}>{row.label}</MenuLabel>;
    const active = activeKey !== undefined && String(row.value) === activeKey;
    return (
      <DropdownMenuPrimitive.Item
        key={keys[i]}
        disabled={row.disabled}
        onSelect={() => onPick(row)}
        className={cn(
          MENU_ITEM,
          row.description && 'tw-items-start',
          row.destructive ? ITEM_DESTRUCTIVE : ITEM_HOVER,
          active && 'tw-font-medium'
        )}
      >
        {row.icon ? (
          <Icon
            name={row.icon}
            className={cn(
              row.description && 'tw-mt-0.5',
              !row.destructive && 'tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))]'
            )}
          />
        ) : null}
        <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <span className="tw-truncate">{row.label}</span>
          {row.description ? <span className={cn('tw-text-xs', MUTED)}>{row.description}</span> : null}
        </span>
        {row.shortcut ? (
          <span className={cn('tw-ml-auto tw-pl-4 tw-text-xs tw-tracking-widest', MUTED)}>{row.shortcut}</span>
        ) : null}
        {active ? <Check className="tw-ml-auto tw-h-4 tw-w-4" /> : null}
      </DropdownMenuPrimitive.Item>
    );
  });
};

export const SIZES = ['sm', 'default', 'lg'];
