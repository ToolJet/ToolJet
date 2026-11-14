import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu } from 'lucide-react';

import type { QueryKey } from '@tanstack/react-query';

import type { TAppType } from '../../helper';
import type { ListItem } from '../../dummyData/types';
import { useReorderPinsInfinite } from '../hooks/useReorderPinsInfinite';
import { ItemsCard } from './ItemsCard';
import { MobileItemRow } from './MobileItemRow';
import { MobilePinToggle } from './MobilePinToggle';

const getRowId = (item: ListItem) => `${item.kind}:${item.id}`;

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const MODIFIERS = [restrictToVerticalAxis];

interface MobilePinReorderProps {
  items: ListItem[];
  appType: TAppType;
  /** Key of the infinite root query, so the drop edits that cache. */
  queryKey: QueryKey;
  canDrag: boolean;
}

function SortableRow({ item, appType }: { item: ListItem; appType: TAppType }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: getRowId(item),
  });

  return (
    <MobileItemRow
      editing
      item={item}
      rowRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 1 : undefined,
      }}
      className={isDragging ? 'tw-bg-background-surface-layer-01 tw-shadow-elevation-300' : undefined}
      trailing={
        <>
          <MobilePinToggle item={item} appType={appType} />
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Reorder ${item.name}`}
            // touch-action none stops the browser scrolling the page instead of starting the drag.
            className="tw-flex tw-size-11 tw-shrink-0 tw-cursor-grab tw-touch-none tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-strong"
            {...attributes}
            {...listeners}
          >
            <Menu aria-hidden className="tw-size-4" />
          </button>
        </>
      }
    />
  );
}

// The Pinned card in edit mode. Drag is offered only when `canDrag`; otherwise the rows just carry the pin toggle.
export function MobilePinReorder({ items, appType, queryKey, canDrag }: MobilePinReorderProps) {
  const reorderPins = useReorderPinsInfinite();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // A short hold, so a swipe that starts on the handle still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!canDrag) {
    return (
      <ItemsCard label="Pinned">
        {items.map((item) => (
          <MobileItemRow
            key={getRowId(item)}
            editing
            item={item}
            trailing={<MobilePinToggle item={item} appType={appType} />}
          />
        ))}
      </ItemsCard>
    );
  }

  const ids = items.map(getRowId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorderPins.mutate({
      appType,
      queryKey,
      fromIndex: ids.indexOf(String(active.id)),
      toIndex: ids.indexOf(String(over.id)),
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={MODIFIERS} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ItemsCard label="Pinned">
          {items.map((item) => (
            <SortableRow key={getRowId(item)} item={item} appType={appType} />
          ))}
        </ItemsCard>
      </SortableContext>
    </DndContext>
  );
}
