// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
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

// Pointer: the pinned row whose vertical span holds the pointer, tagged with the half the pointer is in. Above the
// first pinned row or below the last, the pointer clamps to the first row's top or the last row's bottom, so the
// indicator stays put over the header, the divider and the unpinned rows, and a drop there lands first or last. x is
// ignored: a drag started from the handle stays over the gutter, which lies outside every row's rect. Keyboard (no
// pointer): the row moved to. Only enabled droppables have a rect, so unpinned rows are never targets.
export const detectPinnedRow: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableRects, droppableContainers } = args;
  if (!pointerCoordinates) return closestCenter(args);

  const { y } = pointerCoordinates;
  const collisions: Collision[] = [];
  let first: { container: (typeof droppableContainers)[number]; top: number } | null = null;
  let last: { container: (typeof droppableContainers)[number]; bottom: number } | null = null;
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    if (!rect) continue;
    if (!first || rect.top < first.top) first = { container, top: rect.top };
    if (!last || rect.bottom > last.bottom) last = { container, bottom: rect.bottom };
    if (y < rect.top || y >= rect.bottom) continue;
    const side = y < rect.top + rect.height / 2 ? 'before' : 'after';
    collisions.push({ id: container.id, data: { droppableContainer: container, side } });
  }
  if (collisions.length > 0) return collisions;
  if (first && y < first.top)
    return [{ id: first.container.id, data: { droppableContainer: first.container, side: 'before' } }];
  if (last && y >= last.bottom)
    return [{ id: last.container.id, data: { droppableContainer: last.container, side: 'after' } }];
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
        {/* The pointer leaves the handle during a drag, so without this it flips between arrow, hand and text. */}
        {activeId && (
          <style>{'*, *::before, *::after { cursor: grabbing !important; user-select: none !important; }'}</style>
        )}
        <SortableContext items={pinnedIds}>{children}</SortableContext>
        {/* A translucent tint bar the size of the row, without its content. */}
        <DragOverlay modifiers={MODIFIERS} dropAnimation={null} className="tw-cursor-grabbing">
          {activeId && <div aria-hidden className="tw-size-full tw-bg-interactive-hover tw-opacity-70" />}
        </DragOverlay>
      </DndContext>
    </PinReorderContext.Provider>
  );
}

// The insertion line, drawn at the boundary between two rows rather than on either row's edge: "before" the row below
// and "after" the row above are the same spot, so it neither jumps nor follows the rows' rounded corners. A hollow
// circle caps its start. `containerRef` is the positioned ancestor holding the table, and the line scrolls with it.
export function PinDropIndicator({ containerRef }: { containerRef: RefObject<HTMLElement> }) {
  const { dropTarget } = useContext(PinReorderContext);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const row =
      dropTarget && container
        ? [...container.querySelectorAll<HTMLElement>('tr[data-row-id]')].find(
            (candidate) => candidate.dataset.rowId === String(dropTarget.overId)
          )
        : undefined;
    if (!dropTarget || !container || !row) {
      setBox(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setBox({
      top: (dropTarget.side === 'before' ? rowRect.top : rowRect.bottom) - containerRect.top,
      left: rowRect.left - containerRect.left,
      width: rowRect.width,
    });
  }, [dropTarget, containerRef]);

  if (!box) return null;
  return (
    <div
      aria-hidden
      data-testid="pin-drop-indicator"
      className="tw-pointer-events-none tw-absolute tw-z-[2] tw-h-0.5 tw--translate-y-1/2 tw-bg-border-accent-strong"
      style={{ top: box.top, left: box.left, width: box.width }}
    >
      <span className="tw-absolute tw--left-1 tw-top-1/2 tw-size-2 tw--translate-y-1/2 tw-rounded-full tw-border-2 tw-border-solid tw-border-border-accent-strong tw-bg-page-default" />
    </div>
  );
}

// Sortable wiring for one `<tr>`. Only a pinned row can be dragged while reordering is allowed.
export function useSortableRow(id: string, isPinned: boolean) {
  const { isEnabled, activeId } = useContext(PinReorderContext);
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
  };
}
