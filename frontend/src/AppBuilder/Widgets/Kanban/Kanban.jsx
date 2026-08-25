import React, { useEffect, useRef, useState } from 'react';

import { KanbanBoard } from './KanbanBoard';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';

export const Kanban = (props) => {
  const { height, width, properties, styles, id, dataCy, componentName, setExposedVariable, setExposedVariables } =
    props;
  const { showDeleteButton } = properties;
  const { boxShadow } = styles;
  const [isVisible, setVisibility] = useState(properties?.visibility ?? true);
  const [isDisabled, setIsDisabled] = useState(properties?.disabledState ?? false);

  useEffect(() => {
    if (isVisible !== properties?.visibility) setVisibility(properties?.visibility ?? true);
    if (isDisabled !== properties?.disabledState) setIsDisabled(properties?.disabledState ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties?.visibility, properties?.disabledState]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    setExposedVariable('isDisabled', isDisabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  useEffect(() => {
    setExposedVariables({
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        setVisibility(!!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        setIsDisabled(!!value);
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
