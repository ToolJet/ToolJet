import React from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button/Button';
import { getPrivateRoute } from '@/_helpers/routes';
import { validateName } from '@/_helpers/utils';
import { appendBranchName } from '@/_helpers/active-branch';
import { authenticationService } from '@/_services/authentication.service';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import type { AppItem } from '../dummyData/types';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

interface EditButtonProps {
  appDetails: AppItem;
  className?: string;
}

export default function EditButton({ appDetails, className }: EditButtonProps) {
  const { slug, id, folder } = appDetails;
  const navigate = useNavigate();

  const wsCurrentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);
  const wsActions = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.actions);

  // The backend sends edit: false when the user cannot edit this app, so there is nothing to show.
  if (!appDetails.actions?.edit) return null;

  const isValidSlug = (slug: string) => {
    const validate = validateName(slug, 'slug', true, false, false, false);
    return validate.status;
  };

  const handleEditItem = () => {
    // When workspace branching is active, verify current branch still exists on remote
    if (wsCurrentBranch) {
      // e.preventDefault();
      try {
        const existsOnRemote = wsActions.checkBranchExistsOnRemote(wsCurrentBranch.name);
        if (!existsOnRemote) {
          toast.error(
            'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
          );
          return;
        }
      } catch (_err) {
        // check failed (network error, etc.) — allow navigation
      }
      // Carry the dashboard's active branch into the editor so reload keeps the same branch.
      navigate(
        appendBranchName(getPrivateRoute('editor', { slug: isValidSlug(slug) ? slug : id }), wsCurrentBranch?.name)
      );
    } else {
      navigate(
        getPrivateRoute('editor', {
          slug: isValidSlug(slug) ? slug : id,
        })
      );
    }

    posthogHelper.captureEvent('click_edit_button_on_card', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
      app_id: id,
      folder_id: folder?.id,
    });
  };

  return (
    <Button
      isLucid
      variant="secondary"
      size="medium"
      leadingIcon="square-pen"
      className={className}
      aria-label={`Edit ${appDetails.name}`}
      onClick={handleEditItem}
    >
      Edit
    </Button>
  );
}
