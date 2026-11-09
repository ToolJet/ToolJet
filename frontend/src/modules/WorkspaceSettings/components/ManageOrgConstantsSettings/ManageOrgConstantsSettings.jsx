import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ConstantTypes } from './helpers/constantType';
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
  const listScrollRef = useRef(null);

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

  // Drop an unknown `env` from the URL (and the saved view) so a shared link does not carry it. Only when the
  // select is shown: otherwise `env` is ignored on purpose and a licensed user's choice should survive.
  useEffect(() => {
    if (showEnv && environments && env && !environments.some((e) => e.id === env)) setEnv(null);
  }, [showEnv, environments, env, setEnv]);

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

  // The list scrolls inside its own box, so the new page would otherwise open at the old scroll position.
  const changePage = (target) => {
    setPage(target);
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
  };

  // The list only shows constants that have a value in the viewed environment, so a save that leaves none there
  // would otherwise look as if nothing happened.
  const notListedHint = (constant) => {
    const listed = constant.values?.some((value) => value.environment_id === environmentId && value.has_value);
    if (!constant.values || listed) return null;
    const viewed = modalEnvironments.find((e) => e.id === environmentId)?.name;
    return `It has no value in ${viewed}, so it isn’t listed here.`;
  };

  const handleCreate = async (body) => {
    const constant = await createConstant(body);
    const hint = notListedHint(constant);
    toast.success(hint ? `${body.type} constant created. ${hint}` : `${body.type} constant created successfully!`);
    return constant;
  };

  const handleUpdate = async (id, body) => {
    const constant = await updateConstant(id, body);
    const hint = notListedHint(constant);
    toast.success(hint ? `Constant updated. ${hint}` : 'Constant updated successfully');
    return constant;
  };

  const handleDelete = async (ids) => {
    const result = await bulkDeleteConstants(ids);
    const count = result.deleted_ids.length;
    if (count) toast.success(count === 1 ? 'Constant deleted successfully' : `${count} constants deleted successfully`);
    return result;
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
    // The app shell is clipped to the viewport, so this node fills the space under the header (3rem) and any banner
    // above the page (the shell publishes its height as --dynamic-margin-2), and only the table scrolls: title, tabs,
    // controls and footer stay in view.
    <div className="tw-flex tw-h-[calc(100vh_-_3rem_-_var(--dynamic-margin-2,0px))] tw-flex-col tw-overflow-hidden tw-bg-background-surface-layer-01">
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-[70px] tw-pb-4 tw-pt-10">
        <ConstantsPageHeader onCreate={() => setCreating(true)} />
        <Tabs value={tab} onValueChange={setTab} className="tw-mt-4">
          {/* The full-width rule sits on this row, not the list, so the controls can share it */}
          <div className="tw-flex tw-h-10 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
            <TabsList className="tw-border-b-0">
              <TabsTrigger value={ConstantTypes.Secret} leadingVisual={<Lock size={16} />}>
                {tabLabel('Secrets', counts?.secrets)}
              </TabsTrigger>
              <TabsTrigger value={ConstantTypes.Global} leadingVisual={<KeyRound size={16} />}>
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
        {/* flex-1 lets an empty or error state centre in the space left above the footer. The row checkbox and drag
            handle sit left of the table, so the scroll box reaches into the page padding to keep them visible. */}
        <div
          ref={listScrollRef}
          data-testid="constants-list-scroll"
          className="-tw-mx-[70px] tw-mt-2.5 tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-px-[70px]"
        >
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
            onDelete={handleDelete}
            onCreate={() => setCreating(true)}
            onRetry={environmentsFailed ? loadEnvironments : loadList}
          />
        </div>
      </div>
      {selectedItems.length > 0 && (
        // Zero height, so the bar adds nothing to the layout; it floats 16px above the footer.
        <div className="tw-relative tw-z-10 tw-flex tw-h-0 tw-justify-center">
          <div className="tw-absolute tw-bottom-4">
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
              onDelete={handleDelete}
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
        multiEnvironment={showEnv}
        onSubmit={handleCreate}
      />
      {editing && (
        <ConstantModal
          mode="edit"
          constant={editing}
          open={editOpen}
          onOpenChange={setEditOpen}
          environments={modalEnvironments}
          multiEnvironment={showEnv}
          onSubmit={(body) => handleUpdate(editing.id, body)}
        />
      )}
    </div>
  );
};

export default ManageOrgConstantsSettings;
