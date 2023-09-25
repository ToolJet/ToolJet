import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';

export const ConfigHandle = function ConfigHandle({
  id,
  component,
  dragRef,
  removeComponent,
  position,
  widgetTop,
  widgetHeight,
  isMultipleComponentsSelected = false,
  setSelectedComponent = () => null, //! Only Modal widget passes this uses props down. All other widgets use selecto lib
  customClassName = '',
  configWidgetHandlerForModalComponent = false,
  isVersionReleased,
}) {
  return (
    <div
      className={`config-handle ${customClassName}`}
      ref={dragRef}
      style={{
        top: position === 'top' ? '-30px' : widgetTop + widgetHeight - 10,
      }}
    >
      <span
        style={{
          background: configWidgetHandlerForModalComponent && '#c6cad0',
        }}
        className="badge handle-content"
      >
        <div
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedComponent(id, component, e.shiftKey);
          }}
          role="button"
          data-cy={`${component.name.toLowerCase()}-config-handle`}
        >
          <span>{component.name}</span>
        </div>
        {!isMultipleComponentsSelected && !isVersionReleased && (
          <div
            className="d-flex ml-2"
            style={{ cursor: 'pointer', marginLeft: '4px' }}
            onClick={() => removeComponent({ id })}
            data-cy={`${component.name.toLowerCase()}-delete-button`}
          >
            <SolidIcon name="trash" width="14" className="delete-icon" />
          </div>
        )}
      </span>
    </div>
  );
};
