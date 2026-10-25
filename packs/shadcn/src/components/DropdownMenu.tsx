import React, { useRef, useState } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronDown, Ellipsis } from 'lucide-react';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { popupLayerStyle } from '../lib/popupLayer';
import { moveRovingFocus } from '../lib/activeElement';
import { clickedOption, menuRows } from '../lib/ui2/nav/model';
import { isSet, lookVars, px } from '../lib/ui2/nav/look';
import { Icon, MenuRows, MenuSeparator } from '../lib/ui2/nav/parts';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];

// UI 2.0 Dropdown menu: a button (or an icon) that opens a menu of actions with icons, descriptions, shortcuts,
// groups and separators. The menu renders in the pack's popup layer, so it takes the widget's style variables itself.
export const DropdownMenu = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Actions' });
  const [triggerType] = ToolJet.useStateEnumeration({
    name: 'triggerType',
    label: 'Trigger',
    enumDefinition: ['button', 'icon'],
    enumLabels: { button: 'Button', icon: 'Icon' },
    initialValue: 'button',
    inspector: 'switch',
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    enumLabels: { default: 'Default', secondary: 'Secondary', outline: 'Outline', ghost: 'Ghost', destructive: 'Destructive', link: 'Link' },
    initialValue: 'outline',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [triggerIcon] = ToolJet.useStateString({ name: 'triggerIcon', label: 'Trigger icon (Tabler name, e.g. IconDots)', initialValue: '', inspector: 'icon' });
  const [showChevron] = ToolJet.useStateBoolean({ name: 'showChevron', label: 'Show chevron', initialValue: true });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: false });
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    inspector: 'options',
    description:
      '{ label, value, icon, description, shortcut, disabled, visible, destructive, separator, group }, plain strings, or { heading: "..." }.',
    initialValue: [
      { label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' },
      { label: 'Duplicate', value: 'duplicate', icon: 'IconCopy', shortcut: '⌘D' },
      { label: 'Archive', value: 'archive', icon: 'IconArchive' },
      { label: 'Delete', value: 'delete', icon: 'IconTrash', destructive: true, separator: true },
    ],
  });
  const [menuLabel] = ToolJet.useStateString({ name: 'menuLabel', label: 'Menu heading', initialValue: '' });
  const [align] = ToolJet.useStateEnumeration({
    name: 'align',
    label: 'Menu align',
    enumDefinition: ['start', 'center', 'end'],
    enumLabels: { start: 'Start', center: 'Center', end: 'End' },
    initialValue: 'start',
    inspector: 'switch',
  });
  const [side] = ToolJet.useStateEnumeration({
    name: 'side',
    label: 'Menu side',
    enumDefinition: ['bottom', 'top', 'right', 'left'],
    enumLabels: { bottom: 'Bottom', top: 'Top', right: 'Right', left: 'Left' },
    initialValue: 'bottom',
    inspector: 'switch',
  });
  const [optionsLoading] = ToolJet.useStateBoolean({ name: 'optionsLoadingState', label: 'Options loading state', initialValue: false });
  const [, setLastClickedOption] = ToolJet.useStateObject({ name: 'lastClickedOption', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItem] = ToolJet.useStateString({ name: 'selectedItem', initialValue: '', inspector: 'hidden' });
  const [, setIsOpen] = ToolJet.useStateBoolean({ name: 'isOpen', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const { disabled, loading } = ToolJet.useControlState();

  const backgroundColor = useThemeColor('backgroundColor', 'Trigger background', TOKEN.surface);
  const hoverBackgroundColor = useThemeColor('hoverBackgroundColor', 'Trigger hover background', TOKEN.muted);
  const textColor = useThemeColor('textColor', 'Trigger text color', TOKEN.text);
  const borderColor = useThemeColor('borderColor', 'Trigger border color', TOKEN.border);
  const borderRadius = useThemeRadius('borderRadius', 'Trigger radius');
  const menuBackgroundColor = useThemeColor('menuBackgroundColor', 'Menu background', TOKEN.surface, { section: 'Menu' });
  const menuBorderColor = useThemeColor('menuBorderColor', 'Menu border color', TOKEN.border, { section: 'Menu' });
  const itemTextColor = useThemeColor('itemTextColor', 'Item text color', TOKEN.text, { section: 'Menu' });
  const itemHoverBackgroundColor = useThemeColor('itemHoverBackgroundColor', 'Item hover background', TOKEN.muted, { section: 'Menu' });
  const itemHoverTextColor = useThemeColor('itemHoverTextColor', 'Item hover text color', TOKEN.text, { section: 'Menu' });
  const descriptionColor = useThemeColor('descriptionColor', 'Item description and shortcut color', TOKEN.mutedText, { section: 'Menu' });
  const iconColor = useThemeColor('iconColor', 'Item icon color', TOKEN.mutedText, { section: 'Menu' });
  const destructiveColor = useThemeColor('destructiveColor', 'Destructive item color', TOKEN.error, { section: 'Menu' });
  const menuRadius = useThemeRadius('menuRadius', 'Menu radius', { section: 'Menu' });
  const menuWidth = ToolJet.useStyleNumber({ name: 'menuWidth', label: 'Menu width (px)', initialValue: '', placeholder: 'Fits the items', section: 'Menu' });
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });

  const [anchorRef, container] = usePortalContainer();
  const [open, setOpen] = useState(false);
  // Open as of the last change, ahead of the next render: the owner guard and the disabled effect below can both close
  // the menu in one commit, which is still one close (one onClose).
  const openRef = useRef(open);
  // Set while a close by useOwnerGuard is under way: focus does not go back to a trigger that cannot take input.
  const ownerClosed = useRef(false);
  // Whether the trigger opened the menu by keyboard (Enter, Space, ArrowDown): then focus starts on the first action.
  const openedByKeyboard = useRef(false);
  const changeOpen = (next: boolean) => {
    if (next && disabled) return;
    if (next === openRef.current) return;
    if (next) ownerClosed.current = false;
    openRef.current = next;
    setOpen(next);
    setIsOpen(next);
    if (next) onOpen();
    else onClose();
  };
  // An open popup closes when its owner stops taking input (disabled, or blocked or hidden by the host): the same close
  // as a dismiss, so isOpen reads false and onClose fires; closing only the drawn menu left both stale (SP-24).
  useOwnerGuard(
    anchorRef,
    open,
    () => {
      ownerClosed.current = true;
      changeOpen(false);
    },
    disabled
  );
  ToolJet.useAction({ name: 'open', displayName: 'Open' }, () => {
    openedByKeyboard.current = false;
    changeOpen(true);
  });
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => changeOpen(false));
  // Disabled (or loading) closes an open menu.
  React.useEffect(() => {
    if (disabled && open) changeOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const vars = lookVars([
    [backgroundColor, '--lk-bg'],
    [hoverBackgroundColor, '--lk-hover'],
    [textColor, '--lk-fg'],
    [borderColor, '--lk-border'],
    [borderRadius, '--lk-radius', px],
    [menuBackgroundColor, '--lk-menu-bg'],
    [menuBorderColor, '--lk-menu-border'],
    [itemTextColor, '--lk-item-fg'],
    [itemHoverBackgroundColor, '--lk-item-hover'],
    [itemHoverTextColor, '--lk-item-hover-fg'],
    [descriptionColor, '--lk-desc'],
    [iconColor, '--lk-icon'],
    [destructiveColor, '--lk-destructive'],
    [menuRadius, '--lk-menu-radius', px],
    [menuWidth, '--lk-menu-width', px],
  ]);
  // A popup in a Dialog's body stacks above the dialog (popupLayer.ts), read off the owner as it opens.
  const popVars = open ? { ...vars, ...popupLayerStyle(anchorRef.current) } : vars;
  const rows = menuRows(rawItems);
  const look = VARIANTS.includes(variant) ? variant : 'outline';
  const iconOnly = triggerType === 'icon';
  const icon = String(triggerIcon ?? '').trim();
  const text = String(label ?? '');
  // Keyboard focus in the menu, read from the menu's own root. Radix's menu and roving focus compare
  // document.activeElement, which inside the inline runtime's shadow root stays the host while focus moves, so opening
  // by keyboard landed on the last action, and Home and End went to the opposite ends (SP-22).
  const actions = (content: HTMLElement) =>
    Array.from(content.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
      (el) => !el.hasAttribute('data-disabled') && el.closest('[data-radix-menu-content]') === content
    );
  const menuKeys = {
    // Opened by keyboard, the menu starts on its first enabled action; opened by pointer, on the menu itself (Radix's
    // entry focus, which this replaces).
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      if (openedByKeyboard.current) actions(e.currentTarget)[0]?.focus();
    },
    // Up and Down move between enabled actions without wrapping; Home and End go to the first and last. Consumed here,
    // ahead of the items' own Radix handlers.
    onKeyDownCapture: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const content = e.currentTarget;
      if (e.target !== content) {
        moveRovingFocus(e, actions(content), { orientation: 'vertical' });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const first = ['ArrowDown', 'PageUp', 'Home'].includes(e.key);
      if (!first && !['ArrowUp', 'PageDown', 'End'].includes(e.key)) return;
      e.preventDefault();
      const items = actions(content);
      (first ? items[0] : items[items.length - 1])?.focus();
    },
  };
  const pick = (row: { value: unknown; label: string; description: string }) => {
    if (disabled) return;
    const option = clickedOption(row as Parameters<typeof clickedOption>[0]);
    setLastClickedOption(option);
    setSelectedItem(String(option.value));
    onSelect();
  };

  return (
    <div className="ui" ref={anchorRef} style={{ display: 'flex', alignItems: 'center', ...vars }}>
      <Menu.Root modal={false} open={open && !disabled} onOpenChange={changeOpen}>
        <Menu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            onPointerDown={() => {
              openedByKeyboard.current = false;
            }}
            onKeyDown={(e) => {
              if (['Enter', ' ', 'ArrowDown'].includes(e.key)) openedByKeyboard.current = true;
            }}
            aria-label={iconOnly ? text || 'More actions' : undefined}
            title={iconOnly && text ? text : undefined}
            className={cn(
              'ui-btn n2-btn n2-trigger',
              `ui-btn--${look}`,
              size !== 'default' && `ui-btn--${size}`,
              iconOnly ? 'n2-btn--icon' : fullWidth ? 'is-full' : 'ui-btn--auto',
              isSet(backgroundColor) && 'has-bg',
              isSet(hoverBackgroundColor) && 'has-hover',
              isSet(textColor) && 'has-fg',
              isSet(borderColor) && 'has-border'
            )}
          >
            {iconOnly ? (
              loading ? (
                <span className="n2-spinner" />
              ) : icon ? (
                <Icon name={icon} />
              ) : (
                <Ellipsis size={16} />
              )
            ) : (
              <>
                <span className="n2-trigger-face">
                  {loading ? <span className="n2-spinner" /> : <Icon name={icon} />}
                  <span className="n2-truncate">{text}</span>
                </span>
                {showChevron !== false ? <ChevronDown size={16} className="n2-chevron" /> : null}
              </>
            )}
          </button>
        </Menu.Trigger>
        {container ? (
          <Menu.Portal container={container}>
            <Menu.Content
              className="ui-popup n2-menu"
              align={(['start', 'center', 'end'].includes(align) ? align : 'start') as 'start'}
              side={(['bottom', 'top', 'right', 'left'].includes(side) ? side : 'bottom') as 'bottom'}
              sideOffset={4}
              style={popVars}
              {...menuKeys}
              onCloseAutoFocus={(e) => {
                if (ownerClosed.current) e.preventDefault();
              }}
            >
              {menuLabel ? (
                <>
                  <Menu.Label className="n2-menu-heading">{String(menuLabel)}</Menu.Label>
                  <MenuSeparator />
                </>
              ) : null}
              {optionsLoading ? (
                <div className="n2-menu-skeleton" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="n2-skeleton" style={{ height: 24, width: i === 2 ? '60%' : '100%' }} />
                  ))}
                </div>
              ) : (
                <MenuRows rows={rows} onPick={pick} />
              )}
            </Menu.Content>
          </Menu.Portal>
        ) : null}
      </Menu.Root>
    </div>
  );
};
