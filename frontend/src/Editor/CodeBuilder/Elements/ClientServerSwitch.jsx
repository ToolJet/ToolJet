import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';

const ClientServerSwitch = ({ value, onChange, meta }) => {
  const options = meta?.options;
  const defaultValue = value ? 'serverSide' : 'clientSide';
  const handleChange = (_value) => {
    onChange(_value === 'serverSide');
  };
  return (
    <div>
      <ToggleGroup onValueChange={handleChange} defaultValue={defaultValue}>
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default ClientServerSwitch;
