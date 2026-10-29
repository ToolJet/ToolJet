import React from 'react';
import ModalBase from '@/_ui/Modal';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './resources/styles/trouble-signing-in-modal.styles.scss';

const TroubleSigningInModal = ({ show, onClose, title, children, darkMode }) => {
  return (
    <ModalBase show={show} handleClose={onClose} darkMode={darkMode} showHeader={false} showFooter={false} size="sm">
      <div className="trouble-signing-in-modal">
        <button
          type="button"
          className="trouble-signing-in-modal-close"
          onClick={onClose}
          data-cy="trouble-signing-in-modal-close"
          aria-label="Close"
        >
          <SolidIcon name="remove" width="16" />
        </button>
        <div className="trouble-signing-in-modal-icon">
          <SolidIcon name="lock" width="20" fill="#4368E3" />
        </div>
        <h3 className="trouble-signing-in-modal-title" data-cy="trouble-signing-in-modal-title">
          {title}
        </h3>
        <div className="trouble-signing-in-modal-body" data-cy="trouble-signing-in-modal-body">
          {children}
        </div>
      </div>
    </ModalBase>
  );
};

export default TroubleSigningInModal;
