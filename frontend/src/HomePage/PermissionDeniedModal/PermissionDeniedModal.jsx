import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { organizationService } from '@/_services';
import posthog from 'posthog-js';
import { toast } from 'react-hot-toast';
import { appendWorkspaceId } from '@/_helpers/routes';
import { handleHttpErrorMessages } from '@/_helpers/utils';

export const PermissionDeniedModal = ({ onHide, ...props }) => {
  const [isCreating, setIsCreating] = useState(false);
  const createWorkspace = () => {
    const timestamp = new Date().getTime();
    const workspaceName = `My Workspace${timestamp}`;
    const workspaceSlug = workspaceName.toLowerCase().replace(/\s+/g, '');
    organizationService.createOrganization({ name: workspaceName, slug: workspaceSlug }).then(
      (data) => {
        posthog.capture('create_workspace', {
          workspace_id: data.organization_id || data.current_organization_id,
        });
        toast.success('Workspace created successfully');
        setIsCreating(false);
        const newPath = appendWorkspaceId(workspaceSlug, location.pathname, true);
        window.history.replaceState(null, null, newPath);
        window.location.reload();
      },
      (error) => {
        setIsCreating(false);
        // added specific check here to inform user about why is the error thrown
        if (error?.error && error.error.includes('reached your limit for number of builders')) {
          toast.error(
            `Creating a workspace makes you a builder which exceeds your limit. Contact super admin to know more`,
            {
              style: {
                width: 'auto',
                maxWidth: '385px',
              },
            }
          );
        } else {
          handleHttpErrorMessages(error, 'workspace');
        }
      }
    );
  };
  return (
    <div className="custom-backdrop">
      <Modal
        {...props}
        className={`organization-switch-modal static-error-modal ${props.darkMode?.darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton onHide={onHide} style={{ padding: '15px' }}>
          <span className="header-text" data-cy="modal-header" style={{ marginTop: '10px', lineHeight: '24px' }}>
            Permission Denied
          </span>
          <p
            className="description"
            data-cy="modal-description"
            style={{ marginTop: '0px', marginLeft: '20px', marginRight: '20px' }}
          >
            You dont have permission to create apps in this workspace. Would you like to create the app in a new
            workspace?
          </p>
        </Modal.Header>
        <Modal.Footer>
          <ButtonSolid variant="secondary" onClick={onHide}>
            Cancel
          </ButtonSolid>
          <ButtonSolid onClick={createWorkspace}>Create app in a new workspace</ButtonSolid>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
