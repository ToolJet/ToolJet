import React from 'react';

export const ConfigHandle = function ConfigHandle({
  id,
  component,
  configHandleClicked,
  dragRef,
  removeComponent,
  position,
  widgetTop,
  widgetHeight,
}) {
  return (
    <div
      className="config-handle"
      ref={dragRef}
      style={{
        top: position === 'top' ? '-22px' : widgetTop + widgetHeight - 10,
      }}
    >
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          configHandleClicked(id, component);
        }}
        className="badge handle-content"
        role="button"
      >
        <img
          style={{ cursor: 'pointer', marginRight: '5px' }}
          src="/assets/images/icons/settings.svg"
          width="12"
          height="12"
          draggable="false"
        />
        {component.name}
      </span>
      <img
        style={{ cursor: 'pointer', marginRight: '5px' }}
        src="/assets/images/icons/trash.svg"
        width="12"
        role="button"
        className="mx-2"
        height="12"
        draggable="false"
        onClick={() => removeComponent({ id })}
      />
    </div>
  );
};
