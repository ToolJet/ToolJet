import React, { useState, useEffect, useContext } from 'react';
import cx from 'classnames';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import { ConfirmDialog, ToolTip } from '@/_components';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { BreadCrumbContext } from '@/App/App';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox } from '@/_components/SearchBox';
import _ from 'lodash';
import { validateName, handleHttpErrorMessages, getWorkspaceId } from '@/_helpers/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import FolderSkeleton from '@/_ui/FolderSkeleton/FolderSkeleton';
import { Button } from '@/components/ui/Button/Button';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { authenticationService } from '@/_services';

export const Folders = function Folders({
  folders,
  foldersLoading,
  currentFolder,
  folderChanged,
  foldersChanged,
  canCreateFolder,
  canUpdateFolder,
  canDeleteFolder,
  canCreateApp,
  darkMode,
  appType,
}) {
  const [isLoading, setLoadingStatus] = useState(foldersLoading);
  const [showInput, setShowInput] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setCreationStatus] = useState(false);
  const [isDeleting, setDeletionStatus] = useState(false);
  const [isUpdating, setUpdationStatus] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [updatingFolder, setUpdatingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [activeFolder, setActiveFolder] = useState(currentFolder || {});
  const [filteredData, setFilteredData] = useState(folders);
  const [errorText, setErrorText] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  useEffect(() => {
    setLoadingStatus(foldersLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersLoading]);

  useEffect(() => {
    setFilteredData(folders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  useEffect(() => {
    const noFolder = !currentFolder || _.isEmpty(currentFolder);
    const label = noFolder
      ? `All ${appType === 'workflow' ? 'workflows' : appType === 'module' ? 'modules' : 'apps'}`
      : currentFolder.name;

    updateSidebarNAV(label);
    setActiveFolder(currentFolder || {});
  }, [appType, currentFolder, location.pathname]);

  const handleSearch = (e) => {
    const value = e?.target?.value;
    const filtered = folders.filter((item) => item?.name?.toLowerCase().includes(value?.toLowerCase()));
    setFilteredData(filtered);
  };

  function saveFolder() {
    const newName = newFolderName?.trim();
    if (!newName) {
      setErrorText("Folder name can't be empty");
      return;
    }
    if (!errorText) {
      setCreationStatus(true);
      folderService
        .create(newFolderName, appType)
        .then((data) => {
          toast.success('Folder created.');
          setCreationStatus(false);
          setShowForm(false);
          setNewFolderName('');
          handleFolderChange({});
          foldersChanged();
          posthogHelper.captureEvent('create_folder', {
            workspace_id:
              authenticationService?.currentUserValue?.organization_id ||
              authenticationService?.currentSessionValue?.current_organization_id,
            folder_id: data?.id,
          });
        })
        .catch((error) => {
          handleHttpErrorMessages(error, 'folder');
          setCreationStatus(false);
        });
    }
  }

  const getDefaultLabel = () => {
    return `All ${appType === 'workflow' ? 'workflows' : appType === 'module' ? 'modules' : 'apps'}`;
  };

  function handleFolderChange(folder) {
    if (_.isEmpty(folder)) {
      setActiveFolder({});
    } else {
      setActiveFolder(folder);
    }
    folderChanged(folder);
    updateSidebarNAV(updateSidebarNAV(folder?.name ?? getDefaultLabel()));
    //update the url query parameter with folder name
    updateFolderQuery(folder?.name);
  }

  function updateFolderQuery(name) {
    const search = `${name ? `?folder=${name}` : ''}`;
    navigate(
      {
        pathname: `/${getWorkspaceId()}${
          appType === 'workflow' ? '/workflows' : appType === 'module' ? '/modules' : ''
        }`,
        search,
      },
      { replace: true }
    );
  }

  function deleteFolder(folder) {
    setShowDeleteConfirmation(true);
    setDeletingFolder(folder);
  }

  function updateFolder(folder) {
    setNewFolderName(folder.name);
    setShowUpdateForm(true);
    setUpdatingFolder(folder);
  }

  function executeDeletion() {
    setDeletionStatus(true);
    folderService
      .deleteFolder(deletingFolder.id)
      .then(() => {
        toast.success('Folder has been deleted.');
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
        foldersChanged();
        handleFolderChange({});
      })
      .catch(({ error }) => {
        toast.error(error);
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
      });
  }

  function cancelDeleteDialog() {
    setShowDeleteConfirmation(false);
    setDeletingFolder(null);
  }

  function executeEditFolder() {
    const folderName = newFolderName?.trim();
    if (folderName === updatingFolder?.name) {
      setUpdationStatus(false);
      setShowUpdateForm(false);
      return;
    }
    if (!errorText) {
      setUpdationStatus(true);
      folderService
        .updateFolder(folderName, updatingFolder.id)
        .then(() => {
          toast.success('Folder has been updated.');
          setUpdationStatus(false);
          setShowUpdateForm(false);
          setNewFolderName('');
          updateFolderQuery(folderName);
          updateSidebarNAV(newFolderName);
          foldersChanged();
        })
        .catch((error) => {
          handleHttpErrorMessages(error, 'folder');
          setUpdationStatus(false);
        });
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (showUpdateForm) {
        executeEditFolder();
      } else {
        saveFolder();
      }
    }
  };

  const handleInputChange = (e) => {
    setErrorText('');
    const error = validateName(e.target.value, 'Folder name', true, false, false, true, false, true);
    if (!error.status) {
      setErrorText(error.errorMsg);
    }
    setNewFolderName(e.target.value);
  };

  const closeModal = () => {
    setErrorText('');
    showUpdateForm ? setShowUpdateForm(false) : setShowForm(false);
  };

  function handleClose() {
    setShowInput(false);
    setFilteredData(folders);
  }

  return (
    <div
      className={`w-100 folder-list ${!canCreateApp && 'folder-list-user'}`}
      style={{ padding: '24px 20px 20px 20px', width: '248px' }}
    >
      <ConfirmDialog
        show={showDeleteConfirmation}
        message={t(
          'homePage.foldersSection.wishToDeleteFolder',
          `Are you sure you want to delete the folder {{folderName}}? Apps within the folder will not be deleted.`,
          {
            folderName: deletingFolder?.name,
          }
        )}
        confirmButtonLoading={isDeleting}
        onConfirm={() => executeDeletion()}
        onCancel={() => cancelDeleteDialog()}
        darkMode={darkMode}
      />

      <div className="d-flex justify-content-between" data-cy="folder-info" style={{ marginBottom: '8px' }}>
        {!showInput ? (
          <>
            <div className="folder-info tj-text-xsm">
              {t('homePage.foldersSection.filteredData', 'Folders')}
              {!isLoading && filteredData && filteredData.length > 0 && `(${filteredData.length})`}
            </div>
            <div className="d-flex folder-header-icons-wrap">
              {canCreateFolder && (
                <>
                  <Button
                    size="medium"
                    variant="ghost"
                    iconOnly
                    ariaLabel="Create new folder"
                    onClick={() => {
                      posthogHelper.captureEvent('create_new_folder', {
                        workspace_id:
                          authenticationService?.currentUserValue?.organization_id ||
                          authenticationService?.currentSessionValue?.current_organization_id,
                      });
                      setNewFolderName('');
                      setShowForm(true);
                    }}
                    data-cy="create-new-folder-button"
                  >
                    <SolidIcon name="plus" width="14" fill={darkMode ? '#CFD3D8E6' : '#6A727C'} />
                  </Button>
                  <Button
                    size="medium"
                    variant="ghost"
                    iconOnly
                    ariaLabel="Search for folders"
                    onClick={() => {
                      setShowInput(true);
                    }}
                    data-cy="folder-search-icon"
                  >
                    <SolidIcon
                      name="search"
                      width="14"
                      fill={darkMode ? '#CFD3D8E6' : '#6A727C'}
                      className="tw-relative tw-top-[2px]"
                    />
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <SearchBox
            dataCy={`query-manager`}
            width="248px"
            callBack={handleSearch}
            placeholder={'Search for folders'}
            customClass="tj-common-search-input"
            onClearCallback={handleClose}
            autoFocus={true}
          />
        )}
      </div>

      {!isLoading && (
        <div data-testid="applicationFoldersList" className={cx(`mb-1 all-apps-link-cotainer`)}>
          <a
            className={cx(
              `list-group-item border-0 list-group-item-action d-flex align-items-center all-apps-link tj-text-xsm`,
              {
                'tw-bg-interactive-default': _.isEmpty(activeFolder),
              }
            )}
            style={{ height: '32px' }}
            onClick={() => handleFolderChange({})}
            data-cy="all-applications-link"
          >
            {appType === 'module'
              ? 'All modules'
              : t(
                  `${appType === 'workflow' ? 'workflowsDashboard' : 'homePage'}.foldersSection.allApplications`,
                  'All apps'
                )}
          </a>
        </div>
      )}
      {isLoading && <FolderSkeleton />}
      {!isLoading &&
        filteredData &&
        filteredData.length > 0 &&
        filteredData.map((folder, index) => (
          <a
            key={index}
            className={cx(
              `folder-list-group-item rounded-2 list-group-item h-4 mb-1 list-group-item-action no-border d-flex align-items-center`,
              {
                'tw-bg-interactive-default': activeFolder.id === folder.id,
              }
            )}
            onClick={() => {
              handleFolderChange(folder);
            }}
            data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-list-card`}
          >
            <ToolTip message={folder.name}>
              <div
                className="flex-grow-1 tj-folder-list tj-text-xsm"
                data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-name`}
              >
                {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
              </div>
            </ToolTip>
            {(canDeleteFolder || canUpdateFolder) && (
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Stop the click event from bubbling up to the <a> tag
                }}
              >
                <FolderMenu
                  canDeleteFolder={canDeleteFolder}
                  canUpdateFolder={canUpdateFolder}
                  deleteFolder={() => deleteFolder(folder)}
                  editFolder={() => updateFolder(folder)}
                  darkMode={darkMode}
                  dataCy={folder.name}
                />
              </div>
            )}
          </a>
        ))}

      <Modal
        show={showForm || showUpdateForm}
        closeModal={closeModal}
        title={
          showUpdateForm
            ? t('homePage.foldersSection.editFolder', 'Edit Folder')
            : t('homePage.foldersSection.createFolder', 'Create folder')
        }
      >
        <div className="row workspace-folder-modal">
          <div className="col modal-main tj-app-input">
            <input
              type="text"
              onChange={handleInputChange}
              className="form-control"
              placeholder={t('homePage.foldersSection.folderName', 'folder name')}
              disabled={isCreating || isUpdating}
              value={newFolderName}
              maxLength={50}
              data-cy="folder-name-input"
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <label className="tj-input-error">{errorText || ''}</label>
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn justify-content-end">
            <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button">
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>
            <ButtonSolid
              onClick={showUpdateForm ? executeEditFolder : saveFolder}
              data-cy={`${showUpdateForm ? 'update-folder' : 'create-folder'}-button`}
              isLoading={isCreating || isUpdating}
            >
              {showUpdateForm
                ? t('homePage.foldersSection.editFolder', 'Edit Folder')
                : t('homePage.foldersSection.createFolder', 'Create folder')}
            </ButtonSolid>
          </div>
        </div>
      </Modal>
    </div>
  );
};
