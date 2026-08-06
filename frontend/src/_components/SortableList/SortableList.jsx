import React from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './components';
import useStore from '@/AppBuilder/_stores/store';

export function SortableList({ items, onChange, renderItem }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        distance: 10,
      },
    })
    // useSensor(KeyboardSensor, {
    //   coordinateGetter: sortableKeyboardCoordinates,
    // })
  );

  const shouldFreeze = useStore((state) => state.isVersionReleased || state.isEditorFreezed || state.isEditorReadOnly);
  const isEditorReadOnly = useStore((state) => state.isEditorReadOnly);
  const enableReleasedVersionPopupState = useStore((state) => state.enableReleasedVersionPopupState);

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={({ active, over }) => {
        if (shouldFreeze) {
          if (!isEditorReadOnly) {
            enableReleasedVersionPopupState(); // only show version popup for version-frozen state
          }
          // For isEditorReadOnly, silently block — the banner explains why
          return;
        }
        if (over) {
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const overIndex = items.findIndex(({ id }) => id === over.id);

          onChange(arrayMove(items, activeIndex, overIndex));
        }
      }}
    >
      <SortableContext items={items}>
        {items?.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}

SortableList.Item = SortableItem;
