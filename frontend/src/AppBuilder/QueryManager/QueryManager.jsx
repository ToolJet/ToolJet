import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import { shallow } from 'zustand/shallow';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import QueryManagerBody from './Components/QueryManagerBody';
import { CodeHinterContext } from '@/AppBuilder/CodeBuilder/CodeHinterContext';
import { resolveReferences } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { isQueryLibraryMode, withViewedLibraryVersion } from '@/AppBuilder/_stores/slices/queryLibrarySlice';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { getQueryManagerClassName } from '@/AppBuilder/panelLayout';
import { useCodeSearchReveal } from '@/AppBuilder/LeftSidebar/CodeSearch/useCodeSearchReveal';

// name -> resolved default, for a list of { name, defaultValue } (parameters, or a library query's inputs).
const resolveDefaults = (list) =>
  list?.reduce((acc, { name, defaultValue }) => ({ ...acc, [name]: resolveReferences(defaultValue, undefined) }), {});

// Code search's tab names → QueryManagerHeader's tab ids.
const QUERY_TAB_IDS = { setup: 1, transformation: 2, settings: 3 };

const QueryManager = ({ mode, darkMode, surface = 'bottom' }) => {
  const { moduleId } = useModuleContext();
  const isQueryLibrary = useStore((state) => isQueryLibraryMode(state));
  // TODO to be moved into queryPanelStore and reimplemented
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const loadingDataSources = useStore((state) => state.loadingDataSources);
  const dataSources = useStore((state) => state.dataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const queryToBeRun = useStore((state) => state.queryPanel.queryToBeRun);
  const selectedQuery = useStore((state) => withViewedLibraryVersion(state, state.queryPanel.selectedQuery), shallow);
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

  // Code search opens the tab a field lives in. Declared after the reset above so it wins when both
  // run for a newly selected query.
  useCodeSearchReveal('queryTab', selectedQuery?.id, (tab) => {
    setActiveTab(QUERY_TAB_IDS[tab] ?? 1);
    return true;
  });

  useEffect(() => {
    if (queryToBeRun !== null) {
      runQuery(queryToBeRun.id, queryToBeRun.name);
      setQueryToBeRun(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryToBeRun]);

  // Follow the viewed snapshot as well as source-list refreshes, without replacing the editable draft.
  useEffect(() => {
    const resolved = resolveDataSourceForQuery(selectedQuery);
    setSelectedDataSource(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources, globalDataSources, sampleDataSource, selectedQuery?.data_source_id, selectedQuery?.kind]);

  // Library templates read `{{input.x}}` instead of `{{parameters.x}}`. An empty group is left out so autocomplete
  // shows no bare `parameters` / `input`.
  const codeHinterContext = Object.fromEntries(
    Object.entries(
      isQueryLibrary
        ? { input: resolveDefaults(selectedQuery?.options?.inputs) }
        : { parameters: resolveDefaults(selectedQuery?.options?.parameters) }
    ).filter(([, value]) => !isEmpty(value))
  );

  return (
    <div
      className={cx(getQueryManagerClassName(surface, darkMode), {
        'd-none': loadingDataSources,
      })}
    >
      <QueryManagerHeader darkMode={darkMode} setActiveTab={setActiveTab} activeTab={activeTab} surface={surface} />
      <CodeHinterContext.Provider value={codeHinterContext}>
        <QueryManagerBody darkMode={darkMode} activeTab={activeTab} surface={surface} />
      </CodeHinterContext.Provider>
    </div>
  );
};

export default QueryManager;
