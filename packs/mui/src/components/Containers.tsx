import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  CardHeader,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List as MuiList,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Pagination,
  Tab,
  Tabs as MuiTabs,
} from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, usePopupContainer, useThemeStyles } from '../lib/MuiProvider';
import { PALETTE_COLORS } from '../lib/field';
import { readField, rowKeyOf, str, toKeyedItems, toRows, type Row } from '../lib/data';
import { formatCell } from '../lib/format';
import { BlockSkeleton, Loading, Spinner } from '../lib/loading';

// Slot names become part of a canvas id: letters, digits and underscores only.
const slotKey = (key: string) => key.replace(/[^A-Za-z0-9_]/g, '_');

// MUI's Tabs: tabs [{ value, label, disabled }], value (the open tab; empty opens the first), variant (standard,
// scrollable, fullWidth), textColor / indicatorColor, centered, orientation; each tab panel is a canvas of ToolJet
// components (slot tab_<value>). Event onChange; action setValue.
export const Tabs = () => {
  const [rawTabs] = ToolJet.useStateArray({
    name: 'tabs',
    label: 'Tabs',
    description: '[{ value, label }]; each tab holds its own components.',
    initialValue: [
      { value: 'tab1', label: 'Tab 1' },
      { value: 'tab2', label: 'Tab 2' },
    ],
  });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The open tab; empty opens the first.', initialValue: '' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['standard', 'scrollable', 'fullWidth'], initialValue: 'standard' });
  const [textColor] = ToolJet.useStateEnumeration({ name: 'textColor', label: 'Text color', enumDefinition: ['primary', 'secondary', 'inherit'], initialValue: 'primary' });
  const [indicatorColor] = ToolJet.useStateEnumeration({ name: 'indicatorColor', label: 'Indicator color', enumDefinition: ['primary', 'secondary'], initialValue: 'primary' });
  const [centered] = ToolJet.useStateBoolean({ name: 'centered', label: 'Centered', initialValue: false });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 40 });
  const tabs = toKeyedItems(rawTabs);
  const current = tabs.some((t) => t.key === value) ? value : (tabs[0]?.key ?? false);
  const change = (next: string) => {
    setValue(next);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Tab value' }] }, (v) => change(str(v)));
  const vertical = orientation === 'vertical';

  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<Spinner />}>
        <div className={vertical ? 'tj-mui--fill tj-mui-tabs tj-mui-tabs--vertical' : 'tj-mui--fill tj-mui-tabs'}>
          <MuiTabs
            value={current}
            variant={variant as 'standard'}
            scrollButtons="auto"
            textColor={textColor as 'primary'}
            indicatorColor={indicatorColor as 'primary'}
            centered={centered && variant === 'standard' && !vertical}
            orientation={orientation as 'horizontal'}
            onChange={(_, next) => change(String(next))}
            sx={vertical ? { borderRight: 1, borderColor: 'divider' } : { borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} disabled={t.disabled} />
            ))}
          </MuiTabs>
          {/* MUI's tab panel pattern: every panel mounted, the inactive ones hidden, so each keeps its canvas. */}
          {tabs.map((t) => (
            <div key={t.key} role="tabpanel" hidden={t.key !== current} className="tj-mui-tabpanel">
              <ToolJet.Slot name={`tab_${slotKey(t.key)}`} style={{ height: '100%' }} />
            </div>
          ))}
        </div>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Card: a CardHeader (title, subheader), variant (elevation, outlined), elevation, raised; its CardContent is
// a canvas of ToolJet components (slot body). Event onClick.
export const Card = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: '' });
  const [subheader] = ToolJet.useStateString({ name: 'subheader', label: 'Subheader', initialValue: '' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['outlined', 'elevation'], initialValue: 'outlined' });
  const [elevation] = ToolJet.useStateNumber({ name: 'elevation', label: 'Elevation', initialValue: 1, min: 0, max: 24, visibleWhen: { key: 'variant', value: 'elevation' } });
  const [raised] = ToolJet.useStateBoolean({ name: 'raised', label: 'Raised', initialValue: false, visibleWhen: { key: 'variant', value: 'elevation' } });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 40 });
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<BlockSkeleton />}>
        <MuiCard
          variant={variant as 'outlined'}
          elevation={variant === 'elevation' ? Number(elevation) || 0 : undefined}
          raised={variant === 'elevation' && raised}
          onClick={() => onClick()}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {title || subheader ? <CardHeader title={title || undefined} subheader={subheader || undefined} slotProps={{ title: { variant: 'h6' } }} /> : null}
          <CardContent sx={{ flex: 1, minHeight: 0, pt: title || subheader ? 0 : undefined, '&:last-child': { pb: 2 } }}>
            <ToolJet.Slot name="body" style={{ height: '100%' }} />
          </CardContent>
        </MuiCard>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Dialog: open, title (DialogTitle), contentText (DialogContentText above the body), maxWidth (xs to xl),
// fullWidth, fullScreen, scroll; DialogActions with cancelText and confirmText, confirmColor (error for a destructive
// confirm); the DialogContent body is a canvas of ToolJet components in the popup layer (slot body). A trigger
// Button stands on the canvas. Events onClose (MUI's: backdrop, Escape or Cancel), onConfirm, onCancel, onEntered;
// actions open and close.
export const Dialog = () => {
  const [triggerText] = ToolJet.useStateString({ name: 'triggerText', label: 'Trigger text', initialValue: 'Open dialog' });
  const [showTrigger] = ToolJet.useStateBoolean({ name: 'showTrigger', label: 'Show trigger', description: 'A button on the canvas that opens the dialog.', initialValue: true });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Dialog' });
  const [contentText] = ToolJet.useStateString({ name: 'contentText', label: 'Content text', description: 'Text above the body components.', initialValue: '' });
  const [confirmText] = ToolJet.useStateString({ name: 'confirmText', label: 'Confirm text', description: 'Empty for no confirm button.', initialValue: 'Confirm' });
  const [cancelText] = ToolJet.useStateString({ name: 'cancelText', label: 'Cancel text', description: 'Empty for no cancel button.', initialValue: 'Cancel' });
  const [confirmColor] = ToolJet.useStateEnumeration({ name: 'confirmColor', label: 'Confirm color', enumDefinition: PALETTE_COLORS, initialValue: 'primary' });
  const [maxWidth] = ToolJet.useStateEnumeration({ name: 'maxWidth', label: 'Max width', enumDefinition: ['xs', 'sm', 'md', 'lg', 'xl'], initialValue: 'sm' });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', description: 'As wide as maxWidth.', initialValue: true });
  const [fullScreen] = ToolJet.useStateBoolean({ name: 'fullScreen', label: 'Full screen', initialValue: false });
  const [scroll] = ToolJet.useStateEnumeration({ name: 'scroll', label: 'Scroll', enumDefinition: ['paper', 'body'], initialValue: 'paper' });
  const [bodyHeight] = ToolJet.useStateNumber({ name: 'bodyHeight', label: 'Body height (px)', description: '0 for no body components.', initialValue: 200, min: 0, max: 2000 });
  const [disableEscapeKeyDown] = ToolJet.useStateBoolean({ name: 'disableEscapeKeyDown', label: 'Disable Escape key', initialValue: false });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const onConfirm = ToolJet.useEventCallback({ name: 'onConfirm' });
  const onCancel = ToolJet.useEventCallback({ name: 'onCancel' });
  const onEntered = ToolJet.useEventCallback({ name: 'onEntered' });
  const { disabled, loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4.1 });
  ToolJet.useAction({ name: 'open', displayName: 'Open' }, () => setOpen(true));
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => setOpen(false));
  const close = () => {
    setOpen(false);
    onClose();
  };

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center">
      {showTrigger ? (
        <Button variant="contained" fullWidth disabled={disabled} loading={loading} onClick={() => setOpen(true)}>
          {triggerText}
        </Button>
      ) : null}
      <DialogBody
        open={!!open}
        title={title}
        contentText={contentText}
        confirmText={confirmText}
        cancelText={cancelText}
        confirmColor={confirmColor as 'primary'}
        maxWidth={maxWidth as 'sm'}
        fullWidth={fullWidth}
        fullScreen={fullScreen}
        scroll={scroll as 'paper'}
        bodyHeight={Math.max(0, Math.min(2000, Number(bodyHeight) || 0))}
        disableEscapeKeyDown={disableEscapeKeyDown}
        loading={loading}
        onClose={close}
        onCancel={() => {
          close();
          onCancel();
        }}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        onEntered={() => onEntered()}
      />
    </MuiProvider>
  );
};

const DialogBody = (p: {
  open: boolean;
  title: string;
  contentText: string;
  confirmText: string;
  cancelText: string;
  confirmColor: 'primary';
  maxWidth: 'sm';
  fullWidth: boolean;
  fullScreen: boolean;
  scroll: 'paper';
  bodyHeight: number;
  disableEscapeKeyDown: boolean;
  loading: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onEntered: () => void;
}) => {
  const container = usePopupContainer();
  // Portal only once the popup layer is known: MUI would otherwise mount the dialog on document.body, unstyled.
  if (!container) return null;
  return (
    <MuiDialog
      open={p.open}
      container={container}
      maxWidth={p.maxWidth}
      fullWidth={p.fullWidth}
      fullScreen={p.fullScreen}
      scroll={p.scroll}
      // The body's ToolJet components are light-DOM children of the popup layer: MUI's focus trap would pull focus
      // back out of them.
      disableEnforceFocus
      keepMounted
      onClose={(_, reason) => {
        if (reason === 'escapeKeyDown' && p.disableEscapeKeyDown) return;
        p.onClose();
      }}
      slotProps={{ transition: { onEntered: p.onEntered } }}
    >
      {p.title ? <DialogTitle>{p.title}</DialogTitle> : null}
      <DialogContent dividers={p.scroll === 'paper' && p.bodyHeight > 0}>
        {p.contentText ? <DialogContentText sx={{ mb: p.bodyHeight > 0 ? 2 : 0 }}>{p.contentText}</DialogContentText> : null}
        {p.bodyHeight > 0 ? <ToolJet.PopupSlot name="body" style={{ height: p.bodyHeight }} /> : null}
      </DialogContent>
      {p.cancelText || p.confirmText ? (
        <DialogActions>
          {p.cancelText ? <Button onClick={p.onCancel}>{p.cancelText}</Button> : null}
          {p.confirmText ? (
            <Button variant="contained" color={p.confirmColor} loading={p.loading} onClick={p.onConfirm}>
              {p.confirmText}
            </Button>
          ) : null}
        </DialogActions>
      ) : null}
    </MuiDialog>
  );
};

// MUI's List: items; each is either MUI's ListItemText (primaryField, secondaryField, an avatar from avatarField)
// or, with renderItem 'components', a row of ToolJet components reading {{listItem}} (rowHeight). subheader, dense,
// divider (lines between items), pageSize (0 for no paging). Event onItemClick with selectedItem exposed.
export const List = () => {
  const [rawItems] = ToolJet.useStateArray({ name: 'items', label: 'Items', initialValue: [] });
  const [renderItem] = ToolJet.useStateEnumeration({
    name: 'renderItem',
    label: 'Render item',
    enumDefinition: ['listItemText', 'components'],
    enumLabels: { listItemText: 'Fields (ListItemText)', components: 'Components' },
    initialValue: 'listItemText',
  });
  const textMode = { key: 'renderItem', value: 'listItemText' };
  const [primaryField] = ToolJet.useStateString({ name: 'primaryField', label: 'Primary field', initialValue: 'title', visibleWhen: textMode });
  const [secondaryField] = ToolJet.useStateString({ name: 'secondaryField', label: 'Secondary field', initialValue: 'description', visibleWhen: textMode });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field', description: 'An image URL field.', initialValue: '', visibleWhen: textMode });
  const [rowHeight] = ToolJet.useStateNumber({ name: 'rowHeight', label: 'Row height (px)', initialValue: 64, min: 24, max: 1200, visibleWhen: { key: 'renderItem', value: 'components' } });
  const [itemKey] = ToolJet.useStateString({ name: 'itemKey', label: 'Item key', description: 'The id field of the items.', initialValue: 'id' });
  const [subheader] = ToolJet.useStateString({ name: 'subheader', label: 'Subheader', initialValue: '' });
  const [dense] = ToolJet.useStateBoolean({ name: 'dense', label: 'Dense', initialValue: false });
  const [divider] = ToolJet.useStateBoolean({ name: 'divider', label: 'Divider', description: 'Lines between items.', initialValue: true });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', description: '0 for no paging.', initialValue: 0, min: 0, max: 500 });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No items' });
  const [selectedItem, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItemKey] = ToolJet.useStateString({ name: 'selectedItemKey', initialValue: '', inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  const [page, setPage] = useState(1);

  const items = toRows(rawItems);
  const size = Number(pageSize) > 0 ? Number(pageSize) : 0;
  const pages = size ? Math.max(1, Math.ceil(items.length / size)) : 1;
  const p = Math.min(page, pages);
  const offset = size ? (p - 1) * size : 0;
  const visible = size ? items.slice(offset, offset + size) : items;
  const asRows = renderItem === 'components';
  const height = Math.max(24, Math.min(1200, Number(rowHeight) || 64));
  ToolJet.useRows(asRows ? visible : [], height);
  const field = str(itemKey) || 'id';
  const selectedKey = selectedItem && Object.keys(selectedItem).length ? rowKeyOf(selectedItem as Row, field, -1) : '';

  const select = (row: Row | null, index: number) => {
    setSelectedItem(row ?? {});
    setSelectedItemKey(row ? rowKeyOf(row, field, index) : '');
    if (row) onItemClick();
  };
  ToolJet.useAction({ name: 'selectItem', displayName: 'Select item', params: [{ handle: 'key', displayName: 'Item key' }] }, (key) => {
    const index = items.findIndex((r, i) => rowKeyOf(r, field, i) === str(key));
    select(items[index] ?? null, index);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => select(null, -1));

  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<Spinner />}>
        <div className="tj-mui--fill tj-mui-list">
          <MuiList
            dense={dense}
            disablePadding
            subheader={subheader ? <ListSubheader disableSticky>{subheader}</ListSubheader> : undefined}
            sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}
          >
            {visible.length === 0 ? (
              <ListItem>
                <ListItemText secondary={emptyText} />
              </ListItem>
            ) : null}
            {visible.map((row, i) => {
              const key = rowKeyOf(row, field, i + offset);
              const selected = key === selectedKey;
              const isLast = i === visible.length - 1;
              if (asRows)
                return (
                  <ListItem key={key} disablePadding divider={divider && !isLast} onClickCapture={() => select(row, i + offset)} className={selected ? 'Mui-selected' : undefined}>
                    <Box sx={{ width: '100%', minHeight: height }}>
                      <ToolJet.RowSlot name="row" index={i} item={row} />
                    </Box>
                  </ListItem>
                );
              const avatar = avatarField ? str(readField(row, avatarField)) : '';
              const primary = formatCell(readField(row, primaryField));
              return (
                <ListItem key={key} disablePadding divider={divider && !isLast}>
                  <ListItemButton selected={selected} onClick={() => select(row, i + offset)}>
                    {avatarField ? (
                      <ListItemAvatar>
                        <Avatar src={avatar || undefined} alt={primary}>
                          {primary.slice(0, 1).toUpperCase() || undefined}
                        </Avatar>
                      </ListItemAvatar>
                    ) : null}
                    <ListItemText primary={primary} secondary={secondaryField ? formatCell(readField(row, secondaryField)) || undefined : undefined} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </MuiList>
          {size && items.length > size ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Pagination size="small" count={pages} page={p} onChange={(_, n) => setPage(n)} />
            </Box>
          ) : null}
        </div>
      </Loading>
    </MuiProvider>
  );
};
