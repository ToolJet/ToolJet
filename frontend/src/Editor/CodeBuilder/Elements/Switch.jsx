import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';

const Switch = ({ value, onChange, meta }) => {
  const options = meta?.options;
  console.log(value, 'value');
  return (
    <div>
      <ToggleGroup onValueChange={onChange} defaultValue={value}>
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
