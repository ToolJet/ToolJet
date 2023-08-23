import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';
const FIELDS_REQUIRING_SWICTH = ['serverSideSearch', 'serverSideSort', 'serverSideFilter', 'serverSidePagination'];

const ClientServerSwitch = ({ value, onChange, cyLabel, meta, paramName }) => {
  const options = meta?.options;
  const defaultValue = value ? 'serverSide' : 'clientSide';
  const handleChange = (_value) => {
    onChange(_value === 'serverSide');
    console.log(_value === 'serverSide', 'value');
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
