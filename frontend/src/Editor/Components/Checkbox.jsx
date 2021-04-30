import React from 'react';

export const Checkbox = function Checkbox({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onEvent
}) {
  console.log('currentState', currentState);

  const label = component.definition.properties.label.value;

  function toggleValue(e) {
    const checked = e.target.checked;
    onComponentOptionChanged(component, 'value', checked);
    if (checked) {
      onEvent('onCheck', { component });
    } else {
      onEvent('onUnCheck', { component });
    }
  }

  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)}>
      <label className="form-check form-check-inline">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={(e) => {
            toggleValue(e);
          }}
        />
        <span className="form-check-label">{label}</span>
      </label>
    </div>
  );
};
