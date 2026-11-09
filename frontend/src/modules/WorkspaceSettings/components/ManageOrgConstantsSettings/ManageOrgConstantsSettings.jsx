import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { capitalize } from 'lodash';
import { toast } from 'react-hot-toast';
import { KeyRound, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket';
import { appEnvironmentService } from '@/_services';
import { orgConstantsV2Service } from '@/_services/organization_constants_v2.service';
import { getWorkspaceId } from '@/_helpers/utils';
import { isMultiEnvLicenseInvalid } from '@/_helpers/multiEnvLicense';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useHeaderSearchConfig } from '@/_hooks/useHeaderSearchConfig';
import { fetchEdition } from '@/modules/common/helpers/utils';
import ConstantModal from './components/ConstantModal';
import ConstantsListControls from './components/ConstantsListControls';
import ConstantsPageHeader from './components/ConstantsPageHeader';
import ConstantsTable from './components/ConstantsTable';
import ConstantsTableFooter from './components/ConstantsTableFooter';
import SelectionBar from './components/SelectionBar';
import { CONSTANT_SOURCES, useConstantsListQueryParams } from './hooks/useConstantsListQueryParams';
import { useConstantsListStore } from './store/constantsListStore';

// The list API rejects a longer `search`.
const MAX_SEARCH_LENGTH = 50;

const tabLabel = (name, count) => (count === undefined ? name : `${name} (${count})`);

const ManageOrgConstantsSettings = () => {
  const { env, tab, sort, source, setEnv, setTab, setSort, setSource } = useConstantsListQueryParams({
    workspaceId: getWorkspaceId(),
  });

  const items = useConstantsListStore((state) => state.root.items);
  const meta = useConstantsListStore((state) => state.root.meta);
  const listStatus = useConstantsListStore((state) => state.root.status);
  const page = useConstantsListStore((state) => state.query.page);
  const searchKey = useConstantsListStore((state) => state.query.searchKey);
  const fetchList = useConstantsListStore((state) => state.fetchList);
  const createConstant = useConstantsListStore((state) => state.createConstant);
  const updateConstant = useConstantsListStore((state) => state.updateConstant);
  const rowSelection = useConstantsListStore((state) => state.rowSelection);
  const setRowSelection = useConstantsListStore((state) => state.setRowSelection);
  const clearSelection = useConstantsListStore((state) => state.clearSelection);
  const pinnedIds = useConstantsListStore((state) => state.pins[tab]);
  const pinConstants = useConstantsListStore((state) => state.pinConstants);
  const unpinConstants = useConstantsListStore((state) => state.unpinConstants);
  const movePin = useConstantsListStore((state) => state.movePin);
  const bulkDeleteConstants = useConstantsListStore((state) => state.bulkDeleteConstants);

  // `null` until the environments load. The list needs an environment id, so nothing is fetched before then.
  const [environments, setEnvironments] = useState(null);
  const [environmentsFailed, setEnvironmentsFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  // The constant being edited, kept after the modal closes so it can finish its exit animation.
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

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

  useHeaderSearchConfig({ placeholder: 'Search constants' });
  const debouncedSearch = useSearchStore((state) => state.debouncedSearchQuery);
  const setSearch = useConstantsListStore((state) => state.setSearch);
  const setPage = useConstantsListStore((state) => state.setPage);

  // `setSearch` always goes back to page 1, so only call it when the term really changed: a remount with an
  // unchanged term must keep the page.
  useEffect(() => {
    const term = debouncedSearch.slice(0, MAX_SEARCH_LENGTH);
    if (term !== useConstantsListStore.getState().query.searchKey) setSearch(term);
  }, [debouncedSearch, setSearch]);

  // Both stores outlive the page: reset them together so the header and the list never disagree.
  useEffect(
    () => () => {
      useSearchStore.getState().clearSearch();
      if (useConstantsListStore.getState().query.searchKey) useConstantsListStore.getState().setSearch('');
    },
    []
  );

  const featureAccess = useLicenseStore((state) => state.featureAccess);
  // Every workspace has all environment rows, but only licensed EE can switch between them.
  const showEnv = fetchEdition() !== 'ce' && !isMultiEnvLicenseInvalid(featureAccess);

  // A saved or hand-edited `env` that no longer exists falls back to the default environment, and so does any
  // `env` when switching is not available.
  const environment =
    (showEnv ? environments?.find((e) => e.id === env) : undefined) ??
    environments?.find((e) => e.is_default) ??
    environments?.[0];
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

  // The list row has no per-environment values, so the full constant is fetched before the modal opens.
  const openEdit = async (item) => {
    try {
      setEditing(await orgConstantsV2Service.get(item.id));
      setEditOpen(true);
    } catch (error) {
      toast.error(error?.error || 'Could not load the constant. Please try again.');
    }
  };

  // The document scrolls, not the list, so the new page would otherwise open at the old scroll position.
  const changePage = (target) => {
    setPage(target);
    window.scrollTo({ top: 0 });
  };

  const pin = (ids) => pinConstants(tab, ids, sort);
  const unpin = (ids) => unpinConstants(tab, ids);

  const selectedItems = items.filter((item) => rowSelection[item.id]);
  const selectedIds = selectedItems.map((item) => item.id);
  // `.env` constants can be selected to pin, but never deleted.
  const deletableItems = selectedItems.filter((item) => item.source !== 'env');
  // The bar's Pin button turns into Unpin once there is nothing left to pin.
  const allSelectedPinned = selectedIds.length > 0 && selectedIds.every((id) => pinnedIds.includes(id));

  return (
    // Layout leaves the page as tall as its content, so the body background shows below a short list. 3rem is
    // the header above this node.
    <div className="tw-flex tw-min-h-[calc(100vh-3rem)] tw-flex-col tw-bg-background-surface-layer-01">
      <div className="tw-flex tw-flex-1 tw-flex-col tw-px-[70px] tw-pb-10 tw-pt-10">
        <ConstantsPageHeader onCreate={() => setCreating(true)} />
        <Tabs value={tab} onValueChange={setTab} className="tw-mt-4">
          {/* The full-width rule sits on this row, not the list, so the controls can share it */}
          <div className="tw-flex tw-h-10 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
            <TabsList className="tw-border-b-0">
              <TabsTrigger value="Secret" leadingVisual={<Lock size={16} />}>
                {tabLabel('Secrets', counts?.secrets)}
              </TabsTrigger>
              <TabsTrigger value="Global" leadingVisual={<KeyRound size={16} />}>
                {tabLabel('Globals', counts?.globals)}
              </TabsTrigger>
            </TabsList>
            <ConstantsListControls
              showEnv={showEnv}
              environments={modalEnvironments}
              environmentId={environmentId}
              onEnvChange={setEnv}
              sort={sort}
              onSortChange={setSort}
              source={source}
              onSourceChange={setSource}
            />
          </div>
        </Tabs>
        {/* flex-1 lets an empty or error state centre in the space left above the footer */}
        <div className="tw-mt-2.5 tw-flex tw-flex-1 tw-flex-col">
          <ConstantsTable
            items={items}
            status={status}
            variant={tab}
            searchKey={searchKey}
            isSourceFiltered={source.length < CONSTANT_SOURCES.length}
            pinnedIds={pinnedIds}
            rowSelection={rowSelection}
            onSelectionChange={setRowSelection}
            onPin={pin}
            onUnpin={unpin}
            onMovePin={(id, toIndex) => movePin(tab, id, toIndex)}
            onEdit={openEdit}
            onDelete={bulkDeleteConstants}
            onCreate={() => setCreating(true)}
            onRetry={environmentsFailed ? loadEnvironments : loadList}
          />
        </div>
      </div>
      {selectedItems.length > 0 && (
        // Zero height, so the bar adds nothing to the page; it sticks 16px above the 48px footer while the list scrolls.
        <div className="tw-sticky tw-bottom-16 tw-z-10 tw-flex tw-h-0 tw-justify-center">
          <div className="tw-absolute tw-bottom-0">
            <SelectionBar
              variant={tab}
              selectedIds={selectedIds}
              deletableIds={deletableItems.map((item) => item.id)}
              deletableNames={deletableItems.map((item) => item.name)}
              allPinned={allSelectedPinned}
              onClear={clearSelection}
              onPin={() => {
                pin(selectedIds);
                clearSelection();
              }}
              onUnpin={() => {
                unpin(selectedIds);
                clearSelection();
              }}
              onDelete={bulkDeleteConstants}
            />
          </div>
        </div>
      )}
      <ConstantsTableFooter status={status} meta={meta} itemCount={items.length} onPageChange={changePage} />
      <ConstantModal
        mode="create"
        open={creating}
        onOpenChange={setCreating}
        environments={modalEnvironments}
        onSubmit={createConstant}
      />
      {editing && (
        <ConstantModal
          mode="edit"
          constant={editing}
          open={editOpen}
          onOpenChange={setEditOpen}
          environments={modalEnvironments}
          onSubmit={(body) => updateConstant(editing.id, body)}
        />
      )}
    </div>
  );
};

export default ManageOrgConstantsSettings;
