import React, { useState, useRef, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';

const QueryPanel = ({ queryPanelHeight, children }) => {
  const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};
  const [isExpanded, setExpanded] = useState(queryManagerPreferences?.isExpanded ?? true);
  const isComponentMounted = useRef(false);
  const queryPaneRef = useRef(null);
  const [isDragging, setDragging] = useState(false);
  const [height, setHeight] = useState(
    queryManagerPreferences?.queryPanelHeight > 95 ? 30 : queryManagerPreferences.queryPanelHeight ?? queryPanelHeight
  );
  const [isTopOfQueryPanel, setTopOfQueryPanel] = useState(false);

  useEffect(() => {
    // using useRef for isExpanded to avoid, useEffect running in the initial rendering
    if (isComponentMounted.current) {
      localStorage.setItem(
        'queryManagerPreferences',
        JSON.stringify({ ...queryManagerPreferences, isExpanded: !isExpanded })
      );
      setExpanded(!isExpanded);
    } else {
      isComponentMounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  const onMouseUp = () => {
    setDragging(false);
  };

  const onMouseDown = () => {
    isTopOfQueryPanel && setDragging(true);
  };

  const onMouseMove = (e) => {
    if (queryPaneRef.current) {
      const componentTop = Math.round(queryPaneRef.current.getBoundingClientRect().top);
      const clientY = e.clientY;

      if ((clientY >= componentTop) & (clientY <= componentTop + 5)) {
        setTopOfQueryPanel(true);
      } else if (isTopOfQueryPanel) {
        setTopOfQueryPanel(false);
      }

      if (isDragging) {
        let height = (clientY / window.innerHeight) * 100,
          maxLimitReached = false;

        if (height > 95) {
          height = 30;
          maxLimitReached = true;
        }
        if (height < 4.5) height = 4.5;
        localStorage.setItem(
          'queryManagerPreferences',
          JSON.stringify({ ...queryManagerPreferences, queryPanelHeight: height, isExpanded: !maxLimitReached })
        );
        setExpanded(!maxLimitReached);
        setHeight(height);
      }
    }
  };

  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);

  return (
    <div
      ref={queryPaneRef}
      onMouseDown={onMouseDown}
      className="query-pane"
      style={{
        height: `calc(100% - ${isExpanded ? height : 100}%)`,
        cursor: isDragging || isTopOfQueryPanel ? 'row-resize' : 'default',
      }}
    >
      {children}
    </div>
  );
};

export { QueryPanel };
