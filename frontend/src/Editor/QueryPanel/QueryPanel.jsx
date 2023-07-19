import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import { Confirm } from '../Viewer/Confirm';
import QueryManager from '../QueryManager/QueryManager';

import useWindowResize from '@/_hooks/useWindowResize';
import { useQueryPanelActions, useUnsavedChanges, useSelectedQuery } from '@/_stores/queryPanelStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';

const QueryPanel = ({
  dataQueriesChanged,
  fetchDataQueries,
  darkMode,
  apps,
  allComponents,
  appId,
  appDefinition,
  dataSourceModalHandler,
  editorRef,
  onQueryPaneDragging,
  handleQueryPaneExpanding,
}) => {
  const { setSelectedQuery, updateQueryPanelHeight, setUnSavedChanges, setSelectedDataSource } = useQueryPanelActions();
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
  const [queryCancelData, setCancelData] = useState({});
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  useEffect(() => {
    setEditingQuery(dataQueries.length > 0);
  }, [dataQueries.length]);

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

  const createDraftQuery = useCallback((queryDetails, source) => {
    setSelectedQuery(queryDetails.id, queryDetails);
    setDraftQuery(queryDetails);
    setSelectedDataSource(source);
    setEditingQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const stateToBeUpdated = {
      selectedDataSource: null,
      selectedQuery: null,
      editingQuery: false,
      isSourceSelected: false,
      draftQuery: null,
    };

    if (isUnsavedQueriesAvailable) {
      setSaveConfirmation(true);
      setCancelData(stateToBeUpdated);
    } else {
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
      <Confirm
        show={showSaveConfirmation}
        message={`Query ${selectedQuery?.name} has unsaved changes. Are you sure you want to discard changes ?`}
        onConfirm={() => {
          setSaveConfirmation(false);
          setDraftQuery(null);
          setSelectedQuery(queryCancelData?.selectedQuery?.id ?? null);
          setSelectedDataSource(queryCancelData?.selectedDataSource ?? null);
          setUnSavedChanges(false);
          if (queryCancelData.hasOwnProperty('editingQuery')) {
            setEditingQuery(queryCancelData.editingQuery);
          }
        }}
        onCancel={() => {
          setSaveConfirmation(false);
        }}
        confirmButtonText="Discard changes"
        cancelButtonText="Continue editing"
        callCancelFnOnConfirm={false}
        darkMode={darkMode}
      />
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
        <h5 className="mb-0 font-weight-500 cursor-pointer" onClick={toggleQueryEditor}>
          QUERIES
        </h5>
        <span
          onClick={toggleQueryEditor}
          className="cursor-pointer m-1  d-flex"
          data-tooltip-id="tooltip-for-show-query-editor"
          data-tooltip-content="Show query editor"
        >
          {isExpanded ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.00013 6.18288C7.94457 6.18288 7.88624 6.17177 7.82513 6.14954C7.76402 6.12732 7.70569 6.08843 7.65013 6.03288L5.3668 3.74954C5.2668 3.64954 5.2168 3.52732 5.2168 3.38288C5.2168 3.23843 5.2668 3.11621 5.3668 3.01621C5.4668 2.91621 5.58346 2.86621 5.7168 2.86621C5.85013 2.86621 5.9668 2.91621 6.0668 3.01621L8.00013 4.94954L9.93346 3.01621C10.0335 2.91621 10.1529 2.86621 10.2918 2.86621C10.4307 2.86621 10.5501 2.91621 10.6501 3.01621C10.7501 3.11621 10.8001 3.23566 10.8001 3.37454C10.8001 3.51343 10.7501 3.63288 10.6501 3.73288L8.35013 6.03288C8.29457 6.08843 8.23902 6.12732 8.18346 6.14954C8.12791 6.17177 8.0668 6.18288 8.00013 6.18288ZM5.3668 12.9662C5.2668 12.8662 5.2168 12.7468 5.2168 12.6079C5.2168 12.469 5.2668 12.3495 5.3668 12.2495L7.65013 9.96621C7.70569 9.91065 7.76402 9.87177 7.82513 9.84954C7.88624 9.82732 7.94457 9.81621 8.00013 9.81621C8.0668 9.81621 8.12791 9.82732 8.18346 9.84954C8.23902 9.87177 8.29457 9.91065 8.35013 9.96621L10.6501 12.2662C10.7501 12.3662 10.8001 12.4829 10.8001 12.6162C10.8001 12.7495 10.7501 12.8662 10.6501 12.9662C10.5501 13.0662 10.4279 13.1162 10.2835 13.1162C10.139 13.1162 10.0168 13.0662 9.9168 12.9662L8.00013 11.0495L6.08346 12.9662C5.98346 13.0662 5.86402 13.1162 5.72513 13.1162C5.58624 13.1162 5.4668 13.0662 5.3668 12.9662Z"
                fill="#121212"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.3668 5.43327C5.2668 5.33327 5.2168 5.21105 5.2168 5.0666C5.2168 4.92216 5.2668 4.79994 5.3668 4.69994L7.65013 2.4166C7.70569 2.36105 7.76124 2.32216 7.8168 2.29993C7.87235 2.27771 7.93346 2.2666 8.00013 2.2666C8.05569 2.2666 8.11402 2.27771 8.17513 2.29993C8.23624 2.32216 8.29457 2.36105 8.35013 2.4166L10.6335 4.69994C10.7335 4.79994 10.7835 4.92216 10.7835 5.0666C10.7835 5.21105 10.7335 5.33327 10.6335 5.43327C10.5335 5.53327 10.4112 5.58327 10.2668 5.58327C10.1224 5.58327 10.0001 5.53327 9.90013 5.43327L8.00013 3.53327L6.10013 5.43327C6.00013 5.53327 5.87791 5.58327 5.73346 5.58327C5.58902 5.58327 5.4668 5.53327 5.3668 5.43327V5.43327ZM8.00013 13.7999C7.94457 13.7999 7.88624 13.7888 7.82513 13.7666C7.76402 13.7444 7.70569 13.7055 7.65013 13.6499L5.3668 11.3666C5.2668 11.2666 5.2168 11.1444 5.2168 10.9999C5.2168 10.8555 5.2668 10.7333 5.3668 10.6333C5.4668 10.5333 5.58902 10.4833 5.73346 10.4833C5.87791 10.4833 6.00013 10.5333 6.10013 10.6333L8.00013 12.5333L9.90013 10.6333C10.0001 10.5333 10.1224 10.4833 10.2668 10.4833C10.4112 10.4833 10.5335 10.5333 10.6335 10.6333C10.7335 10.7333 10.7835 10.8555 10.7835 10.9999C10.7835 11.1444 10.7335 11.2666 10.6335 11.3666L8.35013 13.6499C8.29457 13.7055 8.23902 13.7444 8.18346 13.7666C8.12791 13.7888 8.0668 13.7999 8.00013 13.7999V13.7999Z"
                fill="#576574"
              />
            </svg>
          )}
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
        <div className="row main-row">
          <QueryDataPane
            showSaveConfirmation={showSaveConfirmation}
            setSaveConfirmation={setSaveConfirmation}
            setCancelData={setCancelData}
            draftQuery={draftQuery}
            handleAddNewQuery={handleAddNewQuery}
            setDraftQuery={setDraftQuery}
            fetchDataQueries={fetchDataQueries}
            darkMode={darkMode}
            editorRef={editorRef}
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
                  darkMode={darkMode}
                  apps={apps}
                  allComponents={allComponents}
                  dataSourceModalHandler={dataSourceModalHandler}
                  appDefinition={appDefinition}
                  editorRef={editorRef}
                  createDraftQuery={createDraftQuery}
                  isUnsavedQueriesAvailable={isUnsavedQueriesAvailable}
                  updateDraftQueryName={updateDraftQueryName}
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
