import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { recordsOf } from '../lib/data';
import { useStateText } from '../lib/text';
import { Loading } from '../lib/loading';
import { LOCALE_HINT, localeFor } from '../lib/locale';
import { useGrowingCount } from '../lib/growingList';
import { useSelection, type Selectable } from '../lib/useSelection';
import { chipTone } from '../lib/statusTone';
import { iconOf } from '../lib/icons';
import { avatarHue, barWidth, chipLabel, colorFor, initials, isSet, keyValueItems, keyValueText, linkHref, recordItems, type KeyValueRow } from '../lib/ui2/display/lists/model';
import { BAR_HEIGHT, percentLabel, progressEntries, progressItem, progressMax } from '../lib/ui2/charts/progressModel';
import { formatTime, statusColor, timelineItems, type TimelineItem } from '../lib/ui2/display/timeline';
import { StatusChip } from './DataGrid';
import { useWidth } from './CardGrid';

// The four UI 2.0 list widgets the Ant and shadcn packs have (Record list, Progress list, Timeline, Key-value list),
// drawn with MUI's List, LinearProgress, Chip and Typography. Each takes UI 2.0's property, event and exposed value
// names, so the build compiler maps the UI 2.0 widget onto it as is.

// The tone a status word reads as (lib/statusTone chipTone) -> MUI's palette colour.
const TONE_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info'> = { success: 'success', warning: 'warning', danger: 'error', info: 'info' };
const toneChipColor = (value: unknown, colors?: unknown) => colorFor(value, colors) ?? TONE_COLOR[chipTone(value)] ?? 'default';
const onActivate = (run: () => void) => (e: React.KeyboardEvent) => {
  if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  run();
};

/** The list's frame: an outlined Paper for the card style, nothing for plain. It hugs short lists and scrolls inside
 *  the widget box when the rows are taller. */
const Frame = ({ card, children }: { card: boolean; children: React.ReactNode }) =>
  card ? (
    <Paper variant="outlined" className="tj-mui-lists__frame" sx={{ maxHeight: '100%', overflow: 'auto' }}>
      {children}
    </Paper>
  ) : (
    <Box className="tj-mui-lists__frame" sx={{ maxHeight: '100%', overflow: 'auto' }}>
      {children}
    </Box>
  );

const Empty = ({ text }: { text: string }) => (
  <Box className="tj-mui-lists__empty" sx={{ height: '100%', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
    <Typography variant="body2" color="text.secondary" align="center">
      {text}
    </Typography>
  </Box>
);

/** The loading look: skeleton rows in the list's shape (an avatar, a title over a line, a bar). */
const RowsSkeleton = ({ count, avatar = false, bar = false }: { count: number; avatar?: boolean; bar?: boolean }) => (
  <Box sx={{ p: 1 }}>
    {Array.from({ length: Math.max(1, Math.min(count, 8)) }, (_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1 }}>
        {avatar ? <Skeleton variant="circular" width={36} height={36} /> : null}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            <Skeleton width="55%" />
          </Typography>
          {bar ? <Skeleton variant="rounded" height={8} /> : <Typography variant="caption"><Skeleton width="35%" /></Typography>}
        </Box>
      </Box>
    ))}
  </Box>
);

// ---- Record list -----------------------------------------------------------------------------------------------------

const AVATAR_SIZE: Record<string, number> = { compact: 28, default: 36, comfortable: 40 };

const RecordAvatar = ({ image, name, size, rounded }: { image: string; name: string; size: number; rounded: boolean }) => (
  <Avatar
    src={image || undefined}
    alt={name}
    variant={rounded ? 'rounded' : 'circular'}
    sx={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...(image ? null : { bgcolor: `hsl(${avatarHue(name)} 45% 46%)` }) }}
  >
    {image ? undefined : initials(name) || undefined}
  </Avatar>
);

// UI 2.0's Record list in MUI's List: a ListItemButton a record, with an Avatar (avatarField: an image URL or a name;
// empty, the title's initials), ListItemText of the title over a meta line (metaFields: 'contact, due|date:Due {}'), a
// LinearProgress (progressField, 0 to 100), a status Chip toned by its words (statusColors: a colour per value) and a
// trailing value (valueField in valueFormat, currency, locale). data is an array, its JSON text, or a query result
// holding the records under data, rows, items, records or results. density (compact, default, comfortable),
// showDividers, listStyle (card, plain), highlightSelected, emptyText. A click (or Enter) fires onItemClicked with
// selectedItem, selectedItemId and selectedItemIndex exposed. Big data draws 48 rows, then more as the end scrolls in.
export const RecordList = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    description: 'An array of records, or a query result holding them (data, rows, items).',
    initialValue: [
      { id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', due: '2026-10-14', status: 'Paid', total: 1240 },
      { id: 2, customer: 'Northwind Florists', contact: 'Owen Hart', due: '2026-10-16', status: 'Pending', total: 386.5 },
      { id: 3, customer: 'Juniper Dental', contact: 'Priya Nair', due: '2026-10-09', status: 'Overdue', total: 2915 },
      { id: 4, customer: 'Copper Kettle Cafe', contact: 'Leo Martins', due: '2026-10-21', status: 'Paid', total: 742 },
    ],
  });
  const [titleField] = useStateText({ name: 'titleField', label: 'Title field', initialValue: 'customer' });
  const [avatarField] = useStateText({ name: 'avatarField', label: 'Avatar field', description: 'An image URL or a name; empty uses the title.', initialValue: '' });
  // UI 2.0's comma list; a list of field specs reads the same.
  const [metaFields] = ToolJet.useStateString({
    name: 'metaFields',
    label: 'Meta fields',
    description: "A comma list: 'contact, total|currency, due|date:Due {}'.",
    initialValue: 'contact, due|date:Due {}',
  });
  const [statusField] = useStateText({ name: 'statusField', label: 'Status field', description: 'A Chip toned by its words.', initialValue: 'status' });
  const [progressField] = useStateText({ name: 'progressField', label: 'Progress field', description: 'A percentage, 0 to 100.', initialValue: '' });
  const [valueField] = useStateText({ name: 'valueField', label: 'Trailing value field', initialValue: 'total' });
  const [valueFormat] = ToolJet.useStateEnumeration({
    name: 'valueFormat',
    label: 'Trailing value format',
    enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'],
    initialValue: 'currency',
  });
  const [currency] = useStateText({ name: 'currency', label: 'Currency', description: 'An ISO code, e.g. USD.', initialValue: 'USD' });
  const [locale] = useStateText({ name: 'locale', label: 'Locale', description: LOCALE_HINT, initialValue: '' });
  const [statusColors] = ToolJet.useStateObject({ name: 'statusColors', label: 'Status colors', description: "{ \"Paid\": \"#2e7d32\" }: a colour per status value.", initialValue: {} });
  const [idField] = useStateText({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [showAvatar] = ToolJet.useStateBoolean({ name: 'showAvatar', label: 'Show avatar', initialValue: true });
  const [avatarShape] = ToolJet.useStateEnumeration({ name: 'avatarShape', label: 'Avatar shape', enumDefinition: ['circle', 'rounded'], initialValue: 'circle' });
  const [density] = ToolJet.useStateEnumeration({ name: 'density', label: 'Density', enumDefinition: ['compact', 'default', 'comfortable'], initialValue: 'default' });
  const [showDividers] = ToolJet.useStateBoolean({ name: 'showDividers', label: 'Show dividers', initialValue: true });
  const [listStyle] = ToolJet.useStateEnumeration({ name: 'listStyle', label: 'List style', enumDefinition: ['card', 'plain'], initialValue: 'card' });
  const [highlightSelected] = ToolJet.useStateBoolean({ name: 'highlightSelected', label: 'Highlight the selected row', initialValue: true });
  const [emptyText] = useStateText({ name: 'emptyText', label: 'Empty text', initialValue: 'Nothing here yet' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });

  const rows = useMemo(
    () => recordItems(recordsOf(data), { titleField, avatarField, metaFields, statusField, progressField, valueField, valueFormat, currency, locale, idField }),
    [data, titleField, avatarField, metaFields, statusField, progressField, valueField, valueFormat, currency, locale, idField]
  );
  const { selectedItemId, select } = useSelection(rows as Selectable[], idField);
  const grow = useGrowingCount(rows.length);
  const dense = density === 'compact';
  const size = AVATAR_SIZE[String(density)] ?? AVATAR_SIZE.default;
  const py = dense ? 0.5 : density === 'comfortable' ? 1.5 : 1;

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-lists">
      <Loading loading={loading} fill look={<RowsSkeleton count={rows.length || 4} avatar={showAvatar !== false} />}>
        <Frame card={listStyle !== 'plain'}>
          {rows.length === 0 ? (
            <Empty text={emptyText || 'Nothing here yet'} />
          ) : (
            <List disablePadding dense={dense} className="tj-mui-recordlist">
              {rows.slice(0, grow.shown).map((row, i) => {
                const selected = highlightSelected !== false && row.key === selectedItemId;
                return (
                  <ListItem key={row.key} disablePadding divider={showDividers !== false && i < rows.length - 1} className="tj-mui-recordlist__item">
                    <ListItemButton
                      selected={selected}
                      onClick={() => {
                        select(row as unknown as Selectable);
                        onItemClicked();
                      }}
                      sx={{ py, gap: 1.5, alignItems: 'center' }}
                    >
                      {showAvatar !== false ? (
                        <ListItemAvatar sx={{ minWidth: 0 }}>
                          <RecordAvatar image={row.image} name={row.avatarName} size={size} rounded={avatarShape === 'rounded'} />
                        </ListItemAvatar>
                      ) : null}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <ListItemText
                          primary={row.title}
                          secondary={row.meta || undefined}
                          sx={{ my: 0 }}
                          slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 }, title: row.title }, secondary: { noWrap: true } }}
                        />
                        {row.progress !== null ? (
                          <LinearProgress variant="determinate" value={barWidth(row.progress)} sx={{ mt: 0.75, height: 4, borderRadius: 2 }} aria-label={row.title || undefined} />
                        ) : null}
                      </Box>
                      {row.status ? <StatusChip label={chipLabel(row.status)} color={toneChipColor(row.status, statusColors)} /> : null}
                      {row.value ? (
                        <Typography variant="body2" className="tj-mui-recordlist__value" sx={{ fontWeight: 500, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {row.value}
                        </Typography>
                      ) : null}
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {grow.more ? <li ref={grow.sentinelRef} className="tj-mui-grow-sentinel" aria-hidden /> : null}
            </List>
          )}
        </Frame>
      </Loading>
    </MuiProvider>
  );
};

// ---- Progress list ---------------------------------------------------------------------------------------------------

// UI 2.0's Progress list in MUI's List: a row a record, its label and value of target (valueFormat, currency, locale;
// percent text keeps its sign) over a LinearProgress, an optional status Chip and caption. The bar is percentField,
// else value / target, else the value as a percentage (as a share of the largest value when values are money or
// counts). Its colour is the status's tone, or autoTone's (goal: green at 100%; limit: amber from 80%, red over 100%).
// showValues, showPercent, barSize (thin, default, thick), listStyle (card, plain), emptyText. A click fires
// onItemClicked with selectedItem, selectedItemId and selectedItemIndex exposed.
export const ProgressList = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    description: 'An array of records, or a query result holding them (data, rows, items).',
    initialValue: [
      { id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left in the quarter' },
      { id: 2, label: 'Engineering tools', spent: 9100, budget: 10000, status: 'At risk', note: 'Renewals due in November' },
      { id: 3, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: 'Over by $1,600' },
      { id: 4, label: 'Training', spent: 1200, budget: 5000, status: '', note: 'Courses start in November' },
    ],
  });
  const [labelField] = useStateText({ name: 'labelField', label: 'Label field', initialValue: 'label' });
  const [valueField] = useStateText({ name: 'valueField', label: 'Value field', initialValue: 'spent' });
  const [targetField] = useStateText({ name: 'targetField', label: 'Target field', initialValue: 'budget' });
  const [percentField] = useStateText({ name: 'percentField', label: 'Percent field', description: '0 to 100; overrides value / target.', initialValue: '' });
  const [captionField] = useStateText({ name: 'captionField', label: 'Caption field', description: 'A line under the bar.', initialValue: 'note' });
  const [statusField] = useStateText({ name: 'statusField', label: 'Status field', description: 'A Chip, or a tone name.', initialValue: 'status' });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'number' });
  const [currency] = useStateText({ name: 'currency', label: 'Currency', description: 'An ISO code, e.g. USD.', initialValue: 'USD' });
  const [locale] = useStateText({ name: 'locale', label: 'Locale', description: LOCALE_HINT, initialValue: '' });
  const [idField] = useStateText({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [autoTone] = ToolJet.useStateEnumeration({ name: 'autoTone', label: 'Tone from progress', enumDefinition: ['none', 'goal', 'limit'], initialValue: 'none' });
  const [showValues] = ToolJet.useStateBoolean({ name: 'showValues', label: 'Show value of target', initialValue: true });
  const [showPercent] = ToolJet.useStateBoolean({ name: 'showPercent', label: 'Show percentage', initialValue: true });
  const [barSize] = ToolJet.useStateEnumeration({ name: 'barSize', label: 'Bar size', enumDefinition: ['thin', 'default', 'thick'], initialValue: 'default' });
  const [listStyle] = ToolJet.useStateEnumeration({ name: 'listStyle', label: 'List style', enumDefinition: ['card', 'plain'], initialValue: 'card' });
  const [emptyText] = useStateText({ name: 'emptyText', label: 'Empty text', initialValue: 'Nothing to track yet' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 34 });

  const entries = useMemo(() => progressEntries(recordsOf(data), idField), [data, idField]);
  const fields = { labelField, valueField, targetField, percentField, captionField, statusField, valueFormat, currency, locale, idField, autoTone };
  const max = useMemo(() => progressMax(entries, fields), [entries, valueField, targetField]); // eslint-disable-line react-hooks/exhaustive-deps
  // The selection follows every entry; only the rows drawn so far are formatted.
  const { selectedItemId, select } = useSelection(entries as Selectable[], idField);
  const grow = useGrowingCount(entries.length);
  const rows = entries.slice(0, grow.shown).map((entry) => progressItem(entry, { ...fields, max }));
  const height = BAR_HEIGHT[String(barSize)] ?? BAR_HEIGHT.default;

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-lists">
      <Loading loading={loading} fill look={<RowsSkeleton count={entries.length || 4} bar />}>
        <Frame card={listStyle !== 'plain'}>
          {entries.length === 0 ? (
            <Empty text={emptyText || 'Nothing to track yet'} />
          ) : (
            <List disablePadding className="tj-mui-progresslist">
              {rows.map((row) => {
                const figure = showValues !== false && row.value ? (row.target ? `${row.value} of ${row.target}` : row.value) : '';
                // A relative bar (a share of the largest value) is drawn, never printed as a percentage.
                const pct = row.pct !== null && Number.isFinite(row.pct) && !row.relative && showPercent !== false ? percentLabel(row.pct) : '';
                const color = TONE_COLOR[row.tone] ?? 'primary';
                return (
                  <ListItem key={row.key} disablePadding className="tj-mui-progresslist__item" data-tone={row.tone || undefined}>
                    <ListItemButton
                      selected={row.key === selectedItemId}
                      onClick={() => {
                        select(row as unknown as Selectable);
                        onItemClicked();
                      }}
                      sx={{ display: 'block', py: 1.25 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 500, minWidth: 0 }} title={row.label}>
                          {row.label}
                        </Typography>
                        {row.status ? <StatusChip label={chipLabel(row.status)} color={TONE_COLOR[row.tone || chipTone(row.status)] ?? 'default'} /> : null}
                        <Box sx={{ flex: 1 }} />
                        {figure ? (
                          <Typography variant="body2" className="tj-mui-progresslist__figure" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {figure}
                          </Typography>
                        ) : null}
                        {pct && !row.caption ? (
                          <Typography variant="body2" color="text.secondary" className="tj-mui-progresslist__pct" sx={{ whiteSpace: 'nowrap' }}>
                            {pct}
                          </Typography>
                        ) : null}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={barWidth(row.pct)}
                        color={color}
                        aria-label={row.label || undefined}
                        sx={{ height, borderRadius: height / 2 }}
                      />
                      {row.caption ? (
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
                            {row.caption}
                          </Typography>
                          {pct ? (
                            <Typography variant="caption" color={row.tone && TONE_COLOR[row.tone] ? `${TONE_COLOR[row.tone]}.main` : 'text.secondary'} className="tj-mui-progresslist__pct">
                              {pct}
                            </Typography>
                          ) : null}
                        </Box>
                      ) : null}
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {grow.more ? <li ref={grow.sentinelRef} className="tj-mui-grow-sentinel" aria-hidden /> : null}
            </List>
          )}
        </Frame>
      </Loading>
    </MuiProvider>
  );
};

// ---- Timeline --------------------------------------------------------------------------------------------------------

// An icon name as written in UI 2.0 ('shopping-cart', 'check') or MUI's own ('ShoppingCart').
const iconName = (name: string) => name.replace(/(^|[-_\s])(\w)/g, (_, __, c: string) => c.toUpperCase());

// UI 2.0's Timeline, drawn like MUI Lab's (a dot or an icon on a connector line, the content beside it): items
// [{ title, description, time, status, color, icon }] (a string is a title). A marker's colour is the item's color, else
// its status's (statusColors: a colour per status word; done green, pending amber, current the primary, failed red),
// else the primary. marker (dot, icon: an MUI icon name), density (comfortable, compact), newestFirst, timePosition
// (right, top), dateFormat (dayjs tokens for ISO times). A click fires onItemClicked with selectedItem and
// lastClickedItem exposed. Big data draws 48 items, then more as the end scrolls into view.
export const Timeline = () => {
  const [items] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: '[{ title, description, time, status, color, icon }]; status: done, pending, current, error or your own word.',
    initialValue: [
      { title: 'Order placed', description: 'Ada Lovelace placed order #1024', time: '09:12', status: 'done', icon: 'Add' },
      { title: 'Payment confirmed', description: 'Card ending 4242', time: '09:14', status: 'done', icon: 'AttachMoney' },
      { title: 'Packed', description: 'Warehouse B is packing the order', time: '11:30', status: 'current', icon: 'Check' },
      { title: 'Shipped', description: 'Waiting for pickup', time: '', status: 'pending', icon: 'Send' },
    ],
  });
  const [marker] = ToolJet.useStateEnumeration({ name: 'marker', label: 'Marker', enumDefinition: ['dot', 'icon'], initialValue: 'dot' });
  const [density] = ToolJet.useStateEnumeration({ name: 'density', label: 'Density', enumDefinition: ['comfortable', 'compact'], initialValue: 'comfortable' });
  const [newestFirst] = ToolJet.useStateBoolean({ name: 'newestFirst', label: 'Newest first (reverse)', initialValue: false });
  const [timePosition] = ToolJet.useStateEnumeration({ name: 'timePosition', label: 'Time', enumDefinition: ['right', 'top'], initialValue: 'right' });
  const [dateFormat] = useStateText({ name: 'dateFormat', label: 'Date format', description: 'dayjs tokens for ISO times, e.g. D MMM, HH:mm; empty shows them as given.', initialValue: '' });
  const [statusColors] = ToolJet.useStateObject({ name: 'statusColors', label: 'Colours by status', description: '{ "shipped": "#2e7d32" }: a status word to a colour.', initialValue: {} });
  const [, setLastClickedItem] = ToolJet.useStateObject({ name: 'lastClickedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { loading, disabled } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 32 });

  const list = useMemo(() => timelineItems(recordsOf(items), newestFirst === true), [items, newestFirst]);
  const grow = useGrowingCount(list.length);
  const compact = density === 'compact';
  const icons = marker === 'icon';
  const size = icons ? (compact ? 24 : 28) : compact ? 10 : 12;
  // The title's line (body2, 20px) and the marker centre on each other.
  const markerTop = Math.max(0, (20 - size) / 2);
  const column = Math.max(size, 12);
  const click = (item: TimelineItem) => {
    if (disabled) return;
    const { key, index, ...rest } = item; // eslint-disable-line @typescript-eslint/no-unused-vars
    setLastClickedItem(rest);
    setSelectedItem(rest);
    onItemClicked();
  };

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-lists">
      <Loading loading={loading} fill look={<RowsSkeleton count={list.length || 4} />}>
        <Box className="tj-mui-timeline" sx={{ height: '100%', overflow: 'auto', px: 0.5 }}>
          {list.length === 0 ? (
            <Empty text="No activity yet" />
          ) : (
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {list.slice(0, grow.shown).map((item, i, shown) => {
                const colour = (isSet(item.color) ? item.color : statusColor(item.status, statusColors)) || 'primary.main';
                const glyph = icons && item.icon ? iconOf(iconName(item.icon), 'inherit') : undefined;
                const time = formatTime(item.time, dateFormat);
                const last = i === shown.length - 1 && !grow.more;
                const timeNode = time ? (
                  <Typography variant="caption" color="text.secondary" className="tj-mui-timeline__time" sx={{ whiteSpace: 'nowrap', lineHeight: '20px' }}>
                    {time}
                  </Typography>
                ) : null;
                return (
                  <Box
                    component="li"
                    key={`${item.key}-${item.index}`}
                    className="tj-mui-timeline__item"
                    role={disabled ? undefined : 'button'}
                    tabIndex={disabled ? undefined : 0}
                    onClick={() => click(item)}
                    onKeyDown={onActivate(() => click(item))}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      position: 'relative',
                      borderRadius: 1,
                      px: 0.5,
                      cursor: disabled ? 'default' : 'pointer',
                      '&:hover': disabled ? undefined : { bgcolor: 'action.hover' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                    }}
                  >
                    <Box sx={{ width: column, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: `${markerTop + 2}px` }}>
                      <Box
                        className="tj-mui-timeline__dot"
                        sx={{
                          width: size,
                          height: size,
                          borderRadius: '50%',
                          bgcolor: colour,
                          color: icons ? 'common.white' : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: compact ? 14 : 16,
                          boxShadow: 1,
                          flexShrink: 0,
                        }}
                      >
                        {glyph}
                      </Box>
                      {!last ? <Box aria-hidden className="tj-mui-timeline__connector" sx={{ width: 2, flex: 1, minHeight: 12, bgcolor: 'grey.400', my: 0.5 }} /> : null}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, pt: 0.25, pb: compact ? 1 : 2 }}>
                      {timePosition === 'top' ? timeNode : null}
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0, lineHeight: '20px' }}>
                          {item.title}
                        </Typography>
                        {timePosition !== 'top' ? timeNode : null}
                      </Box>
                      {item.description ? (
                        <Typography variant="body2" color="text.secondary" className="tj-mui-timeline__desc" sx={{ mt: 0.25 }}>
                          {item.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
              {grow.more ? <li ref={grow.sentinelRef} className="tj-mui-grow-sentinel" aria-hidden /> : null}
            </Box>
          )}
        </Box>
      </Loading>
    </MuiProvider>
  );
};

// ---- Key-value list --------------------------------------------------------------------------------------------------

const cssSize = (value: unknown, fallback: string): string => {
  if (!isSet(value) || typeof value === 'object') return fallback;
  const t = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(t)) return `${Math.min(Number(t), 2000)}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|ch)$/.test(t)) return t;
  return fallback;
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <IconButton
      size="small"
      aria-label="Copy value"
      className="tj-mui-keyvalue__copy"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1200);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      sx={{ ml: 0.5, p: 0.25 }}
    >
      {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopy fontSize="inherit" />}
    </IconButton>
  );
};

const KvValue = ({ row, shown, empty, badgeColors }: { row: KeyValueRow; shown: string; empty: string; badgeColors: unknown }) => {
  if (row.type === 'boolean' && isSet(row.value)) {
    const yes = shown === 'Yes';
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: yes ? 'success.main' : 'text.secondary' }}>
        {yes ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
        <Typography variant="body2" component="span" color="text.primary">
          {shown}
        </Typography>
      </Box>
    );
  }
  if (!shown)
    return (
      <Typography variant="body2" component="span" color="text.disabled">
        {empty}
      </Typography>
    );
  if (row.type === 'badge') {
    const own = isSet(row.color) && typeof row.color !== 'object' ? String(row.color) : undefined;
    return <StatusChip label={chipLabel(shown)} color={colorFor(shown, badgeColors) ?? own ?? TONE_COLOR[chipTone(shown)] ?? 'default'} />;
  }
  if (row.type === 'link') {
    const href = linkHref(row);
    const label = isSet(row.linkText) && typeof row.linkText !== 'object' ? String(row.linkText) : shown;
    const external = /^https?:/i.test(href);
    return href ? (
      <Link variant="body2" href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} underline="hover" onClick={(e) => e.stopPropagation()}>
        {label}
      </Link>
    ) : (
      <Typography variant="body2" component="span">
        {label}
      </Typography>
    );
  }
  const figure = row.type === 'number' || row.type === 'currency' || row.type === 'percent';
  return (
    <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word', ...(figure ? { fontVariantNumeric: 'tabular-nums' } : null) }}>
      {shown}
    </Typography>
  );
};

// UI 2.0's Key-value list, a label and value grid like Ant's Descriptions: data is an object ({ Status: 'Active' }),
// rows [{ label, value, type }] or [label, value] pairs. A row's type formats it: text, number, currency, percent,
// date, datetime (dateFormat), badge (a Chip, badgeColors), link, boolean; figures in the list's currency and locale.
// columns (1 to 4, as many as fit), layout (inline: label beside value, labelWidth; stacked: label over value),
// dividers, emptyText (an empty value), allowCopy. A click (or Enter) on a row fires onFieldClick with
// lastClickedField ({ label, value }) exposed.
export const KeyValue = () => {
  const [data] = ToolJet.useStateObject({
    name: 'data',
    label: 'Data (object or array)',
    description: "{ Status: 'Active' } or [{ label: 'Amount', value: 1250, type: 'currency' }]",
    initialValue: [
      { label: 'Customer', value: 'Ada Lovelace' },
      { label: 'Email', value: 'ada@example.com', type: 'link' },
      { label: 'Status', value: 'Active', type: 'badge' },
      { label: 'Plan', value: 'Pro' },
      { label: 'Amount', value: 1250, type: 'currency' },
      { label: 'Renews', value: '2026-11-14', type: 'date' },
    ] as unknown as Record<string, unknown>,
  });
  const [columns] = ToolJet.useStateEnumeration({ name: 'columns', label: 'Columns', enumDefinition: ['1', '2', '3', '4'], initialValue: '1' });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['stacked', 'inline'], initialValue: 'inline' });
  const [labelWidth] = useStateText({ name: 'labelWidth', label: 'Label width', description: 'Side by side; px or %.', initialValue: '40%', visibleWhen: { key: 'layout', value: 'inline' } });
  const [dividers] = ToolJet.useStateBoolean({ name: 'dividers', label: 'Dividers', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty value text', initialValue: '-' });
  const [currency] = useStateText({ name: 'currency', label: 'Currency', description: 'For currency rows; an ISO code.', initialValue: 'USD' });
  const [locale] = useStateText({ name: 'locale', label: 'Locale', description: LOCALE_HINT, initialValue: '' });
  const [dateFormat] = useStateText({ name: 'dateFormat', label: 'Date format', description: 'For date rows; dayjs tokens.', initialValue: 'DD MMM YYYY' });
  const [badgeColors] = ToolJet.useStateObject({ name: 'badgeColors', label: 'Badge colours by value', initialValue: {} });
  const [allowCopy] = ToolJet.useStateBoolean({ name: 'allowCopy', label: 'Copy button', initialValue: false });
  const [, setLastClickedField] = ToolJet.useStateObject({ name: 'lastClickedField', initialValue: {}, inspector: 'hidden' });
  const onFieldClick = ToolJet.useEventCallback({ name: 'onFieldClick' });
  const { loading, disabled } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 26 });

  const [rootRef, width] = useWidth();
  const rows = useMemo(() => keyValueItems(data), [data]);
  const inline = layout !== 'stacked';
  // As many columns as fit: an inline pair needs about 300px, a stacked one 160px.
  const fits = width > 0 ? Math.max(1, Math.floor(width / (inline ? 300 : 160))) : 4;
  const count = Math.min(Math.max(1, Math.min(4, Math.floor(Number(columns)) || 1)), fits);
  const lastRowStart = rows.length - (rows.length % count || count);
  const defaults = { currency: currency || 'USD', locale: localeFor(currency, locale), dateFormat: dateFormat || 'DD MMM YYYY' };
  const empty = emptyText === undefined || emptyText === null || typeof emptyText === 'object' ? '-' : String(emptyText);
  const live = !disabled && !loading;
  const activate = (row: KeyValueRow) => {
    if (!live) return;
    setLastClickedField({ label: row.label, value: row.value ?? null });
    onFieldClick();
  };

  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-lists">
      <Loading loading={loading} fill look={<RowsSkeleton count={rows.length || 4} />}>
        <div ref={rootRef} className="tj-mui--fill tj-mui-keyvalue" style={{ overflow: 'auto' }}>
          {rows.length === 0 ? (
            <Empty text="No details" />
          ) : (
            <Box component="dl" sx={{ m: 0, display: 'grid', columnGap: 3 }} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {rows.map((row, index) => {
                const shown = keyValueText(row, defaults);
                const holdsControl = (row.type === 'link' && !!linkHref(row)) || (allowCopy === true && !!shown);
                return (
                  <Box
                    key={row.key}
                    className={inline ? 'tj-mui-keyvalue__row is-inline' : 'tj-mui-keyvalue__row is-stacked'}
                    role={holdsControl || !live ? undefined : 'button'}
                    tabIndex={live && !holdsControl ? 0 : undefined}
                    onClick={() => activate(row)}
                    onKeyDown={onActivate(() => activate(row))}
                    sx={(t: Theme) => ({
                      display: 'flex',
                      flexDirection: inline ? 'row' : 'column',
                      alignItems: inline ? 'baseline' : 'stretch',
                      gap: inline ? 2 : 0.25,
                      py: 1,
                      minWidth: 0,
                      cursor: live ? 'pointer' : 'default',
                      borderBottom: dividers !== false && index < lastRowStart ? `1px solid ${t.palette.divider}` : 'none',
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                    })}
                  >
                    <Typography
                      component="dt"
                      variant="body2"
                      color="text.secondary"
                      className="tj-mui-keyvalue__label"
                      sx={inline ? { width: cssSize(labelWidth, '40%'), flexShrink: 0, minWidth: 0 } : { typography: 'caption', color: 'text.secondary' }}
                    >
                      {row.label}
                    </Typography>
                    <Box component="dd" className="tj-mui-keyvalue__value" sx={{ m: 0, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      <KvValue row={row} shown={shown} empty={empty} badgeColors={badgeColors} />
                      {allowCopy === true && shown ? <CopyButton value={shown} /> : null}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </div>
      </Loading>
    </MuiProvider>
  );
};
