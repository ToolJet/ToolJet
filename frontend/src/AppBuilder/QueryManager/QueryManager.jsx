import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import QueryManagerBody from './Components/QueryManagerBody';
import { CodeHinterContext } from '@/AppBuilder/CodeBuilder/CodeHinterContext';
import { resolveReferences } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

// name -> resolved default, for a list of { name, defaultValue } (parameters, or a library query's inputs).
const resolveDefaults = (list) =>
  list?.reduce((acc, { name, defaultValue }) => ({ ...acc, [name]: resolveReferences(defaultValue, undefined) }), {});

const QueryManager = ({ mode, darkMode }) => {
  const { moduleId } = useModuleContext();
  const isQueryLibrary = useStore((state) => state.getAppType(moduleId) === 'query_library');
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
    const resolved = resolveDataSourceForQuery(selectedQuery);
    setSelectedDataSource(resolved);
    // selectedQuery + selectedDataSource are kept in sync atomically inside setSelectedQuery,
    // so query switches don't need handling here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources, globalDataSources, sampleDataSource]);

  // Library templates also read `{{input.x}}`. Empty groups are left out so autocomplete shows no bare `parameters` / `input`.
  const codeHinterContext = Object.fromEntries(
    Object.entries({
      parameters: resolveDefaults(selectedQuery?.options?.parameters),
      ...(isQueryLibrary && { input: resolveDefaults(selectedQuery?.options?.inputs) }),
    }).filter(([, value]) => !isEmpty(value))
  );

  return (
    <div
      className={cx(`query-manager ${darkMode ? 'theme-dark' : ''}`, {
        'd-none': loadingDataSources,
      })}
    >
      <QueryManagerHeader darkMode={darkMode} setActiveTab={setActiveTab} activeTab={activeTab} />
      <CodeHinterContext.Provider value={codeHinterContext}>
        <QueryManagerBody darkMode={darkMode} activeTab={activeTab} />
      </CodeHinterContext.Provider>
    </div>
  );
};

export default QueryManager;
