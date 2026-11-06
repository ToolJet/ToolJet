import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { capitalize } from 'lodash';
import { KeyRound, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket';
import { appEnvironmentService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';
import ConstantModal from './components/ConstantModal';
import ConstantsPageHeader from './components/ConstantsPageHeader';
import ConstantsTable from './components/ConstantsTable';
import ConstantsTableFooter from './components/ConstantsTableFooter';
import { useConstantsListQueryParams } from './hooks/useConstantsListQueryParams';
import { useConstantsListStore } from './store/constantsListStore';

const tabLabel = (name, count) => (count === undefined ? name : `${name} (${count})`);

const ManageOrgConstantsSettings = () => {
  const { env, tab, sort, source, setTab } = useConstantsListQueryParams({ workspaceId: getWorkspaceId() });

  const items = useConstantsListStore((state) => state.root.items);
  const meta = useConstantsListStore((state) => state.root.meta);
  const listStatus = useConstantsListStore((state) => state.root.status);
  const page = useConstantsListStore((state) => state.query.page);
  const searchKey = useConstantsListStore((state) => state.query.searchKey);
  const fetchList = useConstantsListStore((state) => state.fetchList);
  const createConstant = useConstantsListStore((state) => state.createConstant);

  // `null` until the environments load. The list needs an environment id, so nothing is fetched before then.
  const [environments, setEnvironments] = useState(null);
  const [environmentsFailed, setEnvironmentsFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadEnvironments = useCallback(() => {
    setEnvironmentsFailed(false);
    appEnvironmentService
      .getAllEnvironments()
      .then((response) => setEnvironments(response.environments))
      .catch(() => setEnvironmentsFailed(true));
  }, []);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  // A saved or hand-edited `env` that no longer exists falls back to the default environment.
  const environment =
    environments?.find((e) => e.id === env) ?? environments?.find((e) => e.is_default) ?? environments?.[0];
  const environmentId = environment?.id;

  const loadList = useCallback(
    () => fetchList({ environmentId, type: tab, sort, source }),
    [fetchList, environmentId, tab, sort, source]
  );

  useEffect(() => {
    if (environmentId) loadList();
    // The store reads page and search itself, so a change to either must refetch.
  }, [loadList, environmentId, page, searchKey]);

  // The API returns names like "development"; the modal shows them as headings and menu items.
  const modalEnvironments = useMemo(
    () => (environments ?? []).map((e) => ({ ...e, name: capitalize(e.name) })),
    [environments]
  );

  const counts = meta?.counts;

  const status = environmentsFailed ? 'error' : listStatus;

  return (
    // Layout leaves the page as tall as its content, so the body background shows below a short list. 3rem is
    // the header above this node.
    <div className="tw-flex tw-min-h-[calc(100vh-3rem)] tw-flex-col tw-bg-background-surface-layer-01">
      <div className="tw-flex tw-flex-1 tw-flex-col tw-px-[70px] tw-pb-10 tw-pt-10">
        <ConstantsPageHeader onCreate={() => setCreating(true)} />
        <Tabs value={tab} onValueChange={setTab} className="tw-mt-4">
          {/* The full-width rule sits on this row, not the list, so controls can share it later */}
          <div className="tw-flex tw-h-10 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
            <TabsList className="tw-border-b-0">
              <TabsTrigger value="Secret" leadingVisual={<Lock size={16} />}>
                {tabLabel('Secrets', counts?.secrets)}
              </TabsTrigger>
              <TabsTrigger value="Global" leadingVisual={<KeyRound size={16} />}>
                {tabLabel('Globals', counts?.globals)}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        {/* flex-1 lets an empty or error state centre in the space left above the footer */}
        <div className="tw-mt-2.5 tw-flex tw-flex-1 tw-flex-col">
          <ConstantsTable
            items={items}
            status={status}
            variant={tab}
            searchKey={searchKey}
            onCreate={() => setCreating(true)}
            onRetry={environmentsFailed ? loadEnvironments : loadList}
          />
        </div>
      </div>
      <ConstantsTableFooter status={status} meta={meta} itemCount={items.length} />
      <ConstantModal
        mode="create"
        open={creating}
        onOpenChange={setCreating}
        environments={modalEnvironments}
        onSubmit={createConstant}
      />
    </div>
  );
};

export default ManageOrgConstantsSettings;
