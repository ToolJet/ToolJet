import React, { useState, useRef, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';

const QueryPanel = ({ queryPanelHeight, children }) => {
  const queryPaneRef = useRef(null);
  const [isDragging, setDragging] = useState(false);
  const [height, setHeight] = useState(queryPanelHeight);
  const [isTopOfQueryPanel, setTopOfQueryPanel] = useState(false);

  useEffect(() => {
    setHeight(queryPanelHeight);
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
        let height = (clientY / window.innerHeight) * 100;

        if (height > 95) height = 100;
        if (height < 4.5) height = 4.5;

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
        height: `calc(100% - ${height}%)`,
        cursor: isDragging || isTopOfQueryPanel ? 'row-resize' : 'default',
      }}
    >
      {children}
    </div>
  );
};

export { QueryPanel };
