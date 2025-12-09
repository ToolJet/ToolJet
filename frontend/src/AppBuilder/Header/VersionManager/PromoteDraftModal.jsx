import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const PromoteDraftModal = ({ show, onClose, draftVersion, appId }) => {
  const { refreshVersions } = useVersionManagerStore();

  const { promoteVersionAction, currentEnvironment } = useStore(
    (state) => ({
      promoteVersionAction: state.promoteVersionAction,
      currentEnvironment: state.selectedEnvironment,
    }),
    shallow
  );

  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState(draftVersion?.description || '');
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    // Validation
    if (!versionName.trim()) {
      toast.error('Version name is required');
      return;
    }

    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }

    if (versionDescription.trim().length > 500) {
      toast.error('Version description should not be longer than 500 characters');
      return;
    }

    setIsPromoting(true);

    // Use global action from environmentsAndVersionsSlice
    promoteVersionAction(
      appId,
      draftVersion.id,
      versionName.trim(),
      versionDescription.trim(),
      () => {
        toast.success('Draft promoted to version successfully');
        setVersionName('');
        setVersionDescription('');
        // Refresh versions in dropdown
        refreshVersions(appId, currentEnvironment?.id);

        onClose();
        // Reload page to reflect changes
        window.location.reload();
      },
      (error) => {
        setIsPromoting(false);
        toast.error(error?.data?.message || error?.message || 'Failed to promote draft version');
      }
    );
  };

  const handleClose = () => {
    if (!isPromoting) {
      setVersionName('');
      setVersionDescription('');
      onClose();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      className="promote-draft-modal"
      backdrop={isPromoting ? 'static' : true}
      keyboard={!isPromoting}
    >
      <Modal.Header closeButton={!isPromoting}>
        <Modal.Title className="tj-text-sm" style={{ fontWeight: 600 }}>
          Promote Draft to Version
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePromote();
          }}
        >
          {/* Version Name */}
          <div className="mb-3">
            <label className="form-label tj-text-xsm" data-cy="version-name-label">
              Version Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control tj-text-xsm"
              data-cy="version-name-input-field"
              placeholder="e.g., v2.0.0"
              disabled={isPromoting}
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              autoFocus
              minLength="1"
              maxLength="25"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
              }}
            />
            <div className="helper-text">Must be unique and max 25 characters</div>
          </div>

          {/* Version Description */}
          <div className="mb-3">
            <label htmlFor="versionDescription" className="form-label tj-text-sm" style={{ fontWeight: 500 }}>
              Version description
            </label>
            <textarea
              className="form-control tj-text-xsm"
              data-cy="version-description-input-field"
              placeholder="Enter version description (optional)"
              disabled={isPromoting}
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              rows={3}
              maxLength="500"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                resize: 'vertical',
                minHeight: '60px',
              }}
            />
            <div className="helper-text">Optional, max 500 characters</div>
          </div>

          {/* Info Alert */}
          <div
            className="alert alert-info d-flex align-items-center"
            style={{
              fontSize: '13px',
              padding: '12px',
              backgroundColor: 'var(--indigo1)',
              border: '1px solid var(--indigo3)',
              borderRadius: '6px',
              marginBottom: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px', flexShrink: 0 }}>
              <path
                d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM8.75 11.5C8.75 11.9125 8.4125 12.25 8 12.25C7.5875 12.25 7.25 11.9125 7.25 11.5V7.75C7.25 7.3375 7.5875 7 8 7C8.4125 7 8.75 7.3375 8.75 7.75V11.5ZM8 6C7.45 6 7 5.55 7 5C7 4.45 7.45 4 8 4C8.55 4 9 4.45 9 5C9 5.55 8.55 6 8 6Z"
                fill="var(--indigo6)"
              />
            </svg>
            <span>
              This will convert the draft into a finalized version. The version name and description cannot be changed
              after promotion to staging or production.
            </span>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isPromoting}
          className="tj-text-xsm"
          data-cy="cancel-button"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handlePromote}
          disabled={isPromoting || !versionName.trim()}
          className="tj-text-xsm"
          data-cy="promote-button"
        >
          {isPromoting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Promoting...
            </>
          ) : (
            'Promote to Version'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PromoteDraftModal;
