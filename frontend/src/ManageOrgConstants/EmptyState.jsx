import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const EmptyState = ({ canCreateVariable, setIsManageVarDrawerOpen, isLoading }) => {
  if (isLoading) return null;

  return (
    <div className="w-100 workspace-constant-card-body">
      <div className="align-items-center p-3 justify-content-between">
        <div className="empty-state-org-constants">
          <center className={`empty-result`}>
            <img src="assets/images/icons/org-constants.svg" width="64" height="64" data-cy="empty-state-image" />
            <div className="w-50 mt-2">
              <h3 data-cy="empty-state-header">No Workspace constants yet</h3>
              <p className="text-muted mt-2" data-cy="empty-state-text">
                Use workspace constants seamlessly in both the app builder and global data source connections across
                ToolJet.
              </p>
              {canCreateVariable && (
                <ButtonSolid
                  data-cy="add-new-constant-button"
                  vaiant="primary"
                  onClick={() => setIsManageVarDrawerOpen(true)}
                  className="add-new-constant-button"
                  customStyles={{ minWidth: '200px', height: '32px' }}
                >
                  Create new constant
                </ButtonSolid>
              )}
            </div>
          </center>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
