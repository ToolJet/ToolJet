import React, { useRef } from 'react';

import { KanbanBoard } from './KanbanBoard';

export const Kanban = (props) => {
  const { height, width, properties, styles, id } = props;
  const { showDeleteButton } = properties;
  const { visibility, disabledState, boxShadow, backgroundColor, borderColor, borderRadius } = styles;

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
        backgroundColor,
        borderColor,
        borderRadius: Number(borderRadius),
        borderWidth: borderColor ? '1px' : '0px',
        borderStyle: borderColor ? 'solid' : 'none',
      }}
      id={id}
      ref={parentRef}
      data-disabled={disabledState}
      className="scrollbar-container"
    >
      <KanbanBoard handle kanbanProps={props} parentRef={parentRef} widgetHeight={widgetHeight} id={id} />
    </div>
  );
};
