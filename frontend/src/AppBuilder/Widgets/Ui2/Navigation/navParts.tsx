import React from 'react';
import { Icon } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';
import type { ReactNode } from 'react';
import type { NavItem } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import type { Bound, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isStringOrNumber, own } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// The Navigation's item looks, an item's face, and the item changes its actions make.

export const NAV_HEIGHT: Record<string, string> = { sm: 'tw-h-8', default: 'tw-h-9', lg: 'tw-h-10' };

export const NAV_SQUARE: Record<string, string> = {
  sm: 'tw-h-8 tw-w-8',
  default: 'tw-h-9 tw-w-9',
  lg: 'tw-h-10 tw-w-10',
};

export const RADIUS = 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ITEM_BASE =
  'tw-relative tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-ui2-sm tw-outline-none tw-transition-colors focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--sc-ring)] disabled:tw-pointer-events-none disabled:tw-opacity-50';

// Each variant's item colours: [inactive, active]. Styles override every one of them.
export const NAV_LOOK: Record<'vertical' | 'horizontal', Record<string, [inactive: string, active: string]>> = {
  vertical: {
    pills: [
      `${RADIUS} tw-px-2 tw-text-[color:var(--lk-fg,var(--sc-foreground))] hover:tw-bg-[color:var(--lk-hover,var(--sc-accent))] hover:tw-text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} tw-px-2 tw-font-medium tw-bg-[color:var(--lk-active-bg,var(--sc-accent))] tw-text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      'tw-rounded-l-none tw-rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] tw-border-0 tw-border-l-2 tw-border-solid tw-border-transparent tw-pl-3 tw-pr-2 tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:tw-bg-[color:var(--lk-hover,transparent)] hover:tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      'tw-rounded-l-none tw-rounded-r-[var(--lk-radius,calc(var(--sc-radius)-2px))] tw-border-0 tw-border-l-2 tw-border-solid tw-border-[color:var(--lk-indicator,var(--sc-primary))] tw-pl-3 tw-pr-2 tw-font-medium tw-bg-[color:var(--lk-active-bg,transparent)] tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} tw-px-2 tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:tw-bg-[color:var(--lk-hover,transparent)] hover:tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} tw-px-2 tw-font-semibold tw-bg-[color:var(--lk-active-bg,transparent)] tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
  horizontal: {
    pills: [
      `${RADIUS} tw-px-3 tw-font-medium tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:tw-bg-[color:var(--lk-hover,var(--sc-accent))] hover:tw-text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
      `${RADIUS} tw-px-3 tw-font-medium tw-bg-[color:var(--lk-active-bg,var(--sc-accent))] tw-text-[color:var(--lk-active-fg,var(--sc-accent-foreground))]`,
    ],
    underline: [
      '-tw-mb-px tw-h-10 tw-rounded-none tw-border-0 tw-border-b-2 tw-border-solid tw-border-transparent tw-px-3 tw-font-medium tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:tw-bg-[color:var(--lk-hover,transparent)] hover:tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]',
      '-tw-mb-px tw-h-10 tw-rounded-none tw-border-0 tw-border-b-2 tw-border-solid tw-border-[color:var(--lk-indicator,var(--sc-primary))] tw-px-3 tw-font-medium tw-bg-[color:var(--lk-active-bg,transparent)] tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]',
    ],
    ghost: [
      `${RADIUS} tw-px-3 tw-font-medium tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))] hover:tw-bg-[color:var(--lk-hover,transparent)] hover:tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
      `${RADIUS} tw-px-3 tw-font-semibold tw-bg-[color:var(--lk-active-bg,transparent)] tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]`,
    ],
  },
};

export const BADGE =
  'tw-inline-flex tw-h-5 tw-min-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-md tw-px-1.5 tw-text-xs tw-font-medium tw-tabular-nums tw-bg-[color:var(--lk-badge-bg,var(--sc-muted))] tw-text-[color:var(--lk-badge-fg,var(--sc-muted-foreground))]';

export const SEPARATOR_LINE = 'tw-bg-[color:var(--lk-sep,var(--sc-border))]';

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
      <Icon name={item.icon} className={active ? undefined : 'tw-text-[color:var(--lk-icon,currentColor)]'} />
    ) : collapsed ? (
      <span className="tw-text-xs tw-font-semibold">{item.label.slice(0, 2)}</span>
    ) : null}
    {collapsed ? (
      <span className="tw-sr-only">{item.label}</span>
    ) : (
      <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-left">{item.label}</span>
    )}
    {item.badge ? (
      collapsed ? (
        <span
          aria-label={item.badge}
          className="tw-absolute tw-right-1 tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-[color:var(--lk-badge-bg,var(--sc-primary))]"
        />
      ) : (
        <span className={BADGE}>{item.badge}</span>
      )
    ) : null}
    {chevron}
  </>
);

/** Items with the setItemVisibility / setItemDisable changes applied: `changes` maps an item's value to
 *  { visible, disabled }. Plain text items become { label, value } so they can take a change. */
/** An item's changes from setItemVisibility / setItemDisable. */
export type NavItemChange = { visible?: boolean; disabled?: boolean };

export const patchNavItems = (items: unknown, changes: Record<string, NavItemChange>): unknown => {
  if (!Object.keys(changes).length || !Array.isArray(items)) return items;
  const patch = (raw: Bound, depth: number): Bound => {
    const obj: Resolved = isStringOrNumber(raw) ? { label: String(raw), value: raw } : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return raw;
    const key = String(obj.value ?? obj.id ?? '');
    const change = own(changes, key);
    const children =
      depth < 4 && Array.isArray(obj.children) ? obj.children.map((c: Bound) => patch(c, depth + 1)) : obj.children;
    return change || children !== obj.children ? { ...obj, ...(change || {}), children } : raw;
  };
  return items.slice(0, 1000).map((raw) => patch(raw, 0));
};
