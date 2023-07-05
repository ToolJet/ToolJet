import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const EmptyState = ({ canCreateVariable, setIsManageVarDrawerOpen }) => {
  return (
    <div className="w-100 workspace-constant-card-body">
      <div className="align-items-center p-3 justify-content-between">
        <div className="empty-state-org-constants">
          <center className={`empty-result`}>
            <img src="assets/images/icons/org-constants.svg" width="64" height="64" />
            <div className="w-75 mt-2">
              <h3>No workspace constants yet</h3>
              <p className="text-muted mt-2">
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
