import React from 'react';
import Modal from 'react-bootstrap/Modal';
import EntityDeleteDialog from '@/AppBuilder/Shared/EntityDelete/EntityDeleteDialog';
import useStore from '@/AppBuilder/_stores/store';
import Trash from '@/_ui/Icon/solidIcons/Trash';

export function DeletePageConfirmationModal({ darkMode }) {
  const page = useStore((state) => state.pageToDelete);
  const show = useStore((state) => state.showDeleteConfirmationModal);
  const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);

  const deletePageGroup = useStore((state) => state.deletePageGroup);
  const deletePage = useStore((state) => state.deletePage);

  const handleClose = () => {
    toggleDeleteConfirmationModal(false);
  };

  const handleConfirm = () => {
    deletePage(page.id);
  };
  if (!page) return null;
  if (page.isPageGroup)
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
        backdropClassName={'delete-folder-backdrop'}
      >
        <Modal.Header>
          <Modal.Title data-cy={'delete-folder-modal'}>Delete folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this folder? This action is irreversible.</Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => {
              deletePageGroup(page.id, true);
            }}
            className="delete-all-button"
          >
            <Trash width="14" fill="#69727C" />
            <span>Delete group and pages</span>
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
              deletePageGroup(page.id);
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
    <EntityDeleteDialog
      show={show}
      entityLabel="page"
      subjects={[{ name: page.name }]}
      subtitle="The page and everything on it are deleted."
      darkMode={darkMode}
      onCancel={handleClose}
      onConfirm={handleConfirm}
      cancelDataCy="modal-cancel-button"
      confirmDataCy="modal-confirm-button"
    />
  );
}
