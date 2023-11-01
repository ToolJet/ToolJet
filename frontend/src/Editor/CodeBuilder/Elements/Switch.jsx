import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';

const Switch = ({ value, onChange, cyLabel, meta, paramName, isIcon }) => {
  const options = meta?.options;
  const defaultValue = value;
  return (
    <div>
      <ToggleGroup onValueChange={onChange} defaultValue={defaultValue}>
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} isIcon={isIcon}>
            {option.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
