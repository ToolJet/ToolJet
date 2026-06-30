import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import QueryManagerBody from './Components/QueryManagerBody';
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
  const resolveDataSourceForQuery = useStore((state) => state.queryPanel.resolveDataSourceForQuery);
  const setQueryToBeRun = useStore((state) => state.queryPanel.setQueryToBeRun);

  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (
      selectedQuery?.kind == 'runjs' ||
      selectedQuery?.kind == 'runpy' ||
      selectedQuery?.kind == 'restapi' ||
      selectedQuery?.kind == 'postgresql'
    ) {
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

  // This effect only re-resolves the datasource when the datasource lists change.
  useEffect(() => {
    setSelectedDataSource(resolveDataSourceForQuery(selectedQuery));
    // selectedQuery + selectedDataSource are kept in sync atomically inside setSelectedQuery,
    // so query switches don't need handling here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources, globalDataSources, sampleDataSource]);

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
