import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

class Switch extends React.Component {
  render() {
    const { on, onClick, onChange, disabledState, color } = this.props;

    return (
      <label className="form-switch form-check-inline">
        <input
          style={{ backgroundColor: on ? `${color}` : 'white' }}
          disabled={disabledState}
          className="form-check-input"
          type="checkbox"
          checked={on}
          onChange={onChange}
          onClick={onClick}
        />
      </label>
    );
  }
}

export const ToggleSwitch = ({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onEvent,
}) => {
  const [on, setOn] = React.useState(false);
  const label = component.definition.properties.label.value;
  const textColorProperty = component.definition.styles.textColor;
  const toggleSwitchColorProperty = component.definition.styles.toggleSwitchColor;
  const toggleSwitchColor = toggleSwitchColorProperty ? toggleSwitchColorProperty.value : '#3c92dc';
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
    const toggled = e.target.checked;
    onComponentOptionChanged(component, 'value', toggled);
    onEvent('onChange', { component });
  }

  const toggle = () => setOn(!on);

  return (
    <div
      className="row"
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
    >
      <span className="form-check-label form-check-label col-auto my-auto" style={{ color: textColor }}>
        {label}
      </span>
      <div className="col">
        <Switch
          disabledState={parsedDisabledState}
          on={on}
          onClick={toggle}
          onChange={toggleValue}
          color={toggleSwitchColor}
        />
      </div>
    </div>
  );
};
