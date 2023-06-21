import React, { useRef } from 'react';

import { KanbanBoard } from './KanbanBoard';

export const Kanban = (props) => {
  const { height, width, properties, styles, id, boxShadow } = props;
  const { showDeleteButton } = properties;
  const { visibility, disabledState } = styles;

  const parentRef = useRef(null);
  const widgetHeight = showDeleteButton ? height - 100 : height - 20;

  return (
    <div
      style={{
        maxWidth: width - 20,
        overflowX: 'auto',
        height: widgetHeight,
        display: visibility ? '' : 'none',
        boxShadow,
      }}
      id={id}
      ref={parentRef}
      data-disabled={disabledState}
    >
      <KanbanBoard handle kanbanProps={props} parentRef={parentRef} widgetHeight={widgetHeight} />
    </div>
  );
};
