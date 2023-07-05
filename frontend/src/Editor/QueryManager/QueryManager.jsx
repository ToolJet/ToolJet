import React, { useEffect, useState, useRef } from 'react';
import cx from 'classnames';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import { QueryManagerBody } from './Components/QueryManagerBody';
import { runQuery } from '@/_helpers/appUtils';
import { defaultSources } from './constants';

import { useQueryCreationLoading, useQueryUpdationLoading } from '@/_stores/dataQueriesStore';
import { useDataSources, useGlobalDataSources, useLoadingDataSources } from '@/_stores/dataSourcesStore';
import {
  useQueryToBeRun,
  usePreviewLoading,
  usePreviewData,
  useSelectedQuery,
  useQueryPanelActions,
} from '@/_stores/queryPanelStore';

const QueryManager = ({
  addNewQueryAndDeselectSelectedQuery,
  toggleQueryEditor,
  mode,
  dataQueriesChanged,
  appId,
  darkMode,
  apps,
  allComponents,
  dataSourceModalHandler,
  appDefinition,
  editorRef,
  createDraftQuery,
  updateDraftQueryName,
}) => {
  const loadingDataSources = useLoadingDataSources();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const queryToBeRun = useQueryToBeRun();
  const isCreationInProcess = useQueryCreationLoading();
  const isUpdationInProcess = useQueryUpdationLoading();
  const previewLoading = usePreviewLoading();
  const queryPreviewData = usePreviewData();
  const selectedQuery = useSelectedQuery();
  const { setSelectedDataSource, setQueryToBeRun } = useQueryPanelActions();

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
      if (selectedQuery?.kind in defaultSources && !selectedQuery?.data_source_id) {
        return setSelectedDataSource(defaultSources[selectedQuery?.kind]);
      }
      mode === 'edit' &&
        setSelectedDataSource(
          [...dataSources, ...globalDataSources].find(
            (datasource) => datasource.id === selectedQuery?.data_source_id
          ) || null
        );
    } else if (selectedQuery === null) setSelectedDataSource(null);
  }, [selectedQuery, dataSources, globalDataSources, setSelectedDataSource, mode]);

  return (
    <div
      className={cx(`query-manager ${darkMode ? 'theme-dark' : ''}`, {
        'd-none': loadingDataSources,
      })}
    >
      <QueryManagerHeader
        darkMode={darkMode}
        mode={mode}
        addNewQueryAndDeselectSelectedQuery={addNewQueryAndDeselectSelectedQuery}
        updateDraftQueryName={updateDraftQueryName}
        toggleQueryEditor={toggleQueryEditor}
        previewLoading={previewLoading}
        options={options}
        appId={appId}
        ref={previewPanelRef}
        editorRef={editorRef}
      />
      <QueryManagerBody
        darkMode={darkMode}
        mode={mode}
        dataSourceModalHandler={dataSourceModalHandler}
        options={options}
        previewLoading={previewLoading}
        queryPreviewData={queryPreviewData}
        allComponents={allComponents}
        apps={apps}
        appDefinition={appDefinition}
        createDraftQuery={createDraftQuery}
        setOptions={setOptions}
        ref={previewPanelRef}
      />
    </div>
  );
};

export default QueryManager;
