import React from 'react';

import { MultipleContainers } from './MultipleContainers';

export const Kanban = ({ height, width }) => (
  <div
    style={{
      maxWidth: width - 20,
      overflowX: 'auto',
    }}
  >
    <MultipleContainers
      containerStyle={{
        maxHeight: height - 30,
      }}
      itemCount={15}
      scrollable
    />
  </div>
);
