import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';
import useWindowResize from '@/_hooks/useWindowResize';
import { useQueryPanelActions, useQueryPanelStore, useQueryPanelExpansion } from '@/_stores/queryPanelStore';
import { useDataQueriesStore, useDataQueries } from '@/_stores/dataQueriesStore';
import { isEmpty, isEqual } from 'lodash';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

const QueryPanel = ({
  dataQueriesChanged,
  fetchDataQueries,
  darkMode,
  allComponents,
  appId,
  appDefinition,
  editorRef,
  onQueryPaneDragging,
  handleQueryPaneExpanding,
}) => {
  const { updateQueryPanelHeight } = useQueryPanelActions();
  const dataQueries = useDataQueries();
  const queryManagerPreferences = useRef(
    JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {
      current: {
        isExpanded: true,
        queryPanelHeight: 100,
      },
    }
  );
  const queryPaneRef = useRef(null);
  const [isExpanded, toggleQueryEditor, setQueryPanelExpansion] = useQueryPanelExpansion();
  const [isDragging, setDragging] = useState(false);
  const [height, setHeight] = useState(
    queryManagerPreferences.current?.queryPanelHeight > 95
      ? 50
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
      const formattedQuery = deepClone(selectedQuery);
      delete formattedQuery.updated_at;

      const formattedPrevQuery = deepClone(prevState?.selectedQuery || {});
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

  const onMouseMove = useCallback(
    (e) => {
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

          if (height > 94) {
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
          setQueryPanelExpansion(!maxLimitReached);
          setHeight(height);
          updateQueryPanelHeight(height);
        }
      }
    },
    [isDragging, isTopOfQueryPanel, setQueryPanelExpansion, updateQueryPanelHeight]
  );
  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);

  // const toggleQueryEditor = useCallback(() => {
  //   queryManagerPreferences.current = { ...queryManagerPreferences.current, isExpanded: !isExpanded };
  //   localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
  //   if (isExpanded) {
  //     updateQueryPanelHeight(95);
  //   } else {
  //     updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
  //   }
  //   setExpanded(!isExpanded);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isExpanded]);

  const updateDataQueries = useCallback(() => {
    dataQueriesChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleQueryEditor = useCallback(() => {
    toggleQueryEditor();
    if (!isExpanded) {
      updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    } else {
      updateQueryPanelHeight(95);
    }
  }, [isExpanded, toggleQueryEditor, updateQueryPanelHeight]);

  return (
    <div className={cx({ 'dark-theme theme-dark': darkMode })}>
      <div
        className={`query-pane ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          height: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <div style={{ width: '288px', padding: '5px 12px' }} className="d-flex justify-content align-items-center">
          <button
            className="mb-0 font-weight-500 text-dark select-none query-manager-toggle-button"
            onClick={handleToggleQueryEditor}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <div className="vr" />
          <button
            onClick={handleToggleQueryEditor}
            className="mb-0 font-weight-500 text-dark select-none query-manager-toggle-button"
          >
            Queries
          </button>
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
          ...(!isExpanded && {
            border: 'none',
          }),
        }}
      >
        <div className="row main-row">
          <QueryDataPane
            fetchDataQueries={fetchDataQueries}
            darkMode={darkMode}
            editorRef={editorRef}
            appId={appId}
            toggleQueryEditor={handleToggleQueryEditor}
          />
          <div className="query-definition-pane-wrapper">
            <div className="query-definition-pane">
              <QueryManager
                toggleQueryEditor={handleToggleQueryEditor}
                dataQueries={dataQueries}
                dataQueriesChanged={updateDataQueries}
                appId={appId}
                darkMode={darkMode}
                allComponents={allComponents}
                appDefinition={appDefinition}
                editorRef={editorRef}
              />
            </div>
          </div>
        </div>
      </div>
      <Tooltip id="tooltip-for-query-panel-footer-btn" className="tooltip" />
    </div>
  );
};

export default QueryPanel;
