import React, { useEffect, useRef, useState } from 'react';
import { SubContainer } from '../../SubContainer';

export const CardEventPopover = function ({
  show,
  offset,
  kanbanCardWidgetId,
  popoverClosed,
  card,
  updateCardProperty,
  index,
  keyIndex,
  containerProps,
  removeComponent,
  component,
  id,
}) {
  const parentRef = useRef(null);
  const [showPopover, setShow] = useState(show);
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);

  let kanbanBounds;

  const kanbanElement = document.getElementById(kanbanCardWidgetId);

  const handleClickOutside = (event) => {
    if (parentRef.current && !parentRef.current.contains(event.target)) {
      popoverClosed();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  useEffect(() => {
    setShow(show);
  }, [show]);

  useEffect(() => {
    if (offset?.top && showPopover) {
      const _left = offset.left - kanbanBounds.x + offset.width;
      const _top = ((offset.top - kanbanBounds.y) * 100) / kanbanBounds.height;
      setTop(_top);
      setLeft(_left);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset?.top, showPopover]);

  if (kanbanElement && showPopover) {
    kanbanBounds = kanbanElement.getBoundingClientRect();
  }
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [childrenData, setChildrenData] = useState({});

  React.useEffect(() => {
    updateCardProperty(keyIndex, index, 'data', childrenData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 100,
        width: '300px',
        maxWidth: '300px',
        height: 300,
        top: `${top}%`,
        left,
        display: showPopover ? 'block' : 'none',
      }}
      role="tooltip"
      x-placement="left"
      className={`popover bs-popover-left shadow-lg ${darkMode && 'popover-dark-themed theme-dark'}`}
      ref={parentRef}
      id={kanbanCardWidgetId}
    >
      {parentRef.current && showPopover && (
        <div className="popover-body" style={{ padding: 'unset', width: '100%', height: 100, zIndex: 11 }}>
          <SubContainer
            parentComponent={component}
            containerCanvasWidth={300}
            parent={id}
            parentName={component.name}
            {...containerProps}
            readOnly={index !== 0}
            customResolvables={{ card }}
            parentRef={parentRef}
            removeComponent={removeComponent}
            exposedVariables={card.data ?? {}}
            onOptionChange={function ({ component, optionName, value }) {
              setChildrenData((prevData) => {
                const changedData = { [component.name]: { [optionName]: value } };
                const existingDataAtIndex = prevData ?? {};
                const newData = {
                  ...prevData,
                  [component.name]: { ...existingDataAtIndex[component.name], ...changedData[component.name] },
                };

                return newData;
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
