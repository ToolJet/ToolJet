import React, { useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import VersionSwitcherButton from './VersionSwitcherButton';
import EnvironmentToggle from './EnvironmentToggle';
import VersionSearchField from './VersionSearchField';
import VersionDropdownItem from './VersionDropdownItem';
import CreateDraftButton from './CreateDraftButton';
import VersionItemSkeleton from './VersionItemSkeleton';
import { CreateVersionModal, CreateDraftVersionModal, EditVersionModal } from '.';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import './style.scss';

const VersionManagerDropdown = ({ darkMode = false, ...props }) => {
  const { moduleId } = useModuleContext();

  const { appId, currentVersionId, currentEnvironment, environments, changeEditorVersionAction, setCurrentVersionId } =
    useStore(
      (state) => ({
        appId: state.appStore.modules[moduleId].app.appId,
        currentVersionId: state.currentVersionId,
        currentEnvironment: state.selectedEnvironment,
        environments: state.environments || [],
        changeEditorVersionAction: state.changeEditorVersionAction,
        setCurrentVersionId: state.setCurrentVersionId,
      }),
      shallow
    );

  const {
    versions,
    filteredVersions,
    isDropdownOpen,
    searchQuery,
    selectedEnvironment,
    loading,
    setDropdownOpen,
    setSearchQuery,
    setSelectedEnvironment,
    setEnvironments,
    fetchVersions,
  } = useVersionManagerStore();

  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showEditVersionModal, setShowEditVersionModal] = useState(false);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Fetch versions on mount or when appId changes
  useEffect(() => {
    if (appId) {
      fetchVersions(appId);
    }
  }, [appId, fetchVersions]);

  // Set environments in store
  useEffect(() => {
    if (environments && environments.length > 0) {
      setEnvironments(environments);
    }
  }, [environments, setEnvironments]);

  // Set initial environment
  useEffect(() => {
    if (currentEnvironment && !selectedEnvironment) {
      setSelectedEnvironment(currentEnvironment);
    }
  }, [currentEnvironment, selectedEnvironment, setSelectedEnvironment]);

  // Current version data
  const currentVersion = versions.find((v) => v.id === currentVersionId);

  // Check if app already has a draft
  // const hasDraft = versions.some((v) => v.status === 'DRAFT');
  const hasPublished = versions.some((v) => v.status === 'PUBLISHED');

  const handleToggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchQuery(''); // Clear search when opening
    }
  };

  const handleEnvironmentChange = (env) => {
    setSelectedEnvironment(env);
    // Environment change will trigger re-filtering in store
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleCreateDraft = () => {
    setShowCreateDraftModal(true);
  };

  const handleVersionSelect = (version) => {
    const isSameVersionSelected = currentVersionId === version.id;

    if (isSameVersionSelected) {
      toast('You are already viewing this version', {
        icon: '⚠️',
      });
      setDropdownOpen(false);
      return;
    }

    // Close dropdown
    setDropdownOpen(false);

    // Use the same action as the original AppVersionsManager
    changeEditorVersionAction(
      appId,
      version.id,
      () => {
        setCurrentVersionId(version.id);
      },
      (error) => {
        toast.error(error.message || 'Failed to switch version');
      }
    );
  };

  const handlePromoteDraft = () => {
    setShowPromoteModal(true);
    setDropdownOpen(false);
  };

  const handleCreateVersion = () => {
    setShowPromoteModal(true);
    setDropdownOpen(false);
  };
  const handleEditVersion = () => {
    setShowEditVersionModal(true);
    setDropdownOpen(false);
  };

  return (
    <>
      <div ref={buttonRef}>
        <VersionSwitcherButton
          version={currentVersion || { name: 'v1' }}
          environment={selectedEnvironment || currentEnvironment}
          onClick={handleToggleDropdown}
          darkMode={darkMode}
        />
      </div>

      <Overlay
        show={isDropdownOpen}
        target={buttonRef.current}
        placement="bottom-start"
        rootClose
        onHide={() => setDropdownOpen(false)}
      >
        <Popover
          id="version-manager-popover"
          className="version-manager-popover"
          ref={popoverRef}
          style={{
            minWidth: '320px',
            maxWidth: '400px',
            borderRadius: '8px',
            border: '1px solid var(--border-weak)',
            boxShadow: '0px 0px 1px rgba(48, 50, 51, 0.05), 0px 1px 1px rgba(48, 50, 51, 0.1)',
            padding: 0,
          }}
        >
          <Popover.Body style={{ padding: 0 }}>
            {/* Environment Toggle - Integrated at top */}
            <div>
              <EnvironmentToggle
                environments={environments}
                selectedEnvironment={selectedEnvironment}
                onEnvironmentChange={handleEnvironmentChange}
              />
            </div>

            {/* Search Field */}
            <div>
              <VersionSearchField value={searchQuery} onChange={handleSearchChange} />
            </div>

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
                filteredVersions.map((version) => (
                  <VersionDropdownItem
                    key={version.id}
                    version={version}
                    isSelected={version.id === currentVersionId}
                    currentEnvironment={selectedEnvironment}
                    environments={environments}
                    onSelect={() => handleVersionSelect(version)}
                    onPromote={handlePromoteDraft}
                    onCreateVersion={handleCreateVersion}
                    onEdit={handleEditVersion}
                    appId={appId}
                  />
                ))
              )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--border-weak)' }} />

            {/* Create Draft Button */}
            <CreateDraftButton onClick={handleCreateDraft} disabled={!hasPublished} />
          </Popover.Body>
        </Popover>
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
        setShowCreateAppVersion={setShowPromoteModal}
        {...props}
      />

      {/* Edit Version Modal */}
      <EditVersionModal
        showEditAppVersion={showEditVersionModal}
        setShowEditAppVersion={setShowEditVersionModal}
        {...props}
      />
    </>
  );
};

export default VersionManagerDropdown;
