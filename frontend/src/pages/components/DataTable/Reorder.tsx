import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
import type { CollisionDetection, DragEndEvent, DragMoveEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import type { Row } from '@tanstack/react-table';

import { DRAG_OVERLAY_CLASS } from './constants';
import { getDropIndex } from './dropIndex';
import type { DropSide } from './dropIndex';
import type { DataTableReorder, DropTarget } from './types';

interface ReorderContextValue {
  isEnabled: boolean;
  reorderableIds: Set<string>;
  activeId: string | null;
  dropTarget: DropTarget | null;
}

const ReorderContext = createContext<ReorderContextValue>({
  isEnabled: false,
  reorderableIds: new Set(),
  activeId: null,
  dropTarget: null,
});

// Figma 1339-127457: rows stay put while dragging; only the overlay follows the pointer, up or down.
const restrictToVerticalAxis = ({
  transform,
}: {
  transform: { x: number; y: number; scaleX: number; scaleY: number };
}) => ({
  ...transform,
  x: 0,
});
const MODIFIERS = [restrictToVerticalAxis];
// Re-measured throughout, so the half-row check stays right while the table auto-scrolls.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

// Pointer: the reorderable row under it, tagged with the half the pointer is in. Keyboard (no pointer): the row moved to.
const detectReorderableRow: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableRects } = args;
  if (!pointerCoordinates) return closestCenter(args);
  return pointerWithin(args).map((collision) => {
    const rect = droppableRects.get(collision.id);
    if (!rect) return collision;
    const side: DropSide = pointerCoordinates.y < rect.top + rect.height / 2 ? 'before' : 'after';
    return { ...collision, data: { ...collision.data, side } };
  });
};

interface ReorderProviderProps<T> {
  /** Top-level rows of the table. */
  rows: Row<T>[];
  reorder: DataTableReorder<T>;
  children: ReactNode;
}

// Drag-and-drop reorder of the table's reorderable rows. The page decides what a drop does (`onReorder`).
export function ReorderProvider<T>({ rows, reorder, children }: ReorderProviderProps<T>) {
  const { isEnabled, isRowReorderable, getRowLabel, onReorder, itemLabel = 'item' } = reorder;
  const [activeId, setActiveId] = useState<string | null>(null);
  // `{ overId, side, toIndex }` for the insertion line; null while a drop would change nothing.
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the handle stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderableRows = useMemo(() => rows.filter(isRowReorderable), [rows, isRowReorderable]);
  const reorderableIds = useMemo(() => reorderableRows.map((row) => row.id), [reorderableRows]);
  const reorderableIdSet = useMemo(() => new Set(reorderableIds), [reorderableIds]);

  const nameOf = (rowId: string | number) => {
    const row = reorderableRows[reorderableIds.indexOf(String(rowId))];
    return row ? getRowLabel(row) : '';
  };

  const trackDropTarget = ({ active, over, collisions }: DragOverEvent | DragMoveEvent) => {
    const activeRowId = String(active.id);
    // Keyboard moves carry no half-row side, so the direction of travel picks it.
    const side: DropSide =
      collisions?.[0]?.data?.side ??
      (over && reorderableIds.indexOf(String(over.id)) > reorderableIds.indexOf(activeRowId) ? 'after' : 'before');
    const toIndex = over ? getDropIndex(reorderableIds, activeRowId, String(over.id), side) : null;
    // Keeps the same object while nothing changes, so pointer moves don't re-render every row.
    setDropTarget((previous) => {
      if (toIndex === null || !over) return null;
      if (previous?.overId === String(over.id) && previous.side === side) return previous;
      return { overId: String(over.id), side, toIndex };
    });
  };

  const endDrag = () => {
    setActiveId(null);
    setDropTarget(null);
  };

  const dropActiveRow = ({ active }: DragEndEvent) => {
    if (dropTarget) {
      const activeRowId = String(active.id);
      onReorder({ activeId: activeRowId, fromIndex: reorderableIds.indexOf(activeRowId), toIndex: dropTarget.toIndex });
    }
    endDrag();
  };

  const accessibility = {
    // Portal the live region out of the grid, whose only allowed children are rows and rowgroups.
    container: document.body,
    screenReaderInstructions: {
      draggable: `To reorder a ${itemLabel}, press Space or Enter to pick it up, use the arrow keys to move it, and press Space or Enter to drop it. Press Escape to cancel.`,
    },
    announcements: {
      onDragStart: ({ active }: { active: { id: string | number } }) => `Picked up ${nameOf(active.id)}.`,
      onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
        over ? `${nameOf(active.id)} is over ${nameOf(over.id)}.` : `${nameOf(active.id)} is not over a ${itemLabel}.`,
      onDragEnd: ({ active }: { active: { id: string | number } }) =>
        dropTarget
          ? `Moved ${nameOf(active.id)} to position ${dropTarget.toIndex + 1} of ${reorderableIds.length}.`
          : `${nameOf(active.id)} stays where it was.`,
      onDragCancel: ({ active }: { active: { id: string | number } }) =>
        `Reordering cancelled. ${nameOf(active.id)} stays where it was.`,
    },
  };

  const contextValue = useMemo(
    () => ({ isEnabled, reorderableIds: reorderableIdSet, activeId, dropTarget }),
    [isEnabled, reorderableIdSet, activeId, dropTarget]
  );

  return (
    <ReorderContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={detectReorderableRow}
        measuring={MEASURING}
        modifiers={MODIFIERS}
        accessibility={accessibility}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        // Move: the half-row side changes within a row. Over: a move event still carries the previous `over`,
        // and a keyboard step sends no further move, so the new row arrives only here.
        onDragMove={trackDropTarget}
        onDragOver={trackDropTarget}
        onDragEnd={dropActiveRow}
        onDragCancel={endDrag}
      >
        <SortableContext items={reorderableIds}>{children}</SortableContext>
        <DragOverlay modifiers={MODIFIERS} dropAnimation={null} className="tw-cursor-grabbing">
          {activeId && <div aria-hidden className={DRAG_OVERLAY_CLASS} />}
        </DragOverlay>
      </DndContext>
    </ReorderContext.Provider>
  );
}

// For a row component under a table with `reorder`: the ref and drag handle to hand to the row's DOM.
// The handle is undefined when the row can't be dragged right now.
export function useDataTableRowReorder<T>(row: Row<T>) {
  const { isEnabled, reorderableIds, activeId } = useContext(ReorderContext);
  const canReorder = isEnabled && reorderableIds.has(row.id);
  // Object form: a boolean `disabled` stops only dragging, leaving other rows as drop targets.
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useSortable({
    id: row.id,
    disabled: { draggable: !canReorder, droppable: !canReorder },
  });

  return {
    rowRef: setNodeRef,
    dragHandle: canReorder ? { ref: setActivatorNodeRef, listeners, attributes } : undefined,
    isDragging: activeId === row.id,
  };
}

// 2px accent line on one side of a reorderable row (Figma 1339-127457). Zero height, so rows never shift around it.
export function DropIndicator({ rowId, side }: { rowId: string; side: DropSide }) {
  const { dropTarget } = useContext(ReorderContext);
  if (dropTarget?.overId !== rowId || dropTarget.side !== side) return null;

  return (
    <div aria-hidden className="tw-relative">
      <div className="tw-absolute tw-inset-x-0 tw--top-px tw-z-[2] tw-h-0.5 tw-bg-border-accent-strong" />
    </div>
  );
}
