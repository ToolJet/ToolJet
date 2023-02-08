import React, { useRef } from 'react';

import { KanbanBoard } from './KanbanBoard';

export const Kanban = (props) => {
  const { height, width, properties, styles, id } = props;
  const { cardWidth, enableDeleteCard } = properties;
  const { visibility, disabledState } = styles;

  const parentRef = useRef(null);
  const widgetHeight = enableDeleteCard ? height - 100 : height - 20;

  return (
    <div
      style={{
        maxWidth: width - 20,
        overflowX: 'auto',
        height: widgetHeight,
        display: visibility ? '' : 'none',
      }}
      id={id}
      ref={parentRef}
      data-disabled={disabledState}
    >
      <KanbanBoard
        containerStyle={{
          maxHeight: widgetHeight - 30,
          width: `${(Number(cardWidth) || 300) + 42}px`,
        }}
        itemCount={3}
        scrollable
        handle
        kanbanProps={props}
        parentRef={parentRef}
      />
    </div>
  );
};
