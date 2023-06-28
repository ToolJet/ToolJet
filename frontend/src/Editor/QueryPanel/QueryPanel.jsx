import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';

import useWindowResize from '@/_hooks/useWindowResize';
import { useQueryPanelActions, useUnsavedChanges, useSelectedQuery } from '@/_stores/queryPanelStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import Maximize from '../../_ui/Icon/solidIcons/Maximize';

const QueryPanel = ({
  dataQueriesChanged,
  fetchDataQueries,
  darkMode,
  currentState,
  apps,
  allComponents,
  appId,
  editingVersionId,
  appDefinition,
  dataSourceModalHandler,
  editorRef,
  onQueryPaneDragging,
  isVersionReleased,
  handleQueryPaneExpanding,
}) => {
  const { setSelectedQuery, updateQueryPanelHeight, setSelectedDataSource } = useQueryPanelActions();
  const isUnsavedQueriesAvailable = useUnsavedChanges();
  const selectedQuery = useSelectedQuery();
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
  const [showSaveConfirmation, setSaveConfirmation] = useState(false);
  const [draftQuery, setDraftQuery] = useState(null);
  const [editingQuery, setEditingQuery] = useState(dataQueries.length > 0);
  const [windowSize, isWindowResizing] = useWindowResize();

  useEffect(() => {
    if (!editingQuery && selectedQuery !== null && selectedQuery?.id !== 'draftQuery') {
      setEditingQuery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuery?.id, editingQuery]);

  useEffect(() => {
    handleQueryPaneExpanding(isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    setEditingQuery(dataQueries.length > 0);
  }, [dataQueries.length]);

  useEffect(() => {
    onQueryPaneDragging(isDragging);
  }, [isDragging]);

  useEffect(() => {
    updateQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    if (isWindowResizing) {
      onQueryPaneDragging(true);
    } else {
      onQueryPaneDragging(false);
    }
  }, [windowSize.height, isExpanded, isWindowResizing]);

  const createDraftQuery = useCallback((queryDetails, source) => {
    setSelectedQuery(queryDetails.id, queryDetails);
    setDraftQuery(queryDetails);
    setSelectedDataSource(source);
    setEditingQuery(false);
  }, []);

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

  const handleAddNewQuery = useCallback(() => {
    if (!isUnsavedQueriesAvailable) {
      setSelectedDataSource(null);
      setSelectedQuery(null);
      setDraftQuery(null);
      setEditingQuery(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnsavedQueriesAvailable]);

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
    setEditingQuery(true);
    setDraftQuery(null);
    dataQueriesChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraftQueryName = useCallback(
    (newName) => {
      setDraftQuery((query) => ({ ...query, name: newName }));
      setSelectedQuery(draftQuery.id, { ...draftQuery, name: newName });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftQuery]
  );

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
          className="d-flex justify-content-between border-end align-items-center"
        >
          <h5 className="mb-0 font-weight-500 cursor-pointer" onClick={toggleQueryEditor}>
            QUERIES
          </h5>
          <button
            onClick={toggleQueryEditor}
            className={`cursor-pointer m-1  d-flex bg-transparent border-0 ${darkMode ? 'theme-dark' : ''}`}
            data-tooltip-id="tooltip-for-show-query-editor"
            data-tooltip-content="Show query editor"
          >
            <Maximize height="15" width="15" viewBox="0 0 25 6" stroke="var(--slate12)" /> Expand
          </button>
        </div>
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
        <div className="row main-row">
          <QueryDataPane
            showSaveConfirmation={showSaveConfirmation}
            setSaveConfirmation={setSaveConfirmation}
            draftQuery={draftQuery}
            handleAddNewQuery={handleAddNewQuery}
            setDraftQuery={setDraftQuery}
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
                  addNewQueryAndDeselectSelectedQuery={handleAddNewQuery}
                  toggleQueryEditor={toggleQueryEditor}
                  dataQueries={dataQueries}
                  mode={editingQuery ? 'edit' : 'create'}
                  dataQueriesChanged={updateDataQueries}
                  appId={appId}
                  editingVersionId={editingVersionId}
                  currentState={currentState}
                  darkMode={darkMode}
                  apps={apps}
                  allComponents={allComponents}
                  dataSourceModalHandler={dataSourceModalHandler}
                  appDefinition={appDefinition}
                  editorRef={editorRef}
                  createDraftQuery={createDraftQuery}
                  isUnsavedQueriesAvailable={isUnsavedQueriesAvailable}
                  updateDraftQueryName={updateDraftQueryName}
                  isVersionReleased={isVersionReleased}
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
