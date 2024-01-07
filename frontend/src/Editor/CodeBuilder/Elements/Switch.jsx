import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';

const Switch = ({ value, onChange, cyLabel, meta, paramName, isIcon }) => {
  const options = meta?.options;

  const defaultValue = typeof value == 'boolean' ? (value ? '{{true}}' : '{{false}}') : value; //for booelan values ex: in checkbox and toggle

  function handleOptionChanged(_value) {
    onChange(_value);
  }

  return (
    <div>
      <ToggleGroup onValueChange={handleOptionChanged} defaultValue={defaultValue}>
        {options.map((option) => (
          <ToggleGroupItem
            key={`${option.value}-${meta.type}`}
            value={option.value}
            isIcon={isIcon}
            defaultValue={defaultValue}
          >
            {option.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
