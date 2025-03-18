import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';
import useWindowResize from '@/_hooks/useWindowResize';
import { isEmpty, isEqual } from 'lodash';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import SectionCollapse from '@/_ui/Icon/solidIcons/SectionCollapse';
import SectionExpand from '@/_ui/Icon/solidIcons/SectionExpand';
import { shallow } from 'zustand/shallow';

const MemoizedQueryDataPane = memo(QueryDataPane);
const MemoizedQueryManager = memo(QueryManager);

export const QueryPanel = ({ darkMode }) => {
  const setQueryPanelHeight = useStore((state) => state.queryPanel.setQueryPanelHeight);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane, shallow);
  const setIsDraggingQueryPane = useStore((state) => state.queryPanel.setIsDraggingQueryPane, shallow);

  const queryManagerPreferences = useRef(
    JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {
      isExpanded: true,
      queryPanelHeight: 100,
    }
  );
  const queryPaneRef = useRef(null);
  const [isExpanded, setExpanded] = useState(queryManagerPreferences.current?.isExpanded ?? true);
  const [height, setHeight] = useState(
    queryManagerPreferences.current?.queryPanelHeight >= 95
      ? 50
      : queryManagerPreferences.current?.queryPanelHeight ?? 70
  );
  const [isTopOfQueryPanel, setTopOfQueryPanel] = useState(false);
  const [windowSize, isWindowResizing] = useWindowResize();

  useEffect(() => {
    const queryPanelStoreListner = useStore.subscribe(({ queryPanel: { selectedQuery } }, prevState) => {
      if (isEmpty(prevState?.queryPanel?.selectedQuery) || isEmpty(selectedQuery)) {
        return;
      }

      if (prevState?.queryPanel?.selectedQuery?.id !== selectedQuery.id) {
        return;
      }

      //removing updated_at since this value changes whenever the data is updated in the BE
      const formattedQuery = deepClone(selectedQuery);
      delete formattedQuery.updated_at;

      const formattedPrevQuery = deepClone(prevState?.queryPanel?.selectedQuery || {});
      delete formattedPrevQuery.updated_at;

      if (!isEqual(formattedQuery, formattedPrevQuery)) {
        useStore.getState().dataQuery.saveData(selectedQuery);
      }
    });

    return queryPanelStoreListner;
  }, []);

  // useEffect(() => {
  //   onQueryPaneDragging(isDragging);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isDragging]);

  useEffect(() => {
    setQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    // if (isWindowResizing) {
    //   onQueryPaneDragging(true);
    // } else {
    //   onQueryPaneDragging(false);
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.height, isExpanded, isWindowResizing]);

  const onMouseDown = useCallback(
    (e) => {
      if (isTopOfQueryPanel) {
        e.preventDefault();
        setIsDraggingQueryPane(true);
      }
    },
    [isTopOfQueryPanel]
  );

  const onMouseUp = useCallback((e) => {
    setIsDraggingQueryPane(false);
    setQueryPanelHeight(queryPaneRef?.current?.offsetHeight);

    const clientY = e.clientY;
    const newHeight = Math.min(Math.max((clientY / window.innerHeight) * 100, 4.5), 94);
    queryManagerPreferences.current = {
      ...queryManagerPreferences.current,
      queryPanelHeight: newHeight,
      isExpanded: newHeight <= 94,
    };

    localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
  }, []);

  const onMouseMove = useCallback(
    (e) => {
      if (queryPaneRef.current) {
        const componentTop = Math.round(queryPaneRef.current.getBoundingClientRect().top);
        const clientY = e.clientY;

        const withinDraggableArea = clientY >= componentTop && clientY <= componentTop + 5;
        if (withinDraggableArea !== isTopOfQueryPanel) {
          setTopOfQueryPanel(withinDraggableArea);
        }

        if (isDraggingQueryPane) {
          const newHeight = Math.min(Math.max((clientY / window.innerHeight) * 100, 4.5), 94);
          setExpanded(newHeight <= 94);
          setHeight(newHeight);
        }
      }
    },
    [isDraggingQueryPane, isTopOfQueryPanel] // Dependencies
  );

  useEventListener('mousemove', onMouseMove);

  useEventListener(
    'mouseup',
    (event) => {
      if (isDraggingQueryPane) {
        onMouseUp(event);
      }
    },
    document
  );

  const toggleQueryEditor = useCallback(() => {
    const newIsExpanded = !isExpanded;
    setExpanded(newIsExpanded);
    localStorage.setItem(
      'queryManagerPreferences',
      JSON.stringify({ isExpanded: newIsExpanded, queryPanelHeight: newIsExpanded ? height : 95 })
    );
    setQueryPanelHeight(newIsExpanded ? height : 95);
  }, [height, isExpanded, setQueryPanelHeight]);

  return (
    <div className={cx({ 'dark-theme theme-dark': darkMode })}>
      <div
        className={`query-pane ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          height: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <div
          style={{ width: '288px', paddingLeft: '12px', height: '100%' }}
          className="d-flex justify-content align-items-center"
        >
          <div
            style={{
              height: '100%',
              paddingTop: isExpanded ? '2px' : '4px',
              borderTop: isExpanded && '2px solid #4368E3',
              width: '77px',
            }}
          >
            <button
              className="d-flex items-center justify-start mb-0 font-weight-500 text-dark select-none query-manager-toggle-button gap-1"
              onClick={toggleQueryEditor}
            >
              <span>{isExpanded ? <SectionCollapse width="13.33" /> : <SectionExpand width="13.33" />}</span>
              <span>Queries</span>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={queryPaneRef}
        onMouseDown={onMouseDown}
        className="query-pane"
        id="query-manager"
        style={{
          height: `calc(100% - ${isExpanded ? height : 100}%)`,
          cursor: isDraggingQueryPane || isTopOfQueryPanel ? 'row-resize' : 'default',
          ...(!isExpanded && {
            border: 'none',
          }),
        }}
      >
        {isExpanded && (
          <div className="row main-row">
            <MemoizedQueryDataPane darkMode={darkMode} />
            <div className="query-definition-pane-wrapper">
              <div className="query-definition-pane">
                <MemoizedQueryManager darkMode={darkMode} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Tooltip id="tooltip-for-query-panel-footer-btn" className="tooltip" />
    </div>
  );
};
