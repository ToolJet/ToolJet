import React from 'react';
import { resolve, resolve_references } from '@/_helpers/utils';

export const Checkbox = function Checkbox({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onEvent,
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
      <label class="form-check form-check-inline">
        <input
          class="form-check-input"
          type="checkbox"
          onClick={(e) => {
            toggleValue(e);
          }}
        />
        <span class="form-check-label">{label}</span>
      </label>
    </div>
  );
};
