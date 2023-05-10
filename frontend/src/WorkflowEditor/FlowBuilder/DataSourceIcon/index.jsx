import React from 'react';
import { getSvgIcon } from '@/_helpers/appUtils';

const DataSourceIcon = ({ source = {}, height = 25, width = 25 }) => {
  const iconFile = source?.plugin?.iconFile?.data ?? undefined;
  const Icon = () => getSvgIcon(source.kind, 20, 20, iconFile);
  return (
    <div
      style={{
        height,
        width,
      }}
    >
      <Icon />
    </div>
  );
};

export default DataSourceIcon;
