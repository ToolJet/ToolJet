import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';

const AddGlobalDataSourceButton = () => {
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId();
  const { admin, group_permissions, super_admin } = authenticationService.currentSessionValue;

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateDataSource = () => {
    return canAnyGroupPerformAction('data_source_create', group_permissions) || super_admin || admin;
  };

  const handleAddClick = () =>
    canCreateDataSource()
      ? navigate(`/${workspaceId}/global-datasources`)
      : toast.error("You don't have access to GDS, contact your workspace admin to add datasources");
  return (
    canCreateDataSource() && (
      <button
        className={`col-auto d-flex align-items-center py-1 my-3 rounded add-gds-secondary-button`}
        onClick={handleAddClick}
      >
        <span className={`d-flex align-items-center`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.99999 1.33325H12C13.4728 1.33325 14.6667 2.52716 14.6667 3.99992V11.9999C14.6667 13.4727 13.4728 14.6666 12 14.6666H4C2.52724 14.6666 1.33333 13.4727 1.33333 11.9999V3.99992C1.33333 2.52716 2.52724 1.33325 3.99999 1.33325ZM8 4.83325C8.27614 4.83325 8.5 5.05711 8.5 5.33325V7.49992H10.6667C10.9428 7.49992 11.1667 7.72378 11.1667 7.99992C11.1667 8.27606 10.9428 8.49992 10.6667 8.49992H8.5V10.6666C8.5 10.9427 8.27614 11.1666 8 11.1666C7.72385 11.1666 7.5 10.9427 7.5 10.6666V8.49992H5.33333C5.05719 8.49992 4.83333 8.27606 4.83333 7.99992C4.83333 7.72378 5.05719 7.49992 5.33333 7.49992H7.5V5.33325C7.5 5.05711 7.72385 4.83325 8 4.83325Z"
              fill="#3E63DD"
            />
          </svg>
        </span>
        <span className="query-manager-btn-name">Add new global datasource</span>
      </button>
    )
  );
};

export default AddGlobalDataSourceButton;
