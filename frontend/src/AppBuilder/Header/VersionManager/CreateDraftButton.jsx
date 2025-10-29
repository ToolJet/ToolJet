import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import './style.scss';

const CreateDraftButton = ({ onClick, disabled = false }) => {
  return (
    <div className="create-draft-button" style={{ padding: '8px' }}>
      <ToolTip
        message={'Draft version can only be created from saved versions.'}
        tooltipClassName="create-draft-button-tooltip"
        placement="left"
        show={disabled}
      >
        <div className="">
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
        </div>
      </ToolTip>
    </div>
  );
};

export default CreateDraftButton;
