import React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableItem } from './components';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export function SortableList({ items, onChange, renderItem }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const { enableReleasedVersionPopupState, isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );
  return (
    <DndContext
      sensors={sensors}
      onDragEnd={({ active, over }) => {
        if (isVersionReleased || isEditorFreezed) {
          enableReleasedVersionPopupState();
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
        {items.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}

SortableList.Item = SortableItem;
