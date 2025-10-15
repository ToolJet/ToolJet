import React from 'react';
import { Button } from '@/components/ui/button';
import { generateCypressDataCy } from '../../../modules/common/helpers/cypressHelpers.js';

const EncryptedField = ({ propertyKey, isEditing, handleEncryptedFieldsToggle, isDisabled, children }) => {
  return (
    <div>
      <div className="d-flex justify-content-between w-100">
        <div className="mx-1 col">
          <Button
            type="a"
            variant="tertiary"
            target="_blank"
            rel="noreferrer"
            disabled={isDisabled}
            onClick={(e) => handleEncryptedFieldsToggle(e, propertyKey)}
            data-cy={`button-${generateCypressDataCy(isEditing ? 'Cancel' : 'Edit')}`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
        <div className="col-auto mb-2">
          <small className="text-green" data-cy="encrypted-text">
            <img
              className="mx-2 encrypted-icon"
              src="assets/images/icons/padlock.svg"
              width="12"
              height="12"
              alt="Encrypted"
            />
            Encrypted
          </small>
        </div>
      </div>
      {children}
    </div>
  );
};

export default EncryptedField;
