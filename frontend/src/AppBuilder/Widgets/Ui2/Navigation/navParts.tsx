import React from 'react';
import { Icon } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';
import type { ReactNode } from 'react';
import type { NavItem } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import type { Bound, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// The Navigation's item looks, an item's face, and the item changes its actions make.

export const NAV_HEIGHT: Record<string, string> = { sm: 'h-8', default: 'h-9', lg: 'h-10' };

export const NAV_SQUARE: Record<string, string> = { sm: 'h-8 w-8', default: 'h-9 w-9', lg: 'h-10 w-10' };

export const RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ITEM_BASE =
  'relative flex shrink-0 items-center gap-2 whitespace-nowrap text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)] disabled:pointer-events-none disabled:opacity-50';

// Each variant's item colours: [inactive, active]. Styles override every one of them.
export const NAV_LOOK: Record<'vertical' | 'horizontal', Record<string, [inactive: string, active: string]>> = {
  vertical: {
    pills: [
      `${RADIUS} px-2 text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} px-2 font-medium bg-[color:var(--lk-active-bg,var(--sc-accent))] text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      'rounded-l-none rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] border-0 border-l-2 border-solid border-transparent pl-3 pr-2 text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      'rounded-l-none rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] border-0 border-l-2 border-solid border-[color:var(--lk-indicator,var(--sc-primary))] pl-3 pr-2 font-medium bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} px-2 text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} px-2 font-semibold bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
  horizontal: {
    pills: [
      `${RADIUS} px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} px-3 font-medium bg-[color:var(--lk-active-bg,var(--sc-accent))] text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      '-mb-px h-10 rounded-none border-0 border-b-2 border-solid border-transparent px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      '-mb-px h-10 rounded-none border-0 border-b-2 border-solid border-[color:var(--lk-indicator,var(--sc-primary))] px-3 font-medium bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} px-3 font-medium text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:bg-[color:var(--lk-hover,transparent)] hover:text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} px-3 font-semibold bg-[color:var(--lk-active-bg,transparent)] text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
};

export const BADGE =
  'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums bg-[color:var(--lk-badge-bg,var(--sc-muted))] text-[color:var(--lk-badge-fg,var(--sc-muted-foreground))]';

export const SEPARATOR_LINE = 'bg-[color:var(--lk-sep,var(--sc-border))]';

/** One navigation item's face: icon, label, badge, and a chevron when it has children. */
export interface NavFaceProps {
  item: Pick<NavItem, 'icon' | 'label' | 'badge'>;
  active: boolean;
  collapsed: boolean;
  chevron?: ReactNode;
}

export const NavFace = ({ item, active, collapsed, chevron }: NavFaceProps) => (
  <>
    {item.icon ? (
      <Icon name={item.icon} className={active ? undefined : 'text-[color:var(--lk-icon,currentColor)]'} />
    ) : collapsed ? (
      <span className="text-xs font-semibold">{item.label.slice(0, 2)}</span>
    ) : null}
    {collapsed ? (
      <span className="sr-only">{item.label}</span>
    ) : (
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
    )}
    {item.badge ? (
      collapsed ? (
        <span
          aria-label={item.badge}
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[color:var(--lk-badge-bg,var(--sc-primary))]"
        />
      ) : (
        <span className={BADGE}>{item.badge}</span>
      )
    ) : null}
    {chevron}
  </>
);

export const isText = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';

/** Items with the setItemVisibility / setItemDisable changes applied: `changes` maps an item's value to
 *  { visible, disabled }. Plain text items become { label, value } so they can take a change. */
/** An item's changes from setItemVisibility / setItemDisable. */
export type NavItemChange = { visible?: boolean; disabled?: boolean };

export const patchNavItems = (items: unknown, changes: Record<string, NavItemChange>): unknown => {
  if (!Object.keys(changes).length || !Array.isArray(items)) return items;
  const patch = (raw: Bound, depth: number): Bound => {
    const obj: Resolved = isText(raw) ? { label: String(raw), value: raw } : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return raw;
    const key = String(obj.value ?? obj.id ?? '');
    const change = changes[key];
    const children =
      depth < 4 && Array.isArray(obj.children) ? obj.children.map((c: Bound) => patch(c, depth + 1)) : obj.children;
    return change || children !== obj.children ? { ...obj, ...(change || {}), children } : raw;
  };
  return items.slice(0, 1000).map((raw) => patch(raw, 0));
};
