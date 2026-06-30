import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/draft-version-warning-modal.scss';

export function DraftVersionWarningModal({ onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('draft-warning-modal-overlay')) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="draft-warning-modal-overlay" onClick={handleOverlayClick}>
      <div className="draft-warning-modal">
        <div className="draft-warning-modal-header">
          <div className="warning-icon-container">
            <SolidIcon name="warningtriangle" width="24" />
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <SolidIcon name="remove" width="16" />
          </button>
        </div>

        <div className="draft-warning-modal-body">
          <h3 className="warning-title">Draft Version Exists</h3>
          <p className="warning-message">
            You cannot create a new branch while a draft version exists. Please commit or discard the current draft
            version before creating a new branch.
          </p>

          <div className="warning-info-box">
            <SolidIcon name="information" width="16" />
            <div className="info-text">
              <strong>What&apos;s a draft version?</strong>
              <p>
                A draft version contains uncommitted changes. Only one draft version can exist at a time to prevent
                conflicts.
              </p>
            </div>
          </div>
        </div>

        <div className="draft-warning-modal-footer">
          <ButtonSolid variant="primary" onClick={onClose} className="close-action-button">
            Close
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
}
