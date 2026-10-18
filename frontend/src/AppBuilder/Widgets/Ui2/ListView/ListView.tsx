import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useOwnContextPath } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import {
  asActions,
  useActionFire,
  useAutoHeight,
  useLatest,
  usePublishNow,
  useStable,
  withOwnedActions,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Pager } from '@/AppBuilder/Widgets/Ui2/_shared/Pager';
import { itemKey, listLook, pageGoTo, pageOf } from '@/AppBuilder/Widgets/Ui2/_shared/listModel';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { fitsContentInView, listRowHeight } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { ShowMore, useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { useListSelection } from './useListSelection';
import { Row, type ListMode } from './ListRow';
import { takeRowValues } from '@/AppBuilder/Widgets/Ui2/_shared/rowValues';
import { useLazyLoadedFirst } from '@/AppBuilder/Widgets/Ui2/_shared/lazyWidgets';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';

/** What the list's actions read later, without going stale. */
interface ListLive {
  items: unknown[];
  keys: string[];
  idField: string;
  setExposedVariables: WidgetProps['setExposedVariables'];
  fireEvent: WidgetProps['fireEvent'];
}

/** What the list reads from the app store. */
type ListStore = {
  updateCustomResolvables: (
    id: string,
    values: Record<string, unknown>[],
    key: string,
    moduleId: string,
    parentIndices: number[]
  ) => void;
  initExposedValueArrayForChildren: (id: string, count: number, moduleId: string, parentIndices: number[]) => void;
  containerChildrenMapping?: Record<string, string[]>;
  getComponentTypeFromId: (id: string, moduleId: string) => string | undefined;
};

// ToolJet UI 2.0 List view. Row-scoped like the native Listview: one canvas (the components parented to
// the list) repeated per item, each row reading its item as {{listItem}}, and the rows' component values exposed as
// children by the store (deriveListviewExposedData, generic over the row-scoped types); data is the list's records,
// which the store leaves alone for this widget. Rows have a fixed height
// (rowHeight); the list itself fits its content in view. Selection keeps the native names (selectedRecord is the row's
// component values, selectedRecordId its index) and adds selectedItem, the clicked data item.

const ROWS_PER_STEP = 100;

export const ShadListView = (props: WidgetProps) => {
  const { id, properties, styles, darkMode, dataCy } = props;
  // A list in another list's row publishes its selection at once, as a row widget does (usePublishNow).
  const { setExposedVariable, setExposedVariables } = usePublishNow(props);
  // Events an action fires wait until it has published (useActionFire).
  const fireEvent = useActionFire(props.fireEvent);
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
  // The row template's widgets load before the first rows are drawn, so they mount with the rows, in their batch.
  useLazyLoadedFirst(() => {
    const state = useStore.getState() as unknown as ListStore;
    return (state.containerChildrenMapping?.[id] || []).map((child) =>
      getComponentToRender(state.getComponentTypeFromId(child, moduleId))
    );
  });
  // Rows, their values and their heights hang off the list's own path (in a native Kanban card, that card's index).
  const contextPath = useOwnContextPath(props.subContainerIndex, props.parentId);
  const parentIndices = useStable(useMemo(() => contextPath.map((segment) => segment.index), [contextPath]));
  const updateCustomResolvables = useStore((state: ListStore) => state.updateCustomResolvables);
  const initExposedValueArrayForChildren = useStore((state: ListStore) => state.initExposedValueArrayForChildren);
  const childCount = useStore((state: ListStore) => (state.containerChildrenMapping?.[id] || []).length);

  const rootRef = useRef<HTMLDivElement>(null);
  useAutoHeight(props, rootRef);
  useDisableInert(rootRef, isDisabled);
  const look = listLook(styles);
  // Dynamic height off: the widget keeps its drawn height, so the list fills that box and its rows scroll inside it,
  // the pager staying under them (the rows spilled past the box onto the page). On, the list grows with its rows.
  const fixed = !fitsContentInView(props.componentType ?? 'ShadListView', properties);

  const mode: ListMode = properties.mode === 'grid' ? 'grid' : 'list';
  const columns = mode === 'grid' ? Math.min(24, Math.max(1, Math.floor(Number(properties.columns)) || 1)) : 1;
  const rowHeight = listRowHeight(properties);
  const gap = Math.min(200, Math.max(0, Number(properties.gap) || 0));
  // Text only: a list bound here would be turned into a huge key for every item.
  const idField = typeof properties.idField === 'string' && properties.idField.trim() ? properties.idField : 'id';
  const server = !!properties.serverSidePagination;

  const data = useStable(properties.data);
  const [page, setPage] = useState(1);
  const { enablePagination, rowsPerPage, totalRecords } = properties;
  const paged = useMemo(
    () =>
      pageOf(data, {
        enablePagination: !!enablePagination,
        serverSidePagination: server,
        rowsPerPage,
        totalRecords,
        page,
      }),
    [data, enablePagination, server, rowsPerPage, totalRecords, page]
  );
  // Every row is a canvas of components: past ROWS_PER_STEP rows on a page (no paging, or a huge page size), the rest
  // wait behind "Show more" (10k rows froze the page).
  const [shownRows, showMore] = useShownCount(ROWS_PER_STEP, paged.page);
  // Kept by content: the rows' {{listItem}} are rewritten only when the shown items change.
  const items = useStable(useMemo(() => paged.items.slice(0, shownRows), [paged.items, shownRows]));
  // data is the list's records, as the catalog says: its initial {} made (components.list.data || []).length read
  // "undefined" in a page's "N service jobs" line.
  const exposeOne = useLatest(setExposedVariable);
  useEffect(() => {
    exposeOne.current('data', Array.isArray(data) ? data : []);
  }, [data, exposeOne]);
  const hiddenRows = paged.items.length - items.length;
  // Client-side data shorter than the current page: follow the clamp, and publish it (no event: the user did not page).
  useEffect(() => {
    if (paged.page === page) return;
    setPage(paged.page);
    exposeOne.current('pageIndex', paged.page);
  }, [paged.page, page, exposeOne]);

  // Each row reads its item as {{listItem}}, written when the page's items, the row template or the nesting changes.
  // Written in a layout effect, not during render (the native Listview's way), which updated the store, and so other
  // components, while this one rendered: React warned, and it risked a render loop. The layout effect runs before
  // paint and before the rows' mount effects. Rows are drawn from the items already written (shown), keyed by record:
  // a row that moves never resolves another record's {{listItem}}, which reset its components (an edited Input took
  // its default again). When records move, their rows' component values move with them (takeRowValues).
  const keys = useMemo(() => items.map((item, index) => itemKey(item, idField, index)), [items, idField]);
  // drawn counts the times rows of new records were drawn (first draw, "Show more", a page turn), for the batch below.
  const [shown, setShown] = useState<{ items: unknown[]; keys: string[]; drawn: number }>({
    items: [],
    keys: [],
    drawn: 0,
  });
  const shownKeys = useRef<string[]>([]);
  useLayoutEffect(() => {
    const moveRowValues = takeRowValues(id, moduleId, parentIndices, shownKeys.current, keys);
    if (items.length) {
      updateCustomResolvables(
        id,
        items.map((listItem) => ({ listItem })),
        'listItem',
        moduleId,
        parentIndices
      );
    }
    // Sized for no rows too: an emptied list kept its last rows' values (and actions) in children.
    initExposedValueArrayForChildren(id, items.length, moduleId, parentIndices);
    moveRowValues?.();
    if (!items.length) exposeOne.current('children', {});
    const before = new Set(shownKeys.current);
    const fresh = keys.some((key) => !before.has(key));
    shownKeys.current = keys;
    setShown((last) => ({ items, keys, drawn: fresh ? last.drawn + 1 : last.drawn }));
    // childCount: a component added to the row template needs its per-row values too.
  }, [
    items,
    keys,
    childCount,
    parentIndices,
    id,
    moduleId,
    updateCustomResolvables,
    initExposedValueArrayForChildren,
    exposeOne,
  ]);

  const { selectedIndex, pick, clearSelection } = useListSelection({
    id,
    moduleId,
    parentIndices,
    data,
    items,
    keys,
    idField,
    setExposedVariables,
    fireEvent,
  });
  const live = useRef<ListLive>({ items, keys, idField, setExposedVariables, fireEvent });
  live.current = { items, keys, idField, setExposedVariables, fireEvent };

  const goTo = pageGoTo(setPage, setExposedVariable, fireEvent);

  // Published once; each action calls the latest handlers.
  const handlers = useLatest({ pick, clearSelection, goTo });
  useEffect(() => {
    live.current.setExposedVariables(
      asActions({
        selectItem: async (itemId: unknown) => {
          const index = live.current.items.findIndex(
            (item) =>
              item && typeof item === 'object' && String((item as Resolved)[live.current.idField]) === String(itemId)
          );
          if (index >= 0) handlers.current.pick(index, { fire: false });
        },
        clearSelection: async () => handlers.current.clearSelection(),
        // As on the native Table, setPage does not fire onPageChanged.
        setPage: async (target: unknown) => handlers.current.goTo(target, { fire: false }),
        pageIndex: 1,
      })
    );
  }, [handlers]);

  // Measure the width a row's canvas lays its components out at.
  const gridRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  // The grid element exists only while the list shows items, so loading and the first items re-attach the observer.
  const hasItems = items.length > 0;
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const measure = () => setItemWidth(Math.max(0, (el.clientWidth - gap * (columns - 1)) / columns));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, gap, isLoading, hasItems]);

  // Each component in a row publishes at once (usePublishNow), and each publish re-derived its row's children in a
  // store update of its own: five a row for two Texts, so 100 rows took seconds to fill. New rows' components publish
  // in one batch instead, which derives each row once. It opens in the commit that mounts them: rows are drawn from
  // `shown`, a render after their items, and only once the width is known (keyed to items.length, the batch had
  // already closed).
  useExposedValueBatch(itemWidth > 0 ? shown.drawn : 0);

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
        ...(fixed ? { height: '100%', overflow: 'hidden' } : {}),
        ...look.vars,
      }}
    >
      {isLoading && !wantsSkeleton(properties) ? (
        <LoadingBox height={props.height} />
      ) : isLoading ? (
        <div className="tw-flex tw-flex-col" style={{ gap }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: rowHeight }} className="tw-w-full tw-rounded-ui2-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="tw-flex tw-min-h-[96px] tw-items-center tw-justify-center tw-rounded-ui2-lg tw-border tw-border-dashed tw-text-ui2-sm tw-text-[color:var(--lv-empty,var(--sc-muted-foreground))]">
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
            // alignContent: a short list keeps its rows at the top instead of stretching the grid's tracks.
            ...(fixed ? { flex: '1 1 0', minHeight: 0, overflowY: 'auto', alignContent: 'start' } : {}),
          }}
        >
          {shown.items.map((item, index) => (
            <Row
              key={shown.keys[index]}
              id={id}
              index={index}
              item={item}
              parentPath={contextPath}
              height={rowHeight}
              fit={!fixed && props.currentMode === 'view'}
              currentLayout={props.currentLayout}
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
      {isLoading ? null : (
        <ShowMore
          remaining={hiddenRows}
          step={ROWS_PER_STEP}
          onMore={showMore}
          className="tw-rounded-ui2-md tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground"
        />
      )}
      {showPager ? (
        <nav aria-label="Pagination" className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-pt-1">
          <span className="tw-text-xs tw-tabular-nums tw-text-ui2-muted-foreground">
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

export default withOwnedActions(ShadListView);
