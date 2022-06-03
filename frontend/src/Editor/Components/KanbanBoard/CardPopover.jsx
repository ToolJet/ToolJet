import React, { useEffect, useRef, useState } from 'react';
import { SubCustomDragLayer } from '../../SubCustomDragLayer';
import { SubContainer } from '../../SubContainer';

export const CardEventPopover = function ({
  show,
  offset,
  kanbanCardWidgetId,
  containerProps,
  removeComponent,
  popoverClosed,
  customResolvables,
}) {
  const parentRef = useRef(null);
  const [showPopover, setShow] = useState(show);
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);

  const minHeight = 400;
  let kanbanBounds;
  let canvasBounds;

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
    const canvasElement = document.getElementsByClassName('canvas-container')[0];
    canvasBounds = canvasElement.getBoundingClientRect();
  }
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div>
      {showPopover && (
        <div
          style={{
            top: -(kanbanBounds.y + top),
            left: -kanbanBounds.x,
            zIndex: 109,
            position: 'relative',
            height: canvasBounds.height + top,
            width: canvasBounds.width,
          }}
          onClick={() => popoverClosed()}
        ></div>
      )}
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          width: '300px',
          maxWidth: '300px',
          minHeight,
          top: `${top}%`,
          left,
          display: showPopover ? 'block' : 'none',
        }}
        role="tooltip"
        x-placement="left"
        className={`popover bs-popover-left shadow-lg ${darkMode && 'popover-dark-themed theme-dark'}`}
        ref={parentRef}
        id={`${kanbanCardWidgetId}-popover`}
      >
        {parentRef.current && showPopover && (
          <div className="popover-body" style={{ padding: 'unset', width: '100%', height: '100%', zIndex: 11 }}>
            <>
              <SubContainer
                containerCanvasWidth={300}
                parent={`${kanbanCardWidgetId}-popover`}
                {...containerProps}
                parentRef={parentRef}
                removeComponent={removeComponent}
                customResolvables={{ card: customResolvables }}
              />
              <SubCustomDragLayer
                parent={kanbanCardWidgetId}
                parentRef={parentRef}
                currentLayout={containerProps.currentLayout}
              />
            </>
          </div>
        )}
      </div>
    </div>
  );
};
