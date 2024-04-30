import React from 'react';
import { ButtonSolid } from '../../AppButton/AppButton';
import Student from '../../../TooljetDatabase/Icons/Student.svg';
import './styles.scss';

function DrawerFooter({ fetching, onClose, isEditMode, onCreate, onEdit, shouldDisableCreateBtn }) {
  return (
    <div className="position-sticky bottom-0 right-0 w-100  mt-auto">
      <div className="d-flex justify-content-between drawer-footer-btn-wrap">
        <div className="d-flex align-items-center">
          <Student />
          <a className="read-documentation">Read documentation</a>
        </div>
        <div className="d-flex action-btns">
          <ButtonSolid variant="tertiary" data-cy={`cancel-button`} onClick={onClose}>
            Cancel
          </ButtonSolid>
          {isEditMode && (
            <ButtonSolid
              disabled={shouldDisableCreateBtn || fetching}
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
              disabled={fetching || shouldDisableCreateBtn}
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
    </div>
  );
}

export default DrawerFooter;
