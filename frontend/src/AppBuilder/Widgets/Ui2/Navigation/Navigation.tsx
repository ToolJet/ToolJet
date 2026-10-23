import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { usePickerPopup } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet, own } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { activeItemExposed, findNav, navItems, unwrap } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { MenuContent, MenuLabel, MenuRows, SIZES } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';
import { ITEM_BASE, NAV_HEIGHT, NAV_LOOK, NAV_SQUARE, NavFace, SEPARATOR_LINE, patchNavItems } from './navParts';
import type { CSSProperties, ReactNode } from 'react';
import type { NavItem } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import type { NavItemChange } from './navParts';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Navigation --------------------------------------------------------------------------------------------------

interface NavDropdownProps {
  item: NavItem;
  properties: Resolved;
  className: string;
  isActive: boolean;
  iconRail: boolean;
  activeKey?: string;
  menuStyle: CSSProperties;
  onPick: (item: NavItem, parent: NavItem) => void;
}

/** A parent item's dropdown. The menu is portalled outside the widget: it is open only while the widget, the panels
 *  around it and the parent item take input (usePickerPopup), so hiding the widget, switching, disabling or hiding its
 *  Tabs or Container, or disabling the parent closes it. The parent's children in the sidebar's nested list stay
 *  enabled when the parent is disabled, as in the native Navigation; this only closes the menu its trigger opened. */
const NavDropdown = ({
  item,
  properties,
  className,
  isActive,
  iconRail,
  activeKey,
  menuStyle,
  onPick,
}: NavDropdownProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popup = usePickerPopup({ ...properties, disabledState: busy(properties) || item.disabled }, triggerRef);
  return (
    <DropdownMenuPrimitive.Root modal={false} open={popup.open} onOpenChange={popup.setOpen}>
      <DropdownMenuPrimitive.Trigger asChild disabled={busy(properties) || item.disabled} ref={triggerRef}>
        <button
          type="button"
          className={className}
          title={iconRail ? item.label : undefined}
          aria-current={isActive ? 'true' : undefined}
        >
          <NavFace
            item={item}
            active={isActive}
            collapsed={iconRail}
            chevron={iconRail ? null : <ChevronDown className="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-opacity-60" />}
          />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <MenuContent
        align="start"
        side={iconRail ? 'right' : 'bottom'}
        style={menuStyle}
        className="[--lk-item-hover:var(--lk-hover,var(--sc-accent))]"
      >
        {iconRail ? <MenuLabel>{item.label}</MenuLabel> : null}
        <MenuRows
          rows={item.children.map((child) => ({ kind: 'item', ...child, description: '' }))}
          activeKey={activeKey}
          // A choice can arrive before the closed menu has rendered.
          onPick={(child) =>
            !popup.blocked && onPick(item.children.find((c) => c.key === String(child.value)) || child, item)
          }
        />
      </MenuContent>
    </DropdownMenuPrimitive.Root>
  );
};

export const ShadNavigation = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, height, componentType } = props;
  // setItemVisibility and setItemDisable (the native Navigation's actions) change one item until the Items change.
  const [itemChanges, setItemChanges] = useState<Record<string, NavItemChange>>({});
  const rawItems = useStable(properties.items);
  useEffect(() => setItemChanges({}), [rawItems]);
  const items = useMemo(() => navItems(patchNavItems(rawItems, itemChanges)), [rawItems, itemChanges]);
  const changeItem = (id: unknown, patch: NavItemChange) => {
    if (id === undefined || id === null || typeof id === 'object') return;
    setItemChanges((c) => ({ ...c, [String(unwrap(id))]: { ...(c[String(unwrap(id))] || {}), ...patch } }));
  };
  const previousRef = useRef<ReturnType<typeof activeItemExposed>>(null);
  const rawDefault = unwrap(properties.defaultValue);
  const initial = rawDefault === undefined || rawDefault === null ? '' : String(rawDefault);
  const [active, setActive] = useState(initial);
  useEffect(() => setActive(initial), [initial]);
  const [collapsed, setCollapsed] = useState(properties.collapsed === true);
  useEffect(() => setCollapsed(properties.collapsed === true), [properties.collapsed]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const found = findNav(items, active);
  const parentKey = found?.parent?.key;
  useEffect(() => {
    if (parentKey) setExpanded((open) => ({ ...open, [parentKey]: true }));
  }, [parentKey]);
  const activate = (v: unknown) => {
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
    selectItem: async (v: unknown) => activate(v),
    setItemVisibility: async (id: unknown, v: unknown) => changeItem(id, { visible: !(v === false || v === 'false') }),
    setItemDisable: async (id: unknown, v: unknown) => changeItem(id, { disabled: !(v === false || v === 'false') }),
    setCollapsed: async (v: unknown) => setCollapsed(!(v === false || v === 'false')),
  });
  const disabled = busy(properties);
  const vertical = properties.orientation !== 'horizontal';
  const orientation = vertical ? 'vertical' : 'horizontal';
  const variant = ['pills', 'underline', 'ghost'].includes(properties.variant) ? properties.variant : 'pills';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const iconRail = vertical && collapsed;
  const stretch = !vertical && properties.align === 'stretch';
  const look = NAV_LOOK[orientation][variant];

  const pick = (item: NavItem, parent: NavItem | null = null) => {
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
  const itemClass = (isActive: boolean, extra?: string | false) =>
    cn(
      ITEM_BASE,
      NAV_HEIGHT[size],
      look[isActive ? 1 : 0],
      iconRail && cn(NAV_SQUARE[size], 'tw-justify-center tw-px-0'),
      stretch && 'tw-flex-1 tw-justify-center',
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
          className={cn('tw-flex tw-gap-2', vertical ? 'tw-flex-col' : 'tw-items-center')}
          style={vertical ? { height } : undefined}
        >
          {[0, 1, 2, 3, 4].slice(0, vertical ? 5 : 4).map((i) => (
            <Skeleton
              key={i}
              className={cn(vertical ? 'tw-h-8 tw-w-full' : 'tw-h-8 tw-w-20', vertical && i === 4 && 'tw-w-3/5')}
            />
          ))}
        </div>
      </Shell>
    );
  }

  // A parent opens its children as a dropdown in the top bar and the icon rail, as a nested list in the sidebar.
  const dropdown = (item: NavItem, isActive: boolean) => (
    <NavDropdown
      key={item.key}
      item={item}
      properties={properties}
      className={itemClass(isActive)}
      isActive={isActive}
      iconRail={iconRail}
      activeKey={found && found.parent?.key === item.key ? found.item.key : undefined}
      menuStyle={lookVars(componentType, styles)}
      onPick={pick}
    />
  );

  const rows: ReactNode[] = [];
  let group = '';
  items.forEach((item, index) => {
    if (item.separator) {
      rows.push(
        <div
          key={`sep-${index}`}
          role="separator"
          className={cn(
            SEPARATOR_LINE,
            vertical ? 'tw-my-2 tw-h-px tw-w-full tw-shrink-0' : 'tw-mx-1 tw-h-5 tw-w-px tw-shrink-0'
          )}
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
            className="tw-flex tw-h-8 tw-shrink-0 tw-items-center tw-px-2 tw-pt-2 tw-text-xs tw-font-medium tw-text-[color:var(--lk-group,var(--sc-muted-foreground))]"
          >
            {group}
          </div>
        );
      } else if (index > 0) {
        rows.push(
          <div
            key={`group-${index}`}
            role="separator"
            className={cn(
              SEPARATOR_LINE,
              vertical ? 'tw-my-2 tw-h-px tw-w-full tw-shrink-0' : 'tw-mx-1 tw-h-5 tw-w-px tw-shrink-0'
            )}
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
      // Its own entry only: a parent valued __proto__ or constructor must not find Object.prototype's members.
      const open = !!own(expanded, item.key);
      const childActive = found?.parent?.key === item.key;
      rows.push(
        <div key={item.key} className="tw-flex tw-w-full tw-shrink-0 tw-flex-col">
          <button
            type="button"
            aria-expanded={open}
            disabled={disabled || item.disabled}
            onClick={() => setExpanded((e) => ({ ...e, [item.key]: !open }))}
            className={itemClass(
              false,
              childActive && 'tw-font-medium tw-text-[color:var(--lk-active-fg,var(--sc-foreground))]'
            )}
          >
            <NavFace
              item={item}
              active={false}
              collapsed={false}
              chevron={
                <ChevronRight
                  className={cn(
                    'tw-h-4 tw-w-4 tw-shrink-0 tw-opacity-60 tw-transition-transform tw-duration-200',
                    open && 'tw-rotate-90'
                  )}
                />
              }
            />
          </button>
          {open ? (
            <ul className="tw-m-0 tw-ml-3.5 tw-mt-1 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-border-0 tw-border-l tw-border-solid tw-border-[color:var(--lk-sep,var(--sc-border))] tw-py-0.5 tw-pl-2.5 tw-pr-0">
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
                        'tw-h-8 tw-w-full',
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
        className={itemClass(isActive, vertical && !iconRail && 'tw-w-full')}
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
          'tw-flex tw-bg-[color:var(--lk-bg,transparent)]',
          isSet(styles?.backgroundColor) && (vertical ? 'tw-p-2' : 'tw-px-2'),
          vertical
            ? cn('tw-flex-col tw-gap-1 tw-overflow-y-auto tw-overflow-x-hidden', iconRail && 'tw-items-center')
            : cn(
                'tw-w-full tw-items-center tw-gap-1 tw-overflow-x-auto tw-overflow-y-hidden',
                variant === 'underline' &&
                  'tw-border-0 tw-border-b tw-border-solid tw-border-[color:var(--lk-sep,var(--sc-border))]',
                ({ center: 'tw-justify-center', end: 'tw-justify-end' } as Record<string, string>)[properties.align]
              )
        )}
        style={vertical ? { height } : undefined}
      >
        {items.length ? (
          rows
        ) : (
          <span className="tw-px-2 tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)]">No navigation items</span>
        )}
      </nav>
    </Shell>
  );
};

export default withControlState(ShadNavigation);
