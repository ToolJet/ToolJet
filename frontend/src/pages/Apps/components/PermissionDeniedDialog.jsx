import React from 'react';
import { toast } from 'react-hot-toast';
import { CircleAlert } from 'lucide-react';

import { appendWorkspaceId } from '@/_helpers/routes';
import { handleHttpErrorMessages } from '@/_helpers/utils';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import { useCreateOrganization } from '../../shared/hooks/organizationServiceHooks';
import ActionDialog from '../../shared/ActionDialog';

export default function PermissionDeniedDialog({ open, onClose }) {
  const { mutate: createNewOrganization, isPending: isCreatingOrganization } = useCreateOrganization();

  const handleCreateAppInNewWorkspace = () => {
    const timestamp = new Date().getTime();
    const workspaceName = `My Workspace${timestamp}`;
    const workspaceSlug = workspaceName.toLowerCase().replace(/\s+/g, '');

    createNewOrganization(
      { name: workspaceName, slug: workspaceSlug },
      {
        onError: (error) => {
          if (error?.error && error.error.includes('reached your limit for number of builders')) {
            toast.error(
              'Creating a workspace makes you a builder which exceeds your limit. Contact super admin to know more',
              { style: { width: 'auto', maxWidth: '385px' } }
            );
          } else {
            handleHttpErrorMessages(error, 'workspace');
          }
        },
        onSuccess: (response) => {
          posthogHelper.captureEvent('create_workspace', {
            workspace_id: response.organization_id || response.current_organization_id,
          });

          toast.success('Workspace created successfully');

          const newPath = appendWorkspaceId(workspaceSlug, location.pathname, true);
          window.history.replaceState(null, null, newPath);
          window.location.reload();
        },
      }
    );
  };

  const isFormBeingSubmitted = isCreatingOrganization;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = isFormBeingSubmitted;

  return (
    <ActionDialog
      open={open}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isCancelBtnDisabled, onClick: onClose }}
      submitActions={[
        {
          label: 'Create app in a new workspace',
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          'data-cy': 'sumbit-button',
          onClick: handleCreateAppInNewWorkspace,
        },
      ]}
    >
      <div>
        <CircleAlert size={40} color="var(--icon-brand)" />

        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h6 data-cy="modal-header" className="tw-font-title-x-large tw-text-text-default">
            No permission in this workspace
          </h6>

          <p data-cy="modal-description" className="tw-font-body-default tw-text-text-default">
            You don&apos;t have permission to create apps in this workspace. Switch to a different workspace to get
            started.
          </p>
        </div>
      </div>
    </ActionDialog>
  );
}
