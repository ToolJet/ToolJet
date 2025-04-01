import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import QueryManagerBody from './Components/QueryManagerBody';
import { defaultSources } from './constants';
import { CodeHinterContext } from '@/AppBuilder/CodeBuilder/CodeHinterContext';
import { resolveReferences } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';

const QueryManager = ({ mode, darkMode }) => {
  // TODO to be moved into queryPanelStore and reimplemented
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const loadingDataSources = useStore((state) => state.loadingDataSources);
  const dataSources = useStore((state) => state.dataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const queryToBeRun = useStore((state) => state.queryPanel.queryToBeRun);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const setSelectedDataSource = useStore((state) => state.queryPanel.setSelectedDataSource);
  const setQueryToBeRun = useStore((state) => state.queryPanel.setQueryToBeRun);

  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (selectedQuery?.kind == 'runjs' || selectedQuery?.kind == 'runpy' || selectedQuery?.kind == 'restapi') {
      setActiveTab(1);
    }
  }, [selectedQuery?.id]);

  useEffect(() => {
    if (queryToBeRun !== null) {
      runQuery(queryToBeRun.id, queryToBeRun.name);
      setQueryToBeRun(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryToBeRun]);

  useEffect(() => {
    if (selectedQuery) {
      const selectedDS = [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource]
        .filter(Boolean)
        .find((datasource) => datasource.id === selectedQuery?.data_source_id);
      //TODO: currently type is not taken into account. May create issues in importing REST apis. to be revamped when import app is revamped
      if (
        selectedQuery?.kind in defaultSources &&
        (!selectedQuery?.data_source_id || ['runjs', 'runpy'].includes(selectedQuery?.data_source_id) || !selectedDS)
      ) {
        return setSelectedDataSource(defaultSources[selectedQuery?.kind]);
      }
      setSelectedDataSource(selectedDS || null);
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
      <QueryManagerHeader darkMode={darkMode} setActiveTab={setActiveTab} activeTab={activeTab} />
      <CodeHinterContext.Provider
        value={{
          parameters: selectedQuery?.options?.parameters?.reduce(
            (parameters, parameter) => ({
              ...parameters,
              [parameter.name]: resolveReferences(parameter.defaultValue, undefined),
            }),
            {}
          ),
        }}
      >
        <QueryManagerBody darkMode={darkMode} activeTab={activeTab} />
      </CodeHinterContext.Provider>
    </div>
  );
};

export default QueryManager;
