import React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const ToggleGroupItem = ({ children, value, ...restProps }) => {
  return (
    <ToggleGroup.Item className="ToggleGroupItem" value={value} {...restProps}>
      <div className="toggle-item">{children}</div>
    </ToggleGroup.Item>
  );
};

export default ToggleGroupItem;
