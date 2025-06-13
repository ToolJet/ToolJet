import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { CustomSelect } from './CustomSelect';
import { toast } from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components/ToolTip';
import { decodeEntities } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const appVersionLoadingStatus = Object.freeze({
  loading: 'loading',
  loaded: 'loaded',
  error: 'error',
});

export const AppVersionsManager = function ({ darkMode }) {
  const { moduleId } = useModuleContext();
  const [appVersionStatus, setGetAppVersionStatus] = useState(appVersionLoadingStatus.loading);

  const [deleteVersion, setDeleteVersion] = useState({
    versionId: '',
    versionName: '',
    showModal: false,
  });
  const [forceMenuOpen, setForceMenuOpen] = useState(false);

  const {
    initializedEnvironmentDropdown,
    versionsPromotedToEnvironment,
    lazyLoadAppVersions,
    appVersionsLazyLoaded,
    // setEnvironmentAndVersionsInitStatus,
    changeEditorVersionAction,
    selectedVersion,
    deleteVersionAction,
    selectedEnvironment,
    currentLayout,
    appId,
    releasedVersionId,
    editingVersion,
    setCurrentVersionId,
    currentVersionId,
    creationMode,
    isViewer,
    currentMode,
  } = useStore(
    (state) => ({
      initializedEnvironmentDropdown: state.initializedEnvironmentDropdown,
      versionsPromotedToEnvironment: state.versionsPromotedToEnvironment,
      lazyLoadAppVersions: state.lazyLoadAppVersions,
      appVersionsLazyLoaded: state.appVersionsLazyLoaded,
      // setEnvironmentAndVersionsInitStatus: state.setEnvironmentAndVersionsInitStatus,
      changeEditorVersionAction: state.changeEditorVersionAction,
      selectedVersion: state.selectedVersion,
      deleteVersionAction: state.deleteVersionAction,
      selectedEnvironment: state.selectedEnvironment,
      currentLayout: state.currentLayout,
      appId: state.appStore.modules[moduleId].app.appId,
      releasedVersionId: state.releasedVersionId,
      editingVersion: state.editingVersion,
      setCurrentVersionId: state.setCurrentVersionId,
      currentVersionId: state.currentVersionId,
      creationMode: state.appStore.modules[moduleId].app.creationMode,
      isPublic: state.appStore.modules[moduleId].app.isPublic,
      isViewer: state.appStore.modules[moduleId].isViewer,
      currentMode: state.modeStore.modules[moduleId].currentMode,
    }),
    shallow
  );

  let appCreationMode = creationMode;
  const isEditable = currentMode === 'edit';

  // useEffect(() => {
  //   setEnvironmentAndVersionsInitStatus(true);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  useEffect(() => {
    if (currentVersionId && !appVersionsLazyLoaded) {
      lazyLoadAppVersions(appId);
    }
  }, [currentVersionId, appId, appVersionsLazyLoaded]);

  useEffect(() => {
    if (initializedEnvironmentDropdown) {
      setGetAppVersionStatus(appVersionLoadingStatus.loaded);
    }
  }, [initializedEnvironmentDropdown]);

  const selectVersion = (id) => {
    const isSameVersionSelected = currentVersionId === id;

    if (isSameVersionSelected) {
      return toast('You are already editing this version', {
        icon: '⚠️',
      });
    }

    changeEditorVersionAction(
      appId,
      id,
      (newDeff) => {
        setCurrentVersionId(id);
      },
      (error) => {
        toast.error(error.message);
      }
    );

    return;
  };

  const resetDeleteModal = () => {
    setDeleteVersion({
      versionId: '',
      versionName: '',
      showModal: false,
    });
  };

  const deleteAppVersion = (versionId, versionName) => {
    const deleteingToastId = toast.loading('Deleting version...');
    deleteVersionAction(
      appId,
      versionId,
      () => {
        toast.dismiss(deleteingToastId);
        toast.success(`Version - ${decodeEntities(versionName)} Deleted`);
        resetDeleteModal();
        setGetAppVersionStatus(appVersionLoadingStatus.loaded);
      },
      (error) => {
        toast.dismiss(deleteingToastId);
        toast.error(error?.error ?? 'Oops, something went wrong');
        setGetAppVersionStatus(appVersionLoadingStatus.error);
        resetDeleteModal();
      }
    );
  };

  const options = versionsPromotedToEnvironment.map((appVersion) => ({
    value: appVersion.id,
    isReleasedVersion: appVersion.id === releasedVersionId,
    appVersionName: appVersion.name,
    label: (
      <div className="row align-items-center app-version-list-item">
        <div className="col-10">
          <ToolTip message="Current released version" show={appVersion.id === releasedVersionId} placement="right">
            <div
              className={cx('app-version-name text-truncate', {
                'color-light-green': appVersion.id === releasedVersionId,
              })}
              style={{ maxWidth: '100%' }}
            >
              {decodeEntities(appVersion.name)}
            </div>
          </ToolTip>
        </div>
        {isEditable && appVersion.id !== releasedVersionId && (
          <div
            className="col cursor-pointer m-auto app-version-delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteVersion({
                versionId: appVersion.id,
                versionName: appVersion.name,
                showModal: true,
              });
            }}
          >
            <svg
              width="13"
              height="14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-cy={`${appVersion.name.toLowerCase().replace(/\s+/g, '-')}-delete-icon`}
            >
              <path
                d="M2.612 13.246c-.355 0-.663-.13-.925-.392a1.265 1.265 0 01-.391-.925V2.596h-.184a.645.645 0 01-.475-.192.645.645 0 01-.191-.475c0-.189.064-.347.191-.475a.645.645 0 01.475-.191h2.884c0-.19.064-.348.191-.475a.645.645 0 01.475-.192H8.03c.189 0 .35.067.483.2a.64.64 0 01.2.467h2.867c.189 0 .347.064.475.191a.645.645 0 01.192.475.645.645 0 01-.192.475.645.645 0 01-.475.192h-.183v9.333c0 .356-.13.664-.392.925-.261.261-.57.392-.925.392H2.612zm0-10.65v9.333h7.467V2.596H2.612zm1.734 7.4c0 .155.055.289.166.4a.545.545 0 00.4.167.565.565 0 00.417-.167.545.545 0 00.167-.4V4.513a.579.579 0 00-.175-.425.56.56 0 00-.409-.175.526.526 0 00-.408.175.61.61 0 00-.158.425v5.483zm2.85 0c0 .155.058.289.175.4a.573.573 0 00.408.167.565.565 0 00.417-.167.545.545 0 00.166-.4V4.513a.579.579 0 00-.175-.425.56.56 0 00-.408-.175.552.552 0 00-.417.175.594.594 0 00-.166.425v5.483zm-4.584-7.4v9.333-9.333z"
                fill="#EB1414"
              ></path>
            </svg>
          </div>
        )}
      </div>
    ),
  }));

  const onMenuOpen = async () => {
    if (!appVersionsLazyLoaded) {
      setGetAppVersionStatus(appVersionLoadingStatus.loading);
      await lazyLoadAppVersions(appId);
      setGetAppVersionStatus(appVersionLoadingStatus.loaded);
    }
    setForceMenuOpen(!forceMenuOpen);
  };

  const customSelectProps = {
    appId,
    editingVersion,
    setDeleteVersion,
    deleteVersion,
    deleteAppVersion,
    resetDeleteModal,
    appCreationMode,
  };

  /* Force close is not working with usual blur function of react-select */
  const clickedOutsideRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (clickedOutsideRef.current && !clickedOutsideRef.current.contains(event.target)) {
        if (!forceMenuOpen) {
          setForceMenuOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickedOutsideRef]);
  return (
    <div
      className="d-flex align-items-center p-0"
      style={{ margin: isViewer && currentLayout === 'mobile' ? '0px' : '0 24px' }}
      ref={clickedOutsideRef}
    >
      <div
        className={cx('d-flex version-manager-container p-0', {
          'w-100': isViewer && currentLayout === 'mobile',
        })}
      >
        <div
          className={cx('app-versions-selector', {
            'w-100': isViewer && currentLayout === 'mobile',
          })}
          data-cy="app-version-selector"
        >
          <CustomSelect
            isLoading={appVersionStatus === 'loading'}
            options={options}
            value={selectedVersion?.id}
            onChange={(id) => selectVersion(id)}
            {...customSelectProps}
            onMenuOpen={onMenuOpen}
            onMenuClose={() => setForceMenuOpen(false)}
            menuIsOpen={forceMenuOpen}
            currentEnvironment={selectedEnvironment}
            isEditable={isEditable}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
};
