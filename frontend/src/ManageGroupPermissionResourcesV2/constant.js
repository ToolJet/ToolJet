import React from 'react';

export const EDIT_ROLE_MESSAGE = {
  admin: {
    builder: () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing your user group from admin to builder will revoke your access to settings.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
    'end-user': () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing your user group from admin to end-user will revoke your access to settings. This will also affect
            the count of users covered by your plan.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
  },
  builder: {
    'end-user': () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            Changing user default group from builder to end-user will affect the count of users covered by your plan.
          </p>
          <p className="tj-text-sm">
            This will also remove the user from any custom groups with builder-like permissions.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
  },
  'end-user': {
    builder: () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            CChanging user default group from end-user to builder will affect the count of users covered by your plan.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
    admin: () => {
      return (
        <div>
          <p className="tj-text-sm" style={{ marginBottom: '10px' }}>
            CChanging user default group from end-user to admin will affect the count of users covered by your plan.
          </p>
          <p className="tj-text-sm">Are you sure you want to continue?</p>
        </div>
      );
    },
  },
};
