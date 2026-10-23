import React, { useRef } from 'react';
import { Button, Divider, ListItemIcon, ListItemText, Menu as MuiMenu, MenuItem } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, usePopupContainer, useThemeStyles } from '../lib/MuiProvider';
import { ICONS, iconOf } from '../lib/icons';
import { lookOf } from '../lib/field';
import { str, toArray, type Row } from '../lib/data';

type Item = { label: string; value: string; icon?: string; disabled?: boolean; divider?: boolean };
const toItems = (raw: unknown): Item[] =>
  toArray(raw)
    .map((o): Item | null => {
      if (typeof o === 'string') return { label: o, value: o };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      if (r.divider === true && !r.label) return { label: '', value: '', divider: true };
      const value = str(r.value ?? r.key ?? r.label);
      return { label: str(r.label ?? value), value, icon: str(r.icon) || undefined, disabled: Boolean(r.disabled), divider: Boolean(r.divider) };
    })
    .filter((o): o is Item => !!o && (o.divider || o.value !== ''));

// MUI's Menu opened from a Button: the button's children (text), variant and color; items [{ label, value, icon,
// disabled, divider }] as MenuItems; anchorOrigin (where the menu opens). clickedItem is exposed. Events onItemClick,
// onOpen, onClose (MUI's: Escape, a click away, or an item); actions open and close.
export const Menu = () => {
  const [children] = useStateText({ name: 'children', label: 'Button text', initialValue: 'Actions' });
  const [variantProp] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['text', 'outlined', 'contained'], initialValue: 'outlined' });
  const [colorProp] = ToolJet.useStateEnumeration({
    name: 'color',
    label: 'Color',
    enumDefinition: ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
    initialValue: 'primary',
  });
  const { variant, color } = lookOf(variantProp, colorProp);
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: true });
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
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
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const [, setClickedItem] = ToolJet.useStateObject({ name: 'clickedItem', initialValue: {}, inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const onOpen = ToolJet.useEventCallback({ name: 'onOpen' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const { disabled, loading } = ToolJet.useControlState();
  const anchor = useRef<HTMLButtonElement>(null);
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4.1 });
  const items = toItems(rawItems);
  const show = (next: boolean) => {
    if (next === !!open) return;
    setOpen(next);
    (next ? onOpen : onClose)();
  };
  ToolJet.useAction({ name: 'open', displayName: 'Open' }, () => show(true));
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => show(false));

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center">
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
          setClickedItem({ label: item.label, value: item.value });
          show(false);
          onItemClick();
        }}
      />
    </MuiProvider>
  );
};

const MenuPopup = (p: { open: boolean; anchorEl: HTMLElement | null; right: boolean; items: Item[]; onClose: () => void; onPick: (item: Item) => void }) => {
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
