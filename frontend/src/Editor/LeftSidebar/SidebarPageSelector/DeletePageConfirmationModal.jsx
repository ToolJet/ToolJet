import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import Trash from '@/_ui/Icon/solidIcons/Trash';

export function DeletePageConfirmationModal() {
  const darkMode = false;
  const editingPage = useStore((state) => state.editingPage);
  const show = useStore((state) => state.showDeleteConfirmationModal);
  const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
  const deletePageGroup = useStore((state) => state.deletePageGroup);
  const deletePage = useStore((state) => state.deletePage);
  const { t } = useTranslation();

  const handleClose = () => {
    toggleDeleteConfirmationModal(false);
  };

  const handleConfirm = () => {
    deletePage(editingPage?.id);
  };
  const message = `Are you sure you want to delete ${editingPage?.name} page?`;

  const cancelButtonText = 'Cancel';
  const confirmButtonText = 'Yes';
  if (editingPage?.isPageGroup)
    return (
      <Modal
        show={show}
        onHide={handleClose}
        size="md"
        animation={false}
        centered
        className={`${darkMode && 'dark-theme'} delete-folder-modal `}
        backdrop="static"
        onClick={(event) => event.stopPropagation()}
      >
        <Modal.Header>
          <Modal.Title data-cy={'delete-folder-modal'}>Delete folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this folder? This action is irreversible.</Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => {
              deletePageGroup(editingPage?.id, true);
            }}
            className="delete-all-button"
          >
            <Trash width="14" fill="#69727C" />
            <span>Delete folder and pages</span>
          </button>
          <button
            onClick={handleClose}
            style={{
              marginLeft: 'auto',
            }}
            className="delete-all-button"
          >
            <span>Cancel</span>
          </button>
          <button
            onClick={() => {
              deletePageGroup(editingPage?.id);
            }}
            className="delete-all-button danger"
          >
            <Trash width="15" fill="#fff" />
            <span>Delete</span>
          </button>
        </Modal.Footer>
      </Modal>
    );

  return (
    <Modal
      show={show}
      animation={false}
      onHide={handleClose}
      size="sm"
      centered={true}
      contentClassName={darkMode ? 'dark-theme' : ''}
    >
      <Modal.Header>
        <Modal.Title>{'Delete Page'}</Modal.Title>
        <span onClick={handleClose}>
          <SolidIcon width="16" fill={'var(--slate12)'} name="remove" className="cursor-pointer" />
        </span>
      </Modal.Header>

      <Modal.Body data-cy={'modal-message'}>{message}</Modal.Body>
      <Modal.Footer className="mt-3">
        <button className="btn" onClick={handleClose} data-cy={'modal-cancel-button'}>
          {cancelButtonText === '' ? t('globals.cancel', 'Cancel') : cancelButtonText}
        </button>
        <button className="btn btn-danger" onClick={handleConfirm} data-cy={'modal-confirm-button'}>
          {confirmButtonText === '' ? t('globals.yes', 'Yes') : confirmButtonText}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
