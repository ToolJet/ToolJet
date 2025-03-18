import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

export const CalendarEventPopover = function ({
  id,
  show,
  offset,
  darkMode,
  calendarWidgetId,
  containerProps,
  removeComponent,
  popoverClosed,
  component,
}) {
  const parentRef = useRef(null);
  const [showPopover, setShow] = useState(show);
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);

  const minHeight = 400;
  let calendarBounds;
  let canvasBounds;

  const calendarElement = document.getElementById(calendarWidgetId);

  const handleClickOutside = (event) => {
    if (
      parentRef.current &&
      !parentRef.current.contains(event.target) &&
      !event.target.closest('.editor-sidebar') &&
      !isMoveableControlClicked(event)
    ) {
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
      const _left = offset.left - calendarBounds.x + offset.width;
      const _top = ((offset.top - calendarBounds.y) * 100) / calendarBounds.height;
      setTop(_top);
      setLeft(_left);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset?.top, showPopover]);

  if (calendarElement && showPopover) {
    calendarBounds = calendarElement.getBoundingClientRect();
    const canvasElement = document.getElementsByClassName('canvas-container')[0];
    canvasBounds = canvasElement.getBoundingClientRect();
  }

  const styles = useMemo(
    () => ({
      height: minHeight,
      backgroundColor: darkMode ? '#232e3c' : '#FFFFFF',
    }),
    [darkMode, minHeight]
  );

  return (
    <div>
      {showPopover && (
        <div
          style={{
            // backgroundColor: 'rgba(0, 0, 0, 0.6)', // This can be used for testing the overlay
            top: -(calendarBounds.y + top),
            left: -calendarBounds.x,
            zIndex: 10,
            position: 'fixed',
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
        className={`popover bs-popover-left shadow-lg ${darkMode ? 'dark' : ''}`}
        ref={parentRef}
        id={`${calendarWidgetId}-popover`}
      >
        {parentRef.current && showPopover && (
          <div className="popover-body" style={{ padding: 'unset', width: '100%', height: '100%', zIndex: 11 }}>
            <>
              <SubContainer
                canvasWidth={300}
                canvasHeight={minHeight}
                id={`${id}-popover`}
                styles={styles}
                darkMode={darkMode}
              />
            </>
          </div>
        )}
      </div>
    </div>
  );
};

function isMoveableControlClicked(event) {
  // Get the element that was clicked on
  const clickedElement = event.target;

  // Check if the clicked element or any of its parents have the class 'moveable-control-box'
  return (
    clickedElement.classList.contains('moveable-control-box') ||
    clickedElement.closest('.moveable-control-box') !== null
  );
}
