import React, { useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import VersionSwitcherButton from './VersionSwitcherButton';
import VersionSearchField from './VersionSearchField';
import VersionDropdownItem from './VersionDropdownItem';
import CreateDraftButton from './CreateDraftButton';
import VersionItemSkeleton from './VersionItemSkeleton';
import { CreateVersionModal, CreateDraftVersionModal, EditVersionModal } from '.';
import { ConfirmDialog } from '@/_components';
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
    orgGit,
  } = useStore(
    (state) => ({
      appId: state.appStore.modules[moduleId].app.appId,
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
      orgGit: state.orgGit,
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

  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showEditVersionModal, setShowEditVersionModal] = useState(false);
  const [versionToPromote, setVersionToPromote] = useState(null);
  const [versionToEdit, setVersionToEdit] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Sync selectedEnvironmentFilter with global currentEnvironment whenever it changes
  // This ensures the filter is correct after page reloads from environment switches
  useEffect(() => {
    if (currentEnvironment) {
      setSelectedEnvironmentFilter(currentEnvironment);
    }
  }, [currentEnvironment, setSelectedEnvironmentFilter]);

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
        fetchVersionsForEnvironment(appId, currentEnvironment.id);
      }
    }
  }, [isDropdownOpen, currentEnvironment, appId, fetchVersionsForEnvironment]);

  // Current version data - use selectedVersion from global store as source of truth
  const currentVersion = selectedVersion || versions.find((v) => v.id === currentVersionId);
  // Check if there's a draft in development environment (global check across all environments)
  // Drafts only exist in Development environment
  const hasDraft = developmentVersions.some((v) => v.status === 'DRAFT');
  // Check if there's a draft version of type 'version' (not branch)
  const hasVersionTypeDraft = developmentVersions.some(
    (v) => v.status === 'DRAFT' && (v.versionType === 'version' || v.version_type === 'version')
  );
  const hasPublished = versions.some((v) => v.status === 'PUBLISHED');
  
  // Only disable create draft button when:
  // 1. Git is configured AND there's already a version-type draft
  // When git is not configured, allow multiple drafts (old behavior)
  const isGitSyncEnabled = orgGit?.git_ssh?.is_enabled || orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled;
  const shouldDisableCreateDraft = orgGit && isGitSyncEnabled && hasVersionTypeDraft;

  // Helper to close dropdown and reset UI state
  const closeDropdown = () => {
    setDropdownOpen(false);
    // Reset environment filter to global environment when dropdown closes
    // selectedEnvironmentFilter is just a UI state for browsing, not the actual global environment
    setSelectedEnvironmentFilter(currentEnvironment);
  };

  const handleToggleDropdown = () => {
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
    // Update local filter and lazy load versions for the selected environment
    setSelectedEnvironmentFilter(env);
    if (appId && env.id) {
      fetchVersionsForEnvironment(appId, env.id);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleCreateDraft = () => {
    setShowCreateDraftModal(true);
  };

  const handleVersionSelect = (version) => {
    console.log('handleVersionSelect called', {
      version,
      currentVersionId,
      selectedEnvironmentFilter,
      currentEnvironment,
    });

    // Check if the selected environment filter is different from current global environment
    const isDifferentEnvironment = selectedEnvironmentFilter?.id !== currentEnvironment?.id;

    // Only early return if same version AND same environment
    const isSameVersionSelected = currentVersionId === version.id;
    const isSameEnvironment = !isDifferentEnvironment;

    if (isSameVersionSelected && isSameEnvironment) {
      console.log('Same version and environment, closing dropdown');
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

  // Delete version modal state
  const [deleteVersion, setDeleteVersion] = useState({ versionId: '', versionName: '', showModal: false });

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
        toast.error(error?.message || 'Failed to delete version');
        resetDeleteModal();
      }
    );
  };

  const renderPopover = (overlayProps) => (
    <Popover
      id="version-manager-popover"
      className="version-manager-popover"
      ref={popoverRef}
      {...overlayProps}
      style={{
        ...overlayProps?.style,
        minWidth: '350px',
        borderRadius: '8px',
        border: '1px solid var(--border-weak)',
        boxShadow: '0px 0px 1px rgba(48, 50, 51, 0.05), 0px 1px 1px rgba(48, 50, 51, 0.1)',
        padding: 0,
      }}
    >
      <Popover.Body style={{ padding: 0 }}>
        {/* Environment Toggle - Integrated at top */}
        <div>
          <EnvironmentSwitcher
            environments={environments}
            selectedEnvironment={selectedEnvironmentFilter || currentEnvironment}
            onEnvironmentChange={handleEnvironmentChange}
            darkMode={darkMode}
          />
        </div>

        {/* Search Field - Only show if more than 5 versions */}
        {versions.length > 5 && (
          <div>
            <VersionSearchField value={searchQuery} onChange={handleSearchChange} />
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

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
          ) : filteredVersions.length === 0 ? (
            <div
              className="d-flex align-items-center justify-content-center tj-text-sm"
              style={{
                padding: '24px 12px',
                color: 'var(--text-secondary)',
              }}
            >
              {searchQuery ? 'No versions found' : 'No versions available'}
            </div>
          ) : (
            filteredVersions.map((version) => {
              // Only show as selected if:
              // 1. The version ID matches the current version ID
              // 2. AND we're viewing the current global environment (not browsing another environment)
              const isViewingCurrentEnvironment = selectedEnvironmentFilter?.id === currentEnvironment?.id;
              const isVersionSelected = version.id === currentVersionId && isViewingCurrentEnvironment;

              return (
                <VersionDropdownItem
                  key={version.id}
                  version={version}
                  isSelected={isVersionSelected}
                  currentEnvironment={selectedEnvironmentFilter || currentEnvironment}
                  environments={environments}
                  onSelect={() => handleVersionSelect(version)}
                  onPromote={() => handlePromoteDraft(version)}
                  onCreateVersion={() => handleCreateVersion(version)}
                  onEdit={(v) => {
                    setVersionToEdit(v);
                    setShowEditVersionModal(true);
                    closeDropdown();
                  }}
                  onDelete={(v) => openDeleteModal(v)}
                  appId={appId}
                />
              );
            })
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

        {/* Create Draft Button - disabled if branching is enabled AND version-type draft already exists */}
        <CreateDraftButton onClick={handleCreateDraft} disabled={shouldDisableCreateDraft} />
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
        onHide={closeDropdown}
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
              zIndex: 1050, // Ensure it's above other content
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

      {/* Edit Version Modal */}
      <EditVersionModal
        showEditAppVersion={showEditVersionModal}
        setShowEditAppVersion={(show) => {
          setShowEditVersionModal(show);
          if (!show) {
            setVersionToEdit(null);
          }
        }}
        versionToEdit={versionToEdit}
        {...props}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        show={deleteVersion.showModal}
        title={'Delete version'}
        message={`This version will be permanently deleted and cannot be recovered. Are you sure you want to continue?`}
        onConfirm={confirmDeleteVersion}
        onCancel={resetDeleteModal}
        confirmButtonText={'Delete version'}
        cancelButtonText={'Cancel'}
        cancelButtonType="tertiary"
      />
    </>
  );
};

export default VersionManagerDropdown;
