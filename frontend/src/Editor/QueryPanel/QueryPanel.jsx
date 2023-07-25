import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';

import useWindowResize from '@/_hooks/useWindowResize';
import { useQueryPanelStore, useQueryPanelActions } from '@/_stores/queryPanelStore';
import { useDataQueriesStore, useDataQueries } from '@/_stores/dataQueriesStore';
import Maximize from '../../_ui/Icon/solidIcons/Maximize';
import { cloneDeep, isEmpty, isEqual } from 'lodash';
import { ButtonSolid } from '../../_ui/AppButton/AppButton';

const QueryPanel = ({
  dataQueriesChanged,
  fetchDataQueries,
  darkMode,
  apps,
  allComponents,
  appId,
  appDefinition,
  editorRef,
  onQueryPaneDragging,
  handleQueryPaneExpanding,
}) => {
  const { updateQueryPanelHeight } = useQueryPanelActions();
  const dataQueries = useDataQueries();
  const queryManagerPreferences = useRef(JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {});
  const queryPaneRef = useRef(null);
  const [isExpanded, setExpanded] = useState(queryManagerPreferences.current?.isExpanded ?? true);
  const [isDragging, setDragging] = useState(false);
  const [height, setHeight] = useState(
    queryManagerPreferences.current?.queryPanelHeight > 95
      ? 30
      : queryManagerPreferences.current?.queryPanelHeight ?? 70
  );
  const [isTopOfQueryPanel, setTopOfQueryPanel] = useState(false);
  const [windowSize, isWindowResizing] = useWindowResize();

  useEffect(() => {
    const queryPanelStoreListner = useQueryPanelStore.subscribe(({ selectedQuery }, prevState) => {
      if (isEmpty(prevState?.selectedQuery) || isEmpty(selectedQuery)) {
        return;
      }

      if (prevState?.selectedQuery?.id !== selectedQuery.id) {
        return;
      }

      //removing updated_at since this value changes whenever the data is updated in the BE
      const formattedQuery = cloneDeep(selectedQuery);
      delete formattedQuery.updated_at;

      const formattedPrevQuery = cloneDeep(prevState?.selectedQuery || {});
      delete formattedPrevQuery.updated_at;

      if (!isEqual(formattedQuery, formattedPrevQuery)) {
        useDataQueriesStore.getState().actions.saveData(selectedQuery);
      }
    });

    return queryPanelStoreListner;
  }, []);

  useEffect(() => {
    handleQueryPaneExpanding(isExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  useEffect(() => {
    onQueryPaneDragging(isDragging);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  useEffect(() => {
    updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    if (isWindowResizing) {
      onQueryPaneDragging(true);
    } else {
      onQueryPaneDragging(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.height, isExpanded, isWindowResizing]);

  const onMouseUp = () => {
    setDragging(false);

    /* Updated queryPanelHeight here instead of using a useEffect on height to avoid continuous rerendering during window dragging which causes screen to act sluggish */
    updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
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
    if (isExpanded) {
      updateQueryPanelHeight(95);
    } else {
      updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    }
    setExpanded(!isExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const updateDataQueries = useCallback(() => {
    dataQueriesChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className="query-pane"
        style={{
          height: 40,
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{ width: '288px', padding: '8px 12px 8px 16px' }}
          className="d-flex justify-content- border-end align-items-center"
        >
          <ButtonSolid variant="ghostBlack" size="sm" onClick={toggleQueryEditor} className="gap-0 p-2 me-2">
            <Maximize stroke="var(--slate9)" style={{ height: '14px', width: '14px' }} viewBox={null} />
          </ButtonSolid>
          <h5 className="mb-0 font-weight-500 cursor-pointer" onClick={toggleQueryEditor}>
            Query Manager
          </h5>
        </div>
      </div>
      <div
        ref={queryPaneRef}
        onMouseDown={onMouseDown}
        className="query-pane"
        id="query-manager"
        style={{
          height: `calc(100% - ${isExpanded ? height : 100}%)`,
          cursor: isDragging || isTopOfQueryPanel ? 'row-resize' : 'default',
        }}
      >
        <div className="row main-row">
          <QueryDataPane
            fetchDataQueries={fetchDataQueries}
            darkMode={darkMode}
            editorRef={editorRef}
            appId={appId}
            toggleQueryEditor={toggleQueryEditor}
          />
          <div className="query-definition-pane-wrapper">
            <div className="query-definition-pane">
              <div>
                <QueryManager
                  toggleQueryEditor={toggleQueryEditor}
                  dataQueries={dataQueries}
                  dataQueriesChanged={updateDataQueries}
                  appId={appId}
                  darkMode={darkMode}
                  apps={apps}
                  allComponents={allComponents}
                  appDefinition={appDefinition}
                  editorRef={editorRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Tooltip id="tooltip-for-show-query-editor" className="tooltip" />
    </>
  );
};

export default QueryPanel;
