import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

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
  const label = component.definition.properties.label.value;
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

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
    <div
      data-disabled={parsedDisabledState}
      className="row py-1"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
    >
      <label className="my-auto mx-2 form-check form-check-inline">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={(e) => {
            toggleValue(e);
          }}
        />
        <span className="form-check-label" style={{ color: textColor }}>
          {label}
        </span>
      </label>
    </div>
  );
};
