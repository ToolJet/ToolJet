import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useAutoHeight } from '../packHooks';
import { Skeleton, cn } from './ui';
import { Pager } from './Pager';
import { itemKey, listLook, pageOf } from './listModel';
import { stringify } from '../packJson';
import { LoadingBox, wantsSkeleton } from './loadingLook';
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

const ROWS_PER_STEP = 100;

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
  const columns = mode === 'grid' ? Math.min(24, Math.max(1, Math.floor(Number(properties.columns)) || 1)) : 1;
  const rowHeight = Math.min(4000, Math.max(24, Number(properties.rowHeight) || 72));
  const gap = Math.min(200, Math.max(0, Number(properties.gap) || 0));
  // Text only: a list bound here would be turned into a huge key for every item.
  const idField = typeof properties.idField === 'string' && properties.idField.trim() ? properties.idField : 'id';
  const server = !!properties.serverSidePagination;

  const [page, setPage] = useState(1);
  const paged = pageOf(properties.data, {
    enablePagination: !!properties.enablePagination,
    serverSidePagination: server,
    rowsPerPage: properties.rowsPerPage,
    totalRecords: properties.totalRecords,
    page,
  });
  // Every row is a canvas of components: past ROWS_PER_STEP rows on a page (no paging, or a huge page size), the rest
  // wait behind "Show more" (10k rows froze the page).
  const [shownRows, setShownRows] = useState(ROWS_PER_STEP);
  useEffect(() => setShownRows(ROWS_PER_STEP), [paged.page]);
  const items = paged.items.slice(0, shownRows);
  const hiddenRows = paged.items.length - items.length;
  // Client-side data shorter than the current page: follow the clamp.
  useEffect(() => {
    if (paged.page !== page) setPage(paged.page);
  }, [paged.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each row reads its item as {{listItem}}, written when the page's items, the row template or the nesting changes.
  // Written in a layout effect, not during render (the native Listview's way), which updated the store, and so other
  // components, while this one rendered: React warned, and it risked a render loop. The layout effect runs before
  // paint and before the rows' mount effects; the rows wait for the first write, and after a change they re-render
  // with the new items before the page paints.
  const itemsKey = stringify(items);
  const parentKey = parentIndices.join(',');
  const signature = `${itemsKey}|${childCount}|${parentKey}`;
  const [published, setPublished] = useState(null);
  useLayoutEffect(() => {
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
    setPublished(signature);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
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
      {isLoading && !wantsSkeleton(properties) ? (
        <LoadingBox height={props.height} />
      ) : isLoading ? (
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
          {(published === null ? [] : items).map((item, index) => (
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
      {hiddenRows > 0 && !isLoading ? (
        <button
          type="button"
          onClick={() => setShownRows((n) => n + ROWS_PER_STEP)}
          className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {`Show ${Math.min(hiddenRows, ROWS_PER_STEP)} more of ${hiddenRows}`}
        </button>
      ) : null}
      {showPager ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            {paged.pageCount ? `Page ${paged.page} of ${paged.pageCount}` : `Page ${paged.page}`}
          </span>
          <Pager
            page={paged.page}
            pageCount={paged.pageCount}
            hasPrevious={paged.hasPrevious}
            hasNext={paged.hasNext}
            disabled={isDisabled}
            onPage={(p) => goTo(p)}
          />
        </nav>
      ) : null}
    </div>
  );
};
