import React from 'react';
import { ButtonSolid } from '../../AppButton/AppButton';

function DrawerFooter({ fetching, onClose, isEditMode, onCreate, onEdit }) {
  return (
    <div className="position-sticky bottom-0 right-0 w-100  mt-auto">
      <div className="d-flex justify-content-end drawer-footer-btn-wrap">
        <ButtonSolid variant="tertiary" data-cy={`cancel-button`} onClick={onClose}>
          Cancel
        </ButtonSolid>
        {isEditMode && (
          <ButtonSolid
            disabled={fetching}
            data-cy={`save-changes-button`}
            onClick={onEdit}
            fill="#fff"
            leftIcon="floppydisk"
          >
            Save changes
          </ButtonSolid>
        )}
        {!isEditMode && (
          <ButtonSolid
            disabled={fetching}
            data-cy={`create-button`}
            onClick={() => {
              onCreate();
            }}
          >
            Create
          </ButtonSolid>
        )}
      </div>
    </div>
  );
}

export default DrawerFooter;
