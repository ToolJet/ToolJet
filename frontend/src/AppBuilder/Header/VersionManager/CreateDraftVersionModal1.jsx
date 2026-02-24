import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Select from '@/_ui/Select';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
// need to review this component ->  discuss with Vijaykant

const CreateDraftVersionModal1 = ({ show, onClose, appId, versions, environments = [] }) => {
  const { t } = useTranslation();
  const { createDraftVersionAction } = useStore(
    (state) => ({
      createDraftVersionAction: state.createDraftVersionAction,
    }),
    shallow
  );

  const [draftDescription, setDraftDescription] = useState('');
  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter out draft versions for "Create from" dropdown
  const finalizedVersions = versions.filter((v) => v.status !== 'DRAFT');

  // Set default environment to development (priority = 1)
  useEffect(() => {
    if (environments.length > 0 && !selectedEnvironment) {
      const developmentEnv = environments.find((env) => env.priority === 1);
      if (developmentEnv) {
        setSelectedEnvironment(developmentEnv.id);
      }
    }
  }, [environments, selectedEnvironment]);

  // Set default version to latest finalized version
  useEffect(() => {
    if (finalizedVersions.length > 0 && !selectedVersionForCreation) {
      const latestVersion = finalizedVersions[finalizedVersions.length - 1];
      setSelectedVersionForCreation(latestVersion);
    }
  }, [finalizedVersions, selectedVersionForCreation]);

  const versionOptions = finalizedVersions.map((version) => ({
    label: version.name,
    value: version,
  }));

  const environmentOptions = environments.map((env) => ({
    label: env.name,
    value: env.id,
  }));

  const handleCreateDraft = async () => {
    // Validation
    if (!draftDescription.trim()) {
      toast.error('Draft description should not be empty');
      return;
    }

    if (draftDescription.trim().length > 500) {
      toast.error('Draft description should not be longer than 500 characters');
      return;
    }

    if (!selectedVersionForCreation) {
      toast.error('Please select a version to create draft from');
      return;
    }

    if (!selectedEnvironment) {
      toast.error('Please select an environment');
      return;
    }

    setIsCreating(true);

    try {
      await createDraftVersionAction(appId, {
        versionFromId: selectedVersionForCreation.id,
        environmentId: selectedEnvironment,
        versionDescription: draftDescription,
      });

      toast.success('Draft version created successfully');
      setDraftDescription('');
      onClose();
    } catch (error) {
      if (error?.data?.message?.includes('draft version already exists')) {
        toast.error('A draft version already exists for this app');
      } else {
        toast.error(error?.data?.message || 'Failed to create draft version');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setDraftDescription('');
      setSelectedVersionForCreation(null);
      onClose();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      className="create-draft-modal"
      backdrop={isCreating ? 'static' : true}
      keyboard={!isCreating}
    >
      <Modal.Header closeButton={!isCreating}>
        <Modal.Title className="tj-text-sm" style={{ fontWeight: 600 }}>
          Create Draft Version
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateDraft();
          }}
        >
          {/* Create from Version */}
          <div className="mb-3">
            <label className="form-label tj-text-xsm" data-cy="create-draft-from-label">
              Create draft from
            </label>
            <Select
              options={versionOptions}
              value={selectedVersionForCreation}
              onChange={(version) => setSelectedVersionForCreation(version)}
              useMenuPortal={false}
              width="100%"
              maxMenuHeight={150}
              placeholder="Select version..."
              isDisabled={isCreating}
            />
            <div className="helper-text">Select which version to use as a starting point for the draft</div>
          </div>

          {/* Environment Selection */}
          <div className="mb-3">
            <label className="form-label tj-text-xsm" data-cy="draft-environment-label">
              Environment
            </label>
            <Select
              options={environmentOptions}
              value={environmentOptions.find((opt) => opt.value === selectedEnvironment)}
              onChange={(option) => setSelectedEnvironment(option?.value)}
              useMenuPortal={false}
              width="100%"
              placeholder="Select environment..."
              isDisabled={isCreating}
            />
            <div className="helper-text">Select the environment for this draft version</div>
          </div>

          {/* Draft Description */}
          <div className="mb-3">
            <label className="form-label tj-text-xsm" data-cy="draft-description-label">
              Description
            </label>
            <textarea
              className="form-control tj-text-xsm"
              data-cy="draft-description-input-field"
              placeholder="Enter draft description..."
              disabled={isCreating}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={4}
              minLength="1"
              maxLength="500"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
            <div className="helper-text">Add a description for this draft (max 500 characters)</div>
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
              The draft version will be created and you can make changes before promoting it to a finalized version.
            </span>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isCreating}
          className="tj-text-xsm"
          data-cy="cancel-button"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateDraft}
          disabled={isCreating || !draftDescription.trim()}
          className="tj-text-xsm"
          data-cy="create-draft-button"
        >
          {isCreating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Creating...
            </>
          ) : (
            'Create Draft'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateDraftVersionModal1;
