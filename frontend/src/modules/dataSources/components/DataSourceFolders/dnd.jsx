import React, { useContext } from 'react';
import cx from 'classnames';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';

// Wraps a data-source row so it can be dragged into a folder (or out to the stray zone). The
// CustomPointerSensor only starts a drag from an element carrying data-draggable="true", so a
// plain click (open / delete) still works — drag only kicks in past the activation distance.
//
// Selection: shift / ⌘ / ctrl + click toggles the row in the multi-select set (for dragging many
// data sources at once) without opening it; a plain click clears the selection and opens the row.
export const DraggableDataSource = ({ dataSource, sourceFolderId = null, children }) => {
  const { selectedDataSourceIds, setSelectedDataSourceIds } = useContext(GlobalDataSourcesContext);
  const isSelected = selectedDataSourceIds.includes(dataSource.id);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ds:${dataSource.id}`,
    data: { dataSource, sourceFolderId },
  });

  const handleClickCapture = (e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Swallow the click so the row doesn't open, and toggle selection membership.
      e.preventDefault();
      e.stopPropagation();
      setSelectedDataSourceIds((prev) =>
        prev.includes(dataSource.id) ? prev.filter((id) => id !== dataSource.id) : [...prev, dataSource.id]
      );
    } else if (selectedDataSourceIds.length) {
      // Plain click on any row drops the current selection (then the click opens the row).
      setSelectedDataSourceIds([]);
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-draggable="true"
      className={cx('datasource-draggable', { 'is-selected': isSelected })}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClickCapture={handleClickCapture}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

// Generic drop target. `data.folderId` identifies the destination folder (null = the stray zone,
// i.e. "remove from folder"). Adds `is-drop-over` while a draggable hovers it.
export const DroppableZone = ({ id, data, className, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div ref={setNodeRef} className={cx(className, { 'is-drop-over': isOver })}>
      {children}
    </div>
  );
};
