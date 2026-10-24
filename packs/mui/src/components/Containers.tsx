import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { useStateText } from '../lib/text';
import { MuiProvider, usePopupContainer, useThemeStyles } from '../lib/MuiProvider';
import { PALETTE_COLORS } from '../lib/field';
import { readField, rowIdOf, rowKeyOf, sameRecord, slotNames, str, toKeyedItems, toRows, type Row } from '../lib/data';
import { formatCell } from '../lib/format';
import { BlockSkeleton, Loading, Spinner } from '../lib/loading';
import { SAMPLE } from '../lib/samples';
import { ownerAvailable } from '../lib/useOwnerGuard';

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
  const [value, setValue] = useStateText({ name: 'value', label: 'Value', description: 'The open tab; empty opens the first.', initialValue: '' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['standard', 'scrollable', 'fullWidth'], initialValue: 'standard' });
  // MUI's colour options are styles (ToolJet keeps colours under styles).
  const textColor = ToolJet.useStyleEnumeration({ name: 'textColor', label: 'Text color', enumDefinition: ['primary', 'secondary', 'inherit'], initialValue: 'primary' });
  const indicatorColor = ToolJet.useStyleEnumeration({ name: 'indicatorColor', label: 'Indicator color', enumDefinition: ['primary', 'secondary'], initialValue: 'primary' });
  const [centered] = ToolJet.useStateBoolean({ name: 'centered', label: 'Centered', initialValue: false });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 40 });
  const tabs = toKeyedItems(rawTabs);
  const current = tabs.some((t) => t.key === value) ? value : (tabs[0]?.key ?? false);
  // The open tab is the exposed one: an empty value or a tab that is gone opens the first, and value now says so, with
  // no onChange (it kept the removed tab while the first one showed).
  useEffect(() => {
    if (typeof current === 'string' && current !== value) setValue(current);
  }, [current, value, setValue]);
  // Every tab's canvas, kept apart even when two values fold to the same slot characters ('a-b' and 'a_b').
  const slots = useMemo(() => slotNames('tab', tabs.map((t) => t.key)), [tabs.map((t) => t.key).join('\u0000')]); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (next: string) => {
    setValue(next);
    onChange();
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Tab value' }] }, (v) => change(str(v)));
  const vertical = orientation === 'vertical';
  // Each tab names its panel and each panel its tab (aria-controls, aria-labelledby), with ids unique to this widget.
  const ownId = useId();
  const idBase = ToolJet.useFieldId() || `tabs${ownId.replace(/:/g, '')}`;
  const partIds = (key: string) => ({ tab: `${idBase}-tab-${encodeURIComponent(key)}`, panel: `${idBase}-panel-${encodeURIComponent(key)}` });

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
              <Tab key={t.key} value={t.key} label={t.label} disabled={t.disabled} id={partIds(t.key).tab} aria-controls={partIds(t.key).panel} />
            ))}
          </MuiTabs>
          {/* MUI's tab panel pattern: every panel mounted, the inactive ones hidden, so each keeps its canvas. */}
          {tabs.map((t) => (
            <div
              key={t.key}
              role="tabpanel"
              id={partIds(t.key).panel}
              aria-labelledby={partIds(t.key).tab}
              hidden={t.key !== current}
              className="tj-mui-tabpanel"
            >
              <ToolJet.Slot name={slots.get(t.key) as string} style={{ height: '100%' }} />
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
  const [title] = useStateText({ name: 'title', label: 'Title', initialValue: 'Card title' });
  const [subheader] = useStateText({ name: 'subheader', label: 'Subheader', initialValue: '' });
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
  const [triggerText] = useStateText({ name: 'triggerText', label: 'Trigger text', initialValue: 'Open dialog' });
  const [showTrigger] = ToolJet.useStateBoolean({ name: 'showTrigger', label: 'Show trigger', description: 'A button on the canvas that opens the dialog.', initialValue: true });
  const [title] = useStateText({ name: 'title', label: 'Title', initialValue: 'Dialog' });
  const [contentText] = useStateText({ name: 'contentText', label: 'Content text', description: 'Text above the body components.', initialValue: '' });
  const [confirmText] = useStateText({ name: 'confirmText', label: 'Confirm text', description: 'Empty for no confirm button.', initialValue: 'Confirm' });
  const [cancelText] = useStateText({ name: 'cancelText', label: 'Cancel text', description: 'Empty for no cancel button.', initialValue: 'Cancel' });
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
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });
  ToolJet.useAction({ name: 'open', displayName: 'Open' }, () => setOpen(true));
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => setOpen(false));
  const close = () => {
    setOpen(false);
    onClose();
  };
  // The dialog portals out of the widget, so the host's Disable (and a disabled parent, which makes the widget inert)
  // never reached its buttons: Confirm still ran (shadcn pack audit SP-02). While its owner takes no input the dialog
  // stays open, keeping what was typed in the body, and refuses to confirm; Cancel, Escape and the backdrop still close
  // it. The owner need not be drawn: an action opens a dialog whose trigger is hidden.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const takesInput = () => !disabled && ownerAvailable(rootRef.current, { requireDrawn: false });

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center" rootRef={rootRef}>
      {showTrigger ? (
        <Button variant="contained" fullWidth disabled={disabled} loading={loading} title={triggerText || undefined} onClick={() => setOpen(true)}>
          <span className="tj-mui-button-label">{triggerText}</span>
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
          if (!takesInput()) return;
          setOpen(false);
          onConfirm();
        }}
        confirmDisabled={disabled}
        onEntered={() => onEntered()}
      />
    </MuiProvider>
  );
};

// Escape from a ToolJet component in the body closes the dialog, as it does from the dialog's own buttons. Those
// components are the host's (projected through the body's <slot>), outside MUI's React tree, so the Modal's onKeyDown
// never saw their keys, and the host stops a text field's keys at the popup layer. Watched from the window's capture
// phase, decided once the key is handled: a press an inner popup takes (its combobox was expanded, or a field used
// the key, as a search box clearing itself) leaves the dialog open. A collapsed combobox is not using it: ToolJet's
// Select prevents the default of every Escape, its menu open or not.
const useProjectedEscape = (
  contentRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  close: () => void,
  /** The key MUI's own onClose last handled: that one is not closed twice. */
  handledRef: React.MutableRefObject<Event | null>
) => {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active) return undefined;
    let timer = 0;
    let live = true;
    const onKey = (e: KeyboardEvent) => {
      const content = contentRef.current;
      if (e.key !== 'Escape' || e.isComposing || !content) return;
      const path = e.composedPath();
      const origin = path[0];
      // Only keys from the projected light DOM: MUI's Modal already closes on its own elements' keys.
      if (!path.includes(content) || !(origin instanceof Node) || origin.getRootNode() === content.getRootNode()) return;
      if (origin instanceof Element && origin.closest('[aria-expanded="true"]')) return;
      const collapsed = origin instanceof Element && origin.getAttribute('aria-expanded') === 'false';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (live && (collapsed || !e.defaultPrevented) && handledRef.current !== e) closeRef.current();
      });
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      live = false;
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, contentRef, handledRef]);
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
  confirmDisabled: boolean;
  onEntered: () => void;
}) => {
  const container = usePopupContainer();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const handledRef = useRef<Event | null>(null);
  useProjectedEscape(contentRef, p.open && !p.disableEscapeKeyDown, p.onClose, handledRef);
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
      onClose={(event: { nativeEvent?: Event } | Event, reason) => {
        handledRef.current = ('nativeEvent' in event && event.nativeEvent) || (event as Event);
        if (reason === 'escapeKeyDown' && p.disableEscapeKeyDown) return;
        p.onClose();
      }}
      slotProps={{ transition: { onEntered: p.onEntered } }}
    >
      {p.title ? <DialogTitle>{p.title}</DialogTitle> : null}
      <DialogContent ref={contentRef} dividers={p.scroll === 'paper' && p.bodyHeight > 0}>
        {p.contentText ? <DialogContentText sx={{ mb: p.bodyHeight > 0 ? 2 : 0 }}>{p.contentText}</DialogContentText> : null}
        {p.bodyHeight > 0 ? <ToolJet.PopupSlot name="body" style={{ height: p.bodyHeight }} /> : null}
      </DialogContent>
      {p.cancelText || p.confirmText ? (
        <DialogActions>
          {p.cancelText ? <Button onClick={p.onCancel}>{p.cancelText}</Button> : null}
          {p.confirmText ? (
            <Button variant="contained" color={p.confirmColor} loading={p.loading} disabled={p.confirmDisabled} onClick={p.onConfirm}>
              {p.confirmText}
            </Button>
          ) : null}
        </DialogActions>
      ) : null}
    </MuiDialog>
  );
};

// Each item's own key: its id, a repeated id suffixed by its occurrence (1, then 1~1), so two items that share an id
// are told apart: both drew selected, and a refresh moved the selection to the first of them.
const occurrenceKeys = (rows: Row[], field: string) => {
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const base = rowKeyOf(r, field, i);
    let key = base;
    for (let n = 1; seen.has(key); n += 1) key = `${base}~${n}`;
    seen.add(key);
    return key;
  });
};

// MUI's List: items; each is either MUI's ListItemText (primaryField, secondaryField, an avatar from avatarField)
// or, with renderItem 'components', a row of ToolJet components reading {{listItem}} (rowHeight). subheader, dense,
// divider (lines between items), pageSize (0 for no paging). Event onItemClick with selectedItem exposed.
export const List = () => {
  const [rawItems] = ToolJet.useStateArray({ name: 'items', label: 'Items', initialValue: SAMPLE.items });
  const [renderItem] = ToolJet.useStateEnumeration({
    name: 'renderItem',
    label: 'Render item',
    enumDefinition: ['listItemText', 'components'],
    enumLabels: { listItemText: 'Fields (ListItemText)', components: 'Components' },
    initialValue: 'listItemText',
  });
  const textMode = { key: 'renderItem', value: 'listItemText' };
  const [primaryField] = useStateText({ name: 'primaryField', label: 'Primary field', initialValue: 'title', visibleWhen: textMode });
  const [secondaryField] = useStateText({ name: 'secondaryField', label: 'Secondary field', initialValue: 'description', visibleWhen: textMode });
  const [avatarField] = useStateText({ name: 'avatarField', label: 'Avatar field', description: 'An image URL field.', initialValue: '', visibleWhen: textMode });
  const [rowHeight] = ToolJet.useStateNumber({ name: 'rowHeight', label: 'Row height (px)', initialValue: 64, min: 24, max: 1200, visibleWhen: { key: 'renderItem', value: 'components' } });
  const [itemKey] = useStateText({ name: 'itemKey', label: 'Item key', description: 'The id field of the items.', initialValue: 'id' });
  const [subheader] = useStateText({ name: 'subheader', label: 'Subheader', initialValue: '' });
  const [dense] = ToolJet.useStateBoolean({ name: 'dense', label: 'Dense', initialValue: false });
  const [divider] = ToolJet.useStateBoolean({ name: 'divider', label: 'Divider', description: 'Lines between items.', initialValue: true });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', description: '0 for no paging.', initialValue: 0, min: 0, max: 500 });
  const [emptyText] = useStateText({ name: 'emptyText', label: 'Empty text', initialValue: 'No items' });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const keys = useMemo(() => occurrenceKeys(items, field), [rawItems, field]);
  // The picked item's own key (its occurrence of a repeated id). Without one (nothing picked here yet), the exposed
  // record's id names it.
  const [picked, setPicked] = useState('');
  const exposedKey = selectedItem && Object.keys(selectedItem).length ? rowKeyOf(selectedItem as Row, field, -1) : '';
  const selectedKey = picked || (exposedKey ? (keys.find((k, i) => rowKeyOf(items[i], field, i) === exposedKey) ?? '') : '');

  const select = (row: Row | null, index: number) => {
    setPicked(row && index >= 0 ? keys[index] ?? '' : '');
    setSelectedItem(row ?? {});
    // The item's own key value, as the app wrote it (a number stays a number).
    setSelectedItemKey((row ? rowIdOf(row, field, index) : '') as string);
    if (row) onItemClick();
  };
  // The selection follows its item by key when the items change: a refresh republishes the fresh record, a reorder keeps
  // it, and a removal clears it (it kept exposing the old record). No onItemClick: the user picked nothing.
  const latestSelected = useRef(selectedItem);
  latestSelected.current = selectedItem;
  useEffect(() => {
    if (!selectedKey) return;
    const index = keys.indexOf(selectedKey);
    const fresh = items[index];
    if (!fresh) {
      setPicked('');
      setSelectedItem({});
      setSelectedItemKey('');
    } else {
      if (keys[index] !== picked) setPicked(keys[index]);
      if (!sameRecord(fresh, latestSelected.current)) {
        setSelectedItem(fresh);
        setSelectedItemKey(rowIdOf(fresh, field, index) as string);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);
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
              const key = keys[i + offset];
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
