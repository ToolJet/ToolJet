import React, { useRef } from 'react';

import { KanbanBoard } from './KanbanBoard';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';

export const Kanban = (props) => {
  const { height, width, properties, styles, id, dataCy, componentName } = props;
  const { showDeleteButton } = properties;
  const { visibility, disabledState, boxShadow } = styles;

  const parentRef = useRef(null);
  const widgetHeight = showDeleteButton ? height - 100 : height - 20;

  // Disabled board blocks the mouse via `data-disabled`; `inert` also removes card buttons and
  // embedded components from the tab order (runtime only — keeps the builder editable).
  useDisableInert(parentRef, disabledState);

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
      data-cy={dataCy}
      className="scrollbar-container"
    >
      <KanbanBoard
        handle
        kanbanProps={props}
        parentRef={parentRef}
        widgetHeight={widgetHeight}
        id={id}
        dataCy={dataCy}
      />
    </div>
  );
};
