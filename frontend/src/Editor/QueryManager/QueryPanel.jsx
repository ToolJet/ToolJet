import React, { useState, useRef, useCallback } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';

const QueryPanel = ({ children }) => {
  const queryManagerPreferences = useRef(JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {});
  const queryPaneRef = useRef(null);
  const [isExpanded, setExpanded] = useState(queryManagerPreferences.current?.isExpanded ?? true);
  const [isDragging, setDragging] = useState(false);
  const [height, setHeight] = useState(
    queryManagerPreferences.current?.queryPanelHeight > 95 ? 30 : queryManagerPreferences.current.queryPanelHeight ?? 70
  );
  const [isTopOfQueryPanel, setTopOfQueryPanel] = useState(false);
  // State to hold the value of create query button click
  // isClicked value will be mutated directly to avoid re-render
  const [createQueryButtonState] = useState({ isClicked: false });

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
        queryManagerPreferences.current = {
          ...queryManagerPreferences.current,
          queryPanelHeight: height,
          isExpanded: !maxLimitReached,
        };
        localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
        setExpanded(!maxLimitReached);
        setHeight(height);
      }
    }
  };

  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);

  const toggleQueryEditor = useCallback(() => {
    queryManagerPreferences.current = { ...queryManagerPreferences.current, isExpanded: !isExpanded };
    localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
    setExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <>
      <div
        className="query-pane"
        style={{
          height: 40,
          background: '#fff',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h5 className="mb-0">QUERIES</h5>
        <span onClick={toggleQueryEditor} className="cursor-pointer m-1" data-tip="Show query editor">
          <svg width="20" height="20" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.00013 4.18288C2.94457 4.18288 2.88624 4.17177 2.82513 4.14954C2.76402 4.12732 2.70569 4.08843 2.65013 4.03288L0.366797 1.74954C0.266797 1.64954 0.216797 1.52732 0.216797 1.38288C0.216797 1.23843 0.266797 1.11621 0.366797 1.01621C0.466797 0.916211 0.583464 0.866211 0.716797 0.866211C0.85013 0.866211 0.966797 0.916211 1.0668 1.01621L3.00013 2.94954L4.93346 1.01621C5.03346 0.916211 5.15291 0.866211 5.2918 0.866211C5.43069 0.866211 5.55013 0.916211 5.65013 1.01621C5.75013 1.11621 5.80013 1.23566 5.80013 1.37454C5.80013 1.51343 5.75013 1.63288 5.65013 1.73288L3.35013 4.03288C3.29457 4.08843 3.23902 4.12732 3.18346 4.14954C3.12791 4.17177 3.0668 4.18288 3.00013 4.18288ZM0.366797 10.9662C0.266797 10.8662 0.216797 10.7468 0.216797 10.6079C0.216797 10.469 0.266797 10.3495 0.366797 10.2495L2.65013 7.96621C2.70569 7.91065 2.76402 7.87177 2.82513 7.84954C2.88624 7.82732 2.94457 7.81621 3.00013 7.81621C3.0668 7.81621 3.12791 7.82732 3.18346 7.84954C3.23902 7.87177 3.29457 7.91065 3.35013 7.96621L5.65013 10.2662C5.75013 10.3662 5.80013 10.4829 5.80013 10.6162C5.80013 10.7495 5.75013 10.8662 5.65013 10.9662C5.55013 11.0662 5.42791 11.1162 5.28346 11.1162C5.13902 11.1162 5.0168 11.0662 4.9168 10.9662L3.00013 9.04954L1.08346 10.9662C0.983464 11.0662 0.864019 11.1162 0.72513 11.1162C0.586241 11.1162 0.466797 11.0662 0.366797 10.9662Z"
              fill="#576574"
            />
          </svg>
        </span>
      </div>
      <div
        ref={queryPaneRef}
        onMouseDown={onMouseDown}
        className="query-pane"
        style={{
          height: `calc(100% - ${isExpanded ? height : 100}%)`,
          cursor: isDragging || isTopOfQueryPanel ? 'row-resize' : 'default',
        }}
      >
        {children({
          toggleQueryEditor,
          createQueryButtonState,
        })}
      </div>
    </>
  );
};

export { QueryPanel };
