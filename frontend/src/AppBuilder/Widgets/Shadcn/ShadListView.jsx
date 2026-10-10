import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useAutoHeight } from '../packHooks';
import { Button, Skeleton, cn } from './ui';
import { itemKey, listLook, pageOf } from './listModel';
import './shadcn.scss';

// shadcn/ui pack List view (experiment). Row-scoped like the native Listview: one canvas (the components parented to
// the list) repeated per item, each row reading its item as {{listItem}}, and the rows' component values exposed as
// data/children by the store (deriveListviewExposedData, generic over the row-scoped types). Rows have a fixed height
// (rowHeight); the list itself fits its content in view. Selection keeps the native names (selectedRecord is the row's
// component values, selectedRecordId/selectedRowId its index) and adds selectedItem, the clicked data item.

const Row = ({ id, index, parentPath, height, width, onPick, selected, look, mode, showBorder, darkMode }) => {
  const contextValue = useMemo(
    () => ({ contextPath: [...parentPath, { containerId: id, index }] }),
    [parentPath, id, index]
  );
  return (
    <SubcontainerContext.Provider value={contextValue}>
      <div
        role="listitem"
        onClickCapture={() => onPick(index)}
        className={cn(
          'relative overflow-hidden transition-colors hover:bg-[color:var(--lv-hover-bg,color-mix(in_srgb,var(--sc-muted)_50%,transparent))]',
          selected &&
            'bg-[color:var(--lv-selected-bg,color-mix(in_srgb,var(--sc-primary)_8%,transparent))] ring-1 ring-inset ring-primary',
          mode === 'list' &&
            showBorder &&
            'border-b border-b-[color:var(--lv-divider,var(--sc-border))] last:border-b-0'
        )}
        style={{ height, ...look.item }}
      >
        {width > 0 ? (
          <SubContainer
            index={index}
            id={id}
            canvasHeight={height}
            canvasWidth={width}
            styles={{ backgroundColor: 'transparent' }}
            darkMode={darkMode}
            componentType="ShadListView"
          />
        ) : null}
      </div>
    </SubcontainerContext.Provider>
  );
};

/** Page numbers around the current one: 1 … 4 5 6 … 20. */
const pageWindow = (page, count) => {
  if (!count) return [page];
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

export const ShadListView = (props) => {
  const { id, properties, styles, setExposedVariable, setExposedVariables, fireEvent, darkMode, dataCy } = props;
  // A pack widget created through the MCP carries only the properties it was given (the server has no defaults to
  // merge for pack types), so an unset property means its default: visible, enabled, not loading.
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState === true,
    properties.visibility !== false,
    properties.disabledState === true,
    setExposedVariables,
    setExposedVariable
  );
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
  const parentIndices = useMemo(() => contextPath.map((segment) => segment.index), [contextPath]);
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables, shallow);
  const initExposedValueArrayForChildren = useStore((state) => state.initExposedValueArrayForChildren, shallow);
  const childCount = useStore((state) => (state.containerChildrenMapping?.[id] || []).length);

  const rootRef = useRef(null);
  useAutoHeight(props, rootRef);
  useDisableInert(rootRef, isDisabled);
  const look = listLook(styles);

  const mode = properties.mode === 'grid' ? 'grid' : 'list';
  const columns = mode === 'grid' ? Math.max(1, Math.floor(Number(properties.columns)) || 1) : 1;
  const rowHeight = Math.max(24, Number(properties.rowHeight) || 72);
  const gap = Math.max(0, Number(properties.gap) || 0);
  const idField = properties.idField || 'id';
  const server = !!properties.serverSidePagination;

  const [page, setPage] = useState(1);
  const paged = pageOf(properties.data, {
    enablePagination: !!properties.enablePagination,
    serverSidePagination: server,
    rowsPerPage: properties.rowsPerPage,
    totalRecords: properties.totalRecords,
    page,
  });
  const items = paged.items;
  // Client-side data shorter than the current page: follow the clamp.
  useEffect(() => {
    if (paged.page !== page) setPage(paged.page);
  }, [paged.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each row reads its item as {{listItem}}; written before the rows render, as the native Listview does, and only
  // when the page's items, the row template or the nesting changes.
  const itemsKey = JSON.stringify(items);
  const published = useRef({ itemsKey: null, childCount: -1, parent: '' });
  const parentKey = parentIndices.join(',');
  if (
    published.current.itemsKey !== itemsKey ||
    published.current.childCount !== childCount ||
    published.current.parent !== parentKey
  ) {
    published.current = { itemsKey, childCount, parent: parentKey };
    if (items.length) {
      updateCustomResolvables(
        id,
        items.map((listItem) => ({ listItem })),
        'listItem',
        moduleId,
        parentIndices
      );
      initExposedValueArrayForChildren(id, items.length, moduleId, parentIndices);
    }
  }
  useExposedValueBatch(items.length);

  // Selection by item key, so it survives a refetch that reorders or reloads the data.
  const [selectedKey, setSelectedKey] = useState(null);
  const keys = items.map((item, index) => itemKey(item, idField, index));
  const selectedIndex = selectedKey === null ? -1 : keys.indexOf(selectedKey);

  const live = useRef({});
  live.current = { items, keys, idField, setExposedVariables, fireEvent };
  const pick = (index, { fire = true } = {}) => {
    const { items: now, keys: nowKeys, setExposedVariables: expose, fireEvent: fireNow } = live.current;
    if (index < 0 || index >= now.length) return;
    const state = useStore.getState();
    let exposed = state.resolvedStore.modules[moduleId]?.exposedValues?.components?.[id];
    for (const outer of parentIndices) exposed = Array.isArray(exposed) ? exposed?.[outer] : exposed;
    const record = exposed?.children?.[index] ?? {};
    setSelectedKey(nowKeys[index]);
    expose({
      selectedItem: now[index],
      selectedItemId: now[index] && typeof now[index] === 'object' ? now[index][live.current.idField] ?? null : null,
      selectedRecord: record,
      selectedRecordId: index,
      selectedRow: record,
      selectedRowId: index,
    });
    if (fire) {
      fireNow('onRecordClicked');
      fireNow('onRowClicked');
    }
  };
  const clearSelection = () => {
    setSelectedKey(null);
    live.current.setExposedVariables({
      selectedItem: {},
      selectedItemId: null,
      selectedRecord: {},
      selectedRecordId: null,
      selectedRow: {},
      selectedRowId: null,
    });
  };

  const goTo = (target, { fire = true } = {}) => {
    const next = Math.max(1, Math.floor(Number(target)) || 1);
    setPage(next);
    setExposedVariable('pageIndex', next);
    if (fire) fireEvent('onPageChanged');
  };

  useEffect(() => {
    setExposedVariables({
      selectItem: async (itemId) => {
        const index = live.current.items.findIndex(
          (item) => item && typeof item === 'object' && String(item[live.current.idField]) === String(itemId)
        );
        if (index >= 0) pick(index, { fire: false });
      },
      clearSelection: async () => clearSelection(),
      // As on the native Table, setPage does not fire onPageChanged.
      setPage: async (target) => goTo(target, { fire: false }),
      pageIndex: 1,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure the width a row's canvas lays its components out at.
  const gridRef = useRef(null);
  const [itemWidth, setItemWidth] = useState(0);
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const measure = () => setItemWidth(Math.max(0, (el.clientWidth - gap * (columns - 1)) / columns));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, gap, isLoading, items.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const showPager = properties.enablePagination && !isLoading && (items.length > 0 || paged.page > 1);

  return (
    <div
      ref={rootRef}
      data-cy={dataCy}
      data-disabled={isDisabled}
      className="tj-shadcn"
      style={{
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
        width: '100%',
        gap: 8,
        background: look.background,
        padding: look.padding,
        boxShadow: styles?.boxShadow,
        ...look.vars,
      }}
    >
      {isLoading ? (
        <div className="flex flex-col" style={{ gap }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: rowHeight }} className="w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[96px] items-center justify-center rounded-lg border border-dashed text-sm text-[color:var(--lv-empty,var(--sc-muted-foreground))]">
          {String(properties.emptyText ?? 'No items')}
        </div>
      ) : (
        <div
          ref={gridRef}
          role="list"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: mode === 'list' && properties.showBorder ? 0 : gap,
          }}
        >
          {items.map((item, index) => (
            <Row
              key={keys[index]}
              id={id}
              index={index}
              parentPath={contextPath}
              height={rowHeight}
              width={itemWidth}
              onPick={(i) => !isDisabled && pick(i)}
              selected={properties.highlightSelectedRow !== false && index === selectedIndex}
              look={look}
              mode={mode}
              showBorder={!!properties.showBorder}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
      {showPager ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            {paged.pageCount ? `Page ${paged.page} of ${paged.pageCount}` : `Page ${paged.page}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Previous page"
              disabled={!paged.hasPrevious || isDisabled}
              onClick={() => goTo(paged.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageWindow(paged.page, paged.pageCount).map((p) =>
              typeof p === 'string' ? (
                <span key={p} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === paged.page ? 'outline' : 'ghost'}
                  size="sm"
                  className="h-8 min-w-8 px-2 tabular-nums"
                  aria-current={p === paged.page ? 'page' : undefined}
                  disabled={isDisabled}
                  onClick={() => p !== paged.page && goTo(p)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Next page"
              disabled={!paged.hasNext || isDisabled}
              onClick={() => goTo(paged.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
};
