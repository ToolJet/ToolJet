import React, { useEffect, useRef, useState } from 'react';

import { KanbanBoard } from './KanbanBoard';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';

export const Kanban = (props) => {
  const { height, width, properties, styles, id, dataCy, componentName, setExposedVariable, setExposedVariables } =
    props;
  const { showDeleteButton, visibility, disabledState } = properties;
  const { boxShadow } = styles;
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // A changed Visibility / Disable property wins over an earlier setVisibility / setDisable call.
  useEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setIsDisabled(disabledState);
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentRef = useRef(null);
  const widgetHeight = showDeleteButton ? height - 100 : height - 20;

  // Disabled board blocks the mouse via `data-disabled`; `inert` also removes card buttons and
  // embedded components from the tab order (runtime only — keeps the builder editable).
  useDisableInert(parentRef, isDisabled);

  return (
    <div
      style={{
        maxWidth: width - 20,
        overflowX: 'auto',
        height: widgetHeight,
        display: isVisible ? '' : 'none',
        boxShadow,
      }}
      id={id}
      ref={parentRef}
      data-disabled={isDisabled}
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
