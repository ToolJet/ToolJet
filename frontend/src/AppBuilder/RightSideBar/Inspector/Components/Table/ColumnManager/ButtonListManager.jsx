import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const ButtonListItem = ({ button, index, onSelect }) => (
  <Draggable draggableId={button.id} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className="d-flex align-items-center cursor-pointer button-list-item"
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-weak)',
          backgroundColor: 'var(--surfaces-surface-01)',
          ...provided.draggableProps.style,
        }}
        onClick={() => onSelect(button.id)}
      >
        <span
          {...provided.dragHandleProps}
          className="d-flex align-items-center"
          style={{ marginRight: '8px', cursor: 'grab' }}
        >
          <SolidIcon name="dragicon" width={16} />
        </span>
        <span className="tj-text-xsm text-truncate" style={{ flex: 1 }}>
          {button.buttonLabel || 'Button'}
        </span>
      </div>
    )}
  </Draggable>
);

const EmptyState = () => (
  <div className="d-flex flex-column align-items-center" style={{ padding: '16px 12px', gap: '8px' }}>
    <SolidIcon name="information" width={24} />
    <span className="tj-text-xsm font-weight-500">No action button added</span>
    <span className="tj-text-xsm text-center" style={{ color: 'var(--text-placeholder)' }}>
      Add action buttons to table rows and configure events like you would with any button component
    </span>
  </div>
);

export const ButtonListManager = ({ buttons = [], onAddButton, onReorderButtons, onSelectButton }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(buttons);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorderButtons(reordered);
  };

  return (
    <div className="d-flex flex-column" style={{ gap: '8px', padding: '0 12px' }}>
      <div
        className="d-flex align-items-center justify-content-center tj-text-xsm"
        style={{ color: 'var(--text-placeholder)', gap: '8px' }}
      >
        <span style={{ flex: 1, borderTop: '1px dashed var(--border-weak)' }} />
        <span>Buttons</span>
        <span style={{ flex: 1, borderTop: '1px dashed var(--border-weak)' }} />
      </div>

      {buttons.length === 0 ? (
        <EmptyState />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="button-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="d-flex flex-column" style={{ gap: '4px' }}>
                {buttons.map((button, idx) => (
                  <ButtonListItem key={button.id} button={button} index={idx} onSelect={onSelectButton} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <button
        className="btn btn-sm border d-flex align-items-center justify-content-center"
        style={{ gap: '4px', padding: '6px 12px', borderRadius: '6px', width: '100%' }}
        onClick={onAddButton}
      >
        <SolidIcon name="plus" width={14} />
        <span className="tj-text-xsm">Add new action button</span>
      </button>
    </div>
  );
};
