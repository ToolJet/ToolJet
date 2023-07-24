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
        top: position === 'top' ? '-22px' : widgetTop + widgetHeight - 10,
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
          <img
            style={{ cursor: 'pointer', marginRight: '5px', verticalAlign: 'middle' }}
            src="assets/images/icons/settings.svg"
            width="12"
            height="12"
            draggable="false"
          />
          <span>{component.name}</span>
        </div>
        {!isMultipleComponentsSelected && !isVersionReleased && (
          <div className="delete-part">
            <img
              style={{ cursor: 'pointer', marginLeft: '5px' }}
              src="assets/images/icons/trash-light.svg"
              width="12"
              role="button"
              height="12"
              draggable="false"
              onClick={() => removeComponent({ id })}
              data-cy={`${component.name.toLowerCase()}-delete-button`}
              className="delete-icon"
            />
          </div>
        )}
      </span>
    </div>
  );
};
