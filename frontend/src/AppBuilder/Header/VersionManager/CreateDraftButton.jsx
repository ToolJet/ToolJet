import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const CreateDraftButton = ({ onClick, disabled = false }) => {
  return (
    <div className="create-draft-button" style={{ padding: '8px' }}>
      <button
        className="btn btn-sm w-100 d-flex align-items-center justify-content-center tj-text-sm"
        style={{
          padding: '7px 12px',
          gap: '6px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: 'white',
          color: disabled ? 'var(--text-disabled)' : 'var(--text-default)',
          fontWeight: 500,
          boxShadow: '0px 0px 1px rgba(48, 50, 51, 0.05), 0px 1px 1px rgba(48, 50, 51, 0.1)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={onClick}
        disabled={disabled}
        title={disabled ? 'A draft version already exists for this app' : 'Create a new draft version'}
      >
        <SolidIcon name="plus" alt="add" width="16" height="16" style={{ opacity: disabled ? 0.5 : 1 }} />
        <span>Create draft version</span>
      </button>
      {disabled && (
        <div
          className="tj-text-xxsm text-center"
          style={{
            color: 'var(--text-tertiary)',
            marginTop: '4px',
            padding: '0 8px',
          }}
        >
          Only one draft allowed per app
        </div>
      )}
      {/* need to add a tooltip here -> pending to confirm the copy-writing from product team */}
    </div>
  );
};

export default CreateDraftButton;
