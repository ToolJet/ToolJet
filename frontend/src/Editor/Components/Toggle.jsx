import React from 'react';

class Switch extends React.Component {
    render() {
      const {
        on,
        onClick,
        onChange
      } = this.props
      return (
        <label className="form-check form-switch my-2">
          <input
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

export const Toggle = ({
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
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';

  function toggleValue(e) {
    const toggled = e.target.checked;
    onComponentOptionChanged(component, 'value', toggled);
    if (toggled) {
      onEvent('onToggle', { component });
    } else {
      onEvent('onUnToggle', { component });
    }
  }

  const toggle = () => setOn(!on)

  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)}>
        <Switch on={on} onClick={toggle} onChange={toggleValue} />
    </div>
  );
};
