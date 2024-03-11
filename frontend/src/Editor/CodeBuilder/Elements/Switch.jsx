import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';
import cx from 'classnames';

const Switch = ({ value, onChange, cyLabel, meta, paramName, isIcon }) => {
  const options = meta?.options;
  const defaultValue = value;
  return (
    <div className={cx({ 'w-full': meta?.fullWidth })}>
      <ToggleGroup onValueChange={onChange} defaultValue={defaultValue} className={cx({ 'w-full': meta?.fullWidth })}>
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            isIcon={isIcon}
            style={{ width: meta?.fullWidth ? '100%' : '67px' }}
          >
            {isIcon ? option?.iconName ?? '' : option?.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
