import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import config from 'config';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { authHeader, handleResponse, canUseDataSourceForQuery } from '@/_helpers';
import { authenticationService, libraryQueryService } from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import QueryPanel from '@/AppBuilder/QueryPanel';
import LibraryUsagePanel from './LibraryUsagePanel';
import QueryLibrarySkeleton from './QueryLibrarySkeleton';
import './query-library.scss';

export default function QueryLibraryPage({ darkMode }) {
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const { workspaceId: routeWorkspaceId } = useParams();
  useEffect(() => {
    updateSidebarNAV?.('All queries');
  }, [updateSidebarNAV]);
  const [session, setSession] = useState(authenticationService.currentSessionValue);
  const workspaceMatches =
    !routeWorkspaceId ||
    routeWorkspaceId === session?.current_organization_id ||
    routeWorkspaceId === session?.current_organization_slug;
  const workspaceId =
    workspaceMatches && session?.load_app && session?.group_permissions ? session.current_organization_id : null;
  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe(setSession);
    return () => subscription.unsubscribe();
  }, []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const selectedQueryId = useStore((state) => state.queryPanel.selectedQuery?.id);

  useEffect(() => {
    if (!workspaceId) {
      setReady(false);
      return;
    }
    const sessionId = useStore.getState().queryLibrary.beginLibrarySession(workspaceId);
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && useStore.getState().queryLibrary.isCurrentSession(sessionId);
    const context = { workspaceId, signal: controller.signal };
    const read = (path) =>
      fetch(`${config.apiUrl}/${path}`, {
        headers: authHeader(false, workspaceId),
        credentials: 'include',
        signal: controller.signal,
      }).then(handleResponse);
    setReady(false);
    setError(null);
    Promise.all([
      libraryQueryService.list(context),
      libraryQueryService.listFolders(context),
      libraryQueryService.listStaticDataSources(context),
      read(`data-sources/${workspaceId}`),
      read('app-environments'),
      read('license/access'),
    ])
      .then(([queries, folders, staticSources, sources, environmentResponse, featureAccess]) => {
        if (!current()) return;
        const state = useStore.getState();
        const session = authenticationService.currentSessionValue;
        const user = session?.current_user;
        state.setUser({
          id: user?.id,
          email: user?.email,
          firstName: user?.first_name,
          lastName: user?.last_name,
          groups: session?.group_permissions?.map((group) => group.group) ?? [],
        });
        state.setOrganization({ currentOrganizationId: workspaceId });
        state.setResolvedGlobals(
          'currentUser',
          {
            ...useStore.getState().user,
            role: session?.role?.name,
            groups: [
              'all_users',
              ...(session?.group_permissions?.map((group) => group.name) ?? []),
              session?.role?.name,
            ],
          },
          'canvas'
        );
        state.setResolvedGlobals('mode', { value: 'edit' }, 'canvas');
        const usableSources = (sources.data_sources ?? []).filter((source) => canUseDataSourceForQuery(source.id));
        useStore.setState({
          license: { featureAccess },
          isLicenseFetched: true,
          dataSources: [],
          globalDataSources: [
            ...usableSources,
            ...staticSources.filter((source) => source.type === DATA_SOURCE_TYPE.STATIC),
          ],
          sampleDataSource: null,
          loadingDataSources: false,
        });
        state.queryLibrary.setLibraryEnvironments(environmentResponse.environments ?? environmentResponse);
        state.dataQuery.setQueries(queries);
        state.setQueryMapping('canvas');
        state.initialiseResolvedQuery(
          queries.map(({ id }) => id),
          'canvas'
        );
        state.queryFolders?.setFolders(folders);
        state.queryFolders?.setFolderMappings([
          ...folders.map((folder, index) => ({
            id: folder.id,
            childId: folder.id,
            childType: 'folder',
            parentId: null,
            index,
          })),
          ...queries.map((query, index) => ({ ...query.folderMapping, index })),
        ]);
        state.queryPanel.setLoadingDataQueries(false);
        state.queryPanel.setIsQueryPaneExpanded(true);
        setReady(true);
      })
      .catch((reason) => {
        if (current()) setError(typeof reason?.error === 'string' ? reason.error : 'Could not load query library');
      });
    return () => {
      controller.abort();
      useStore.getState().queryLibrary.endLibrarySession(sessionId);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (ready) useStore.getState().setResolvedGlobals('theme', { name: darkMode ? 'dark' : 'light' }, 'canvas');
  }, [darkMode, ready]);

  if (error) return <div role="alert">{error}</div>;
  if (!workspaceId || !ready) return <QueryLibrarySkeleton />;
  return (
    <ModuleProvider moduleId="canvas" isModuleMode={false} isModuleEditor={false}>
      <div className="query-library-editor" data-cy="query-library-page">
        <QueryPanel darkMode={darkMode} />
        <LibraryUsagePanel libraryQueryId={selectedQueryId} workspaceId={workspaceId} />
      </div>
    </ModuleProvider>
  );
}
