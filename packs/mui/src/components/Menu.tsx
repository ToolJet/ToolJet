import React, { useRef } from 'react';
import { Button, Divider, ListItemIcon, ListItemText, Menu as MuiMenu, MenuItem } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, usePopupContainer, useThemeStyles } from '../lib/MuiProvider';
import { ICONS, iconOf } from '../lib/icons';
import { lookOf } from '../lib/field';
import { str, toArray, type Row } from '../lib/data';
import { useOwnerGuard } from '../lib/useOwnerGuard';

type Item = { label: string; value: string; icon?: string; disabled?: boolean; divider?: boolean };
const toItems = (raw: unknown): Item[] =>
  toArray(raw)
    .map((o): Item | null => {
      if (typeof o === 'string') return { label: o, value: o };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      if (r.divider === true && !r.label) return { label: '', value: '', divider: true };
      const value = str(r.value ?? r.key ?? r.label);
      return {
        label: str(r.label ?? value),
        value,
        icon: str(r.icon) || undefined,
        disabled: Boolean(r.disabled),
        divider: Boolean(r.divider),
      };
    })
    .filter((o): o is Item => !!o && (o.divider || o.value !== ''));

// MUI's Menu opened from a Button: the button's children (text), variant and color; items [{ label, value, icon,
// disabled, divider }] as MenuItems; anchorOrigin (where the menu opens). clickedItem is exposed. Events onItemClick,
// onOpen, onClose (MUI's: Escape, a click away, or an item); actions open and close.
export const Menu = () => {
  const [children] = useStateText({ name: 'children', label: 'Button text', initialValue: 'Actions' });
  const [variantProp] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['text', 'outlined', 'contained'],
    initialValue: 'outlined',
  });
  const [colorProp] = ToolJet.useStateEnumeration({
    name: 'color',
    label: 'Color',
    enumDefinition: ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
    initialValue: 'primary',
  });
  const { variant, color } = lookOf(variantProp, colorProp);
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['small', 'medium', 'large'],
    initialValue: 'medium',
  });
  const [fullWidth] = ToolJet.useStateBoolean({
    name: 'fullWidth',
    label: 'Full width',
    description: 'Stretch the menu button to the width of its box; off, it is as wide as its label.',
    initialValue: true,
  });
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    // The inspector's options editor, as UI 2.0's dropdown menu items (divider and other keys are kept as written).
    inspector: 'options',
    description: `[{ label, value, icon, disabled, divider }]; icon is a name: ${Object.keys(ICONS).slice(0, 8).join(', ')}...`,
    initialValue: [
      { label: 'Edit', value: 'edit', icon: 'Edit' },
      { label: 'Delete', value: 'delete', icon: 'Delete' },
    ],
  });
  const [anchorOrigin] = ToolJet.useStateEnumeration({
    name: 'anchorOrigin',
    label: 'Anchor origin',
    enumDefinition: ['bottom-left', 'bottom-right'],
    initialValue: 'bottom-left',
  });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'isOpen', initialValue: false, inspector: 'hidden' });
  const [, setClickedItem] = ToolJet.useStateObject({ name: 'clickedItem', initialValue: {}, inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const { disabled, loading } = ToolJet.useControlState();
  const anchor = useRef<HTMLButtonElement>(null);
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({
    role: 'dropdownmenu',
    fit: false,
    loading: 'own',
    usage:
      "MUI's Menu opened from a Button: children (button text), variant, color, size, items [{label, value, icon, disabled, divider}], anchorOrigin; clickedItem exposed. onItemClick, onOpen, onClose; open, close. The menu opens in the popup layer.",
    roleProps: { label: 'children', variant: 'variant' },
    roleValues: {
      variant: {
        default: { variant: 'contained', color: 'primary' },
        secondary: { variant: 'outlined', color: 'inherit' },
        outline: { variant: 'outlined', color: 'primary' },
        ghost: { variant: 'text', color: 'inherit' },
        destructive: { variant: 'contained', color: 'error' },
        link: { variant: 'text', color: 'primary' },
      },
    },
    roleEvents: { onSelect: 'onItemClick' },
    defaultWidth: 6,
    defaultHeight: 4,
  });
  const items = toItems(rawItems);
  // Open as the last call left it: open() twice in one event handler (before a render) fired onOpen twice.
  const openRef = useRef(!!open);
  openRef.current = !!open;
  const show = (next: boolean) => {
    if (next === openRef.current) return;
    openRef.current = next;
    setOpen(next);
    (next ? onOpen : onClose)();
  };
  // The menu portals into the popup layer, out of reach of the host's Disable and of a parent that hides or blocks the
  // widget: it closes (with onClose) once its button cannot take input, and refuses a pick made in that instant.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const available = useOwnerGuard(rootRef, !!open, () => show(false), disabled || loading);
  ToolJet.useAction({ name: 'open', displayName: 'Open' }, () => show(true));
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => show(false));

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center" rootRef={rootRef}>
      <Button
        ref={anchor}
        variant={variant as 'outlined'}
        color={color as 'primary'}
        size={size as 'medium'}
        fullWidth={fullWidth}
        disabled={disabled}
        loading={loading}
        endIcon={iconOf('KeyboardArrowDown')}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        title={children || undefined}
        onClick={() => show(!open)}
      >
        <span className="tj-mui-button-label">{children}</span>
      </Button>
      <MenuPopup
        open={!!open}
        anchorEl={anchor.current}
        right={anchorOrigin === 'bottom-right'}
        items={items}
        onClose={() => show(false)}
        onPick={(item) => {
          if (!available()) return;
          setClickedItem({ label: item.label, value: item.value });
          show(false);
          onItemClick();
        }}
      />
    </MuiProvider>
  );
};

const MenuPopup = (p: {
  open: boolean;
  anchorEl: HTMLElement | null;
  right: boolean;
  items: Item[];
  onClose: () => void;
  onPick: (item: Item) => void;
}) => {
  const container = usePopupContainer();
  if (!container) return null;
  const horizontal = p.right ? 'right' : 'left';
  return (
    <MuiMenu
      open={p.open && !!p.anchorEl}
      anchorEl={p.anchorEl}
      container={container}
      anchorOrigin={{ vertical: 'bottom', horizontal }}
      transformOrigin={{ vertical: 'top', horizontal }}
      onClose={p.onClose}
      slotProps={{ paper: { sx: { minWidth: p.anchorEl?.offsetWidth } } }}
    >
      {p.items.map((item, i) =>
        item.divider && !item.label ? (
          <Divider key={`divider-${i}`} />
        ) : (
          <MenuItem key={item.value} disabled={item.disabled} divider={item.divider} onClick={() => p.onPick(item)}>
            {item.icon && ICONS[item.icon] ? <ListItemIcon>{iconOf(item.icon, 'small')}</ListItemIcon> : null}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        )
      )}
    </MuiMenu>
  );
};
