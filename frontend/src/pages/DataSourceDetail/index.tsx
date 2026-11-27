import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import { appendBranchName } from '@/_helpers/active-branch';
import {
  canCreateDataSource,
  canDeleteDataSource,
  canReadDataSource,
  canUpdateDataSource,
} from '@/_helpers/global-datasources';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';
import { getWorkspaceId, returnDevelopmentEnv } from '@/_helpers/utils';
import { appEnvironmentService } from '@/_services/app_environment.service';
import { authenticationService } from '@/_services/authentication.service';
import { globalDatasourceService } from '@/_services/globalDatasource.service';
import { licenseService } from '@/_services/license.service';
import { useLicenseStore } from '@/_stores/licenseStore';
import { subscribeLiveNotifications } from '@/_stores/notificationsStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { WorkspaceLockedBanner } from '@/_ui/WorkspaceLockedBanner';
import { fetchEdition } from '@/modules/common/helpers/utils';
import {
  DataSourceManager,
  type DataSourceEnvironment,
  type DataSourceManagerDataSource,
  type DataSourcePageHeaderContext,
} from '@/modules/dataSources/components/DataSourceManager/DataSourceManager';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import Layout from '@/_ui/Layout';

import DataSourceDetailHeader from './components/DataSourceDetailHeader';

interface DataSourceDetailProps {
  darkMode: boolean;
  switchDarkMode: () => void;
}

interface LiveNotification {
  type?: string;
  metadata?: { source?: string; action?: string };
}

// Minimal views of the untyped JS stores/context; only what this page reads.
interface BranchStoreState {
  activeBranchId: string | null;
  isGitSyncConfigured: boolean;
  isInitialized: boolean;
  isMultiBranchingEnabled?: boolean;
  orgGitConfig?: { is_branching_enabled?: boolean; isBranchingEnabled?: boolean } | null;
  currentBranch?: { is_default?: boolean; isDefault?: boolean } | null;
}

interface BreadCrumbContextValue {
  updateSidebarNAV?: (name: string) => void;
}

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

const NO_ACCESS_MESSAGE = "You don't have access to GDS, contact your workspace admin to add data sources";

// The list endpoint returns `connection_limit`; the form reads `connectionLimit`.
function withConnectionLimit(dataSource: DataSourceManagerDataSource): DataSourceManagerDataSource {
  const connectionLimit = dataSource.options?.connection_limit;
  if (!connectionLimit) return dataSource;
  return { ...dataSource, options: { ...dataSource.options, connectionLimit } };
}

// Same rule as the old data sources page: the default branch is read-only when multi-branch git sync is on and
// licensed, and the whole workspace is read-only when git sync is configured but its license is invalid.
function useIsWorkspaceBranchLocked() {
  const isGitSyncConfigured = useWorkspaceBranchesStore((state: BranchStoreState) => state.isGitSyncConfigured);
  const licenseFeatureAccess = useLicenseStore((state: { featureAccess: unknown }) => state.featureAccess);
  const isBranchLockedOnDefault = useWorkspaceBranchesStore((state: BranchStoreState) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    // `is_branching_enabled` stays true after a license downgrade, so also require the multi-branch flag.
    const isBranchingEnabled =
      (state.orgGitConfig.is_branching_enabled || state.orgGitConfig.isBranchingEnabled) &&
      state.isMultiBranchingEnabled !== false;
    const isDefault = state.currentBranch?.is_default || state.currentBranch?.isDefault;
    return Boolean(isBranchingEnabled && isDefault);
  });

  return isBranchLockedOnDefault || Boolean(isGitSyncConfigured && isGitSyncLicenseInvalid(licenseFeatureAccess));
}

export default function DataSourceDetail({ darkMode, switchDarkMode }: DataSourceDetailProps) {
  const { selectedId: dataSourceId } = useParams<{ selectedId: string }>();
  const navigate = useNavigate();
  const { updateSidebarNAV } = useContext(BreadCrumbContext) as BreadCrumbContextValue;

  const [dataSource, setDataSource] = useState<DataSourceManagerDataSource | null>(null);
  const [environments, setEnvironments] = useState<DataSourceEnvironment[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<DataSourceEnvironment | null>(null);
  const [featureAccess, setFeatureAccess] = useState<Record<string, unknown>>({});
  const [environmentLoading, setEnvironmentLoading] = useState(false);
  // Only the latest request may update the form, so a slow response can't overwrite a newer one.
  const latestRequestRef = useRef(0);
  // Header element that hosts the form's own save/connect buttons; state so the form re-renders once it exists.
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  const activeBranchId = useWorkspaceBranchesStore((state: BranchStoreState) => state.activeBranchId);
  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();

  const hasAccess = Boolean(dataSourceId && (canReadDataSource(dataSourceId) || canUpdateDataSource(dataSourceId)));
  const developmentEnvironment = useMemo(
    () => returnDevelopmentEnv(environments) ?? environments[0] ?? null,
    [environments]
  );

  const goToList = useCallback(
    () => navigate(appendBranchName(`/${getWorkspaceId()}/data-sources`), { replace: true }),
    [navigate]
  );

  // Without `environmentId` the form shows the list endpoint's copy, as the old page did on first load.
  const loadDataSource = useCallback(
    async (environmentId?: string) => {
      if (!dataSourceId) return;
      const requestId = ++latestRequestRef.current;
      const isStale = () => requestId !== latestRequestRef.current;

      try {
        const { current_organization_id } = authenticationService.currentSessionValue;
        const { data_sources: dataSources = [] } = await globalDatasourceService.getAll(current_organization_id);
        if (isStale()) return;

        const listed = (dataSources as DataSourceManagerDataSource[]).find((ds) => ds.id === dataSourceId);
        if (!listed) {
          // Deleted, or absent on the active branch.
          toast.error('Data source not found');
          goToList();
          return;
        }
        if (!environmentId) {
          setDataSource(withConnectionLimit(listed));
          return;
        }

        const scoped = await globalDatasourceService.getDataSourceByEnvironmentId(dataSourceId, environmentId);
        if (isStale()) return;
        // The environment endpoint omits the sync flags, which lock credentials on the default branch.
        setDataSource({ ...scoped, isSynced: listed.isSynced, is_synced: listed.is_synced });
      } catch (error) {
        if (!isStale()) toast.error((error as { error?: string })?.error ?? 'Failed to load data source');
      }
    },
    [dataSourceId, goToList]
  );

  useEffect(() => {
    if (hasAccess) return;
    toast.error(NO_ACCESS_MESSAGE);
    navigate(`/${getWorkspaceId()}${fetchEdition() === 'ce' ? '/' : '/home'}`);
  }, [hasAccess, navigate]);

  useEffect(() => {
    if (!hasAccess) return;
    licenseService.getFeatureAccess().then((data: { licenseStatus?: Record<string, unknown> } | undefined) => {
      setFeatureAccess({ ...data?.licenseStatus, ...data });
    });
    appEnvironmentService.getAllEnvironments().then((data: { environments?: DataSourceEnvironment[] } | undefined) => {
      setEnvironments(data?.environments ?? []);
    });
  }, [hasAccess]);

  // Reload on open, on switching to another data source, and on a branch switch (the branch decides which
  // version of the data source the server returns). Each starts on the development environment.
  useEffect(() => {
    if (!hasAccess || !developmentEnvironment) return;
    setCurrentEnvironment(developmentEnvironment);
    loadDataSource();
  }, [hasAccess, developmentEnvironment, loadDataSource, activeBranchId]);

  // A git pull only enqueues a job; reload once its completion notification arrives.
  useEffect(() => {
    const unsubscribe = subscribeLiveNotifications((notification: LiveNotification) => {
      const { metadata } = notification ?? {};
      if (notification?.type !== 'success' || metadata?.source !== 'git-sync') return;
      if (metadata.action !== 'git-pull-branch') return;
      loadDataSource(currentEnvironment?.id);
    });
    return () => {
      unsubscribe();
    };
  }, [loadDataSource, currentEnvironment?.id]);

  useEffect(() => {
    fetchAndSetWindowTitle({ page: dataSource?.name || pageTitles.DATA_SOURCES });
    if (dataSource?.name) updateSidebarNAV?.(dataSource.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource?.name]);

  const handleEnvironmentChange = (environment: DataSourceEnvironment, id?: string) => {
    setCurrentEnvironment(environment);
    if (!id) return;

    const requestId = ++latestRequestRef.current;
    setEnvironmentLoading(true);
    globalDatasourceService
      .getDataSourceByEnvironmentId(id, environment.id)
      .then((scoped: DataSourceManagerDataSource) => {
        if (requestId !== latestRequestRef.current) return;
        // The environment endpoint omits the sync flags, which lock credentials on the default branch.
        setDataSource((prev) => ({ ...scoped, isSynced: prev?.isSynced, is_synced: prev?.is_synced }));
      })
      .catch((error: { error?: string }) => toast.error(error?.error ?? 'Failed to load data source'))
      .finally(() => setEnvironmentLoading(false));
  };

  // The form calls `hideModal` after every save attempt and clears its own state first, so it needs a fresh copy.
  const reloadDataSource = () => loadDataSource(currentEnvironment?.id);

  const isFormReady = Boolean(dataSource && currentEnvironment);

  const renderPageHeader = (context: DataSourcePageHeaderContext) => (
    <DataSourceDetailHeader context={context} onBack={goToList} onActionsSlotChange={setActionsSlot} />
  );

  return (
    <Layout
      showNewHeader
      classes={classes}
      shouldWrapContentBody={false}
      darkMode={darkMode}
      switchDarkMode={switchDarkMode}
    >
      <main className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <WorkspaceLockedBanner pageContext="data sources" />

        {isFormReady ? (
          <DataSourceManager
            pageLayout
            renderPageHeader={renderPageHeader}
            pageActionsSlot={actionsSlot}
            scope="global"
            selectedDataSource={dataSource}
            darkMode={darkMode}
            hideModal={reloadDataSource}
            // No-op: the form calls `hideModal` right before this, which already reloads.
            dataSourcesChanged={() => {}}
            environments={environments}
            currentEnvironment={currentEnvironment}
            environmentChanged={handleEnvironmentChange}
            environmentLoading={environmentLoading}
            featureAccess={featureAccess}
            updateSelectedDatasource={updateSidebarNAV}
            showSaveBtn={Boolean(canCreateDataSource() || canUpdateDataSource(dataSourceId) || canDeleteDataSource())}
            isWorkspaceBranchLocked={isWorkspaceBranchLocked}
          />
        ) : (
          <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
            <TJLoader />
          </div>
        )}
      </main>
    </Layout>
  );
}
