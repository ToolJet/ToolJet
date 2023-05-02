import React, { useState, useEffect, useContext } from 'react';
import cx from 'classnames';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import { ConfirmDialog } from '@/_components';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { BreadCrumbContext } from '@/App/App';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { SearchBox } from '@/_components/SearchBox';
import _ from 'lodash';

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
    updateSidebarNAV('All apps');
  }, []);

  const handleSearch = (e) => {
    const value = e?.target?.value;
    const filtered = folders.filter((item) => item?.name?.toLowerCase().includes(value?.toLowerCase()));
    setFilteredData(filtered);
  };

  function saveFolder() {
    if (validateName()) {
      setCreationStatus(true);
      folderService
        .create(newFolderName)
        .then(() => {
          toast.success('Folder created.');
          setCreationStatus(false);
          setShowForm(false);
          setNewFolderName('');
          handleFolderChange({});
          foldersChanged();
        })
        .catch(({ error }) => {
          toast.error('Error creating folder: ' + error);
          setCreationStatus(false);
          setShowForm(false);
          setNewFolderName('');
        });
    }
  }

  function handleFolderChange(folder) {
    if (_.isEmpty(folder)) {
      setActiveFolder({});
    } else {
      setActiveFolder(folder);
    }
    folderChanged(folder);
    updateSidebarNAV(folder?.name ?? 'All apps');
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

  function validateName() {
    if (!newFolderName?.trim()) {
      toast.error('Folder name cannot be empty.');
      return false;
    }

    if (newFolderName?.trim().length > 25) {
      toast.error('Folder name cannot be longer than 25 characters.');
      return false;
    }
    return true;
  }

  function executeEditFolder() {
    if (validateName()) {
      setUpdationStatus(true);
      folderService
        .updateFolder(newFolderName, updatingFolder.id)
        .then(() => {
          toast.success('Folder has been updated.');
          setUpdationStatus(false);
          setShowUpdateForm(false);
          setNewFolderName('');
          updateSidebarNAV(newFolderName);
          foldersChanged();
        })
        .catch(({ error }) => {
          toast.error(error);
          setNewFolderName('');
          setUpdationStatus(false);
        });
    }
  }

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
          `Are you sure you want to delete the folder? Apps within the folder will not be deleted.`
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
                  <div
                    className="folder-create-btn"
                    onClick={() => {
                      setNewFolderName('');
                      setShowForm(true);
                    }}
                    data-cy="create-new-folder-button"
                  >
                    <SolidIcon name="plus" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
                  </div>
                  <div
                    className="folder-create-btn"
                    onClick={() => {
                      setShowInput(true);
                    }}
                  >
                    <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <SearchBox
            dataCy={`query-manager`}
            width="248px"
            callBack={handleSearch}
            placeholder={'search for folders'}
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
                'bg-light-indigo': _.isEmpty(activeFolder) && !darkMode,
                'bg-dark-indigo': _.isEmpty(activeFolder) && darkMode,
              }
            )}
            style={{ height: '32px' }}
            onClick={() => handleFolderChange({})}
            data-cy="all-applications-link"
          >
            {t('homePage.foldersSection.allApplications', 'All apps')}
          </a>
        </div>
      )}
      {isLoading && <Skeleton count={3} height={22} className="mb-1" />}
      {!isLoading &&
        filteredData &&
        filteredData.length > 0 &&
        filteredData.map((folder, index) => (
          <a
            key={index}
            className={cx(
              `folder-list-group-item rounded-2 list-group-item h-4 mb-1 list-group-item-action no-border d-flex align-items-center`,
              {
                'bg-light-indigo': activeFolder.id === folder.id && !darkMode,
                'bg-dark-indigo': activeFolder.id === folder.id && darkMode,
              }
            )}
            onClick={() => handleFolderChange(folder)}
            data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-list-card`}
          >
            <div
              className="flex-grow-1 tj-folder-list tj-text-xsm"
              data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-name`}
            >
              {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
            </div>
            {(canDeleteFolder || canUpdateFolder) && (
              <FolderMenu
                canDeleteFolder={canDeleteFolder}
                canUpdateFolder={canUpdateFolder}
                deleteFolder={() => deleteFolder(folder)}
                editFolder={() => updateFolder(folder)}
                darkMode={darkMode}
              />
            )}
          </a>
        ))}

      <Modal
        show={showForm || showUpdateForm}
        closeModal={() => (showUpdateForm ? setShowUpdateForm(false) : setShowForm(false))}
        title={
          showUpdateForm
            ? t('homePage.foldersSection.updateFolder', 'Update Folder')
            : t('homePage.foldersSection.createFolder', 'Create folder')
        }
      >
        <div className="row">
          <div className="col modal-main tj-app-input">
            <input
              type="text"
              onChange={(e) => setNewFolderName(e.target.value)}
              className="form-control"
              placeholder={t('homePage.foldersSection.folderName', 'folder name')}
              disabled={isCreating || isUpdating}
              value={newFolderName}
              maxLength={25}
              data-cy="folder-name-input"
              autoFocus
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <ButtonSolid
              variant="tertiary"
              onClick={() => (showUpdateForm ? setShowUpdateForm(false) : setShowForm(false))}
              data-cy="cancel-button"
            >
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>
            <ButtonSolid
              onClick={showUpdateForm ? executeEditFolder : saveFolder}
              data-cy={`${showUpdateForm ? 'update-folder' : 'create-folder'}-button`}
              isLoading={isCreating || isUpdating}
            >
              {showUpdateForm
                ? t('homePage.foldersSection.updateFolder', 'Update Folder')
                : t('homePage.foldersSection.createFolder', 'Create folder')}
            </ButtonSolid>
          </div>
        </div>
      </Modal>
    </div>
  );
};
