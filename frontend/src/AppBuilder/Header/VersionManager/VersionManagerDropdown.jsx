import { useVersionLifecycle, useOptionalVersionLifecycle } from './VersionLifecycleContext';
import { AppVersionLifecycleProvider } from './AppVersionLifecycleProvider';
import { useLocation, useNavigate, useInRouterContext } from 'react-router-dom';
import EnvironmentSwitcherContent from './EnvironmentSwitcherContent';
import CreateVersionModal from '../CreateVersionModal';
import CreateDraftVersionModal from '../CreateDraftVersionModal';
import EditVersionModal from './EditVersionModal';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DependencyWarningDialog from '@/_components/DependencyWarningDialog/DependencyWarningDialog';
import { Overlay, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { toast } from 'react-hot-toast';
import cx from 'classnames';
import VersionSwitcherButton from './VersionSwitcherButton';
import VersionSearchField from './VersionSearchField';
import VersionDropdownItem from './VersionDropdownItem';
import CreateDraftButton from './CreateDraftButton';
import VersionItemSkeleton from './VersionItemSkeleton';
import { ConfirmDialog } from '@/_components';
import { ToolTip } from '@/_components/ToolTip';
import { Button } from '@/components/ui/Button/Button';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import './style.scss';

export const VersionManagerDropdownContent = ({ darkMode = false, ...props }) => {
  const {
    resourceType,
    versions,
    selectedVersionId: currentVersionId,
    selectedEnvironment: currentEnvironment,
    environments,
    releasedVersionId,
    loading,
    error,
    capabilities = {},
    notices,
    actions,
  } = useVersionLifecycle();
  const currentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const developmentVersions = capabilities.developmentVersionIds
    ? versions.filter((v) => capabilities.developmentVersionIds.includes(v.id))
    : versions;
  const currentVersion = versions.find((v) => v.id === currentVersionId);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironmentFilter, setSelectedEnvironmentFilter] = useState(currentEnvironment);
  const {
    enabled: isGitSyncEnabled = false,
    isMultiBranchingEnabled = false,
    status: gitVersionStatus = new Map(),
    isRefreshing = false,
    isPullingVersion = null,
  } = capabilities.git || {};
  const filteredVersions = versions.filter(
    (v) =>
      (!capabilities.visibleVersionIds || capabilities.visibleVersionIds.includes(v.id)) &&
      (v.versionType || v.version_type) !== 'branch' &&
      (!searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showEditVersionModal, setShowEditVersionModal] = useState(false);
  const [versionToPromote, setVersionToPromote] = useState(null);
  const [versionToEdit, setVersionToEdit] = useState(null);
  const [openMenuVersionId, setOpenMenuVersionId] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  useEffect(() => {
    setSelectedEnvironmentFilter(currentEnvironment);
  }, [currentEnvironment]);

  // Check if there's a draft in development environment (global check across all environments)
  // Drafts only exist in Development environment

  // Check if there's only one draft and no other saved versions
  // draftVersions are versions of type 'version' (not branches)
  const draftVersions = developmentVersions.filter(
    (v) => (v.versionType || 'version') === 'version' && v.status === 'DRAFT'
  );
  const savedVersions = developmentVersions.filter((v) => v.status !== 'DRAFT');

  // A draft is always created FROM a saved version — so hide the button entirely when there are
  // no saved versions to create from (nothing to pick in the modal).
  const showCreateDraftButton = savedVersions.length > 0;

  // Enable/disable logic (only relevant when shown):
  // - Git-off: enabled (a workspace can hold multiple drafts).
  // - Git single-branch: always enabled. Unsynced app → normal create (unlimited drafts, git-off
  //   style); synced app → creating a draft REPLACES the single synced draft (see replaceDraftVersion).
  // - Git multi-branch + a synced draft exists: disabled — patches are made on feature branches, not
  //   by replacing the default-branch draft.
  const hasSyncedDraft = draftVersions.some((v) => v.isSynced !== false);
  const shouldDisableCreateDraft = isGitSyncEnabled && isMultiBranchingEnabled && hasSyncedDraft;
  const createDraftDisabledTooltip = shouldDisableCreateDraft ? 'Draft version already exists.' : '';

  const mergedVersions = useMemo(() => {
    const gitOnlyItems = [];
    const isDevelopmentView = (selectedEnvironmentFilter || currentEnvironment)?.name === 'development';
    if (isDevelopmentView) {
      gitVersionStatus.forEach((status, versionName) => {
        if (!status.isLocal) {
          if (searchQuery && !versionName.toLowerCase().includes(searchQuery.toLowerCase())) return;
          gitOnlyItems.push({
            id: `git-${versionName}`,
            name: versionName,
            versionType: 'version',
            status: null,
            isGitOnly: true,
            description: status.tagDescription,
          });
        }
      });
    }
    return [...filteredVersions, ...gitOnlyItems];
  }, [filteredVersions, gitVersionStatus, searchQuery, selectedEnvironmentFilter, currentEnvironment]);

  // Helper to close dropdown and reset UI state
  const closeDropdown = () => {
    setDropdownOpen(false);
    // Reset environment filter to global environment when dropdown closes
    // selectedEnvironmentFilter is just a UI state for browsing, not the actual global environment
    setSelectedEnvironmentFilter(currentEnvironment);
  };

  const handleToggleDropdown = () => {
    if (isPullingVersion) return;
    if (!isDropdownOpen) {
      setSearchQuery('');
      // Reset environment filter to global currentEnvironment when opening
      // This ensures the dropdown always starts at the current global environment
      setSelectedEnvironmentFilter(currentEnvironment);
      if (actions.openDropdown) actions.openDropdown();
      else actions.refresh();
      setTimeout(() => setDropdownOpen(true), 0);
    } else {
      closeDropdown();
    }
  };

  const handleEnvironmentChange = (env) => {
    // Close any open menus when switching environments
    setOpenMenuVersionId(null);
    // Update local filter and lazy load versions for the selected environment
    setSelectedEnvironmentFilter(env);
    actions.selectEnvironment(env.id);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleRefreshFromGit = () => actions.refreshFromGit?.();
  const handlePullVersion = (version, gitStatus) => actions.pullVersion?.(version, gitStatus);

  const handleCreateDraft = () => {
    // Close the version dropdown before opening the modal, otherwise both stay open at once.
    closeDropdown();
    setShowCreateDraftModal(true);
  };

  const handleVersionSelect = (version) => {
    const isDifferentEnvironment = selectedEnvironmentFilter?.id !== currentEnvironment?.id;

    const isSameVersionSelected = currentVersionId === version.id;
    const isSameEnvironment = !isDifferentEnvironment;

    if (isSameVersionSelected && isSameEnvironment) {
      closeDropdown();
      return;
    }
    closeDropdown();

    actions.selectVersion(version.id).catch((error) => toast.error(error?.message || 'Failed to switch version'));
  };

  const handlePromoteDraft = (version) => {
    setVersionToPromote(version);
    setShowPromoteModal(true);
    closeDropdown();
  };

  const handleCreateVersion = (version) => {
    setVersionToPromote(version);
    setShowPromoteModal(true);
    closeDropdown();
  };

  const handleEditVersion = (version) => {
    setVersionToEdit(version);
    setShowEditVersionModal(true);
    closeDropdown();
  };

  // Delete version modal state
  const [deleteVersion, setDeleteVersion] = useState({
    versionId: '',
    versionName: '',
    isSynced: true,
    showModal: false,
  });
  const [inUseWarning, setInUseWarning] = useState({ show: false, versionName: '' });

  // Git-specific delete messaging only for versions actually synced to git
  const isGitTrackedDelete = isGitSyncEnabled && deleteVersion.isSynced !== false;

  const deleteModalMessage = isGitTrackedDelete ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p className="tj-text-sm" style={{ lineHeight: '18px', color: 'var(--text-default)', margin: 0 }}>
        {"The version '"}
        <strong>{deleteVersion.versionName}</strong>
        {"' will also be "}
        <strong>deleted from Git</strong>
        {' and cannot be recovered. Are you sure you want to continue?'}
      </p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <div style={{ paddingTop: '2px', flexShrink: 0 }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              background: 'rgba(136,144,153,0.12)',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SolidIcon name="tickv3" width="10" height="10" fill="var(--text-placeholder)" />
          </div>
        </div>
        <div>
          <div className="tj-text-sm" style={{ lineHeight: '18px', color: 'var(--text-default)', fontWeight: 400 }}>
            Commit changes
          </div>
          <div className="tj-text-xsm" style={{ lineHeight: '16px', color: 'var(--text-placeholder)' }}>
            Delete will always be committed in git to ensure sync with ToolJet
          </div>
        </div>
      </div>
    </div>
  ) : (
    'This version will be permanently deleted and cannot be recovered. Are you sure you want to continue?'
  );

  const openDeleteModal = (version) => {
    // Last synced draft can't be deleted while git sync is on (mirrors backend guard) — toast, no modal
    const isSyncedDraft = version.status === 'DRAFT' && version.isSynced !== false;
    const otherDraftCount = draftVersions.filter((v) => v.id !== version.id).length;
    if (isGitSyncEnabled && isSyncedDraft && otherDraftCount === 0) {
      toast.error('Cannot delete the last draft version while git sync is enabled');
      return;
    }

    setDeleteVersion({
      versionId: version.id,
      versionName: version.name,
      isSynced: version.isSynced,
      showModal: true,
    });
  };

  const resetDeleteModal = () => {
    setDeleteVersion({ versionId: '', versionName: '', isSynced: true, showModal: false });
  };

  const confirmDeleteVersion = () => {
    if (!deleteVersion.versionId) return;
    const deletingToast = toast.loading('Deleting version...');
    actions
      .deleteVersion(deleteVersion.versionId)
      .then(() => {
        toast.dismiss(deletingToast);
        toast.success(`Version - ${deleteVersion.versionName} Deleted`);
        resetDeleteModal();
        closeDropdown();
        actions.refresh();
      })
      .catch((error) => {
        toast.dismiss(deletingToast);
        if (
          resourceType === 'query-library'
            ? error?.code === 'LIBRARY_QUERY_IN_USE'
            : error?.error?.startsWith('Cannot delete this version.') || error?.code === 'VERSION_IN_USE'
        ) {
          setInUseWarning({ show: true, versionName: deleteVersion.versionName });
          resetDeleteModal();
          return;
        }
        toast.error(error?.error || error?.message || 'Failed to delete version');
        resetDeleteModal();
      });
  };

  // Count only actual versions, not sub-branches
  const versionOnlyCount = versions.filter(
    (v) =>
      (!capabilities.visibleVersionIds || capabilities.visibleVersionIds.includes(v.id)) &&
      (v.versionType || 'version') === 'version'
  ).length;

  const renderPopover = (overlayProps) => (
    <Popover
      id="version-manager-popover"
      className={cx('version-manager-popover', { 'dark-theme theme-dark': darkMode })}
      ref={popoverRef}
      {...overlayProps}
      style={{
        ...overlayProps?.style,
        minWidth: '350px',
        borderRadius: '8px',
        border: '1px solid var(--border-weak)',
        boxShadow: '0px 0px 1px var(--interactive-default), 0px 1px 1px var(--interactive-hover)',
        padding: 0,
      }}
    >
      <Popover.Body style={{ padding: 0 }}>
        {/* Versions header with Refresh — only when git sync is enabled */}
        {isGitSyncEnabled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px 12px',
            }}
          >
            <span className="tj-text-sm" style={{ fontWeight: 500, color: 'var(--text-default)' }}>
              Versions
            </span>
            {(selectedEnvironmentFilter || currentEnvironment)?.name === 'development' && hasSyncedDraft && (
              <ToolTip message="See all versions in git remote" placement="top">
                <span>
                  <Button
                    variant="outline"
                    size="small"
                    leadingIcon="refresh"
                    fill="var(--icon-strong)"
                    onClick={handleRefreshFromGit}
                    disabled={isRefreshing}
                    loading={isRefreshing}
                    className={cx({ 'dark-theme theme-dark': darkMode })}
                    style={{ padding: '8px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Refresh
                  </Button>
                </span>
              </ToolTip>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

        {/* Environment Toggle */}
        <div>
          <EnvironmentSwitcherContent
            environmentsWithMeta={
              capabilities.environmentOptions ||
              environments.map((environment) => ({
                environment,
                disabled: environment.enabled === false,
                tooltipMessage: '',
                showTooltip: false,
                showEnterpriseIcon: false,
              }))
            }
            selectedEnvironment={selectedEnvironmentFilter || currentEnvironment}
            onEnvironmentChange={handleEnvironmentChange}
            darkMode={darkMode}
          />
        </div>

        {/* Search Field - Only show if more than 5 versions */}
        {versionOnlyCount > 5 && (
          <div>
            <VersionSearchField value={searchQuery} onChange={handleSearchChange} />
          </div>
        )}

        {/* Versions List - Scrollable */}
        <div
          className="versions-list"
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {loading ? (
            // Skeleton loaders
            <>
              <VersionItemSkeleton />
              <VersionItemSkeleton />
              <VersionItemSkeleton />
            </>
          ) : error ? (
            <div role="alert" className="tw-px-3 tw-py-6 tw-font-body-default tw-text-text-default">
              {typeof error === 'string' ? error : error?.message || 'Could not load versions'}
            </div>
          ) : mergedVersions.length === 0 ? (
            <div
              className="d-flex align-items-center justify-content-center tj-text-sm"
              style={{
                padding: '24px 12px',
                color: 'var(--text-secondary)',
              }}
            >
              {searchQuery
                ? 'No versions found'
                : gitVersionStatus.size === 0 && isGitSyncEnabled
                  ? 'No versions available — click Refresh to check git'
                  : 'No versions available'}
            </div>
          ) : (
            mergedVersions.map((version) => {
              const isViewingCurrentEnvironment = selectedEnvironmentFilter?.id === currentEnvironment?.id;
              const isVersionSelected = version.id === currentVersionId && isViewingCurrentEnvironment;

              return (
                <VersionDropdownItem
                  key={version.id}
                  version={version}
                  isSelected={isVersionSelected}
                  isViewingCurrentEnvironment={isViewingCurrentEnvironment}
                  currentEnvironment={selectedEnvironmentFilter || currentEnvironment}
                  environments={environments}
                  onSelect={() => handleVersionSelect(version)}
                  onPromote={() => handlePromoteDraft(version)}
                  onCreateVersion={() => handleCreateVersion(version)}
                  onEdit={(v) => handleEditVersion(v)}
                  onDelete={(v) => openDeleteModal(v)}
                  darkMode={darkMode}
                  openMenuVersionId={openMenuVersionId}
                  setOpenMenuVersionId={setOpenMenuVersionId}
                  gitStatus={gitVersionStatus.get(version.name)}
                  onPull={(v, gs) => handlePullVersion(v, gs)}
                  isPulling={isPullingVersion === version.name}
                />
              );
            })
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

        {showCreateDraftButton && (
          <CreateDraftButton
            onClick={handleCreateDraft}
            disabled={shouldDisableCreateDraft}
            disabledTooltip={createDraftDisabledTooltip}
            darkMode={darkMode}
          />
        )}
      </Popover.Body>
    </Popover>
  );

  // Feature branches have no version lifecycle. Guarded here rather than in EditorHeader so
  // the workflow header is covered too.
  const isOnFeatureBranch =
    currentVersion?.versionType === 'branch' ||
    currentVersion?.version_type === 'branch' ||
    !!(currentBranch && !currentBranch.is_default && !currentBranch.isDefault);
  if (isOnFeatureBranch) return null;

  return (
    <>
      <div ref={buttonRef}>
        <VersionSwitcherButton
          version={currentVersion || { name: 'v1' }}
          environment={currentEnvironment}
          onClick={handleToggleDropdown}
          darkMode={darkMode}
          releasedVersionId={releasedVersionId}
          isOpen={isDropdownOpen}
        />
      </div>

      <Overlay
        show={isDropdownOpen}
        target={buttonRef.current}
        placement="bottom-end"
        rootClose
        onHide={() => {
          if (!isPullingVersion) closeDropdown();
        }}
        popperConfig={{
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 4],
              },
            },
          ],
        }}
      >
        {({ placement: _placement, arrowProps: _arrowProps, show: _show, popper: _popper, ...props }) => (
          <div
            style={{
              position: 'absolute',
              zIndex: 1050,
            }}
          >
            {renderPopover(props)}
          </div>
        )}
      </Overlay>

      {/* Create Draft Modal */}
      <CreateDraftVersionModal
        showCreateAppVersion={showCreateDraftModal}
        setShowCreateAppVersion={setShowCreateDraftModal}
        {...props}
      />

      {/* Promote Version Modal */}
      <CreateVersionModal
        showCreateAppVersion={showPromoteModal}
        setShowCreateAppVersion={(show) => {
          setShowPromoteModal(show);
          if (!show) {
            setVersionToPromote(null);
          }
        }}
        versionId={versionToPromote?.id}
        onVersionCreated={() => {
          // Refresh versions for the currently filtered environment, not the global currentEnvironment
          // This ensures the dropdown shows the correct versions after creating a version
          actions.refresh();
          setVersionToPromote(null);
        }}
        {...props}
      />

      {/* Edit Version Modal — non-git-sync workspaces, or unsynced apps (never pushed to
          git) that behave like a non-git workspace for editing purposes */}
      {(!isGitSyncEnabled || versionToEdit?.isSynced === false) && (
        <EditVersionModal
          showEditAppVersion={showEditVersionModal}
          setShowEditAppVersion={(show) => {
            setShowEditVersionModal(show);
            if (!show) setVersionToEdit(null);
          }}
          versionToEdit={versionToEdit}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        show={deleteVersion.showModal}
        title={'Delete version'}
        message={deleteModalMessage}
        onConfirm={confirmDeleteVersion}
        onCancel={resetDeleteModal}
        confirmButtonText={isGitTrackedDelete ? 'Delete and commit' : 'Delete version'}
        cancelButtonText={'Cancel'}
        cancelButtonType="secondary"
        hideCloseIcon={isGitTrackedDelete}
        staticBackdrop={isGitTrackedDelete}
      />

      <DependencyWarningDialog
        open={inUseWarning.show}
        title={resourceType === 'query-library' ? 'Dependent apps or modules found!' : 'Dependent apps found!'}
        message={
          notices?.dependencyMessage?.(inUseWarning.versionName) ||
          `Cannot delete ${inUseWarning.versionName} version of module as it is being used in one or more apps.`
        }
        darkMode={darkMode}
        onClose={() => setInUseWarning({ show: false, versionName: '' })}
      />
    </>
  );
};

function RoutedAppDropdown(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const onBrowseEnvironment = (environment) => {
    const query = new URLSearchParams(location.search || '');
    if (query.has('env')) {
      query.set('env', environment.name);
      navigate(`${location.pathname}?${query.toString()}`);
    }
  };
  return (
    <AppVersionLifecycleProvider loadVersions onBrowseEnvironment={onBrowseEnvironment} {...props}>
      <VersionManagerDropdownContent {...props} />
    </AppVersionLifecycleProvider>
  );
}

function AppDropdown(props) {
  const inRouter = useInRouterContext();
  return inRouter ? (
    <RoutedAppDropdown {...props} />
  ) : (
    <AppVersionLifecycleProvider loadVersions {...props}>
      <VersionManagerDropdownContent {...props} />
    </AppVersionLifecycleProvider>
  );
}

export default function VersionManagerDropdown(props) {
  const lifecycle = useOptionalVersionLifecycle();
  return lifecycle ? <VersionManagerDropdownContent {...props} /> : <AppDropdown {...props} />;
}
