import React from 'react';
import './toggleGroup.scss';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const ToggleGroup1 = ({ children, defaultValue, ...restProps }) => (
  <ToggleGroup.Root className="ToggleGroup" type="single" defaultValue={defaultValue} {...restProps}>
    {children}
  </ToggleGroup.Root>
);

export default ToggleGroup1;

// Read about props https://www.radix-ui.com/primitives/docs/components/toggle-group
