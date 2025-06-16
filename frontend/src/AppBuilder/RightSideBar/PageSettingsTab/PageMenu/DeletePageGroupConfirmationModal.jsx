import Trash from '@/_ui/Icon/solidIcons/Trash';
import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';

export const DeletePageGroupConfirmationModal = ({ onConfirm, onCancel, darkMode, title, message }) => {
  return (
    <Modal
      onHide={onCancel}
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
            onConfirm(true);
          }}
          className="delete-all-button"
        >
          <Trash width="14" fill="#69727C" />
          <span>Delete folder and pages</span>
        </button>
        <button
          onClick={onCancel}
          style={{
            marginLeft: 'auto',
          }}
          className="delete-all-button"
        >
          <span>Cancel</span>
        </button>
        <button
          onClick={() => {
            onConfirm();
          }}
          className="delete-all-button danger"
        >
          <Trash width="15" fill="#fff" />
          <span>Delete</span>
        </button>
      </Modal.Footer>
    </Modal>
  );
};
