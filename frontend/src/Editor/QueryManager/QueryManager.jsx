import React, { useEffect, useState, useRef } from 'react';
import cx from 'classnames';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import { QueryManagerBody } from './Components/QueryManagerBody';
import { runQuery } from '@/_helpers/appUtils';
import { defaultSources } from './constants';

import { useQueryCreationLoading, useQueryUpdationLoading } from '@/_stores/dataQueriesStore';
import { useDataSources, useGlobalDataSources, useLoadingDataSources } from '@/_stores/dataSourcesStore';
import { useQueryToBeRun, useSelectedQuery, useQueryPanelActions } from '@/_stores/queryPanelStore';

const QueryManager = ({
  addNewQueryAndDeselectSelectedQuery,
  mode,
  dataQueriesChanged,
  appId,
  editingVersionId,
  currentState,
  darkMode,
  apps,
  allComponents,
  appDefinition,
  editorRef,
  isVersionReleased,
}) => {
  const loadingDataSources = useLoadingDataSources();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const queryToBeRun = useQueryToBeRun();
  const isCreationInProcess = useQueryCreationLoading();
  const isUpdationInProcess = useQueryUpdationLoading();
  const selectedQuery = useSelectedQuery();
  const { setSelectedDataSource, setQueryToBeRun } = useQueryPanelActions();
  const [newQueryName, setNewQueryName] = useState('');

  const [options, setOptions] = useState({});
  const mounted = useRef(false);
  const previewPanelRef = useRef(null);

  useEffect(() => {
    if (mounted.current && !isCreationInProcess && !isUpdationInProcess) {
      return dataQueriesChanged();
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreationInProcess, isUpdationInProcess, mounted.current]);

  useEffect(() => {
    setOptions(selectedQuery?.options || {});
  }, [selectedQuery?.options]);

  useEffect(() => {
    if (queryToBeRun !== null) {
      runQuery(editorRef, queryToBeRun.id, queryToBeRun.name);
      setQueryToBeRun(null);
    }
  }, [editorRef, queryToBeRun]);

  useEffect(() => {
    if (selectedQuery) {
      if (defaultSources?.[selectedQuery?.kind]) {
        return setSelectedDataSource(defaultSources[selectedQuery?.kind]);
      }
      setSelectedDataSource(
        [...dataSources, ...globalDataSources].find((datasource) => datasource.id === selectedQuery?.data_source_id) ||
          null
      );
    } else if (selectedQuery === null) {
      setSelectedDataSource(null);
    }
  }, [selectedQuery, dataSources, globalDataSources, setSelectedDataSource, mode]);

  return (
    <div
      className={cx(`query-manager ${darkMode ? 'theme-dark' : ''}`, {
        'd-none': loadingDataSources,
      })}
    >
      <QueryManagerHeader
        darkMode={darkMode}
        addNewQueryAndDeselectSelectedQuery={addNewQueryAndDeselectSelectedQuery}
        currentState={currentState}
        options={options}
        ref={previewPanelRef}
        editorRef={editorRef}
        isVersionReleased={isVersionReleased}
        onNameChange={setNewQueryName}
      />
      <QueryManagerBody
        darkMode={darkMode}
        options={options}
        currentState={currentState}
        allComponents={allComponents}
        apps={apps}
        appId={appId}
        editingVersionId={editingVersionId}
        appDefinition={appDefinition}
        setOptions={setOptions}
        ref={previewPanelRef}
        isVersionReleased={isVersionReleased}
        newQueryName={newQueryName}
      />
    </div>
  );
};

export default QueryManager;
