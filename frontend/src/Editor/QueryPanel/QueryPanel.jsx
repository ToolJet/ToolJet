import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';
import useWindowResize from '@/_hooks/useWindowResize';
import { useQueryPanelActions, useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useDataQueriesStore, useDataQueries } from '@/_stores/dataQueriesStore';
import Maximize from '@/_ui/Icon/solidIcons/Maximize';
import { cloneDeep, isEmpty, isEqual } from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';

const QueryPanel = ({
  dataQueriesChanged,
  fetchDataQueries,
  darkMode,
  allComponents,
  appId,
  appDefinition,
  editorRef,
  canvasContainerRef,
}) => {
  console.log('here--- QueryPanel rendered');
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

  const height =
    queryManagerPreferences.current?.queryPanelHeight > 95
      ? 50
      : queryManagerPreferences.current?.queryPanelHeight ?? 70;

  const queryPaneRef = useRef(null);
  const [isExpanded, setExpanded] = useState(queryManagerPreferences.current?.isExpanded ?? true);
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
    updateHeightOnStoreAndCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.height, isExpanded, isWindowResizing]);

  const updateHeightOnStoreAndCanvas = () => {
    if (isExpanded) {
      canvasContainerRef.current.style.height = `calc(${100}% - ${Math.max(
        queryPaneRef?.current?.offsetHeight + 45,
        85
      )}px)`;
      updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    } else {
      canvasContainerRef.current.style.height = `calc(${100}% - 85px)`;
      updateQueryPanelHeight(1);
    }
  };

  const toggleQueryEditor = useCallback(() => {
    queryManagerPreferences.current = { ...queryManagerPreferences.current, isExpanded: !isExpanded };
    localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
    setExpanded(!isExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, queryManagerPreferences.current]);

  const updateDataQueries = useCallback(() => {
    dataQueriesChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initResize = () => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
  };

  const handleResize = (e) => {
    let heightInPercentage = (e.clientY / window.innerHeight) * 100;
    let maxLimitReached = false;

    if (heightInPercentage > 95) {
      heightInPercentage = 30;
      maxLimitReached = true;
    }
    if (heightInPercentage < 4.5) heightInPercentage = 4.5;

    queryPaneRef.current.style.height = `calc(100% - ${!maxLimitReached ? heightInPercentage : 100}%)`;
    queryManagerPreferences.current = {
      ...queryManagerPreferences.current,
      queryPanelHeight: heightInPercentage,
      isExpanded: !maxLimitReached,
    };
    setExpanded(!maxLimitReached);
    e.stopPropagation();
  };

  const stopResize = () => {
    updateHeightOnStoreAndCanvas();
    localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('mouseup', stopResize);
  };

  return (
    <div className={cx({ 'dark-theme query-panel-wrapper theme-dark': darkMode })}>
      <div
        className="query-pane"
        style={{
          height: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{ width: '288px', padding: '5px 12px' }}
          className="d-flex justify-content- border-end align-items-center"
          role="button"
          onClick={toggleQueryEditor}
        >
          <ButtonSolid
            variant="ghostBlack"
            size="sm"
            className="gap-0 p-2 me-2"
            data-tooltip-id="tooltip-for-query-panel-footer-btn"
            data-tooltip-content="Show query panel"
          >
            <Maximize stroke="var(--slate9)" style={{ height: '14px', width: '14px' }} viewBox={null} />
          </ButtonSolid>
          <h5 className="mb-0 font-weight-500 cursor-pointer" onClick={toggleQueryEditor}>
            Query Manager
          </h5>
        </div>
      </div>
      {isExpanded ? (
        <div
          ref={queryPaneRef}
          className="query-pane"
          id="query-manager"
          style={{
            height: `calc(100% - ${isExpanded ? height : 100}%)`,
          }}
        >
          <div id="query-panel-drag-handle" onMouseDown={initResize}></div>
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
                    allComponents={allComponents}
                    appDefinition={appDefinition}
                    editorRef={editorRef}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Tooltip id="tooltip-for-query-panel-footer-btn" className="tooltip" />
    </div>
  );
};

export default QueryPanel;
