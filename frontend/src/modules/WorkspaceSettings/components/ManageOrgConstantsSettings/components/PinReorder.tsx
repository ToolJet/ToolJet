// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type Collision,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { getDropIndex, type DropSide } from '../helpers/pinOrder';

/** Where a drop would land: beside row `overId`, at `toIndex` among the pinned rows. */
interface DropTarget {
  overId: UniqueIdentifier;
  side: DropSide;
  toIndex: number;
}

interface PinReorderState {
  isEnabled: boolean;
  activeId: UniqueIdentifier | null;
  dropTarget: DropTarget | null;
}

const PinReorderContext = createContext<PinReorderState>({ isEnabled: false, activeId: null, dropTarget: null });

// Rows stay put while dragging; only the overlay follows the pointer, up or down.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const MODIFIERS = [restrictToVerticalAxis];
// Re-measured throughout, so the half-row check stays right while the page auto-scrolls.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };
const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'To reorder a pinned constant, press Space or Enter to pick it up, use the arrow keys to move it, and press Space or Enter to drop it. Press Escape to cancel.',
};

// Pointer: the pinned row whose vertical span holds the pointer, tagged with the half the pointer is in. x is ignored:
// a drag started from the handle stays over the gutter, which lies outside every row's rect. Keyboard (no pointer):
// the row moved to. Only enabled droppables have a rect, so unpinned rows are never targets.
export const detectPinnedRow: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableRects, droppableContainers } = args;
  if (!pointerCoordinates) return closestCenter(args);

  const { y } = pointerCoordinates;
  const collisions: Collision[] = [];
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    if (!rect || y < rect.top || y >= rect.bottom) continue;
    const side = y < rect.top + rect.height / 2 ? 'before' : 'after';
    collisions.push({ id: container.id, data: { droppableContainer: container, side } });
  }
  return collisions;
};

// Wraps the table. `pinnedRows` is `[{ id, name }]` for the pinned rows on this page, in display order; `onMove`
// gets the dragged id and its new index among them. The overlay renders beside the table, never inside it.
interface PinReorderProviderProps {
  pinnedRows: { id: string; name: string }[];
  isEnabled: boolean;
  onMove: (id: string, toIndex: number) => void;
  children: ReactNode;
}

export function PinReorderProvider({ pinnedRows, isEnabled, onMove, children }: PinReorderProviderProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // `{ overId, side, toIndex }` for the insertion line; null while a drop would change nothing.
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the handle stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pinnedIds = useMemo(() => pinnedRows.map(({ id }) => id), [pinnedRows]);
  const nameOf = (id: UniqueIdentifier) => pinnedRows.find((row) => row.id === id)?.name;

  const trackDropTarget = ({ active, over, collisions }: DragMoveEvent | DragOverEvent) => {
    // Keyboard moves carry no half-row side, so the direction of travel picks it.
    const side: DropSide =
      collisions?.[0]?.data?.side ??
      (over && pinnedIds.indexOf(String(over.id)) > pinnedIds.indexOf(String(active.id)) ? 'after' : 'before');
    const toIndex = over ? getDropIndex(pinnedIds, String(active.id), String(over.id), side) : null;
    // Keeps the same object while nothing changes, so pointer moves don't re-render every row.
    setDropTarget((previous) => {
      if (toIndex === null || !over) return null;
      if (previous?.overId === over.id && previous.side === side) return previous;
      return { overId: over.id, side, toIndex };
    });
  };

  const endDrag = () => {
    setActiveId(null);
    setDropTarget(null);
  };

  const dropActiveRow = ({ active }: DragEndEvent) => {
    if (dropTarget) onMove(String(active.id), dropTarget.toIndex);
    endDrag();
  };

  const accessibility: { screenReaderInstructions: typeof SCREEN_READER_INSTRUCTIONS; announcements: Announcements } = {
    screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
    announcements: {
      onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over ? `${nameOf(active.id)} is over ${nameOf(over.id)}.` : `${nameOf(active.id)} is not over a pinned row.`,
      onDragEnd: ({ active }) =>
        dropTarget
          ? `Moved ${nameOf(active.id)} to position ${dropTarget.toIndex + 1} of ${pinnedIds.length}.`
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
        <SortableContext items={pinnedIds}>{children}</SortableContext>
        {/* A translucent tint bar the size of the row, without its content. */}
        <DragOverlay modifiers={MODIFIERS} dropAnimation={null} className="tw-cursor-grabbing">
          {activeId && <div aria-hidden className="tw-size-full tw-bg-interactive-hover tw-opacity-70" />}
        </DragOverlay>
      </DndContext>
    </PinReorderContext.Provider>
  );
}

// Sortable wiring for one `<tr>`. Only a pinned row can be dragged while reordering is allowed.
export function useSortableRow(id: string, isPinned: boolean) {
  const { isEnabled, activeId, dropTarget } = useContext(PinReorderContext);
  const canDrag = isEnabled && isPinned;
  // Object form: a boolean `disabled` stops only dragging, leaving unpinned rows as drop targets.
  const { setNodeRef, setActivatorNodeRef, listeners, attributes } = useSortable({
    id,
    disabled: { draggable: !canDrag, droppable: !canDrag },
  });

  return {
    rowRef: setNodeRef,
    dragHandle: canDrag ? { ref: setActivatorNodeRef, listeners, attributes } : undefined,
    isDragging: activeId === id,
    // Which edge of this row the insertion line sits on, while it is the drop target.
    dropSide: dropTarget?.overId === id ? dropTarget.side : undefined,
  };
}
