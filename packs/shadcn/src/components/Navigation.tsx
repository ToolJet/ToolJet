import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { activeItemExposed, findNav, navItems, own, patchNavItems } from '../lib/ui2/nav/model';
import type { NavItem } from '../lib/ui2/nav/model';
import { isSet, lookVars, px } from '../lib/ui2/nav/look';
import { onArg, useStable } from '../lib/ui2/nav/hooks';
import { Icon, MenuLabel, MenuRows } from '../lib/ui2/nav/parts';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { NavSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

/** One item's face: icon (initials in the icon rail), label, badge, and a chevron when it has children. */
const NavFace = ({ item, collapsed, chevron }: { item: Pick<NavItem, 'icon' | 'label' | 'badge'>; collapsed: boolean; chevron?: React.ReactNode }) => (
  <>
    {item.icon ? (
      <Icon name={item.icon} className="n2-nav-icon" />
    ) : collapsed ? (
      <span className="n2-nav-initials">{item.label.slice(0, 2)}</span>
    ) : null}
    {collapsed ? <span className="n2-sr-only">{item.label}</span> : <span className="n2-nav-label">{item.label}</span>}
    {item.badge ? collapsed ? <span className="n2-nav-dot" aria-label={item.badge} /> : <span className="n2-nav-badge">{item.badge}</span> : null}
    {chevron}
  </>
);

// UI 2.0 Navigation: a sidebar or top bar of items with icons, badges, groups, separators and one level of children
// (a nested list in the sidebar, a dropdown in the top bar and the icon rail).
export const Navigation = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: 'Array of { label, value, icon, badge, group, disabled, visible, separator, children }.',
    initialValue: [
      { label: 'Dashboard', value: 'dashboard', icon: 'IconLayoutDashboard', group: 'Workspace' },
      { label: 'Orders', value: 'orders', icon: 'IconShoppingCart', badge: '12', group: 'Workspace' },
      { label: 'Customers', value: 'customers', icon: 'IconUsers', group: 'Workspace' },
      { label: 'Reports', value: 'reports', icon: 'IconChartBar', group: 'Insights' },
      { label: 'Settings', value: 'settings', icon: 'IconSettings', group: 'Insights' },
    ],
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Active item (value)', initialValue: '' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Selected item', initialValue: 'dashboard' });
  const [orientation] = ToolJet.useStateEnumeration({
    name: 'orientation',
    label: 'Orientation',
    enumDefinition: ['vertical', 'horizontal'],
    enumLabels: { vertical: 'Vertical', horizontal: 'Horizontal' },
    initialValue: 'vertical',
    inspector: 'switch',
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['pills', 'underline', 'ghost'],
    enumLabels: { pills: 'Pills', underline: 'Underline', ghost: 'Ghost' },
    initialValue: 'pills',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [align] = ToolJet.useStateEnumeration({
    name: 'align',
    label: 'Align (top bar)',
    enumDefinition: ['start', 'center', 'end', 'stretch'],
    enumLabels: { start: 'Start', center: 'Center', end: 'End', stretch: 'Stretch' },
    initialValue: 'start',
    inspector: 'switch',
  });
  const [collapsed, setCollapsed] = ToolJet.useStateBoolean({ name: 'collapsed', label: 'Collapsed (icon-only sidebar)', initialValue: false });
  const [showCollapseButton] = ToolJet.useStateBoolean({ name: 'showCollapseButton', label: 'Show collapse button', initialValue: false });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setPreviousSelectedItem] = ToolJet.useStateObject({ name: 'previousSelectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setIsCollapsed] = ToolJet.useStateBoolean({ name: 'isCollapsed', initialValue: false, inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { disabled } = ToolJet.useControlState();

  const backgroundColor = useThemeColor('backgroundColor', 'Background', 'transparent');
  const textColor = useThemeColor('textColor', 'Item text color', TOKEN.text);
  const iconColor = useThemeColor('iconColor', 'Item icon color', TOKEN.text);
  const hoverBackgroundColor = useThemeColor('hoverBackgroundColor', 'Item hover background', TOKEN.muted);
  const activeBackgroundColor = useThemeColor('activeBackgroundColor', 'Active item background', TOKEN.muted);
  const activeTextColor = useThemeColor('activeTextColor', 'Active item text color', TOKEN.text);
  const indicatorColor = useThemeColor('indicatorColor', 'Active indicator color (underline)', TOKEN.brand);
  const badgeBackgroundColor = useThemeColor('badgeBackgroundColor', 'Badge background', TOKEN.muted);
  const badgeTextColor = useThemeColor('badgeTextColor', 'Badge text color', TOKEN.mutedText);
  const groupLabelColor = useThemeColor('groupLabelColor', 'Group heading color', TOKEN.mutedText);
  const separatorColor = useThemeColor('separatorColor', 'Separator color', TOKEN.border);
  const itemRadius = useThemeRadius('itemRadius', 'Item radius');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 9, defaultHeight: 32 });

  // setItemVisibility and setItemDisable change one item until the Items change.
  const source = useStable(rawItems);
  const [changes, setChanges] = useState<Record<string, { visible?: boolean; disabled?: boolean }>>({});
  useEffect(() => setChanges({}), [source]);
  const items = useMemo(() => navItems(patchNavItems(source, changes)), [source, changes]);
  const change = (id: unknown, patch: { visible?: boolean; disabled?: boolean }) => {
    if (id === undefined || id === null || typeof id === 'object') return;
    setChanges((c) => ({ ...c, [String(id)]: { ...(c[String(id)] ?? {}), ...patch } }));
  };
  const found = findNav(items, value);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const parentKey = found?.parent?.key;
  useEffect(() => {
    if (parentKey) setExpanded((e) => ({ ...e, [parentKey]: true }));
  }, [parentKey]);

  const latest = useRef({ items, value });
  latest.current = { items, value };
  // The exposed item follows the value, however it was set.
  useEffect(() => setSelectedItem(activeItemExposed(found) ?? {}), [found?.item.key, found?.parent?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setIsCollapsed(!!collapsed), [collapsed, setIsCollapsed]);
  const moveTo = (next: string) => {
    const { items: all, value: now } = latest.current;
    if (next === now) return false;
    setPreviousSelectedItem(activeItemExposed(findNav(all, now)) ?? {});
    latest.current.value = next;
    setValue(next);
    setSelectedItem(activeItemExposed(findNav(all, next)) ?? {});
    return true;
  };
  // A new Active item (defaultValue) moves the selection, with no event.
  useEffect(() => {
    if (defaultValue !== '' && defaultValue != null) moveTo(String(defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const pick = (item: NavItem) => {
    if (item.disabled || disabled) return;
    moveTo(item.key);
    onClick();
  };
  ToolJet.useAction({ name: 'selectItem', displayName: 'Select item', params: [{ handle: 'id', displayName: 'Item value' }] }, (v) => {
    moveTo(v === undefined || v === null ? '' : String(v));
  });
  const itemParams = (label: string) => [
    { handle: 'id', displayName: 'Item value' },
    { handle: 'value', displayName: label, type: 'toggle' as const, defaultValue: '{{true}}' },
  ];
  ToolJet.useAction({ name: 'setItemVisibility', displayName: 'Set item visibility', params: itemParams('Visible') }, (id, v) => change(id, { visible: onArg(v) }));
  ToolJet.useAction({ name: 'setItemDisable', displayName: 'Set item disable', params: itemParams('Disable') }, (id, v) => change(id, { disabled: onArg(v) }));
  ToolJet.useAction(
    { name: 'setCollapsed', displayName: 'Set collapsed', params: [{ handle: 'value', displayName: 'Collapsed', type: 'toggle', defaultValue: '{{true}}' }] },
    (v) => setCollapsed(onArg(v))
  );

  const [anchorRef, container] = usePortalContainer<HTMLElement>();
  const vertical = orientation !== 'horizontal';
  const look = ['pills', 'underline', 'ghost'].includes(variant) ? variant : 'pills';
  const iconRail = vertical && !!collapsed;
  const vars = lookVars([
    [backgroundColor, '--lk-bg'],
    [textColor, '--lk-fg'],
    [iconColor, '--lk-icon'],
    [hoverBackgroundColor, '--lk-hover'],
    [activeBackgroundColor, '--lk-active-bg'],
    [activeTextColor, '--lk-active-fg'],
    [indicatorColor, '--lk-indicator'],
    [badgeBackgroundColor, '--lk-badge-bg'],
    [badgeTextColor, '--lk-badge-fg'],
    [groupLabelColor, '--lk-group'],
    [separatorColor, '--lk-sep'],
    [itemRadius, '--lk-radius', px],
  ]);

  // A parent opens its children as a dropdown in the top bar and the icon rail.
  const dropdown = (item: NavItem, isActive: boolean) => (
    <Menu.Root key={item.key} modal={false}>
      <Menu.Trigger asChild disabled={disabled || item.disabled}>
        <button type="button" className={cn('n2-nav-item', isActive && 'is-active')} title={iconRail ? item.label : undefined} aria-current={isActive ? 'true' : undefined}>
          <NavFace item={item} collapsed={iconRail} chevron={iconRail ? null : <ChevronDown size={14} className="n2-nav-chevron" />} />
        </button>
      </Menu.Trigger>
      {container ? (
        <Menu.Portal container={container}>
          <Menu.Content className="ui-popup n2-menu" align="start" side={iconRail ? 'right' : 'bottom'} sideOffset={4} style={{ ...vars, ['--lk-item-hover' as string]: 'var(--lk-hover, var(--ui-muted))' }}>
            {iconRail ? <MenuLabel>{item.label}</MenuLabel> : null}
            <MenuRows
              rows={item.children.map((child) => ({ kind: 'item' as const, ...child, description: '' }))}
              activeKey={found && found.parent?.key === item.key ? found.item.key : undefined}
              onPick={(child) => pick(item.children.find((c) => c.key === String(child.value)) ?? child)}
            />
          </Menu.Content>
        </Menu.Portal>
      ) : null}
    </Menu.Root>
  );

  const rows: React.ReactNode[] = [];
  let group = '';
  const separator = (key: string) => <div key={key} role="separator" className="n2-nav-sep" />;
  items.forEach((item, index) => {
    if (item.separator) {
      rows.push(separator(`sep-${index}`));
      return;
    }
    if (item.group !== group) {
      group = item.group;
      if (vertical && !iconRail && group) {
        rows.push(
          <div key={`group-${index}`} className="n2-nav-group">
            {group}
          </div>
        );
      } else if (index > 0) rows.push(separator(`group-${index}`));
    }
    const isActive = found ? found.item.key === item.key || found.parent?.key === item.key : false;
    if (item.children.length && (!vertical || iconRail)) {
      rows.push(dropdown(item, isActive));
      return;
    }
    if (item.children.length) {
      const open = !!own(expanded, item.key);
      rows.push(
        <div key={item.key} className="n2-nav-parent">
          <button
            type="button"
            aria-expanded={open}
            disabled={disabled || item.disabled}
            onClick={() => setExpanded((e) => ({ ...e, [item.key]: !open }))}
            className={cn('n2-nav-item', found?.parent?.key === item.key && 'has-active-child')}
          >
            <NavFace item={item} collapsed={false} chevron={<ChevronRight size={16} className={cn('n2-nav-chevron', open && 'is-open')} />} />
          </button>
          {open ? (
            <ul className="n2-nav-children">
              {item.children.map((child) => {
                const on = found?.item.key === child.key;
                return (
                  <li key={child.key}>
                    <button type="button" aria-current={on ? 'page' : undefined} disabled={disabled || child.disabled} onClick={() => pick(child)} className={cn('n2-nav-item', on && 'is-active')}>
                      <NavFace item={child} collapsed={false} />
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
        className={cn('n2-nav-item', isActive && 'is-active')}
      >
        <NavFace item={item} collapsed={iconRail} />
      </button>
    );
  });

  return (
    <LoadingFrame loading={ld.loading} minHeight={40} look={ld.skeleton ? <NavSkel vertical={vertical} /> : <LoadingBox />}>
      <nav
        ref={anchorRef}
        aria-label="Navigation"
        className={cn(
          'ui n2-nav',
          vertical ? 'is-vertical' : 'is-horizontal',
          `is-${look}`,
          size !== 'default' && `is-${size}`,
          iconRail && 'is-rail',
          !vertical && `is-align-${align}`,
          isSet(backgroundColor) && 'has-bg'
        )}
        style={vars}
      >
        {items.length ? rows : <span className="n2-empty" style={{ padding: '0 8px' }}>No navigation items</span>}
        {vertical && showCollapseButton ? (
          <button type="button" className="n2-nav-item n2-nav-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed ? <span className="n2-nav-label">Collapse</span> : null}
          </button>
        ) : null}
      </nav>
    </LoadingFrame>
  );
};
