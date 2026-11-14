import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useReorderPins } from '@/_services/hooks/appsServiceHooks';
import { useRootAppsQueryOptions } from '@/pages/AppsDashboard/hooks/useRootAppsQuery';
import { canReorderPins, getDropIndex, movePinnedItem } from './pinOrder';
import { getRowId } from './columns';
import ItemRow from './ItemRow';

const PinReorderContext = createContext({ isEnabled: false, activeId: null, dropTarget: null });

// Figma 1339-127457: rows stay put while dragging; only the overlay follows the pointer, up or down.
const restrictToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });
const MODIFIERS = [restrictToVerticalAxis];
// Re-measured throughout, so the half-row check stays right while the list auto-scrolls.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };
const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'To reorder a pinned item, press Space or Enter to pick it up, use the arrow keys to move it, and press Space or Enter to drop it. Press Escape to cancel.',
};

// Pointer: the pinned row under it, tagged with the half the pointer is in. Keyboard (no pointer): the row moved to.
function detectPinnedRow(args) {
  const { pointerCoordinates, droppableRects } = args;
  if (!pointerCoordinates) return closestCenter(args);
  return pointerWithin(args).map((collision) => {
    const rect = droppableRects.get(collision.id);
    const side = pointerCoordinates.y < rect.top + rect.height / 2 ? 'before' : 'after';
    return { ...collision, data: { ...collision.data, side } };
  });
}

// Drag-and-drop reorder of the root page's pinned rows. `pinnedTotal` is `counts.pinned` from the root response.
export function PinReorderProvider({ appType, items, pinnedTotal, children }) {
  const searchQuery = useSearchStore((state) => state.debouncedSearchQuery);
  const currentPage = useAppsStore((state) => state.currentPage);
  const { queryKey: rootQueryKey } = useRootAppsQueryOptions(appType);
  const reorderPins = useReorderPins();
  const [activeId, setActiveId] = useState(null);
  // `{ overId, side, toIndex }` for the insertion line; null while a drop would change nothing.
  const [dropTarget, setDropTarget] = useState(null);
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the handle stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pinnedItems = useMemo(() => items.filter((item) => item.pinned), [items]);
  const pinnedRowIds = useMemo(() => pinnedItems.map(getRowId), [pinnedItems]);
  const isEnabled = canReorderPins({ searchQuery, currentPage, pinnedRowCount: pinnedItems.length, pinnedTotal });

  const nameOf = (rowId) => pinnedItems[pinnedRowIds.indexOf(rowId)]?.name;

  const trackDropTarget = ({ active, over, collisions }) => {
    // Keyboard moves carry no half-row side, so the direction of travel picks it.
    const side =
      collisions?.[0]?.data?.side ??
      (pinnedRowIds.indexOf(over?.id) > pinnedRowIds.indexOf(active.id) ? 'after' : 'before');
    const toIndex = over ? getDropIndex(pinnedRowIds, active.id, over.id, side) : null;
    // Keeps the same object while nothing changes, so pointer moves don't re-render every row.
    setDropTarget((previous) => {
      if (toIndex === null) return null;
      if (previous?.overId === over.id && previous.side === side) return previous;
      return { overId: over.id, side, toIndex };
    });
  };

  const endDrag = () => {
    setActiveId(null);
    setDropTarget(null);
  };

  const dropActiveRow = ({ active }) => {
    if (dropTarget) {
      const fromIndex = pinnedRowIds.indexOf(active.id);
      reorderPins.mutate({ appType, rootQueryKey, items: movePinnedItem(items, fromIndex, dropTarget.toIndex) });
    }
    endDrag();
  };

  const accessibility = {
    // Portal the live region out of the treegrid, whose only allowed children are rows and rowgroups.
    container: document.body,
    screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
    announcements: {
      onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over ? `${nameOf(active.id)} is over ${nameOf(over.id)}.` : `${nameOf(active.id)} is not over a pinned item.`,
      onDragEnd: ({ active }) =>
        dropTarget
          ? `Moved ${nameOf(active.id)} to position ${dropTarget.toIndex + 1} of ${pinnedRowIds.length}.`
          : `${nameOf(active.id)} stays where it was.`,
      onDragCancel: ({ active }) => `Reordering cancelled. ${nameOf(active.id)} stays where it was.`,
    },
  };

  const contextValue = useMemo(() => ({ isEnabled, activeId, dropTarget }), [isEnabled, activeId, dropTarget]);

  return (
    <PinReorderContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={detectPinnedRow}
        measuring={MEASURING}
        modifiers={MODIFIERS}
        accessibility={accessibility}
        onDragStart={({ active }) => setActiveId(active.id)}
        // Move: the half-row side changes within a row. Over: a move event still carries the previous `over`,
        // and a keyboard step sends no further move, so the new row arrives only here.
        onDragMove={trackDropTarget}
        onDragOver={trackDropTarget}
        onDragEnd={dropActiveRow}
        onDragCancel={endDrag}
      >
        <SortableContext items={pinnedRowIds}>{children}</SortableContext>
        {/* Figma 1339-127422: a translucent row-tint bar, without the row's content, across the columns only. */}
        <DragOverlay modifiers={MODIFIERS} dropAnimation={null} className="tw-cursor-grabbing">
          {activeId && <div aria-hidden className="tw-ml-[70px] tw-h-10 tw-bg-interactive-hover tw-opacity-70" />}
        </DragOverlay>
      </DndContext>
    </PinReorderContext.Provider>
  );
}

// A root row that can be dragged while it's pinned and reordering is allowed.
export function SortableItemRow({ row }) {
  const { isEnabled, activeId } = useContext(PinReorderContext);
  const canReorder = isEnabled && row.original.pinned;
  // Object form: a boolean `disabled` stops only dragging, leaving unpinned rows as drop targets.
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useSortable({
    id: row.id,
    disabled: { draggable: !canReorder, droppable: !canReorder },
  });

  return (
    <ItemRow
      row={row}
      rowRef={setNodeRef}
      dragHandle={canReorder ? { ref: setActivatorNodeRef, listeners, attributes } : undefined}
      isDragging={activeId === row.id}
    />
  );
}

// 2px accent line on one side of a pinned row (Figma 1339-127457). Zero height, so rows never shift around it.
export function DropIndicator({ rowId, side }) {
  const { dropTarget } = useContext(PinReorderContext);
  if (dropTarget?.overId !== rowId || dropTarget.side !== side) return null;

  return (
    <div aria-hidden className="tw-relative">
      <div className="tw-absolute tw-inset-x-0 tw--top-px tw-z-[2] tw-h-0.5 tw-bg-border-accent-strong" />
    </div>
  );
}
