import React, { useEffect, useMemo, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { SHADOWS, isSet, itemKey, pageOf, px, styleVars, toText, type Row } from '../lib/ui2/display/lists/model';
import { Chip, Pager, RecordAvatar, onKeyActivate } from '../lib/ui2/display/lists/parts';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { ListSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useDrawnNumber, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-lists.css';

// UI 2.0's List view: items in a list or a grid, with selection, client or server-side paging and UI 2.0's item look.
// An item is a row of ToolJet components the builder designs once (itemContent 'components', each row reading its item
// as {{listItem}}, drawn by the host through useRows / RowSlot), or, the pack's own, a row built from data fields laid
// out as UI 2.0's sample card: an avatar, a title over a subtitle, a badge, a meta value and an action button.
export const ListView = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'List data',
    description: 'Array of objects, e.g. {{queries.getItems.data}}.',
    initialValue: [
      { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineering' },
      { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'Research' },
      { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'Operations' },
    ],
  });
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Layout', enumDefinition: ['list', 'grid'], initialValue: 'list', inspector: 'switch' });
  const [columns] = ToolJet.useStateNumber({
    name: 'columns',
    label: 'Grid columns',
    initialValue: 3,
    visibleWhen: { key: 'mode', value: 'grid' },
  } as Parameters<typeof ToolJet.useStateNumber>[0]);
  // Built in: an item can be a row of ToolJet components the builder designs once (read as {{listItem}}), as in
  // UI 2.0's List view, instead of the data fields below.
  const [itemContent] = ToolJet.useStateEnumeration({
    name: 'itemContent',
    label: 'Item content',
    enumDefinition: ['fields', 'components'],
    enumLabels: { fields: 'Fields', components: 'Components' },
    initialValue: 'fields',
    inspector: 'switch',
  });
  const [rowHeight] = ToolJet.useStateNumber({
    name: 'rowHeight',
    label: 'Item height (px)',
    initialValue: 72,
    min: 24,
    max: 1200,
    visibleWhen: { key: 'itemContent', value: 'components' },
  } as Parameters<typeof ToolJet.useStateNumber>[0]);
  const [gap] = ToolJet.useStateNumber({ name: 'gap', label: 'Gap between items (px)', initialValue: 8 });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'name' });
  const [subtitleField] = ToolJet.useStateString({ name: 'subtitleField', label: 'Subtitle field', initialValue: 'email' });
  const [imageField] = ToolJet.useStateString({ name: 'imageField', label: 'Avatar field (image URL or a name)', initialValue: 'image' });
  const [showAvatar] = ToolJet.useStateBoolean({ name: 'showAvatar', label: 'Show avatar', initialValue: true });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field (a chip toned by its words)', initialValue: 'role' });
  const [metaField] = ToolJet.useStateString({ name: 'metaField', label: 'Right-side field', initialValue: '' });
  const [actionLabel] = ToolJet.useStateString({ name: 'actionLabel', label: 'Action button label (empty hides it)', initialValue: 'View' });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field (for selection across data changes)', initialValue: 'id' });
  const [showBorder] = ToolJet.useStateBoolean({ name: 'showBorder', label: 'Dividers between items (list)', initialValue: false });
  const [highlightSelectedRow] = ToolJet.useStateBoolean({ name: 'highlightSelectedRow', label: 'Highlight selected item', initialValue: true });
  const [enablePagination] = ToolJet.useStateBoolean({ name: 'enablePagination', label: 'Pagination', initialValue: false });
  const [rowsPerPage] = ToolJet.useStateNumber({ name: 'rowsPerPage', label: 'Items per page', initialValue: 10 });
  const [serverSidePagination] = ToolJet.useStateBoolean({ name: 'serverSidePagination', label: 'Server-side pagination (data is one page)', initialValue: false });
  const [totalRecords] = ToolJet.useStateNumber({ name: 'totalRecords', label: 'Total items (server-side)', initialValue: 0 });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No items' });
  const [selectedItemId, setSelectedItemId] = ToolJet.useStateString({ name: 'selectedItemId', initialValue: '', inspector: 'hidden' });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  // UI 2.0's native names: selectedRecordId is the item's index on the page, selectedRecord the item.
  const [, setSelectedRecord] = ToolJet.useStateObject({ name: 'selectedRecord', initialValue: {}, inspector: 'hidden' });
  const [selectedRecordId, setSelectedRecordId] = ToolJet.useStateNumber({ name: 'selectedRecordId', initialValue: -1, inspector: 'hidden' });
  const [pageIndex, setPageIndex] = ToolJet.useStateNumber({ name: 'pageIndex', initialValue: 1, inspector: 'hidden' });
  const onRecordClicked = ToolJet.useEventCallback({ name: 'onRecordClicked' });
  const onPageChanged = ToolJet.useEventCallback({ name: 'onPageChanged' });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  const accent = useThemeColor('accentColor', 'Accent (selected outline, pagination)', TOKEN.brand);
  const background = useThemeColor('backgroundColor', 'List background', 'transparent');
  const itemBackground = useThemeColor('itemBackgroundColor', 'Item background', TOKEN.surface);
  const hoverBackground = useThemeColor('itemHoverBackgroundColor', 'Item hover background', TOKEN.muted);
  const selectedBackground = useThemeColor('selectedItemBackgroundColor', 'Selected item background', TOKEN.brand);
  const itemBorderColor = useThemeColor('itemBorderColor', 'Item border color', TOKEN.border);
  const dividerColor = useThemeColor('dividerColor', 'Divider color', TOKEN.border);
  const itemRadius = useThemeRadius('itemBorderRadius', 'Item radius');
  const itemVariant = ToolJet.useStyleEnumeration({
    name: 'itemVariant',
    label: 'Item look',
    enumDefinition: ['plain', 'outline'],
    enumLabels: { plain: 'Plain', outline: 'Outlined card' },
    initialValue: 'outline',
  });
  const itemShadow = ToolJet.useStyleEnumeration({
    name: 'itemShadow',
    label: 'Item shadow',
    enumDefinition: ['none', 'sm', 'md', 'lg'],
    enumLabels: { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' },
    initialValue: 'none',
  });
  const padding = useDrawnNumber('padding', 'Padding around the list (px)', 0);
  const emptyTextColor = useThemeColor('emptyTextColor', 'Empty message color', TOKEN.mutedText);
  const ld = useLoadingLook();
  // The sample rows' height, in whole rows: 30 left a 64px band under them at the drop.
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 24 });

  const idKey = isSet(idField) && String(idField).trim() ? String(idField) : 'id';
  const paged = useMemo(
    () => pageOf(Array.isArray(data) ? data : [], { enablePagination, serverSidePagination, rowsPerPage, totalRecords, page: Number(pageIndex) || 1 }),
    [data, enablePagination, serverSidePagination, rowsPerPage, totalRecords, pageIndex]
  );
  // Client-side data shorter than the current page: follow the clamp (no event: the user did not page).
  useEffect(() => {
    if (paged.page !== (Number(pageIndex) || 1)) setPageIndex(paged.page);
  }, [paged.page, pageIndex, setPageIndex]);
  const items = paged.items as unknown[];
  const keys = useMemo(() => items.map((item, i) => itemKey(item, idKey, i)), [items, idKey]);
  const asRows = itemContent === 'components';
  ToolJet.useRows(asRows ? items : [], Math.min(1200, Math.max(24, Number(rowHeight) || 72)));

  const pick = (index: number, fire = true) => {
    const item = items[index];
    const row = (item && typeof item === 'object' ? item : {}) as Row;
    setSelectedItem(row);
    setSelectedRecord(row);
    setSelectedItemId(keys[index].startsWith('#') ? '' : keys[index]);
    setSelectedRecordId(index);
    if (fire) onRecordClicked();
  };
  const clearSelection = () => {
    setSelectedItem({});
    setSelectedRecord({});
    setSelectedItemId('');
    setSelectedRecordId(-1);
  };
  const goTo = (target: unknown, fire = true) => {
    setPageIndex(Math.max(1, Math.floor(Number(target)) || 1));
    if (fire) onPageChanged();
  };
  const selectedIndex = (() => {
    if (isSet(selectedItemId)) return keys.indexOf(String(selectedItemId));
    return Number(selectedRecordId) >= 0 && Number(selectedRecordId) < items.length ? Number(selectedRecordId) : -1;
  })();

  ToolJet.useAction({ name: 'selectItem', displayName: 'Select item', params: [{ handle: 'id', displayName: 'Item id' }] }, (id) => {
    const index = items.findIndex((item) => item && typeof item === 'object' && String((item as Row)[idKey]) === String(id));
    if (index >= 0) pick(index, false);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => clearSelection());
  // As on the native Table, setPage does not fire onPageChanged.
  ToolJet.useAction({ name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page' }] }, (p) => goTo(p, false));

  const grid = mode === 'grid';
  const cols = grid ? Math.min(24, Math.max(1, Math.floor(Number(columns)) || 1)) : 1;
  const space = Math.min(200, Math.max(0, Number(gap) || 0));
  const outline = itemVariant === 'outline';
  const framed = outline || isSet(itemBorderColor);
  const dividers = !grid && showBorder;
  const vars = styleVars([
    [accent, '--ui-primary'],
    [accent, '--ui-ring', (v) => `color-mix(in srgb, ${String(v)} 35%, transparent)`],
    [hoverBackground, '--lv-hover-bg'],
    [selectedBackground, '--lv-selected-bg'],
    [dividerColor, '--lv-divider'],
    [itemBorderColor, '--lv-item-border'],
    [emptyTextColor, '--lv-empty'],
  ]);
  const itemStyle: Record<string, string> = {
    '--lv-item-bg': isSet(itemBackground) ? String(itemBackground) : outline ? 'var(--ui-bg)' : 'transparent',
    ...(outline ? { borderRadius: 'var(--ui-radius)' } : {}),
    ...(isSet(itemRadius) ? { borderRadius: px(itemRadius) } : {}),
    ...(isSet(itemShadow) && itemShadow !== 'none' ? { boxShadow: SHADOWS[itemShadow] ?? String(itemShadow) } : {}),
  };
  const showPager = enablePagination && (items.length > 0 || paged.page > 1);

  return (
    <LoadingFrame loading={ld.loading} minHeight={120} look={ld.skeleton ? <ListSkel rowHeight={Number(rowHeight) || 72} gap={space} /> : <LoadingBox />}>
      <div
        className="ui u2l-root u2l-listview"
        style={{ ...vars, background: isSet(background) ? String(background) : 'transparent', padding: isSet(padding) ? px(padding) : 0 }}
      >
        {items.length === 0 ? (
          <div className="u2l-list-empty">{toText(emptyText) || 'No items'}</div>
        ) : (
          <div className="u2l-list-scroll">
            <div role="list" className="u2l-list-items" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: dividers ? 0 : space }}>
              {items.map((item, i) => {
                const row = (item && typeof item === 'object' ? item : {}) as Row;
                const selected = highlightSelectedRow !== false && i === selectedIndex;
                const cls = cn('u2l-list-item', selected && 'is-selected', framed && 'is-framed', dividers && 'has-divider', grid && 'is-grid');
                if (asRows)
                  return (
                    <div
                      key={keys[i]}
                      role="listitem"
                      tabIndex={0}
                      className={cn(cls, 'is-canvas')}
                      style={{ ...itemStyle, height: Math.min(1200, Math.max(24, Number(rowHeight) || 72)) }}
                      onClickCapture={() => pick(i)}
                      onKeyDown={(e) => e.target === e.currentTarget && onKeyActivate(() => pick(i))(e)}
                    >
                      <ToolJet.RowSlot name="row" index={i} item={item} />
                    </div>
                  );
                const title = toText(row[titleField]);
                const subtitle = subtitleField ? toText(row[subtitleField]) : '';
                const avatar = imageField ? toText(row[imageField]).trim() : '';
                const image = /^(https?:\/\/|data:image\/|\/)/i.test(avatar) ? avatar : '';
                const badge = badgeField ? toText(row[badgeField]) : '';
                const meta = metaField ? toText(row[metaField]) : '';
                return (
                  <div
                    key={keys[i]}
                    role="listitem"
                    tabIndex={0}
                    className={cn(cls, 'is-fields')}
                    style={itemStyle}
                    onClick={() => pick(i)}
                    onKeyDown={(e) => e.target === e.currentTarget && onKeyActivate(() => pick(i))(e)}
                  >
                    {showAvatar ? <RecordAvatar src={image} name={image || !avatar ? title : avatar} size={40} /> : null}
                    <span className="u2l-list-text">
                      <span className="u2l-list-title">{title}</span>
                      {subtitle ? <span className="u2l-list-subtitle">{subtitle}</span> : null}
                    </span>
                    {badge || meta || actionLabel ? (
                      <span className="u2l-list-trail">
                        {badge ? <Chip value={badge} /> : null}
                        {meta ? <span className="u2l-list-meta">{meta}</span> : null}
                        {actionLabel ? (
                          <button
                            type="button"
                            className="ui-btn ui-btn--outline ui-btn--sm u2l-list-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              pick(i);
                              onActionClicked();
                            }}
                          >
                            {actionLabel}
                          </button>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showPager ? (
          <nav aria-label="Pagination" className="u2l-pager">
            <span className="u2l-pager-label">{paged.pageCount ? `Page ${paged.page} of ${paged.pageCount}` : `Page ${paged.page}`}</span>
            <Pager page={paged.page} pageCount={paged.pageCount} hasPrevious={paged.hasPrevious} hasNext={paged.hasNext} onPage={(p) => goTo(p)} />
          </nav>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
