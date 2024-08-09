import React from 'react';

const endUserToAdminMessage =
  "Updating the user's details will change their role from end-user to admin. Are you sure you want to continue?";
const endUserToBuilderMessage =
  "Updating the user's details will change their role from end-user to builder. Are you sure you want to continue?";

export const EDIT_ROLE_MESSAGE = {
  admin: {
    builder: () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing your user default group from admin to builder will revoke your access to settings.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
    'end-user': (isPaidPlan) => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing your user group from admin to end-user will revoke your access to settings.
            {isPaidPlan && 'This will also affect the count of users covered by your plan.'}
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
  },
  builder: {
    'end-user': (isPaidPlan) => {
      return (
        <div>
          {isPaidPlan && (
            <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
              Changing user default group from builder to end-user will affect the count of users covered by your plan.
            </p>
          )}
          <p className="tj-text-sm">
            This will also remove the user from any custom groups with builder-like permissions.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
    admin: () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing user role from builder to admin will grant access to all resources and settings.
          </p>

          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
  },
  'end-user': {
    builder: (isPaidPlan) => {
      return (
        <div>
          {isPaidPlan && (
            <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
              Changing user default group from end-user to builder will affect the count of users covered by your plan.
            </p>
          )}
          <p className="tj-text-sm">{endUserToBuilderMessage}</p>
        </div>
      );
    },
    admin: (isPaidPlan) => {
      return (
        <div>
          {isPaidPlan && (
            <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
              Changing user default group from end-user to admin will affect the count of users covered by your plan.
            </p>
          )}
          <p className="tj-text-sm">{endUserToAdminMessage}</p>
        </div>
      );
    },
  },
};
