import React, { useEffect, useRef, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars, whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { activeItemExposed, findNav, navItems, unwrap } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { Icon, MenuContent, MenuLabel, MenuRows, SIZES } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';

// ---- Navigation --------------------------------------------------------------------------------------------------

const NAV_HEIGHT = { sm: 'h-8', default: 'h-9', lg: 'h-10' };

export const NAV_SQUARE = { sm: 'h-8 w-8', default: 'h-9 w-9', lg: 'h-10 w-10' };

export const RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';

export const ITEM_BASE =
  'relative flex shrink-0 items-center gap-2 whitespace-nowrap text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)] disabled:pointer-events-none disabled:opacity-50';

// Each variant's item colours: [inactive, active]. Styles override every one of them.
export const NAV_LOOK = {
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
export const NavFace = ({ item, active, collapsed, chevron }) => (
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

export const isText = (v) => typeof v === 'string' || typeof v === 'number';

/** Items with the setItemVisibility / setItemDisable changes applied: `changes` maps an item's value to
 *  { visible, disabled }. Plain text items become { label, value } so they can take a change. */
export const patchNavItems = (items, changes) => {
  if (!Object.keys(changes).length || !Array.isArray(items)) return items;
  const patch = (raw, depth) => {
    const obj = isText(raw) ? { label: String(raw), value: raw } : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return raw;
    const key = String(obj.value ?? obj.id ?? '');
    const change = changes[key];
    const children =
      depth < 4 && Array.isArray(obj.children) ? obj.children.map((c) => patch(c, depth + 1)) : obj.children;
    return change || children !== obj.children ? { ...obj, ...(change || {}), children } : raw;
  };
  return items.slice(0, 1000).map((raw) => patch(raw, 0));
};

export const ShadNavigation = (props) => {
  const { properties, styles, setExposedVariables, fireEvent, height, componentType } = props;
  // setItemVisibility and setItemDisable (the native Navigation's actions) change one item until the Items change.
  const [itemChanges, setItemChanges] = useState({});
  const itemsKey = stringify(properties.items ?? null);
  useEffect(() => setItemChanges({}), [itemsKey]);
  const items = navItems(patchNavItems(properties.items, itemChanges));
  const changeItem = (id, patch) => {
    if (id === undefined || id === null || typeof id === 'object') return;
    setItemChanges((c) => ({ ...c, [String(unwrap(id))]: { ...(c[String(unwrap(id))] || {}), ...patch } }));
  };
  const previousRef = useRef(null);
  const rawDefault = unwrap(properties.defaultValue);
  const initial = rawDefault === undefined || rawDefault === null ? '' : String(rawDefault);
  const [active, setActive] = useState(initial);
  useEffect(() => setActive(initial), [initial]);
  const [collapsed, setCollapsed] = useState(properties.collapsed === true);
  useEffect(() => setCollapsed(properties.collapsed === true), [properties.collapsed]);
  const [expanded, setExpanded] = useState({});
  const found = findNav(items, active);
  const parentKey = found?.parent?.key;
  useEffect(() => {
    if (parentKey) setExpanded((open) => ({ ...open, [parentKey]: true }));
  }, [parentKey]);
  const activate = (v) => {
    const next = v === undefined || v === null || typeof v === 'object' ? '' : String(unwrap(v));
    setActive((cur) => {
      if (cur !== next) previousRef.current = activeItemExposed(findNav(items, cur));
      return next;
    });
  };
  useExposed(setExposedVariables, properties, {
    value: found ? found.item.value : '',
    selectedItem: activeItemExposed(found),
    previousSelectedItem: previousRef.current,
    isCollapsed: collapsed,
    selectItem: async (v) => activate(v),
    setItemVisibility: async (id, v) => changeItem(id, { visible: !(v === false || v === 'false') }),
    setItemDisable: async (id, v) => changeItem(id, { disabled: !(v === false || v === 'false') }),
    setCollapsed: async (v) => setCollapsed(!(v === false || v === 'false')),
  });
  const disabled = busy(properties);
  const vertical = properties.orientation !== 'horizontal';
  const orientation = vertical ? 'vertical' : 'horizontal';
  const variant = ['pills', 'underline', 'ghost'].includes(properties.variant) ? properties.variant : 'pills';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const iconRail = vertical && collapsed;
  const stretch = !vertical && properties.align === 'stretch';
  const look = NAV_LOOK[orientation][variant];

  const pick = (item, parent = null) => {
    if (item.disabled || disabled) return;
    const previous = activeItemExposed(found);
    if (found?.item.key !== item.key) previousRef.current = previous;
    setActive(item.key);
    const picked = activeItemExposed({ item, parent });
    setExposedVariables({
      value: item.value,
      selectedItem: picked,
      previousSelectedItem: previousRef.current,
    });
    fireEvent('onClick');
  };
  const itemClass = (isActive, extra) =>
    cn(
      ITEM_BASE,
      NAV_HEIGHT[size],
      look[isActive ? 1 : 0],
      iconRail && cn(NAV_SQUARE[size], 'justify-center px-0'),
      stretch && 'flex-1 justify-center',
      extra
    );

  if (properties.loadingState && !wantsSkeleton(properties)) {
    return (
      <Shell {...props}>
        <LoadingBox height={height} />
      </Shell>
    );
  }
  if (properties.loadingState) {
    return (
      <Shell {...props}>
        <div
          className={cn('flex gap-2', vertical ? 'flex-col' : 'items-center')}
          style={vertical ? { height } : undefined}
        >
          {[0, 1, 2, 3, 4].slice(0, vertical ? 5 : 4).map((i) => (
            <Skeleton key={i} className={cn(vertical ? 'h-8 w-full' : 'h-8 w-20', vertical && i === 4 && 'w-3/5')} />
          ))}
        </div>
      </Shell>
    );
  }

  // A parent opens its children as a dropdown in the top bar and the icon rail, as a nested list in the sidebar.
  const dropdown = (item, isActive) => (
    <DropdownMenuPrimitive.Root key={item.key} modal={false}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled || item.disabled}>
        <button
          type="button"
          className={itemClass(isActive)}
          title={iconRail ? item.label : undefined}
          aria-current={isActive ? 'true' : undefined}
        >
          <NavFace
            item={item}
            active={isActive}
            collapsed={iconRail}
            chevron={iconRail ? null : <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />}
          />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent
        align="start"
        side={iconRail ? 'right' : 'bottom'}
        style={lookVars(componentType, styles)}
        className="[--lk-item-hover:var(--lk-hover,var(--sc-accent))]"
      >
        {iconRail ? <MenuLabel>{item.label}</MenuLabel> : null}
        <MenuRows
          rows={item.children.map((child) => ({ kind: 'item', ...child, description: '' }))}
          activeKey={found?.parent?.key === item.key ? found.item.key : undefined}
          onPick={(child) => pick(item.children.find((c) => c.key === String(child.value)) || child, item)}
        />
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  );

  const rows = [];
  let group = '';
  items.forEach((item, index) => {
    if (item.separator) {
      rows.push(
        <div
          key={`sep-${index}`}
          role="separator"
          className={cn(SEPARATOR_LINE, vertical ? 'my-2 h-px w-full shrink-0' : 'mx-1 h-5 w-px shrink-0')}
        />
      );
      return;
    }
    if (item.group !== group) {
      group = item.group;
      if (vertical && !iconRail && group) {
        rows.push(
          <div
            key={`group-${index}`}
            className="flex h-8 shrink-0 items-center px-2 pt-2 text-xs font-medium text-[color:var(--lk-group,var(--sc-muted-foreground))]"
          >
            {group}
          </div>
        );
      } else if (index > 0) {
        rows.push(
          <div
            key={`group-${index}`}
            role="separator"
            className={cn(SEPARATOR_LINE, vertical ? 'my-2 h-px w-full shrink-0' : 'mx-1 h-5 w-px shrink-0')}
          />
        );
      }
    }
    const isActive = found ? found.item.key === item.key || found.parent?.key === item.key : false;
    if (item.children.length && (!vertical || iconRail)) {
      rows.push(dropdown(item, isActive));
      return;
    }
    if (item.children.length) {
      const open = !!expanded[item.key];
      const childActive = found?.parent?.key === item.key;
      rows.push(
        <div key={item.key} className="flex w-full shrink-0 flex-col">
          <button
            type="button"
            aria-expanded={open}
            disabled={disabled || item.disabled}
            onClick={() => setExpanded((e) => ({ ...e, [item.key]: !open }))}
            className={itemClass(
              false,
              childActive && 'font-medium text-[color:var(--lk-active-fg,var(--sc-foreground))]'
            )}
          >
            <NavFace
              item={item}
              active={false}
              collapsed={false}
              chevron={
                <ChevronRight
                  className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform duration-200', open && 'rotate-90')}
                />
              }
            />
          </button>
          {open ? (
            <ul className="m-0 ml-3.5 mt-1 flex list-none flex-col gap-0.5 border-0 border-l border-solid border-[color:var(--lk-sep,var(--sc-border))] py-0.5 pl-2.5 pr-0">
              {item.children.map((child) => {
                const on = found?.item.key === child.key;
                return (
                  <li key={child.key}>
                    <button
                      type="button"
                      aria-current={on ? 'page' : undefined}
                      disabled={disabled || child.disabled}
                      onClick={() => pick(child, item)}
                      className={cn(
                        ITEM_BASE,
                        'h-8 w-full',
                        NAV_LOOK.vertical[variant === 'underline' ? 'pills' : variant][on ? 1 : 0]
                      )}
                    >
                      <NavFace item={child} active={on} collapsed={false} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
      return;
    }
    rows.push(
      <button
        key={item.key}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        disabled={disabled || item.disabled}
        title={iconRail ? item.label : undefined}
        onClick={() => pick(item)}
        className={itemClass(isActive, vertical && !iconRail && 'w-full')}
      >
        <NavFace item={item} active={isActive} collapsed={iconRail} />
      </button>
    );
  });

  return (
    <Shell {...props}>
      <nav
        aria-label="Navigation"
        className={cn(
          'flex bg-[color:var(--lk-bg,transparent)]',
          whenSet(styles, 'backgroundColor', vertical ? 'p-2' : 'px-2'),
          vertical
            ? cn('flex-col gap-1 overflow-y-auto overflow-x-hidden', iconRail && 'items-center')
            : cn(
                'w-full items-center gap-1 overflow-x-auto overflow-y-hidden',
                variant === 'underline' &&
                  'border-0 border-b border-solid border-[color:var(--lk-sep,var(--sc-border))]',
                { center: 'justify-center', end: 'justify-end' }[properties.align]
              )
        )}
        style={vertical ? { height } : undefined}
      >
        {items.length ? (
          rows
        ) : (
          <span className="px-2 text-sm text-[color:var(--sc-muted-foreground)]">No navigation items</span>
        )}
      </nav>
    </Shell>
  );
};

export default withControlState(ShadNavigation);
