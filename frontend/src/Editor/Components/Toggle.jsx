import React from 'react';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

class Switch extends React.Component {
    render() {
      const {
        on,
        onClick,
        onChange,
        disabledState
      } = this.props
      return (
          <label className="form-check form-switch form-check-inline">
            <input
              disabled={disabledState}
              className="form-check-input"
              type="checkbox"
              checked={on}
              onChange={onChange}
              onClick={onClick}
            />
        </label>
      )
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
  onEvent
}) => {
    
  const [on, setOn] = React.useState(false)
  const label = component.definition.properties.label.value;
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState = typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;


  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  function toggleValue(e) {
    const toggled = e.target.checked;
    onComponentOptionChanged(component, 'value', toggled);
    onEvent('onChange', { component });

  }

  const toggle = () => setOn(!on)

  return (
    <div className="row  py-1" style={{ width, height, display:parsedWidgetVisibility ? '' : 'none' }} onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}>
        <span className="form-check-label form-check-label col-auto" style={{color: textColor}}>{label}</span>
        <div className="col">
          <Switch disabledState={parsedDisabledState} on={on} onClick={toggle} onChange={toggleValue} />
        </div>
    </div>
  );
};
