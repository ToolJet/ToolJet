import React from 'react';
import './toggleGroup.scss';
// eslint-disable-next-line import/no-unresolved
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const ToggleGroup1 = ({ children, className, onValueChange, defaultValue, ...restProps }) => {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <ToggleGroup.Root
      className={`ToggleGroup ${className}`}
      type="single"
      defaultValue={defaultValue}
      onValueChange={(value) => {
        if (value) {
          setValue(value);
          onValueChange(value);
        }
      }}
      {...restProps}
      value={value}
    >
      {children}
    </ToggleGroup.Root>
  );
};

export default ToggleGroup1;

// Read about props https://www.radix-ui.com/primitives/docs/components/toggle-group
