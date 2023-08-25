import React from 'react';
import './toggleGroup.scss';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const ToggleGroup1 = ({ children, className, defaultValue, ...restProps }) => (
  <ToggleGroup.Root className={`ToggleGroup ${className}`} type="single" defaultValue={defaultValue} {...restProps}>
    {children}
  </ToggleGroup.Root>
);

export default ToggleGroup1;

// Read about props https://www.radix-ui.com/primitives/docs/components/toggle-group
