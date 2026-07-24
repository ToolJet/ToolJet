import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Overlay, Popover } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import cx from 'classnames';
import VersionSwitcherButton from './VersionSwitcherButton';
import VersionSearchField from './VersionSearchField';
import VersionDropdownItem from './VersionDropdownItem';
import CreateDraftButton from './CreateDraftButton';
import VersionItemSkeleton from './VersionItemSkeleton';
import { CreateVersionModal, CreateDraftVersionModal, EditVersionModal } from '.';
import { ConfirmDialog } from '@/_components';
import { Button } from '@/components/ui/Button/Button';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { useGitSyncConfig } from '@/AppBuilder/_hooks/useGitSyncConfig';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { EnvironmentSwitcher } from '@/modules/Appbuilder/components';
import './style.scss';

const VersionManagerDropdown = ({ darkMode = false, ...props }) => {
  const { moduleId } = useModuleContext();

  const {
    appId,
    currentVersionId,
    currentEnvironment,
    environments,
    changeEditorVersionAction,
    setCurrentVersionId,
    deleteVersionAction,
    environmentChangedAction,
    releasedVersionId,
    selectedVersion,
    developmentVersions,
    setSelectedVersion,
    fetchDevelopmentVersions,
  } = useStore(
    (state) => ({
      appId: state.appId ?? state.appStore.modules[moduleId]?.app?.appId,
      currentVersionId: state.currentVersionId,
      currentEnvironment: state.selectedEnvironment,
      environments: state.environments || [],
      changeEditorVersionAction: state.changeEditorVersionAction,
      setCurrentVersionId: state.setCurrentVersionId,
      deleteVersionAction: state.deleteVersionAction,
      environmentChangedAction: state.environmentChangedAction,
      releasedVersionId: state.releasedVersionId,
      selectedVersion: state.selectedVersion,
      developmentVersions: state.developmentVersions,
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      setSelectedVersion: state.setSelectedVersion,
    }),
    shallow
  );

  const {
    versions,
    filteredVersions,
    isDropdownOpen,
    searchQuery,
    selectedEnvironmentFilter,
    loading,
    draftVersion,
    setDropdownOpen,
    setSearchQuery,
    setSelectedEnvironmentFilter,
    fetchVersionsForEnvironment,
    refreshVersions,
  } = useVersionManagerStore();

  const { currentBranch, pullApp: pullAppAction } = useWorkspaceBranchesStore(
    (state) => ({ currentBranch: state.currentBranch, pullApp: state.actions.pullApp }),
    shallow
  );

  const appCoRelationId = useStore((state) => state.appStore.modules[moduleId]?.app?.co_relation_id, shallow);

  const { isGitSyncEnabled } = useGitSyncConfig();
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showEditVersionModal, setShowEditVersionModal] = useState(false);
  const [versionToPromote, setVersionToPromote] = useState(null);
  const [versionToEdit, setVersionToEdit] = useState(null);
  const [openMenuVersionId, setOpenMenuVersionId] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [gitVersionStatus, setGitVersionStatus] = useState(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPullingVersion, setIsPullingVersion] = useState(null);

  // Sync selectedEnvironmentFilter with global currentEnvironment whenever it changes.
  // Also refresh the version list immediately so VersionActionButtons reflect the new
  // environment state without waiting for the dropdown to open (e.g. after promote).
  useEffect(() => {
    if (!currentEnvironment) return;
    setSelectedEnvironmentFilter(currentEnvironment);
    if (appId && currentEnvironment.id) {
      fetchVersionsForEnvironment(appId, currentEnvironment.id);
    }
  }, [currentEnvironment?.id, appId, setSelectedEnvironmentFilter, fetchVersionsForEnvironment]);

  // Fetch development versions on mount to check for draft status
  useEffect(() => {
    if (appId) {
      fetchDevelopmentVersions(appId);
    }
  }, [appId, fetchDevelopmentVersions]);

  // Lazy load versions when dropdown opens
  useEffect(() => {
    if (currentEnvironment && isDropdownOpen) {
      if (appId && currentEnvironment.id) {
        // Use a small delay to ensure state is ready
        const timer = setTimeout(() => {
          fetchVersionsForEnvironment(appId, currentEnvironment.id);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isDropdownOpen, currentEnvironment, appId, fetchVersionsForEnvironment]);

  // Current version data - use selectedVersion from global store as source of truth
  // Also check developmentVersions to ensure we have the status field for draft versions
  let currentVersion = selectedVersion || developmentVersions.find((v) => v.id === currentVersionId);

  // If currentVersion doesn't have status field, try to get it from developmentVersions
  if (currentVersion && !currentVersion.status && developmentVersions.length > 0) {
    const versionWithStatus = developmentVersions.find((v) => v.id === currentVersion.id);
    if (versionWithStatus) {
      currentVersion = { ...currentVersion, status: versionWithStatus.status };
    }
  }

  // Check if there's a draft in development environment (global check across all environments)
  // Drafts only exist in Development environment
  const hasDraft = developmentVersions.some((v) => v.status === 'DRAFT');

  // Check if there's only one draft and no other saved versions
  // draftVersions are versions of type 'version' (not branches)
  const draftVersions = developmentVersions.filter((v) => v.versionType === 'version' && v.status === 'DRAFT');
  const savedVersions = developmentVersions.filter((v) => v.status !== 'DRAFT');

  // Disable create draft logic:
  // - Git sync enabled: disable if any draft already exists
  // - Git sync disabled: disable if no published versions AND a draft exists (need published version to create from)
  const shouldDisableCreateDraft = isGitSyncEnabled
    ? draftVersions.length > 0
    : savedVersions.length === 0 && draftVersions.length > 0;

  // Determine tooltip message based on why create draft is disabled
  let createDraftDisabledTooltip = '';
  if (shouldDisableCreateDraft) {
    if (isGitSyncEnabled) {
      createDraftDisabledTooltip = 'Draft version already exists.';
    } else if (savedVersions.length === 0) {
      createDraftDisabledTooltip = 'Draft version can only be created from saved versions.';
    }
  }

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
    if (appId && env.id) {
      fetchVersionsForEnvironment(appId, env.id);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleRefreshFromGit = async () => {
    if (isRefreshing) return;
    if (!appCoRelationId || !isGitSyncEnabled) return;
    setIsRefreshing(true);
    try {
      const tags = await workspaceBranchesService.getEntityTags(appCoRelationId);
      const newStatus = new Map();
      tags.forEach((tag) => {
        const versionName = tag.name.split('/').slice(1).join('/');
        if (!versionName) return;
        // NOTE: `versions` is scoped to the current environment. A version pulled in another
        // environment may incorrectly appear as git-only here.
        const isLocal = versions.some(
          (v) => v.name === versionName && (v.versionType || v.version_type) === 'version' && v.status !== 'DRAFT'
        );
        newStatus.set(versionName, {
          isInGit: true,
          isLocal,
          tagSha: tag.commit?.sha,
          tagName: tag.name,
          tagDescription: tag.message?.trim() || undefined,
        });
      });
      setGitVersionStatus(newStatus);

      // Remove local versions that no longer exist as remote git tags
      const remoteVersionNames = new Set(newStatus.keys());
      const staleVersions = versions.filter(
        (v) =>
          (v.versionType || v.version_type) === 'version' &&
          v.status !== 'DRAFT' &&
          v.id !== releasedVersionId &&
          !remoteVersionNames.has(v.name)
      );

      for (const staleVersion of staleVersions) {
        await new Promise((resolve) => {
          deleteVersionAction(
            appId,
            staleVersion.id,
            () => resolve(),
            (error) => {
              toast.error(error?.error || error?.message || `Failed to remove version "${staleVersion.name}"`);
              resolve();
            }
          );
        });
      }

      if (staleVersions.length > 0) {
        const environmentToRefresh = selectedEnvironmentFilter || currentEnvironment;
        await refreshVersions(appId, environmentToRefresh?.id);
      }
    } catch {
      toast.error('Failed to refresh versions from git');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePullVersion = async (version, gitStatus) => {
    if (!gitStatus?.tagSha) return;
    if (!appId || isPullingVersion) return;
    setIsPullingVersion(version.name);
    try {
      const result = await pullAppAction(appId, gitStatus.tagSha, version.name, gitStatus.tagDescription);
      if (!result || !result.success) {
        toast.error(result?.message || `Failed to pull version "${version.name}"`);
        return;
      }
      const draftVersionId = result?.draftVersionId;
      const environmentToRefresh = selectedEnvironmentFilter || currentEnvironment;
      await refreshVersions(appId, environmentToRefresh?.id);
      toast.success(`Version "${version.name}" pulled successfully`);
      if (draftVersionId) {
        changeEditorVersionAction(
          appId,
          draftVersionId,
          () => {
            setCurrentVersionId(draftVersionId);
          },
          (error) => {
            toast.error(error?.message || 'Failed to switch to pulled version');
          }
        );
      }
      setGitVersionStatus((prev) => {
        const updated = new Map(prev);
        updated.set(version.name, { ...gitStatus, isLocal: true });
        return updated;
      });
    } catch (error) {
      toast.error(error?.message || `Failed to pull ${version.name}`);
    } finally {
      setIsPullingVersion(null);
    }
  };

  const handleCreateDraft = () => {
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

    if (isDifferentEnvironment) {
      // First switch environment, then switch version
      // This updates the global selectedEnvironment
      environmentChangedAction(selectedEnvironmentFilter, () => {
        // After environment switch, change the version
        changeEditorVersionAction(
          appId,
          version.id,
          () => {
            setCurrentVersionId(version.id);
            setSelectedVersion(version);
          },
          (error) => {
            toast.error(error.message || 'Failed to switch version');
          }
        );
      });
    } else {
      // Same environment, just switch version
      changeEditorVersionAction(
        appId,
        version.id,
        () => {
          setCurrentVersionId(version.id);
          setSelectedVersion(version);
        },
        (error) => {
          toast.error(error.message || 'Failed to switch version');
        }
      );
    }
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
  const [deleteVersion, setDeleteVersion] = useState({ versionId: '', versionName: '', showModal: false });
  const [inUseWarning, setInUseWarning] = useState({ show: false, versionName: '' });

  const deleteModalMessage = isGitSyncEnabled ? (
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
    setDeleteVersion({ versionId: version.id, versionName: version.name, showModal: true });
  };

  const resetDeleteModal = () => {
    setDeleteVersion({ versionId: '', versionName: '', showModal: false });
  };

  const confirmDeleteVersion = () => {
    if (!deleteVersion.versionId) return;
    const deletingToast = toast.loading('Deleting version...');
    deleteVersionAction(
      appId,
      deleteVersion.versionId,
      (_newVersionDef) => {
        toast.dismiss(deletingToast);
        toast.success(`Version - ${deleteVersion.versionName} Deleted`);
        resetDeleteModal();
        closeDropdown();
        // Refresh versions for the currently filtered environment, not the global currentEnvironment
        const environmentToRefresh = selectedEnvironmentFilter || currentEnvironment;
        refreshVersions(appId, environmentToRefresh?.id);
      },
      (error) => {
        toast.dismiss(deletingToast);
        if (error?.error?.startsWith('Cannot delete this version.')) {
          setInUseWarning({ show: true, versionName: deleteVersion.versionName });
          resetDeleteModal();
          return;
        }
        toast.error(error?.error || error?.message || 'Failed to delete version');
        resetDeleteModal();
      }
    );
  };

  // Count only actual versions, not sub-branches
  const versionOnlyCount = versions.filter((v) => v.versionType === 'version').length;

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
            {(selectedEnvironmentFilter || currentEnvironment)?.name === 'development' && (
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
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

        {/* Environment Toggle */}
        <div>
          <EnvironmentSwitcher
            environments={environments}
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
                  appId={appId}
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

        <CreateDraftButton
          onClick={handleCreateDraft}
          disabled={shouldDisableCreateDraft}
          disabledTooltip={createDraftDisabledTooltip}
          darkMode={darkMode}
        />
      </Popover.Body>
    </Popover>
  );

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
              zIndex: 1061,
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
          const environmentToRefresh = selectedEnvironmentFilter || currentEnvironment;
          refreshVersions(appId, environmentToRefresh?.id);
          setVersionToPromote(null);
        }}
        {...props}
      />

      {/* Edit Version Modal — only for non-git-sync workspaces */}
      {!isGitSyncEnabled && (
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
        confirmButtonText={isGitSyncEnabled ? 'Delete and commit' : 'Delete version'}
        cancelButtonText={'Cancel'}
        cancelButtonType="secondary"
        hideCloseIcon={isGitSyncEnabled}
        staticBackdrop={isGitSyncEnabled}
      />

      {/* In-use warning modal — portalled to body to escape stacking contexts */}
      {inUseWarning.show &&
        ReactDOM.createPortal(
          <div
            className={darkMode ? 'dark-theme' : ''}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setInUseWarning({ show: false, versionName: '' });
            }}
          >
            <div
              style={{
                width: 360,
                background: 'var(--background-surface-layer-01)',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '20px 24px 0' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'var(--background-error-weak)',
                  }}
                >
                  <SolidIcon name="warning" width="24" fill="var(--icon-danger)" />
                </div>
              </div>
              <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-default)', margin: 0 }}>
                  Dependent apps found!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-medium)', lineHeight: 1.6, margin: 0 }}>
                  {`Cannot delete ${inUseWarning.versionName} version of module as it is being used in one or more apps.`}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <ButtonSolid variant="tertiary" onClick={() => setInUseWarning({ show: false, versionName: '' })}>
                  I understand
                </ButtonSolid>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default VersionManagerDropdown;
